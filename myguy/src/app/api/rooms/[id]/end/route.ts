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
    const room = await prisma.room.findUnique({ where: { id }, select: { id: true, hostId: true, roomName: true, isLive: true } })
    if (!room) return NextResponse.json({ error: 'Live not found.' }, { status: 404 })
    if (room.hostId !== userId) return NextResponse.json({ error: 'Only the host can end this live.' }, { status: 403 })
    if (!room.isLive) return NextResponse.json({ success: true })
    if (room.roomName) await getLiveKitRoomService().deleteRoom(room.roomName)

    await prisma.room.update({
      where: { id },
      data: { isLive: false, endedAt: new Date() },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (isLiveKitConfigurationError(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    console.error('Error ending live stream:', error)
    return NextResponse.json({ error: 'Could not end the live. Please try again.' }, { status: 500 })
  }
}
