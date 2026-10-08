import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 1. Agent Service Modules
import { parseResume } from './services/parseResume.js';
import { rephraseResume } from './services/rephraseResume.js';
import { autoApply } from './services/autoApply.js';

// Configure environment
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resumePath = path.resolve(__dirname, 'temp', 'priya_sharma_resume.pdf');
const formPath = path.resolve(__dirname, 'temp', 'test_application_form.html');
const formUrl = `file://${formPath.replaceAll('\\', '/')}`;

console.log('========================================================');
console.log('🤖 AGENT TRAINING RUN: AUTO-APPLY APPLICATION FILLING');
console.log('========================================================');
console.log('📄 Resume File:', resumePath);
console.log('📋 Form URL:', formUrl);

// Step 1: Agent parses candidate resume
console.log('\n[AGENT STEP 1] Parsing resume document...');
const resumeBuffer = fs.readFileSync(resumePath);
const rawText = await parseResume(resumeBuffer, 'application/pdf');
console.log('Parsed text length:', rawText.length, 'characters');

// Step 2: Agent analyzes skills, experience, and background
console.log('\n[AGENT STEP 2] Analyzing skills and profile with AI...');
const analysis = await rephraseResume(rawText);
console.log('Target Role:', analysis.targetRole);
console.log('Years of Experience:', analysis.yearsExperience);
console.log('Top Skills:', analysis.skills.slice(0, 6).join(', '));

// Step 3: Build candidate structured profile for the agent
const structuredProfile = {
  first_name: 'Priya',
  last_name: 'Sharma',
  full_name: 'Priya Sharma',
  email: 'priya.sharma88@gmail.com',
  phone: '(415) 555-0192',
  city: 'San Francisco',
  state: 'CA',
  address_line1: 'San Francisco, CA',
  zip_code: '94105',
  linkedin_url: 'https://linkedin.com/in/priyasharma-dev',
  github_url: 'https://github.com/psharma-eng',
  portfolio_url: '',
  current_title: 'Senior Backend Engineer',
  years_of_experience: analysis.yearsExperience || 6,
  education_degree: 'B.S. in Computer Science',
  education_institution: 'University of Washington',
  skills: analysis.skills,
  summary: analysis.summary
};

const candidateProfile = {
  fullName: structuredProfile.full_name,
  email: structuredProfile.email,
  phone: structuredProfile.phone,
  summary: structuredProfile.summary,
  targetRole: analysis.targetRole || 'Senior Backend Engineer',
  yearsExperience: structuredProfile.years_of_experience,
  skills: analysis.skills,
  education: [{
    degree: structuredProfile.education_degree,
    institution: structuredProfile.education_institution
  }],
  experience: [
    {
      title: 'Senior Backend Engineer',
      company: 'Northwind Logistics',
      description: 'Led migration to event-driven microservices reducing p99 latency by 40%.'
    },
    {
      title: 'Software Engineer',
      company: 'Clearwater Analytics',
      description: 'Built data pipeline tooling reducing report generation time from 4 hours to 12 minutes.'
    }
  ]
};

// Step 4: Dispatch the Job Apply Agent to fill and submit the form
console.log('\n[AGENT STEP 3] Dispatching Job Apply Agent (Puppeteer + Autofill Engine)...');
const jobs = [
  {
    title: 'Senior Backend Engineer',
    company: 'Target Corp (Test Form)',
    url: formUrl
  }
];

const results = await autoApply({
  jobs,
  profile: candidateProfile,
  structuredProfile,
  resumeFilePath: resumePath,
  liveSubmit: true
});

console.log('\n========================================================');
console.log('✅ AGENT EXECUTION COMPLETE');
console.log('========================================================');
console.log(JSON.stringify(results, null, 2));

if (results[0]?.submittedDetails) {
  console.log('\n📋 SUBMITTED FORM VALUES CAPTURED BY AGENT:');
  console.log('--------------------------------------------------------');
  console.log(results[0].submittedDetails);
  console.log('--------------------------------------------------------');
}
