import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { issueMobileToken } from '@/lib/mobile-auth'
import { isE164PhoneNumber, isPhoneVerificationTokenValid } from '@/lib/phone-verification'

const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  username: z.string().trim().min(3).max(30),
  password: z.string().min(8),
  displayName: z.string().trim().min(1).max(50),
  phone: z.string().trim().regex(/^\+[1-9]\d{7,14}$/, 'Enter a valid phone number including its country code'),
  phoneVerificationToken: z.string().min(1),
  country: z.string().optional(),
  language: z.string().optional(),
  dateOfBirth: z.string().optional(),
  bio: z.string().max(160).optional(),
  interests: z.array(z.string()).optional(),
  birthDay: z.string().optional(),
  birthMonth: z.string().optional(),
  birthYear: z.string().optional()
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, username, password, displayName, phone, phoneVerificationToken, country, language, dateOfBirth, bio, interests, birthDay, birthMonth, birthYear } = signupSchema.parse(body)
    if (!isE164PhoneNumber(phone) || !isPhoneVerificationTokenValid(phone, phoneVerificationToken)) {
      return NextResponse.json(
        { error: 'Verify your phone number before creating an account' },
        { status: 400 }
      )
    }
    
    // Combine birth fields into dateOfBirth if not already provided
    const finalDateOfBirth = dateOfBirth || (birthYear && birthMonth && birthDay ? `${birthYear}-${birthMonth}-${birthDay}` : '')

    // Check if user already exists (email, username, or phone)
    // Note: Phone field may not exist in database yet if migration hasn't run
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
          { phone }
        ]
      },
      select: {
        id: true,
        email: true,
        username: true,
        phone: true
      }
    })

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 400 }
        )
      }
      if (existingUser.username === username) {
        return NextResponse.json(
          { error: 'This username is already taken' },
          { status: 400 }
        )
      }
      if (phone && existingUser.phone === phone) {
        return NextResponse.json(
          { error: 'This phone number is already in use' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user with profile
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        phone,
        profile: {
          create: {
            displayName,
            phone,
            language: language || 'en',
            country,
            bio,
            interests: interests || []
          }
        }
      },
      select: {
        id: true,
        email: true,
        username: true,
        phone: true,
        profile: {
          select: {
            displayName: true,
            avatar: true,
            coverImage: true
          }
        }
      }
    })

    const mobileToken = await issueMobileToken({
      id: user.id,
      email: user.email,
      username: user.username
    })

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          phone: user.phone,
          displayName: user.profile?.displayName,
          avatar: user.profile?.avatar,
          coverImage: user.profile?.coverImage
        },
        token: mobileToken
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Something went wrong', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
