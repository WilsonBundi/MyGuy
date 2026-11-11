import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'

// GET /api/pings - Get all pings (public access for mobile app)
export async function GET(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request)
    const pings = await prisma.ping.findMany({
      where: {
        isDraft: false,
        isArchived: false,
        scheduledAt: null
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                avatar: true
              }
            }
          }
        },
        likes: { select: { userId: true } },
        comments: { select: { id: true } },
        shares: { select: { id: true } }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(
      { pings, viewerId: userId },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  } catch (error) {
    console.error('Error fetching pings:', error)
    return NextResponse.json({ error: 'Failed to fetch pings' }, { status: 500 })
  }
}

// POST /api/pings - Create a new ping
export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const content = typeof body.content === 'string' ? body.content.trim() : ''
    const mediaUrls = Array.isArray(body.mediaUrls)
      ? body.mediaUrls.filter((value: unknown): value is string => typeof value === 'string')
      : []
    if (!content && mediaUrls.length === 0) {
      return NextResponse.json({ error: 'Add text or media before sharing' }, { status: 400 })
    }
    if (content.length > 5000 || mediaUrls.length > 1 ||
      mediaUrls.some((url: string) => !url.startsWith('/uploads/'))) {
      return NextResponse.json({ error: 'Invalid Ping content or media' }, { status: 400 })
    }

    const ping = await prisma.ping.create({
      data: {
        content,
        mediaUrls,
        authorId: userId
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                avatar: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ ping }, { status: 201 })
  } catch (error) {
    console.error('Error creating ping:', error)
    return NextResponse.json({ error: 'Failed to create ping' }, { status: 500 })
  }
}
