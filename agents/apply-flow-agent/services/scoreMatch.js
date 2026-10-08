/**
 * Scores a job against candidate profile and formats it with applyType.
 * Scoring rules:
 * - Skill keyword overlap (70% weight)
 * - Experience ratio (30% weight)
 * 
 * @param {Object} profile - Parsed candidate profile
 * @param {string[]} profile.skills - Candidate's skills
 * @param {number} profile.yearsExperience - Candidate's total years of experience
 * @param {Object} job - Raw job listing object from Adzuna
 * @returns {Object} - Scored job formatted with matchScore and applyType
 */
export function calculateMatch(profile, job) {
  if (!profile) {
    throw new Error('Profile is required for matching');
  }
  if (!job) {
    throw new Error('Job is required for matching');
  }

  const jobTitle = job.title || '';
  const jobDescription = job.description || '';
  const searchText = `${jobTitle} ${jobDescription}`.toLowerCase();

  // 1. Skill keyword overlap (70% weight)
  let skillScore = 0;
  const skills = Array.isArray(profile.skills) ? profile.skills : [];
  
  if (skills.length > 0) {
    const matchedSkills = skills.filter(skill => {
      const cleanSkill = skill.trim().toLowerCase();
      if (!cleanSkill) return false;
      return searchText.includes(cleanSkill);
    });
    
    skillScore = (matchedSkills.length / skills.length) * 100;
  } else {
    skillScore = 0;
  }

  // 2. Experience ratio (30% weight)
  const rangeRegex = /(\d+)\s*(?:-|to)\s*(\d+)\s*(?:year|yr)s?/i;
  const singleRegex = /(\d+)\+?\s*(?:year|yr)s?/i;

  let requiredExperience = 0;
  
  const rangeMatch = searchText.match(rangeRegex);
  if (rangeMatch) {
    requiredExperience = parseInt(rangeMatch[1], 10);
  } else {
    const singleMatch = searchText.match(singleRegex);
    if (singleMatch) {
      requiredExperience = parseInt(singleMatch[1], 10);
    }
  }

  let experienceScore = 100;
  const candidateExp = typeof profile.yearsExperience === 'number' ? profile.yearsExperience : 0;

  if (requiredExperience > 0) {
    if (candidateExp >= requiredExperience) {
      experienceScore = 100;
    } else {
      experienceScore = (candidateExp / requiredExperience) * 100;
    }
  }

  // 3. Compute final score
  const totalScore = (skillScore * 0.7) + (experienceScore * 0.3);
  const matchScore = Math.round(totalScore);
  const jobUrl = job.redirect_url || job.url || job.applyUrl || '';
  const isGreenhouse = jobUrl.includes('greenhouse.io');
  const isLever = jobUrl.includes('lever.co');
  const isLinkedIn = jobUrl.includes('linkedin.com') || job.publisher === 'LinkedIn' || job.provider === 'linkedin';
  const applyType = (isGreenhouse || isLever || isLinkedIn) ? 'easy_apply' : 'external_ats';

  const rawCreated = job.created || job.postedAt || job.job_posted_at_datetime_utc;
  const createdAt = rawCreated ? new Date(rawCreated) : null;
  const ageHours = createdAt && !Number.isNaN(createdAt.getTime())
    ? Math.max(0, Math.round((Date.now() - createdAt.getTime()) / (1000 * 60 * 60)))
    : null;
  // This is an eligibility estimate, not a promise of recruiter response.
  const freshnessScore = ageHours === null ? 65 : Math.max(15, 100 - ageHours * 2);
  const applyChance = Math.round(Math.min(95, matchScore * 0.72 + freshnessScore * 0.18 + (applyTypeBonus(jobUrl) * 0.1)));

  return {
    title: jobTitle,
    company: job.company?.display_name || job.company || 'Unknown Company',
    url: jobUrl,
    matchScore,
    applyType,
    // Keep extra data for internal mapping
    description: jobDescription,
    location: job.location?.display_name || job.location || 'Location flexible',
    id: String(job.id),
    postedAt: createdAt?.toISOString() || null,
    ageHours,
    applyChance,
  };
}

function applyTypeBonus(url) {
  return url.includes('greenhouse.io') || url.includes('lever.co') ? 100 : 35;
}
