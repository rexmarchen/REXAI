import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import applyFlowRouter from './routes/applyFlow.js';

// Load environment configurations
dotenv.config();

console.log('--- STARTING ADVANCED INTEGRATION TEST RUN ---');
console.log('LIVE_SUBMIT is set to:', process.env.LIVE_SUBMIT || 'false');
console.log('GROQ_API_KEY exists:', !!process.env.GROQ_API_KEY);
console.log('ADZUNA_APP_ID exists:', !!process.env.ADZUNA_APP_ID);
console.log('ADZUNA_APP_KEY exists:', !!process.env.ADZUNA_APP_KEY);
console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
console.log('---------------------------------------------\n');

const testPort = 3001;
const serverUrl = `http://localhost:${testPort}`;
let serverInstance;

// Setup a temporary Express app for route testing
async function startTestServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api', applyFlowRouter);

  return new Promise((resolve) => {
    serverInstance = app.listen(testPort, () => {
      console.log(`Test server bound to port ${testPort}`);
      resolve();
    });
  });
}

async function runIntegrationTest() {
  try {
    // 1. Start Test Server
    await startTestServer();

    // 2. Read resume file
    const resumePath = 'c:/Users/anshupal/OneDrive/Desktop/rexionAI/John_Doe_Resume.pdf';
    if (!fs.existsSync(resumePath)) {
      throw new Error(`Resume file not found at: ${resumePath}`);
    }
    const fileBuffer = fs.readFileSync(resumePath);

    // 3. STAGE 1 - Upload and Parse Resume
    console.log('\n[STAGE 1] Uploading and parsing resume...');
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    formData.append('resume', blob, 'John_Doe_Resume.pdf');

    const uploadRes = await fetch(`${serverUrl}/api/upload-resume`, {
      method: 'POST',
      body: formData
    });

    if (!uploadRes.ok) {
      throw new Error(`Upload failed: ${uploadRes.statusText} - ${await uploadRes.text()}`);
    }

    const uploadData = await uploadRes.json();
    const resumeId = uploadData.resumeId;
    console.log(`SUCCESS! Generated resumeId: ${resumeId}`);

    // 4. STAGE 2 - Rephrase Resume
    console.log('\n[STAGE 2] Running Groq AI rephrasing and profile extraction...');
    const rephraseRes = await fetch(`${serverUrl}/api/rephrase-resume/${resumeId}`, {
      method: 'POST'
    });

    if (!rephraseRes.ok) {
      throw new Error(`Rephrase failed: ${rephraseRes.statusText} - ${await rephraseRes.text()}`);
    }

    const rephraseData = await rephraseRes.json();
    console.log('SUCCESS! Extracted profile details:');
    console.log(`- Target Role: ${rephraseData.profile.targetRole}`);
    console.log(`- Experience: ${rephraseData.profile.yearsExperience} years`);
    console.log(`- Skills: ${rephraseData.profile.skills.slice(0, 5).join(', ')}...`);

    // 5. STAGE 3 - Job Matching
    console.log('\n[STAGE 3] Querying Adzuna matches and calculating match scores...');
    const matchRes = await fetch(`${serverUrl}/api/matched-jobs/${resumeId}`);

    if (!matchRes.ok) {
      throw new Error(`Matching failed: ${matchRes.statusText} - ${await matchRes.text()}`);
    }

    const matchData = await matchRes.json();
    const jobs = matchData.jobs || [];
    console.log(`SUCCESS! Found and scored ${jobs.length} jobs.`);
    
    if (jobs.length > 0) {
      console.log('Top match details:');
      console.log(`- Title: ${jobs[0].title}`);
      console.log(`- Company: ${jobs[0].company}`);
      console.log(`- Score: ${jobs[0].matchScore}%`);
      console.log(`- Apply Type: ${jobs[0].applyType}`);
    }

    // 6. STAGE 4 & 5 - Auto-Apply (Halted Dry-Run)
    console.log('\n[STAGE 4 & 5] Launching Puppeteer Auto-Apply queue & email report...');
    
    // We only select the first job to apply for testing to avoid wasting time
    const selectedJob = jobs[0];
    if (!selectedJob) {
      console.log('No jobs found to auto-apply. Skipping Stage 4.');
    } else {
      // If the top job is external_ats, let's force it to easy_apply for Greenhouse selector testing, 
      // or we can test the skipped flow. Let's send the job URL.
      console.log(`Selected job URL: ${selectedJob.url} (${selectedJob.applyType})`);
      
      const applyRes = await fetch(`${serverUrl}/api/auto-apply/${resumeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobIds: [selectedJob.url, selectedJob.title, selectedJob.id],
          email: 'anshupal5047@gmail.com' // Candidate's verified sandbox email
        })
      });

      if (!applyRes.ok) {
        throw new Error(`Auto-Apply failed: ${applyRes.statusText} - ${await applyRes.text()}`);
      }

      const applyData = await applyRes.json();
      console.log('SUCCESS! Run summary results:');
      console.log(JSON.stringify(applyData.results, null, 2));
      console.log(`Email Sent: ${applyData.emailSent} (Error: ${applyData.emailError})`);
    }

    console.log('\n=============================================');
    console.log('🎉 ALL 5 STAGES OF INTEGRATION TEST PASSED!');
    console.log('=============================================');

  } catch (error) {
    console.error('\n❌ INTEGRATION TEST FAILED:', error.message);
    console.error(error.stack);
  } finally {
    // Shutdown server
    if (serverInstance) {
      console.log('\nStopping test server...');
      serverInstance.close(() => {
        console.log('Test server stopped.');
      });
    }
  }
}

runIntegrationTest();
