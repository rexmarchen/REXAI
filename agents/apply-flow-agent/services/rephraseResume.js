import Groq from 'groq-sdk';
import { startObservation } from '../telemetry.js';

/**
 * Rephrases the resume bullet points and extracts structured candidate profile using Groq LLM.
 * @param {string} resumeText - Raw text extracted from the resume
 * @param {Object} [options] - Optional tracing context
 * @returns {Promise<{ rephrasedResumeText: string, skills: string[], yearsExperience: number, targetRole: string, summary: string }>}
 */
export async function rephraseResume(resumeText, options = {}) {
  if (!resumeText || typeof resumeText !== 'string' || resumeText.trim() === '') {
    throw new Error('No resume text available for rephrasing');
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not defined in environment variables');
  }

  const groq = new Groq({ apiKey });

  const systemPrompt = `You are a professional resume writer and career coach.
Your task is to analyze the candidate's resume and perform two operations:
1. "rephrasedResumeText": Rephrase each bullet point and experience description to use strong, active verbs (e.g., "Led", "Optimized", "Architected", "Spearheaded") and quantify the business impact (e.g., "improving performance by 25%", "saving 15 hours weekly", "reducing error rates by 10%"). Retain the general layout, structure, contact information, and timeline of the resume.
2. Structure the profile details:
   - "firstName": Candidate's first name (e.g., "Priya").
   - "lastName": Candidate's last name (e.g., "Sharma").
   - "email": Candidate's email address.
   - "phone": Candidate's phone number.
   - "city": Candidate's city (e.g., "San Francisco").
   - "state": Candidate's state (e.g., "California").
   - "country": "United States" (or detected country).
   - "postalCode": Candidate's postal/zip code (e.g., "94105" or detected).
   - "address": Candidate's address or location.
   - "linkedin": Candidate's LinkedIn URL (e.g., "https://linkedin.com/in/...").
   - "github": Candidate's GitHub URL (e.g., "https://github.com/...").
   - "portfolio": Portfolio or website URL.
   - "currentEmployer": Current or most recent employer/company (e.g., "Northwind Logistics").
   - "educationDegree": Highest degree level (e.g., "Bachelor's" or "Master's").
   - "educationInstitution": School or university name (e.g., "University of Washington").
   - "skills": Extract key tech stacks, tools, frameworks, and core skills as an array of strings.
   - "yearsExperience": Calculate/round their total years of professional experience as a number.
   - "targetRole": Extract a target job title or role that the user is most qualified for (e.g., "Senior Backend Engineer").
   - "summary": Draft a high-impact, 2-3 sentence professional summary focusing on their target role and key accomplishments.

You must return the response strictly as a JSON object with this exact structure:
{
  "firstName": "Priya",
  "lastName": "Sharma",
  "email": "priya.sharma88@gmail.com",
  "phone": "(415) 555-0192",
  "city": "San Francisco",
  "state": "California",
  "country": "United States",
  "postalCode": "94105",
  "address": "123 Market St",
  "linkedin": "https://linkedin.com/in/priyasharma-dev",
  "github": "https://github.com/psharma-eng",
  "portfolio": "https://github.com/psharma-eng",
  "currentEmployer": "Northwind Logistics",
  "educationDegree": "Bachelor's",
  "educationInstitution": "University of Washington",
  "skills": ["Python", "Go", "PostgreSQL"],
  "yearsExperience": 6,
  "targetRole": "Senior Backend Engineer",
  "summary": "Experienced software developer specializing in...",
  "rephrasedResumeText": "FULL REPHRASED RESUME TEXT GOES HERE..."
}`;

  let genObservation = null;
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: resumeText }
  ];

  try {
    try {
      genObservation = startObservation('rephrase-resume-groq', {
        model: 'openai/gpt-oss-120b',
        input: messages,
        metadata: {
          feature: 'resume-rephrasing',
          ...options.metadata
        }
      }, { asType: 'generation' });
    } catch {
      // safe fallback if telemetry not initialized
    }

    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages,
      response_format: { type: 'json_object' },
      max_tokens: 3000
    });

    let content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Groq API returned an empty completion response during rephrasing');
    }

    // Safely extract JSON from response if surrounded by conversational text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      content = jsonMatch[0];
    }

    const data = JSON.parse(content);

    // End generation observation with token usage and output
    if (genObservation) {
      genObservation.update({
        output: data,
        usageDetails: completion.usage ? {
          input: completion.usage.prompt_tokens,
          output: completion.usage.completion_tokens,
          total: completion.usage.total_tokens
        } : undefined
      }).end();
    }

    // Sanitize and validate fields
    const rephrasedResumeText = typeof data.rephrasedResumeText === 'string' ? data.rephrasedResumeText.trim() : resumeText;
    const skills = Array.isArray(data.skills) ? data.skills.map(s => String(s).trim()) : [];
    let yearsExperience = Number(data.yearsExperience);
    if (isNaN(yearsExperience)) yearsExperience = 0;
    const targetRole = typeof data.targetRole === 'string' ? data.targetRole.trim() : 'Software Engineer';
    const summary = typeof data.summary === 'string' ? data.summary.trim() : '';

    return {
      ...data,
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      email: data.email || '',
      phone: data.phone || '',
      city: data.city || '',
      state: data.state || '',
      country: data.country || 'United States',
      postalCode: data.postalCode || '',
      address: data.address || '',
      linkedin: data.linkedin || '',
      github: data.github || '',
      portfolio: data.portfolio || '',
      currentEmployer: data.currentEmployer || '',
      educationDegree: data.educationDegree || '',
      educationInstitution: data.educationInstitution || '',
      rephrasedResumeText,
      skills,
      yearsExperience,
      targetRole,
      summary
    };
  } catch (error) {
    if (genObservation) {
      genObservation.update({
        level: 'ERROR',
        statusMessage: error.message
      }).end();
    }
    throw new Error(`Failed to rephrase resume with Groq: ${error.message}`);
  }
}
