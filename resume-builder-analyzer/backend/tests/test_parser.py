import os
import pytest
from app.services.parser import ResumeParser, parse_date_range_string

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")

def test_date_range_parser():
    dr1 = parse_date_range_string("Jan 2021 - Present")
    assert dr1 is not None
    assert dr1.start_year == 2021
    assert dr1.start_month == 1
    assert dr1.is_current is True

    dr2 = parse_date_range_string("2016 - 2018")
    assert dr2 is not None
    assert dr2.start_year == 2016
    assert dr2.end_year == 2018

    dr3 = parse_date_range_string("03/2019 - 05/2022")
    assert dr3 is not None
    assert dr3.start_year == 2019
    assert dr3.start_month == 3
    assert dr3.end_year == 2022
    assert dr3.end_month == 5

def test_parse_text_stellar():
    path = os.path.join(FIXTURES_DIR, "good_senior_swe.txt")
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()
    parsed = ResumeParser.parse_txt(text)
    assert parsed.word_count > 150
    assert "alex.chen@example.com" in parsed.emails
    assert len(parsed.bullet_points) >= 6
    assert "experience" in parsed.sections
    assert "education" in parsed.sections
    assert "skills" in parsed.sections

def test_parse_docx_tables():
    path = os.path.join(FIXTURES_DIR, "table_resume.docx")
    with open(path, "rb") as f:
        data = f.read()
    parsed = ResumeParser.parse_docx(data)
    assert parsed.has_tables is True
    assert "marcus@rome.org" in parsed.emails
    assert "Product Lead" in parsed.raw_text

def test_parse_pdf_scanned_and_multicolumn():
    # Scanned PDF
    scan_path = os.path.join(FIXTURES_DIR, "scanned_like.pdf")
    with open(scan_path, "rb") as f:
        scan_data = f.read()
    parsed_scan = ResumeParser.parse_pdf(scan_data)
    assert parsed_scan.has_images is True
    assert parsed_scan.is_scanned is True

    # Multi-column PDF
    two_col_path = os.path.join(FIXTURES_DIR, "two_column.pdf")
    with open(two_col_path, "rb") as f:
        col_data = f.read()
    parsed_col = ResumeParser.parse_pdf(col_data)
    assert parsed_col.pages >= 1
    assert len(parsed_col.raw_text) > 0
