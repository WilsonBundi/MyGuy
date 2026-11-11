import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isE164PhoneNumber, sendPhoneVerificationCode } from '@/lib/phone-verification'

const sendCodeSchema = z.object({
  phone: z.string().trim().regex(/^\+[1-9]\d{7,14}$/, 'Enter a valid phone number including its country code'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone } = sendCodeSchema.parse(body)
    if (!isE164PhoneNumber(phone)) {
      return NextResponse.json({ error: 'Enter a valid phone number including its country code' }, { status: 400 })
    }
    await sendPhoneVerificationCode(phone)

    return NextResponse.json({ 
      success: true,
      message: 'Verification code sent by SMS'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || 'Enter a valid phone number' }, { status: 400 })
    }
    const isConfigurationError = error instanceof Error && error.message.includes('not configured')
    if (!isConfigurationError) console.error('Error sending phone verification SMS:', error)
    return NextResponse.json(
      { error: isConfigurationError ? error.message : 'Could not send the verification SMS. Check the number and try again.' },
      { status: isConfigurationError ? 503 : 502 }
    )
  }
}
