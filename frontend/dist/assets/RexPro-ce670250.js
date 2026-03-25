import{r as o,a as n}from"./index-0ed2e5d7.js";const s=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ResumeAI Pro — Your Career Copilot</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #07080f;
    --bg2: #0d0e1a;
    --bg3: #12142199;
    --surface: #141520;
    --surface2: #1b1d2e;
    --border: #2a2c42;
    --border2: #363853;
    --jade: #00e5a0;
    --jade2: #00b87c;
    --jade-dim: #00e5a015;
    --jade-glow: #00e5a030;
    --gold: #f5c842;
    --gold-dim: #f5c84215;
    --blue: #4d7cfe;
    --blue-dim: #4d7cfe15;
    --red: #ff4d6d;
    --red-dim: #ff4d6d15;
    --text: #e8eaf6;
    --text2: #9497b5;
    --text3: #5c5f7a;
    --radius: 12px;
    --radius-sm: 8px;
    --radius-lg: 18px;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* ── GRID BG ── */
  body::before {
    content: '';
    position: fixed; inset: 0;
    background-image:
      linear-gradient(var(--border) 1px, transparent 1px),
      linear-gradient(90deg, var(--border) 1px, transparent 1px);
    background-size: 60px 60px;
    opacity: 0.15;
    pointer-events: none;
    z-index: 0;
  }

  .page { position: relative; z-index: 1; }

  /* ── NAV ── */
  nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 48px;
    border-bottom: 1px solid var(--border);
    background: #07080fcc;
    backdrop-filter: blur(20px);
    position: sticky; top: 0; z-index: 100;
  }
  .logo {
    font-family: 'Syne', sans-serif;
    font-size: 22px; font-weight: 800;
    display: flex; align-items: center; gap: 10px;
  }
  .logo-dot {
    width: 10px; height: 10px;
    background: var(--jade); border-radius: 50%;
    box-shadow: 0 0 12px var(--jade);
    animation: pulse 2s infinite;
  }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.8)} }

  .nav-badge {
    font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
    background: var(--jade-glow); color: var(--jade);
    border: 1px solid var(--jade2);
    padding: 4px 10px; border-radius: 20px;
    text-transform: uppercase;
  }

  /* ── HERO ── */
  .hero {
    padding: 100px 48px 80px;
    max-width: 1100px; margin: 0 auto;
    display: flex; flex-direction: column; align-items: center; text-align: center;
    gap: 24px;
  }
  .hero-tag {
    font-size: 12px; font-weight: 600; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--jade);
    border: 1px solid var(--border2); padding: 6px 16px;
    border-radius: 20px; background: var(--jade-dim);
    display: inline-flex; align-items: center; gap: 8px;
  }
  .live-dot {
    width: 6px; height: 6px; background: var(--jade); border-radius: 50%;
    animation: pulse 1.5s infinite;
  }
  h1 {
    font-family: 'Syne', sans-serif;
    font-size: clamp(42px, 7vw, 80px);
    font-weight: 800; line-height: 1.05;
    letter-spacing: -0.03em;
  }
  h1 span { color: var(--jade); }
  .hero-sub {
    font-size: 18px; line-height: 1.7; color: var(--text2);
    max-width: 560px; font-weight: 400;
  }
  .hero-stats {
    display: flex; gap: 40px; margin-top: 8px;
  }
  .stat { text-align: center; }
  .stat-num {
    font-family: 'Syne', sans-serif;
    font-size: 28px; font-weight: 800; color: var(--jade);
  }
  .stat-label { font-size: 12px; color: var(--text3); margin-top: 2px; }

  /* ── UPLOAD SECTION ── */
  .upload-section {
    max-width: 780px; margin: 0 auto 80px;
    padding: 0 24px;
  }

  .upload-card {
    background: var(--surface);
    border: 1px solid var(--border2);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .upload-header {
    padding: 28px 32px 24px;
    border-bottom: 1px solid var(--border);
  }
  .upload-header h2 {
    font-family: 'Syne', sans-serif;
    font-size: 22px; font-weight: 700;
  }
  .upload-header p {
    font-size: 14px; color: var(--text2); margin-top: 6px;
  }

  /* tab switcher */
  .tab-row {
    display: flex; gap: 4px;
    padding: 20px 32px 0;
  }
  .tab-btn {
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500;
    padding: 8px 18px; border-radius: 8px;
    border: 1px solid transparent;
    cursor: pointer; transition: all 0.2s;
    background: transparent; color: var(--text2);
  }
  .tab-btn.active {
    background: var(--jade-glow);
    border-color: var(--jade2);
    color: var(--jade);
  }
  .tab-btn:hover:not(.active) {
    background: var(--surface2); color: var(--text);
  }

  .tab-content { padding: 20px 32px 32px; }

  /* dropzone */
  .dropzone {
    border: 2px dashed var(--border2);
    border-radius: var(--radius);
    padding: 48px 24px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }
  .dropzone:hover, .dropzone.drag-over {
    border-color: var(--jade2);
    background: var(--jade-dim);
  }
  .dropzone input[type=file] {
    position: absolute; inset: 0; opacity: 0; cursor: pointer;
  }
  .dz-icon {
    width: 56px; height: 56px;
    background: var(--bg3);
    border: 1px solid var(--border2);
    border-radius: var(--radius);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px; font-size: 24px;
  }
  .dz-title { font-size: 16px; font-weight: 500; }
  .dz-sub { font-size: 13px; color: var(--text3); margin-top: 4px; }

  /* textarea */
  .resume-textarea {
    width: 100%; height: 220px;
    background: var(--bg); border: 1px solid var(--border2);
    border-radius: var(--radius); padding: 16px;
    font-family: 'DM Mono', monospace; font-size: 13px;
    color: var(--text); resize: vertical; outline: none;
    transition: border-color 0.2s;
    line-height: 1.6;
  }
  .resume-textarea::placeholder { color: var(--text3); }
  .resume-textarea:focus { border-color: var(--jade2); }

  .char-count {
    font-size: 12px; color: var(--text3); text-align: right; margin-top: 6px;
  }

  /* analyze btn */
  .btn-analyze {
    width: 100%; padding: 16px;
    background: var(--jade);
    color: #000; font-family: 'Syne', sans-serif;
    font-size: 16px; font-weight: 700;
    border: none; border-radius: var(--radius);
    cursor: pointer; margin-top: 16px;
    transition: all 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 10px;
  }
  .btn-analyze:hover:not(:disabled) {
    background: #00ffc2; transform: translateY(-1px);
    box-shadow: 0 8px 30px var(--jade-glow);
  }
  .btn-analyze:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  /* ── LOADING ── */
  .loading-screen {
    display: none; text-align: center; padding: 60px 32px;
  }
  .loading-screen.visible { display: block; }
  .loader-ring {
    width: 64px; height: 64px; margin: 0 auto 24px;
    border: 2px solid var(--border2);
    border-top-color: var(--jade);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-steps {
    list-style: none; display: inline-flex;
    flex-direction: column; gap: 10px; text-align: left; margin-top: 24px;
  }
  .loading-step {
    display: flex; align-items: center; gap: 10px;
    font-size: 14px; color: var(--text3);
  }
  .loading-step.done { color: var(--jade); }
  .loading-step.active { color: var(--text); }
  .step-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--border2); flex-shrink: 0;
  }
  .loading-step.done .step-dot { background: var(--jade); }
  .loading-step.active .step-dot {
    background: var(--jade); animation: pulse 1s infinite;
  }

  /* ── ANALYSIS RESULT CARD ── */
  .analysis-card {
    display: none;
    background: var(--surface2);
    border: 1px solid var(--jade2);
    border-radius: var(--radius);
    padding: 20px 24px; margin: 16px 0;
  }
  .analysis-card.visible { display: block; }
  .analysis-card h3 {
    font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700;
    color: var(--jade); margin-bottom: 16px;
  }
  .analysis-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  }
  .analysis-item label {
    font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em;
    color: var(--text3); display: block; margin-bottom: 4px;
  }
  .analysis-item .value {
    font-size: 14px; color: var(--text); font-weight: 500;
  }
  .skill-chips {
    display: flex; flex-wrap: wrap; gap: 6px; grid-column: 1 / -1;
  }
  .chip {
    font-size: 12px; font-weight: 500;
    padding: 4px 10px; border-radius: 20px;
    background: var(--jade-dim); color: var(--jade);
    border: 1px solid var(--jade2);
  }

  /* ── JOBS SECTION ── */
  .jobs-section {
    max-width: 1100px; margin: 0 auto; padding: 0 24px 80px;
    display: none;
  }
  .jobs-section.visible { display: block; }

  .jobs-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 24px; flex-wrap: wrap; gap: 16px;
  }
  .jobs-header h2 {
    font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800;
  }
  .jobs-meta { font-size: 14px; color: var(--text2); margin-top: 4px; line-height: 1.6; }

  .btn-auto-apply {
    display: flex; align-items: center; gap: 10px;
    background: var(--gold-dim); color: var(--gold);
    border: 1px solid var(--gold);
    font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700;
    padding: 12px 24px; border-radius: var(--radius);
    cursor: pointer; transition: all 0.2s;
  }
  .btn-auto-apply:hover {
    background: var(--gold); color: #000;
    box-shadow: 0 6px 24px #f5c84240;
  }
  .btn-auto-apply:disabled {
    opacity: 0.5; cursor: not-allowed;
  }

  /* filter bar */
  .filter-bar {
    display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 28px;
  }
  .filter-chip {
    font-size: 12px; font-weight: 600;
    padding: 6px 14px; border-radius: 20px;
    border: 1px solid var(--border2);
    background: transparent; color: var(--text2);
    cursor: pointer; transition: all 0.15s;
    font-family: 'DM Sans', sans-serif;
  }
  .filter-chip.active {
    background: var(--blue-dim); color: var(--blue); border-color: var(--blue);
  }
  .filter-chip:hover:not(.active) {
    border-color: var(--border2); color: var(--text); background: var(--surface);
  }

  /* job cards grid */
  .jobs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 16px;
  }

  /* individual job card */
  .job-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 22px 24px;
    transition: all 0.2s; position: relative; overflow: hidden;
    cursor: default;
  }
  .job-card:hover {
    border-color: var(--border2);
    transform: translateY(-2px);
    box-shadow: 0 12px 40px #000a;
  }
  .job-card.applied {
    border-color: var(--jade2);
    background: var(--surface);
  }
  .job-card.applied::after {
    content: '✓ Applied';
    position: absolute; top: 14px; right: 14px;
    font-size: 11px; font-weight: 700;
    background: var(--jade-glow); color: var(--jade);
    border: 1px solid var(--jade2);
    padding: 3px 8px; border-radius: 20px;
  }

  .card-top {
    display: flex; align-items: flex-start; gap: 14px; margin-bottom: 14px;
  }
  .company-logo {
    width: 44px; height: 44px; flex-shrink: 0;
    background: var(--surface2); border: 1px solid var(--border2);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; font-weight: 800;
    font-family: 'Syne', sans-serif;
    color: var(--text);
  }
  .card-meta { flex: 1; }
  .job-title {
    font-size: 15px; font-weight: 600;
    line-height: 1.3; margin-bottom: 4px;
    font-family: 'Syne', sans-serif;
  }
  .company-name { font-size: 13px; color: var(--text2); }

  .match-badge {
    font-size: 11px; font-weight: 700;
    padding: 4px 10px; border-radius: 20px;
    flex-shrink: 0;
  }
  .match-high { background: var(--jade-glow); color: var(--jade); border: 1px solid var(--jade2); }
  .match-mid { background: var(--gold-dim); color: var(--gold); border: 1px solid #f5c84280; }
  .match-low { background: var(--blue-dim); color: var(--blue); border: 1px solid #4d7cfe80; }

  .job-tags {
    display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px;
  }
  .job-tag {
    font-size: 11px; padding: 3px 8px; border-radius: 6px;
    background: var(--surface2); color: var(--text3);
    border: 1px solid var(--border);
  }
  .job-tag.type { color: var(--blue); background: var(--blue-dim); border-color: #4d7cfe40; }

  .job-salary {
    font-size: 14px; font-weight: 600; color: var(--jade);
    margin-bottom: 12px;
  }
  .no-salary { font-size: 13px; color: var(--text3); }

  .card-footer {
    display: flex; align-items: center; justify-content: space-between;
    border-top: 1px solid var(--border); padding-top: 12px; margin-top: 4px;
  }
  .posted-date { font-size: 12px; color: var(--text3); }

  .btn-apply {
    font-size: 12px; font-weight: 600;
    padding: 7px 16px; border-radius: 8px;
    border: 1px solid var(--border2);
    background: transparent; color: var(--text);
    cursor: pointer; transition: all 0.15s;
    font-family: 'DM Sans', sans-serif;
  }
  .btn-apply:hover {
    background: var(--jade); color: #000;
    border-color: var(--jade);
  }
  .btn-apply.applied-btn {
    background: var(--jade-glow); color: var(--jade);
    border-color: var(--jade2); pointer-events: none;
  }

  /* ── TOAST ── */
  #toast {
    position: fixed; bottom: 32px; right: 32px; z-index: 9999;
    background: var(--surface);
    border: 1px solid var(--jade2); border-radius: var(--radius);
    padding: 14px 20px;
    font-size: 14px; font-weight: 500; color: var(--jade);
    display: flex; align-items: center; gap: 10px;
    transform: translateY(80px); opacity: 0;
    transition: all 0.3s;
    box-shadow: 0 8px 32px #000c;
    max-width: 340px;
  }
  #toast.show { transform: translateY(0); opacity: 1; }

  /* ── APPLY PROGRESS ── */
  .apply-progress {
    background: var(--surface);
    border: 1px solid var(--border2);
    border-radius: var(--radius);
    padding: 20px 24px; margin-bottom: 24px;
    display: none;
  }
  .apply-progress.visible { display: block; }
  .progress-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 10px;
  }
  .progress-header span { font-size: 14px; font-weight: 500; }
  .progress-bar {
    height: 4px; background: var(--border2); border-radius: 2px; overflow: hidden;
  }
  .progress-fill {
    height: 100%; background: var(--jade); border-radius: 2px;
    transition: width 0.4s ease;
  }

  /* ── ERROR ── */
  .error-banner {
    background: var(--red-dim); border: 1px solid #ff4d6d60;
    border-radius: var(--radius); padding: 14px 18px;
    font-size: 14px; color: #ff4d6d; margin: 12px 0; display: none;
  }
  .error-banner.visible { display: block; }

  /* ── HOW IT WORKS ── */
  .how-section {
    max-width: 1100px; margin: 0 auto; padding: 0 24px 80px;
  }
  .section-title {
    font-family: 'Syne', sans-serif;
    font-size: 32px; font-weight: 800;
    text-align: center; margin-bottom: 48px;
  }
  .steps-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }
  .step-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 28px 22px;
  }
  .step-num {
    font-family: 'Syne', sans-serif;
    font-size: 36px; font-weight: 800;
    color: var(--jade); opacity: 0.3; line-height: 1;
    margin-bottom: 12px;
  }
  .step-card h3 {
    font-family: 'Syne', sans-serif;
    font-size: 16px; font-weight: 700; margin-bottom: 8px;
  }
  .step-card p { font-size: 14px; color: var(--text2); line-height: 1.6; }

  /* ── FOOTER ── */
  footer {
    border-top: 1px solid var(--border);
    padding: 24px 48px;
    display: flex; justify-content: space-between; align-items: center;
    font-size: 13px; color: var(--text3);
  }

  /* ── RESPONSIVE ── */
  @media (max-width: 640px) {
    nav { padding: 16px 20px; }
    .hero { padding: 60px 20px 50px; }
    .upload-section { padding: 0 16px; }
    .upload-header { padding: 20px; }
    .tab-content { padding: 16px 20px 24px; }
    .tab-row { padding: 16px 20px 0; }
    .jobs-section { padding: 0 16px 60px; }
    .hero-stats { gap: 24px; }
    .analysis-grid { grid-template-columns: 1fr; }
    footer { flex-direction: column; gap: 8px; text-align: center; }
  }
