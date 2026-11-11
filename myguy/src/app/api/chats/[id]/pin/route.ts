import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/chats/[id]/pin - Pin/unpin a chat
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
    const { isPinned } = body

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

    await prisma.chat.update({
      where: { id: id },
      data: { isPinned }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error pinning chat:', error)
    return NextResponse.json({ error: 'Failed to pin chat' }, { status: 500 })
  }
}
