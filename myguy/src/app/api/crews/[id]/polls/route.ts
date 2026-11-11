import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'

const pollSchema = z.object({
  question: z.string().trim().min(1).max(200),
  options: z.array(z.string().trim().min(1).max(100)).min(2).max(6),
  allowsMultiple: z.boolean().default(false),
  endsAt: z.string().datetime().optional()
}).refine((poll) => new Set(poll.options.map((option) => option.toLowerCase())).size === poll.options.length, {
  message: 'Poll choices must be unique.'
}).refine((poll) => !poll.endsAt || new Date(poll.endsAt) > new Date(), {
  message: 'Poll closing time must be in the future.'
})

async function isCrewMember(chatId: string, userId: string) {
  const member = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId, userId } },
    select: { chat: { select: { isGroup: true } } }
  })
  return member?.chat.isGroup === true
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    if (!await isCrewMember(id, userId)) return NextResponse.json({ error: 'Crew not found' }, { status: 404 })
    const polls = await prisma.crewPoll.findMany({
      where: { chatId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { id: true, username: true, profile: { select: { displayName: true } } } },
        options: {
          select: { id: true, text: true, votes: { select: { userId: true } } }
        }
      }
    })
    return NextResponse.json({
      polls: polls.map(({ options, ...poll }) => ({
        ...poll,
        options: options.map(({ votes, ...option }) => ({
          ...option,
          voteCount: votes.length,
          votedByMe: votes.some((vote) => vote.userId === userId)
        }))
      }))
    })
  } catch (error) {
    console.error('Error fetching Crew polls:', error)
    return NextResponse.json({ error: 'Failed to fetch Crew polls' }, { status: 500 })
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
    if (!await isCrewMember(id, userId)) return NextResponse.json({ error: 'Crew not found' }, { status: 404 })
    const parsed = pollSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'Add a question and at least two unique choices.' }, { status: 400 })
    const poll = await prisma.crewPoll.create({
      data: {
        chatId: id,
        creatorId: userId,
        question: parsed.data.question,
        allowsMultiple: parsed.data.allowsMultiple,
        endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
        options: { create: parsed.data.options.map((text) => ({ text })) }
      },
      include: { options: { select: { id: true, text: true } } }
    })
    return NextResponse.json({
      poll: { ...poll, options: poll.options.map((option) => ({ ...option, voteCount: 0, votedByMe: false })) }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating Crew poll:', error)
    return NextResponse.json({ error: 'Failed to create Crew poll' }, { status: 500 })
  }
}