</style>
</head>
<body>

<div class="page">

<!-- NAV -->
<nav>
  <div class="logo">
    <div class="logo-dot"></div>
    Rex <span style="color:var(--jade)">Pro</span>
  </div>
  <div class="nav-badge"><span class="live-dot"></span> Live Internships</div>
</nav>

<!-- HERO -->
<section class="hero">
  <div class="hero-tag">
    <span class="live-dot"></span>
    Live Internship Search
  </div>
  <h1>Your Resume.<br><span>Matched to Live Internships.</span><br>Opened Fast.</h1>
  <p class="hero-sub">Upload your resume, let Rex Pro map your skills, and see live internship opportunities with exact job titles, company names, and fresh posted-time labels.</p>
  <div class="hero-stats">
    <div class="stat">
      <div class="stat-num">Live</div>
      <div class="stat-label">RapidAPI internship feed</div>
    </div>
    <div class="stat">
      <div class="stat-num">Fresh</div>
      <div class="stat-label">Hours-ago timestamps</div>
    </div>
    <div class="stat">
      <div class="stat-num">Exact</div>
      <div class="stat-label">Role and company names</div>
    </div>
  </div>
</section>

<!-- UPLOAD -->
<section class="upload-section">
  <div class="upload-card">
    <div class="upload-header">
      <h2>🚀 Start With Your Resume</h2>
      <p>Upload a PDF or paste your resume text — our AI will do the rest</p>
    </div>

    <div class="tab-row">
      <button class="tab-btn active" onclick="switchTab('text')">✏️ Paste Resume</button>
      <button class="tab-btn" onclick="switchTab('file')">📄 Upload File</button>
    </div>

    <div class="tab-content">

      <!-- Paste tab -->
      <div id="tab-text">
        <textarea
          class="resume-textarea"
          id="resumeText"
          placeholder="Paste your resume here...

