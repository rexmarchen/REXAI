# Resume PDF Extractor

Two-tier field extraction for job-application autofill: deterministic regex
for email/phone/profile URLs, LLM structured extraction (JSON-schema mode)
for name/address/education/experience/skills. Designed to plug into an
existing auto-apply agent as a pre-processing step, replacing any RAG-based
extraction of these specific fields.

## Why two tiers

- **Regex tier** (`regex_extractor.py`): email and phone have rigid formats.
  Pattern matching + `phonenumbers` (libphonenumber) is more reliable than
  any LLM for these - there's nothing to "understand." Profile URLs
  (LinkedIn/GitHub) are pulled from **embedded PDF hyperlink annotations**
  first (`layout_extractor.py`), not just visible text - many resume
  templates hide these behind icons with no visible URL, which text-only
  regex would silently miss.
- **LLM tier** (`llm_extractor.py`): name, address, education, and
  experience don't have a fixed pattern, so this tier uses OpenAI's
  `json_schema` structured-output mode with `strict: true` and an explicit
  "never guess, output null if unsure" system prompt. This is what prevents
  hallucinated values - the model is structurally forced to say "I don't
  know" (null) rather than invent a plausible-looking answer.

## Why layout-aware extraction (`layout_extractor.py`)

Naive PDF text extraction reads content-stream order, not visual reading
order - a two-column resume gets its columns interleaved, and that
scrambled text is almost certainly what's been feeding your existing RAG
pipeline and producing garbled name/phone output. This module re-sorts
extracted words by position (column-aware) before returning text.

## The anti-hallucination contract

Every extracted field gets tagged in `ExtractedProfile.field_sources` as
`"regex"`, `"llm"`, or `"unresolved"`. The agent must call
`get_autofill_value(profile, field_name)` to read a value - it returns
`None` for anything marked `"unresolved"`, which the agent should treat as
**leave the form field blank / flag for manual review**, never fill with a
guess or an empty string. This is enforced in code, not just documentation -
see `validator.py::get_autofill_value`.

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env   # add your OPENAI_API_KEY
python examples/run_extraction.py path/to/resume.pdf
pytest tests/          # regex + validator tests run with no API key needed
```

## Integration point

```python
from extractor import extract_resume_fields, get_autofill_value

profile = extract_resume_fields(resume_pdf_path)

# For each detected form field, e.g. "phone":
value = get_autofill_value(profile, "phone")
if value is None:
    flag_for_manual_review(field="phone")
else:
    fill_form_field(field="phone", value=value)
```

`profile.education`, `profile.experience`, and `profile.skills` are lists
for multi-entry form sections (e.g. "Add another job"). Open-ended
questions ("why do you want this role") are NOT handled here - keep those
on your existing RAG pipeline, chunked by resume section rather than fixed
token windows, as discussed separately.

## Known gaps

- LLM tier is wired to OpenAI. To use Anthropic instead, swap
  `llm_extractor.py`'s client for the Anthropic SDK's tool-use /
  structured-output equivalent - the schema and prompt transfer directly.
- `years_of_experience` relies on the LLM reading explicit dates; it will
  correctly return null on resumes that don't state total experience
  directly, by design (see the anti-guessing rule in the system prompt).
- No caching layer - if you re-run extraction on the same PDF repeatedly
  (e.g. across multiple job applications), cache `ExtractedProfile` keyed by
  a hash of the PDF bytes to avoid repeat LLM calls.
