from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool
import google.generativeai as genai
import os
from pydantic import BaseModel
from typing import Dict, Any, Optional
import time

router = APIRouter()

GEMINI_KEY = os.getenv("GEMINI_API_KEY") 
if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)

class ChatRequest(BaseModel):
    message: str
    forensic_data: Optional[Dict[str, Any]] = None

def _generate_sync(prompt):
    models_to_try = [
        "models/gemini-2.5-flash", 
        "models/gemini-flash-latest", 
        "models/gemini-2.0-flash", 
        "models/gemini-1.5-flash",
        "models/gemini-pro"
    ]
    
    last_error = None

    for model_name in models_to_try:
        try:
            print(f"🤖 (Thread) Attempting with model: {model_name}")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt) 
            return response.text
            
        except Exception as e:
            error_str = str(e)
            print(f"⚠️ Model {model_name} failed: {error_str}")
            last_error = e
            if "404" in error_str or "not found" in error_str: continue 
            if "429" in error_str or "Quota" in error_str:
                time.sleep(1)
                continue
            continue
    
    raise last_error

@router.post("/chat")
async def chat_with_forensic_expert(request: ChatRequest):
    if not GEMINI_KEY:
        raise HTTPException(status_code=500, detail="Server Error: API Key missing.")

    try:
        context = "You are 'VeriVox AI', a Digital Audio Forensic Expert."
        
        if request.forensic_data:
            fd = request.forensic_data
            features = fd.get('features', {})
            context += f"""
            \nDATA CONTEXT:
            - Verdict: {fd.get('verdict', 'Unknown')}
            - Fake Probability: {fd.get('confidence_score', 0)}%
            - Jitter: {features.get('jitter', 'N/A')}
            - Cepstral: {features.get('cepstral_peak', 'N/A')}
            - Reasons: {', '.join(fd.get('reasons', []))}
            """
        
        # --- THE PROMPT FIX ---
        # 1. Force HTML output for nice formatting
        # 2. Force Brevity (3-7 lines)
        prompt = f"""{context}
        
        USER QUESTION: {request.message}
        
        INSTRUCTIONS:
        1. Answer in **HTML format** (use <b> for bold, <ul><li> for lists, <br> for breaks). 
        2. Do NOT use Markdown (no ** or #).
        3. KEEP IT CONCISE: Maximum 3-7 lines. 
        4. Only provide long detailed explanations if the user explicitly asks for "details" or "elaborate".
        
        EXPERT ANSWER:"""

        reply_text = await run_in_threadpool(_generate_sync, prompt)
        
        return {"reply": reply_text}

    except Exception as e:
        print(f"❌ AI Error: {e}")
        raise HTTPException(status_code=500, detail="AI Busy. Try again.")