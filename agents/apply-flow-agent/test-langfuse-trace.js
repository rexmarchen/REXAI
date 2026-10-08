import dotenv from 'dotenv';
dotenv.config();
import './telemetry.js';
import { flushTelemetry, startActiveObservation, startObservation, propagateAttributes } from './telemetry.js';
import { rephraseResume } from './services/rephraseResume.js';

async function runTestTrace() {
  console.log('[Test] Starting Langfuse end-to-end verification trace...');

  const sampleResume = `
Anshu Pal
Senior Full Stack Engineer
Skills: React, Node.js, Express, TypeScript, Python, MongoDB, Puppeteer, Docker
Experience:
- Developed automated job application pipeline reducing manual submission time by 80%.
- Integrated Langfuse observability with OpenTelemetry across backend services and AI agent workflows.
- Architected REST APIs and microservices handling 100k daily requests.
Education:
- B.Tech in Computer Science
`;

  const sessionId = `test-session-${Date.now()}`;
  const userId = 'anshu-test@rexion.ai';

  await startActiveObservation('test-agent-workflow', async (traceSpan) => {
    traceSpan.update({
      input: {
        task: 'verify-langfuse-tracing',
        candidate: 'Anshu Pal',
        sampleLength: sampleResume.length,
      }
    });

    console.log('[Test] Calling rephraseResume (Groq LLM generation)...');
    const result = await rephraseResume(sampleResume, {
      metadata: { testRun: true, runId: sessionId }
    });

    console.log('[Test] Rephrase complete. Extracted target role:', result.targetRole);
    console.log('[Test] Extracted skills:', result.skills.slice(0, 5));

    await propagateAttributes({
      userId,
      sessionId,
      tags: ['test', 'langfuse-verification', 'rexion-agent'],
      metadata: {
        targetRole: result.targetRole,
        yearsExperience: result.yearsExperience,
      }
    }, async () => {
      traceSpan.update({
        output: {
          status: 'success',
          targetRole: result.targetRole,
          skillsExtracted: result.skills.length,
          yearsExperience: result.yearsExperience
        }
      });
    });
  });

  console.log('[Test] Flushing telemetry to cloud.langfuse.com...');
  await flushTelemetry();
  console.log('[Test] Telemetry flushed successfully!');
}

runTestTrace().catch((err) => {
  console.error('[Test] Error during trace execution:', err);
  process.exit(1);
});
