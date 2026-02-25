import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
from sklearn.model_selection import train_test_split
import hashlib

# Set seed for reproducibility
random.seed(42)
np.random.seed(42)

# Number of records
num_records = 9000

# Define role categories for filtering
tech_roles = ['Software Engineer', 'Data Scientist', 'Web Developer', 'Machine Learning Engineer', 'DevOps Engineer', 'UX Designer']
engineering_roles = ['Civil Engineer', 'Mechanical Engineer', 'Electrical Engineer']
business_roles = ['Product Manager', 'Business Analyst', 'Marketing Specialist', 'Financial Analyst', 'HR Generalist']
research_roles = ['Research Scientist']

# City to state mapping
city_to_state = {
    'Mumbai': 'Maharashtra',
    'Delhi': 'Delhi', 
    'Bangalore': 'Karnataka',
    'Hyderabad': 'Telangana',
    'Chennai': 'Tamil Nadu',
    'Kolkata': 'West Bengal',
    'Pune': 'Maharashtra',
    'Ahmedabad': 'Gujarat',
    'Jaipur': 'Rajasthan',
    'Lucknow': 'Uttar Pradesh'
}

# Real Indian Universities/Colleges by category
IITs = ['IIT Bombay', 'IIT Delhi', 'IIT Madras', 'IIT Kanpur', 'IIT Kharagpur', 
        'IIT Roorkee', 'IIT Guwahati', 'IIT Hyderabad', 'IIT Indore', 'IIT BHU']

NITs = ['NIT Trichy', 'NIT Surathkal', 'NIT Warangal', 'NIT Calicut', 'NIT Durgapur',
        'NIT Rourkela', 'NIT Jaipur', 'NIT Allahabad']

IIITs = ['IIIT Hyderabad', 'IIIT Bangalore', 'IIIT Delhi', 'IIIT Lucknow', 'IIIT Pune']

IIMs = ['IIM Ahmedabad', 'IIM Bangalore', 'IIM Calcutta', 'IIM Lucknow', 'IIM Kozhikode',
        'IIM Indore', 'IIM Shillong', 'IIM Udaipur', 'IIM Trichy', 'IIM Raipur']

Private_Engineering = ['BITS Pilani', 'VIT Vellore', 'SRM University', 'Manipal University',
                       'Thapar University', 'LPU', 'Amity University', 'Shiv Nadar University']

Central_Universities = ['Delhi University', 'JNU', 'BHU', 'Hyderabad University', 'Pune University',
                        'Mumbai University', 'Calcutta University', 'Madras University']

Private_Universities = ['Christ University', 'Symbiosis International', 'Ashoka University',
                        'NMIMS', 'Xavier\'s Mumbai', 'St. Stephens Delhi']

# Real companies for internships
Tech_Companies = ['Google', 'Microsoft', 'Amazon', 'Flipkart', 'Uber', 'Ola', 'Swiggy',
                  'Zomato', 'Paytm', 'PhonePe', 'Razorpay', 'Freshworks', 'InMobi',
                  'Directi', 'Dream11', 'CRED', 'Unacademy', 'BYJU\'S', 'UpGrad']

MNCs = ['Deloitte', 'PwC', 'EY', 'KPMG', 'Accenture', 'TCS', 'Infosys', 'Wipro',
        'Cognizant', 'Capgemini', 'IBM', 'Oracle', 'Cisco', 'VMware', 'SAP']

Startups = ['Razorpay', 'CRED', 'Groww', 'Zerodha', 'Ola Electric', 'Rivigo',
            'BlackBuck', 'Unacademy', 'PhysicsWallah', 'Meesho', 'ShareChat']

Core_Companies = ['L&T', 'Reliance', 'Tata Motors', 'Mahindra', 'Bajaj Auto',
                  'Siemens', 'Bosch', 'Schneider Electric', 'ABB', 'Samsung']

Premium_Companies = ['Google', 'Microsoft', 'Amazon', 'Goldman Sachs', 'McKinsey', 'BCG']

