import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'
import { getLiveKitRoomService, isLiveKitConfigurationError } from '@/lib/livekit'

const guestActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('request') }),
  z.object({ action: z.literal('invite'), username: z.string().trim().min(1).max(30) }),
  z.object({ action: z.literal('accept'), requestId: z.string().min(1) }),
  z.object({ action: z.literal('decline'), requestId: z.string().min(1) }),
  z.object({ action: z.literal('remove'), userId: z.string().min(1) }),
])

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
      select: { hostId: true, isLive: true, roomName: true },
    })
    if (!room?.isLive || !room.roomName) {
      return NextResponse.json({ error: 'This live is no longer available.' }, { status: 404 })
    }

    const isHost = room.hostId === userId
    const [requests, speakers, mine] = await Promise.all([
      isHost
        ? prisma.roomGuestRequest.findMany({
            where: { roomId: id, status: { in: ['pending', 'invited'] } },
            orderBy: { createdAt: 'asc' },
            include: { user: { select: { id: true, username: true, profile: { select: { displayName: true, avatar: true } } } } },
          })
        : Promise.resolve([]),
      prisma.roomParticipant.findMany({
        where: { roomId: id, role: 'speaker', bannedAt: null },
        include: { user: { select: { id: true, username: true, profile: { select: { displayName: true, avatar: true } } } } },
      }),
      prisma.roomGuestRequest.findUnique({
        where: { roomId_userId: { roomId: id, userId } },
        select: { id: true, status: true },
      }),
    ])

    return NextResponse.json({ requests, speakers, myRequest: mine })
  } catch (error) {
    if (isLiveKitConfigurationError(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    console.error('Error loading live guest requests:', error)
    return NextResponse.json({ error: 'Could not load guest requests.' }, { status: 500 })
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
    const parsed = guestActionSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'Invalid guest request.' }, { status: 400 })
    const data = parsed.data
    const room = await prisma.room.findUnique({
      where: { id },
      select: { hostId: true, isLive: true, roomName: true },
    })
    if (!room?.isLive || !room.roomName) {
      return NextResponse.json({ error: 'This live is no longer available.' }, { status: 404 })
    }
    const liveKit = getLiveKitRoomService()

    if (data.action === 'request') {
      if (room.hostId === userId) return NextResponse.json({ error: 'The host is already on stage.' }, { status: 400 })
      const [participant, liveParticipants] = await Promise.all([
        prisma.roomParticipant.findUnique({
          where: { roomId_userId: { roomId: id, userId } },
          select: { role: true, bannedAt: true, kickedUntil: true },
        }),
        liveKit.listParticipants(room.roomName),
      ])
      if (participant?.bannedAt || (participant?.kickedUntil && participant.kickedUntil > new Date())) {
        return NextResponse.json({ error: 'You cannot request a stage spot right now.' }, { status: 403 })
      }
      if (!participant || !liveParticipants.some((entry) => entry.identity === userId)) {
        return NextResponse.json({ error: 'Join the live before requesting a stage spot.' }, { status: 403 })
      }
      if (participant.role === 'speaker') {
        return NextResponse.json({ error: 'You are already on stage.' }, { status: 409 })
      }
      const guestRequest = await prisma.roomGuestRequest.upsert({
        where: { roomId_userId: { roomId: id, userId } },
        create: { roomId: id, userId, status: 'pending' },
        update: { status: 'pending' },
      })
      return NextResponse.json({ request: guestRequest }, { status: 201 })
    }

    if (data.action === 'invite') {
      if (room.hostId !== userId) return NextResponse.json({ error: 'Only the host can invite guests.' }, { status: 403 })
      const guest = await prisma.user.findUnique({
        where: { username: data.username },
        select: { id: true },
      })
      if (!guest) return NextResponse.json({ error: 'That MyGuy username was not found.' }, { status: 404 })
      if (guest.id === userId) return NextResponse.json({ error: 'You are already hosting.' }, { status: 400 })
      const guestRequest = await prisma.$transaction(async (tx) => {
        const invite = await tx.roomGuestRequest.upsert({
          where: { roomId_userId: { roomId: id, userId: guest.id } },
          create: { roomId: id, userId: guest.id, status: 'invited' },
          update: { status: 'invited' },
        })
        await tx.notification.create({
          data: {
            userId: guest.id,
            type: 'live_invite',
            title: 'You have a live stage invite',
            body: 'A MyGuy host invited you to join their live stage.',
            link: `/live?roomId=${encodeURIComponent(id)}`,
          },
        })
        return invite
      })
      return NextResponse.json({ request: guestRequest }, { status: 201 })
    }

    if (data.action === 'accept' || data.action === 'decline') {
      const guestRequest = await prisma.roomGuestRequest.findUnique({
        where: { id: data.requestId },
        select: { id: true, roomId: true, userId: true, status: true },
      })
      if (!guestRequest || guestRequest.roomId !== id) {
        return NextResponse.json({ error: 'Guest request not found.' }, { status: 404 })
      }

      if (data.action === 'decline') {
        if (guestRequest.userId !== userId && room.hostId !== userId) {
          return NextResponse.json({ error: 'You cannot decline this request.' }, { status: 403 })
        }
        await prisma.roomGuestRequest.update({ where: { id: guestRequest.id }, data: { status: 'declined' } })
        return NextResponse.json({ success: true })
      }

      if (guestRequest.userId !== userId || !['pending', 'invited'].includes(guestRequest.status)) {
        return NextResponse.json({ error: 'This guest request cannot be accepted.' }, { status: 403 })
      }
      const [participant, liveParticipants] = await Promise.all([
        prisma.roomParticipant.findUnique({
          where: { roomId_userId: { roomId: id, userId } },
          select: { bannedAt: true, kickedUntil: true },
        }),
        liveKit.listParticipants(room.roomName),
      ])
      if (!participant || participant.bannedAt || (participant.kickedUntil && participant.kickedUntil > new Date())) {
        return NextResponse.json({ error: 'You cannot join the stage right now.' }, { status: 403 })
      }
      if (!liveParticipants.some((entry) => entry.identity === userId)) {
        return NextResponse.json({ error: 'Rejoin the live before accepting the stage invite.' }, { status: 403 })
      }

      try {
        await prisma.$transaction(async (tx) => {
          const speakerCount = await tx.roomParticipant.count({
            where: { roomId: id, role: 'speaker', bannedAt: null },
          })
          if (speakerCount >= 3) throw new Error('STAGE_FULL')
          await tx.roomParticipant.update({
            where: { roomId_userId: { roomId: id, userId } },
            data: { role: 'speaker', publishingMuted: false },
          })
          await tx.roomGuestRequest.update({ where: { id: guestRequest.id }, data: { status: 'accepted' } })
        }, { isolationLevel: 'Serializable' })
      } catch (transactionError) {
        if (transactionError instanceof Error && transactionError.message === 'STAGE_FULL') {
          return NextResponse.json({ error: 'The stage is full. MyGuy supports three guests at a time.' }, { status: 409 })
        }
        if (transactionError && typeof transactionError === 'object' && 'code' in transactionError && transactionError.code === 'P2034') {
          return NextResponse.json({ error: 'The stage changed while accepting. Please try again.' }, { status: 409 })
        }
        throw transactionError
      }

      try {
        await liveKit.updateParticipant(room.roomName, userId, {
          permission: { canPublish: true, canPublishData: true, canSubscribe: true },
        })
      } catch (permissionError) {
        await prisma.$transaction([
          prisma.roomParticipant.update({
            where: { roomId_userId: { roomId: id, userId } },
            data: { role: 'listener' },
          }),
          prisma.roomGuestRequest.update({ where: { id: guestRequest.id }, data: { status: 'pending' } }),
        ])
        throw permissionError
      }
      return NextResponse.json({ success: true })
    }

    if (room.hostId !== userId) return NextResponse.json({ error: 'Only the host can remove a guest.' }, { status: 403 })
    if (data.userId === room.hostId) return NextResponse.json({ error: 'The host cannot be removed from the stage.' }, { status: 400 })
    const activeRooms = await liveKit.listRooms([room.roomName])
    if (activeRooms.length) {
      const liveParticipants = await liveKit.listParticipants(room.roomName)
      if (liveParticipants.some((entry) => entry.identity === data.userId)) {
        await liveKit.removeParticipant(room.roomName, data.userId)
      }
    }
    await prisma.$transaction([
      prisma.roomParticipant.updateMany({
        where: { roomId: id, userId: data.userId },
        data: { role: 'listener', publishingMuted: false },
      }),
      prisma.roomGuestRequest.updateMany({
        where: { roomId: id, userId: data.userId },
        data: { status: 'declined' },
      }),
    ])
    return NextResponse.json({ success: true })
  } catch (error) {
    if (isLiveKitConfigurationError(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    console.error('Error updating live guest request:', error)
    return NextResponse.json({ error: 'Could not update the guest request.' }, { status: 500 })
  }
}
