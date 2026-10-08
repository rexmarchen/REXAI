"""JSON adapter for the JavaScript apply-flow agent.

The extractor package remains the source of truth for extraction and field
validation. This adapter only translates its profile into per-field values.
"""
from __future__ import annotations

import json
import sys

from extractor import extract_resume_fields, get_autofill_value


AUTOFILL_FIELDS = (
    "first_name",
    "last_name",
    "full_name",
    "email",
    "phone",
    "linkedin_url",
    "github_url",
    "portfolio_url",
    "address_line1",
    "city",
    "state",
    "zip_code",
    "country",
    "current_title",
    "years_of_experience",
)


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python -m extractor.autofill_cli <resume.pdf>")

    profile = extract_resume_fields(sys.argv[1])
    values = {
        field_name: get_autofill_value(profile, field_name)
        for field_name in AUTOFILL_FIELDS
    }
    print(json.dumps({"values": values}, default=str))


if __name__ == "__main__":
    main()