# Real Indian student names
first_names_male = ['Aarav', 'Vihaan', 'Vivaan', 'Advik', 'Kabir', 'Arjun', 'Reyansh', 
                    'Ayaan', 'Atharv', 'Sai', 'Krishna', 'Ishaan', 'Shaurya', 'Rohan',
                    'Rahul', 'Amit', 'Saurabh', 'Nikhil', 'Kunal', 'Pranav', 'Abhishek']

first_names_female = ['Ananya', 'Diya', 'Advika', 'Anika', 'Aaradhya', 'Saanvi', 'Ira',
                      'Myra', 'Jhanvi', 'Navya', 'Prisha', 'Sara', 'Alisha', 'Anjali',
                      'Neha', 'Priya', 'Riya', 'Shreya', 'Tanvi', 'Vidhi', 'Ishita']

last_names = ['Sharma', 'Verma', 'Gupta', 'Kumar', 'Singh', 'Patel', 'Reddy', 'Rao',
              'Yadav', 'Jha', 'Sinha', 'Das', 'Ghosh', 'Chatterjee', 'Mukherjee',
              'Joshi', 'Deshmukh', 'Patil', 'Kulkarni', 'Nair', 'Menon', 'Pillai']

# Define roles with balanced distribution
roles = [
    'Software Engineer',
    'Data Scientist', 
    'Web Developer',
    'Machine Learning Engineer',
    'DevOps Engineer',
    'Product Manager',
    'Business Analyst',
    'Marketing Specialist',
    'Civil Engineer',
    'Mechanical Engineer',
    'Electrical Engineer',
    'Research Scientist',
    'Financial Analyst',
    'HR Generalist',
    'UX Designer'
]

# Role weights for balanced distribution
role_weights = [1/len(roles)] * len(roles)

# Role to major mapping
role_major_map = {
    'Software Engineer': ['Computer Science', 'Information Technology', 'Software Engineering'],
    'Data Scientist': ['Data Science', 'Computer Science', 'Statistics', 'Mathematics'],
    'Web Developer': ['Computer Science', 'Information Technology', 'Web Development'],
    'Machine Learning Engineer': ['AI/ML', 'Computer Science', 'Data Science'],
    'DevOps Engineer': ['Computer Science', 'Information Technology', 'Cloud Computing'],
    'Product Manager': ['MBA', 'Computer Science', 'Business Administration'],
    'Business Analyst': ['MBA', 'Business Analytics', 'Economics', 'Statistics'],
    'Marketing Specialist': ['Marketing', 'Mass Communication', 'Business Administration'],
    'Civil Engineer': ['Civil Engineering', 'Construction Technology'],
    'Mechanical Engineer': ['Mechanical Engineering', 'Automobile Engineering'],
    'Electrical Engineer': ['Electrical Engineering', 'Electronics Engineering'],
    'Research Scientist': ['Physics', 'Chemistry', 'Biotechnology'],
    'Financial Analyst': ['Finance', 'Economics', 'Commerce'],
    'HR Generalist': ['HR Management', 'Psychology', 'Business Administration'],
    'UX Designer': ['Design', 'HCI', 'Fine Arts']
}

