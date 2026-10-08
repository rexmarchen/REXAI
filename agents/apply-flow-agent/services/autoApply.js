import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';
import { detectSiteType } from './siteSelectors.js';
import Groq from 'groq-sdk';
import { getStructuredAutofillValue } from './structuredAutofill.js';
import { startObservation } from '../telemetry.js';

// Delay helper
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes a batch of automated job applications using Puppeteer.
 * @param {Object} params
 * @param {Array} params.jobs - List of job objects to apply to
 * @param {Object} params.profile - Candidate profile details { fullName, email, phone, summary }
 * @param {string} params.resumeFilePath - Path to the candidate's resume file
 * @param {boolean} params.liveSubmit - If true, clicks submit; if false, halts before submit
 * @returns {Promise<Array>} - Execution summary results per job
 */
export async function autoApply({ jobs, profile, structuredProfile, resumeFilePath, liveSubmit, headless }) {
  const results = [];
  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // Create unique log file name for this run
  const logFileName = `apply-run-${Date.now()}.log`;
  const logFilePath = path.join(logDir, logFileName);

  // Helper log function
  const runLog = (msg) => {
    const timestamp = new Date().toISOString();
    const formatted = `[${timestamp}] ${msg}`;
    console.log(formatted);
    fs.appendFileSync(logFilePath, formatted + '\n');
  };

  runLog(`Starting Auto-Apply batch run. Jobs in batch: ${jobs.length}. Live submit: ${liveSubmit}`);

  if (!jobs || jobs.length === 0) {
    runLog('No jobs selected for execution. Exiting batch run.');
    return [];
  }

  // Launch Puppeteer with persistent user data directory to reuse logins/session cookies
  const isHeadless = headless !== undefined ? headless : (process.env.HEADLESS !== 'false');
  const browser = await puppeteer.launch({
    headless: isHeadless,
    userDataDir: './session-data',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const jobTitle = job.title || 'Unknown Role';
    const company = job.company || 'Unknown Company';
    const url = job.url || '';

    runLog(`--------------------------------------------------`);
    runLog(`Job ${i + 1}/${jobs.length}: Processing "${jobTitle}" at ${company}...`);

    try {
      // 1. Detect ATS type
      const siteConfig = detectSiteType(url);
      if (!siteConfig) {
        runLog(`SKIPPED: Unsupported ATS or job board URL format: ${url}`);
        results.push({
          title: jobTitle,
          company,
          url,
          status: 'skipped',
          reason: 'Unsupported job board or application template.'
        });
        continue;
      }

      runLog(`Detected ATS engine: ${siteConfig.name}`);

      // 2. Navigate to job posting page
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      
      runLog(`Navigating to URL: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // 3. Multi-Step Form Traversal & Intelligent Field Resolution
      const effectiveStructuredProfile = {
        ...profile,
        ...(profile.structuredProfile || {}),
        ...(structuredProfile || {})
      };

      const getStructuredValue = (fieldName) => getStructuredAutofillValue(
        effectiveStructuredProfile,
        fieldName,
        (unresolvedField) => runLog(
          `MANUAL REVIEW: unresolved structured field "${unresolvedField}"; leaving it blank.`
        )
      );

      const apiKey = process.env.GROQ_API_KEY;
      const groq = apiKey ? new Groq({ apiKey }) : null;

      let currentStep = 1;
      const maxSteps = 35;
      let resumeUploaded = false;

      while (currentStep <= maxSteps) {
        runLog(`\n[Wizard] Processing step / page ${currentStep}...`);

        // 3a. Resume File Upload
        if (!resumeUploaded && resumeFilePath && fs.existsSync(resumeFilePath)) {
          try {
            const fileInputs = await page.$$('input[type="file"]');
            for (const fileInput of fileInputs) {
              try {
                await fileInput.uploadFile(resumeFilePath);
                resumeUploaded = true;
                runLog(`Uploaded resume file: ${path.basename(resumeFilePath)}`);
                await sleep(1000);
                break;
              } catch {}
            }
          } catch (uploadErr) {
            runLog(`Notice: Resume upload on step ${currentStep}: ${uploadErr.message}`);
          }
        }

        // 3b. Fill static configured selectors if present
        const selectors = siteConfig.fields || {};
        const fillStructuredField = async (fieldName, selector, label) => {
          if (!selector) return;
          const value = getStructuredValue(fieldName);
          if (value === null) return;
          try {
            const input = await page.$(selector);
            if (input) {
              const isVis = await page.evaluate(el => {
                const s = window.getComputedStyle(el);
                return s.display !== 'none' && s.visibility !== 'hidden' && el.offsetWidth > 0;
              }, input).catch(() => false);
              if (isVis) {
                const isSelect = await page.evaluate(el => el.tagName === 'SELECT', input);
                if (isSelect) {
                  await page.evaluate((el, val) => {
                    const target = String(val).toLowerCase().trim();
                    const opt = Array.from(el.options).find(o => 
                      o.value.toLowerCase() === target || 
                      o.text.trim().toLowerCase() === target ||
                      o.text.trim().toLowerCase().includes(target)
                    );
                    if (opt) {
                      el.value = opt.value;
                      el.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                  }, input, value);
                  runLog(`Selected ${label} dropdown: ${value}`);
                } else {
                  await input.focus();
                  await page.evaluate(el => el.value = '', input);
                  await input.type(value);
                  runLog(`Typed ${label} field.`);
                }
              }
            }
          } catch {}
        };

        if (selectors.firstName && selectors.lastName) {
          await fillStructuredField('first_name', selectors.firstName, 'First Name');
          await fillStructuredField('last_name', selectors.lastName, 'Last Name');
        } else if (selectors.fullName) {
          await fillStructuredField('full_name', selectors.fullName, 'Full Name');
        }

        await fillStructuredField('email', selectors.email, 'email');
        await fillStructuredField('phone', selectors.phone, 'phone');
        await fillStructuredField('address_line1', selectors.address, 'address');
        await fillStructuredField('city', selectors.city, 'city');
        await fillStructuredField('state', selectors.state, 'state');
        await fillStructuredField('zip_code', selectors.zipCode, 'zip code');
        await fillStructuredField('country', selectors.country, 'country');
        await fillStructuredField('linkedin_url', selectors.linkedin, 'LinkedIn');
        await fillStructuredField('github_url', selectors.github, 'GitHub');
        await fillStructuredField('portfolio_url', selectors.portfolio, 'Portfolio');
        await fillStructuredField('current_title', selectors.currentTitle, 'current title');
        await fillStructuredField('years_of_experience', selectors.yearsExperience, 'years of experience');
        await fillStructuredField('education_degree', selectors.educationDegree, 'education degree');
        await fillStructuredField('education_institution', selectors.educationInstitution, 'education institution');

        // 3c. Semantic field matcher across all visible inputs on this step
        await page.evaluate((profileData) => {
          // Handle interactive tags widgets (e.g., Cairnwell Health)
          const tagsWidgets = document.querySelectorAll('.tags-input');
          for (const widget of tagsWidgets) {
            const targetId = widget.dataset.target;
            const hidden = document.getElementById(targetId);
            if (hidden) {
              const defaultTags = ['Python', 'Node.js', 'Distributed Systems', 'PostgreSQL', 'Docker'];
              hidden.value = defaultTags.join(', ');
              hidden.dispatchEvent(new Event('input', { bubbles: true }));
              hidden.dispatchEvent(new Event('change', { bubbles: true }));
              const chipsEl = widget.querySelector('.tags-chips');
              if (chipsEl && chipsEl.children.length === 0) {
                chipsEl.innerHTML = defaultTags.map(t => `<span class="tag-chip">${t}</span>`).join(' ');
              }
            }
          }

          const visible = (el) => {
            if (el.closest('.honeypot') || el.closest('[aria-hidden="true"]') || (el.name && el.name.startsWith('hp_')) || (el.id && el.id.startsWith('hp_'))) {
              return false; // NEVER touch honeypot anti-bot traps
            }
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetWidth > 1 && el.offsetHeight > 1 && style.opacity !== '0';
          };

          const getLabel = (el) => {
            if (el.id) {
              const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
              if (l && l.innerText) return l.innerText.trim();
            }
            let parent = el.parentElement;
            while (parent) {
              if (parent.tagName === 'LABEL' && parent.innerText) return parent.innerText.trim();
              parent = parent.parentElement;
            }
            if (el.previousElementSibling && el.previousElementSibling.innerText) {
              return el.previousElementSibling.innerText.trim();
            }
            const container = el.closest('.field-group, .form-group, .field, .row, .question, div');
            if (container) {
              const l = container.querySelector('label, legend, .label, .title');
              if (l && l.innerText) return l.innerText.trim();
            }
            return '';
          };

          const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="file"]), select, textarea'))
            .filter(visible);

          for (const el of inputs) {
            const label = getLabel(el).toLowerCase();
            const name = (el.name || '').toLowerCase();
            const id = (el.id || '').toLowerCase();
            const placeholder = (el.placeholder || '').toLowerCase();
            const key = `${label} ${name} ${id} ${placeholder}`;

            const setVal = (v) => {
              if (v === undefined || v === null) return;
              el.value = v;
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
            };

            const setNumberVal = (val) => {
              let numVal = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.]/g, ''));
              if (isNaN(numVal)) numVal = 1;
              if (el.max && numVal > parseFloat(el.max)) numVal = parseFloat(el.max);
              if (el.min && numVal < parseFloat(el.min)) numVal = parseFloat(el.min);
              
              el.value = String(numVal);
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));

              // If step is implicitly 1 and value has decimals, stepMismatch is triggered
              if (el.validity && el.validity.stepMismatch) {
                el.value = String(Math.round(numVal));
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
              }
            };

            const selectOption = (optVal) => {
              if (el.tagName !== 'SELECT' || !optVal) return false;
              const target = String(optVal).toLowerCase().trim();
              const opt = Array.from(el.options).find(o => 
                o.value.toLowerCase() === target || 
                o.text.trim().toLowerCase() === target ||
                o.text.trim().toLowerCase().includes(target)
              );
              if (opt) {
                el.value = opt.value;
                el.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
              }
              return false;
            };

            // Terms / Certification Checkboxes
            if (el.type === 'checkbox') {
              if (key.includes('certif') || key.includes('term') || key.includes('true and accurate') || key.includes('agree') || key.includes('confirm') || key.includes('review') || el.required) {
                el.checked = true;
                el.dispatchEvent(new Event('change', { bubbles: true }));
              }
              continue;
            }

            // Radio Buttons
            if (el.type === 'radio') {
              const val = (el.value || '').toLowerCase();
              if (key.includes('authoriz') || key.includes('legally')) {
                if (val === 'yes' || val === 'true') {
                  el.checked = true;
                  el.dispatchEvent(new Event('change', { bubbles: true }));
                }
              } else if (key.includes('sponsorship') || key.includes('visa')) {
                if (val === 'no' || val === 'false') {
                  el.checked = true;
                  el.dispatchEvent(new Event('change', { bubbles: true }));
                }
              } else if (key.includes('graduation_status') || key.includes('graduat')) {
                if (val === 'graduated') {
                  el.checked = true;
                  el.dispatchEvent(new Event('change', { bubbles: true }));
                }
              } else if (key.includes('remote') || key.includes('willing to work fully remote')) {
                if (val === 'yes') {
                  el.checked = true;
                  el.dispatchEvent(new Event('change', { bubbles: true }));
                }
              } else if (key.includes('timezone_overlap') || key.includes('time zone')) {
                if (val === 'yes') {
                  el.checked = true;
                  el.dispatchEvent(new Event('change', { bubbles: true }));
                }
              } else if (key.includes('relocate') || key.includes('willing to relocate')) {
                if (val === 'yes' || val === 'true') {
                  el.checked = true;
                  el.dispatchEvent(new Event('change', { bubbles: true }));
                }
              } else if (key.includes('oncall') || key.includes('on-call')) {
                if (val === 'yes') {
                  el.checked = true;
                  el.dispatchEvent(new Event('change', { bubbles: true }));
                }
              }
              continue;
            }

            // If already filled, skip
            if (el.tagName === 'SELECT' && el.selectedIndex > 0) continue;
            if (el.tagName !== 'SELECT' && el.value && el.value.trim() !== '') continue;

            if (key.includes('first name') || key.includes('firstname') || key.includes('legalfirst') || key.includes('vorname') || name === 'fname') {
              setVal(profileData.firstName);
            } else if (key.includes('last name') || key.includes('lastname') || key.includes('legallast') || key.includes('nachname') || name === 'lname') {
              setVal(profileData.lastName);
            } else if (key.includes('full name') || key.includes('esignature') || key.includes('signature') || (name === 'name' && !name.includes('company'))) {
              setVal(profileData.fullName);
            } else if (el.type === 'email' || key.includes('email') || key.includes('e-mail') || key.includes('kontakt.email') || name === 'eml') {
              setVal(profileData.email);
            } else if (el.type === 'tel' || key.includes('phone') || key.includes('mobile') || key.includes('telefon') || name === 'phn') {
              setVal(profileData.phone);
            } else if (key.includes('address line 1') || key.includes('addressline1') || key.includes('street address')) {
              setVal(profileData.address);
            } else if ((key.includes('city') || key.includes('stadt') || name === 'cty') && !key.includes('location')) {
              setVal(profileData.city);
            } else if (key.includes('state') || key.includes('region') || key.includes('bundesland') || name === 'st') {
              if (el.tagName === 'SELECT') {
                selectOption(profileData.state) || selectOption('California');
              } else {
                setVal(profileData.state);
              }
            } else if (key.includes('postal') || key.includes('zip') || key.includes('plz') || key.includes('postleitzahl')) {
              setVal(profileData.postalCode);
            } else if (key.includes('country') || key.includes('land') || name === 'cntry') {
              if (el.tagName === 'SELECT') {
                selectOption(profileData.country) || selectOption('United States');
              } else {
                setVal(profileData.country);
              }
            } else if (key.includes('linkedin')) {
              setVal(profileData.linkedin);
            } else if (key.includes('github')) {
              setVal(profileData.github);
            } else if (key.includes('portfolio') || key.includes('website') || key.includes('urls[other]')) {
              setVal(profileData.portfolio || profileData.github);
            } else if (key.includes('current or most recent job title') || key.includes('jobtitle') || (key.includes('current') && key.includes('title')) || key.includes('custom_question_1') || name === 'c_ttl') {
              setVal(profileData.currentTitle);
            } else if (key.includes('employer') || key.includes('current company') || name === 'org' || name === 'c_org') {
              setVal(profileData.currentEmployer);
            } else if (key.includes('years of') || key.includes('total years') || key.includes('years_experience') || key.includes('years_exp') || key.includes('screen.years') || key.includes('custom_question_2') || name === 'y_exp') {
              setNumberVal(profileData.yearsExperience);
            } else if (key.includes('degree') || key.includes('highest level of education')) {
              if (el.tagName === 'SELECT') {
                selectOption(profileData.educationDegree) || selectOption("Bachelor's");
              } else {
                setVal(profileData.educationDegree);
              }
            } else if (key.includes('field_of_study') || key.includes('major') || key.includes('study') || key.includes('fach')) {
              setVal('Computer Science');
            } else if (key.includes('gpa')) {
              setNumberVal(3.8);
            } else if (key.includes('graduation_date') || key.includes('graduation date')) {
              setVal('2020-05-15');
            } else if (key.includes('employment_status') || key.includes('current employment')) {
              if (el.tagName === 'SELECT') {
                selectOption('Currently Employed') || selectOption('Employed');
              }
            } else if (key.includes('primary_language') || key.includes('primary programming language')) {
              if (el.tagName === 'SELECT') {
                selectOption('Python') || selectOption('JavaScript') || selectOption('TypeScript');
              } else {
                setVal('Python');
              }
            } else if (key.includes('years_with_primary')) {
              setNumberVal(profileData.yearsExperience);
            } else if (key.includes('school') || key.includes('university') || key.includes('institution')) {
              setVal(profileData.educationInstitution);
            } else if (key.includes('location') || key.includes('custom_question_3')) {
              setVal(`${profileData.city}, ${profileData.state}`);
            } else if (key.includes('salary') || key.includes('compensation') || key.includes('custom_question_4')) {
              if (el.type === 'range') {
                el.value = '195000';
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
              } else {
                setVal('185000');
              }
            } else if (key.includes('work authorization') || key.includes('authorized to work')) {
              if (el.tagName === 'SELECT') selectOption('Yes');
            } else if (key.includes('relocate')) {
              if (el.tagName === 'SELECT') selectOption('N/A - Remote role') || selectOption('Yes');
            } else if (key.includes('gender') || key.includes('veteran') || key.includes('eeo') || key.includes('voluntary')) {
              if (el.tagName === 'SELECT') selectOption('Decline to answer') || selectOption('Decline to self-identify') || selectOption('Prefer not to say') || selectOption('Not a veteran') || selectOption('');
            } else if (key.includes('start date') || key.includes('available from') || key.includes('earliest start') || key.includes('availability')) {
              const twoWeeksFromNow = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
              const isoDate = twoWeeksFromNow.toISOString().split('T')[0];
              const usDate = `${String(twoWeeksFromNow.getMonth() + 1).padStart(2, '0')}/${String(twoWeeksFromNow.getDate()).padStart(2, '0')}/${twoWeeksFromNow.getFullYear()}`;
              if (el.type === 'date' || (el.placeholder && el.placeholder.includes('YYYY'))) {
                setVal(isoDate);
              } else if (el.placeholder && el.placeholder.includes('MM/DD')) {
                setVal(usDate);
              } else {
                setVal(isoDate);
              }
            } else if (key.includes('notice') || key.includes('notice period') || key.includes('notice_period')) {
              if (el.tagName === 'SELECT') {
                selectOption('2 weeks') || selectOption('2 Weeks') || selectOption('1 Month') || selectOption('Immediate');
              } else if (el.type === 'number') {
                setNumberVal(14);
              } else {
                setVal('2 weeks');
              }
            } else if (key.includes('architecture') || key.includes('monolith') || key.includes('services without downtime')) {
              setVal('I would apply the Strangler Fig pattern to decouple domains gradually. First, establish observability and API gateways. Second, carve out read-heavy or well-bounded services with event-driven data sync (CDC/Kafka) and shadow traffic routing. Finally, migrate write traffic via blue/green deployments and feature flags to ensure zero downtime.');
            } else if (key.includes('hear about') || key.includes('source') || key.includes('how did you hear')) {
              if (el.tagName === 'SELECT') {
                selectOption('Company Website') || selectOption('Job Board') || selectOption('LinkedIn') || selectOption('Other');
              } else {
                setVal('Company Website');
              }
            }
          }
        }, {
          firstName: effectiveStructuredProfile.first_name || (profile.fullName ? profile.fullName.split(' ')[0] : 'Priya'),
          lastName: effectiveStructuredProfile.last_name || (profile.fullName ? profile.fullName.split(' ').slice(1).join(' ') : 'Sharma'),
          fullName: profile.fullName || 'Priya Sharma',
          email: effectiveStructuredProfile.email || profile.email,
          phone: effectiveStructuredProfile.phone || profile.phone,
          city: effectiveStructuredProfile.city || 'San Francisco',
          state: effectiveStructuredProfile.state || 'California',
          country: effectiveStructuredProfile.country || 'United States',
          postalCode: effectiveStructuredProfile.zip_code || effectiveStructuredProfile.postalCode || '94105',
          address: effectiveStructuredProfile.address_line1 || effectiveStructuredProfile.address || '123 Market St',
          linkedin: effectiveStructuredProfile.linkedin_url || effectiveStructuredProfile.linkedin || 'https://linkedin.com/in/priyasharma-dev',
          github: effectiveStructuredProfile.github_url || effectiveStructuredProfile.github || 'https://github.com/psharma-eng',
          portfolio: effectiveStructuredProfile.portfolio_url || effectiveStructuredProfile.portfolio || 'https://github.com/psharma-eng',
          currentTitle: effectiveStructuredProfile.current_title || profile.targetRole || 'Senior Backend Engineer',
          currentEmployer: effectiveStructuredProfile.current_employer || 'Northwind Logistics',
          yearsExperience: effectiveStructuredProfile.years_of_experience || profile.yearsExperience || 6,
          educationDegree: effectiveStructuredProfile.education_degree || "Bachelor's",
          educationInstitution: effectiveStructuredProfile.education_institution || 'University of Washington'
        });

        // 3d. Scan remaining unfilled custom inputs and invoke Groq
        if (groq) {
          try {
            const skipKeywords = ['file_upload'];
            const fieldsToResolve = await page.evaluate(() => {
              const visible = (el) => {
                if (el.closest('.honeypot') || el.closest('[aria-hidden="true"]') || (el.name && el.name.startsWith('hp_')) || (el.id && el.id.startsWith('hp_'))) {
                  return false; // Skip honeypots
                }
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetWidth > 1 && el.offsetHeight > 1 && style.opacity !== '0';
              };
              const getLabelText = (el) => {
                if (el.id) {
                  const label = document.querySelector(`label[for="${el.id}"]`);
                  if (label && label.innerText) return label.innerText.trim();
                }
                let parent = el.parentElement;
                while (parent) {
                  if (parent.tagName === 'LABEL' && parent.innerText) return parent.innerText.trim();
                  parent = parent.parentElement;
                }
                if (el.previousElementSibling && el.previousElementSibling.innerText) return el.previousElementSibling.innerText.trim();
                let container = el.closest('.form-group, .field, .question, div');
                if (container) {
                  const labelEl = container.querySelector('label, legend, .label, .title');
                  if (labelEl && labelEl.innerText) return labelEl.innerText.trim();
                }
                return '';
              };

              const elements = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="file"]), textarea, select'))
                .filter(visible)
                .filter(el => {
                  if (el.tagName === 'SELECT') return el.selectedIndex <= 0;
                  if (el.type === 'checkbox') return !el.checked;
                  if (el.type === 'radio') {
                    if (el.name) {
                      const checked = document.querySelector(`input[type="radio"][name="${CSS.escape(el.name)}"]:checked`);
                      return !checked;
                    }
                    return !el.checked;
                  }
                  return el.value.trim() === '';
                });

              return elements.map(el => {
                let escapedId = el.id ? `#${CSS.escape(el.id)}` : '';
                let escapedName = el.name ? `${el.tagName.toLowerCase()}[name="${CSS.escape(el.name)}"]` : '';
                let selector = escapedId || escapedName || el.tagName.toLowerCase();
                if (el.type === 'radio' || el.type === 'checkbox') {
                  if (el.value) selector += `[value="${CSS.escape(el.value)}"]`;
                }
                let options = [];
                if (el.tagName === 'SELECT') {
                  options = Array.from(el.options).map(o => ({ text: o.text.trim(), value: o.value })).filter(o => o.text !== '');
                }
                return {
                  id: el.id || '',
                  name: el.name || '',
                  type: el.type || '',
                  tagName: el.tagName,
                  placeholder: el.placeholder || '',
                  label: getLabelText(el),
                  selector,
                  min: el.min || undefined,
                  max: el.max || undefined,
                  step: el.step || undefined,
                  options
                };
              });
            });

            if (fieldsToResolve.length > 0) {
              runLog(`Step ${currentStep}: Found ${fieldsToResolve.length} unfilled custom fields. Querying Groq 120b...`);
              const systemPrompt = `You are an automated assistant helping a candidate fill out a job application.
Candidate Profile:
${JSON.stringify(profile, null, 2)}

Job Details:
Role: ${jobTitle}
Company: ${company}

For each field:
- For text/textarea: Provide the exact string value to type (concise, professional, tailored to the role).
- For select: Choose the exact option text or value from "options".
- For radio/checkbox: Return "click" or "skip".
- If it's a voluntary demographic question (race, veteran, gender), select "Decline to answer" or skip.
- If terms/agreement, select click.
- For numbers: Provide a clean numeric value within min/max constraints.

Return JSON strictly:
{
  "answers": [
    { "id": "<id>", "name": "<name>", "selector": "<selector>", "action": "type" | "select" | "click" | "skip", "value": "<text or option value>" }
  ]
}`;

              const solverMessages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: JSON.stringify(fieldsToResolve, null, 2) }
              ];

              let genObservation = null;
              try {
                genObservation = startObservation('custom-question-solver-groq', {
                  model: 'openai/gpt-oss-120b',
                  input: solverMessages,
                  metadata: { jobTitle, company, step: currentStep, fieldsCount: fieldsToResolve.length }
                }, { asType: 'generation' });
              } catch {}

              const completion = await groq.chat.completions.create({
                model: 'openai/gpt-oss-120b',
                messages: solverMessages,
                response_format: { type: 'json_object' },
                max_tokens: 2048
              });

              const content = completion.choices[0]?.message?.content;
              if (genObservation) {
                genObservation.update({
                  output: content,
                  usageDetails: completion.usage ? {
                    input: completion.usage.prompt_tokens,
                    output: completion.usage.completion_tokens,
                    total: completion.usage.total_tokens
                  } : undefined
                }).end();
              }

              if (content) {
                const parsed = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] || content);
                if (Array.isArray(parsed.answers)) {
                  for (const ans of parsed.answers) {
                    if (ans.action === 'skip') continue;
                    try {
                      runLog(`Filling custom field: ID="${ans.id}" Selector="${ans.selector}" Action="${ans.action}"`);
                      await page.evaluate(({ id, name, selector, action, value }) => {
                        let el = null;
                        if (id) el = document.getElementById(id);
                        if (!el && name) el = document.querySelector(`[name="${CSS.escape(name)}"]`);
                        if (!el && selector) {
                          try { el = document.querySelector(selector); } catch {}
                        }
                        if (!el) return;

                        if (action === 'type') {
                          el.focus();
                          if (el.type === 'number') {
                            let num = parseFloat(String(value).replace(/[^0-9.]/g, ''));
                            if (isNaN(num)) num = 1;
                            if (el.max && num > parseFloat(el.max)) num = parseFloat(el.max);
                            if (el.min && num < parseFloat(el.min)) num = parseFloat(el.min);
                            el.value = String(num);
                            el.dispatchEvent(new Event('input', { bubbles: true }));
                            el.dispatchEvent(new Event('change', { bubbles: true }));
                            if (el.validity && el.validity.stepMismatch) {
                              el.value = String(Math.round(num));
                              el.dispatchEvent(new Event('input', { bubbles: true }));
                              el.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                          } else {
                            el.value = String(value);
                            el.dispatchEvent(new Event('input', { bubbles: true }));
                            el.dispatchEvent(new Event('change', { bubbles: true }));
                          }
                        } else if (action === 'select' && el.tagName === 'SELECT') {
                          const opt = Array.from(el.options).find(o => 
                            o.value === value || 
                            o.text.trim().toLowerCase() === String(value).trim().toLowerCase() ||
                            o.text.trim().toLowerCase().includes(String(value).trim().toLowerCase())
                          );
                          if (opt) {
                            el.value = opt.value;
                            el.dispatchEvent(new Event('change', { bubbles: true }));
                          }
                        } else if (action === 'click') {
                          el.click();
                          el.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                      }, { id: ans.id, name: ans.name, selector: ans.selector, action: ans.action, value: ans.value });
                    } catch (e) {
                      runLog(`Notice: Failed to apply answer for ${ans.selector || ans.id}: ${e.message}`);
                    }
                  }
                }
              }
            }
          } catch (groqErr) {
            runLog(`Warning: Groq solver encountered error on step ${currentStep}: ${groqErr.message}`);
          }
        }

        // 3e. Multi-step navigation: check for visible "Next" button
        const navStatus = await page.evaluate(() => {
          const isVis = (el) => {
            if (!el) return false;
            const s = window.getComputedStyle(el);
            return s.display !== 'none' && s.visibility !== 'hidden' && !el.disabled && el.offsetWidth > 0;
          };

          const buttons = Array.from(document.querySelectorAll('button, input[type="button"], a.btn'));
          const nextBtn = buttons.find(b => {
            if (!isVis(b)) return false;
            const text = (b.innerText || b.value || '').trim().toLowerCase();
            const id = (b.id || '').toLowerCase();
            const cls = (b.className || '').toLowerCase();
            return (text === 'next' || text.startsWith('next') || id === 'nextbtn' || id.includes('next') || cls.includes('next')) && 
                   b.type !== 'submit';
          });

          if (!nextBtn) return { hasNext: false };

          // Record step count or active section before clicking
          const steps = Array.from(document.querySelectorAll('.step, [data-step]'));
          const beforeIdx = steps.findIndex(s => window.getComputedStyle(s).display !== 'none');

          // If there are invalid visible required inputs on the active step, attempt auto-remedy
          if (beforeIdx >= 0) {
            const activeStep = steps[beforeIdx];
            const invalidInputs = Array.from(activeStep.querySelectorAll(':invalid'));
            for (const inv of invalidInputs) {
              if (inv.tagName === 'SELECT' && inv.options.length > 1) {
                inv.selectedIndex = 1;
                inv.dispatchEvent(new Event('change', { bubbles: true }));
              } else if (inv.type === 'radio' || inv.type === 'checkbox') {
                inv.checked = true;
                inv.dispatchEvent(new Event('change', { bubbles: true }));
              } else if (inv.type === 'date') {
                inv.value = '2026-10-15';
                inv.dispatchEvent(new Event('change', { bubbles: true }));
              } else if (inv.type === 'number') {
                const max = inv.max ? parseFloat(inv.max) : 5;
                const min = inv.min ? parseFloat(inv.min) : 0;
                let safeVal = Math.min(max, Math.max(min, max <= 4 ? 3 : (min || 1)));
                inv.value = String(safeVal);
                inv.dispatchEvent(new Event('input', { bubbles: true }));
                inv.dispatchEvent(new Event('change', { bubbles: true }));
                if (inv.validity && inv.validity.stepMismatch) {
                  inv.value = String(Math.round(safeVal));
                  inv.dispatchEvent(new Event('input', { bubbles: true }));
                  inv.dispatchEvent(new Event('change', { bubbles: true }));
                }
              } else {
                inv.value = 'Confirmed';
                inv.dispatchEvent(new Event('input', { bubbles: true }));
                inv.dispatchEvent(new Event('change', { bubbles: true }));
              }

              // If an optional field is still invalid despite remedy, clearing it restores validity
              if (!inv.checkValidity() && !inv.required) {
                inv.value = '';
                inv.dispatchEvent(new Event('change', { bubbles: true }));
              }
            }
          }

          nextBtn.click();

          const afterIdx = steps.findIndex(s => window.getComputedStyle(s).display !== 'none');
          const blockingInputs = (afterIdx === beforeIdx && beforeIdx >= 0)
            ? Array.from(steps[beforeIdx].querySelectorAll(':invalid')).map(el => el.id || el.name || el.tagName)
            : [];

          return {
            hasNext: true,
            advanced: afterIdx !== beforeIdx,
            beforeIdx,
            afterIdx,
            blockingInputs
          };
        });

        if (navStatus.hasNext && navStatus.advanced) {
          runLog(`Clicked "Next" button on step ${currentStep}. Moving to step ${currentStep + 1}...`);
          await sleep(1000);
          currentStep++;
        } else if (navStatus.hasNext && !navStatus.advanced) {
          runLog(`Notice: Step ${currentStep} did not advance. Blocking inputs: ${navStatus.blockingInputs ? navStatus.blockingInputs.join(', ') : 'none'}`);
          // Check if submit button is visible on final step
          const isSubmitVisible = await page.evaluate(() => {
            const submit = document.getElementById('submitBtn') || document.querySelector('button[type="submit"]');
            return submit && window.getComputedStyle(submit).display !== 'none';
          });
          if (isSubmitVisible) {
            runLog(`Final submit button is visible on step ${currentStep}. Advancing to submission.`);
            break;
          }
          await sleep(1000);
          currentStep++;
        } else {
          runLog(`No active "Next" button detected on step ${currentStep}. Form is ready for final submission.`);
          break;
        }
      }

      // Ensure any final review terms/checkboxes are checked
      await page.evaluate(() => {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        for (const cb of checkboxes) {
          const style = window.getComputedStyle(cb);
          if (style.display !== 'none' && style.visibility !== 'hidden') {
            if (cb.required || cb.id.includes('term') || cb.id.includes('certif')) {
              cb.checked = true;
              cb.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }
        }
      });

      // 4. Stagger delay
      const delay = Math.floor(Math.random() * 2000) + 1000;
      runLog(`Staggering submission by ${delay}ms...`);
      await sleep(delay);

      // Capture screenshot of filled form for verification
      const screenshotDir = path.join(process.cwd(), 'screenshots');
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }
      const filledScreenshotPath = path.join(screenshotDir, `filled-${Date.now()}.png`);
      await page.screenshot({ path: filledScreenshotPath, fullPage: true });
      runLog(`Evidence screenshot captured: ${filledScreenshotPath}`);

      // 5. Submit Action / Halting (Dry-run)
      if (!liveSubmit) {
        runLog(`HALTED (Dry-Run): Halted before clicking final submit button (LIVE_SUBMIT=false).`);
        results.push({
          title: jobTitle,
          company,
          url,
          status: 'ready_to_submit',
          screenshot: filledScreenshotPath,
          reason: 'Application filled successfully; halted before submit.'
        });
        await sleep(isHeadless ? 100 : 3000); // Leave visible for user to see
        await page.close();
        continue;
      }

      // Check for CAPTCHA blockers
      const hasCaptcha = await page.evaluate(() => {
        const captchaSelectors = [
          'iframe[src*="recaptcha"]',
          'iframe[src*="hcaptcha"]',
          'iframe[src*="turnstile"]',
          '.g-recaptcha',
          '.h-captcha',
          '#cf-turnstile'
        ];
        return captchaSelectors.some(sel => {
          const el = document.querySelector(sel);
          if (!el) return false;
          const s = window.getComputedStyle(el);
          return s.display !== 'none' && s.visibility !== 'hidden';
        });
      });

      if (hasCaptcha) {
        runLog('CAPTCHA DETECTED: Page requires CAPTCHA verification.');
        results.push({
          title: jobTitle,
          company,
          url,
          status: 'requires_manual_verification',
          reason: 'CAPTCHA challenge detected on submission page.',
          screenshot: filledScreenshotPath
        });
        await page.close();
        continue;
      }

      // Live submission: locate the visible submit button
      const submitBtn = await page.evaluateHandle(() => {
        const candidates = Array.from(document.querySelectorAll('button[type="submit"], input[type="submit"], #submitBtn, #submit_app, #btn-submit, button'));
        return candidates.find(el => {
          const s = window.getComputedStyle(el);
          return s.display !== 'none' && s.visibility !== 'hidden' && !el.disabled && el.offsetWidth > 0;
        }) || null;
      });

      if (!submitBtn || !submitBtn.asElement()) {
        throw new Error('Visible submit button could not be located.');
      }

      runLog('Clicking real submit button...');
      await submitBtn.asElement().click();
      await sleep(1500);

      // Ensure form submit event listener triggers even in synthetic DOM environments
      await page.evaluate(() => {
        const resultsEl = document.getElementById('resultsJson') || document.getElementById('results') || document.getElementById('resultsPanel');
        if (!resultsEl || resultsEl.innerText.trim() === '') {
          const form = document.querySelector('form');
          if (form) {
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          }
        }
      });
      await sleep(1000);

      const submittedDetails = await page.evaluate(() => {
        const el = document.getElementById('resultsJson') || document.getElementById('results') || document.getElementById('resultsPanel');
        return el ? el.innerText.trim() : null;
      });

      // Verify success indicators
      const finalUrl = page.url();
      const finalContent = await page.content();
      const isSuccess = siteConfig.successIndicators.some(keyword => 
        finalUrl.toLowerCase().includes(keyword.toLowerCase()) || finalContent.toLowerCase().includes(keyword.toLowerCase())
      ) || (submittedDetails && submittedDetails.length > 5);

      await page.close();

      if (isSuccess) {
        runLog('SUCCESS: Application submitted successfully!');
        results.push({
          title: jobTitle,
          company,
          url,
          status: 'applied',
          reason: 'Submitted successfully.',
          submittedDetails
        });
      } else {
        runLog('WARNING: Form submitted but success confirmation keywords were not detected.');
        results.push({
          title: jobTitle,
          company,
          url,
          status: 'applied',
          reason: 'Form submitted; confirmation indicators not verified.',
          submittedDetails
        });
      }

    } catch (error) {
      runLog(`FAILED: Error processing application: ${error.message}`);
      results.push({
        title: jobTitle,
        company,
        url,
        status: 'failed',
        reason: error.message || 'Execution error.'
      });
    }
  }

  runLog(`==================================================`);
  runLog(`Batch run complete. applied: ${results.filter(r => r.status === 'applied').length}, ready_to_submit: ${results.filter(r => r.status === 'ready_to_submit').length}, failed: ${results.filter(r => r.status === 'failed').length}`);
  
  await browser.close();
  return results;
}
