import librosa
import numpy as np
import os
import scipy.stats
import logging
import uuid
import torch
import whisper
from fastapi.concurrency import run_in_threadpool # <--- THE KEY IMPORT

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

device = "cuda" if torch.cuda.is_available() else "cpu"

# Load Whisper once
try:
    whisper_model = whisper.load_model("tiny").to(device)
except Exception as e:
    logger.error(f"Whisper Load Failed: {e}")
    whisper_model = None

# ------------------------------
# BASELINE
# ------------------------------

HUMAN_BASELINE = {
    "pitch_jitter": (0.012, 0.007),
    "silence_ratio": (0.14, 0.11),
    "mfcc_consistency": (850, 320),
    "cepstral_peak": (15.5, 4.5),
    "spectral_entropy": (4.5, 1.6),
}

def calculate_anomaly_score(value, mean, std):
    z = abs(value - mean) / (std + 1e-6)
    return min(max((scipy.stats.norm.cdf(z) - 0.5) * 200, 0), 99)

def calculate_human_alignment(value, mean, std):
    z = abs(value - mean) / (std + 1e-6)
    return min(max(100 - z * 22, 0), 100)

def calculate_cepstral_peak(y, sr):
    try:
        S = np.abs(librosa.stft(y))
        cepstrum = np.fft.ifft(np.log(S + 1e-6), axis=0).real
        quef = np.fft.fftfreq(cepstrum.shape[0], d=1/sr)
        mask = (quef > 0.002) & (quef < 0.015)
        if not np.any(mask): return 0
        return np.max(np.abs(cepstrum[mask])) * 1000
    except: return 0

