import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/message-requests - Get pending message requests
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pendingChats = await prisma.chat.findMany({
      where: {
        status: 'pending',
        members: {
          some: {
            userId: session.user.id
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profile: true
              }
            }
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      }
    })

    return NextResponse.json({ requests: pendingChats })
  } catch (error) {
    console.error('Error fetching message requests:', error)
    return NextResponse.json({ error: 'Failed to fetch message requests' }, { status: 500 })
  }
}

// PATCH /api/message-requests - Accept or decline a message request
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { chatId, action } = body // action: 'accept' or 'decline'

    if (action === 'accept') {
      await prisma.chat.update({
        where: { id: chatId },
        data: { status: 'accepted' }
      })
    } else if (action === 'decline') {
      await prisma.chat.delete({
        where: { id: chatId }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating message request:', error)
    return NextResponse.json({ error: 'Failed to update message request' }, { status: 500 })
  }
}
