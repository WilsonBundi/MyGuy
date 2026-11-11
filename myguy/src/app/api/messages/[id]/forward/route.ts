import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/messages/[id]/forward - Forward a message
export async function POST(
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
    const { chatId } = body

    // Get original message
    const originalMessage = await prisma.message.findUnique({
      where: { id: id }
    })

    if (!originalMessage) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Create forwarded message
    const forwardedMessage = await prisma.message.create({
      data: {
        content: originalMessage.content,
        messageType: originalMessage.messageType,
        chatId,
        senderId: session.user.id,
        forwardedFrom: originalMessage.id
      }
    })

    return NextResponse.json({ message: forwardedMessage }, { status: 201 })
  } catch (error) {
    console.error('Error forwarding message:', error)
    return NextResponse.json({ error: 'Failed to forward message' }, { status: 500 })
  }
}