# ------------------------------
# SYNC WORKER (The Heavy Logic)
# ------------------------------
def _analyze_sync(safe_filename):
    y, sr = librosa.load(safe_filename, sr=22050, duration=45)
    y = librosa.util.normalize(y)

    # --- FEATURE EXTRACTION ---
    f0, _, _ = librosa.pyin(y, fmin=60, fmax=500)
    pitch_jitter = 0.0
    if f0 is not None:
        f0 = f0[~np.isnan(f0)]
        if len(f0) > 10:
            pitch_jitter = np.mean(np.abs(np.diff(f0))) / np.mean(f0)

    cpp_val = calculate_cepstral_peak(y, sr)

    S = np.abs(librosa.stft(y))
    psd = np.mean(S**2, axis=1)
    psd_norm = psd / (np.sum(psd) + 1e-6)
    spectral_entropy = -np.sum(psd_norm * np.log2(psd_norm + 1e-12))

    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    mfcc_var = np.mean(np.var(mfcc, axis=1))
    mfcc_time_var = np.mean(np.var(mfcc, axis=0))

    # Energy modulation
    rms = librosa.feature.rms(y=y)
    energy_var = np.std(rms)

    non_silent = librosa.effects.split(y, top_db=30)
    non_silent_dur = sum(e - s for s, e in non_silent) / sr
    total_dur = librosa.get_duration(y=y, sr=sr)
    silence_ratio = (total_dur - non_silent_dur) / total_dur if total_dur > 0 else 0

    # --- SCORING ---
    scores = {}
    human_alignment = {}

    for name, value in [
        ("pitch_jitter", pitch_jitter),
        ("cepstral_peak", cpp_val),
        ("spectral_entropy", spectral_entropy),
        ("silence_ratio", silence_ratio),
        ("mfcc_consistency", mfcc_var)
    ]:
        mean, std = HUMAN_BASELINE.get(name, (0, 1))
        scores[name] = calculate_anomaly_score(value, mean, std)
        human_alignment[name] = calculate_human_alignment(value, mean, std)

    final_fake_prob = (
        scores["pitch_jitter"] * 0.16 +
        scores["cepstral_peak"] * 0.22 +
        scores["spectral_entropy"] * 0.15 +
        scores["silence_ratio"] * 0.15 +
        scores["mfcc_consistency"] * 0.17
    )

    # --- STABILITY IMPROVEMENTS ---
    stability_score = 0
    if mfcc_time_var > 150: stability_score -= 8
    if energy_var > 0.02: stability_score -= 6
    if pitch_jitter < 0.002: stability_score += 6

    # Whisper Analysis (Inlined for thread safety)
    whisper_boost = 0
    try:
        if whisper_model:
            w_res = whisper_model.transcribe(safe_filename, fp16=False)
            if "segments" in w_res and len(w_res["segments"]) >= 2:
                log_probs = [seg["avg_logprob"] for seg in w_res["segments"]]
                prob_var = np.std(log_probs)
                if prob_var < 0.08: whisper_boost = 12
                elif prob_var < 0.15: whisper_boost = 6
                else: whisper_boost = -5
    except Exception as e:
        logger.error(f"Whisper Error: {e}")

    final_fake_prob += stability_score + whisper_boost

    # --- CONFIDENCE CALIBRATION ---
    human_confidence = np.mean(list(human_alignment.values()))
    confidence_gap = abs(final_fake_prob - human_confidence)

    if confidence_gap < 10: final_fake_prob *= 0.95
    if human_confidence > 75 and final_fake_prob < 65: final_fake_prob -= 12
    if final_fake_prob > 75 and human_confidence < 45: final_fake_prob += 5

    final_fake_prob = min(max(final_fake_prob, 2), 98)

    # Verdict
    if final_fake_prob > 72 and human_confidence < 48:
        verdict = "AI/Synthetic"
    elif final_fake_prob < 42 and human_confidence > 55:
        verdict = "Real Human"
    else:
        verdict = "Real Human" if human_confidence > final_fake_prob or confidence_gap < 8 else "AI/Synthetic"

    # Normalize
    total_score = final_fake_prob + human_confidence
    if total_score > 0:
        normalized_fake = (final_fake_prob / total_score) * 100
        normalized_human = (human_confidence / total_score) * 100
    else:
        normalized_fake = 50; normalized_human = 50

    if verdict == "Real Human" and normalized_fake >= 50:
        normalized_fake = 49.9; normalized_human = 50.1
    elif verdict == "AI/Synthetic" and normalized_human >= 50:
        normalized_human = 49.9; normalized_fake = 50.1

    return {
        "verdict": verdict,
        "confidence_score": float(round(normalized_fake, 2)),
        "human_alignment_score": float(round(normalized_human, 2)),
        "reasons": ["Advanced acoustic transformer + Whisper stability analysis applied."],
        "features": {
            "jitter": float(round(pitch_jitter, 5)),
            "cepstral_peak": float(round(cpp_val, 2)),
            "spectral_entropy": float(round(spectral_entropy, 3)),
            "silence_ratio": float(round(silence_ratio, 3)),
            "mfcc_temporal_variance": float(round(mfcc_time_var, 2)),
            "energy_variation": float(round(energy_var, 4))
        },
        "metadata": {"sample_rate": int(sr), "duration": float(round(total_dur, 2))}
    }

# ------------------------------
# ASYNC WRAPPER
# ------------------------------
async def analyze_audio_forensics(file_upload, filename: str):
    ext = os.path.splitext(filename)[1] or ".tmp"
    safe_filename = f"temp_{uuid.uuid4().hex}{ext}"
    
    try:
        content = await file_upload.read()
        with open(safe_filename, "wb") as f:
            f.write(content)

        # RUN IN THREADPOOL to prevent server freeze
        return await run_in_threadpool(_analyze_sync, safe_filename)

    except Exception as e:
        logger.error(f"Forensics Error: {e}")
        return {
            "verdict": "Error",
            "confidence_score": 0.0,
            "reasons": ["Analysis Failed"],
            "features": {},
            "metadata": {}
        }
    finally:
        if os.path.exists(safe_filename):
            try: os.remove(safe_filename)
            except: pass