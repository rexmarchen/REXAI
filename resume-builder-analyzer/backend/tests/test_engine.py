import os
import pytest
from app.services.parser import ResumeParser
from app.services.engine import AnalyzerEngine

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")

@pytest.fixture
def engine():
    return AnalyzerEngine()

def test_stellar_resume_score_range(engine):
    with open(os.path.join(FIXTURES_DIR, "good_senior_swe.txt"), "r", encoding="utf-8") as f:
        parsed = ResumeParser.parse_txt(f.read())
    result = engine.analyze(parsed)
    # High quality resume should score in A/A+ range (>= 85)
    assert result.overall_score >= 85.0
    assert result.grade in ["A", "A+"]
    assert result.category_scores["ATS Compatibility"].score >= 90.0
    assert result.category_scores["Content Quality"].score >= 85.0

def test_weak_resume_score_range(engine):
    with open(os.path.join(FIXTURES_DIR, "weak_passive_junior.txt"), "r", encoding="utf-8") as f:
        parsed = ResumeParser.parse_txt(f.read())
    result = engine.analyze(parsed)
    # Weak resume with clichés, passive voice, and no metrics should score <= 65
    assert result.overall_score <= 65.0
    assert result.grade in ["C", "D", "F"]
    
    # Check that weak phrases and buzzwords were flagged
    issue_msgs = [i.message for i in result.issues]
    assert any("Weak, passive phrasing" in m for m in issue_msgs)
    assert any("clichés or buzzwords" in m for m in issue_msgs)
    assert any("First-person pronouns" in m for m in issue_msgs)

def test_employment_gap_detected(engine):
    with open(os.path.join(FIXTURES_DIR, "employment_gap.txt"), "r", encoding="utf-8") as f:
        parsed = ResumeParser.parse_txt(f.read())
    result = engine.analyze(parsed)
    issue_msgs = [i.message for i in result.issues]
    assert any("Employment gap" in m for m in issue_msgs)

def test_wrong_chronological_order_detected(engine):
    with open(os.path.join(FIXTURES_DIR, "wrong_order.txt"), "r", encoding="utf-8") as f:
        parsed = ResumeParser.parse_txt(f.read())
    result = engine.analyze(parsed)
    issue_msgs = [i.message for i in result.issues]
    assert any("reverse-chronological" in m for m in issue_msgs)

def test_missing_headings_detected(engine):
    with open(os.path.join(FIXTURES_DIR, "missing_headings.txt"), "r", encoding="utf-8") as f:
        parsed = ResumeParser.parse_txt(f.read())
    result = engine.analyze(parsed)
    issue_msgs = [i.message for i in result.issues]
    assert any("Missing standard" in m for m in issue_msgs)

def test_sparse_underlength_penalized(engine):
    with open(os.path.join(FIXTURES_DIR, "sparse_short.txt"), "r", encoding="utf-8") as f:
        parsed = ResumeParser.parse_txt(f.read())
    result = engine.analyze(parsed)
    issue_msgs = [i.message for i in result.issues]
    assert any("too brief" in m for m in issue_msgs)
    assert result.category_scores["Format"].score <= 75.0

def test_table_resume_docx_penalized(engine):
    with open(os.path.join(FIXTURES_DIR, "table_resume.docx"), "rb") as f:
        parsed = ResumeParser.parse_docx(f.read())
    result = engine.analyze(parsed)
    issue_msgs = [i.message for i in result.issues]
    assert any("Embedded tables detected" in m for m in issue_msgs)

def test_scanned_pdf_penalized(engine):
    with open(os.path.join(FIXTURES_DIR, "scanned_like.pdf"), "rb") as f:
        parsed = ResumeParser.parse_pdf(f.read())
    result = engine.analyze(parsed)
    issue_msgs = [i.message for i in result.issues]
    assert any("scanned image" in m for m in issue_msgs)
    assert result.category_scores["ATS Compatibility"].score <= 50.0

def test_job_description_matching_and_renormalization(engine):
    with open(os.path.join(FIXTURES_DIR, "good_senior_swe.txt"), "r", encoding="utf-8") as f:
        parsed = ResumeParser.parse_txt(f.read())
    
    # 1. Without JD (renormalized across 5 categories)
    res_no_jd = engine.analyze(parsed, None)
    assert "Job Match" not in res_no_jd.category_scores
    assert len(res_no_jd.category_scores) == 5
    weight_sum = sum(c.weight for c in res_no_jd.category_scores.values())
    assert abs(weight_sum - 1.0) < 0.01

    # 2. With JD (6 categories, Job Match included)
    jd = "Seeking a Senior Cloud Engineer skilled in Go, Kubernetes, AWS, Kafka, and Rust."
    res_jd = engine.analyze(parsed, jd)
    assert "Job Match" in res_jd.category_scores
    assert res_jd.category_scores["Job Match"].weight == 0.25
    assert len(res_jd.job_match.matched_skills) > 0
    assert "Rust" in res_jd.job_match.missing_skills or "rust" in [s.lower() for s in res_jd.job_match.missing_skills]

def test_deterministic_scoring(engine):
    with open(os.path.join(FIXTURES_DIR, "good_senior_swe.txt"), "r", encoding="utf-8") as f:
        text = f.read()
    p1 = ResumeParser.parse_txt(text)
    p2 = ResumeParser.parse_txt(text)
    r1 = engine.analyze(p1, "Senior Python Developer with FastAPI and Docker")
    r2 = engine.analyze(p2, "Senior Python Developer with FastAPI and Docker")
    assert r1.overall_score == r2.overall_score
    assert len(r1.issues) == len(r2.issues)
