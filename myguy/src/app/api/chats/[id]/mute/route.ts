import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/chats/[id]/mute - Mute/unmute chat notifications
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { muteUntil } = body // null to unmute, or ISO date string

    // Verify user is a member of the chat
    const chatMember = await prisma.chatMember.findUnique({
      where: {
        chatId_userId: {
          chatId: id,
          userId: session.user.id
        }
      }
    })

    if (!chatMember) {
      return NextResponse.json({ error: 'Not a member of this chat' }, { status: 403 })
    }

    await prisma.chatMember.update({
      where: { id: chatMember.id },
      data: {
        muteUntil: muteUntil ? new Date(muteUntil) : null
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error muting chat:', error)
    return NextResponse.json({ error: 'Failed to mute chat' }, { status: 500 })
  }
}
