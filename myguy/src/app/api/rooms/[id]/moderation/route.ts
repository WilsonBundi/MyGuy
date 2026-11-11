import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'
import { getLiveKitRoomService, isLiveKitConfigurationError } from '@/lib/livekit'

const moderationSchema = z.object({
  action: z.enum([
    'mute_audio',
    'unmute_audio',
    'kick',
    'ban',
    'unban',
    'mute_chat',
    'unmute_chat',
    'delete_message',
    'chat_on',
    'chat_off',
  ]),
  targetId: z.string().min(1).optional(),
  messageId: z.string().min(1).optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const room = await prisma.room.findUnique({
      where: { id },
      select: { hostId: true, isLive: true, roomName: true, chatEnabled: true },
    })
    if (!room?.isLive || !room.roomName) {
      return NextResponse.json({ error: 'This live is no longer available.' }, { status: 404 })
    }
    if (room.hostId !== userId) {
      return NextResponse.json({ error: 'Only the host can view moderation tools.' }, { status: 403 })
    }

    const liveParticipants = await getLiveKitRoomService().listParticipants(room.roomName)
    const activeIds = liveParticipants.map((participant) => participant.identity)
    const participants = activeIds.length
      ? await prisma.roomParticipant.findMany({
          where: { roomId: id, userId: { in: activeIds } },
          include: {
            user: { select: { id: true, username: true, profile: { select: { displayName: true, avatar: true } } } },
          },
          orderBy: { joinedAt: 'asc' },
        })
      : []
    const bannedParticipants = await prisma.roomParticipant.findMany({
      where: { roomId: id, bannedAt: { not: null } },
      include: {
        user: { select: { id: true, username: true, profile: { select: { displayName: true, avatar: true } } } },
      },
      orderBy: { bannedAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({
      chatEnabled: room.chatEnabled,
      participants: participants.map((participant) => ({
        id: participant.userId,
        role: participant.role,
        publishingMuted: participant.publishingMuted,
        chatMutedUntil: participant.chatMutedUntil,
        user: participant.user,
      })),
      bannedParticipants: bannedParticipants.map((participant) => ({
        id: participant.userId,
        role: participant.role,
        publishingMuted: participant.publishingMuted,
        chatMutedUntil: participant.chatMutedUntil,
        user: participant.user,
      })),
    })
  } catch (error) {
    if (isLiveKitConfigurationError(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    console.error('Error loading live moderation tools:', error)
    return NextResponse.json({ error: 'Could not load moderation tools.' }, { status: 500 })
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
    const parsed = moderationSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'Invalid moderation action.' }, { status: 400 })
    const { action, targetId, messageId } = parsed.data
    const room = await prisma.room.findUnique({
      where: { id },
      select: { hostId: true, isLive: true, roomName: true },
    })
    if (!room?.isLive || !room.roomName) {
      return NextResponse.json({ error: 'This live is no longer available.' }, { status: 404 })
    }
    if (room.hostId !== userId) {
      return NextResponse.json({ error: 'Only the host can moderate this live.' }, { status: 403 })
    }

    let target: string | null = null
    const liveKit = getLiveKitRoomService()
    const activeRooms = await liveKit.listRooms([room.roomName])
    const liveParticipants = activeRooms.length ? await liveKit.listParticipants(room.roomName) : []
    const isActive = (idToCheck: string) => liveParticipants.some((participant) => participant.identity === idToCheck)

    if (action === 'chat_on' || action === 'chat_off') {
      await prisma.room.update({ where: { id }, data: { chatEnabled: action === 'chat_on' } })
    } else if (action === 'delete_message') {
      if (!messageId) return NextResponse.json({ error: 'Choose a message to remove.' }, { status: 400 })
      const message = await prisma.roomMessage.findFirst({ where: { id: messageId, roomId: id }, select: { userId: true } })
      if (!message) return NextResponse.json({ error: 'Message not found.' }, { status: 404 })
      await prisma.roomMessage.delete({ where: { id: messageId } })
      target = message.userId
    } else {
      if (!targetId) return NextResponse.json({ error: 'Choose a participant.' }, { status: 400 })
      if (targetId === room.hostId) return NextResponse.json({ error: 'The host cannot moderate themselves.' }, { status: 400 })
      const targetUser = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } })
      if (!targetUser) return NextResponse.json({ error: 'Participant not found.' }, { status: 404 })
      target = targetId

      if (action === 'mute_audio' || action === 'unmute_audio') {
        const participant = await prisma.roomParticipant.findUnique({
          where: { roomId_userId: { roomId: id, userId: targetId } },
          select: { role: true },
        })
        if (!participant || participant.role !== 'speaker') {
          return NextResponse.json({ error: 'Only a co-host can be muted on stage.' }, { status: 400 })
        }
        const publishingMuted = action === 'mute_audio'
        await prisma.roomParticipant.update({
          where: { roomId_userId: { roomId: id, userId: targetId } },
          data: { publishingMuted },
        })
        if (isActive(targetId)) {
          await liveKit.updateParticipant(room.roomName, targetId, {
            permission: {
              canPublish: !publishingMuted,
              canPublishData: true,
              canSubscribe: true,
            },
          })
        }
      } else if (action === 'mute_chat' || action === 'unmute_chat') {
        const participant = await prisma.roomParticipant.findUnique({
          where: { roomId_userId: { roomId: id, userId: targetId } },
          select: { id: true },
        })
        if (!participant) return NextResponse.json({ error: 'Participant has not joined this live.' }, { status: 404 })
        await prisma.roomParticipant.update({
          where: { roomId_userId: { roomId: id, userId: targetId } },
          data: { chatMutedUntil: action === 'mute_chat' ? new Date(Date.now() + 15 * 60 * 1000) : null },
        })
      } else if (action === 'kick') {
        await prisma.roomParticipant.upsert({
          where: { roomId_userId: { roomId: id, userId: targetId } },
          create: { roomId: id, userId: targetId, kickedUntil: new Date(Date.now() + 60 * 1000) },
          update: { kickedUntil: new Date(Date.now() + 60 * 1000), role: 'listener' },
        })
        if (isActive(targetId)) await liveKit.removeParticipant(room.roomName, targetId)
      } else if (action === 'ban') {
        await prisma.roomParticipant.upsert({
          where: { roomId_userId: { roomId: id, userId: targetId } },
          create: { roomId: id, userId: targetId, bannedAt: new Date() },
          update: { bannedAt: new Date(), role: 'listener' },
        })
        if (isActive(targetId)) await liveKit.removeParticipant(room.roomName, targetId)
      } else if (action === 'unban') {
        await prisma.roomParticipant.updateMany({
          where: { roomId: id, userId: targetId },
          data: { bannedAt: null, kickedUntil: null },
        })
      }
    }

    await prisma.roomModerationAction.create({
      data: {
        roomId: id,
        actorId: userId,
        targetId: target,
        action,
      },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (isLiveKitConfigurationError(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    console.error('Error applying live moderation action:', error)
    return NextResponse.json({ error: 'Could not apply the moderation action.' }, { status: 500 })
  }
}