# Skills by role (expanded for better representation)
role_skills = {
    'Software Engineer': ['Python', 'Java', 'C++', 'Data Structures', 'Algorithms', 'SQL', 'Git', 'Docker', 'Microservices', 'REST APIs'],
    'Data Scientist': ['Python', 'R', 'SQL', 'Machine Learning', 'Statistics', 'TensorFlow', 'Tableau', 'Pandas', 'NumPy', 'Data Visualization'],
    'Web Developer': ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'MongoDB', 'Express', 'Git', 'TypeScript', 'Redux'],
    'Machine Learning Engineer': ['Python', 'TensorFlow', 'PyTorch', 'Computer Vision', 'NLP', 'Scikit-learn', 'Keras', 'Deep Learning', 'MLOps'],
    'DevOps Engineer': ['Docker', 'Kubernetes', 'Jenkins', 'AWS', 'Linux', 'Terraform', 'Ansible', 'Git', 'CI/CD', 'Monitoring'],
    'Product Manager': ['Product Strategy', 'Market Research', 'Analytics', 'Agile', 'JIRA', 'Wireframing', 'MVP Development', 'User Stories'],
    'Business Analyst': ['Excel', 'SQL', 'Tableau', 'Power BI', 'Data Analysis', 'Requirements Gathering', 'Visio', 'Stakeholder Management'],
    'Marketing Specialist': ['SEO', 'Social Media', 'Content Marketing', 'Google Analytics', 'Email Marketing', 'Brand Management', 'PPC'],
    'Civil Engineer': ['AutoCAD', 'STAAD Pro', 'Revit', 'Project Management', 'Structural Analysis', 'Surveying', 'Construction Management'],
    'Mechanical Engineer': ['AutoCAD', 'SolidWorks', 'CATIA', 'Thermodynamics', 'Fluid Mechanics', 'Manufacturing', 'FEA'],
    'Electrical Engineer': ['MATLAB', 'Simulink', 'Circuit Design', 'Power Systems', 'PLC', 'Embedded Systems', 'VLSI'],
    'Research Scientist': ['Research Methodology', 'Data Analysis', 'Lab Techniques', 'Technical Writing', 'Python', 'R', 'Grant Writing'],
    'Financial Analyst': ['Financial Modeling', 'Excel', 'Valuation', 'Accounting', 'Bloomberg', 'Python', 'Risk Analysis'],
    'HR Generalist': ['Recruitment', 'Employee Relations', 'Performance Management', 'HR Policies', 'Excel', 'Communication', 'Training'],
    'UX Designer': ['Figma', 'Sketch', 'Adobe XD', 'User Research', 'Wireframing', 'Prototyping', 'Usability Testing', 'Information Architecture']
}

# Certifications by role
role_certifications = {
    'Software Engineer': ['AWS Certified Developer', 'Microsoft Certified: Azure Developer', 'Oracle Certified Professional', 'Google Cloud Developer'],
    'Data Scientist': ['TensorFlow Developer Certificate', 'AWS Certified Data Analytics', 'IBM Data Science Professional', 'SAS Certified Specialist'],
    'Web Developer': ['Meta Front-End Developer', 'AWS Certified Cloud Practitioner', 'Google UX Design', 'MongoDB Certification'],
    'Machine Learning Engineer': ['TensorFlow Developer Certificate', 'AWS Certified Machine Learning', 'NVIDIA DLI Certifications', 'Azure AI Engineer'],
    'DevOps Engineer': ['AWS Certified DevOps Engineer', 'Certified Kubernetes Administrator', 'Docker Certified Associate', 'HashiCorp Certification'],
    'Product Manager': ['Certified Scrum Product Owner', 'Pragmatic Institute Certification', 'Google Project Management', 'Product School Certification'],
    'Business Analyst': ['IIBA Entry Certificate', 'Certified Business Analysis Professional', 'Google Data Analytics', 'Tableau Certification'],
    'Marketing Specialist': ['Google Analytics Certification', 'HubSpot Content Marketing', 'Facebook Blueprint', 'SEMrush Certification'],
    'Civil Engineer': ['AutoCAD Certified Professional', 'Project Management Professional', 'LEED Green Associate', 'OSHA Certification'],
    'Mechanical Engineer': ['SolidWorks Certified Professional', 'CATIA Certified', 'Six Sigma Green Belt', 'ASME Certification'],
    'Electrical Engineer': ['MATLAB Certified', 'Certified Automation Professional', 'PLC Programming Certificate', 'IEEE Certification'],
    'Research Scientist': ['Good Laboratory Practices', 'Clinical Research Certification', 'Research Ethics Certification', 'ICH Guidelines'],
    'Financial Analyst': ['CFA Level 1', 'Financial Modeling Certificate', 'NSE Certified', 'FRM Certification'],
    'HR Generalist': ['SHRM Certified', 'HRCI Certification', 'LinkedIn Recruiter Certification', 'HR Analytics Certification'],
    'UX Designer': ['Google UX Design Professional', 'NN/g UX Certification', 'Adobe Certified Professional', 'HFI Certification']
}

