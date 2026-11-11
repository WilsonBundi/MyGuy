import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'
import { expireStaleCallsForUsers, getDirectChatParticipant, serializeCall } from './call-utils'

const offerSchema = z.object({
  type: z.literal('offer'),
  sdp: z.string().min(1).max(100_000)
})

const createCallSchema = z.object({
  type: z.enum(['audio', 'video']),
  offer: offerSchema
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    if (!await getDirectChatParticipant(id, userId)) {
      return NextResponse.json({ error: 'Calls are available in direct conversations only.' }, { status: 404 })
    }
    const now = new Date()
    await expireStaleCallsForUsers([userId], now)
    const call = await prisma.chatCall.findFirst({
      where: {
        chatId: id,
        status: { in: ['ringing', 'active'] },
        OR: [{ callerId: userId }, { calleeId: userId }]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        caller: { select: { id: true, username: true, profile: { select: { displayName: true, avatar: true } } } },
        callee: { select: { id: true, username: true, profile: { select: { displayName: true, avatar: true } } } }
      }
    })
    if (!call) return NextResponse.json({ call: null })

    await prisma.chatCall.update({
      where: { id: call.id },
      data: call.callerId === userId ? { callerLastSeenAt: now } : { calleeLastSeenAt: now }
    })
    return NextResponse.json({ call: serializeCall(call) })
  } catch (error) {
    console.error('Error checking direct chat calls:', error)
    return NextResponse.json({ error: 'Failed to check calls' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const other = await getDirectChatParticipant(id, userId)
    if (!other) return NextResponse.json({ error: 'Calls are available in direct conversations only.' }, { status: 404 })
    const parsed = createCallSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'Invalid call offer.' }, { status: 400 })

    await expireStaleCallsForUsers([userId, other.userId])
    const existing = await prisma.chatCall.findFirst({
      where: {
        status: { in: ['ringing', 'active'] },
        OR: [{ callerId: { in: [userId, other.userId] } }, { calleeId: { in: [userId, other.userId] } }]
      },
      select: { id: true }
    })
    if (existing) return NextResponse.json({ error: 'A call is already in progress in this conversation.' }, { status: 409 })

    const call = await prisma.chatCall.create({
      data: {
        chatId: id,
        callerId: userId,
        calleeId: other.userId,
        type: parsed.data.type,
        offer: parsed.data.offer
      },
      include: {
        caller: { select: { id: true, username: true, profile: { select: { displayName: true, avatar: true } } } },
        callee: { select: { id: true, username: true, profile: { select: { displayName: true, avatar: true } } } }
      }
    })
    return NextResponse.json({ call: serializeCall(call) }, { status: 201 })
  } catch (error) {
    console.error('Error starting direct chat call:', error)
    return NextResponse.json({ error: 'Failed to start call' }, { status: 500 })
  }
}
