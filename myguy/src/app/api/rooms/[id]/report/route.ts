import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'

const reportSchema = z.object({
  targetId: z.string().min(1),
  reason: z.enum(['harassment', 'hate', 'spam', 'unsafe', 'other']),
  description: z.string().trim().max(500).optional(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const parsed = reportSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'Choose a report reason.' }, { status: 400 })
    if (parsed.data.targetId === userId) return NextResponse.json({ error: 'You cannot report yourself.' }, { status: 400 })
    const [room, target, participant] = await Promise.all([
      prisma.room.findUnique({ where: { id }, select: { isLive: true } }),
      prisma.user.findUnique({ where: { id: parsed.data.targetId }, select: { id: true } }),
      prisma.roomParticipant.findUnique({
        where: { roomId_userId: { roomId: id, userId } },
        select: { id: true },
      }),
    ])
    if (!room?.isLive || !target) return NextResponse.json({ error: 'This report cannot be submitted.' }, { status: 404 })
    if (!participant) return NextResponse.json({ error: 'Join the live before reporting a participant.' }, { status: 403 })
    await prisma.report.create({
      data: {
        reporterId: userId,
        reportedId: target.id,
        reason: `live_${parsed.data.reason}`,
        description: parsed.data.description || `Reported from live room ${id}.`,
      },
    })
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Error reporting live participant:', error)
    return NextResponse.json({ error: 'Could not submit the report.' }, { status: 500 })
  }
}
