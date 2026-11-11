import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'

// GET /api/moments/[id]/viewers - Get moment viewers
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

    const viewed = await prisma.moment.updateMany({
      where: { id, expiresAt: { gt: new Date() } },
      data: { views: { increment: 1 } }
    })
    if (viewed.count === 0) return NextResponse.json({ error: 'Pulse not found or expired.' }, { status: 404 })

    const moment = await prisma.moment.findUnique({
      where: { id },
      select: { views: true }
    })

    return NextResponse.json({ views: moment?.views || 0 })
  } catch (error) {
    console.error('Error tracking view:', error)
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 })
  }
}
