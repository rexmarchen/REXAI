import io
from typing import Optional
import PyPDF2
import pdfplumber
from docx import Document
import re

class ResumeParser:
    @staticmethod
    def extract_text_from_pdf(file_bytes: bytes) -> str:
        text = ""
        try:
            # Try pdfplumber first (better formatting)
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except:
            # Fallback to PyPDF2
            reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text.strip()

    @staticmethod
    def extract_text_from_docx(file_bytes: bytes) -> str:
        doc = Document(io.BytesIO(file_bytes))
        text = "\n".join([para.text for para in doc.paragraphs])
        return text.strip()

    @classmethod
    def extract(cls, file_bytes: bytes, filename: str) -> Optional[str]:
        if filename.lower().endswith('.pdf'):
            return cls.extract_text_from_pdf(file_bytes)
        elif filename.lower().endswith('.docx'):
            return cls.extract_text_from_docx(file_bytes)
        else:
            raise ValueError("Unsupported file type. Use PDF or DOCX.")