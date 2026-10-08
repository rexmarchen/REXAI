import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

async function createPdf() {
  const html = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: Arial, sans-serif; margin: 40px; color: #111; line-height: 1.4; }
      h1 { margin-bottom: 4px; font-size: 24px; }
      .contact { font-size: 13px; margin-bottom: 16px; color: #333; }
      h2 { font-size: 14px; text-transform: uppercase; border-bottom: 1.5px solid #222; padding-bottom: 3px; margin-top: 18px; margin-bottom: 8px; }
      .job-header { display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; }
      .job-dates { font-weight: normal; font-style: italic; }
      ul { margin-top: 4px; margin-bottom: 10px; padding-left: 20px; font-size: 13px; }
      li { margin-bottom: 3px; }
      p { font-size: 13px; margin: 4px 0; }
    </style>
  </head>
  <body>
    <h1>Priya Sharma</h1>
    <div class="contact">
      priya.sharma88@gmail.com | (415) 555-0192 | San Francisco, CA<br>
      linkedin.com/in/priyasharma-dev &nbsp;|&nbsp; github.com/psharma-eng
    </div>

    <h2>Summary</h2>
    <p>Backend software engineer with 6 years of experience building distributed systems and developer tooling. Focused on reliability, observability, and clean API design.</p>

    <h2>Experience</h2>
    <div class="job-header">
      <span>Senior Backend Engineer, Northwind Logistics</span>
      <span class="job-dates">Mar 2022 - Present</span>
    </div>
    <ul>
      <li>Led migration of the shipment-tracking service from a monolith to event-driven microservices, reducing p99 latency by 40%.</li>
      <li>Owns the team's on-call rotation and incident response process.</li>
    </ul>

    <div class="job-header">
      <span>Software Engineer, Clearwater Analytics</span>
      <span class="job-dates">Jul 2019 - Feb 2022</span>
    </div>
    <ul>
      <li>Built internal data pipeline tooling used by 30+ analysts daily.</li>
      <li>Reduced report generation time from 4 hours to 12 minutes via query optimization.</li>
    </ul>

    <h2>Education</h2>
    <div class="job-header">
      <span>B.S. in Computer Science, University of Washington</span>
      <span class="job-dates">2015 - 2019</span>
    </div>

    <h2>Skills</h2>
    <p>Python, Go, PostgreSQL, Kafka, Docker, Kubernetes, AWS, gRPC, Redis, Terraform</p>
  </body>
  </html>`;

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const outPath = path.resolve('temp', 'priya_sharma_resume.pdf');
  await page.pdf({ path: outPath, format: 'A4' });
  await browser.close();
  console.log('Created PDF at:', outPath);
}

createPdf().catch(console.error);
