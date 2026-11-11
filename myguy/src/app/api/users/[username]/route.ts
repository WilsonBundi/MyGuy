import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params

  try {
    const session = await getServerSession(authOptions)

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        profile: true,
        _count: {
          select: {
            pings: true,
            connections: true,
            connectedTo: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let isFriend = false
    let isPending = false

    if (session?.user?.id) {
      const connection = await prisma.connection.findFirst({
        where: {
          OR: [
            { userId: session.user.id, connectedId: user.id },
            { userId: user.id, connectedId: session.user.id }
          ]
        }
      })

      if (connection) {
        if (connection.status === 'accepted') {
          isFriend = true
        } else if (connection.status === 'pending') {
          isPending = connection.userId === session.user.id
        }
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        profile: user.profile,
        _count: {
          pings: user._count.pings,
          followers: user._count.connections,
          following: user._count.connectedTo
        }
      },
      isFriend,
      isPending
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
