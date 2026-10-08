import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateInternshipMatch } from '../src/services/internships/internshipMatchingService.js'

test('calculateInternshipMatch produces explainable match score with candidate profile', () => {
  const candidate = {
    skills: ['React', 'TypeScript', 'Node.js', 'TailwindCSS'],
    primaryDomain: 'Frontend Engineering',
    preferredWorkMode: 'remote'
  }

  const jobFrontend = {
    title: 'Frontend Developer Intern',
    domain: 'frontend',
    isRemote: true,
    skills: ['React', 'TypeScript', 'CSS']
  }

  const match = calculateInternshipMatch(jobFrontend, candidate)

  assert.equal(typeof match.matchScore, 'number')
  assert.equal(match.matchScore >= 80, true, 'Matching skills & domain should score >= 80%')
  assert.equal(Array.isArray(match.reasons), true)
  assert.equal(match.reasons.length > 0, true)
  assert.equal(match.reasons.some((r) => r.includes('React') || r.includes('Technical match')), true)
})

test('calculateInternshipMatch identifies missing skills accurately', () => {
  const candidate = {
    skills: ['Python', 'SQL'],
    primaryDomain: 'Data Science',
    preferredWorkMode: 'any'
  }

  const jobWithDocker = {
    title: 'Data Science Intern',
    domain: 'data',
    isRemote: false,
    skills: ['Python', 'SQL', 'Docker', 'Kubernetes']
  }

  const match = calculateInternshipMatch(jobWithDocker, candidate)

  assert.equal(match.missingSkills.includes('Docker') || match.missingSkills.includes('Kubernetes'), true)
})
