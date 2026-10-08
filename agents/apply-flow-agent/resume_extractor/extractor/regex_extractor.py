"""
Deterministic extraction tier. These fields have rigid, well-defined
formats, so regex + a proper phone-number library outperforms any LLM -
there's nothing to "understand," just a pattern to match. This tier is
treated as ground truth: if the LLM tier (llm_extractor.py) disagrees with
what's found here, this tier wins (see validator.py).
"""
from __future__ import annotations
import re
import phonenumbers

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")

LINKEDIN_RE = re.compile(r"(https?://)?(www\.)?linkedin\.com/in/[a-zA-Z0-9\-_/]+", re.IGNORECASE)
GITHUB_RE = re.compile(r"(https?://)?(www\.)?github\.com/[a-zA-Z0-9\-_/]+", re.IGNORECASE)


def extract_email(text: str) -> str | None:
    match = EMAIL_RE.search(text)
    return match.group(0) if match else None


def extract_phone(text: str, default_region: str = "US") -> str | None:
    """
    Uses Google's libphonenumber (via the `phonenumbers` package) rather
    than a hand-written regex - phone formats vary too much across
    countries/extensions/separators for regex to reliably get right, and a
    wrong phone number silently submitted on a job application is a real
    cost to the user.
    """
    for match in phonenumbers.PhoneNumberMatcher(text, default_region):
        number = match.number
        if phonenumbers.is_valid_number(number):
            return phonenumbers.format_number(number, phonenumbers.PhoneNumberFormat.E164)
    return None


def extract_profile_urls(text: str, hyperlinks: list[str]) -> dict[str, str | None]:
    """
    Checks both visible text (regex) AND embedded PDF hyperlink annotations
    (passed in from layout_extractor.py), since many templates hide these
    URLs behind icons with no visible text at all.
    """
    candidates = hyperlinks + [text]  # search hyperlinks first, then fall back to visible text
    joined_links = "\n".join(hyperlinks)

    linkedin = LINKEDIN_RE.search(joined_links) or LINKEDIN_RE.search(text)
    github = GITHUB_RE.search(joined_links) or GITHUB_RE.search(text)

    # Portfolio: any hyperlink that isn't linkedin/github/mailto/an obvious
    # social platform - best-effort heuristic, not a strict pattern.
    excluded_domains = ("linkedin.com", "github.com", "mailto:", "twitter.com", "x.com")
    portfolio = next(
        (link for link in hyperlinks if link and not any(d in link.lower() for d in excluded_domains)),
        None,
    )

    return {
        "linkedin_url": linkedin.group(0) if linkedin else None,
        "github_url": github.group(0) if github else None,
        "portfolio_url": portfolio,
    }
