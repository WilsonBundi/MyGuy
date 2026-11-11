import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'
import { z } from 'zod'

const messageSchema = z.object({
  content: z.string().trim().max(5000).default(''),
  messageType: z.enum(['text', 'image', 'video', 'file']).default('text'),
  mediaUrl: z.string().startsWith('/uploads/').optional(),
  attachmentName: z.string().trim().min(1).max(255).optional(),
  isAnnouncement: z.boolean().optional().default(false)
}).superRefine((value, context) => {
  if (value.messageType === 'text' && !value.content) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['content'], message: 'Message content is required.' })
  }
  if (value.messageType !== 'text' && !value.mediaUrl) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['mediaUrl'], message: 'Upload an attachment before sending.' })
  }
  if (value.messageType === 'file' && !value.attachmentName) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['attachmentName'], message: 'A file name is required.' })
  }
  if (value.messageType !== 'file' && value.attachmentName) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['attachmentName'], message: 'File names are only supported for file attachments.' })
  }
})

// GET /api/chats/[id]/messages - Get chat messages
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

    const membership = await prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId: id, userId } },
      select: { id: true }
    })
    if (!membership) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    const messages = await prisma.message.findMany({
      where: {
        chatId: id,
        deletedAt: null
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            profile: { select: { displayName: true, avatar: true } }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    await prisma.$transaction([
      prisma.message.updateMany({
        where: { chatId: id, senderId: { not: userId }, isRead: false, deletedAt: null },
        data: { isRead: true, readAt: new Date() }
      }),
      prisma.chatMember.update({
        where: { chatId_userId: { chatId: id, userId } },
        data: { lastReadAt: new Date() }
      })
    ])

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

// POST /api/chats/[id]/messages - Send a message
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const membership = await prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId: id, userId } },
      select: { id: true, role: true, chat: { select: { isGroup: true } } }
    })
    if (!membership) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    const body = messageSchema.parse(await request.json())
    if (body.isAnnouncement && (!membership.chat.isGroup || !['owner', 'admin'].includes(membership.role))) {
      return NextResponse.json({ error: 'Only Crew admins can post Crew notes.' }, { status: 403 })
    }
    if (body.mediaUrl && !body.mediaUrl.startsWith(`/uploads/${userId}-`)) {
      return NextResponse.json({ error: 'This attachment was not uploaded by your account.' }, { status: 400 })
    }

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          content: body.content,
          chatId: id,
          senderId: userId,
          messageType: body.messageType,
          mediaUrl: body.mediaUrl,
          attachmentName: body.attachmentName,
          isAnnouncement: body.isAnnouncement
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              profile: { select: { displayName: true, avatar: true } }
            }
          }
        }
      }),
      prisma.chat.update({
        where: { id },
        data: { updatedAt: new Date() }
      })
    ])

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || 'Invalid message.' }, { status: 400 })
    }
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
