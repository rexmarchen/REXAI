from extractor.validator import build_profile, get_autofill_value


def _llm_stub(**overrides):
    base = {
        "first_name": None, "last_name": None, "full_name": None,
        "address_line1": None, "city": None, "state": None, "zip_code": None,
        "country": None, "current_title": None, "years_of_experience": None,
        "education": [], "experience": [], "skills": [],
    }
    base.update(overrides)
    return base


def test_regex_field_marked_regex_source():
    profile = build_profile(
        regex_fields={"email": "jane@example.com", "phone": "+14155552671"},
        llm_fields=_llm_stub(first_name="Jane", last_name="Doe"),
        hyperlink_fields={"linkedin_url": None, "github_url": None, "portfolio_url": None},
        source_text_excerpt="",
    )
    assert profile.field_sources["email"] == "regex"
    assert profile.field_sources["phone"] == "regex"
    assert profile.field_sources["first_name"] == "llm"


def test_missing_field_marked_unresolved_and_blocks_autofill():
    profile = build_profile(
        regex_fields={"email": None, "phone": None},
        llm_fields=_llm_stub(),  # everything null
        hyperlink_fields={"linkedin_url": None, "github_url": None, "portfolio_url": None},
        source_text_excerpt="",
    )
    assert profile.field_sources["email"] == "unresolved"
    # The critical anti-hallucination check: unresolved fields must return
    # None from get_autofill_value, never an empty string or placeholder.
    assert get_autofill_value(profile, "email") is None
    assert get_autofill_value(profile, "first_name") is None


def test_resolved_field_returns_value_via_autofill():
    profile = build_profile(
        regex_fields={"email": "jane@example.com", "phone": None},
        llm_fields=_llm_stub(first_name="Jane"),
        hyperlink_fields={"linkedin_url": None, "github_url": None, "portfolio_url": None},
        source_text_excerpt="",
    )
    assert get_autofill_value(profile, "email") == "jane@example.com"
    assert get_autofill_value(profile, "first_name") == "Jane"
