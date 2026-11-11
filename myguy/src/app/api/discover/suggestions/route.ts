import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'

// GET /api/discover/suggestions - Get suggested users and circles
export async function GET(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request)

    let suggestedUsers
    if (userId) {
      const connectedUserIds = await prisma.connection.findMany({
        where: {
          OR: [
            { userId },
            { connectedId: userId }
          ],
          status: { in: ['accepted', 'pending'] }
        },
        select: {
          userId: true,
          connectedId: true
        }
      })

      const excludeIds = new Set([
        userId,
        ...connectedUserIds.map(c => c.userId),
        ...connectedUserIds.map(c => c.connectedId)
      ])

      suggestedUsers = await prisma.user.findMany({
        where: {
          id: {
            notIn: Array.from(excludeIds)
          }
        },
        select: {
          id: true,
          username: true,
          profile: { select: { displayName: true, avatar: true } }
        },
        take: 5,
        orderBy: {
          createdAt: 'desc'
        }
      })
    } else {
      suggestedUsers = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          profile: { select: { displayName: true, avatar: true } }
        },
        take: 5,
        orderBy: {
          createdAt: 'desc'
        }
      })
    }

    const popularCircles = await prisma.circle.findMany({
      where: {
        isPrivate: false,
        ...(userId ? { members: { none: { id: userId } } } : {})
      },
      include: {
        _count: {
          select: {
            members: true
          }
        }
      },
      take: 5,
      orderBy: {
        members: {
          _count: 'desc'
        }
      }
    })

    return NextResponse.json({
      users: suggestedUsers,
      circles: popularCircles
    })
  } catch (error) {
    console.error('Error fetching suggestions:', error)
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 })
  }
}
