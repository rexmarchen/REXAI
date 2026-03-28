import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { ok, apiError } from '@/lib/api'
import { createUserRecord, findUserByEmail } from '@/lib/server-data'

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(request: Request) {
  const payload = await request.json()
  const parsed = registerSchema.safeParse(payload)

  if (!parsed.success) {
    return apiError('Please provide a valid name, email, and password.', 400)
  }

  const existingUser = await findUserByEmail(parsed.data.email)

  if (existingUser) {
    return apiError('An account with this email already exists.', 409)
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10)

  const user = await createUserRecord({
    name: parsed.data.name,
    email: parsed.data.email.toLowerCase(),
    passwordHash,
  })

  return ok({
    id: user.id,
    name: user.name,
    email: user.email,
  })
}
