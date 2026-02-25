import random
import csv

# ---------- Configuration ----------
num_records = 9000
output_file = "students_resume_dataset.csv"

first_names = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Reyansh", "Ayaan", "Krishna",
               "Ishaan", "Shaurya", "Ananya", "Diya", "Aadhya", "Riya", "Priya", "Sara",
               "Meera", "Anika", "Kavya", "Navya"]

last_names = ["Sharma", "Verma", "Patel", "Reddy", "Gupta", "Mehta", "Nair",
              "Rao", "Shah", "Iyer", "Singh", "Khan", "Das", "Joshi"]

educations = [
    "B.Tech Computer Science",
    "B.Tech Information Technology",
    "BCA",
    "MCA",
    "B.Sc Computer Science",
    "M.Tech Computer Science",
    "B.Sc Data Science",
    "MBA IT",
    "B.E Software Engineering"
]

skills_pool = [
    "Python", "Java", "C++", "SQL", "Machine Learning", "Data Analysis",
    "React", "Node.js", "Django", "Flask", "HTML", "CSS",
    "Power BI", "Tableau", "AWS", "Azure", "Docker", "Kubernetes",
    "TensorFlow", "Pandas", "NumPy", "Git"
]

projects_pool = [
    "E-commerce Website",
    "Student Management System",
    "Chat Application",
    "AI Chatbot",
    "Sales Prediction Model",
    "Face Recognition System",
    "Portfolio Website",
    "Online Exam System",
    "Weather Forecast App",
    "Banking System"
]

certifications_pool = [
    "AWS Certified Cloud Practitioner",
    "Microsoft Azure Fundamentals",
    "Google Data Analytics Certificate",
    "Oracle Java Certification",
    "Certified Kubernetes Associate",
    "TensorFlow Developer Certificate",
    "Cisco Networking Certification",
    "Red Hat Certified Engineer",
    "None"
]

# ---------- Generate CSV ----------
with open(output_file, mode='w', newline='', encoding='utf-8') as file:
    writer = csv.writer(file)
    
    # Header
    writer.writerow(["Name", "Education", "Skills", "Projects", "Experience Years", "Certification"])
    
    for _ in range(num_records):
        name = random.choice(first_names) + " " + random.choice(last_names)
        education = random.choice(educations)
        skills = ", ".join(random.sample(skills_pool, random.randint(3, 6)))
        projects = ", ".join(random.sample(projects_pool, random.randint(1, 3)))
        experience = round(random.uniform(0, 5), 1)  # 0–5 years
        certification = random.choice(certifications_pool)
        
        writer.writerow([name, education, skills, projects, experience, certification])

print(f"✅ Dataset with {num_records} records created successfully!")