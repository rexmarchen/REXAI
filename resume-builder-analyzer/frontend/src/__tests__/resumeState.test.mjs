import { test } from 'node:test';
import assert from 'node:assert/strict';

test('Resume Templates: exactly 24 templates defined', async () => {
  const { TEMPLATES, DEFAULT_RESUME_DATA, ACCENT_COLORS } = await import('../../dist/assets/index-DmuVWE9u.js').catch(async () => {
    // If testing from compiled or raw
    return await import('../data/templates.ts');
  });

  // Verify templates list length
  assert.equal(TEMPLATES.length, 24, 'Must have exactly 24 templates');

  // Verify each template conforms to specified layout options
  const validLayouts = [
    'left-sidebar',
    'right-sidebar',
    'banner-left-sidebar',
    'banner-right-sidebar',
    'single-column'
  ];
  const validHeadings = [
    'underline',
    'filled-bar',
    'left-border',
    'spaced-caps',
    'serif-sentence',
    'dot-marker'
  ];

  for (const t of TEMPLATES) {
    assert.ok(validLayouts.includes(t.layout), `Invalid layout ${t.layout} for ${t.id}`);
    assert.ok(validHeadings.includes(t.headingStyle), `Invalid headingStyle ${t.headingStyle} for ${t.id}`);
    assert.ok(['bars', 'pills'].includes(t.skillStyle), `Invalid skillStyle for ${t.id}`);
    assert.equal(typeof t.hasTimeline, 'boolean');
    assert.equal(typeof t.hasAvatar, 'boolean');
  }

  // Verify the 2 plain ATS-friendly templates
  const atsTemplates = TEMPLATES.filter(t => t.isAtsClassic);
  assert.equal(atsTemplates.length, 2, 'Must have exactly 2 plain ATS-friendly templates');
  for (const ats of atsTemplates) {
    assert.equal(ats.layout, 'single-column', 'ATS templates must be single column');
    assert.equal(ats.hasTimeline, false, 'ATS templates must not have decorative timeline');
    assert.equal(ats.hasAvatar, false, 'ATS templates must not have avatar');
  }

  // Verify default resume data structure
  assert.ok(DEFAULT_RESUME_DATA.contact.full_name);
  assert.ok(DEFAULT_RESUME_DATA.experience.length >= 2);
  assert.ok(DEFAULT_RESUME_DATA.skills.length >= 5);
  assert.ok(ACCENT_COLORS.length >= 6);
});
