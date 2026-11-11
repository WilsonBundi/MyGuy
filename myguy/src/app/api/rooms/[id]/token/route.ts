import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'
import { createLiveKitToken, getLiveKitRoomService, getLiveKitServerUrl, isLiveKitConfigurationError } from '@/lib/livekit'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const room = await prisma.room.findUnique({
      where: { id },
      include: { host: { select: { username: true, profile: { select: { displayName: true } } } } },
    })
    if (!room || !room.isLive || !room.roomName) {
      return NextResponse.json({ error: 'This live is no longer available.' }, { status: 404 })
    }
    const activeRooms = await getLiveKitRoomService().listRooms([room.roomName])
    if (!activeRooms.length && room.hostId !== userId) {
      return NextResponse.json({ error: 'This live is no longer available.' }, { status: 404 })
    }

    const isHost = room.hostId === userId
    const existingParticipant = await prisma.roomParticipant.findUnique({
      where: { roomId_userId: { roomId: room.id, userId } },
      select: { role: true, publishingMuted: true, bannedAt: true, kickedUntil: true },
    })
    if (existingParticipant?.bannedAt || (existingParticipant?.kickedUntil && existingParticipant.kickedUntil > new Date())) {
      return NextResponse.json({ error: 'You are not able to join this live right now.' }, { status: 403 })
    }
    const role = isHost ? 'host' : existingParticipant?.role === 'speaker' ? 'speaker' : 'listener'
    const publishingMuted = existingParticipant?.publishingMuted ?? false
    await prisma.roomParticipant.upsert({
      where: { roomId_userId: { roomId: room.id, userId } },
      create: { roomId: room.id, userId, role },
      update: { role },
    })

    const participant = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, profile: { select: { displayName: true } } },
    })
    if (!participant) return NextResponse.json({ error: 'Your account could not be found.' }, { status: 404 })

    const token = await createLiveKitToken({
      identity: userId,
      name: participant.profile?.displayName || participant.username,
      roomName: room.roomName,
      canPublish: isHost || (role === 'speaker' && !publishingMuted),
    })
    return NextResponse.json({
      room: {
        id: room.id,
        name: room.name,
        description: room.description,
        category: room.category,
        type: room.type,
        isLive: room.isLive,
        hostId: room.hostId,
        host: room.host,
        viewerCount: Math.max(0, (activeRooms[0]?.numParticipants ?? 1) - 1),
        createdAt: room.createdAt,
      },
      token,
      serverUrl: getLiveKitServerUrl(),
    })
  } catch (error) {
    if (isLiveKitConfigurationError(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    console.error('Error creating live room token:', error)
    return NextResponse.json({ error: 'Could not join this live.' }, { status: 500 })
  }
}
