import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { createLiveKitToken, getLiveKitRoomService, getLiveKitServerUrl, isLiveKitConfigurationError } from '@/lib/livekit'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'

const roomSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().max(500).optional(),
  category: z.string().trim().max(40).optional(),
  type: z.enum(['audio', 'video']).default('video')
})

// GET /api/rooms - Get all rooms
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const liveOnly = searchParams.get('live') === 'true'

    const rooms = await prisma.room.findMany({
      where: liveOnly ? { isLive: true, roomName: { not: null } } : undefined,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            profile: true
          }
        },
        _count: {
          select: {
            participants: true
          }
        }
      }
    })

    const liveRooms = rooms.filter((room) => room.isLive && room.roomName)
    const activeRooms = liveRooms.length
      ? await getLiveKitRoomService().listRooms(liveRooms.map((room) => room.roomName!))
      : []
    const activeByName = new Map(activeRooms.map((room) => [room.name, room.numParticipants]))
    const visibleRooms = liveOnly
      ? rooms.filter((room) => room.roomName && activeByName.has(room.roomName))
      : rooms
    return NextResponse.json({
      rooms: visibleRooms.map((room) => ({
        ...room,
        viewerCount: room.roomName
          ? Math.max(0, (activeByName.get(room.roomName) ?? 0) - 1)
          : 0,
      })),
    })
  } catch (error) {
    if (isLiveKitConfigurationError(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    console.error('Error fetching rooms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    )
  }
}

// POST /api/rooms - Create a room
export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, type, category } = roomSchema.parse(body)
    const roomName = `myguy-${randomUUID()}`
    const [host, liveKitServerUrl] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { username: true, profile: { select: { displayName: true } } },
      }),
      Promise.resolve(getLiveKitServerUrl()),
    ])
    if (!host) return NextResponse.json({ error: 'Your account could not be found.' }, { status: 404 })

    const room = await prisma.room.create({
      data: {
        name,
        description,
        category,
        type,
        hostId: userId,
        roomName,
        isLive: true,
        participants: { create: { userId, role: 'host' } },
      },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            profile: true
          }
        },
        _count: {
          select: {
            participants: true
          }
        }
      }
    })

    const token = await createLiveKitToken({
      identity: userId,
      name: host.profile?.displayName || host.username,
      roomName,
      canPublish: true,
    })
    return NextResponse.json({
      room: { ...room, viewerCount: 0 },
      token,
      serverUrl: liveKitServerUrl,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    if (isLiveKitConfigurationError(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    console.error('Error creating room:', error)
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    )
  }
}
