import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { findUserByLoginIdentifier } from './account-identifier'

const authSecret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET
if (!authSecret && process.env.NODE_ENV === 'production') {
  throw new Error('NEXTAUTH_SECRET or AUTH_SECRET must be configured in production.')
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Email, Phone, or Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        const user = await findUserByLoginIdentifier(credentials.identifier)

        if (!user || !user.password) {
          throw new Error('Invalid credentials')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('Invalid credentials')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.profile?.displayName || user.username,
          username: user.username,
          image: user.profile?.avatar
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/auth/signin'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        // Note: isOnline and lastActiveAt fields will be added after migration
        // For now, skip this to prevent errors
        // await prisma.user.update({
        //   where: { id: user.id },
        //   data: { isOnline: true, lastActiveAt: new Date() }
        // })
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string
      }
      return session
    }
  },
  secret: authSecret ?? 'dev-my-guy-secret-2026'
}
