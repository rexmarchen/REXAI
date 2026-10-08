import dotenv from 'dotenv';
import { parseResume } from './services/parseResume.js';
import { analyzeSkills } from './services/analyzeSkills.js';
import { fetchJobs } from './services/fetchJobs.js';
import { calculateMatch } from './services/scoreMatch.js';
import { sendEmail } from './services/sendEmail.js';

// Setup environment variables from the project's .env file
dotenv.config();

console.log('--- TESTING PIPELINE CONFIGURATION ---');
console.log('GROQ_API_KEY exists:', !!process.env.GROQ_API_KEY);
console.log('ADZUNA_APP_ID exists:', !!process.env.ADZUNA_APP_ID);
console.log('ADZUNA_APP_KEY exists:', !!process.env.ADZUNA_APP_KEY);
console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
console.log('ADZUNA_COUNTRY:', process.env.ADZUNA_COUNTRY || 'in');
console.log('-------------------------------------\n');

const testResumeText = `
John Doe
Software Engineer
Email: test@example.com

SKILLS:
JavaScript, React, Node.js, Express, MongoDB, HTML5, CSS3, REST APIs, Git, Docker

EXPERIENCE:
Software Engineer | Tech Solutions Inc. | Jan 2024 - Present (approx 2 years)
- Developed robust web applications using React and Node.js.
- Integrated RESTful APIs and optimized database queries.

Frontend Intern | Startup Corp | Jun 2023 - Dec 2023 (6 months)
- Built user-interface components in React.
- Collaborated with design teams using CSS and HTML.

EDUCATION:
Bachelor of Science in Computer Science - 2023
`;

async function runTest() {
  try {
    // 1. Test Profile Analysis (Groq)
    console.log('1. Testing Groq Skill Analysis...');
    const profile = await analyzeSkills(testResumeText);
    console.log('SUCCESS! Profile extracted:', JSON.stringify(profile, null, 2));

    // 2. Test Job Fetching (Adzuna)
    console.log('\n2. Testing Adzuna Job Fetching...');
    console.log(`Searching jobs for target role: "${profile.targetRole}"...`);
    const rawJobs = await fetchJobs(profile.targetRole);
    console.log(`SUCCESS! Found ${rawJobs.length} jobs.`);

    if (rawJobs.length > 0) {
      console.log('Sample raw job from Adzuna:');
      console.log(`- Title: ${rawJobs[0].title}`);
      console.log(`- Company: ${rawJobs[0].company?.display_name}`);
      console.log(`- Location: ${rawJobs[0].location?.display_name}`);
      console.log(`- Description: ${rawJobs[0].description}`);
    }

    // 3. Test Match Scoring
    console.log('\n3. Testing Match Scoring Algorithm...');
    const scoredJobs = rawJobs
      .map(job => calculateMatch(profile, job))
      .sort((a, b) => b.matchScores.totalScore - a.matchScores.totalScore)
      .slice(0, 5); // take top 5 for preview

    console.log(`SUCCESS! Scored and sorted top matches:`);
    scoredJobs.forEach((job, index) => {
      console.log(`[Rank ${index + 1}] ${job.title} at ${job.company?.display_name || 'N/A'}`);
      console.log(`   Location: ${job.location?.display_name}`);
      console.log(`   Scores: Total Match: ${job.matchScores.totalScore}%, Skill Match: ${job.matchScores.skillScore}%, Exp Match: ${job.matchScores.experienceScore}%`);
    });

    // 4. Test Email Sending (Resend)
    console.log('\n4. Testing Email Sending (Resend)...');
    // Using a safe testing email
    const recipientEmail = 'anshupal5047@gmail.com'; // sending to the user's verified test email
    console.log(`Sending top matches to: ${recipientEmail}...`);
    const emailResult = await sendEmail(recipientEmail, profile, scoredJobs);
    console.log('SUCCESS! Email response:', JSON.stringify(emailResult, null, 2));

    console.log('\n=====================================');
    console.log('✅ ALL UNIT PIPELINE TESTS PASSED!');
    console.log('=====================================');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
  }
}

runTest();