# Generate the dataset
data = []

print("Generating 9000 production-grade student records...")

for i in range(num_records):
    
    # Basic Information
    student_id = f'STU{str(i+1).zfill(6)}'
    
    # Gender and name
    gender = random.choice(['Male', 'Female'])
    if gender == 'Male':
        first_name = random.choice(first_names_male)
    else:
        first_name = random.choice(first_names_female)
    last_name = random.choice(last_names)
    full_name = f"{first_name} {last_name}"
    
    # Email with domain based on role (for feature engineering)
    if random.random() < 0.3:
        email_domain = 'gmail.com'
    elif random.random() < 0.6:
        email_domain = 'outlook.com'
    else:
        email_domain = 'yahoo.com'
    email = f"{first_name.lower()}.{last_name.lower()}.{random.randint(10,99)}@{email_domain}"
    
    # Phone (Indian format)
    phone = f"+91 {random.randint(7,9)}{random.randint(0,9)}{random.randint(0,9)}-{random.randint(100000,999999)}"
    
    # Date of Birth (18-26 years old)
    age = random.randint(18, 26)
    dob = datetime.now() - timedelta(days=age*365)
    dob_str = dob.strftime('%Y-%m-%d')
    
    # Address
    cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 
              'Ahmedabad', 'Jaipur', 'Lucknow']
    city = random.choice(cities)
    pincode = f"{random.randint(100000, 999999)}"
    
    # Select role with balanced distribution
    role = random.choices(roles, weights=role_weights)[0]
    
    # Education level with realistic distribution
    edu_probs = {
        'Software Engineer': [0.7, 0.25, 0.05, 0.0],
        'Data Scientist': [0.5, 0.35, 0.1, 0.05],
        'Web Developer': [0.8, 0.15, 0.05, 0.0],
        'Machine Learning Engineer': [0.3, 0.5, 0.15, 0.05],
        'DevOps Engineer': [0.75, 0.2, 0.05, 0.0],
        'Product Manager': [0.4, 0.4, 0.2, 0.0],
        'Business Analyst': [0.6, 0.3, 0.1, 0.0],
        'Marketing Specialist': [0.7, 0.25, 0.05, 0.0],
        'Civil Engineer': [0.8, 0.15, 0.05, 0.0],
        'Mechanical Engineer': [0.8, 0.15, 0.05, 0.0],
        'Electrical Engineer': [0.8, 0.15, 0.05, 0.0],
        'Research Scientist': [0.2, 0.4, 0.3, 0.1],
        'Financial Analyst': [0.6, 0.3, 0.1, 0.0],
        'HR Generalist': [0.7, 0.25, 0.05, 0.0],
        'UX Designer': [0.75, 0.2, 0.05, 0.0]
    }
    
    edu_levels = ['Bachelor\'s', 'Master\'s', 'PhD', 'Diploma']
    edu_level = random.choices(edu_levels, weights=edu_probs[role])[0]
    
    # Institution based on role and education level
    if role in tech_roles:
        if edu_level == 'PhD':
            institution = random.choice(IITs + ['IISc Bangalore'])
        elif edu_level == 'Master\'s':
            institution = random.choice(IITs + NITs + IIITs)
        else:
            institution = random.choice(IITs + NITs + IIITs + Private_Engineering)
    elif role in engineering_roles:
        institution = random.choice(IITs + NITs + Private_Engineering + ['COEP Pune', 'Jadavpur University'])
    elif role in business_roles:
        if edu_level == 'Master\'s' or edu_level == 'MBA':
            institution = random.choice(IIMs + ['SP Jain', 'NMIMS', 'XLRI Jamshedpur'])
        else:
            institution = random.choice(Central_Universities + Private_Universities)
    else:
        institution = random.choice(Central_Universities + Private_Universities)
    
    # Major
    major = random.choice(role_major_map[role])
    
    # Graduation year
    current_year = datetime.now().year
    if edu_level == 'PhD':
        graduation_year = random.randint(current_year-2, current_year+2)
    elif edu_level == 'Master\'s':
        graduation_year = random.randint(current_year-1, current_year+1)
    else:
        graduation_year = random.randint(current_year-2, current_year+2)
    
    # GPA (out of 10)
    if any(iit in institution for iit in IITs) or any(iim in institution for iim in IIMs):
        gpa = round(random.uniform(7.0, 9.8), 2)
    else:
        gpa = round(random.uniform(6.0, 9.2), 2)
    
    # Skills (ensure we always have at least 5 skills)
    num_skills = random.randint(6, 10)
    skills_list = random.sample(role_skills[role], min(num_skills, len(role_skills[role])))
    skills = ', '.join(skills_list)
    
    # Skills count (feature for ML)
    skills_count = len(skills_list)
    
    # Programming languages (binary features for ML)
    has_python = 1 if 'Python' in skills_list else 0
    has_java = 1 if 'Java' in skills_list else 0
    has_javascript = 1 if 'JavaScript' in skills_list else 0
    has_sql = 1 if 'SQL' in skills_list else 0
    
    # Projects
    num_projects = random.randint(2, 5)
    projects_list = []
    for p in range(num_projects):
        if role in tech_roles:
            proj_name = random.choice(['E-commerce Platform', 'Social Media App', 'Task Manager', 'Weather App'])
        elif role in engineering_roles:
            proj_name = random.choice(['Bridge Design', 'Building Plan', 'Circuit Design', 'Thermal Analysis'])
        elif role in business_roles:
            proj_name = random.choice(['Market Analysis', 'Financial Model', 'HR Policy', 'Marketing Campaign'])
        else:
            proj_name = random.choice(['Research Paper', 'Lab Experiment', 'Data Collection'])
        projects_list.append(f"{proj_name} - {random.randint(2020, 2024)}")
    projects = ' | '.join(projects_list)
    
    # Internships
    if graduation_year <= current_year:
        # Graduated students
        num_internships = random.choices([1, 2, 3, 4], weights=[0.2, 0.4, 0.3, 0.1])[0]
    else:
        # Current students
        num_internships = random.choices([0, 1, 2], weights=[0.3, 0.5, 0.2])[0]
    
    internship_companies_list = []
    for _ in range(num_internships):
        if role in tech_roles:
            company = random.choice(Tech_Companies + MNCs)
        elif role in engineering_roles:
            company = random.choice(Core_Companies)
        else:
            company = random.choice(MNCs + Startups)
        internship_companies_list.append(company)
    internship_companies = ', '.join(internship_companies_list) if internship_companies_list else 'None'
    
    # Work Experience
    if graduation_year <= current_year:
        work_experience = round((current_year - graduation_year) + random.uniform(0, 0.9), 1)
        work_experience = min(work_experience, 6)
    else:
        work_experience = 0.0
    
    # Experience level (categorical for ML)
    if work_experience == 0:
        exp_level = 'Fresher'
    elif work_experience < 2:
        exp_level = 'Junior'
    elif work_experience < 4:
        exp_level = 'Mid-Level'
    else:
        exp_level = 'Senior'
    
    # Certifications
    num_certs = random.choices([0, 1, 2, 3], weights=[0.3, 0.4, 0.2, 0.1])[0]
    cert_list = []
    if num_certs > 0:
        available_certs = role_certifications[role]
        selected_certs = random.sample(available_certs, min(num_certs, len(available_certs)))
        cert_list = selected_certs
    certifications = ', '.join(cert_list) if cert_list else 'None'
    cert_count = len(cert_list)
    
    # Has certification (binary)
    has_certification = 1 if cert_count > 0 else 0
    
    # GitHub presence (binary)
    has_github = 1 if role in tech_roles and random.random() < 0.8 else 0
    
    # LinkedIn (almost everyone has it)
    has_linkedin = 1 if random.random() < 0.95 else 0
    
    # Expected salary (in Lakhs per annum)
    salary_multiplier = {
        'Bachelor\'s': 1.0,
        'Master\'s': 1.4,
        'PhD': 1.8,
        'Diploma': 0.7
    }
    
    base_salary = {
        'Software Engineer': 8,
        'Data Scientist': 9,
        'Web Developer': 6,
        'Machine Learning Engineer': 12,
        'DevOps Engineer': 10,
        'Product Manager': 15,
        'Business Analyst': 7,
        'Marketing Specialist': 6,
        'Civil Engineer': 5,
        'Mechanical Engineer': 5.5,
        'Electrical Engineer': 6,
        'Research Scientist': 7,
        'Financial Analyst': 8,
        'HR Generalist': 5,
        'UX Designer': 7
    }
    
    expected_salary_lpa = round(base_salary[role] * salary_multiplier[edu_level] * random.uniform(0.9, 1.5), 2)
    
    # Willing to relocate
    willing_to_relocate = 1 if random.random() < 0.7 else 0
    
    # Preferred locations
    preferred_locations_list = random.sample(['Bangalore', 'Mumbai', 'Pune', 'Hyderabad', 'Chennai', 'Delhi-NCR'], 
                                             random.randint(1, 3))
    preferred_locations = ', '.join(preferred_locations_list)
    
    # Premium internship flag
    premium_internship = 1 if any(company in Premium_Companies for company in internship_companies_list) else 0
    
    # Create feature-rich record optimized for ML training
    record = {
        # LABEL (target column)
        'target_role': role,
        
        # IDs (useful for tracking, not for training)
        'student_id': student_id,
        
        # PERSONAL FEATURES
        'age': age,
        'gender': gender,
        'city': city,
        'state': city_to_state.get(city, 'Unknown'),
        'pincode': pincode,
        
        # EDUCATION FEATURES
        'education_level': edu_level,
        'institution': institution,
        'institution_tier': 'Tier-1' if any(iit in institution for iit in IITs) or any(iim in institution for iim in IIMs) else 'Tier-2',
        'major': major,
        'graduation_year': graduation_year,
        'gpa': gpa,
        'gpa_rounded': round(gpa),
        
        # SKILLS FEATURES
        'skills': skills,
        'skills_count': skills_count,
        'has_python': has_python,
        'has_java': has_java,
        'has_javascript': has_javascript,
        'has_sql': has_sql,
        
        # PROJECTS FEATURES
        'projects_count': num_projects,
        'projects': projects,
        
        # INTERNSHIP FEATURES
        'internships_count': num_internships,
        'internship_companies': internship_companies,
        'has_internship': 1 if num_internships > 0 else 0,
        'premium_internship': premium_internship,
        
        # EXPERIENCE FEATURES
        'work_experience_years': work_experience,
        'experience_level': exp_level,
        'has_experience': 1 if work_experience > 0 else 0,
        
        # CERTIFICATION FEATURES
        'certifications': certifications,
        'certifications_count': cert_count,
        'has_certification': has_certification,
        
        # ONLINE PRESENCE FEATURES
        'has_github': has_github,
        'has_linkedin': has_linkedin,
        'online_presence_score': round((has_github + has_linkedin) / 2, 2),
        
        # JOB PREFERENCE FEATURES
        'expected_salary_lpa': expected_salary_lpa,
        'willing_to_relocate': willing_to_relocate,
        'preferred_locations': preferred_locations,
        
        # COMPOSITE FEATURES (engineered for better ML)
        'education_experience_score': round((gpa/10) * (1 + work_experience/5), 2),
        'skill_certification_score': round((skills_count/10) * (1 + cert_count/3), 2),
        'overall_profile_score': round(
            min(gpa/10, 1.0) * 0.3 + 
            min(skills_count/10, 1.0) * 0.3 + 
            min((work_experience+1)/7, 1.0) * 0.2 + 
            min((cert_count+1)/4, 1.0) * 0.2
        , 2)
    }
    
    data.append(record)
    
    # Progress indicator
    if (i + 1) % 1000 == 0:
        print(f"Generated {i + 1} records...")

