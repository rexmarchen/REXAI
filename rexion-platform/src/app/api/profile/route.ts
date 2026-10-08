import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import CareerProfile from '@/models/CareerProfile'
import User from '@/models/User'
import mammoth from 'mammoth'
import { getOpenAIClient } from '@/lib/openai'
import { calculateProfileCompletion } from '@/lib/profile-completion'

async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import / require for Next.js CJS/ESM compatibility
    const pdf = require('pdf-parse')
    const parsed = await (typeof pdf === 'function' ? pdf(buffer) : pdf.default ? pdf.default(buffer) : { text: '' })
    return parsed.text || ''
  } catch (e) {
    console.error('PDF text extraction error:', e)
    return ''
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return Response.json({ error: 'Unauthorized. Please log in.' }, { status: 401 })
    }

    await connectDB()

    let profile = await CareerProfile.findOne({ userId: session.user.id })

    // If profile doesn't exist, create initial default profile
    if (!profile) {
      const user = await User.findById(session.user.id)
      const fullName = user?.name || session.user.name || ''
      const email = user?.email || session.user.email || ''
      const parts = fullName.split(' ')
      const firstName = parts[0] || ''
      const lastName = parts.slice(1).join(' ') || ''

      profile = await CareerProfile.create({
        userId: session.user.id,
        firstName,
        lastName,
        email,
        headline: '',
        professionalSummary: '',
        skills: [],
        experience: [],
        education: [],
        projects: [],
        certifications: [],
        achievements: [],
        socialLinks: {},
        jobPreferences: {
          targetRoles: [],
          desiredTitles: [],
          employmentTypes: ['Full-time', 'Internship'],
          workModes: ['remote', 'hybrid'],
          relocationPreference: 'open',
          industryPreferences: [],
          currency: 'USD',
        },
        workAuthorization: {
          countryOfResidence: 'India',
          authorizedCountries: ['India'],
          requiresSponsorship: false,
          openToInternationalRemote: true,
          openToRelocation: true,
        },
        privacySettings: {
          profileVisibility: 'recruiters',
          showEmail: true,
          showPhone: false,
          showLocation: true,
          allowAiUseProfileData: true,
          allowAutomatedApplications: true,
        },
      })
    }

    const completion = calculateProfileCompletion(
      profile.toObject ? profile.toObject() : profile,
      session.user.name,
      session.user.email
    )

    if (profile.profileCompletion !== completion.percentage) {
      profile.profileCompletion = completion.percentage
      await profile.save()
    }

    return Response.json({
      success: true,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        plan: session.user.plan || 'free',
        role: session.user.role || 'user',
      },
      profile,
      completion,
    })
  } catch (error: any) {
    console.error('Error fetching profile:', error)
    return Response.json({ error: error.message || 'Failed to fetch profile.' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return Response.json({ error: 'Unauthorized. Please log in.' }, { status: 401 })
    }

    await connectDB()
    const payload = await req.json()

    // Prevent client from updating other users' profiles
    delete payload.userId
    delete payload._id

    // Update user name/image if provided in payload
    if (payload.name || payload.avatar) {
      await User.findByIdAndUpdate(session.user.id, {
        ...(payload.name ? { name: payload.name } : {}),
        ...(payload.avatar ? { avatar: payload.avatar, image: payload.avatar } : {}),
      })
    }

    // Synchronize categorized skills and flat skills
    if (payload.categorizedSkills) {
      const allCategorized = [
        ...(payload.categorizedSkills.languages || []),
        ...(payload.categorizedSkills.aiMl || []),
        ...(payload.categorizedSkills.frameworks || []),
        ...(payload.categorizedSkills.databases || []),
        ...(payload.categorizedSkills.tools || []),
        ...(payload.categorizedSkills.other || []),
      ]
      payload.skills = Array.from(new Set([...(payload.skills || []), ...allCategorized]))
      payload.languages = payload.categorizedSkills.languages || payload.languages || []
      payload.frameworks = payload.categorizedSkills.frameworks || payload.frameworks || []
      payload.databases = payload.categorizedSkills.databases || payload.databases || []
      payload.tools = payload.categorizedSkills.tools || payload.tools || []
    }

    // Keep legacy fields in sync
    if (payload.name) {
      const parts = payload.name.split(' ')
      payload.firstName = parts[0] || ''
      payload.lastName = parts.slice(1).join(' ') || ''
    }

    const updatedProfile = await CareerProfile.findOneAndUpdate(
      { userId: session.user.id },
      { $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    const completion = calculateProfileCompletion(
      updatedProfile.toObject ? updatedProfile.toObject() : updatedProfile,
      session.user.name,
      session.user.email
    )

    if (updatedProfile.profileCompletion !== completion.percentage) {
      updatedProfile.profileCompletion = completion.percentage
      await updatedProfile.save()
    }

    return Response.json({
      success: true,
      profile: updatedProfile,
      completion,
    })
  } catch (error: any) {
    console.error('Error updating profile:', error)
    return Response.json({ error: error.message || 'Failed to update profile.' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return Response.json({ error: 'Unauthorized. Please log in.' }, { status: 401 })
    }

    await connectDB()
    const contentType = req.headers.get('content-type') || ''

    if (!contentType.includes('multipart/form-data')) {
      // If regular JSON was sent as POST, forward to PUT handler logic
      return PUT(req)
    }

    const formData = await req.formData()
    const file = formData.get('resume') as File | null
    if (!file) {
      return Response.json({ error: 'No resume file provided.' }, { status: 400 })
    }

    // File validation: PDF or DOCX, max 10MB
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ]
    const isDocx = file.name.endsWith('.docx') || file.name.endsWith('.pdf') || file.name.endsWith('.doc')
    if (!validTypes.includes(file.type) && !isDocx) {
      return Response.json(
        { error: 'Invalid file format. Please upload a PDF or DOCX file.' },
        { status: 400 }
      )
    }

    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ error: 'File size exceeds 10MB limit.' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Save locally to public/uploads
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${session.user.id}_${Date.now()}_${sanitizedName}`
    const filepath = path.join(uploadDir, filename)
    await writeFile(filepath, buffer)

    const resumeUrl = `/uploads/${filename}`
    const resumeFileName = file.name

    // Parse resume text
    let resumeText = ''
    try {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        resumeText = await extractPdfText(buffer)
      } else if (file.name.endsWith('.docx') || file.type.includes('wordprocessingml')) {
        const result = await mammoth.extractRawText({ buffer })
        resumeText = result.value || ''
      }
    } catch (err) {
      console.error('Resume text extraction error:', err)
    }

    // AI Resume analysis if OpenAI is available
    let parsedResumeData: any = {}
    let atsScore = 75
    const openai = getOpenAIClient()

    if (openai && resumeText.trim().length > 20) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `You are an expert AI Career and ATS Resume Parser. Extract all candidate information strictly in JSON matching this schema:
              {
                "headline": "string (e.g. Full Stack Engineer | React & Node.js)",
                "professionalSummary": "string (3-4 sentences)",
                "skills": ["string"],
                "categorizedSkills": {
                  "languages": ["string"],
                  "aiMl": ["string"],
                  "frameworks": ["string"],
                  "databases": ["string"],
                  "tools": ["string"],
                  "other": ["string"]
                },
                "targetRoles": ["string"],
                "experience": [
                  {
                    "company": "string",
                    "role": "string",
                    "location": "string",
                    "employmentType": "Internship" | "Full-time" | "Freelance",
                    "startDate": "string",
                    "endDate": "string",
                    "isCurrent": false,
                    "description": "string",
                    "skills": ["string"]
                  }
                ],
                "education": [
                  {
                    "institution": "string",
                    "degree": "string",
                    "fieldOfStudy": "string",
                    "startYear": "string",
                    "endYear": "string",
                    "cgpa": "string"
                  }
                ],
                "projects": [
                  {
                    "title": "string",
                    "description": "string",
                    "role": "string",
                    "technologies": ["string"],
                    "githubUrl": "string",
                    "liveUrl": "string"
                  }
                ],
                "certifications": [
                  {
                    "name": "string",
                    "issuingOrganization": "string",
                    "issueDate": "string"
                  }
                ],
                "atsScore": 85,
                "strengths": ["string"],
                "suggestions": ["string"]
              }`,
            },
            {
              role: 'user',
              content: `Parse this resume content:\n\n${resumeText.slice(0, 8000)}`,
            },
          ],
        })

        const rawContent = completion.choices[0]?.message?.content || '{}'
        parsedResumeData = JSON.parse(rawContent)
        if (parsedResumeData.atsScore && typeof parsedResumeData.atsScore === 'number') {
          atsScore = parsedResumeData.atsScore
        }
      } catch (err) {
        console.error('OpenAI resume parsing error:', err)
      }
    }

    const resumeRecord = {
      fileName: resumeFileName,
      fileUrl: resumeUrl,
      fileType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'docx'),
      uploadedAt: new Date(),
      parsedStatus: resumeText.length > 0 ? 'parsed' : 'pending',
      atsScore,
      extractedText: resumeText.slice(0, 15000),
      parsedData: parsedResumeData,
    }

    // Merge extracted details with user's profile without overwriting existing entries if they already exist
    const currentProfile = await CareerProfile.findOne({ userId: session.user.id })

    const updateFields: any = {
      resume: resumeRecord,
      resumeUrl,
      resumeFileName,
      parsedResumeData,
    }

    if (parsedResumeData.headline && (!currentProfile?.headline || currentProfile.headline === '')) {
      updateFields.headline = parsedResumeData.headline
    }
    if (
      parsedResumeData.professionalSummary &&
      (!currentProfile?.professionalSummary || currentProfile.professionalSummary === '')
    ) {
      updateFields.professionalSummary = parsedResumeData.professionalSummary
    }
    if (parsedResumeData.skills && Array.isArray(parsedResumeData.skills)) {
      const existingSkills = currentProfile?.skills || []
      updateFields.skills = Array.from(new Set([...existingSkills, ...parsedResumeData.skills]))
    }
    if (parsedResumeData.categorizedSkills) {
      updateFields.categorizedSkills = {
        languages: Array.from(
          new Set([
            ...(currentProfile?.categorizedSkills?.languages || []),
            ...(parsedResumeData.categorizedSkills.languages || []),
          ])
        ),
        aiMl: Array.from(
          new Set([
            ...(currentProfile?.categorizedSkills?.aiMl || []),
            ...(parsedResumeData.categorizedSkills.aiMl || []),
          ])
        ),
        frameworks: Array.from(
          new Set([
            ...(currentProfile?.categorizedSkills?.frameworks || []),
            ...(parsedResumeData.categorizedSkills.frameworks || []),
          ])
        ),
        databases: Array.from(
          new Set([
            ...(currentProfile?.categorizedSkills?.databases || []),
            ...(parsedResumeData.categorizedSkills.databases || []),
          ])
        ),
        tools: Array.from(
          new Set([
            ...(currentProfile?.categorizedSkills?.tools || []),
            ...(parsedResumeData.categorizedSkills.tools || []),
          ])
        ),
        other: Array.from(
          new Set([
            ...(currentProfile?.categorizedSkills?.other || []),
            ...(parsedResumeData.categorizedSkills.other || []),
          ])
        ),
      }
    }
    if (
      parsedResumeData.experience?.length &&
      (!currentProfile?.experience || currentProfile.experience.length === 0)
    ) {
      updateFields.experience = parsedResumeData.experience
    }
    if (
      parsedResumeData.education?.length &&
      (!currentProfile?.education || currentProfile.education.length === 0)
    ) {
      updateFields.education = parsedResumeData.education
    }
    if (
      parsedResumeData.projects?.length &&
      (!currentProfile?.projects || currentProfile.projects.length === 0)
    ) {
      updateFields.projects = parsedResumeData.projects
    }
    if (
      parsedResumeData.targetRoles?.length &&
      (!currentProfile?.targetRoles || currentProfile.targetRoles.length === 0)
    ) {
      updateFields.targetRoles = parsedResumeData.targetRoles
    }

    const updatedProfile = await CareerProfile.findOneAndUpdate(
      { userId: session.user.id },
      { $set: updateFields },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    const completion = calculateProfileCompletion(
      updatedProfile.toObject ? updatedProfile.toObject() : updatedProfile,
      session.user.name,
      session.user.email
    )

    if (updatedProfile.profileCompletion !== completion.percentage) {
      updatedProfile.profileCompletion = completion.percentage
      await updatedProfile.save()
    }

    return Response.json({
      success: true,
      message: 'Resume uploaded and parsed successfully.',
      resumeUrl,
      resumeFileName,
      resume: resumeRecord,
      profile: updatedProfile,
      completion,
    })
  } catch (error: any) {
    console.error('Error handling resume upload:', error)
    return Response.json({ error: error.message || 'Failed to upload resume.' }, { status: 500 })
  }
}
