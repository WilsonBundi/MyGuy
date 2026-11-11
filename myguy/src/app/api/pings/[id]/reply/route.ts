import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const replySchema = z.object({
  content: z.string().min(1).max(500),
  mediaUrl: z.string().optional(),
  mediaUrls: z.array(z.string()).optional()
})

// POST /api/pings/[id]/reply - Reply to a ping (thread)
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
    const { content, mediaUrl, mediaUrls } = replySchema.parse(body)

    // Check if original ping exists
    const originalPing = await prisma.ping.findUnique({
      where: { id: id }
    })

    if (!originalPing) {
      return NextResponse.json({ error: 'Ping not found' }, { status: 404 })
    }

    // Create reply with threadId pointing to original
    const reply = await prisma.ping.create({
      data: {
        content,
        mediaUrls: mediaUrls ?? (mediaUrl ? [mediaUrl] : []),
        authorId: session.user.id,
        threadId: originalPing.threadId || originalPing.id
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profile: true
          }
        }
      }
    })

    return NextResponse.json({ reply }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Error creating reply:', error)
    return NextResponse.json({ error: 'Failed to create reply' }, { status: 500 })
  }
}

// GET /api/pings/[id]/thread - Get thread replies
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const replies = await prisma.ping.findMany({
      where: {
        threadId: id,
        id: { not: id } // Exclude the original ping
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profile: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    })

    return NextResponse.json({ replies })
  } catch (error) {
    console.error('Error fetching thread:', error)
    return NextResponse.json({ error: 'Failed to fetch thread' }, { status: 500 })
  }
}
