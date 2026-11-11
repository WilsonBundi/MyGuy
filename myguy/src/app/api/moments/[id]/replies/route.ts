import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'

const replySchema = z.object({
  content: z.string().trim().min(1).max(500)
})

// POST /api/moments/[id]/reply - Reply to a moment
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

    const body = await request.json()
    const { content } = replySchema.parse(body)
    const moment = await prisma.moment.findFirst({
      where: { id, expiresAt: { gt: new Date() } },
      select: { id: true }
    })
    if (!moment) return NextResponse.json({ error: 'Pulse not found or expired.' }, { status: 404 })

    const reply = await prisma.storyReply.create({
      data: {
        momentId: id,
        userId,
        content
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: { select: { displayName: true, avatar: true } }
          }
        }
      }
    })

    return NextResponse.json({ reply }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Error replying to moment:', error)
    return NextResponse.json({ error: 'Failed to reply' }, { status: 500 })
  }
}

// GET /api/moments/[id]/replies - Get replies to a moment
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const requestedLimit = Number.parseInt(searchParams.get('limit') || '20', 10)
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 20
    const moment = await prisma.moment.findFirst({
      where: { id, expiresAt: { gt: new Date() } },
      select: { id: true }
    })
    if (!moment) return NextResponse.json({ error: 'Pulse not found or expired.' }, { status: 404 })

    const replies = await prisma.storyReply.findMany({
      where: { momentId: id },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: { select: { displayName: true, avatar: true } }
          }
        }
      }
    })

    return NextResponse.json({ replies })
  } catch (error) {
    console.error('Error fetching replies:', error)
    return NextResponse.json({ error: 'Failed to fetch replies' }, { status: 500 })
  }
}
