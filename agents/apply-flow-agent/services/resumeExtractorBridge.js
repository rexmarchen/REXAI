import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const extractorRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'resume_extractor'
);
const extractorFields = [
  'first_name',
  'last_name',
  'full_name',
  'email',
  'phone',
  'linkedin_url',
  'github_url',
  'portfolio_url',
  'address_line1',
  'city',
  'state',
  'zip_code',
  'country',
  'current_title',
  'years_of_experience'
];

export function extractResumeForAutofill(pdfPath) {
  const pythonCommand = process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');

  return new Promise((resolve, reject) => {
    const child = spawn(pythonCommand, ['-m', 'autofill_cli', pdfPath], {
      cwd: extractorRoot,
      env: { ...process.env, PYTHONPATH: extractorRoot }
    });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.once('error', reject);
    child.once('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Resume extractor failed (${code}): ${stderr.trim()}`));
        return;
      }

      try {
        const parsed = JSON.parse(stdout);
        const values = Object.fromEntries(
          extractorFields.map((fieldName) => [fieldName, parsed.values?.[fieldName] ?? null])
        );
        resolve(values);
      } catch (error) {
        reject(new Error(`Resume extractor returned invalid JSON: ${error.message}`));
      }
    });
  });
}
