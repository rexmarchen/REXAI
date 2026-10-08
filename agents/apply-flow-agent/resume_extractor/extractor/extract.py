"""
Public entrypoint. This is the ONLY function the job-application agent
should import and call - everything else in this package is an internal
implementation detail.
"""
from __future__ import annotations
from .layout_extractor import extract_pdf
from .regex_extractor import extract_email, extract_phone, extract_profile_urls
from .llm_extractor import extract_structured_fields
from .validator import build_profile
from .schema import ExtractedProfile


def extract_resume_fields(pdf_path: str) -> ExtractedProfile:
    """
    Runs the full pipeline: layout-aware PDF text extraction -> regex tier
    -> LLM structured extraction tier -> merge/validate -> ExtractedProfile.

    Raises:
        FileNotFoundError: if pdf_path doesn't exist (from pdfplumber).
        pydantic.ValidationError: if the LLM tier somehow returns data that
            doesn't fit the schema - this should be treated as a hard
            failure upstream, not caught-and-ignored, since it means a
            field's type/shape is unreliable and silently proceeding risks
            passing bad data to a real form.
    """
    pdf_result = extract_pdf(pdf_path)

    email = extract_email(pdf_result.full_text)
    phone = extract_phone(pdf_result.full_text)
    url_fields = extract_profile_urls(pdf_result.full_text, pdf_result.hyperlinks)

    # LLM only sees the first page for contact-adjacent fields plus the full
    # text for education/experience/skills - full text is fine token-wise
    # for a resume (rarely more than 2-3 pages).
    llm_fields = extract_structured_fields(pdf_result.full_text)

    profile = build_profile(
        regex_fields={"email": email, "phone": phone},
        llm_fields=llm_fields,
        hyperlink_fields=url_fields,
        source_text_excerpt=pdf_result.first_page_text,
    )

    return profile