# Create DataFrame
df = pd.DataFrame(data)

# Add unique hash for data versioning
df['data_version'] = hashlib.md5(str(datetime.now()).encode()).hexdigest()[:8]

# Create train/validation/test splits
train_df, temp_df = train_test_split(df, test_size=0.3, random_state=42, stratify=df['target_role'])
val_df, test_df = train_test_split(temp_df, test_size=0.5, random_state=42, stratify=temp_df['target_role'])

# Save datasets
df.to_csv('complete_student_dataset_9000.csv', index=False)
train_df.to_csv('train_dataset.csv', index=False)
val_df.to_csv('validation_dataset.csv', index=False)
test_df.to_csv('test_dataset.csv', index=False)

print(f"\n✅ PRODUCTION DATASET CREATED SUCCESSFULLY!")
print(f"📊 Total records: {len(df)}")
print(f"📋 Total features: {len(df.columns)}")
print(f"\n📈 Dataset splits:")
print(f"   - Training: {len(train_df)} records")
print(f"   - Validation: {len(val_df)} records")
print(f"   - Test: {len(test_df)} records")

print("\n📊 Target Role Distribution (balanced):")
print(df['target_role'].value_counts())

print("\n📊 Feature Statistics:")
print(f"   - Average skills per candidate: {df['skills_count'].mean():.1f}")
print(f"   - Average certifications: {df['certifications_count'].mean():.1f}")
print(f"   - Average GPA: {df['gpa'].mean():.2f}/10")
print(f"   - Average experience: {df['work_experience_years'].mean():.1f} years")
print(f"   - Average expected salary: ₹{df['expected_salary_lpa'].mean()*100000:.0f}")

