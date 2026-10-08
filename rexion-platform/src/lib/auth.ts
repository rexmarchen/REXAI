import NextAuth, { type NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { sendWelcomeEmail } from '@/lib/emails/welcome'
import { normalizePlan, normalizeRole } from '@/lib/plan'
import { findUserByEmail, touchUserLogin, upsertOAuthUser } from '@/lib/server-data'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export async function authorizeCredentials(rawCredentials: unknown) {
  const parsed = credentialsSchema.safeParse(rawCredentials)
  if (!parsed.success) {
    return null
  }

  const user = await findUserByEmail(parsed.data.email)
  if (!user?.passwordHash) {
    return null
  }

  const validPassword = await bcrypt.compare(parsed.data.password, user.passwordHash)
  if (!validPassword) {
    return null
  }

  await touchUserLogin(user.id)

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image || null,
    plan: normalizePlan(user.plan),
    role: normalizeRole(user.role),
  }
}

const providers: NonNullable<NextAuthConfig['providers']> = []

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  )
}

providers.push(
  Credentials({
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    authorize: authorizeCredentials,
  })
)

export const authConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && user.email) {
        let storedUser

        try {
          storedUser = await upsertOAuthUser({
            email: user.email,
            name: user.name,
            image: user.image,
            googleSub: typeof profile?.sub === 'string' ? profile.sub : undefined,
          })
        } catch (error) {
          console.error('Google sign-in failed because persistence is not configured.', error)
          return false
        }

        user.id = storedUser.id
        user.plan = storedUser.plan
        user.role = storedUser.role
        await touchUserLogin(storedUser.id)
      }

      return true
    },
    authorized({ auth, request: { nextUrl } }) {
      if (nextUrl.pathname.startsWith('/dashboard')) {
        return Boolean(auth?.user)
      }

      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.plan = normalizePlan(user.plan)
        token.role = normalizeRole(user.role)
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id || '')
        session.user.plan = normalizePlan(token.plan as string | undefined)
        session.user.role = normalizeRole(token.role as string | undefined)
      }

      return session
    },
  },
  events: {
    async createUser({ user }) {
      if (user.email) {
        await sendWelcomeEmail(user.email, user.name || 'there')
      }
    },
    async signIn({ user, isNewUser }) {
      if (isNewUser && user.email) {
        await sendWelcomeEmail(user.email, user.name || 'there')
      }
    },
  },
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