Example:
John Smith | Software Engineer
Email: john@example.com | GitHub: github.com/john

EXPERIENCE
Senior Software Engineer @ Google (2021-Present)
- Led development of distributed systems serving 10M+ users
- Built microservices with Python, Go, Kubernetes

SKILLS: Python, JavaScript, React, Node.js, AWS, Docker, PostgreSQL

EDUCATION
B.S. Computer Science, MIT (2018)"
          oninput="updateCharCount(this)"
        ></textarea>
        <div class="char-count" id="charCount">0 characters</div>
      </div>

      <!-- File tab -->
      <div id="tab-file" style="display:none">
        <div class="dropzone" id="dropzone"
             ondragover="handleDragOver(event)"
             ondragleave="handleDragLeave(event)"
             ondrop="handleDrop(event)">
          <input type="file" accept=".pdf,.txt,.doc,.docx" onchange="handleFileSelect(event)">
          <div class="dz-icon">📎</div>
          <div class="dz-title">Drop your resume here</div>
          <div class="dz-sub">PDF, TXT — or click to browse</div>
        </div>
        <div id="fileStatus" style="margin-top:12px; font-size:13px; color:var(--jade); display:none"></div>
      </div>

      <div class="error-banner" id="errorBanner"></div>

      <button class="btn-analyze" id="analyzeBtn" onclick="analyzeResume()">
        <span id="analyzeBtnText">⚡ Analyze My Resume & Find Jobs</span>
      </button>
    </div>

    <!-- Loading screen -->
    <div class="loading-screen" id="loadingScreen">
      <div class="loader-ring"></div>
      <div style="font-family:'Syne',sans-serif; font-size:18px; font-weight:700; margin-bottom:8px">
        Analyzing your resume...
      </div>
      <div style="font-size:14px; color:var(--text2)">Our AI is scanning your experience</div>
      <ul class="loading-steps" id="loadingSteps">
        <li class="loading-step" id="step1"><div class="step-dot"></div>Extracting skills & experience</li>
        <li class="loading-step" id="step2"><div class="step-dot"></div>Identifying target roles</li>
        <li class="loading-step" id="step3"><div class="step-dot"></div>Fetching live job listings</li>
        <li class="loading-step" id="step4"><div class="step-dot"></div>Computing match scores</li>
      </ul>
    </div>
  </div>

  <!-- Analysis Result -->
  <div class="analysis-card" id="analysisCard">
    <h3>✨ AI Resume Analysis</h3>
    <div class="analysis-grid" id="analysisGrid"></div>
  </div>
</section>

<!-- HOW IT WORKS (shown only before analysis) -->
<section class="how-section" id="howSection">
  <div class="section-title">How It Works</div>
  <div class="steps-grid">
    <div class="step-card">
      <div class="step-num">01</div>
      <h3>Upload Resume</h3>
      <p>Paste or upload your resume in any format. PDF, DOCX, or plain text all work.</p>
    </div>
    <div class="step-card">
      <div class="step-num">02</div>
      <h3>AI Analysis</h3>
      <p>Claude AI extracts your skills, experience years, target roles, and strengths automatically.</p>
    </div>
    <div class="step-card">
      <div class="step-num">03</div>
      <h3>Live Job Match</h3>
      <p>We fetch real, live job listings from top boards and score them against your profile.</p>
    </div>
    <div class="step-card">
      <div class="step-num">04</div>
      <h3>One-Click Apply</h3>
      <p>Hit Auto-Apply and we open every matched job's application page simultaneously.</p>
    </div>
  </div>
</section>

