import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/discover/trending - Get trending content
export async function GET() {
  try {
    // Get trending pings (most reactions + comments + shares in last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const trendingPings = await prisma.ping.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        },
        isDraft: false,
        isArchived: false,
        scheduledAt: null,
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
            shares: true,
            reactions: true
          }
        }
      },
      take: 50,
      orderBy: { createdAt: 'desc' }
    })

    // Calculate engagement score
    const trendingWithScore = trendingPings.map(ping => ({
      ...ping,
      engagementScore: ping._count.likes + ping._count.comments + ping._count.shares + ping._count.reactions
    }))

    // Sort by engagement score
    trendingWithScore.sort((a, b) => b.engagementScore - a.engagementScore)

    return NextResponse.json({ trending: trendingWithScore.slice(0, 5) })
  } catch (error) {
    console.error('Error fetching trending:', error)
    return NextResponse.json({ error: 'Failed to fetch trending' }, { status: 500 })
  }
}
