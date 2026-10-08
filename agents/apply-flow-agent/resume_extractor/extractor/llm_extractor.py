"""
LLM structured extraction tier, for fields with no rigid pattern: name,
address, education, experience, skills. Uses OpenAI's structured outputs
(response_format=json_schema with strict=True) rather than free-form
generation - this constrains the model to only emit fields defined in the
schema, in the correct types. It does NOT stop the model from inventing a
plausible-sounding name or company if instructed poorly, which is why the
prompt explicitly forbids guessing and the schema allows null everywhere.
"""
from __future__ import annotations
import json
import os
from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    return _client


# json_schema mode requires every property to be listed in "required", even
# ones that are semantically optional - optionality is expressed by allowing
# null as part of the type instead. This is what forces the model to
# explicitly output null rather than silently omitting a field it's unsure
# about, which in turn is what makes "unresolved" a visible, checkable state
# downstream instead of an invisible gap.
RESUME_JSON_SCHEMA = {
    "name": "resume_fields",
    "strict": True,
    "schema": {
        "type": "object",
        "properties": {
            "first_name": {"type": ["string", "null"]},
            "last_name": {"type": ["string", "null"]},
            "full_name": {"type": ["string", "null"]},
            "address_line1": {"type": ["string", "null"]},
            "city": {"type": ["string", "null"]},
            "state": {"type": ["string", "null"]},
            "zip_code": {"type": ["string", "null"]},
            "country": {"type": ["string", "null"]},
            "current_title": {"type": ["string", "null"]},
            "years_of_experience": {"type": ["number", "null"]},
            "education": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "degree": {"type": ["string", "null"]},
                        "field_of_study": {"type": ["string", "null"]},
                        "institution": {"type": ["string", "null"]},
                        "graduation_year": {"type": ["string", "null"]},
                    },
                    "required": ["degree", "field_of_study", "institution", "graduation_year"],
                    "additionalProperties": False,
                },
            },
            "experience": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "title": {"type": ["string", "null"]},
                        "company": {"type": ["string", "null"]},
                        "start_date": {"type": ["string", "null"]},
                        "end_date": {"type": ["string", "null"]},
                        "description": {"type": ["string", "null"]},
                    },
                    "required": ["title", "company", "start_date", "end_date", "description"],
                    "additionalProperties": False,
                },
            },
            "skills": {"type": "array", "items": {"type": "string"}},
        },
        "required": [
            "first_name", "last_name", "full_name", "address_line1", "city",
            "state", "zip_code", "country", "current_title",
            "years_of_experience", "education", "experience", "skills",
        ],
        "additionalProperties": False,
    },
}

SYSTEM_PROMPT = """You extract structured fields from resume text for a job \
application autofill tool. Follow these rules exactly:

1. Only output information that is EXPLICITLY present in the resume text. \
Never infer, guess, or fabricate a value that isn't directly stated.
2. If a field is not present in the text, or you are not confident about it, \
output null for that field. Outputting null is always correct when the \
information genuinely isn't there - it is never a wrong answer.
3. Do not normalize or reformat dates/numbers beyond what's needed to fit \
the type (e.g. keep dates as written in the resume, don't calculate one).
4. years_of_experience: only fill this if the resume states it explicitly \
or if it can be directly summed from explicit start/end dates in the \
experience section. Do not estimate from job titles or seniority language.
5. Do not include contact information (name is the exception, extract it) \
such as email, phone, or social URLs even if you see them - those are \
handled by a separate, more reliable extraction step."""


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def extract_structured_fields(resume_text: str, model: str | None = None) -> dict:
    """
    Returns a dict matching RESUME_JSON_SCHEMA. Retries on transient API
    errors (network/5xx/429) - a schema-invalid response isn't retried
    here because response_format=json_schema with strict=True makes that
    effectively impossible; if it somehow happens, the caller's Pydantic
    validation (schema.py) will raise clearly rather than silently passing
    bad data through.
    """
    client = _get_client()
    model_name = model or os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

    response = client.chat.completions.create(
        model=model_name,
        temperature=0,  # deterministic extraction, not creative generation
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Resume text:\n\n{resume_text}"},
        ],
        response_format={"type": "json_schema", "json_schema": RESUME_JSON_SCHEMA},
    )

    content = response.choices[0].message.content
    return json.loads(content)
