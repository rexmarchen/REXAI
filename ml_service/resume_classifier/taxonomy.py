"""Role taxonomy helpers for the production resume classifier."""

from __future__ import annotations

from typing import Iterable


FIXED_TAXONOMY: tuple[str, ...] = (
    "Software Engineer",
    "Data Scientist",
    "Web Developer",
    "DevOps Engineer",
)

OTHER_LABEL = "Other"

_ROLE_ALIASES = {
    "software engineer": "Software Engineer",
    "software developer": "Software Engineer",
    "sde": "Software Engineer",
    "backend developer": "Software Engineer",
    "backend engineer": "Software Engineer",
    "full stack developer": "Software Engineer",
    "full-stack developer": "Software Engineer",
    "full stack engineer": "Software Engineer",
    "full-stack engineer": "Software Engineer",
    "data scientist": "Data Scientist",
    "machine learning engineer": "Data Scientist",
    "ml engineer": "Data Scientist",
    "ai engineer": "Data Scientist",
    "web developer": "Web Developer",
    "frontend developer": "Web Developer",
    "front end developer": "Web Developer",
    "ui developer": "Web Developer",
    "devops engineer": "DevOps Engineer",
    "devops": "DevOps Engineer",
    "site reliability engineer": "DevOps Engineer",
    "sre": "DevOps Engineer",
}


def normalize_role(role: str) -> str:
    """Normalize an arbitrary role label to fixed taxonomy or Other."""
    text = str(role or "").strip().lower()
    if not text:
        return OTHER_LABEL

    if text in {item.lower() for item in FIXED_TAXONOMY}:
        for label in FIXED_TAXONOMY:
            if text == label.lower():
                return label

    mapped = _ROLE_ALIASES.get(text)
    if mapped:
        return mapped

    for alias, canonical in _ROLE_ALIASES.items():
        if alias in text:
            return canonical

    return OTHER_LABEL


def taxonomy_with_other(include_other: bool = True) -> list[str]:
    labels = list(FIXED_TAXONOMY)
    if include_other:
        labels.append(OTHER_LABEL)
    return labels


def has_only_fixed_roles(values: Iterable[str]) -> bool:
    valid = set(FIXED_TAXONOMY)
    return all(str(item) in valid for item in values)

