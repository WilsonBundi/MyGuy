import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'

const eventSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
  location: z.string().trim().max(200).optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional()
}).refine((event) => !event.endTime || new Date(event.endTime) > new Date(event.startTime), {
  message: 'Event end must be after its start.'
})

async function getCrewMember(chatId: string, userId: string) {
  const member = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId, userId } },
    select: { id: true, chat: { select: { isGroup: true } } }
  })
  return member?.chat.isGroup ? member : null
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    if (!await getCrewMember(id, userId)) return NextResponse.json({ error: 'Crew not found' }, { status: 404 })
    const events = await prisma.crewEvent.findMany({
      where: { chatId: id },
      orderBy: { startTime: 'asc' },
      include: {
        creator: { select: { id: true, username: true, profile: { select: { displayName: true } } } },
        attendees: { select: { userId: true, status: true } }
      }
    })
    return NextResponse.json({
      events: events.map(({ attendees, ...event }) => ({
        ...event,
        attendeeCount: attendees.filter((attendee) => attendee.status === 'going').length,
        myStatus: attendees.find((attendee) => attendee.userId === userId)?.status ?? null
      }))
    })
  } catch (error) {
    console.error('Error fetching Crew events:', error)
    return NextResponse.json({ error: 'Failed to fetch Crew events' }, { status: 500 })
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
    if (!await getCrewMember(id, userId)) return NextResponse.json({ error: 'Crew not found' }, { status: 404 })
    const parsed = eventSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'Enter an event name and valid start/end times.' }, { status: 400 })
    const event = await prisma.crewEvent.create({
      data: {
        chatId: id,
        creatorId: userId,
        name: parsed.data.name,
        description: parsed.data.description || null,
        location: parsed.data.location || null,
        startTime: new Date(parsed.data.startTime),
        endTime: parsed.data.endTime ? new Date(parsed.data.endTime) : null
      },
      include: { attendees: { select: { userId: true, status: true } } }
    })
    return NextResponse.json({ event: { ...event, attendeeCount: 0, myStatus: null } }, { status: 201 })
  } catch (error) {
    console.error('Error creating Crew event:', error)
    return NextResponse.json({ error: 'Failed to create Crew event' }, { status: 500 })
  }
}
