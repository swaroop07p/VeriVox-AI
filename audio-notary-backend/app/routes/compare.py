from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.concurrency import run_in_threadpool
import os
import uuid
import librosa
import numpy as np
from scipy.spatial.distance import cosine
import logging
import tempfile

# Re-use your existing highly accurate AI detection logic!
from app.services.forensics import _analyze_sync

logger = logging.getLogger(__name__)
router = APIRouter()

def get_biometric_signature(file_path):
    """Extracts a hyper-strict mathematical fingerprint using Pitch & MFCC"""
    y, sr = librosa.load(file_path, sr=22050, duration=30)
    
    # Trim silence so we only compare actual spoken words
    y_trimmed, _ = librosa.effects.trim(y, top_db=25)
    if len(y_trimmed) > sr * 1: y = y_trimmed
    
    # 1. Vocal Pitch/Brightness (Spectral Centroid) - Highly unique to individuals
    centroid = np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))
    
    # 2. Throat Shape (MFCCs)
    mfccs = np.mean(librosa.feature.mfcc(y=y, sr=sr, n_mfcc=21)[1:], axis=1)
    
    return centroid, mfccs

def _compare_sync(file1_path, file2_path):
    try:
        # 1. Run AI Detection on both files
        res1 = _analyze_sync(file1_path)
        res2 = _analyze_sync(file2_path)

        # 2. Extract Strict Voice Biometrics
        cent1, mfcc1 = get_biometric_signature(file1_path)
        cent2, mfcc2 = get_biometric_signature(file2_path)

        # 3. Evaluate Pitch Difference (Different people have different vocal frequencies)
        cent_diff = abs(cent1 - cent2)
        pitch_match = max(0.1, 100 - (cent_diff / 5)) 
        
        # 4. Evaluate Throat Shape Match
        mfcc_sim = 1 - cosine(mfcc1, mfcc2)
        mfcc_match = max(0.1, (mfcc_sim - 0.85) * 666) 
        
        # Combine the physical metrics
        match_score = (pitch_match * 0.5) + (mfcc_match * 0.5)
        
        # --- THE LOGIC YOU REQUESTED ---
        # If the AI Confidence scores are vastly different (e.g. one is 90% AI, the other is 10% AI),
        # heavily penalize the match score because they are clearly different profiles.
        conf_diff = abs(res1["confidence_score"] - res2["confidence_score"])
        if conf_diff > 15:
            match_score -= (conf_diff * 1.5)

        # Ensure score stays between 0 and 100
        match_score = min(99.9, max(0.1, match_score))

        # 5. Generate Verdicts
        is_same_speaker = match_score >= 70.0
        is_clone_attack = False

        if is_same_speaker:
            if res1["verdict"] != res2["verdict"]:
                is_clone_attack = True 
                conclusion = "VOICE CLONING ATTACK DETECTED"
            else:
                conclusion = "SAME SPEAKER DETECTED"
        else:
            conclusion = "DIFFERENT SPEAKERS DETECTED"

        return {
            "file1": res1,
            "file2": res2,
            "similarity_score": float(round(match_score, 1)),
            "conclusion": conclusion,
            "is_clone_attack": is_clone_attack
        }
    except Exception as e:
        logger.error(f"Compare Error: {e}")
        raise Exception("Failed to compare audio streams.")

@router.post("/compare")
async def compare_audio(file1: UploadFile = File(...), file2: UploadFile = File(...)):
    temp_dir = tempfile.gettempdir()
    
    ext1 = os.path.splitext(file1.filename)[1] or ".tmp"
    ext2 = os.path.splitext(file2.filename)[1] or ".tmp"
    
    path1 = os.path.join(temp_dir, f"temp_comp1_{uuid.uuid4().hex}{ext1}")
    path2 = os.path.join(temp_dir, f"temp_comp2_{uuid.uuid4().hex}{ext2}")

    try:
        with open(path1, "wb") as f: f.write(await file1.read())
        with open(path2, "wb") as f: f.write(await file2.read())

        result = await run_in_threadpool(_compare_sync, path1, path2)
        
        result["file1"]["filename"] = file1.filename
        result["file2"]["filename"] = file2.filename
        
        return result

    except Exception as e:
        logger.error(f"Comparison Failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Server Error. Please try again.")
    finally:
        if os.path.exists(path1): 
            try: os.remove(path1)
            except: pass
        if os.path.exists(path2): 
            try: os.remove(path2)
            except: pass