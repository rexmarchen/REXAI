"""
Example: how the job-application agent should call this module.

Usage:
    python examples/run_extraction.py path/to/resume.pdf
"""
import sys
import json
from dotenv import load_dotenv

load_dotenv()

from extractor import extract_resume_fields, get_autofill_value  # noqa: E402


def main():
    if len(sys.argv) != 2:
        print("Usage: python run_extraction.py <resume.pdf>")
        sys.exit(1)

    profile = extract_resume_fields(sys.argv[1])

    print("Full profile (for logging/debugging):")
    print(json.dumps(profile.model_dump(), indent=2, default=str))

    print("\n--- Simulated form-fill calls ---")
    # This is the pattern the auto-apply agent should follow: ask for one
    # field at a time, and skip filling if the answer is None.
    for field_name in ["first_name", "last_name", "email", "phone", "current_title"]:
        value = get_autofill_value(profile, field_name)
        if value is None:
            print(f"[SKIP - unresolved] {field_name}: leaving form field blank, flag for review")
        else:
            print(f"[FILL] {field_name} = {value}")


if __name__ == "__main__":
    main()
