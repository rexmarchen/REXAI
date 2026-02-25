from __future__ import annotations

import io
import re
from dataclasses import dataclass
from pathlib import Path

import fitz
import pdfplumber
from docx import Document
from fastapi import HTTPException, UploadFile


ALLOWED_EXTENSIONS = {".pdf", ".docx"}


@dataclass
class ParsedResume:
    filename: str
    extension: str
    text: str


def clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", str(text or "")).strip()


def extract_text_from_pdf(file_bytes: bytes) -> str:
    # Primary parser: PyMuPDF (fitz). Fallback parser: pdfplumber.
    try:
        with fitz.open(stream=file_bytes, filetype="pdf") as document:
            text = "\n".join(page.get_text("text") for page in document)
            cleaned = clean_text(text)
            if cleaned:
                return cleaned
    except Exception:
        pass

    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        text = "\n".join((page.extract_text() or "") for page in pdf.pages)
    return clean_text(text)


def extract_text_from_docx(file_bytes: bytes) -> str:
    document = Document(io.BytesIO(file_bytes))
    text = "\n".join(paragraph.text for paragraph in document.paragraphs)
    return clean_text(text)


async def parse_upload_file(file: UploadFile) -> ParsedResume:
    filename = file.filename or "resume"
    extension = Path(filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format for {filename}. Only PDF and DOCX are allowed.",
        )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail=f"Uploaded file {filename} is empty.")

    if extension == ".pdf":
        text = extract_text_from_pdf(file_bytes)
    else:
        text = extract_text_from_docx(file_bytes)

    if not text:
        raise HTTPException(status_code=400, detail=f"Could not extract text from {filename}.")

    return ParsedResume(filename=filename, extension=extension, text=text)

