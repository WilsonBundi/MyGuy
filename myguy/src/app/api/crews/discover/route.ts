import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'

export async function GET(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const crews = await prisma.chat.findMany({
      where: {
        isGroup: true,
        isPrivate: false,
        status: 'accepted',
        members: { none: { userId } },
        joinRequests: { none: { userId, status: 'pending' } }
      },
      select: {
        id: true,
        groupName: true,
        groupImage: true,
        description: true,
        requiresApproval: true,
        createdAt: true,
        _count: { select: { members: true } },
        createdBy: {
          select: {
            username: true,
            profile: { select: { displayName: true, avatar: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 30
    })
    return NextResponse.json({ crews })
  } catch (error) {
    console.error('Error discovering public Crews:', error)
    return NextResponse.json({ error: 'Failed to discover public Crews' }, { status: 500 })
  }
}
