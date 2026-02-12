import librosa
import numpy as np
import os
import scipy.stats
import logging
import gc # Garbage Collector

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- LIGHTWEIGHT BASELINE STATISTICS ---
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
    except:
        return 0

def calculate_cepstral_peak(y, sr):
    try:
        S = np.abs(librosa.stft(y))
        cepstrum = np.fft.ifft(np.log(S + 1e-6), axis=0).real
        quefrency_axis = np.fft.fftfreq(cepstrum.shape[0], d=1/sr)
        valid_mask = (quefrency_axis > 0.002) & (quefrency_axis < 0.015)
        peak_val = np.max(np.abs(cepstrum[valid_mask, :]))
        return peak_val * 1000
    except:
        return 0

async def analyze_audio_forensics(file_upload, filename: str):
    temp_filename = f"temp_{filename}"
    
    try:
        # 1. Save File
        content = await file_upload.read()
        with open(temp_filename, "wb") as f:
            f.write(content)
        
        # Clear memory of the raw upload
        del content
        gc.collect()

        # 2. LIGHTWEIGHT LOAD (Crucial for Render Free Tier)
        # - limit duration to 15s (saves RAM)
        # - force sample rate to 16000 (standard for voice, low RAM)
        y, sr = librosa.load(temp_filename, sr=16000, duration=15)
        y = librosa.util.normalize(y)

        # --- FEATURE EXTRACTION ---
        
        # Pitch (F0)
        f0, _, _ = librosa.pyin(y, fmin=60, fmax=500, sr=sr)
        pitch_jitter = 0.0
        if f0 is not None:
            f0 = f0[~np.isnan(f0)]
            if len(f0) > 10:
                pitch_jitter = (np.mean(np.abs(np.diff(f0))) / np.mean(f0))

        # Cepstral Peak
        cpp_val = calculate_cepstral_peak(y, sr)

        # Spectral Entropy
        S = np.abs(librosa.stft(y))
        psd = np.mean(S**2, axis=1)
        psd_norm = psd / (np.sum(psd) + 1e-6)
        spectral_entropy = -np.sum(psd_norm * np.log2(psd_norm + 1e-12))

        # MFCC
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_var = np.mean(np.var(mfcc, axis=1))

        # Silence
        non_silent_intervals = librosa.effects.split(y, top_db=30)
        non_silent_dur = sum(end - start for start, end in non_silent_intervals) / sr
        total_dur = librosa.get_duration(y=y, sr=sr)
        silence_ratio = (total_dur - non_silent_dur) / total_dur if total_dur > 0 else 0

        # --- SCORING ---
        scores = {}
        for feature_name, value in [
            ("pitch_jitter", pitch_jitter),
            ("cepstral_peak", cpp_val),
            ("spectral_entropy", spectral_entropy),
            ("silence_ratio", silence_ratio),
            ("mfcc_consistency", mfcc_var)
        ]:
            baseline_mean, baseline_std = HUMAN_BASELINE[feature_name]
            scores[feature_name] = calculate_anomaly_score(value, baseline_mean, baseline_std)

        final_fake_prob = (
            (scores["pitch_jitter"] * 0.20) +
            (scores["cepstral_peak"] * 0.25) +
            (scores["spectral_entropy"] * 0.20) +
            (scores["silence_ratio"] * 0.15) +
            (scores["mfcc_consistency"] * 0.20)
        )

        # Logic Adjustments
        if pitch_jitter < 0.002: final_fake_prob += 10
        if cpp_val < 3.0: final_fake_prob += 10
        
        # Clamp
        final_fake_prob = min(max(final_fake_prob, 2), 98)

        # Verdict
        if final_fake_prob > 60:
            verdict = "AI/Synthetic"
        else:
            verdict = "Real Human"

        reasons = []
        if verdict == "AI/Synthetic":
            if scores["pitch_jitter"] > 50: reasons.append("Unnatural pitch stability.")
            if scores["cepstral_peak"] > 50: reasons.append("Weak vocal tract resonance.")
            if scores["mfcc_consistency"] > 50: reasons.append("Flat vocal texture.")
        else:
            reasons = ["Organic pitch fluctuations detected.", "Natural harmonic structure."]

        # CLEANUP
        del y, S, mfcc, f0
        gc.collect()

        if os.path.exists(temp_filename):
            os.remove(temp_filename)

        return {
            "verdict": verdict,
            "confidence_score": float(round(final_fake_prob, 2)),
            "reasons": reasons,
            "features": {
                "jitter": float(round(pitch_jitter, 5)),
                "cepstral_peak": float(round(cpp_val, 2)),
                "spectral_entropy": float(round(spectral_entropy, 3)),
                "silence_ratio": float(round(silence_ratio, 3))
            },
            "metadata": {"sample_rate": int(sr), "duration": float(round(total_dur, 2))}
        }

    except Exception as e:
        logger.error(f"Forensics Crash: {e}")
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
        return {
            "verdict": "Error",
            "confidence_score": 0.0,
            "reasons": ["File could not be processed (Memory Limit)"],
            "features": {},
            "metadata": {}
        }