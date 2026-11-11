import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/search?q=query&type=users|pings|circles
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = (searchParams.get('q') || '').trim()
    const type = searchParams.get('type') || 'all'

    if (!query) {
      return NextResponse.json({ users: [], pings: [], circles: [] })
    }
    if (query.length > 100) {
      return NextResponse.json({ error: 'Search text must be 100 characters or fewer' }, { status: 400 })
    }

    const results = { users: [] as unknown[], pings: [] as unknown[], circles: [] as unknown[] }

    if (type === 'all' || type === 'users') {
      results.users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { profile: { displayName: { contains: query, mode: 'insensitive' } } }
          ]
        },
        select: { id: true, username: true, profile: { select: { displayName: true, avatar: true } } },
        take: 10
      })
    }

    if (type === 'all' || type === 'pings') {
      results.pings = await prisma.ping.findMany({
        where: {
          content: { contains: query, mode: 'insensitive' },
          isDraft: false,
          isArchived: false,
          scheduledAt: null
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              profile: { select: { displayName: true, avatar: true } }
            }
          },
          _count: {
            select: {
              likes: true,
              comments: true,
              shares: true
            }
          }
        },
        take: 10
      })
    }

    if (type === 'all' || type === 'circles') {
      results.circles = await prisma.circle.findMany({
        where: {
          isPrivate: false,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 10
      })
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error searching:', error)
    return NextResponse.json(
      { error: 'Failed to search' },
      { status: 500 }
    )
  }
}
