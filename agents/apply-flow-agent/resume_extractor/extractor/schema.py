"""
Data contract for extracted resume fields. Every extraction path (regex or
LLM) must produce data that fits this schema. Nothing outside this schema
is ever passed to the form-filling agent - that's what keeps the agent from
inventing or guessing fields that were never actually extracted.
"""
from __future__ import annotations
from typing import Optional, Literal
from pydantic import BaseModel, Field, EmailStr

# How a field's value was obtained. The form-filling agent should treat
# "regex" as highest trust, "llm" as medium trust, and "unresolved" as a
# signal to leave the form field blank / flag for manual review rather than
# fill it with a guess.
SourceType = Literal["regex", "llm", "unresolved"]


class FieldConfidence(BaseModel):
    value: Optional[str] = None
    source: SourceType = "unresolved"


class Education(BaseModel):
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    institution: Optional[str] = None
    graduation_year: Optional[str] = None


class Experience(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None


class ExtractedProfile(BaseModel):
    # --- High-confidence, regex-first fields ---
    email: Optional[EmailStr] = None
    phone: Optional[str] = None  # normalized to E.164, e.g. +14155552671
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None

    # --- LLM-extracted structured fields ---
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    address_line1: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = None
    current_title: Optional[str] = None
    years_of_experience: Optional[float] = None
    education: list[Education] = Field(default_factory=list)
    experience: list[Experience] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)

    # --- Provenance: which extraction method produced each top-level field.
    # The form-filling agent MUST check this before autofilling a field -
    # this is the mechanism that prevents hallucinated/guessed values from
    # silently reaching a real application form.
    field_sources: dict[str, SourceType] = Field(default_factory=dict)

    # Raw text this profile was built from, kept for debugging/audit only -
    # never displayed to the end user or sent to a form field.
    source_text_excerpt: Optional[str] = None
