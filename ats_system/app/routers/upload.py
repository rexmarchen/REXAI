from __future__ import annotations

from fastapi import APIRouter, File, UploadFile

from app.services.matcher import add_resume, get_store_size
from app.services.parser import parse_upload_file
from app.services.skill_extractor import extract_skills


router = APIRouter(tags=["upload"])


@router.post("/upload-resumes")
async def upload_resumes(resumes: list[UploadFile] = File(...)) -> dict:
    if not resumes:
        return {"uploaded": 0, "resumes": [], "total_resumes_in_store": get_store_size()}

    uploaded: list[dict] = []

    for file in resumes:
        parsed = await parse_upload_file(file)
        resume_id = add_resume(parsed.filename, parsed.text)
        uploaded.append(
            {
                "resume_id": resume_id,
                "filename": parsed.filename,
                "extension": parsed.extension,
                "text_length": len(parsed.text),
                "skills": extract_skills(parsed.text),
            }
        )

    return {
        "uploaded": len(uploaded),
        "resumes": uploaded,
        "total_resumes_in_store": get_store_size(),
    }

