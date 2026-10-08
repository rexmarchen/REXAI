import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { hasDatabaseConnectionString } from '@/lib/db'
import { ok, apiError } from '@/lib/api'
import { sendWelcomeEmail } from '@/lib/emails/welcome'
import { checkRateLimit } from '@/lib/rate-limit'
import { getRequestIp, isDemoModeEnabled } from '@/lib/runtime'
import { createUserRecord, findUserByEmail, logAdminAction } from '@/lib/server-data'

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((input) => input.password === input.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
})

export async function POST(request: Request) {
  const ip = getRequestIp(request)
  const rateLimit = checkRateLimit(`register:${ip}`, 5, 15 * 60 * 1000)
  if (!rateLimit.allowed) {
    return apiError('Too many sign-up attempts. Please wait a few minutes and try again.', 429)
  }

  if (!hasDatabaseConnectionString() && !isDemoModeEnabled()) {
    return apiError('Registration is unavailable until database storage is configured.', 503)
  }

  const payload = await request.json()
  const parsed = registerSchema.safeParse(payload)

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message || 'Please provide a valid name, email, and password.'
    return apiError(firstIssue, 400)
  }

  const existingUser = await findUserByEmail(parsed.data.email)

  if (existingUser) {
    return apiError('An account with this email already exists.', 409)
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12)

  let user

  try {
    user = await createUserRecord({
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      passwordHash,
      role: 'user',
    })
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : 'Unable to create your account right now.',
      503
    )
  }

  const forwardedFor = request.headers.get('x-forwarded-for')
  const forwardedIp = forwardedFor?.split(',')[0]?.trim()

  void sendWelcomeEmail(user.email, user.name)
  void logAdminAction({
    action: 'USER_REGISTERED',
    targetType: 'User',
    targetId: user.id,
    details: `New user registered on free plan: ${user.email}`,
    ip: forwardedIp || ip,
  })

  return ok({
    success: true,
    message: 'Account created. Check your email.',
  })
}
