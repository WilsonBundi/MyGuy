import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'
import { z } from 'zod'

const reactionSchema = z.object({
  type: z.enum(['heart', 'clap', 'laugh', 'wow'])
})

// POST /api/moments/[id]/react - React to a moment
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type } = reactionSchema.parse(await request.json())
    const moment = await prisma.moment.findFirst({
      where: { id, expiresAt: { gt: new Date() } },
      select: { id: true }
    })
    if (!moment) return NextResponse.json({ error: 'Pulse not found or expired.' }, { status: 404 })

    const existingReaction = await prisma.storyReaction.findUnique({
      where: {
        momentId_userId: {
          momentId: id,
          userId
        }
      }
    })

    if (existingReaction) {
      await prisma.storyReaction.update({
        where: { id: existingReaction.id },
        data: { type }
      })
    } else {
      // Create new reaction
      await prisma.storyReaction.create({
        data: {
          momentId: id,
          userId,
          type
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Choose a supported Pulse reaction.' }, { status: 400 })
    }
    console.error('Error reacting to moment:', error)
    return NextResponse.json({ error: 'Failed to react' }, { status: 500 })
  }
}

// DELETE /api/moments/[id]/react - Remove reaction
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const moment = await prisma.moment.findFirst({
      where: { id, expiresAt: { gt: new Date() } },
      select: { id: true }
    })
    if (!moment) return NextResponse.json({ error: 'Pulse not found or expired.' }, { status: 404 })

    await prisma.storyReaction.delete({
      where: {
        momentId_userId: {
          momentId: id,
          userId
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing reaction:', error)
    return NextResponse.json({ error: 'Failed to remove reaction' }, { status: 500 })
  }
}
