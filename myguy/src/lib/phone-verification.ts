import { createHmac, timingSafeEqual } from 'crypto'

const E164_PHONE_PATTERN = /^\+[1-9]\d{7,14}$/

export function isE164PhoneNumber(phone: string) {
  return E164_PHONE_PATTERN.test(phone)
}

function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID
  if (!accountSid || !authToken || !verifyServiceSid) {
    throw new Error('Phone verification is not configured. Set the Twilio Verify environment variables.')
  }
  return { accountSid, authToken, verifyServiceSid }
}

async function twilioRequest(path: string, fields: Record<string, string>) {
  const { accountSid, authToken, verifyServiceSid } = getTwilioConfig()
  const response = await fetch(
    `https://verify.twilio.com/v2/Services/${encodeURIComponent(verifyServiceSid)}/${path}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(fields),
      cache: 'no-store',
    }
  )
  if (!response.ok) {
    throw new Error(`Twilio Verify returned HTTP ${response.status}.`)
  }
  return response.json() as Promise<{ status?: string }>
}

export async function sendPhoneVerificationCode(phone: string) {
  await twilioRequest('Verifications', { To: phone, Channel: 'sms' })
}

export async function checkPhoneVerificationCode(phone: string, code: string) {
  const result = await twilioRequest('VerificationCheck', { To: phone, Code: code })
  return result.status === 'approved'
}

function getVerificationSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('Phone verification signing secret is not configured.')
  return secret
}

export function createPhoneVerificationToken(phone: string) {
  const payload = Buffer.from(JSON.stringify({
    phone,
    expiresAt: Date.now() + 10 * 60 * 1000,
  })).toString('base64url')
  const signature = createHmac('sha256', getVerificationSecret()).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

export function isPhoneVerificationTokenValid(phone: string, token: string) {
  try {
    const [payload, signature, extra] = token.split('.')
    if (!payload || !signature || extra) return false
    const expected = createHmac('sha256', getVerificationSecret()).update(payload).digest()
    const actual = Buffer.from(signature, 'base64url')
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false
    const data: unknown = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return Boolean(
      data &&
      typeof data === 'object' &&
      'phone' in data && data.phone === phone &&
      'expiresAt' in data && typeof data.expiresAt === 'number' &&
      data.expiresAt > Date.now()
    )
  } catch {
    return false
  }
}