print("\n📁 Files created:")
print("   1. complete_student_dataset_9000.csv (full dataset)")
print("   2. train_dataset.csv (for training)")
print("   3. validation_dataset.csv (for validation)")
print("   4. test_dataset.csv (for testing)")

# Generate data dictionary for documentation
data_dictionary = pd.DataFrame({
    'Feature': df.columns,
    'Data Type': df.dtypes.values,
    'Description': [
        'Target variable - job role',
        'Unique student identifier',
        'Student age in years',
        'Gender (Male/Female)',
        'Current city',
        'State from city',
        'Area pincode',
        'Highest education level',
        'University/College name',
        'Institution tier (Tier-1/Tier-2)',
        'Major subject',
        'Year of graduation',
        'GPA out of 10',
        'Rounded GPA',
        'Comma-separated skills',
        'Number of skills',
        'Has Python skill (1/0)',
        'Has Java skill (1/0)',
        'Has JavaScript skill (1/0)',
        'Has SQL skill (1/0)',
        'Number of projects',
        'Project titles',
        'Number of internships',
        'Internship company names',
        'Has internship experience (1/0)',
        'Has premium company internship (1/0)',
        'Years of work experience',
        'Experience level category',
        'Has work experience (1/0)',
        'Certification names',
        'Number of certifications',
        'Has certification (1/0)',
        'Has GitHub profile (1/0)',
        'Has LinkedIn profile (1/0)',
        'Online presence score (0-1)',
        'Expected salary in LPA',
        'Willing to relocate (1/0)',
        'Preferred locations',
        'Education-experience composite score',
        'Skill-certification composite score',
        'Overall profile score (0-1)',
        'Data version hash'
    ]
})

# Adjust description list length to match columns
if len(data_dictionary) < len(df.columns):
    for j in range(len(data_dictionary), len(df.columns)):
        data_dictionary.loc[j] = [df.columns[j], df.dtypes.values[j], 'Auto-generated feature']

data_dictionary.to_csv('data_dictionary.csv', index=False)
print("\n📚 Data dictionary saved as: data_dictionary.csv")

# Show sample of engineered features
print("\n👀 Sample of engineered features (first 3 records):")
print(df[['target_role', 'overall_profile_score', 'education_experience_score', 
          'skill_certification_score', 'expected_salary_lpa']].head(3))

print("\n✅ Dataset generation complete! Ready for ML model training.")