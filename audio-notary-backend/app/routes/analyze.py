from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.services.forensics import analyze_audio_forensics
from app.services.pdf_service import generate_pdf_report
from app.database import reports_collection
from app.auth import get_current_user
from fastapi.responses import Response
from bson import ObjectId
import math

router = APIRouter()

# --- HELPER: Fix NaN/Infinity for JSON ---
def sanitize_json(data):
    """Recursively replace NaN/Infinity with 0 or None for valid JSON"""
    if isinstance(data, dict):
        return {k: sanitize_json(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_json(v) for v in data]
    elif isinstance(data, float):
        if math.isnan(data) or math.isinf(data):
            return 0.0
        return data
    else:
        return data

@router.post("/detect")
async def detect_audio(
    file: UploadFile = File(...), 
    current_user: dict = Depends(get_current_user)
):
    # 1. Perform Analysis
    analysis_result = await analyze_audio_forensics(file, file.filename)
    
    # 2. Add Timestamp & User Info
    from datetime import datetime
    analysis_result["timestamp"] = datetime.utcnow()
    analysis_result["filename"] = file.filename
    analysis_result["user_email"] = current_user["email"]
    
    # 3. Sanitize BEFORE saving to DB (Prevents future corruption)
    analysis_result = sanitize_json(analysis_result)
    
    # 4. Handle Guest vs User
    if current_user["role"] == "guest":
        analysis_result["can_download_pdf"] = False
        analysis_result["_id"] = None 
    else:
        analysis_result["can_download_pdf"] = True
        # SAVE TO DB
        new_record = reports_collection.insert_one(analysis_result.copy())
        analysis_result["_id"] = str(new_record.inserted_id)
            
    return analysis_result

@router.get("/history")
async def get_history(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "guest":
        return []
    
    # Fetch records
    cursor = reports_collection.find({"user_email": current_user["email"]}).sort("timestamp", -1)
    results = []
    
    for doc in cursor:
        doc["_id"] = str(doc["_id"])
        # CRITICAL FIX: Sanitize old corrupt records on the fly
        clean_doc = sanitize_json(doc)
        results.append(clean_doc)

    return results

@router.get("/report/{report_id}/download")
async def download_report(report_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "guest":
        raise HTTPException(status_code=403, detail="Guests cannot download reports")

    try:
        # Get report
        report = reports_collection.find_one({"_id": ObjectId(report_id)})
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
            
        if report["user_email"] != current_user["email"]:
            raise HTTPException(status_code=403, detail="Not authorized")

        # Sanitize before generating PDF (Safe Mode)
        report = sanitize_json(report)

        # Generate PDF
        pdf_buffer = generate_pdf_report(report)
        
        return Response(
            content=pdf_buffer.getvalue(),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=Forensic_Report_{report['filename']}.pdf"}
        )

    except Exception as e:
        print(f"Download Error: {e}")
        raise HTTPException(status_code=500, detail="Could not generate PDF")

@router.delete("/report/{report_id}")
async def delete_report(report_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "guest":
        raise HTTPException(status_code=403, detail="Guests cannot delete records")

    try:
        report = reports_collection.find_one({"_id": ObjectId(report_id)})
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        if report["user_email"] != current_user["email"]:
            raise HTTPException(status_code=403, detail="Not authorized")

        result = reports_collection.delete_one({"_id": ObjectId(report_id)})
        if result.deleted_count == 1:
            return {"message": "Report deleted successfully"}
        else:
             raise HTTPException(status_code=500, detail="Delete failed")
             
    except Exception as e:
        print(e)
        raise HTTPException(status_code=400, detail="Invalid Request")