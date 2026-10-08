import os
import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine

client = TestClient(app)

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "version" in data

def test_auth_workflow():
    # Register
    email = "testuser@example.com"
    pwd = "StrongPassword123!"
    reg_res = client.post("/api/auth/register", json={"email": email, "password": pwd})
    if reg_res.status_code == 400:
        # Already registered from previous run
        pass
    else:
        assert reg_res.status_code == 201
        data = reg_res.json()
        assert "access_token" in data
        assert "refresh_token" in data

    # Login
    login_res = client.post("/api/auth/login", json={"email": email, "password": pwd})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    refresh_token = login_res.json()["refresh_token"]

    # Me
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email

    # Refresh
    ref_res = client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert ref_res.status_code == 200
    assert "access_token" in ref_res.json()

def test_analyze_file_endpoint():
    path = os.path.join(FIXTURES_DIR, "good_senior_swe.txt")
    with open(path, "rb") as f:
        file_bytes = f.read()

    res = client.post(
        "/api/analyze",
        files={"file": ("good_senior_swe.txt", file_bytes, "text/plain")},
        data={"job_description": "We need a Senior Go and Kubernetes engineer", "use_ai": "false"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["overall_score"] >= 80.0
    assert "ATS Compatibility" in data["category_scores"]
    assert "Job Match" in data["category_scores"]
    assert len(data["issues"]) >= 0

def test_analyze_json_endpoint():
    payload = {
        "resume_data": {
            "contact": {
                "full_name": "Jane Tester",
                "email": "jane@example.com",
                "phone": "555-123-4567",
                "job_title": "Full Stack Engineer"
            },
            "summary": "Full Stack Engineer with 5 years building scalable web applications.",
            "experience": [
                {
                    "company": "Tech Corp",
                    "title": "Senior Engineer",
                    "start_date": "2021",
                    "end_date": "Present",
                    "current": True,
                    "bullets": [
                        "Architected backend microservices in Python and FastAPI, serving 1M daily requests.",
                        "Optimized database indexing in PostgreSQL, reducing query latency by 40%."
                    ]
                }
            ],
            "skills": [
                {"name": "Python", "level": 90},
                {"name": "FastAPI", "level": 85},
                {"name": "React", "level": 80}
            ]
        },
        "job_description": "Looking for a Python and FastAPI engineer",
        "use_ai": False
    }
    res = client.post("/api/analyze/json", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["overall_score"] > 60.0
    assert "Job Match" in data["category_scores"]

def test_analyze_errors():
    # Unsupported format (.exe) -> 415
    res415 = client.post(
        "/api/analyze",
        files={"file": ("malicious.exe", b"MZbinary", "application/octet-stream")}
    )
    assert res415.status_code == 415

    # Empty file -> 422
    res422 = client.post(
        "/api/analyze",
        files={"file": ("empty.txt", b"", "text/plain")}
    )
    assert res422.status_code == 422

    # File > 5MB -> 413
    big_bytes = b"0" * (5 * 1024 * 1024 + 1024)
    res413 = client.post(
        "/api/analyze",
        files={"file": ("huge.txt", big_bytes, "text/plain")}
    )
    assert res413.status_code == 413

def test_resume_builder_crud_and_docx_export():
    # Create resume
    create_payload = {
        "title": "My Awesome Resume",
        "template_id": "modern-two-column",
        "accent_color": "#2563eb",
        "font_family": "Inter",
        "data": {
            "contact": {"full_name": "Dev User", "email": "dev@user.com"},
            "summary": "Skilled developer.",
            "skills": [{"name": "JavaScript", "level": 90}]
        }
    }
    res = client.post("/api/resumes", json=create_payload)
    assert res.status_code == 201
    created = res.json()
    resume_id = created["id"]
    assert created["title"] == "My Awesome Resume"

    # Get resume
    get_res = client.get(f"/api/resumes/{resume_id}")
    assert get_res.status_code == 200
    assert get_res.json()["data"]["contact"]["full_name"] == "Dev User"

    # Update resume (autosave)
    up_res = client.put(f"/api/resumes/{resume_id}", json={"title": "Updated Resume Title"})
    assert up_res.status_code == 200
    assert up_res.json()["title"] == "Updated Resume Title"

    # Export docx
    docx_res = client.post("/api/resumes/export/docx", json=create_payload["data"])
    assert docx_res.status_code == 200
    assert docx_res.headers["content-type"] == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    assert len(docx_res.content) > 1000
