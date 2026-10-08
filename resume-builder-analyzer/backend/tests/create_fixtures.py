import os
import docx
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from PIL import Image

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")
os.makedirs(FIXTURES_DIR, exist_ok=True)

def generate_fixtures():
    # 1. Stellar Senior SWE (Score expected: 85 - 100)
    stellar = """ALEX CHEN
San Francisco, CA | alex.chen@example.com | (555) 234-5678 | linkedin.com/in/alexchen-dev | github.com/alexchen

PROFESSIONAL SUMMARY
Results-focused Lead Software Engineer with 8+ years architecting high-scale distributed systems and cloud platforms. Proven track record boosting system throughput by 45% and reducing infrastructure overhead by $120,000 annually.

WORK EXPERIENCE
Staff Software Engineer | Acme Corp (Jan 2022 – Present)
• Architected a high-throughput microservices backend in Go and Kubernetes, scaling to 45,000 requests per second with 99.99% uptime.
• Spearheaded the cloud migration from monolithic architecture to AWS ECS, reducing AWS infrastructure expenditure by $140,000 annually.
• Mentored 12 junior and mid-level engineers, leading weekly design reviews and improving sprint velocity by 28%.
• Optimized PostgreSQL query performance and caching strategies with Redis, decreasing P99 latency by 35%.

Senior Software Engineer | FinTech Systems (Mar 2018 – Dec 2021)
• Engineered automated fraud detection pipeline processing $40M daily transactional volume in real time.
• Deployed real-time payment reconciliation service in Python and FastAPI, reducing payment discrepancies by 62%.
• Built automated CI/CD deployment pipelines using GitHub Actions and Docker, reducing release deployment cycle time from 4 hours to 8 minutes.
• Authored comprehensive API documentation and developer SDKs adopted by over 200 partner engineering teams.

KEY PROJECTS
Distributed Task Queue | github.com/alexchen/dist-queue
• Designed fault-tolerant distributed queue processing 10,000 messages per second with Kafka and Go.

EDUCATION
Bachelor of Science in Computer Science | Stanford University (2014 – 2018)
• GPA: 3.8 / 4.0

TECHNICAL SKILLS
Languages: Python, Go, TypeScript, SQL, Bash
Frameworks & Platforms: FastAPI, React, Node.js, Docker, Kubernetes, AWS, PostgreSQL, Redis, Kafka
Practices: Microservices, System Architecture, CI/CD, Agile Scrum
"""
    with open(os.path.join(FIXTURES_DIR, "good_senior_swe.txt"), "w", encoding="utf-8") as f:
        f.write(stellar)

    # 2. Weak Passive Junior (Score expected: < 60)
    weak = """JOHN DOE
john@email.com

ABOUT ME
I am a hard worker and results-driven team player looking to think outside the box as a rockstar developer.

EXPERIENCE
Developer | Local Startup (2022 - 2023)
• Responsible for working on the website front end.
• Duties included bug fixing and assisting senior devs with tasks.
• Helped to write some code in JavaScript and HTML.
• Worked on various customer support issues and tickets.

EDUCATION
College (2018 - 2022)
Studied computers and math.
"""
    with open(os.path.join(FIXTURES_DIR, "weak_passive_junior.txt"), "w", encoding="utf-8") as f:
        f.write(weak)

    # 3. Employment Gap (Gap > 6 months between 2020 and 2022)
    gap = """SARAH CONNER
sarah@conner.com | 555-019-2834 | linkedin.com/in/sarah-conner

SUMMARY
Experienced DevOps Engineer with focus on Kubernetes and Terraform automation.

WORK EXPERIENCE
DevOps Engineer | CloudCorp (Feb 2022 – Present)
• Automated deployment pipelines utilizing Terraform and AWS, decreasing incident resolution time by 30%.
• Deployed 15 multi-region Kubernetes clusters supporting 200,000 monthly active users.

Systems Administrator | OldTech Inc (Jan 2018 – Jan 2020)
• Managed on-premises Linux server infrastructure and automated backup workflows.
• Maintained 99.9% server uptime across 50 dedicated physical nodes.

EDUCATION
BS in Information Technology | State University (2014 – 2018)

SKILLS
AWS, Docker, Kubernetes, Linux, Terraform, Python
"""
    with open(os.path.join(FIXTURES_DIR, "employment_gap.txt"), "w", encoding="utf-8") as f:
        f.write(gap)

    # 4. Wrong Chronological Order
    wrong_order = """EMILY BLUNT
emily@blunt.org | (555) 345-9876 | linkedin.com/in/emily-blunt

SUMMARY
Full Stack Engineer specializing in TypeScript and React.

WORK EXPERIENCE
Junior Engineer | Startup Alpha (Jan 2016 – Dec 2018)
• Built responsive landing pages and user onboarding flows.

Senior Engineer | MetaCorp (Jan 2022 – Present)
• Architected scalable web apps driving 50% revenue growth.

EDUCATION
BS Computer Engineering (2012 – 2016)

SKILLS
React, TypeScript, CSS, Node.js
"""
    with open(os.path.join(FIXTURES_DIR, "wrong_order.txt"), "w", encoding="utf-8") as f:
        f.write(wrong_order)

    # 5. Missing Standard Headings (No Work Experience or Education heading)
    missing_heads = """DAVID KIM
david.kim@example.com | 555-888-9999

SUMMARY
Dedicated specialist in product growth and analytics.

THINGS I HAVE DONE
• Boosted user retention by 25% through A/B testing and experimentation.
• Led cross-functional team of 6 analysts.

MY KNOWLEDGE
Python, SQL, Tableau, Google Analytics
"""
    with open(os.path.join(FIXTURES_DIR, "missing_headings.txt"), "w", encoding="utf-8") as f:
        f.write(missing_heads)

    # 6. Sparse Underlength (< 100 words)
    sparse = """BOB SHORT
bob@mail.com
Summary: Developer.
Skills: Python, HTML.
Work: Did programming for small business.
"""
    with open(os.path.join(FIXTURES_DIR, "sparse_short.txt"), "w", encoding="utf-8") as f:
        f.write(sparse)

    # 7. Overly Verbose (> 1200 words)
    verbose_text = """PROFESSOR CHARLES XAVIER
charles@mutant.edu | 555-000-1111 | linkedin.com/in/charles-xavier

SUMMARY
""" + ("Distinguished research scientist and technology leader with decades of multidisciplinary expertise. " * 30) + """

WORK EXPERIENCE
Principal Researcher | Institute (2018 – Present)
""" + ("• Conducted extensive exploratory evaluations and authored comprehensive technical documents analyzing complex systems.\n" * 40) + """

EDUCATION
Doctor of Philosophy in Computer Science | University (2000 – 2005)

SKILLS
Machine Learning, Neural Networks, Research, Python, C++, Data Analysis
"""
    with open(os.path.join(FIXTURES_DIR, "overly_verbose.txt"), "w", encoding="utf-8") as f:
        f.write(verbose_text)

    # 8. DOCX with Tables
    doc = docx.Document()
    doc.add_heading("MARCUS AURELIUS", level=1)
    doc.add_paragraph("marcus@rome.org | 555-123-4567 | linkedin.com/in/marcus")
    doc.add_heading("Summary", level=2)
    doc.add_paragraph("Product manager with 5 years managing enterprise B2B SaaS applications.")
    doc.add_heading("Experience", level=2)
    
    # Add a table
    table = doc.add_table(rows=3, cols=3)
    table.cell(0, 0).text = "Role"
    table.cell(0, 1).text = "Company"
    table.cell(0, 2).text = "Dates"
    table.cell(1, 0).text = "Product Lead"
    table.cell(1, 1).text = "SaaS Inc"
    table.cell(1, 2).text = "2021 - Present"
    table.cell(2, 0).text = "Associate PM"
    table.cell(2, 1).text = "Tech LLC"
    table.cell(2, 2).text = "2019 - 2021"
    
    doc.add_paragraph("• Delivered 3 major feature releases on time, increasing enterprise conversion by 30%.")
    doc.add_heading("Education", level=2)
    doc.add_paragraph("BA in Economics, Harvard University (2015 – 2019)")
    doc.add_heading("Skills", level=2)
    doc.add_paragraph("Agile, Product Roadmap, SQL, Figma, Jira")
    doc.save(os.path.join(FIXTURES_DIR, "table_resume.docx"))

    # 9. Two-Column PDF
    pdf_path = os.path.join(FIXTURES_DIR, "two_column.pdf")
    c = canvas.Canvas(pdf_path, pagesize=letter)
    # Left column (x=50)
    c.drawString(50, 750, "Jane Developer")
    c.drawString(50, 730, "jane@example.com | 555-909-1234")
    c.drawString(50, 700, "EXPERIENCE")
    c.drawString(50, 680, "Software Engineer at Tech Corp")
    c.drawString(50, 660, "• Built scalable REST APIs in Python.")
    c.drawString(50, 640, "• Optimized DB queries by 25%.")
    c.drawString(50, 610, "EDUCATION")
    c.drawString(50, 590, "BS in CS, Univ of Tech (2018-2022)")
    
    # Right column (x=350)
    c.drawString(350, 700, "SKILLS")
    c.drawString(350, 680, "Python, Django, PostgreSQL")
    c.drawString(350, 660, "Docker, Git, CI/CD")
    c.drawString(350, 630, "PROJECTS")
    c.drawString(350, 610, "Portfolio site with 10k visits")
    c.drawString(350, 590, "CERTIFICATIONS")
    c.drawString(350, 570, "AWS Certified Developer (2023)")
    c.save()

    # 10. Scanned-like PDF (page has an image and very little text)
    scanned_path = os.path.join(FIXTURES_DIR, "scanned_like.pdf")
    # Create a small temp image
    img_path = os.path.join(FIXTURES_DIR, "temp_img.png")
    img = Image.new("RGB", (200, 200), color=(73, 109, 137))
    img.save(img_path)
    
    c_scan = canvas.Canvas(scanned_path, pagesize=letter)
    c_scan.drawImage(img_path, 100, 300, width=400, height=400)
    c_scan.drawString(100, 250, "Scanned Image Resume Page")
    c_scan.save()
    if os.path.exists(img_path):
        os.remove(img_path)

if __name__ == "__main__":
    generate_fixtures()
    print("All 10 sample resume fixtures created successfully in tests/fixtures/")
