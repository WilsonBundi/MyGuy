import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'
import { getLiveKitRoomService, isLiveKitConfigurationError } from '@/lib/livekit'

const giftCosts = { heart: 5, spark: 10, star: 25 } as const
const giftSchema = z.object({ giftType: z.enum(['heart', 'spark', 'star']) })

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const parsed = giftSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'Choose a valid live gift.' }, { status: 400 })
    const room = await prisma.room.findUnique({
      where: { id },
      select: { hostId: true, isLive: true, roomName: true },
    })
    if (!room?.isLive || !room.roomName) {
      return NextResponse.json({ error: 'This live is no longer available.' }, { status: 404 })
    }
    if (room.hostId === userId) return NextResponse.json({ error: 'You cannot send a gift to yourself.' }, { status: 400 })
    const participant = await prisma.roomParticipant.findUnique({
      where: { roomId_userId: { roomId: id, userId } },
      select: { bannedAt: true, kickedUntil: true },
    })
    if (!participant || participant.bannedAt || (participant.kickedUntil && participant.kickedUntil > new Date())) {
      return NextResponse.json({ error: 'Join this live before sending a gift.' }, { status: 403 })
    }
    const activeParticipants = await getLiveKitRoomService().listParticipants(room.roomName)
    if (!activeParticipants.some((entry) => entry.identity === userId)) {
      return NextResponse.json({ error: 'Join this live before sending a gift.' }, { status: 403 })
    }

    const coins = giftCosts[parsed.data.giftType]
    const result = await prisma.$transaction(async (tx) => {
      await tx.giftWallet.upsert({
        where: { userId },
        create: { userId },
        update: {},
      })
      const debit = await tx.giftWallet.updateMany({
        where: { userId, balance: { gte: coins } },
        data: { balance: { decrement: coins } },
      })
      if (!debit.count) throw new Error('INSUFFICIENT_COINS')
      const gift = await tx.roomGift.create({
        data: { roomId: id, senderId: userId, giftType: parsed.data.giftType, coins },
      })
      const emoji = parsed.data.giftType === 'heart' ? '💚' : parsed.data.giftType === 'spark' ? '✨' : '⭐'
      const message = await tx.roomMessage.create({
        data: {
          roomId: id,
          userId,
          content: `${emoji} sent a ${parsed.data.giftType} gift`,
        },
        include: {
          user: { select: { id: true, username: true, profile: { select: { displayName: true, avatar: true } } } },
        },
      })
      await tx.coinLedgerEntry.create({
        data: { userId, amount: -coins, reason: 'live_gift', reference: gift.id },
      })
      const wallet = await tx.giftWallet.findUniqueOrThrow({ where: { userId }, select: { balance: true } })
      return { gift, message, balance: wallet.balance }
    })
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'INSUFFICIENT_COINS') {
      return NextResponse.json({ error: 'You need more coins to send that gift.' }, { status: 402 })
    }
    if (isLiveKitConfigurationError(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    console.error('Error sending live gift:', error)
    return NextResponse.json({ error: 'Could not send that gift.' }, { status: 500 })
  }
}
