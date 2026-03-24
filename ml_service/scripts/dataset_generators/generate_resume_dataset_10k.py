import pandas as pd
import random
from faker import Faker
from pathlib import Path

fake = Faker("en_IN")

educations = [
    "B.Tech Computer Science",
    "B.Tech Information Technology",
    "BCA",
    "MCA",
    "B.Sc Data Science",
    "M.Tech AI",
    "MBA Marketing",
    "MBA Finance",
    "B.Com",
    "B.Tech Mechanical"
]

skills_pool = [
    "Python", "Java", "C++", "Django", "Flask",
    "React", "Node.js", "Machine Learning",
    "Deep Learning", "NLP", "SQL", "MongoDB",
    "AWS", "Docker", "Kubernetes", "Linux",
    "Excel", "Power BI", "Tableau",
    "Spring Boot", "Firebase"
]

projects_pool = [
    "Developed scalable REST API for job portal",
    "Built end-to-end machine learning prediction system",
    "Designed responsive web dashboard",
    "Implemented CI/CD pipeline on AWS",
    "Created Android expense tracker application",
    "Built customer churn prediction model",
    "Developed AI-based resume analyzer",
    "Designed cloud-based microservices architecture"
]

certifications_pool = [
    "AWS Certified Developer",
    "Google Data Analytics Certification",
    "Oracle Java Certification",
    "Meta Frontend Developer",
    "TensorFlow Developer Certificate",
    "IBM Data Science Professional",
    "Microsoft Azure Fundamentals",
    "Docker Certified Associate"
]

interests_pool = [
    "Artificial Intelligence", "Cloud Computing",
    "Backend Development", "Frontend Development",
    "Cyber Security", "Data Analysis",
    "Product Management", "Automation"
]

hobbies_pool = [
    "Cricket", "Football", "Reading",
    "Gaming", "Blogging", "Music",
    "Travelling", "Photography"
]

def generate_record():
    name = fake.name()
    education = random.choice(educations)
    skills = "; ".join(random.sample(skills_pool, random.randint(4, 7)))
    interests = "; ".join(random.sample(interests_pool, 2))
    hobbies = "; ".join(random.sample(hobbies_pool, 2))
    projects = "; ".join(random.sample(projects_pool, random.randint(1, 3)))
    certification = random.choice(certifications_pool)
    age = random.randint(21, 35)
    gender = random.choice(["Male", "Female"])
    experience_years = random.randint(0, 7)

    return [
        name, education, skills, interests,
        hobbies, projects, certification,
        age, gender, experience_years
    ]


data = []

for _ in range(10000):
    data.append(generate_record())

columns = [
    "name", "education", "skills", "interest",
    "hobby", "projects", "certification",
    "age", "gender", "experience_years"
]

df = pd.DataFrame(data, columns=columns)
output_path = Path(__file__).resolve().parents[2] / "data" / "datasets" / "resume_dataset_10k.csv"
output_path.parent.mkdir(parents=True, exist_ok=True)

df.to_csv(output_path, index=False)

print("✅ 10,000 realistic resumes generated → resume_dataset_10k.csv")
