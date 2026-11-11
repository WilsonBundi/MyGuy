import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/pings/[id]/share - Share a ping
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user already shared this ping
    const existingShare = await prisma.share.findUnique({
      where: {
        user_ping_share: {
          userId: session.user.id,
          pingId: id
        }
      }
    })

    if (existingShare) {
      // Unshare
      await prisma.share.delete({
        where: { id: existingShare.id }
      })
      return NextResponse.json({ shared: false })
    } else {
      // Share
      await prisma.share.create({
        data: {
          userId: session.user.id,
          pingId: id
        }
      })
      return NextResponse.json({ shared: true })
    }
  } catch (error) {
    console.error('Error sharing ping:', error)
    return NextResponse.json(
      { error: 'Failed to share ping' },
      { status: 500 }
    )
  }
}
