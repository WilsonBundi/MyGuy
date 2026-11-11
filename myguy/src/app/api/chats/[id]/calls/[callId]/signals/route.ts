import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'
import { authorizeCallParticipant } from '../../call-utils'

const candidateSchema = z.object({
  candidate: z.string().min(1).max(4096),
  sdpMid: z.string().max(128).nullable().optional(),
  sdpMLineIndex: z.number().int().min(0).nullable().optional(),
  usernameFragment: z.string().max(256).optional()
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; callId: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id, callId } = await params
    const result = await authorizeCallParticipant(callId, id, userId)
    if ('response' in result) return result.response
    if (result.call.status !== 'ringing' && result.call.status !== 'active') {
      return NextResponse.json({ error: 'This call is no longer active.' }, { status: 409 })
    }
    const parsed = candidateSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'Invalid network candidate.' }, { status: 400 })
    const signalCount = await prisma.chatCallSignal.count({ where: { callId } })
    if (signalCount >= 300) {
      return NextResponse.json({ error: 'This call has reached its network signaling limit.' }, { status: 429 })
    }
    const [signal] = await prisma.$transaction([
      prisma.chatCallSignal.create({
        data: { callId, senderId: userId, payload: parsed.data }
      }),
      prisma.chatCall.update({
        where: { id: callId },
        data: userId === result.call.callerId
          ? { callerLastSeenAt: new Date() }
          : { calleeLastSeenAt: new Date() }
      })
    ])
    return NextResponse.json({ signalId: signal.id }, { status: 201 })
  } catch (error) {
    console.error('Error sending direct chat call signal:', error)
    return NextResponse.json({ error: 'Failed to send call signal' }, { status: 500 })
  }
}
