import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractResumeForAutofill } from '../services/resumeExtractorBridge.js';
import { autoApply } from '../services/autoApply.js';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const downloadsRoot = path.resolve(repoRoot, '..', '..', '..', 'Downloads');
const formPath = path.join(downloadsRoot, 'test_application_form.html');
const resumePath = path.join(downloadsRoot, 'priya_sharma_resume.pdf');
const formUrl = `file://${formPath.replaceAll('\\', '/')}`;

const structuredProfile = await extractResumeForAutofill(resumePath);
const results = await autoApply({
  jobs: [{ title: 'Senior Backend Engineer', company: 'Local Test', url: formUrl }],
  profile: {
    summary: 'Backend software engineer with experience building distributed systems and developer tooling.',
    targetRole: 'Senior Backend Engineer'
  },
  structuredProfile,
  resumeFilePath: resumePath,
  liveSubmit: true
});

console.log(JSON.stringify({ structuredProfile, results }, null, 2));
