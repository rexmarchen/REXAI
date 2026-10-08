import dotenv from 'dotenv';
dotenv.config();

import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';
import { parseResume } from './services/parseResume.js';
import { rephraseResume } from './services/rephraseResume.js';
import { extractResumeForAutofill } from './services/resumeExtractorBridge.js';
import { autoApply } from './services/autoApply.js';
import { flushTelemetry, startActiveObservation, propagateAttributes } from './telemetry.js';

// Parse command line arguments or use defaults
const args = process.argv.slice(2);
function getArg(flag, fallback) {
  const index = args.indexOf(flag);
  if (index !== -1 && args[index + 1]) return args[index + 1];
  return fallback;
}

// Default paths to uploaded test files if not specified
const defaultResume = path.resolve('C:/Users/anshupal/.gemini/antigravity-ide/brain/d490a002-3092-4e52-9ae7-c7b9f837dbdf/.user_uploaded/media_1790401591567.pdf');
const defaultFormHtml = path.resolve('C:/Users/anshupal/.gemini/antigravity-ide/brain/d490a002-3092-4e52-9ae7-c7b9f837dbdf/.user_uploaded/media_1790401591609.html');

const resumePath = getArg('--resume', defaultResume);
const formUrlOrPath = getArg('--form', defaultFormHtml);
const isVisible = args.includes('--visible') || !args.includes('--headless');

async function runLiveAgentTest() {
  console.log('====================================================');
  console.log('  REXION AI AGENT: LIVE FORM-FILLING TEST RUNNER    ');
  console.log('====================================================');
  console.log(`[1] Resume File : ${resumePath}`);
  console.log(`[2] Form Target : ${formUrlOrPath}`);
  console.log(`[3] Visible Mode: ${isVisible ? 'YES (Browser window will open)' : 'NO (Headless)'}`);
  console.log('----------------------------------------------------');

  if (!fs.existsSync(resumePath)) {
    console.error(`Error: Resume file not found at: ${resumePath}`);
    process.exit(1);
  }

  // Convert local file path to file:// URL if needed
  let targetUrl = formUrlOrPath;
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://') && !targetUrl.startsWith('file://')) {
    targetUrl = `file://${path.resolve(targetUrl).replace(/\\/g, '/')}`;
  }

  // Step 1: Parse and analyze candidate resume
  console.log('[Step 1/3] Parsing candidate resume and extracting structured profile...');
  const resumeBuffer = fs.readFileSync(resumePath);
  const mimeType = resumePath.endsWith('.docx') 
    ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    : 'application/pdf';

  let rawResumeText;
  try {
    console.log(` -> Reading buffer of length ${resumeBuffer.length} from ${resumePath}`);
    console.log(` -> First 20 bytes:`, resumeBuffer.slice(0, 20).toString());
    rawResumeText = await parseResume(resumeBuffer, mimeType);
    console.log(` -> Extracted ${rawResumeText.length} characters of raw text from resume.`);
  } catch (parseErr) {
    console.error(' -> Detailed parse error:', parseErr);
    throw parseErr;
  }

  // Step 2: Use AI to rephrase and extract structured details
  console.log('[Step 2/3] Calling Groq AI to extract candidate profile...');
  const rephrased = await rephraseResume(rawResumeText);
  console.log(` -> Extracted Target Role: "${rephrased.targetRole}"`);
  console.log(` -> Extracted Skills: ${rephrased.skills.slice(0, 6).join(', ')}`);
  console.log(` -> Years of Experience: ${rephrased.yearsExperience}`);

  // Extract autofill values (name, phone, email, links, address)
  const structuredValues = {
    first_name: rephrased.firstName || 'Priya',
    last_name: rephrased.lastName || 'Sharma',
    full_name: `${rephrased.firstName || 'Priya'} ${rephrased.lastName || 'Sharma'}`.trim(),
    email: rephrased.email || 'priya.sharma88@gmail.com',
    phone: rephrased.phone || '(415) 555-0192',
    city: rephrased.city || 'San Francisco',
    state: rephrased.state || 'California',
    country: rephrased.country || 'United States',
    postalCode: rephrased.postalCode || '94105',
    address: rephrased.address || '123 Market St',
    linkedin_url: rephrased.linkedin || 'https://linkedin.com/in/priyasharma-dev',
    github_url: rephrased.github || 'https://github.com/psharma-eng',
    portfolio_url: rephrased.portfolio || 'https://github.com/psharma-eng',
    current_title: rephrased.targetRole || 'Senior Backend Engineer',
    current_employer: rephrased.currentEmployer || 'Northwind Logistics',
    years_of_experience: rephrased.yearsExperience || 6,
    education_degree: rephrased.educationDegree || "Bachelor's",
    education_institution: rephrased.educationInstitution || 'University of Washington'
  };

  const candidateProfile = {
    fullName: structuredValues.full_name,
    email: structuredValues.email,
    phone: structuredValues.phone,
    skills: rephrased.skills,
    yearsExperience: rephrased.yearsExperience,
    targetRole: rephrased.targetRole,
    summary: rephrased.summary,
    structuredProfile: structuredValues
  };

  console.log(' -> Candidate Profile prepared:');
  console.log(`    Name:  ${candidateProfile.fullName}`);
  console.log(`    Email: ${candidateProfile.email}`);
  console.log(`    Phone: ${candidateProfile.phone}`);

  // Step 3: Run Auto-Apply Agent on the form with Langfuse tracing
  console.log('\n[Step 3/3] Launching Auto-Apply Agent in browser to fill form...');
  const sessionId = `form-test-${Date.now()}`;

  await startActiveObservation('live-form-test-run', async (traceSpan) => {
    traceSpan.update({
      input: {
        formUrl: targetUrl,
        candidateName: candidateProfile.fullName,
        candidateEmail: candidateProfile.email,
        targetRole: candidateProfile.targetRole,
      }
    });

    const jobs = [{
      id: 'test-job-1',
      title: 'Senior Backend Engineer',
      company: 'Test Employer Corp',
      url: targetUrl
    }];

    const results = await autoApply({
      jobs,
      profile: candidateProfile,
      resumeFilePath: resumePath,
      liveSubmit: true, // submit the form to see submitted values
      headless: !isVisible
    });

    console.log('\n====================================================');
    console.log('              AGENT EXECUTION COMPLETED             ');
    console.log('====================================================');
    console.log('Results Summary:');
    console.log(JSON.stringify(results, null, 2));

    await propagateAttributes({
      userId: candidateProfile.email || 'test-user@rexion.ai',
      sessionId,
      tags: ['agent-form-test', 'live-test', isVisible ? 'visible-ui' : 'headless'],
      metadata: {
        formUrl: targetUrl,
        resultsCount: String(results.length),
        status: results[0]?.status || 'unknown'
      }
    }, async () => {
      traceSpan.update({
        output: {
          results,
          candidate: candidateProfile.fullName
        }
      });
    });
  }, { asType: 'agent' });

  console.log('\n[Langfuse] Flushing telemetry to cloud.langfuse.com...');
  await flushTelemetry();
  console.log('[Langfuse] Trace sent successfully! View it at: https://cloud.langfuse.com');
}

runLiveAgentTest().catch((err) => {
  console.error('\n[Error running agent test]:', err);
  process.exit(1);
});
