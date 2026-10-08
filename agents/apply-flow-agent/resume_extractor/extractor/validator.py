"""
Merges the regex tier and LLM tier into one profile, deciding which source
wins per field and recording that decision. This is the layer that turns
"two extraction methods ran" into "one trustworthy answer per field."
"""
from __future__ import annotations
from .schema import ExtractedProfile, Education, Experience


def build_profile(
    regex_fields: dict,
    llm_fields: dict,
    hyperlink_fields: dict,
    source_text_excerpt: str,
) -> ExtractedProfile:
    field_sources: dict[str, str] = {}

    # --- Regex tier always wins for fields it successfully found ---
    email = regex_fields.get("email")
    field_sources["email"] = "regex" if email else "unresolved"

    phone = regex_fields.get("phone")
    field_sources["phone"] = "regex" if phone else "unresolved"

    linkedin_url = hyperlink_fields.get("linkedin_url")
    field_sources["linkedin_url"] = "regex" if linkedin_url else "unresolved"

    github_url = hyperlink_fields.get("github_url")
    field_sources["github_url"] = "regex" if github_url else "unresolved"

    portfolio_url = hyperlink_fields.get("portfolio_url")
    field_sources["portfolio_url"] = "regex" if portfolio_url else "unresolved"

    # --- LLM tier fills everything else, field-by-field null check ---
    def llm_field(key: str):
        value = llm_fields.get(key)
        field_sources[key] = "llm" if value not in (None, "", []) else "unresolved"
        return value

    profile = ExtractedProfile(
        email=email,
        phone=phone,
        linkedin_url=linkedin_url,
        github_url=github_url,
        portfolio_url=portfolio_url,
        first_name=llm_field("first_name"),
        last_name=llm_field("last_name"),
        full_name=llm_field("full_name"),
        address_line1=llm_field("address_line1"),
        city=llm_field("city"),
        state=llm_field("state"),
        zip_code=llm_field("zip_code"),
        country=llm_field("country"),
        current_title=llm_field("current_title"),
        years_of_experience=llm_field("years_of_experience"),
        education=[Education(**e) for e in llm_fields.get("education", [])],
        experience=[Experience(**e) for e in llm_fields.get("experience", [])],
        skills=llm_fields.get("skills", []),
        field_sources=field_sources,
        source_text_excerpt=source_text_excerpt[:500],
    )

    return profile


def get_autofill_value(profile: ExtractedProfile, field_name: str) -> str | None:
    """
    The ONE function the form-filling agent should call to get a value for
    a given field name. Returns None for any field marked "unresolved" -
    the agent must leave that form input blank / route it to manual review
    rather than fill it with an empty string or a guessed default. This is
    the actual anti-hallucination gate at the point of use, not just at
    extraction time.
    """
    if profile.field_sources.get(field_name) == "unresolved":
        return None
    value = getattr(profile, field_name, None)
    return str(value) if value is not None else None