<!-- JOBS SECTION -->
<section class="jobs-section" id="jobsSection">
  <div class="jobs-header">
    <div>
      <h2>🎯 Your Matched Jobs</h2>
      <div class="jobs-meta" id="jobsMeta"></div>
    </div>
    <button class="btn-auto-apply" id="autoApplyBtn" onclick="autoApplyAll()">
      ⚡ Auto Apply All
    </button>
  </div>

  <div class="apply-progress" id="applyProgress">
    <div class="progress-header">
      <span id="progressText">Opening application pages...</span>
      <span id="progressPct" style="color:var(--jade); font-weight:700">0%</span>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" id="progressFill" style="width:0%"></div>
    </div>
  </div>

  <div class="filter-bar" id="filterBar"></div>
  <div class="jobs-grid" id="jobsGrid"></div>
</section>

<!-- FOOTER -->
<footer>
  <div>© 2025 ResumeAI Pro — AI-Powered Career Platform</div>
  <div>Powered by Claude AI · Real-time Job Data</div>
</footer>

</div><!-- .page -->

<!-- TOAST -->
<div id="toast">
  <span id="toastIcon">✓</span>
  <span id="toastMsg"></span>
</div>

<script>
// ─── STATE ───────────────────────────────────────────────────────
let resumeAnalysis = null;
let allJobs = [];
let appliedJobs = new Set();
let activeFilter = 'all';
let fileContent = '';
let currentTab = 'text';
let lastFeedMeta = { recent24h: 0, providers: [] };

const API_BASE_URL = decodeURIComponent('__REXION_API_BASE_URL__');
const INTERNSHIP_ROLE_REGEX = /\\b(intern|internship|trainee|apprentice|fellow)\\b/i;
const COMMON_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Python', 'Java',
  'C++', 'SQL', 'PostgreSQL', 'MongoDB', 'AWS', 'Docker', 'Kubernetes', 'Git',
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'NLP', 'LLM',
  'Data Analysis', 'Power BI', 'Tableau', 'Excel', 'Figma', 'UI/UX', 'CSS', 'HTML'
];
const ROLE_PROFILES = [
  { role: 'Software Engineer', terms: ['software engineer', 'software developer', 'developer', 'engineer'] },
  { role: 'Frontend Developer', terms: ['frontend', 'front end', 'react', 'next.js', 'ui developer'] },
  { role: 'Backend Developer', terms: ['backend', 'back end', 'api', 'microservice', 'node.js', 'django', 'flask', 'spring'] },
  { role: 'Full Stack Developer', terms: ['full stack', 'fullstack', 'react', 'node.js', 'web app'] },
  { role: 'Data Analyst', terms: ['data analyst', 'analytics', 'sql', 'tableau', 'power bi'] },
  { role: 'Data Scientist', terms: ['data scientist', 'data science', 'python', 'statistics'] },
  { role: 'Machine Learning Engineer', terms: ['machine learning', 'ml engineer', 'deep learning', 'tensorflow', 'pytorch', 'llm', 'nlp'] },
  { role: 'UI/UX Designer', terms: ['ui', 'ux', 'figma', 'product design', 'designer'] },
  { role: 'Product Manager', terms: ['product manager', 'roadmap', 'stakeholder', 'product'] },
  { role: 'DevOps Engineer', terms: ['devops', 'aws', 'docker', 'kubernetes', 'ci/cd', 'cloud'] }
];

applyStaticCopy();

function applyStaticCopy() {
  const uploadTitle = document.querySelector('.upload-header h2');
  if (uploadTitle) uploadTitle.textContent = 'Start With Your Resume';

  const uploadBody = document.querySelector('.upload-header p');
  if (uploadBody) uploadBody.textContent = 'Upload a PDF or paste your resume text. Rex Pro will turn it into a live internship search.';

  const tabButtons = document.querySelectorAll('.tab-btn');
  if (tabButtons[0]) tabButtons[0].textContent = 'Paste Resume';
  if (tabButtons[1]) tabButtons[1].textContent = 'Upload File';

  const analyzeLabel = document.getElementById('analyzeBtnText');
  if (analyzeLabel) analyzeLabel.textContent = 'Analyze Resume and Find Internships';

  const loadingCaption = document.querySelector('#loadingScreen div[style*="color:var(--text2)"]');
  if (loadingCaption) loadingCaption.textContent = 'Rex Pro is reading your resume and pulling live internships.';

  const step3 = document.getElementById('step3');
  if (step3) step3.innerHTML = '<div class="step-dot"></div>Fetching live internships';

  const analysisHeader = document.querySelector('#analysisCard h3');
  if (analysisHeader) analysisHeader.textContent = 'Resume Snapshot';

  const stepCards = document.querySelectorAll('.step-card');
  if (stepCards[1]) {
    const heading = stepCards[1].querySelector('h3');
    const body = stepCards[1].querySelector('p');
    if (heading) heading.textContent = 'Profile Analysis';
    if (body) body.textContent = 'Rex Pro extracts your skills, experience, target roles, and internship focus automatically.';
  }
  if (stepCards[2]) {
    const heading = stepCards[2].querySelector('h3');
    const body = stepCards[2].querySelector('p');
    if (heading) heading.textContent = 'Live Internship Match';
    if (body) body.textContent = 'We fetch live internships from the jobs API and surface the freshest relevant opportunities.';
  }
  if (stepCards[3]) {
    const heading = stepCards[3].querySelector('h3');
    const body = stepCards[3].querySelector('p');
    if (heading) heading.textContent = 'Open Application Pages';
    if (body) body.textContent = 'Open internship application pages with job title, company, location, and posted-time context.';
  }

  const jobsHeading = document.querySelector('.jobs-header h2');
  if (jobsHeading) jobsHeading.textContent = 'Live Internship Matches';

  const openAllButton = document.getElementById('autoApplyBtn');
  if (openAllButton) openAllButton.textContent = 'Open All Applications';

  const progressText = document.getElementById('progressText');
  if (progressText) progressText.textContent = 'Opening application pages...';

  const footerBlocks = document.querySelectorAll('footer > div');
  if (footerBlocks[0]) footerBlocks[0].textContent = '© 2025 Rex Pro - Live Internship Copilot';
  if (footerBlocks[1]) footerBlocks[1].textContent = 'Powered by Rex Pro and live internship search';
}

// ─── TAB SWITCHER ─────────────────────────────────────────────────
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach((b, i) => {
    b.classList.toggle('active', (i === 0 && tab === 'text') || (i === 1 && tab === 'file'));
  });
  document.getElementById('tab-text').style.display = tab === 'text' ? 'block' : 'none';
  document.getElementById('tab-file').style.display = tab === 'file' ? 'block' : 'none';
}

function updateCharCount(el) {
  document.getElementById('charCount').textContent = el.value.length + ' characters';
}

// ─── FILE HANDLING ────────────────────────────────────────────────
function handleDragOver(e) {
  e.preventDefault();
  document.getElementById('dropzone').classList.add('drag-over');
}
function handleDragLeave(e) {
  document.getElementById('dropzone').classList.remove('drag-over');
}
function handleDrop(e) {
  e.preventDefault();
  document.getElementById('dropzone').classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) processFile(file);
}
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) processFile(file);
}

function processFile(file) {
  const status = document.getElementById('fileStatus');
  status.style.display = 'block';
  status.textContent = '📄 Reading: ' + file.name + '...';

  const reader = new FileReader();
  reader.onload = (e) => {
    fileContent = e.target.result;
    // If PDF binary, use a placeholder note
    if (file.type === 'application/pdf') {
      // Extract any readable text from PDF (basic)
      fileContent = extractTextFromPDF(e.target.result) || 
        'PDF uploaded: ' + file.name + '. Please also paste your resume text for better analysis.';
    }
    status.textContent = '✅ Loaded: ' + file.name + ' (' + Math.round(file.size/1024) + ' KB)';
  };

  if (file.type === 'application/pdf') {
    reader.readAsBinaryString(file);
  } else {
    reader.readAsText(file);
  }
}

