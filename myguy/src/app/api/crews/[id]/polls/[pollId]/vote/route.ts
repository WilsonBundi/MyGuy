import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'

const voteSchema = z.object({
  optionIds: z.array(z.string().min(1)).max(6)
}).refine((vote) => new Set(vote.optionIds).size === vote.optionIds.length, {
  message: 'Each poll choice can only be selected once.'
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; pollId: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id, pollId } = await params
    const membership = await prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId: id, userId } },
      select: { chat: { select: { isGroup: true } } }
    })
    if (!membership?.chat.isGroup) return NextResponse.json({ error: 'Crew not found' }, { status: 404 })
    const parsed = voteSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'Choose valid poll options.' }, { status: 400 })
    const poll = await prisma.crewPoll.findFirst({
      where: { id: pollId, chatId: id },
      include: { options: { select: { id: true } } }
    })
    if (!poll) return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    if (poll.endsAt && poll.endsAt <= new Date()) return NextResponse.json({ error: 'This poll has closed.' }, { status: 409 })
    if (!poll.allowsMultiple && parsed.data.optionIds.length > 1) {
      return NextResponse.json({ error: 'Choose one option for this poll.' }, { status: 400 })
    }
    const allowedIds = new Set(poll.options.map((option) => option.id))
    if (parsed.data.optionIds.some((optionId) => !allowedIds.has(optionId))) {
      return NextResponse.json({ error: 'One or more choices do not belong to this poll.' }, { status: 400 })
    }
    await prisma.$transaction(async (tx) => {
      await tx.crewPollVote.deleteMany({
        where: { userId, option: { pollId } }
      })
      if (parsed.data.optionIds.length) {
        await tx.crewPollVote.createMany({
          data: parsed.data.optionIds.map((optionId) => ({ optionId, userId }))
        })
      }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error recording Crew poll vote:', error)
    return NextResponse.json({ error: 'Failed to record poll vote' }, { status: 500 })
  }
}
