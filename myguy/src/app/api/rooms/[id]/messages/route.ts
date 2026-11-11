import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'
import { getLiveKitRoomService, isLiveKitConfigurationError } from '@/lib/livekit'

const messageSchema = z.object({
  content: z.string().trim().min(1).max(300),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const room = await prisma.room.findUnique({ where: { id }, select: { isLive: true, roomName: true } })
    if (!room?.isLive || !room.roomName) return NextResponse.json({ error: 'This live is no longer available.' }, { status: 404 })
    if (!(await getLiveKitRoomService().listRooms([room.roomName])).length) {
      return NextResponse.json({ error: 'This live is no longer available.' }, { status: 404 })
    }

    const messages = await prisma.roomMessage.findMany({
      where: { roomId: id },
      orderBy: { createdAt: 'desc' },
      take: 60,
      include: {
        user: { select: { id: true, username: true, profile: { select: { displayName: true, avatar: true } } } },
      },
    })
    return NextResponse.json({ messages: messages.reverse() })
  } catch (error) {
    if (isLiveKitConfigurationError(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    console.error('Error loading live chat:', error)
    return NextResponse.json({ error: 'Could not load live chat.' }, { status: 500 })
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
    const parsed = messageSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'Enter a message of up to 300 characters.' }, { status: 400 })

    const [room, participant] = await Promise.all([
      prisma.room.findUnique({ where: { id }, select: { isLive: true, roomName: true, hostId: true, chatEnabled: true } }),
      prisma.roomParticipant.findUnique({
        where: { roomId_userId: { roomId: id, userId } },
        select: { id: true, bannedAt: true, kickedUntil: true, chatMutedUntil: true },
      }),
    ])
    if (!room?.isLive || !room.roomName) return NextResponse.json({ error: 'This live is no longer available.' }, { status: 404 })
    if (!participant) return NextResponse.json({ error: 'Join the live before chatting.' }, { status: 403 })
    const now = new Date()
    if (participant.bannedAt || (participant.kickedUntil && participant.kickedUntil > now)) {
      return NextResponse.json({ error: 'You cannot chat in this live right now.' }, { status: 403 })
    }
    if (room.hostId !== userId && !room.chatEnabled) {
      return NextResponse.json({ error: 'The host has paused live chat.' }, { status: 403 })
    }
    if (room.hostId !== userId && participant.chatMutedUntil && participant.chatMutedUntil > now) {
      return NextResponse.json({ error: 'You are temporarily muted in live chat.' }, { status: 403 })
    }
    const liveParticipants = await getLiveKitRoomService().listParticipants(room.roomName)
    if (!liveParticipants.some((liveParticipant) => liveParticipant.identity === userId)) {
      return NextResponse.json({ error: 'Join the live before chatting.' }, { status: 403 })
    }

    const recentMessage = await prisma.roomMessage.findFirst({
      where: { roomId: id, userId, createdAt: { gte: new Date(Date.now() - 2000) } },
      select: { id: true },
    })
    if (recentMessage) {
      return NextResponse.json({ error: 'Please wait a moment before sending another message.' }, { status: 429 })
    }

    const message = await prisma.roomMessage.create({
      data: { roomId: id, userId, content: parsed.data.content },
      include: {
        user: { select: { id: true, username: true, profile: { select: { displayName: true, avatar: true } } } },
      },
    })
    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    if (isLiveKitConfigurationError(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    console.error('Error sending live chat message:', error)
    return NextResponse.json({ error: 'Could not send your message.' }, { status: 500 })
  }
}
