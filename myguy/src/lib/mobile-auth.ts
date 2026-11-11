import { getToken, encode } from 'next-auth/jwt'
import { getServerSession } from 'next-auth'
import type { NextRequest } from 'next/server'
import { authOptions } from './auth'

function getAuthSecret() {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET
  if (secret) return secret
  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXTAUTH_SECRET or AUTH_SECRET must be configured in production.')
  }
  return 'dev-my-guy-secret-2026'
}

export interface MobileTokenUser {
  id: string
  email: string
  username: string
}

export async function issueMobileToken(user: MobileTokenUser) {
  return encode({
    token: {
      sub: user.id,
      id: user.id,
      email: user.email,
      username: user.username
    },
    secret: getAuthSecret(),
    maxAge: 60 * 60 * 24 * 30
  })
}

export async function getAuthenticatedUserId(request: Request) {
  const token = await getToken({ req: request as NextRequest, secret: getAuthSecret() })
  if (typeof token?.sub === 'string' && token.sub) {
    return token.sub
  }

  const session = await getServerSession(authOptions)
  return session?.user?.id || null
}
