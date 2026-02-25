from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime


KNOWN_SKILLS: list[tuple[str, list[str]]] = [
    ("JavaScript", ["javascript", "js"]),
    ("TypeScript", ["typescript", "ts"]),
    ("React", ["react", "react.js"]),
    ("Node.js", ["node", "nodejs", "node.js"]),
    ("Express.js", ["express", "expressjs", "express.js"]),
    ("Python", ["python"]),
    ("SQL", ["sql", "mysql", "postgresql", "postgres"]),
    ("MongoDB", ["mongodb", "mongo"]),
    ("HTML", ["html", "html5"]),
    ("CSS", ["css", "css3"]),
    ("AWS", ["aws", "amazon web services"]),
    ("Docker", ["docker"]),
    ("Kubernetes", ["kubernetes", "k8s"]),
    ("Git", ["git", "github"]),
    ("Machine Learning", ["machine learning", "ml"]),
    ("Deep Learning", ["deep learning"]),
    ("TensorFlow", ["tensorflow"]),
    ("PyTorch", ["pytorch"]),
    ("NLP", ["nlp", "natural language processing"]),
    ("Data Analysis", ["data analysis", "analytics"]),
    ("Scikit-learn", ["scikit-learn", "sklearn"]),
    ("Pandas", ["pandas"]),
    ("NumPy", ["numpy"]),
    ("Power BI", ["power bi", "powerbi"]),
    ("Tableau", ["tableau"]),
    ("REST APIs", ["rest api", "restful", "apis"]),
    ("C++", ["c++", "cpp"]),
    ("Java", ["java"]),
    ("C#", ["c#", ".net", "dotnet"]),
]

SECTION_ALIASES: dict[str, list[str]] = {
    "skills": ["skills", "technical skills", "core skills", "technologies", "competencies"],
    "education": ["education", "academic", "academics", "qualification", "qualifications"],
    "certifications": ["certification", "certifications", "licenses", "license"],
    "projects": ["project", "projects", "key projects", "personal projects"],
    "experience": ["experience", "work experience", "professional experience", "employment"],
}

SECTION_BREAKERS = {alias.lower() for aliases in SECTION_ALIASES.values() for alias in aliases}

EXPERIENCE_REGEX = re.compile(r"(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)", re.IGNORECASE)
EXPERIENCE_RANGE_REGEX = re.compile(
    r"(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?)",
    re.IGNORECASE,
)
DATE_RANGE_REGEX = re.compile(
    r"((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}|\d{4})\s*"
    r"(?:-|to|–|—)\s*"
    r"(present|current|now|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}|\d{4})",
    re.IGNORECASE,
)

MONTH_MAP = {
    "jan": 1,
    "feb": 2,
    "mar": 3,
    "apr": 4,
    "may": 5,
    "jun": 6,
    "jul": 7,
    "aug": 8,
    "sep": 9,
    "oct": 10,
    "nov": 11,
    "dec": 12,
}


@dataclass
class ResumeProfile:
    name: str
    skills: list[str]
    education: str
    certifications: list[str]
    projects: list[str]
    experience_years: int


def _normalize_text(raw_text: str) -> str:
    return (
        str(raw_text or "")
        .replace("\x00", " ")
        .replace("\u200b", " ")
        .replace("\ufeff", " ")
    )


def _normalize_line(line: str) -> str:
    line = str(line or "").strip()
    line = re.sub(r"^[\s*.,;:|/\\()[\]{}<>-]+", "", line)
    line = re.sub(r"\s+", " ", line)
    return line.strip()


def _split_lines(text: str) -> list[str]:
    raw = _normalize_text(text).replace("\r", "\n")
    lines = [_normalize_line(item) for item in raw.split("\n")]
    filtered = [item for item in lines if item]
    if filtered:
        return filtered

    fallback = [_normalize_line(item) for item in re.split(r"[.;]", raw)]
    return [item for item in fallback if item]


def _sanitize_header(line: str) -> str:
    return _normalize_line(line).lower().rstrip(": ").strip()


def _find_section_index(lines: list[str], aliases: list[str]) -> int:
    alias_set = {item.lower() for item in aliases}
    for idx, line in enumerate(lines):
        if _sanitize_header(line) in alias_set:
            return idx
    return -1


def _find_next_section_index(lines: list[str], from_index: int) -> int:
    for idx in range(from_index + 1, len(lines)):
        if _sanitize_header(lines[idx]) in SECTION_BREAKERS:
            return idx
    return len(lines)


def _extract_section_lines(lines: list[str], section_name: str, max_items: int = 8) -> list[str]:
    aliases = SECTION_ALIASES.get(section_name, [])
    section_index = _find_section_index(lines, aliases)
    if section_index < 0:
        return []

    end_index = _find_next_section_index(lines, section_index)
    rows: list[str] = []
    for idx in range(section_index + 1, end_index):
        value = _normalize_line(lines[idx])
        if not value:
            continue
        rows.append(value)
        if len(rows) >= max_items:
            break
    return rows


def _uniq_list(values: list[str], max_items: int = 20) -> list[str]:
    ordered: dict[str, str] = {}
    for value in values:
        clean = _normalize_line(value)
        if not clean:
            continue
        key = clean.lower()
        if key not in ordered:
            ordered[key] = clean
        if len(ordered) >= max_items:
            break
    return list(ordered.values())


def _tokenize_skills(lines: list[str]) -> list[str]:
    tokens: list[str] = []
    for line in lines:
        parts = [_normalize_line(part) for part in re.split(r"[,|/;]+", line)]
        for part in parts:
            if not part:
                continue
            if 2 <= len(part) <= 40:
                tokens.append(part)
    return tokens


