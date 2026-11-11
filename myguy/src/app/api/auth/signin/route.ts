import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { issueMobileToken } from '@/lib/mobile-auth'
import { findUserByLoginIdentifier } from '@/lib/account-identifier'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const identifier = typeof body.identifier === 'string' ? body.identifier.trim() : ''
    const { password } = body

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Email, phone, or username and password are required' },
        { status: 400 }
      )
    }

    const user = await findUserByLoginIdentifier(identifier)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email, phone, or username' },
        { status: 401 }
      )
    }

    if (!user.password) {
      return NextResponse.json(
        { error: 'Account uses a different sign-in method' },
        { status: 400 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      )
    }

    // Update user as online
    await prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true, lastActiveAt: new Date() }
    })

    const mobileToken = await issueMobileToken({
      id: user.id,
      email: user.email,
      username: user.username
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.profile?.displayName || user.username,
        avatar: user.profile?.avatar,
        coverImage: user.profile?.coverImage,
        phone: user.phone
      },
      token: mobileToken
    })
  } catch (error) {
    console.error('Signin error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
