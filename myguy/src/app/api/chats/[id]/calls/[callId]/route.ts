import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'
import { authorizeCallParticipant, serializeCall } from '../call-utils'

const answerSchema = z.object({
  action: z.literal('accept'),
  answer: z.object({
    type: z.literal('answer'),
    sdp: z.string().min(1).max(100_000)
  })
})
const finishSchema = z.object({ action: z.enum(['decline', 'end']) })
const actionSchema = z.discriminatedUnion('action', [answerSchema, finishSchema])

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; callId: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id, callId } = await params
    const result = await authorizeCallParticipant(callId, id, userId)
    if ('response' in result) return result.response
    const now = new Date()
    if (result.call.status === 'active') {
      const callerStale = now.getTime() - result.call.callerLastSeenAt.getTime() > 25_000
      const calleeStale = !result.call.calleeLastSeenAt ||
        now.getTime() - result.call.calleeLastSeenAt.getTime() > 25_000
      if (callerStale || calleeStale) {
        const call = await prisma.chatCall.update({
          where: { id: callId },
          data: { status: 'ended' }
        })
        return NextResponse.json({ call: serializeCall({ ...result.call, ...call }) })
      }
    }
    if (result.call.status === 'ringing' && now.getTime() - result.call.createdAt.getTime() > 60_000) {
      const call = await prisma.chatCall.update({
        where: { id: callId },
        data: { status: 'ended' }
      })
      return NextResponse.json({ call: serializeCall({ ...result.call, ...call }) })
    }
    const call = await prisma.chatCall.update({
      where: { id: callId },
      data: result.call.callerId === userId ? { callerLastSeenAt: now } : { calleeLastSeenAt: now },
      include: {
        caller: { select: { id: true, username: true, profile: { select: { displayName: true, avatar: true } } } },
        callee: { select: { id: true, username: true, profile: { select: { displayName: true, avatar: true } } } }
      }
    })
    const signals = await prisma.chatCallSignal.findMany({
      where: { callId, senderId: { not: userId } },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: 300,
      select: { id: true, payload: true, createdAt: true }
    })
    return NextResponse.json({ call: serializeCall(call), signals })
  } catch (error) {
    console.error('Error checking direct chat call:', error)
    return NextResponse.json({ error: 'Failed to check call' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; callId: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id, callId } = await params
    const result = await authorizeCallParticipant(callId, id, userId)
    if ('response' in result) return result.response
    const parsed = actionSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid call action.' }, { status: 400 })
    }

    if (parsed.data.action === 'accept') {
      if (result.call.calleeId !== userId || result.call.status !== 'ringing') {
        return NextResponse.json({ error: 'This call can no longer be answered.' }, { status: 409 })
      }
      const updated = await prisma.chatCall.updateMany({
        where: { id: callId, calleeId: userId, status: 'ringing' },
        data: { status: 'active', answer: parsed.data.answer, calleeLastSeenAt: new Date() }
      })
      if (!updated.count) return NextResponse.json({ error: 'This call can no longer be answered.' }, { status: 409 })
      return NextResponse.json({ call: { id: callId, status: 'active' } })
    }

    if (result.call.status !== 'ringing' && result.call.status !== 'active') {
      return NextResponse.json({ error: 'This call has already ended.' }, { status: 409 })
    }
    const updated = await prisma.chatCall.updateMany({
      where: { id: callId, status: { in: ['ringing', 'active'] } },
      data: { status: parsed.data.action === 'decline' ? 'declined' : 'ended' }
    })
    if (!updated.count) return NextResponse.json({ error: 'This call has already ended.' }, { status: 409 })
    return NextResponse.json({ call: { id: callId, status: parsed.data.action === 'decline' ? 'declined' : 'ended' } })
  } catch (error) {
    console.error('Error updating direct chat call:', error)
    return NextResponse.json({ error: 'Failed to update call' }, { status: 500 })
  }
}
