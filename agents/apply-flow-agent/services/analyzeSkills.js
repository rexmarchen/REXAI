import Groq from 'groq-sdk';
import { startObservation } from '../telemetry.js';

/**
 * Uses Groq (openai/gpt-oss-120b / qwen/qwen3.6-27b) with JSON response format
 * to extract candidate details from resume text.
 * @param {string} resumeText - Raw text extracted from the resume
 * @param {Object} [options] - Optional tracing options
 * @returns {Promise<{ skills: string[], yearsExperience: number, targetRole: string }>}
 */
export async function analyzeSkills(resumeText, options = {}) {
  if (!resumeText || typeof resumeText !== 'string' || resumeText.trim() === '') {
    throw new Error('No resume text available for analysis');
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is required');
  }
  const groq = new Groq({ apiKey });

  const modelsToTry = ['openai/gpt-oss-120b', 'qwen/qwen3.6-27b', 'openai/gpt-oss-20b'];

  for (const model of modelsToTry) {
    let genObservation = null;
    const messages = [
      {
        role: 'system',
        content: `You are an expert resume parsing assistant. Analyze the candidate's resume text and return a JSON object with:
1. "skills": An array of key professional skills/technologies mentioned in the resume.
2. "yearsExperience": A number representing the total years of professional work experience (round to the nearest integer, e.g. 5).
3. "targetRole": A concise target job title/role (e.g. "Software Engineer", "Full Stack Developer", "ML Engineer").

Return strictly a valid JSON object matching:
{
  "skills": ["JavaScript", "React", "Node.js", "Python"],
  "yearsExperience": 4,
  "targetRole": "Full Stack Engineer"
}`
      },
      {
        role: 'user',
        content: `Analyze this resume and output JSON:\n\n${resumeText.slice(0, 10000)}`
      }
    ];

    try {
      try {
        genObservation = startObservation('analyze-skills-groq', {
          model,
          input: messages,
          metadata: {
            feature: 'skills-analysis',
            ...options.metadata
          }
        }, { asType: 'generation' });
      } catch {
        // safe fallback
      }

      const completion = await groq.chat.completions.create({
        model,
        messages,
        response_format: { type: 'json_object' }
      });

      const responseContent = completion.choices[0]?.message?.content;
      if (genObservation) {
        genObservation.update({
          output: responseContent,
          usageDetails: completion.usage ? {
            input: completion.usage.prompt_tokens,
            output: completion.usage.completion_tokens,
            total: completion.usage.total_tokens
          } : undefined
        }).end();
      }

      if (!responseContent) continue;

      const parsedData = JSON.parse(responseContent);

      const skills = Array.isArray(parsedData.skills)
        ? parsedData.skills.map(s => String(s).trim()).filter(Boolean)
        : ['Full Stack Development', 'Software Engineering'];
      
      let yearsExperience = Number(parsedData.yearsExperience);
      if (isNaN(yearsExperience) || yearsExperience < 0) {
        yearsExperience = 3;
      }
      
      const targetRole = typeof parsedData.targetRole === 'string' && parsedData.targetRole.trim()
        ? parsedData.targetRole.trim()
        : 'Software Engineer';

      return {
        skills,
        yearsExperience,
        targetRole
      };
    } catch (err) {
      console.warn(`[analyzeSkills] Attempt with model ${model} failed:`, err.message);
    }
  }

  // Fallback if all models fail
  return {
    skills: ['Software Engineering', 'React', 'Node.js', 'Python', 'Machine Learning'],
    yearsExperience: 3,
    targetRole: 'Software Engineer'
  };
}
