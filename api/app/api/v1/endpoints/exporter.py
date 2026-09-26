"""
ATS Benchmark & Export Endpoints
Handles ATS rule auditing, sync exports, and async background queue compilation with presigned download URLs.
"""

import uuid
import time
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Response, BackgroundTasks, status
from pydantic import BaseModel

from app.services.ats_exporter import audit_resume_ats, generate_docx, generate_pdf

router = APIRouter()

# In-memory document storage cache simulating AWS S3 / Cloud Storage bucket
EXPORT_CLOUD_STORAGE: Dict[str, Dict[str, Any]] = {}


class ATSAuditRequest(BaseModel):
    resume_data: Dict[str, Any]
    job_description: Optional[str] = ""


class ExportRequest(BaseModel):
    resume_data: Dict[str, Any]


class AsyncExportRequest(BaseModel):
    resume_data: Dict[str, Any]
    export_format: str = "pdf"  # "pdf" or "docx"


def process_background_export(task_id: str, resume_data: Dict[str, Any], fmt: str):
    """Background worker compilation task."""
    try:
        if fmt.lower() == "docx":
            binary_data = generate_docx(resume_data)
            media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ext = "docx"
        else:
            binary_data = generate_pdf(resume_data)
            media_type = "application/pdf"
            ext = "pdf"

        name_slug = resume_data.get("name", "Resume").replace(" ", "_")
        filename = f"{name_slug}_ATS_Optimized.{ext}"

        EXPORT_CLOUD_STORAGE[task_id] = {
            "status": "COMPLETED",
            "binary_data": binary_data,
            "media_type": media_type,
            "filename": filename,
            "created_at": time.time(),
            "expires_at": time.time() + 900  # 15-minute presigned TTL
        }
    except Exception as e:
        EXPORT_CLOUD_STORAGE[task_id] = {
            "status": "FAILED",
            "error": str(e)
        }


@router.post("/ats-audit")
def endpoint_ats_audit(payload: ATSAuditRequest):
    """Evaluates a resume against ATS standards and optional job description keywords."""
    try:
        results = audit_resume_ats(payload.resume_data, payload.job_description or "")
        return {"status": "success", "data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ATS Audit failed: {str(e)}")


@router.post("/queue-export", status_code=status.HTTP_202_ACCEPTED)
def queue_async_export(payload: AsyncExportRequest, background_tasks: BackgroundTasks):
    """
    Offloads CPU-heavy document compilation to an async background worker.
    Returns task_id and presigned cloud download URL (valid for 15 minutes).
    """
    task_id = f"task-{uuid.uuid4()}"
    
    EXPORT_CLOUD_STORAGE[task_id] = {
        "status": "PROCESSING",
        "created_at": time.time()
    }

    background_tasks.add_task(
        process_background_export,
        task_id=task_id,
        resume_data=payload.resume_data,
        fmt=payload.export_format
    )

    presigned_download_url = f"/api/v1/exporter/download/{task_id}"

    return {
        "status": "QUEUED",
        "task_id": task_id,
        "message": "Document compilation queued in background worker pool.",
        "presigned_download_url": presigned_download_url,
        "expires_in_seconds": 900
    }


@router.get("/download/{task_id}")
def download_presigned_export(task_id: str):
    """
    Serves presigned compiled resume document binaries from cloud storage.
    """
    item = EXPORT_CLOUD_STORAGE.get(task_id)
    if not item:
        raise HTTPException(status_code=404, detail="Export task not found or expired")

    if item["status"] == "PROCESSING":
        # Immediate fallback compilation for demo speed if background worker is still running
        raise HTTPException(status_code=202, detail="Document compilation in progress. Please retry in 1 second.")

    if item["status"] == "FAILED":
        raise HTTPException(status_code=500, detail=f"Compilation failed: {item.get('error')}")

    if time.time() > item["expires_at"]:
        raise HTTPException(status_code=410, detail="Presigned download URL has expired. Please request a new export.")

    return Response(
        content=item["binary_data"],
        media_type=item["media_type"],
        headers={
            "Content-Disposition": f'attachment; filename="{item["filename"]}"'
        }
    )


@router.post("/export-docx")
def endpoint_export_docx(payload: ExportRequest):
    """Generates and returns a downloadable single-column ATS-compliant DOCX file."""
    try:
        file_bytes = generate_docx(payload.resume_data)
        filename = f"{payload.resume_data.get('name', 'Resume').replace(' ', '_')}_ATS_Optimized.docx"
        
        return Response(
            content=file_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DOCX Generation failed: {str(e)}")


@router.post("/export-pdf")
def endpoint_export_pdf(payload: ExportRequest):
    """Generates and returns a downloadable single-column ATS-compliant PDF file."""
    try:
        file_bytes = generate_pdf(payload.resume_data)
        filename = f"{payload.resume_data.get('name', 'Resume').replace(' ', '_')}_ATS_Optimized.pdf"
        
        return Response(
            content=file_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF Generation failed: {str(e)}")
