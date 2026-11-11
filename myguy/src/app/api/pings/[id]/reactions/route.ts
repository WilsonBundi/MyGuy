import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const reactionSchema = z.object({
  reactionType: z.enum(['love', 'funny', 'fire', 'insight', 'respect', 'wow'])
})

// GET /api/pings/[id]/reactions - Get reactions for a ping
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const reactions = await prisma.reaction.findMany({
      where: { pingId: id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Group by reaction type
    const grouped = reactions.reduce((acc, reaction) => {
      const type = reaction.reactionType
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(reaction)
      return acc
    }, {} as Record<string, typeof reactions>)

    return NextResponse.json({ reactions: grouped })
  } catch (error) {
    console.error('Error fetching reactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reactions' },
      { status: 500 }
    )
  }
}

// POST /api/pings/[id]/reactions - Add a reaction to a ping
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { reactionType } = reactionSchema.parse(body)

    // Check if user already has this reaction
    const existingReaction = await prisma.reaction.findUnique({
      where: {
        userId_pingId_reactionType: {
          userId: session.user.id,
          pingId: id,
          reactionType
        }
      }
    })

    if (existingReaction) {
      // Remove reaction (toggle off)
      await prisma.reaction.delete({
        where: { id: existingReaction.id }
      })
      return NextResponse.json({ reacted: false, reactionType })
    } else {
      // Add reaction
      const reaction = await prisma.reaction.create({
        data: {
          userId: session.user.id,
          pingId: id,
          reactionType
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profile: true
            }
          }
        }
      })
      return NextResponse.json({ reacted: true, reaction, reactionType })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating reaction:', error)
    return NextResponse.json(
      { error: 'Failed to create reaction' },
      { status: 500 }
    )
  }
}
