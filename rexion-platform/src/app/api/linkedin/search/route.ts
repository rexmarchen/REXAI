import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { searchLinkedInPeople } from '@/lib/unipile'
import { filterAndRankCandidates, qualifyContact } from '@/lib/qualify-contact'

/**
 * Production LinkedIn Contact Search & Qualification API
 * Queries real live LinkedIn profiles via the user's Unipile connected account,
 * filters out public figures, and ranks candidates using the qualification engine.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const body = await req.json().catch(() => ({}))

    const {
      keywords = 'Talent Acquisition HR',
      company = '',
      targetRole = 'Software & ML Engineer',
      targetDomain = 'Technology',
      minScore = 60,
      providerAcctId = process.env.UNIPILE_ACCOUNT_ID || '0fsMHoZ2SwacZz6lQsuXbw',
      limit = 15,
    } = body

    if (!keywords || !keywords.trim()) {
      return NextResponse.json(
        { success: false, error: 'Search keywords are required.' },
        { status: 400 }
      )
    }

    if (!providerAcctId) {
      return NextResponse.json(
        { success: false, error: 'No connected LinkedIn provider account found. Please connect your LinkedIn account first.' },
        { status: 400 }
      )
    }

    // 1. Search Live LinkedIn via Unipile
    const rawContacts = await searchLinkedInPeople({
      keywords,
      company,
      providerAcctId,
      limit: limit * 2, // fetch buffer to allow qualification filtering
    })

    const userProfile = {
      targetRole,
      targetDomain,
    }

    // 2. Format candidates for Qualification Scorer
    const candidatesToQualify = rawContacts.map((c) => ({
      id: c.providerId || c.publicIdentifier,
      name: c.name,
      firstName: c.firstName,
      lastName: c.lastName,
      jobTitle: c.title,
      headline: c.title,
      companyName: c.company,
      linkedinUrl: c.profileUrl,
      publicIdentifier: c.publicIdentifier,
      location: c.location,
      avatarUrl: c.avatarUrl,
      isRelationship: c.isRelationship,
      networkDistance: c.networkDistance,
    }))

    // 3. Filter and Rank Candidates (Hard-rejecting public figures & denylisted executives)
    const rankedQualifiedCandidates = filterAndRankCandidates(
      candidatesToQualify,
      userProfile,
      minScore
    )

    // 4. Log Disqualification Telemetry for Auditing
    const rejectedCandidates = candidatesToQualify
      .map((c) => ({
        candidate: c,
        qualification: qualifyContact(c, userProfile, minScore),
      }))
      .filter((item) => !item.qualification.qualified)

    console.log(
      `[LinkedIn Search & Qualify] Found ${rawContacts.length} live contacts | ` +
      `Qualified: ${rankedQualifiedCandidates.length} | Rejected: ${rejectedCandidates.length}`
    )

    if (rejectedCandidates.length > 0) {
      rejectedCandidates.forEach(({ candidate, qualification }) => {
        console.log(
          `  ❌ Rejected: ${candidate.name} (${candidate.companyName}) -> ` +
          `Score: ${qualification.score} | Reason: ${qualification.disqualificationReason || qualification.reasoning}`
        )
      })
    }

    return NextResponse.json({
      success: true,
      query: { keywords, company, targetRole },
      totalFound: rawContacts.length,
      qualifiedCount: rankedQualifiedCandidates.length,
      contacts: rankedQualifiedCandidates.slice(0, limit),
      rejectedSummary: rejectedCandidates.map(({ candidate, qualification }) => ({
        name: candidate.name,
        company: candidate.companyName,
        reason: qualification.disqualificationReason || qualification.reasoning,
        verdict: qualification.verdict,
      })),
    })
  } catch (error: any) {
    console.error('[LinkedIn Search API Error]:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal LinkedIn search error' },
      { status: 500 }
    )
  }
}
