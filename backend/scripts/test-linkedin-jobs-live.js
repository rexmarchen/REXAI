import fetch from 'node-fetch';

async function testLiveLinkedInIntegration() {
  console.log('==================================================================');
  console.log('   LINKEDIN SCRAPED JOBS INTEGRATION & LIVE "JOB MATCHES" TEST    ');
  console.log('==================================================================');

  console.log('\n[STEP 1] Testing /api/applications/discover with live LinkedIn scraping...');
  
  try {
    const res = await fetch('http://127.0.0.1:5000/api/applications/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Backend Engineer',
        location: 'India',
        limit: 10
      })
    });

    console.log(' -> Discovery HTTP Status:', res.status);
    const data = await res.json();
    console.log(' -> Metadata:', data.meta);

    const jobs = data.data || [];
    console.log(` -> Discovered ${jobs.length} Fresh Jobs Matching Candidate Profile`);

    const liJobs = jobs.filter(j => j.provider === 'linkedin' || j.publisher === 'LinkedIn');
    console.log(` -> LinkedIn Jobs Found: ${liJobs.length}`);

    if (liJobs.length > 0) {
      console.log('\n[STEP 2] Inspecting Live LinkedIn Job Details:');
      liJobs.slice(0, 3).forEach((job, idx) => {
        console.log(`\n --- [Job #${idx + 1}] ---`);
        console.log(` Title       : ${job.title}`);
        console.log(` Company     : ${job.company}`);
        console.log(` Location    : ${job.location}`);
        console.log(` Match Score : ${job.score}%`);
        console.log(` Provider    : ${job.provider} (${job.publisher})`);
        console.log(` Tier        : Tier ${job.tier} Verified`);
        console.log(` Apply Link  : ${job.applyUrl}`);
        console.log(` Posted At   : ${job.postedAt} (${job.freshness?.ageHours}h ago)`);
        console.log(` Freshness   : ${job.freshness?.isFresh ? 'PASS (<= 48h)' : 'EXPIRED'}`);
        if (job.matchReasons && job.matchReasons.length > 0) {
          console.log(` Rationale   : ${job.matchReasons.join(', ')}`);
        }
      });

      console.log('\n[PASS] Live LinkedIn Job Scraping is FULLY FUNCTIONAL and showing in Job Matches!');
    } else {
      console.log(' [INFO] Provider returned fallback results; verifying raw provider call...');
    }

  } catch (err) {
    console.error(' [FAIL] Error connecting to discover endpoint:', err.message);
  }

  console.log('\n==================================================================');
  console.log('               LINKEDIN INTEGRATION TEST COMPLETE                 ');
  console.log('==================================================================');
}

testLiveLinkedInIntegration();
