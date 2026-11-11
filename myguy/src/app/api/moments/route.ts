import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'

const momentSchema = z.object({
  mediaUrl: z.string().startsWith('/uploads/').optional(),
  mediaType: z.enum(['image', 'video']).optional(),
  caption: z.string().trim().max(500).optional(),
  duration: z.enum(['24h', '12h', '6h']).default('24h')
}).refine((value) => Boolean(value.caption || value.mediaUrl), {
  message: 'Add text or media before sharing a Pulse.'
}).refine((value) => Boolean(value.mediaUrl) === Boolean(value.mediaType), {
  message: 'Media URL and media type must be provided together.'
})

// GET /api/moments - Get all active public Pulse updates
export async function GET(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const moments = await prisma.moment.findMany({
      where: {
        expiresAt: {
          gte: new Date()
        }
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profile: { select: { displayName: true, avatar: true } }
          }
        },
        reactions: { select: { userId: true, type: true } },
        _count: {
          select: {
            reactions: true,
            replies: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(
      { moments, viewerId: userId },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  } catch (error) {
    console.error('Error fetching moments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch moments' },
      { status: 500 }
    )
  }
}

// POST /api/moments - Create a moment
export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = momentSchema.parse(await request.json())

    const expiresAt = new Date()
    switch (body.duration) {
      case '6h':
        expiresAt.setHours(expiresAt.getHours() + 6)
        break
      case '12h':
        expiresAt.setHours(expiresAt.getHours() + 12)
        break
      case '24h':
      default:
        expiresAt.setHours(expiresAt.getHours() + 24)
        break
    }

    const moment = await prisma.moment.create({
      data: {
        mediaUrl: body.mediaUrl,
        mediaType: body.mediaType,
        caption: body.caption,
        authorId: userId,
        expiresAt
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profile: { select: { displayName: true, avatar: true } }
          }
        },
        reactions: { select: { userId: true, type: true } },
        _count: {
          select: {
            reactions: true,
            replies: true
          }
        }
      }
    })

    return NextResponse.json({ moment }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid Pulse content', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating moment:', error)
    return NextResponse.json(
      { error: 'Failed to create moment' },
      { status: 500 }
    )
  }
}
