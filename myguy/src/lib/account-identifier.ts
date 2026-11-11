import { prisma } from '@/lib/prisma'

export async function findUserByLoginIdentifier(identifier: string) {
  const normalizedIdentifier = identifier.trim()
  const phoneDigits = normalizedIdentifier.replace(/\D/g, '')
  const normalizedPhone = phoneDigits
    ? `+${phoneDigits.startsWith('00') ? phoneDigits.slice(2) : phoneDigits}`
    : ''

  return prisma.user.findFirst({
    where: {
      OR: [
        { email: normalizedIdentifier.toLowerCase() },
        { phone: normalizedPhone },
        { username: { equals: normalizedIdentifier, mode: 'insensitive' } },
      ],
    },
    include: { profile: true },
  })
}
