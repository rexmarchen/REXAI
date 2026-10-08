/**
 * Fetches jobs matching the targetRole and skills from LinkedIn (via RapidAPI JSearch) and Adzuna.
 * @param {string} targetRole - Job role to search for
 * @param {string[]} skills - Candidate's key skills
 * @returns {Promise<Array>} - List of raw job objects
 */
export async function fetchJobs(targetRole, skills = []) {
  if (!targetRole || typeof targetRole !== 'string' || targetRole.trim() === '') {
    throw new Error('Target role is required for job search');
  }

  const results = [];

  // Combine targetRole and top skills to make search query rich but specific
  const searchKeywords = [
    targetRole,
    ...skills.slice(0, 2)
  ].filter(Boolean).join(' ');

  // 1. Fetch live LinkedIn jobs via RapidAPI JSearch
  const rapidApiKey = process.env.JSEARCH_API_KEY || process.env.RAPIDAPI_KEY || 'd8a0249f0fmsh396ea99f74d65fdp14adb5jsn6f3b8ec88d82';
  const rapidApiHost = process.env.JSEARCH_API_HOST || 'jsearch.p.rapidapi.com';

  if (rapidApiKey) {
    try {
      const liQuery = `${searchKeywords} jobs via LinkedIn`;
      const liUrl = `https://${rapidApiHost}/search?query=${encodeURIComponent(liQuery)}&page=1&num_pages=1`;
      const res = await fetch(liUrl, {
        headers: {
          'x-rapidapi-host': rapidApiHost,
          'x-rapidapi-key': rapidApiKey
        },
        signal: AbortSignal.timeout(20000)
      });

      if (res.ok) {
        const liData = await res.json();
        const rawLiJobs = Array.isArray(liData?.data) ? liData.data : [];
        for (const raw of rawLiJobs) {
          const applyUrl =
            raw.job_apply_link ||
            (Array.isArray(raw.apply_options) && raw.apply_options.find((o) => o.publisher === 'LinkedIn')?.apply_link) ||
            raw.apply_options?.[0]?.apply_link ||
            '';

          let postedDate = raw.job_posted_at_datetime_utc;
          if (!postedDate && raw.job_posted_at_timestamp) {
            postedDate = new Date(raw.job_posted_at_timestamp * 1000).toISOString();
          }
          if (!postedDate) {
            postedDate = new Date().toISOString();
          }

          results.push({
            id: String(raw.job_id || raw.job_uid || `linkedin-${Math.random()}`),
            title: raw.job_title,
            company: { display_name: raw.employer_name || 'Hiring Employer' },
            location: {
              display_name: raw.job_city
                ? `${raw.job_city}, ${raw.job_state || raw.job_country || ''}`.trim()
                : raw.job_location || 'Remote'
            },
            description: raw.job_description || '',
            redirect_url: applyUrl,
            url: applyUrl,
            created: postedDate,
            postedAt: postedDate,
            publisher: raw.job_publisher || 'LinkedIn',
            provider: 'linkedin',
            isRemote: Boolean(raw.job_is_remote),
            employerLogo: raw.employer_logo || null
          });
        }
      }
    } catch (err) {
      console.warn(`[fetchJobs] LinkedIn scraping warning: ${err.message}`);
    }
  }

  // 2. Fetch from Adzuna as secondary source if configured
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  const country = (process.env.ADZUNA_COUNTRY || 'in').toLowerCase().trim();

  if (appId && appKey) {
    try {
      const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${appId}&app_key=${appKey}&what=${encodeURIComponent(searchKeywords)}&results_per_page=15&content-type=application/json`;
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.results)) {
          results.push(...data.results);
        }
      }
    } catch (err) {
      console.warn(`[fetchJobs] Adzuna warning: ${err.message}`);
    }
  }

  return results;
}
