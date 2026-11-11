import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  try {
    const circle = await prisma.circle.findUnique({
      where: { id },
      select: { id: true, isPrivate: true, members: { where: { id: userId }, select: { id: true } } }
    })
    if (!circle) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 })
    }
    if (circle.isPrivate) {
      return NextResponse.json({ error: 'This circle is private' }, { status: 403 })
    }
    if (circle.members.length > 0) {
      return NextResponse.json({ error: 'You have already joined this circle' }, { status: 409 })
    }

    const joinedCircle = await prisma.circle.update({
      where: { id },
      data: {
        members: { connect: { id: userId } },
        memberCount: { increment: 1 }
      },
      select: { id: true, name: true, memberCount: true }
    })

    return NextResponse.json({ circle: joinedCircle }, { status: 200 })
  } catch (error) {
    console.error('Error joining circle:', error)
    return NextResponse.json({ error: 'Failed to join circle' }, { status: 500 })
  }
}
