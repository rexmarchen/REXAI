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


def clean_text(text: str, preserve_lines: bool = True) -> str:
    normalized = str(text or "").replace("\x00", " ").replace("\ufeff", " ")
    normalized = normalized.replace("\r\n", "\n").replace("\r", "\n")

    if not preserve_lines:
        return re.sub(r"\s+", " ", normalized).strip()

    cleaned_lines: list[str] = []
    for line in normalized.split("\n"):
        compact = re.sub(r"\s+", " ", line).strip()
        if compact:
            cleaned_lines.append(compact)
    return "\n".join(cleaned_lines).strip()


def _text_quality_score(text: str) -> float:
    value = str(text or "")
    if not value:
        return 0.0

    non_space = [char for char in value if not char.isspace()]
    if not non_space:
        return 0.0

    alpha_num = sum(1 for char in non_space if char.isalnum())
    common_punct = sum(1 for char in non_space if char in ".,:;!?()[]{}+-/&@#%_'\"")
    replacement_chars = value.count("\ufffd") + value.count("�")
    weird_chars = len(non_space) - alpha_num - common_punct

    meaningful_ratio = (alpha_num + common_punct) / len(non_space)
    weird_penalty = weird_chars / len(non_space)
    replacement_penalty = replacement_chars / len(non_space)
    return meaningful_ratio - (0.8 * weird_penalty) - replacement_penalty


def _looks_like_resume_text(text: str) -> bool:
    cleaned = clean_text(text, preserve_lines=True)
    if len(cleaned) < 40:
        return False

    quality = _text_quality_score(cleaned)
    if quality < 0.45:
        return False

    lower = cleaned.lower()
    # Typical resume anchors improve confidence that parsed output is real.
    anchors = (
        "experience",
        "education",
        "skills",
        "project",
        "certification",
        "email",
    )
    has_anchor = any(anchor in lower for anchor in anchors)
    has_contact = bool(re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", cleaned))
    return has_anchor or has_contact


def extract_text_from_pdf(file_bytes: bytes) -> str:
    # Primary parser: PyMuPDF. Fallback parser: pdfplumber.
    errors: list[str] = []

    if fitz is not None:
        try:
            with fitz.open(stream=file_bytes, filetype="pdf") as document:
                text = "\n".join(page.get_text("text") for page in document)
                cleaned = clean_text(text, preserve_lines=True)
                if cleaned and _looks_like_resume_text(cleaned):
                    return cleaned
                if cleaned:
                    errors.append("pymupdf: extracted text failed quality checks")
        except Exception as error:
            errors.append(f"pymupdf: {error}")

    if pdfplumber is not None:
        try:
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                text = "\n".join((page.extract_text() or "") for page in pdf.pages)
            cleaned = clean_text(text, preserve_lines=True)
            if cleaned and _looks_like_resume_text(cleaned):
                return cleaned
            if cleaned:
                errors.append("pdfplumber: extracted text failed quality checks")
        except Exception as error:
            errors.append(f"pdfplumber: {error}")

    if fitz is None and pdfplumber is None:
        raise HTTPException(
            status_code=500,
            detail="PDF parser dependencies are not installed (pymupdf/pdfplumber).",
        )

    reason = "; ".join(errors) if errors else "no extractable text found"
    raise HTTPException(
        status_code=400,
        detail=(
            "Could not extract usable text from PDF. "
            f"Reason: {reason}. "
            "Please upload a text-based PDF or DOCX."
        ),
    )


def extract_text_from_docx(file_bytes: bytes) -> str:
    if Document is None:
        raise HTTPException(
            status_code=500,
            detail="DOCX parser dependency is not installed (python-docx).",
        )
    document = Document(io.BytesIO(file_bytes))
    text = "\n".join(paragraph.text for paragraph in document.paragraphs)
    cleaned = clean_text(text, preserve_lines=True)
    if cleaned and _looks_like_resume_text(cleaned):
        return cleaned
    raise HTTPException(
        status_code=400,
        detail="DOCX content could not be parsed into usable resume text.",
    )


def extract_text_from_doc(file_bytes: bytes) -> str:
    # Best-effort support for legacy .doc. True binary .doc usually needs antiword/unoconv.
    if file_bytes.startswith(b"{\\rtf"):
        decoded = file_bytes.decode("latin-1", errors="ignore")
        text_only = re.sub(r"\\[a-z]+\d* ?|[{}]", " ", decoded)
        cleaned = clean_text(text_only, preserve_lines=True)
        if cleaned and _looks_like_resume_text(cleaned):
            return cleaned

    for encoding in ("utf-8", "latin-1"):
        decoded = file_bytes.decode(encoding, errors="ignore")
        cleaned = clean_text(decoded, preserve_lines=True)
        if cleaned and _looks_like_resume_text(cleaned):
            return cleaned

    raise HTTPException(
        status_code=400,
        detail="Legacy .doc could not be parsed reliably. Please convert to .docx or PDF.",
    )


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
    elif extension == ".doc":
        text = extract_text_from_doc(file_bytes)
    else:
        try:
            text = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            text = file_bytes.decode("latin-1")
        text = clean_text(text, preserve_lines=True)
        if not _looks_like_resume_text(text):
            raise HTTPException(
                status_code=400,
                detail=f"Could not extract usable resume text from {filename}.",
            )

    if not text:
        raise HTTPException(status_code=400, detail=f"Could not extract text from {filename}.")
    return text


async def parse_upload_file(file: UploadFile) -> ParsedResume:
    filename = file.filename or "resume"
    file_bytes = await file.read()
    text = extract_text(file_bytes, filename)
    extension = Path(filename).suffix.lower()
    return ParsedResume(filename=filename, extension=extension, text=text)
