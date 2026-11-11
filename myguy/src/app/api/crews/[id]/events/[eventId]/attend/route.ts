import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'

const attendanceSchema = z.object({
  status: z.enum(['going', 'interested', 'not_going'])
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id, eventId } = await params
    const membership = await prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId: id, userId } },
      select: { chat: { select: { isGroup: true } } }
    })
    if (!membership?.chat.isGroup) return NextResponse.json({ error: 'Crew not found' }, { status: 404 })
    const parsed = attendanceSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'Choose a valid event response.' }, { status: 400 })
    const event = await prisma.crewEvent.findFirst({
      where: { id: eventId, chatId: id },
      select: { id: true }
    })
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    const attendance = await prisma.crewEventAttendance.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: { eventId, userId, status: parsed.data.status },
      update: { status: parsed.data.status }
    })
    return NextResponse.json({ attendance })
  } catch (error) {
    console.error('Error updating Crew event response:', error)
    return NextResponse.json({ error: 'Failed to update event response' }, { status: 500 })
  }
}