def _find_known_skills(normalized_lower_text: str) -> list[str]:
    def contains_alias(text: str, alias: str) -> bool:
        alias = alias.lower().strip()
        if not alias:
            return False
        escaped = re.escape(alias)
        pattern = re.compile(rf"(?<!\w){escaped}(?!\w)", re.IGNORECASE)
        return bool(pattern.search(text))

    found: list[str] = []
    for label, aliases in KNOWN_SKILLS:
        if any(contains_alias(normalized_lower_text, alias) for alias in aliases):
            found.append(label)
    return found


def _pick_name(lines: list[str]) -> str:
    blocked_words = {
        "resume",
        "curriculum vitae",
        "profile",
        "summary",
        "objective",
        "skills",
        "education",
        "experience",
        "projects",
    }

    top_lines = lines[:16]
    for line in top_lines:
        value = _normalize_line(line)
        lower = value.lower()
        words = value.split()
        if not value:
            continue
        if len(value) < 4 or len(value) > 60:
            continue
        if any(char.isdigit() for char in value):
            continue
        if re.search(r"[@:/\\|]", value):
            continue
        if len(words) < 2 or len(words) > 4:
            continue
        if lower in blocked_words:
            continue
        if not all(re.fullmatch(r"[A-Za-z.'-]+", word) for word in words):
            continue
        return value

    # Fallback: derive probable name from first email local-part.
    email_match = re.search(
        r"\b([A-Za-z][A-Za-z0-9._-]{1,50})@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
        " ".join(top_lines),
    )
    if email_match:
        local = email_match.group(1)
        chunks = [part for part in re.split(r"[._-]+", local) if part]
        alpha_chunks = [chunk for chunk in chunks if chunk.isalpha()]
        if 1 < len(alpha_chunks) <= 4:
            return " ".join(part.capitalize() for part in alpha_chunks[:4])
    return ""


def _pick_education(lines: list[str]) -> str:
    pattern = re.compile(
        r"\b(b\.?\s?tech|bachelor|master|m\.?\s?tech|phd|mba|b\.?\s?e\.?|m\.?\s?e\.?|bca|mca|university|college|institute)\b",
        re.IGNORECASE,
    )
    for line in lines:
        if pattern.search(line):
            return _normalize_line(line)

    education_section = _extract_section_lines(lines, "education", max_items=3)
    return education_section[0] if education_section else ""


def _pick_certifications(lines: list[str]) -> list[str]:
    section_items = _extract_section_lines(lines, "certifications", max_items=8)
    if section_items:
        return _uniq_list(section_items, max_items=8)

    fallback = [
        line
        for line in lines
        if re.search(r"\b(certified|certification|certificate|license|licensed)\b", line, re.IGNORECASE)
    ][:8]
    return _uniq_list(fallback, max_items=8)


def _pick_projects(lines: list[str]) -> list[str]:
    section_items = _extract_section_lines(lines, "projects", max_items=8)
    if section_items:
        return _uniq_list(section_items, max_items=8)

    fallback = [
        line
        for line in lines
        if re.search(r"\b(project|built|developed|designed|implemented)\b", line, re.IGNORECASE)
    ][:8]
    return _uniq_list(fallback, max_items=8)


def _parse_date_token(token: str) -> datetime | None:
    token = str(token or "").strip().lower()
    if not token:
        return None

    if token in {"present", "current", "now"}:
        return datetime.utcnow()

    if re.fullmatch(r"\d{4}", token):
        year = int(token)
        if 1950 <= year <= datetime.utcnow().year + 1:
            return datetime(year=year, month=1, day=1)
        return None

    parts = token.split()
    if len(parts) == 2 and re.fullmatch(r"\d{4}", parts[1]):
        month = MONTH_MAP.get(parts[0][:3])
        if month:
            year = int(parts[1])
            if 1950 <= year <= datetime.utcnow().year + 1:
                return datetime(year=year, month=month, day=1)
    return None


def _pick_experience_years(full_text: str, lines: list[str]) -> int:
    normalized_lower_text = _normalize_text(full_text).lower()
    max_years = 0.0

    for match in EXPERIENCE_REGEX.finditer(normalized_lower_text):
        years = float(match.group(1))
        max_years = max(max_years, years)

    for match in EXPERIENCE_RANGE_REGEX.finditer(normalized_lower_text):
        years = float(match.group(2))
        max_years = max(max_years, years)

    # Secondary signal: derive years from explicit date ranges in experience lines.
    for line in lines:
        if not re.search(
            r"\b(experience|engineer|developer|analyst|intern|consultant|manager|scientist|architect|administrator|specialist|lead)\b",
            line,
            re.IGNORECASE,
        ):
            continue
        for date_match in DATE_RANGE_REGEX.finditer(line):
            start = _parse_date_token(date_match.group(1))
            end = _parse_date_token(date_match.group(2))
            if not start or not end or end < start:
                continue
            months = (end.year - start.year) * 12 + (end.month - start.month)
            derived_years = max(0.0, months / 12.0)
            max_years = max(max_years, derived_years)

    return max(0, round(max_years))


def extract_resume_profile(text: str) -> ResumeProfile:
    lines = _split_lines(text)
    normalized_lower_text = _normalize_text(" ".join(lines)).lower()
    skill_section_items = _tokenize_skills(_extract_section_lines(lines, "skills", max_items=12))
    known_skills = _find_known_skills(normalized_lower_text)
    merged_skills = _uniq_list([*skill_section_items, *known_skills], max_items=20)

    return ResumeProfile(
        name=_pick_name(lines),
        skills=merged_skills,
        education=_pick_education(lines),
        certifications=_pick_certifications(lines),
        projects=_pick_projects(lines),
        experience_years=_pick_experience_years(text, lines),
    )
