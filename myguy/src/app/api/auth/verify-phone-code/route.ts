import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  checkPhoneVerificationCode,
  createPhoneVerificationToken,
  isE164PhoneNumber,
} from '@/lib/phone-verification'

const verifyCodeSchema = z.object({
  phone: z.string().trim().regex(/^\+[1-9]\d{7,14}$/),
  code: z.string().trim().regex(/^\d{4,10}$/),
})

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = verifyCodeSchema.parse(await request.json())
    if (!isE164PhoneNumber(phone)) {
      return NextResponse.json({ error: 'Enter a valid phone number including its country code' }, { status: 400 })
    }
    const verified = await checkPhoneVerificationCode(phone, code)
    if (!verified) {
      return NextResponse.json({ error: 'That verification code is incorrect or expired.' }, { status: 400 })
    }
    return NextResponse.json({
      success: true,
      verificationToken: createPhoneVerificationToken(phone),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Enter a valid phone number and verification code' }, { status: 400 })
    }
    const isConfigurationError = error instanceof Error && error.message.includes('not configured')
    if (!isConfigurationError) console.error('Error verifying phone number:', error)
    return NextResponse.json(
      { error: isConfigurationError ? error.message : 'Could not verify the code. Please request a new SMS and try again.' },
      { status: isConfigurationError ? 503 : 502 }
    )
  }
}
