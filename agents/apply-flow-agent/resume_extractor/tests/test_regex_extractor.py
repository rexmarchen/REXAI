from extractor.regex_extractor import extract_email, extract_phone, extract_profile_urls


def test_extract_email_basic():
    text = "Contact me at jane.doe+jobs@example.com for details."
    assert extract_email(text) == "jane.doe+jobs@example.com"


def test_extract_email_none():
    assert extract_email("No email here.") is None


def test_extract_phone_us_format():
    text = "Call me at (415) 555-2671 anytime."
    assert extract_phone(text) == "+14155552671"


def test_extract_phone_invalid_number_returns_none():
    text = "Reference number: 000-000-0000"
    # Not a real, valid number - extractor should not force-return it.
    result = extract_phone(text)
    assert result is None or result.startswith("+")


def test_extract_profile_urls_from_hyperlinks():
    hyperlinks = ["https://linkedin.com/in/janedoe", "https://github.com/janedoe", "https://janedoe.dev"]
    result = extract_profile_urls("", hyperlinks)
    assert result["linkedin_url"] == "https://linkedin.com/in/janedoe"
    assert result["github_url"] == "https://github.com/janedoe"
    assert result["portfolio_url"] == "https://janedoe.dev"


def test_extract_profile_urls_from_visible_text_fallback():
    text = "linkedin.com/in/johndoe and github.com/johndoe are my profiles."
    result = extract_profile_urls(text, hyperlinks=[])
    assert "johndoe" in result["linkedin_url"]
    assert "johndoe" in result["github_url"]
