import pandas as pd
import random
from pathlib import Path

roles = ["Software Engineer", "Data Scientist", "Web Developer", "DevOps Engineer"]

skills_map = {
    "Software Engineer": ["Java", "C++", "Python", "DSA", "OOP", "System Design"],
    "Data Scientist": ["Python", "Pandas", "Machine Learning", "NLP", "Deep Learning"],
    "Web Developer": ["HTML", "CSS", "JavaScript", "React", "Node.js"],
    "DevOps Engineer": ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux"]
}

projects_map = {
    "Software Engineer": ["Built REST API", "Developed backend system", "Optimized algorithms"],
    "Data Scientist": ["Built ML model", "NLP pipeline", "Prediction system"],
    "Web Developer": ["Created web app", "Designed UI", "Full-stack project"],
    "DevOps Engineer": ["CI/CD pipeline", "Cloud deployment", "Containerized app"]
}

seniority_levels = ["Junior", "Mid", "Senior"]

def generate_resume(role):
    skills = random.sample(skills_map[role], 3)
    project = random.choice(projects_map[role])
    exp = random.randint(0, 5)
    seniority = "Junior" if exp <= 1 else "Mid" if exp <= 3 else "Senior"

    text = f"Experienced in {', '.join(skills)}. Worked on {project}. {exp} years of experience."

    return text, exp, seniority


data = []

resume_id = 1

# 1500 per role = 6000 total
for role in roles:
    for _ in range(1500):
        text, exp, seniority = generate_resume(role)

        data.append({
            "resume_id": resume_id,
            "resume_text": text,
            "target_role": role,
            "years_experience": exp,
            "seniority": seniority
        })

        resume_id += 1


df = pd.DataFrame(data)
output_path = Path(__file__).resolve().parents[2] / "data" / "datasets" / "resume_dataset.csv"
output_path.parent.mkdir(parents=True, exist_ok=True)

# Save CSV
df.to_csv(output_path, index=False)

print("✅ Dataset generated: resume_dataset.csv (6000 samples)")
