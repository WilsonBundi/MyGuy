import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'
import { getLiveKitRoomService, isLiveKitConfigurationError } from '@/lib/livekit'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const room = await prisma.room.findUnique({ where: { id }, select: { hostId: true, roomName: true, isLive: true } })
    if (!room) return NextResponse.json({ success: true })
    if (room.hostId === userId) {
      return NextResponse.json({ error: 'The host must end the live instead of leaving it.' }, { status: 400 })
    }
    if (room.isLive && room.roomName) {
      const liveKit = getLiveKitRoomService()
      const activeRooms = await liveKit.listRooms([room.roomName])
      if (activeRooms.length) {
        const participants = await liveKit.listParticipants(room.roomName)
        if (participants.some((participant) => participant.identity === userId)) {
          await liveKit.removeParticipant(room.roomName, userId)
        }
      }
    }
    await prisma.roomParticipant.deleteMany({ where: { roomId: id, userId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (isLiveKitConfigurationError(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    console.error('Error leaving live stream:', error)
    return NextResponse.json({ error: 'Could not leave the live.' }, { status: 500 })
  }
}
