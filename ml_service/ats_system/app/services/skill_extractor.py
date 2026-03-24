from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path
from typing import Iterable


ATS_ROOT = Path(__file__).resolve().parents[2]
SKILLS_PATH = ATS_ROOT / "data" / "skills.json"


def _safe_boundary_pattern(skill: str) -> str:
    # Works for skills such as "c++", ".net", "node.js".
    escaped = re.escape(skill.strip().lower())
    return rf"(?<!\w){escaped}(?!\w)"


@lru_cache(maxsize=1)
def load_skills_map() -> dict[str, list[str]]:
    with SKILLS_PATH.open("r", encoding="utf-8") as file:
        payload = json.load(file)
    return {str(key): [str(item) for item in value] for key, value in payload.items()}


@lru_cache(maxsize=1)
def load_all_skills() -> list[str]:
    skills_map = load_skills_map()
    seen: dict[str, str] = {}
    for values in skills_map.values():
        for value in values:
            key = value.strip().lower()
            if key and key not in seen:
                seen[key] = value.strip()
    return list(seen.values())


def extract_skills(text: str, skill_candidates: Iterable[str] | None = None) -> list[str]:
    normalized = str(text or "").lower()
    candidates = list(skill_candidates) if skill_candidates is not None else load_all_skills()

    found: list[str] = []
    for skill in candidates:
        if not skill:
            continue
        pattern = _safe_boundary_pattern(skill)
        if re.search(pattern, normalized):
            found.append(skill)

    # Deduplicate while preserving order.
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

