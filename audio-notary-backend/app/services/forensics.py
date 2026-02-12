import librosa
import numpy as np
import os
import scipy.stats

# --- BIOLOGICAL BASELINE STATISTICS ---
HUMAN_BASELINE = {
    "pitch_jitter": (0.012, 0.007),      # Slightly relaxed
    "silence_ratio": (0.14, 0.11),
    "mfcc_consistency": (850, 320),
    "cepstral_peak": (15.5, 4.5),
    "spectral_entropy": (4.5, 1.6),
}

def calculate_anomaly_score(value, baseline_mean, baseline_std):
    z_score = abs(value - baseline_mean) / (baseline_std + 1e-6)
    probability = (scipy.stats.norm.cdf(z_score) - 0.5) * 200
    return min(max(probability, 0), 99)

def calculate_human_alignment(value, baseline_mean, baseline_std):
    z_score = abs(value - baseline_mean) / (baseline_std + 1e-6)
    alignment = max(0, 100 - (z_score * 22))  # Less aggressive scaling
    return min(alignment, 100)

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
    content = await file_upload.read()

    with open(temp_filename, "wb") as f:
        f.write(content)

    try:
        y, sr = librosa.load(temp_filename, sr=None, duration=45)
        y = librosa.util.normalize(y)

        # --- FEATURE EXTRACTION ---
        f0, _, _ = librosa.pyin(y, fmin=60, fmax=500)
        f0 = f0[~np.isnan(f0)]
        pitch_jitter = (np.mean(np.abs(np.diff(f0))) / np.mean(f0)) if len(f0) > 10 else 0.0

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

        # Slightly lower weights (less bias)
        final_fake_prob = (
            (scores["pitch_jitter"] * 0.16) +
            (scores["cepstral_peak"] * 0.22) +
            (scores["spectral_entropy"] * 0.15) +
            (scores["silence_ratio"] * 0.15) +
            (scores["mfcc_consistency"] * 0.17)
        )

        # Reduce harsh penalties
        if pitch_jitter < 0.002:
            final_fake_prob += 5

        if cpp_val < 4.0:
            final_fake_prob += 5

        # Human dynamic bonus
        if mfcc_time_var > 150:
            final_fake_prob -= 12

        human_confidence = np.mean(list(human_alignment.values()))

        # STRONG HUMAN OVERRIDE
        if human_confidence > 70 and final_fake_prob < 60:
            final_fake_prob -= 20

        final_fake_prob = min(max(final_fake_prob, 2), 98)

        # --- IMPROVED DECISION LOGIC ---
        if final_fake_prob > 70 and human_confidence < 50:
            verdict = "AI/Synthetic"
        elif final_fake_prob < 45 and human_confidence > 55:
            verdict = "Real Human"
        else:
            # Grey zone resolution
            verdict = "Real Human" if human_confidence > final_fake_prob else "AI/Synthetic"

        # --- REASONS ---
        reasons = []

        if verdict == "AI/Synthetic":
            if scores["pitch_jitter"] > 60:
                reasons.append("Robotic pitch smoothness detected.")
            if scores["cepstral_peak"] > 60:
                reasons.append("Cepstral harmonic structure resembles synthetic generation.")
            if scores["mfcc_consistency"] > 60:
                reasons.append("Static vocal texture pattern.")
        else:
            reasons = [
                "Natural micro pitch instability detected.",
                "Acoustic entropy and harmonic structure align with biological speech."
            ]

        if os.path.exists(temp_filename):
            os.remove(temp_filename)

        return {
            "verdict": verdict,
            "confidence_score": float(round(final_fake_prob, 2)),
            "human_alignment_score": float(round(human_confidence, 2)),
            "reasons": reasons,
            "features": {
                "jitter": float(round(pitch_jitter, 5)),
                "cepstral_peak": float(round(cpp_val, 2)),
                "spectral_entropy": float(round(spectral_entropy, 3)),
                "silence_ratio": float(round(silence_ratio, 3)),
                "mfcc_temporal_variance": float(round(mfcc_time_var, 2))
            },
            "metadata": {
                "sample_rate": int(sr),
                "duration": float(round(total_dur, 2))
            }
        }

    except Exception:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

        return {
            "verdict": "Error",
            "confidence_score": 0.0,
            "reasons": ["Analysis Failed"],
            "features": {},
            "metadata": {}
        }
