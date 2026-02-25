from __future__ import annotations

import io
import re
from dataclasses import dataclass
from pathlib import Path

from fastapi import HTTPException, UploadFile

try:
    import fitz  # type: ignore
except Exception:
    fitz = None

try:
    import pdfplumber  # type: ignore
except Exception:
    pdfplumber = None

try:
    from docx import Document
except Exception:
    Document = None


ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".txt"}


@dataclass
class ParsedResume:
    filename: str
    extension: str
    text: str


def clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", str(text or "")).strip()


def extract_text_from_pdf(file_bytes: bytes) -> str:
    # Primary parser: PyMuPDF. Fallback parser: pdfplumber.
    errors: list[str] = []

    if fitz is not None:
        try:
            with fitz.open(stream=file_bytes, filetype="pdf") as document:
                text = "\n".join(page.get_text("text") for page in document)
                cleaned = clean_text(text)
                if cleaned:
                    return cleaned
        except Exception as error:
            errors.append(f"pymupdf: {error}")

    if pdfplumber is not None:
        try:
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                text = "\n".join((page.extract_text() or "") for page in pdf.pages)
            cleaned = clean_text(text)
            if cleaned:
                return cleaned
        except Exception as error:
            errors.append(f"pdfplumber: {error}")

    if fitz is None and pdfplumber is None:
        raise HTTPException(
            status_code=500,
            detail="PDF parser dependencies are not installed (pymupdf/pdfplumber).",
        )

    # Last-resort fallback for malformed PDFs: decode bytes to keep pipeline alive.
    for encoding in ("utf-8", "latin-1"):
        try:
            decoded = clean_text(file_bytes.decode(encoding))
            if len(decoded) > 50:
                return decoded
        except Exception:
            continue

    reason = "; ".join(errors) if errors else "no extractable text found"
    raise HTTPException(status_code=400, detail=f"Could not extract text from PDF: {reason}")


def extract_text_from_docx(file_bytes: bytes) -> str:
    if Document is None:
        raise HTTPException(
            status_code=500,
            detail="DOCX parser dependency is not installed (python-docx).",
        )
    document = Document(io.BytesIO(file_bytes))
    text = "\n".join(paragraph.text for paragraph in document.paragraphs)
    return clean_text(text)


def extract_text(file_bytes: bytes, filename: str) -> str:
    extension = Path(filename or "resume").suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format for {filename}. Only PDF, DOC, DOCX and TXT are allowed.",
        )

    if not file_bytes:
        raise HTTPException(status_code=400, detail=f"Uploaded file {filename} is empty.")

    if extension == ".pdf":
        text = extract_text_from_pdf(file_bytes)
    elif extension == ".docx":
        text = extract_text_from_docx(file_bytes)
    else:
        try:
            text = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            text = file_bytes.decode("latin-1")
        text = clean_text(text)

    if not text:
        raise HTTPException(status_code=400, detail=f"Could not extract text from {filename}.")
    return text


async def parse_upload_file(file: UploadFile) -> ParsedResume:
    filename = file.filename or "resume"
    file_bytes = await file.read()
    text = extract_text(file_bytes, filename)
    extension = Path(filename).suffix.lower()
    return ParsedResume(filename=filename, extension=extension, text=text)
