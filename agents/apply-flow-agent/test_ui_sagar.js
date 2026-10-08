import puppeteer from 'puppeteer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testUi() {
  console.log('Launching headless browser to test dashboard UI...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100 });

  console.log('Navigating to http://127.0.0.1:5173/dashboard?section=domination ...');
  await page.goto('http://127.0.0.1:5173/dashboard?section=domination', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2000));

  // Dismiss any auth login modal
  console.log('Dismissing auth login modal if present...');
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    const closeBtn = document.querySelector('button[aria-label="Close modal"]');
    if (closeBtn) closeBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  // Trigger Multi Apply modal
  console.log('Triggering Multi Apply modal...');
  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.textContent.includes('Quick Apply') || b.textContent.includes('1-Click Multi Apply'));
    if (target) {
      target.click();
      return target.textContent.trim();
    }
    return null;
  });
  console.log('Clicked target button:', clicked);
  await new Promise((r) => setTimeout(r, 1200));

  // Click start button
  const started = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const startBtn = btns.find(b => b.textContent.includes('Start 1-Click Multi-Apply Flow'));
    if (startBtn) {
      startBtn.click();
      return true;
    }
    return false;
  });
  console.log('Start button clicked?', started);

  // Wait 2.8 seconds for Step 1 (Contact Autofill) and Step 2 (Attach Resume) to run
  console.log('Waiting for live autofill typing...');
  await new Promise((r) => setTimeout(r, 2800));

  // Scroll modal into center view
  await page.evaluate(() => {
    const modal = document.querySelector('div[class*="multiApplyModal"]');
    if (modal) {
      modal.scrollIntoView({ behavior: 'instant', block: 'center' });
    }
  });
  await new Promise((r) => setTimeout(r, 500));

  // Take screenshot of modal
  const screenshotPath = path.resolve(__dirname, '..', '..', 'screenshots', 'sagar_modal_live_fill.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log('Saved screenshot to:', screenshotPath);

  // Take an element screenshot of the modal directly if found
  const modalEl = await page.$('div[class*="multiApplyModal"]');
  if (modalEl) {
    const modalShotPath = path.resolve(__dirname, '..', '..', 'screenshots', 'sagar_modal_element.png');
    await modalEl.screenshot({ path: modalShotPath });
    console.log('Saved modal element screenshot to:', modalShotPath);
  }

  // Verify visible fields on page
  const verification = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasSagar: text.includes('SAGAR'),
      hasSagarEmail: text.includes('sagar19782008@gmail.com') || text.includes('Sagar19782008@gmail.com'),
      hasPhone: text.includes('+91 8544780822') || text.includes('8544780822'),
      hasBangalore: text.includes('Bangalore'),
      hasPython: text.includes('Python'),
      hasGenAI: text.includes('Generative AI')
    };
  });
  console.log('Verification result:', verification);

  await browser.close();
}

testUi().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