function extractTextFromPDF(binaryStr) {
  // Basic text extraction from PDF binary
  try {
    let text = '';
    const matches = binaryStr.match(/\\(([^\\)]{2,})\\)/g);
    if (matches) {
      text = matches
        .map(m => m.slice(1, -1))
        .filter(t => /[a-zA-Z]/.test(t))
        .join(' ');
    }
    return text.length > 100 ? text.substring(0, 5000) : null;
  } catch { return null; }
}

// ─── SHOW / HIDE HELPERS ──────────────────────────────────────────
function showError(msg) {
  const el = document.getElementById('errorBanner');
  el.textContent = '⚠️ ' + msg;
  el.classList.add('visible');
  setTimeout(() => el.classList.remove('visible'), 6000);
}

function showToast(msg, icon = '✓') {
  const toast = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  document.getElementById('toastIcon').textContent = icon;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

function setLoadingStep(step, state) {
  const el = document.getElementById('step' + step);
  if (!el) return;
  el.className = 'loading-step ' + state;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── MAIN ANALYZE FLOW ────────────────────────────────────────────
async function analyzeResume() {
  const textVal = document.getElementById('resumeText').value.trim();
  const resumeContent = currentTab === 'text' ? textVal : (fileContent || textVal);

  if (!resumeContent || resumeContent.length < 50) {
    showError('Please paste your resume text (at least 50 characters) or upload a file.');
    return;
  }

  // UI: enter loading state
  document.getElementById('analyzeBtn').disabled = true;
  document.getElementById('analyzeBtnText').textContent = 'Analyzing internships...';
  document.getElementById('tab-text').style.display = 'none';
  document.getElementById('tab-file').style.display = 'none';
  document.querySelector('.tab-row').style.display = 'none';
  document.getElementById('loadingScreen').classList.add('visible');
  document.getElementById('howSection').style.display = 'none';

  try {
    // Step 1: AI Analysis
    setLoadingStep(1, 'active');
    await sleep(300);
    resumeAnalysis = await analyzeResumeClientSide(resumeContent);
    setLoadingStep(1, 'done');

    // Step 2
    setLoadingStep(2, 'active');
    await sleep(400);
    setLoadingStep(2, 'done');

    // Step 3: Fetch real jobs
    setLoadingStep(3, 'active');
    allJobs = await fetchRealJobs(resumeAnalysis);
    setLoadingStep(3, 'done');

    // Step 4: Score jobs
    setLoadingStep(4, 'active');
    await sleep(500);
    allJobs = scoreJobs(allJobs, resumeAnalysis);
    allJobs.sort(compareJobs);
    setLoadingStep(4, 'done');

    await sleep(400);

    // Show results
    document.getElementById('loadingScreen').classList.remove('visible');
    showAnalysisCard(resumeAnalysis);
    showJobsSection(allJobs);

  } catch (err) {
    document.getElementById('loadingScreen').classList.remove('visible');
    document.getElementById('tab-text').style.display = 'block';
    document.querySelector('.tab-row').style.display = 'flex';
    document.getElementById('analyzeBtn').disabled = false;
    document.getElementById('analyzeBtnText').textContent = '⚡ Analyze My Resume & Find Jobs';
    document.getElementById('analyzeBtnText').textContent = 'Analyze Resume and Find Internships';
    showError(err.message || 'Something went wrong. Please try again.');
    console.error(err);
  }
}

// ─── CLAUDE API CALL ─────────────────────────────────────────────
async function analyzeResumeClientSide(resumeText) {
  const cleanText = String(resumeText || '').trim();
  const currentTitle = inferPrimaryRole(cleanText);
  const topSkills = extractTopSkills(cleanText, currentTitle);
  const experienceYears = inferExperienceYears(cleanText);

  return {
    name: detectCandidateName(cleanText),
    currentTitle,
    experienceYears,
    topSkills,
    targetRoles: buildTargetRoles(currentTitle),
    searchKeywords: buildSearchKeywords(currentTitle, topSkills),
    industries: inferIndustries(currentTitle),
    seniorityLevel: inferSeniority(experienceYears),
    summary: buildProfileSummary(currentTitle, topSkills, experienceYears)
  };
}

// ─── FETCH REAL JOBS ─────────────────────────────────────────────
async function fetchRealJobs(analysis) {
  const queries = buildInternshipQueries(analysis);
  const jobs = [];
  const seen = new Set();
  const providers = [];
  let successCount = 0;
  let lastError = 'Live internship feed is unavailable right now.';

  // Remotive.io public API — free, real remote jobs
  const collectRows = (payload, query) => {
    const rows = Array.isArray(payload?.jobs) ? payload.jobs : [];
    rows.forEach((row) => {
      if (!isInternshipPosting(row)) {
        return;
      }

      const normalized = normalizeLiveJob(row, query);
      const dedupeKey = \`\${normalized.title}|\${normalized.company}|\${normalized.location}\`.toLowerCase();
      if (!seen.has(dedupeKey)) {
        seen.add(dedupeKey);
        jobs.push(normalized);
      }
    });

    const provider = formatProviderLabel(payload?.meta?.provider);
    if (provider) {
      providers.push(provider);
    }
  };

  const results = await Promise.allSettled(queries.map((query) => searchInternshipsViaApi(query)));
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successCount += 1;
      collectRows(result.value, queries[index]);
      return;
    }

    lastError = result.reason?.message || lastError;
  });

  if (jobs.length === 0 && !queries.includes('internship')) {
    try {
      const payload = await searchInternshipsViaApi('internship');
      successCount += 1;
      collectRows(payload, 'internship');
    } catch (error) {
      lastError = error?.message || lastError;
    }
  }

  if (successCount === 0) {
    throw new Error(lastError);
  }

  lastFeedMeta = {
    recent24h: countRecentJobs(jobs, 24),
    providers: uniqueStrings(providers, 2)
  };

  return jobs.slice(0, 30);
}

async function searchInternshipsViaApi(query) {
  const params = new URLSearchParams();
  params.set('query', query);
  params.set('remote', 'false');
  params.set('posted_within_hours', '168');
  params.set('refresh', 'true');

  const response = await fetch(\`\${resolveApiBaseUrl()}/ml/jobs/search?\${params.toString()}\`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.detail || payload?.message || \`Internship API returned \${response.status}\`);
  }
  return payload;
}

function normalizeLiveJob(job, query) {
  const title = String(job?.title || query || 'Internship').trim() || 'Internship';
  const company = String(job?.company || 'Unknown Company').trim() || 'Unknown Company';
  const location = String(job?.location || '').trim() || (job?.is_remote ? 'Remote' : 'Location not listed');
  const postedHoursAgo = resolvePostedHours(job?.posted_hours_ago, job?.posted_date);
  const postedAt = parseDate(job?.posted_date);
  const tags = extractJobTags(job, title);

  return {
    id: safeId(job?.apply_link || \`\${company}-\${title}-\${location}\`),
    title,
    company,
    companyInitials: company.substring(0, 2).toUpperCase(),
    location,
    type: String(job?.employment_type || '').trim() || 'internship',
    category: inferJobCategory(title, job?.description, tags),
    salary: String(job?.salary || '').trim(),
    tags,
    postedAt,
    postedHoursAgo,
    postedLabel: formatPostedLabel(postedHoursAgo, postedAt),
    url: buildApplyUrl(title, company, location, job?.apply_link),
    matchScore: 0,
    source: normalizeSourceLabel(job?.source)
  };
}

// Fallback jobs if API unavailable
function getFallbackJobs(analysis) {
  const roles = analysis.targetRoles || ['Software Engineer'];
  const skill = (analysis.topSkills || ['JavaScript'])[0];
  const level = analysis.seniorityLevel || 'mid';

  const companies = [
    'Stripe','Notion','Linear','Vercel','Railway','Loom',
    'Airtable','Figma','Retool','Clerk','PlanetScale','Supabase'
  ];
  const locs = ['Remote (US)','Remote (Global)','Remote (Europe)','Remote (APAC)'];
  const types = ['full_time','contract','part_time'];

  return Array.from({ length: 20 }, (_, i) => {
    const company = companies[i % companies.length];
    const role = roles[i % roles.length];
    return {
      id: 'fb-' + i,
      title: \`\${level === 'senior' ? 'Senior ' : level === 'lead' ? 'Lead ' : ''}\${role}\`,
      company,
      companyInitials: company.substring(0, 2).toUpperCase(),
      location: locs[i % locs.length],
      type: types[i % types.length],
      category: (analysis.industries || ['Technology'])[0],
      salary: ['$90k–$130k', '$120k–$160k', '$100k–$140k', 'Competitive', '$80k–$110k'][i % 5],
      tags: [skill, ...(analysis.topSkills || []).slice(1, 3)],
      postedAt: new Date(Date.now() - i * 86400000 * Math.random() * 3),
      url: 'https://remotive.com/remote-jobs',
      matchScore: 0,
      source: 'Job Board'
    };
  });
}

// ─── SCORE JOBS ───────────────────────────────────────────────────
function resolveApiBaseUrl() {
  const injected = String(API_BASE_URL || '').trim();
  if (injected && !injected.includes('__REXION_API_BASE_URL__')) {
    return injected.replace(/\\/+$/, '');
  }

  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  const host = window.location.hostname === '127.0.0.1' ? '127.0.0.1' : 'localhost';
  return \`\${protocol}//\${host}:5000/api\`;
}

function buildInternshipQueries(analysis) {
  const roleSeed = uniqueStrings([
    analysis.currentTitle,
    ...(analysis.targetRoles || [])
  ], 3);
  const queries = roleSeed.flatMap((role) => {
    const normalizedRole = String(role || '').replace(INTERNSHIP_ROLE_REGEX, '').trim();
    if (!normalizedRole) {
      return [];
    }
    return [\`\${normalizedRole} intern\`, \`\${normalizedRole} internship\`];
  });

  const skillQuery = analysis.topSkills?.[0]
    ? \`\${analysis.currentTitle || 'software engineer'} \${analysis.topSkills[0]} internship\`
    : '';

  return uniqueStrings([...queries, skillQuery, 'internship'], 4);
}

function isInternshipPosting(job) {
  const blob = [
    job?.title,
    job?.employment_type,
    job?.description
  ].join(' ');
  return INTERNSHIP_ROLE_REGEX.test(blob);
}

function resolvePostedHours(rawHours, rawDate) {
  const direct = Number(rawHours);
  if (Number.isFinite(direct) && direct >= 0) {
    return direct;
  }

  const parsed = parseDate(rawDate);
  if (!parsed) {
    return null;
  }

  return Math.max(0, Math.round((Date.now() - parsed.getTime()) / 3600000));
}

function formatPostedLabel(postedHoursAgo, postedAt) {
  const hours = Number.isFinite(Number(postedHoursAgo)) ? Number(postedHoursAgo) : null;
  if (hours !== null) {
    if (hours < 1) {
      return 'just now';
    }
    if (hours < 24) {
      return \`\${hours} hour\${hours === 1 ? '' : 's'} ago\`;
    }
    const days = Math.round(hours / 24);
    return \`\${days} day\${days === 1 ? '' : 's'} ago\`;
  }

  if (!postedAt) {
    return 'recently';
  }

  const fallbackHours = Math.max(0, Math.round((Date.now() - postedAt.getTime()) / 3600000));
  if (fallbackHours < 24) {
    return \`\${Math.max(1, fallbackHours)} hour\${fallbackHours === 1 ? '' : 's'} ago\`;
  }

  const days = Math.round(fallbackHours / 24);
  return \`\${days} day\${days === 1 ? '' : 's'} ago\`;
}

function parseDate(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildApplyUrl(title, company, location, rawUrl) {
  const cleanUrl = String(rawUrl || '').trim();
  if (cleanUrl) {
    return cleanUrl;
  }

  const params = new URLSearchParams();
  params.set('keywords', [title, company, 'internship'].filter(Boolean).join(' '));
  if (location && !/remote/i.test(location)) {
    params.set('location', location);
  }
  return \`https://www.linkedin.com/jobs/search/?\${params.toString()}\`;
}

function extractJobTags(job, title) {
  const directSkills = Array.isArray(job?.required_skills)
    ? job.required_skills.map((skill) => String(skill || '').trim()).filter(Boolean)
    : [];

  if (directSkills.length > 0) {
    return uniqueStrings(directSkills, 4);
  }

  const fallbackTokens = String(title || '')
    .split(/[^a-zA-Z0-9+#.]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !INTERNSHIP_ROLE_REGEX.test(token));

  return uniqueStrings(fallbackTokens, 4);
}

function inferJobCategory(title, description, tags) {
  const blob = \`\${title || ''} \${description || ''} \${(tags || []).join(' ')}\`.toLowerCase();
  if (/design|ux|ui|figma/.test(blob)) {
    return 'Design';
  }
  if (/data|analytics|sql|tableau|power bi/.test(blob)) {
    return 'Data';
  }
  if (/machine learning|deep learning|ai|llm|nlp|pytorch|tensorflow/.test(blob)) {
    return 'AI / ML';
  }
  if (/product manager|product/.test(blob)) {
    return 'Product';
  }
  return 'Engineering';
}

function normalizeSourceLabel(source) {
  const clean = String(source || '').trim();
  if (!clean) {
    return 'Live API';
  }
  return clean.length <= 18 ? clean : \`\${clean.slice(0, 18)}...\`;
}

function formatProviderLabel(provider) {
  const clean = String(provider || '').trim().toLowerCase();
  if (!clean) {
    return '';
  }
  if (clean.includes('jsearch')) {
    return 'RapidAPI';
  }
  if (clean.includes('arbeitnow')) {
    return 'Arbeitnow fallback';
  }
  return clean;
}

function safeId(value) {
  const normalized = String(value || 'internship-card')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'internship-card';
}

function detectCandidateName(resumeText) {
  const firstLine = String(resumeText || '').split(/\\r?\\n/).map((line) => line.trim()).find(Boolean) || '';
  const probe = firstLine.split(/[|,@-]/)[0].replace(/\\b(resume|curriculum vitae|cv)\\b/ig, '').trim();
  if (/^[A-Za-z][A-Za-z .'-]{1,50}$/.test(probe) && probe.split(/\\s+/).length <= 4) {
    return probe;
  }
  return 'Candidate';
}

function inferPrimaryRole(resumeText) {
  const normalized = String(resumeText || '').toLowerCase();
  let bestRole = 'Software Engineer';
  let bestScore = 0;

  ROLE_PROFILES.forEach((profile) => {
    const score = profile.terms.reduce((total, term) => total + (normalized.includes(term) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestRole = profile.role;
    }
  });

  return bestRole;
}

function extractTopSkills(resumeText, currentTitle) {
  const normalized = String(resumeText || '').toLowerCase();
  const matched = COMMON_SKILLS.filter((skill) => normalized.includes(skill.toLowerCase()));
  if (matched.length > 0) {
    return uniqueStrings(matched, 6);
  }

  if (/data|machine learning|ai/i.test(currentTitle)) {
    return ['Python', 'SQL', 'Machine Learning'];
  }
  if (/design/i.test(currentTitle)) {
    return ['Figma', 'UI/UX', 'Design Systems'];
  }
  return ['JavaScript', 'React', 'Node.js'];
}

function buildTargetRoles(currentTitle) {
  if (/data|machine learning|ai/i.test(currentTitle)) {
    return uniqueStrings([currentTitle, 'Data Analyst', 'Machine Learning Engineer'], 3);
  }
  if (/design/i.test(currentTitle)) {
    return uniqueStrings([currentTitle, 'UI/UX Designer', 'Product Designer'], 3);
  }
  if (/product/i.test(currentTitle)) {
    return uniqueStrings([currentTitle, 'Product Manager', 'Business Analyst'], 3);
  }
  return uniqueStrings([currentTitle, 'Frontend Developer', 'Backend Developer'], 3);
}

function buildSearchKeywords(currentTitle, topSkills) {
  return uniqueStrings([currentTitle, ...(topSkills || []).slice(0, 3)], 4);
}

function inferIndustries(currentTitle) {
  if (/data|machine learning|ai/i.test(currentTitle)) {
    return ['Technology', 'Data'];
  }
  if (/design/i.test(currentTitle)) {
    return ['Design', 'Technology'];
  }
  return ['Technology', 'Software'];
}

function inferExperienceYears(resumeText) {
  const explicit = String(resumeText || '').match(/(\\d{1,2})\\+?\\s*(?:years?|yrs?)/i);
  if (explicit) {
    return Math.min(12, Number(explicit[1]) || 0);
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from(
    new Set(
      [...String(resumeText || '').matchAll(/\\b(19\\d{2}|20\\d{2})\\b/g)]
        .map((match) => Number(match[1]))
        .filter((year) => year <= currentYear)
    )
  ).sort((a, b) => a - b);

  if (years.length >= 2) {
    return Math.max(0, Math.min(12, currentYear - years[0]));
  }

  return 0;
}

function inferSeniority(experienceYears) {
  if (experienceYears >= 6) {
    return 'senior';
  }
  if (experienceYears >= 3) {
    return 'mid';
  }
  return 'junior';
}

function buildProfileSummary(currentTitle, topSkills, experienceYears) {
  const skillPreview = (topSkills || []).slice(0, 3).join(', ') || 'core technical skills';
  const experiencePreview = experienceYears > 0 ? \`\${experienceYears} year\${experienceYears === 1 ? '' : 's'} of experience\` : 'early-career experience';
  return \`Best aligned for \${currentTitle.toLowerCase()} internships with \${experiencePreview} and strengths in \${skillPreview}.\`;
}

function uniqueStrings(values, limit = 6) {
  const seen = new Set();
  const output = [];
  (values || []).forEach((value) => {
    const clean = String(value || '').trim();
    if (!clean) {
      return;
    }
    const key = clean.toLowerCase();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    output.push(clean);
  });
  return typeof limit === 'number' ? output.slice(0, limit) : output;
}

function countRecentJobs(jobs, hours) {
  return jobs.filter((job) => isRecentWithin(job, hours)).length;
}

function isRecentWithin(job, hours) {
  const postedHoursAgo = Number(job?.postedHoursAgo);
  if (Number.isFinite(postedHoursAgo)) {
    return postedHoursAgo <= hours;
  }

  const postedAt = parseDate(job?.postedAt);
  if (!postedAt) {
    return false;
  }

  return (Date.now() - postedAt.getTime()) <= hours * 3600000;
}

function compareJobs(a, b) {
  const aHours = Number.isFinite(Number(a?.postedHoursAgo)) ? Number(a.postedHoursAgo) : Number.POSITIVE_INFINITY;
  const bHours = Number.isFinite(Number(b?.postedHoursAgo)) ? Number(b.postedHoursAgo) : Number.POSITIVE_INFINITY;

  if (aHours !== bHours) {
    return aHours - bHours;
  }

  return Number(b?.matchScore || 0) - Number(a?.matchScore || 0);
}

function scoreJobs(jobs, analysis) {
  const skills = (analysis.topSkills || []).map((skill) => String(skill || '').toLowerCase());
  const roles = (analysis.targetRoles || []).map((role) => String(role || '').toLowerCase());
  const keywords = (analysis.searchKeywords || []).map((keyword) => String(keyword || '').toLowerCase());

  return jobs.map((job) => {
    let score = 45;
    const titleLow = String(job.title || '').toLowerCase();
    const tagLow = (job.tags || []).map((tag) => String(tag || '').toLowerCase());
    const catLow = String(job.category || '').toLowerCase();

    roles.forEach((role) => {
      const probe = role.split(' ')[0];
      if (probe && titleLow.includes(probe)) {
        score += 18;
      }
    });

    skills.forEach((skill) => {
      if (tagLow.some((tag) => tag.includes(skill))) {
        score += 8;
      }
      if (skill && titleLow.includes(skill)) {
        score += 4;
      }
    });

    keywords.forEach((keyword) => {
      if (keyword && (titleLow.includes(keyword) || catLow.includes(keyword))) {
        score += 4;
      }
    });

    if (isRecentWithin(job, 12)) {
      score += 18;
    } else if (isRecentWithin(job, 24)) {
      score += 12;
    } else if (isRecentWithin(job, 72)) {
      score += 6;
    }

    if (INTERNSHIP_ROLE_REGEX.test(titleLow)) {
      score += 6;
    }

    return { ...job, matchScore: Math.min(99, Math.round(score)) };
  });
}

// ─── SHOW ANALYSIS CARD ───────────────────────────────────────────
function showAnalysisCard(a) {
  const card = document.getElementById('analysisCard');
  const grid = document.getElementById('analysisGrid');

  grid.innerHTML = \`
    <div class="analysis-item">
      <label>Name</label>
      <div class="value">\${escHtml(a.name)}</div>
    </div>
    <div class="analysis-item">
      <label>Current Title</label>
      <div class="value">\${escHtml(a.currentTitle)}</div>
    </div>
    <div class="analysis-item">
      <label>Experience</label>
      <div class="value">\${a.experienceYears} years</div>
    </div>
    <div class="analysis-item">
      <label>Seniority</label>
      <div class="value" style="text-transform:capitalize">\${a.seniorityLevel}</div>
    </div>
    <div class="analysis-item" style="grid-column:1/-1">
      <label>Summary</label>
      <div class="value" style="color:var(--text2); line-height:1.5; font-weight:400">\${escHtml(a.summary)}</div>
    </div>
    <div class="analysis-item" style="grid-column:1/-1">
      <label>Top Skills</label>
      <div class="skill-chips">
        \${(a.topSkills || []).map(s => \`<span class="chip">\${escHtml(s)}</span>\`).join('')}
      </div>
    </div>
    <div class="analysis-item" style="grid-column:1/-1">
      <label>Target Roles</label>
      <div class="skill-chips">
        \${(a.targetRoles || []).map(r => \`<span class="chip" style="background:var(--blue-dim);color:var(--blue);border-color:#4d7cfe60">\${escHtml(r)}</span>\`).join('')}
      </div>
    </div>
  \`;

  card.classList.add('visible');
}

// ─── SHOW JOBS SECTION ────────────────────────────────────────────
function showJobsSection(jobs) {
  const section = document.getElementById('jobsSection');
  section.classList.add('visible');

  const high = jobs.filter(j => j.matchScore >= 75).length;
  document.getElementById('jobsMeta').textContent =
    \`\${jobs.length} live matches found · \${high} high-match opportunities\`;

  // Build filters
  const cats = [...new Set(jobs.map(j => j.category).filter(Boolean))].slice(0, 6);
  const filterBar = document.getElementById('filterBar');
  filterBar.innerHTML = \`
    <button class="filter-chip active" onclick="filterJobs('all')">All (\${jobs.length})</button>
    \${cats.map(c => \`<button class="filter-chip" onclick="filterJobs('\${escHtml(c)}')">\${escHtml(c)}</button>\`).join('')}
    <button class="filter-chip" onclick="filterJobs('high')">⭐ High Match</button>
  \`;

  renderJobCards(jobs);
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function filterJobs(filter) {
  activeFilter = filter;
  document.querySelectorAll('.filter-chip').forEach(c => {
    c.classList.toggle('active',
      (filter === 'all' && c.textContent.startsWith('All')) ||
      c.textContent.includes(filter) ||
      (filter === 'high' && c.textContent.includes('High Match'))
    );
  });

  let filtered = allJobs;
  if (filter === 'high') filtered = allJobs.filter(j => j.matchScore >= 75);
  else if (filter !== 'all') filtered = allJobs.filter(j => j.category === filter);

  renderJobCards(filtered);
}

function renderJobCards(jobs) {
  const grid = document.getElementById('jobsGrid');
  if (jobs.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:48px; color:var(--text3); font-size:16px">No jobs match this filter.</div>';
    return;
  }

  grid.innerHTML = jobs.map(job => {
    const applied = appliedJobs.has(job.id);
    const matchClass = job.matchScore >= 75 ? 'match-high' : job.matchScore >= 60 ? 'match-mid' : 'match-low';
    const daysAgo = Math.floor((Date.now() - new Date(job.postedAt)) / 86400000);
    const dateStr = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : \`\${daysAgo}d ago\`;
    const typeLabel = job.type.replace(/_/g, ' ').replace(/\\b\\w/g, c => c.toUpperCase());

    return \`
      <div class="job-card \${applied ? 'applied' : ''}" id="card-\${job.id}">
        <div class="card-top">
          <div class="company-logo">\${escHtml(job.companyInitials)}</div>
          <div class="card-meta">
            <div class="job-title">\${escHtml(job.title)}</div>
            <div class="company-name">\${escHtml(job.company)} · \${escHtml(job.location)}</div>
          </div>
          <div class="match-badge \${matchClass}">\${job.matchScore}%</div>
        </div>
        <div class="job-tags">
          <span class="job-tag type">\${escHtml(typeLabel)}</span>
          \${(job.tags || []).slice(0, 3).map(t => \`<span class="job-tag">\${escHtml(t)}</span>\`).join('')}
          <span class="job-tag">\${escHtml(job.source)}</span>
        </div>
        \${job.salary
          ? \`<div class="job-salary">💰 \${escHtml(job.salary)}</div>\`
          : \`<div class="no-salary">Salary not disclosed</div>\`}
        <div class="card-footer">
          <span class="posted-date">Posted \${dateStr}</span>
          <button class="btn-apply \${applied ? 'applied-btn' : ''}"
                  onclick="applySingle('\${job.id}', '\${escHtml(job.url)}')"
                  id="btn-\${job.id}">
            \${applied ? '✓ Applied' : 'Apply Now →'}
          </button>
        </div>
      </div>
    \`;
  }).join('');
}

// ─── SINGLE APPLY ─────────────────────────────────────────────────
function applySingle(jobId, url) {
  appliedJobs.add(jobId);
  const card = document.getElementById('card-' + jobId);
  const btn = document.getElementById('btn-' + jobId);
  if (card) card.classList.add('applied');
  if (btn) { btn.textContent = '✓ Applied'; btn.classList.add('applied-btn'); }
  window.open(url, '_blank');
  showToast('Application opened in new tab!', '🚀');
}

// ─── AUTO APPLY ALL ───────────────────────────────────────────────
async function autoApplyAll() {
  const btn = document.getElementById('autoApplyBtn');
  const progress = document.getElementById('applyProgress');

  let filteredJobs = allJobs;
  if (activeFilter === 'high') filteredJobs = allJobs.filter(j => j.matchScore >= 75);
  else if (activeFilter !== 'all') filteredJobs = allJobs.filter(j => j.category === activeFilter);

  const unapplied = filteredJobs.filter(j => !appliedJobs.has(j.id));
  if (unapplied.length === 0) {
    showToast('All visible jobs have been applied to!', '✅');
    return;
  }

  btn.disabled = true;
  progress.classList.add('visible');
  document.getElementById('progressText').textContent = \`Applying to \${unapplied.length} jobs...\`;

  for (let i = 0; i < unapplied.length; i++) {
    const job = unapplied[i];
    const pct = Math.round(((i + 1) / unapplied.length) * 100);

    appliedJobs.add(job.id);
    const card = document.getElementById('card-' + job.id);
    const applyBtn = document.getElementById('btn-' + job.id);
    if (card) card.classList.add('applied');
    if (applyBtn) { applyBtn.textContent = '✓ Applied'; applyBtn.classList.add('applied-btn'); }

    // Open application page
    window.open(job.url, '_blank');

    document.getElementById('progressFill').style.width = pct + '%';
    document.getElementById('progressPct').textContent = pct + '%';
    document.getElementById('progressText').textContent = \`Applied: \${i + 1} / \${unapplied.length} — \${escHtml(job.title)} @ \${escHtml(job.company)}\`;

    await sleep(600);
  }

  document.getElementById('progressText').textContent = \`✅ Applied to all \${unapplied.length} jobs!\`;
  document.getElementById('progressPct').textContent = '100%';
  btn.disabled = false;
  showToast(\`Applied to \${unapplied.length} jobs! 🚀 Check your new tabs.\`, '🎉');
}

// ─── UTILS ────────────────────────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
<\/script>
</body>
</html>
`,i="_page_skazo_1",l="_frame_skazo_6",e={page:i,frame:l},c=()=>{const t="http://localhost:5000/api".replace(/\/+$/,""),r=s.replaceAll("__REXION_API_BASE_URL__",encodeURIComponent(t));return o.useEffect(()=>{const a=document.title;return document.title="REX PRO",()=>{document.title=a}},[]),n("section",{className:e.page,children:n("iframe",{title:"REX PRO",className:e.frame,srcDoc:r})})};export{c as default};
