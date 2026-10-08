import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { searchApolloContacts } from '@/lib/apollo'
import { searchSnovContacts } from '@/lib/snov'
import { filterAndRankCandidates, qualifyContact } from '@/lib/qualify-contact'
import {
  type ContactSearchFilters,
  DEFAULT_SEARCH_FILTERS,
  validateSearchFilters,
  filterContactsInMemory,
} from '@/lib/search-filters'
import type { OutreachContact } from '@/types/outreach'

async function executeContactSearch(
  filters: ContactSearchFilters,
  userId: string,
  userProfile: { targetRole: string; targetDomain: string },
  minScore: number
) {
  // 1. Validation
  const validation = validateSearchFilters(filters)
  if (!validation.valid) {
    throw new Error(validation.errors.join(' '))
  }

  // 2. Fetch Exclusion Lists
  // 2.1 Always Enforced: Suppression List
  const suppressionEntries = await prisma.suppressionEntry.findMany({
    where: { userId },
    select: { email: true },
  })
  const suppressedEmails = new Set(suppressionEntries.map((s) => s.email.toLowerCase()))

  // 2.2 Optional: Exclude Existing Saved Contacts
  const excludedContactEmails = new Set<string>()
  if (filters.excludeExistingContacts) {
    const existingSaved = await prisma.contact.findMany({
      where: { userId },
      select: { email: true },
    })
    existingSaved.forEach((c) => excludedContactEmails.add(c.email.toLowerCase()))
  }

  // 2.3 Optional: Exclude Contacts Contacted in Last N Days
  if (filters.excludeContactedDays && filters.excludeContactedDays > 0) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - filters.excludeContactedDays)

    const recentSends = await prisma.campaignSend.findMany({
      where: {
        campaign: { userId },
        sentAt: { gte: cutoffDate },
      },
      include: {
        contact: { select: { email: true } },
      },
    })

    recentSends.forEach((send) => {
      if (send.contact?.email) {
        excludedContactEmails.add(send.contact.email.toLowerCase())
      }
    })
  }

  // 3. Query Providers (Apollo / Snov) with Fallbacks
  let rawCandidates: OutreachContact[] = []

  if (process.env.APOLLO_API_KEY) {
    rawCandidates = await searchApolloContacts(filters)
  } else {
    rawCandidates = await searchSnovContacts(filters)
  }

  // Fallback to Apollo if Snov returned 0 or vice versa
  if (rawCandidates.length === 0 && !process.env.APOLLO_API_KEY) {
    rawCandidates = await searchApolloContacts(filters)
  }

  // 4. Filter out Suppressions & Exclusions
  const filteredCandidates = rawCandidates.filter((c) => {
    const email = (c.email || '').toLowerCase()
    if (!email) return false
    if (suppressedEmails.has(email)) return false
    if (excludedContactEmails.has(email)) return false
    return true
  })

  // 5. In-Memory Deep Refinements (Seniorities, Departments, Keywords, etc.)
  const refinedCandidates = filterContactsInMemory(filteredCandidates, filters)

  // 6. Qualification Scoring Layer
  const rankedContacts = filterAndRankCandidates(refinedCandidates, userProfile, minScore)

  const disqualified = refinedCandidates
    .map((c) => ({ ...c, qualification: qualifyContact(c, userProfile, minScore) }))
    .filter((c) => !c.qualification.qualified)

  return {
    contacts: rankedContacts,
    count: rankedContacts.length,
    telemetry: {
      totalFound: rawCandidates.length,
      suppressedCount: rawCandidates.filter((c) => suppressedEmails.has((c.email || '').toLowerCase())).length,
      excludedCount: rawCandidates.filter((c) => excludedContactEmails.has((c.email || '').toLowerCase())).length,
      disqualifiedCount: disqualified.length,
      qualifiedCount: rankedContacts.length,
      filtersApplied: filters,
    },
  }
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)

  // Build filter object from search params
  const titles = searchParams.getAll('titles').concat(searchParams.get('role') ? [searchParams.get('role')!] : [])
  const companyNames = searchParams.getAll('companyNames').concat(searchParams.get('company') ? [searchParams.get('company')!] : [])
  const personLocations = searchParams.getAll('personLocations').concat(searchParams.get('location') ? [searchParams.get('location')!] : [])
  const seniorities = searchParams.getAll('seniorities')
  const departments = searchParams.getAll('departments')
  const excludedTitleKeywords = searchParams.getAll('excludedTitleKeywords')
  const industries = searchParams.getAll('industries')
  const headcountRanges = searchParams.getAll('headcountRanges')
  const fundingStages = searchParams.getAll('fundingStages')
  const technologies = searchParams.getAll('technologies')

  const targetRole = searchParams.get('targetRole') || titles[0] || 'Software & ML Engineer'
  const targetDomain = searchParams.get('targetDomain') || 'Technology'
  const minScore = parseInt(searchParams.get('minScore') || '60', 10)

  const filters: ContactSearchFilters = {
    ...DEFAULT_SEARCH_FILTERS,
    titles: titles.filter(Boolean),
    companyNames: companyNames.filter(Boolean),
    personLocations: personLocations.filter(Boolean),
    seniorities: seniorities.filter(Boolean),
    departments: departments.filter(Boolean),
    excludedTitleKeywords: excludedTitleKeywords.filter(Boolean),
    industries: industries.filter(Boolean),
    headcountRanges: headcountRanges.filter(Boolean),
    fundingStages: fundingStages.filter(Boolean),
    technologies: technologies.filter(Boolean),
    yearsInRole: searchParams.get('yearsInRole') || '',
    verifiedEmailOnly: searchParams.get('verifiedEmailOnly') !== 'false',
    hasLinkedIn: searchParams.get('hasLinkedIn') === 'true',
    hasPhone: searchParams.get('hasPhone') === 'true',
    excludeExistingContacts: searchParams.get('excludeExistingContacts') !== 'false',
    excludeContactedDays: parseInt(searchParams.get('excludeContactedDays') || '30', 10),
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: parseInt(searchParams.get('limit') || '50', 10),
  }

  try {
    const result = await executeContactSearch(
      filters,
      session.user.id,
      { targetRole, targetDomain },
      minScore
    )
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('Contact search error:', err)
    return NextResponse.json({ error: err.message || 'Contact search failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const filters: ContactSearchFilters = {
      ...DEFAULT_SEARCH_FILTERS,
      ...(body.filters || body),
    }

    const targetRole = body.targetRole || filters.titles[0] || 'Software & ML Engineer'
    const targetDomain = body.targetDomain || 'Technology'
    const minScore = typeof body.minScore === 'number' ? body.minScore : 60

    const result = await executeContactSearch(
      filters,
      session.user.id,
      { targetRole, targetDomain },
      minScore
    )

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('Contact search POST error:', err)
    return NextResponse.json({ error: err.message || 'Contact search failed' }, { status: 500 })
  }
}
