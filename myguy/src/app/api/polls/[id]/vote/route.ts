import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/polls/[id]/vote - Vote on a poll
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { optionId } = body

    // Check if already voted
    const existingVote = await prisma.pollVote.findUnique({
      where: {
        optionId_userId: {
          optionId,
          userId: session.user.id
        }
      }
    })

    if (existingVote) {
      return NextResponse.json({ error: 'Already voted' }, { status: 400 })
    }

    // Create vote and increment count
    await prisma.$transaction([
      prisma.pollVote.create({
        data: {
          optionId,
          userId: session.user.id
        }
      }),
      prisma.pollOption.update({
        where: { id: optionId },
        data: { votes: { increment: 1 } }
      })
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error voting on poll:', error)
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 })
  }
}
