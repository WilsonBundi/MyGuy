import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'

const joinSchema = z.object({
  inviteCode: z.string().trim().min(12).max(100).optional(),
  crewId: z.string().trim().min(1).optional()
}).refine((data) => data.inviteCode || data.crewId)

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const parsed = joinSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'This Crew invite is invalid.' }, { status: 400 })

    const crew = parsed.data.inviteCode
      ? await prisma.chat.findFirst({
        where: { inviteCode: parsed.data.inviteCode, isGroup: true, status: 'accepted' },
        select: { id: true, requiresApproval: true }
      })
      : await prisma.chat.findFirst({
        where: {
          id: parsed.data.crewId,
          isGroup: true,
          isPrivate: false,
          status: 'accepted'
        },
        select: { id: true, requiresApproval: true }
      })
    if (!crew) return NextResponse.json({ error: 'This Crew invite has expired or is invalid.' }, { status: 404 })
    const existing = await prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId: crew.id, userId } },
      select: { id: true }
    })
    if (existing) return NextResponse.json({ error: 'You are already part of this Crew.' }, { status: 409 })

    if (!parsed.data.inviteCode && crew.requiresApproval) {
      await prisma.crewJoinRequest.upsert({
        where: { chatId_userId: { chatId: crew.id, userId } },
        create: { chatId: crew.id, userId },
        update: { status: 'pending' }
      })
      return NextResponse.json({ crewId: crew.id, pending: true }, { status: 202 })
    }

    await prisma.chatMember.create({ data: { chatId: crew.id, userId } })
    return NextResponse.json({ crewId: crew.id, pending: false }, { status: 201 })
  } catch (error) {
    console.error('Error joining Crew:', error)
    return NextResponse.json({ error: 'Failed to join Crew' }, { status: 500 })
  }
}
