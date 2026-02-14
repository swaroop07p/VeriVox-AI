import librosa
import numpy as np
import os
import scipy.stats
import logging
import uuid # <--- NEW IMPORT for safe filenames

# Set up logging to see errors in Render console
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- BIOLOGICAL BASELINE STATISTICS ---
HUMAN_BASELINE = {
    "pitch_jitter": (0.012, 0.007),
    "silence_ratio": (0.14, 0.11),
    "mfcc_consistency": (850, 320),
    "cepstral_peak": (15.5, 4.5),
    "spectral_entropy": (4.5, 1.6),
}

def calculate_anomaly_score(value, baseline_mean, baseline_std):
    try:
        z_score = abs(value - baseline_mean) / (baseline_std + 1e-6)
        probability = (scipy.stats.norm.cdf(z_score) - 0.5) * 200
        return min(max(probability, 0), 99)
    except Exception:
        return 0

def calculate_human_alignment(value, baseline_mean, baseline_std):
    try:
        z_score = abs(value - baseline_mean) / (baseline_std + 1e-6)
        alignment = max(0, 100 - (z_score * 22))
        return min(alignment, 100)
    except Exception:
        return 0

def calculate_cepstral_peak(y, sr):
    try:
        S = np.abs(librosa.stft(y))
        # Log of zero protection
        cepstrum = np.fft.ifft(np.log(S + 1e-6), axis=0).real
        quefrency_axis = np.fft.fftfreq(cepstrum.shape[0], d=1/sr)
        valid_mask = (quefrency_axis > 0.002) & (quefrency_axis < 0.015)
        if not np.any(valid_mask):
             return 0
        peak_val = np.max(np.abs(cepstrum[valid_mask, :]))
        return peak_val * 1000
    except:
        return 0

async def analyze_audio_forensics(file_upload, filename: str):
    # 1. UUID Filenames: Sanitize mobile filenames (e.g. "Recording 1.m4a") to avoid Linux crashes
    ext = os.path.splitext(filename)[1]
    if not ext: ext = ".tmp"
    safe_filename = f"temp_{uuid.uuid4().hex}{ext}"
    
    try:
        content = await file_upload.read()
        with open(safe_filename, "wb") as f:
            f.write(content)

        # 2. PERFORMANCE FIX: Force sr=22050
        # Mobile files are 48kHz. Loading them at native rate crashes the CPU on free tier.
        # 22050Hz is industry standard for speech forensics and runs 3x faster.
        y, sr = librosa.load(safe_filename, sr=22050, duration=45)
        y = librosa.util.normalize(y)

        # --- FEATURE EXTRACTION ---
        # pyin is very heavy; running it at 22050Hz instead of 48000Hz saves the server.
        f0, _, _ = librosa.pyin(y, fmin=60, fmax=500)
        
        pitch_jitter = 0.0
        if f0 is not None:
            f0 = f0[~np.isnan(f0)]
            if len(f0) > 10:
                pitch_jitter = (np.mean(np.abs(np.diff(f0))) / np.mean(f0))

        cpp_val = calculate_cepstral_peak(y, sr)

        S = np.abs(librosa.stft(y))
        psd = np.mean(S**2, axis=1)
        psd_norm = psd / (np.sum(psd) + 1e-6)
        spectral_entropy = -np.sum(psd_norm * np.log2(psd_norm + 1e-12))

        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_var = np.mean(np.var(mfcc, axis=1))
        mfcc_time_var = np.mean(np.var(mfcc, axis=0))

        non_silent_intervals = librosa.effects.split(y, top_db=30)
        non_silent_dur = sum(end - start for start, end in non_silent_intervals) / sr
        total_dur = librosa.get_duration(y=y, sr=sr)
        
        silence_ratio = 0.0
        if total_dur > 0:
            silence_ratio = (total_dur - non_silent_dur) / total_dur

        # --- SCORING ENGINE ---
        scores = {}
        human_alignment = {}

        for feature_name, value in [
            ("pitch_jitter", pitch_jitter),
            ("cepstral_peak", cpp_val),
            ("spectral_entropy", spectral_entropy),
            ("silence_ratio", silence_ratio),
            ("mfcc_consistency", mfcc_var)
        ]:
            baseline_mean, baseline_std = HUMAN_BASELINE[feature_name]
            scores[feature_name] = calculate_anomaly_score(value, baseline_mean, baseline_std)
            human_alignment[feature_name] = calculate_human_alignment(value, baseline_mean, baseline_std)

        final_fake_prob = (
            (scores["pitch_jitter"] * 0.16) +
            (scores["cepstral_peak"] * 0.22) +
            (scores["spectral_entropy"] * 0.15) +
            (scores["silence_ratio"] * 0.15) +
            (scores["mfcc_consistency"] * 0.17)
        )

        # Adjustments
        if pitch_jitter < 0.002: final_fake_prob += 5
        if cpp_val < 4.0: final_fake_prob += 5
        if mfcc_time_var > 150: final_fake_prob -= 12

        human_confidence = np.mean(list(human_alignment.values()))
        if human_confidence > 70 and final_fake_prob < 60:
            final_fake_prob -= 20

        final_fake_prob = min(max(final_fake_prob, 2), 98)

        # Verdict Logic
        if final_fake_prob > 70 and human_confidence < 50:
            verdict = "AI/Synthetic"
        elif final_fake_prob < 45 and human_confidence > 55:
            verdict = "Real Human"
        else:
            verdict = "Real Human" if human_confidence > final_fake_prob else "AI/Synthetic"

        # --- NORMALIZE SCORES (Fixes the % Mismatch) ---
        total_score = final_fake_prob + human_confidence
        if total_score > 0:
            normalized_fake = (final_fake_prob / total_score) * 100
            normalized_human = (human_confidence / total_score) * 100
        else:
            normalized_fake = 50.0
            normalized_human = 50.0

        # Guarantee consistency: The verdict winner MUST have > 50%
        if verdict == "Real Human" and normalized_fake >= 50:
            normalized_fake = 49.9
            normalized_human = 50.1
        elif verdict == "AI/Synthetic" and normalized_human >= 50:
            normalized_human = 49.9
            normalized_fake = 50.1

        return {
            "verdict": verdict,
            "confidence_score": float(round(normalized_fake, 2)), # Always return Fake %
            "human_alignment_score": float(round(normalized_human, 2)),
            "reasons": ["Robotic pitch smoothness." if scores["pitch_jitter"] > 60 else "Natural biological variance."],
            "features": {
                "jitter": float(round(pitch_jitter, 5)),
                "cepstral_peak": float(round(cpp_val, 2)),
                "spectral_entropy": float(round(spectral_entropy, 3)),
                "silence_ratio": float(round(silence_ratio, 3)),
                "mfcc_temporal_variance": float(round(mfcc_time_var, 2))
            },
            "metadata": {"sample_rate": int(sr), "duration": float(round(total_dur, 2))}
        }

    except Exception as e:
        logger.error(f"Forensics Error: {e}")
        return {
            "verdict": "Error",
            "confidence_score": 0.0,
            "reasons": ["Analysis Failed - File format or Timeout"],
            "features": {},
            "metadata": {}
        }
    finally:
        if os.path.exists(safe_filename):
            os.remove(safe_filename)