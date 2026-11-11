import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'

const decisionSchema = z.object({
  requestId: z.string().min(1),
  decision: z.enum(['approve', 'decline'])
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const member = await prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId: id, userId } },
      select: { role: true, chat: { select: { isGroup: true } } }
    })
    if (!member?.chat.isGroup || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json({ error: 'Only Crew admins can review join requests.' }, { status: 403 })
    }
    const requests = await prisma.crewJoinRequest.findMany({
      where: { chatId: id, status: 'pending' },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: { select: { displayName: true, avatar: true } }
          }
        }
      }
    })
    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error fetching Crew join requests:', error)
    return NextResponse.json({ error: 'Failed to fetch join requests' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const parsed = decisionSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'Choose a valid join request decision.' }, { status: 400 })
    const member = await prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId: id, userId } },
      select: { role: true, chat: { select: { isGroup: true } } }
    })
    if (!member?.chat.isGroup || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json({ error: 'Only Crew admins can review join requests.' }, { status: 403 })
    }
    const joinRequest = await prisma.crewJoinRequest.findFirst({
      where: { id: parsed.data.requestId, chatId: id, status: 'pending' },
      select: { id: true, userId: true }
    })
    if (!joinRequest) return NextResponse.json({ error: 'This request is no longer pending.' }, { status: 404 })

    await prisma.$transaction(async (tx) => {
      if (parsed.data.decision === 'approve') {
        await tx.chatMember.upsert({
          where: { chatId_userId: { chatId: id, userId: joinRequest.userId } },
          create: { chatId: id, userId: joinRequest.userId },
          update: {}
        })
      }
      await tx.crewJoinRequest.update({
        where: { id: joinRequest.id },
        data: { status: parsed.data.decision === 'approve' ? 'approved' : 'declined' }
      })
    })
    return NextResponse.json({ success: true, decision: parsed.data.decision })
  } catch (error) {
    console.error('Error reviewing Crew join request:', error)
    return NextResponse.json({ error: 'Failed to review join request' }, { status: 500 })
  }
}
