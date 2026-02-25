from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path
from typing import Iterable

from ..config import settings


def _safe_boundary_pattern(skill: str) -> str:
    escaped = re.escape(skill.strip().lower())
    return rf"(?<!\w){escaped}(?!\w)"


@lru_cache(maxsize=1)
def load_skills_map(skills_path: Path | None = None) -> dict[str, list[str]]:
    source_path = skills_path or settings.ats_skills_path
    with Path(source_path).open("r", encoding="utf-8") as file:
        payload = json.load(file)
    return {str(key): [str(item) for item in value] for key, value in payload.items()}


@lru_cache(maxsize=1)
def load_all_skills() -> list[str]:
    skills_map = load_skills_map()
    seen: dict[str, str] = {}

    for values in skills_map.values():
        for value in values:
            lowered = value.strip().lower()
            if lowered and lowered not in seen:
                seen[lowered] = value.strip()

    return list(seen.values())


def extract_skills(text: str, skill_candidates: Iterable[str] | None = None) -> list[str]:
    normalized = str(text or "").lower()
    candidates = list(skill_candidates) if skill_candidates is not None else load_all_skills()

    found: list[str] = []
    for skill in candidates:
        if not skill:
            continue
        if re.search(_safe_boundary_pattern(skill), normalized):
            found.append(skill)

    ordered_unique: dict[str, str] = {}
    for skill in found:
        lowered = skill.lower()
        if lowered not in ordered_unique:
            ordered_unique[lowered] = skill
    return list(ordered_unique.values())


def missing_skills(resume_text: str, job_description: str) -> list[str]:
    resume_skills = set(skill.lower() for skill in extract_skills(resume_text))
    job_skills = extract_skills(job_description)
    return [skill for skill in job_skills if skill.lower() not in resume_skills]

