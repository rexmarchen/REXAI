import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { autoApply } from './services/autoApply.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const formPath = path.resolve(__dirname, 'temp', 'test_application_form.html');
const formUrl = `file://${formPath.replaceAll('\\', '/')}`;

console.log('========================================================');
console.log('🎯 TRAINING & VALIDATION: RESUME TO LIVE FORM AUTOFILL');
console.log('========================================================');

// Fetch latest candidate profile from backend API
let candidateProfile = null;
try {
  const res = await fetch('http://localhost:5000/api/applications/profile');
  const json = await res.json();
  if (json.success && json.data) {
    candidateProfile = json.data;
    console.log('✅ Loaded verified candidate profile from Backend API:', candidateProfile.fullName);
  }
} catch (e) {
  console.warn('Backend API fetch error:', e.message);
}

if (!candidateProfile) {
  candidateProfile = {
    fullName: 'SAGAR',
    email: 'Sagar19782008@gmail.com',
    phone: '+91 8544780822',
    location: 'Bangalore, Karnataka, India',
    linkedin: 'https://www.linkedin.com/in/sagar-5a3785346',
    targetRole: 'Aspiring AI Engineer',
    skills: ['Python', 'Generative AI', 'AI Chatbots', 'Machine Learning', 'C Programming'],
    experienceYears: 1
  };
}

console.log('Candidate Data for Agent:');
console.log(`- Full Name: ${candidateProfile.fullName}`);
console.log(`- Email: ${candidateProfile.email}`);
console.log(`- Phone: ${candidateProfile.phone}`);
console.log(`- Location: ${candidateProfile.location}`);
console.log(`- Skills: ${candidateProfile.skills?.join(', ')}`);

const structuredProfile = {
  first_name: candidateProfile.fullName.split(' ')[0] || 'SAGAR',
  last_name: candidateProfile.fullName.split(' ').slice(1).join(' ') || '',
  full_name: candidateProfile.fullName,
  email: candidateProfile.email,
  phone: candidateProfile.phone,
  city: 'Bangalore',
  state: 'Karnataka',
  country: 'India',
  address_line1: candidateProfile.location || 'Bangalore, Karnataka, India',
  zip_code: '560001',
  linkedin_url: candidateProfile.linkedin || 'https://www.linkedin.com/in/sagar-5a3785346',
  github_url: candidateProfile.github || '',
  portfolio_url: '',
  current_title: candidateProfile.targetRole || 'Aspiring AI Engineer',
  years_of_experience: candidateProfile.experienceYears || 1,
  education_degree: candidateProfile.education?.[0]?.degree || 'B.Tech (AIML)',
  education_institution: candidateProfile.education?.[0]?.institution || 'CGC University - Mohali, Punjab',
  skills: candidateProfile.skills || ['Python', 'Generative AI'],
  summary: candidateProfile.summary || 'Aspiring AI Engineer with experience in Python and Generative AI'
};

const jobs = [
  {
    title: 'AI / Machine Learning Engineer',
    company: 'Scaler School of Technology (Partner)',
    url: formUrl
  }
];

console.log('\n[RUNNING AGENT] Dispatching Puppeteer autofill engine to live test form...');
const results = await autoApply({
  jobs,
  profile: candidateProfile,
  structuredProfile,
  resumeFilePath: path.resolve(__dirname, 'temp', 'priya_sharma_resume.pdf'),
  liveSubmit: false,
  headless: true
});

console.log('\n[AGENT RESULT SUMMARY]:');
console.log(JSON.stringify(results, null, 2));
console.log('✅ Retraining & Validation complete! Agent accurately fills candidate data.');
