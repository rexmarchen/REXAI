import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { getStructuredAutofillValue } from '../services/structuredAutofill.js';

const autoApplySource = fs.readFileSync(
  new URL('../services/autoApply.js', import.meta.url),
  'utf8'
);

test('resolved structured field is returned for filling', () => {
  const value = getStructuredAutofillValue({ email: 'jane@example.com' }, 'email', () => {
    throw new Error('resolved fields must not be flagged');
  });

  assert.equal(value, 'jane@example.com');
});

test('unresolved structured field is skipped and flagged', () => {
  const flagged = [];
  const value = getStructuredAutofillValue({ phone: null }, 'phone', (fieldName) => {
    flagged.push(fieldName);
  });

  assert.equal(value, null);
  assert.deepEqual(flagged, ['phone']);
});

test('custom-question Groq resolver remains available', () => {
  assert.match(autoApplySource, /new Groq\(/);
  assert.match(autoApplySource, /fieldsToResolve/);
  assert.match(autoApplySource, /const skipKeywords = \[/);
  assert.doesNotMatch(autoApplySource, /skipKeywords = \[[^\]]*cover letter/);
  assert.doesNotMatch(autoApplySource, /skipKeywords = \[[^\]]*summary/);
});
