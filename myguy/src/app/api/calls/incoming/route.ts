import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'
import { expireStaleCallsForUsers } from '../../chats/[id]/calls/call-utils'

export async function GET(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await expireStaleCallsForUsers([userId])
    const calls = await prisma.chatCall.findMany({
      where: { calleeId: userId, status: 'ringing' },
      orderBy: { createdAt: 'asc' },
      take: 5,
      include: {
        caller: { select: { id: true, username: true, profile: { select: { displayName: true, avatar: true } } } },
        chat: { select: { id: true } }
      }
    })
    return NextResponse.json({
      calls: calls.map((call) => ({
        id: call.id,
        chatId: call.chatId,
        type: call.type,
        createdAt: call.createdAt,
        caller: call.caller
      }))
    })
  } catch (error) {
    console.error('Error fetching incoming calls:', error)
    return NextResponse.json({ error: 'Failed to fetch incoming calls' }, { status: 500 })
  }
}
