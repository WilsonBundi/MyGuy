import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'

// GET /api/chats - Get user's chats
export async function GET(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const chats = await prisma.chat.findMany({
      where: {
        isGroup: false,
        status: 'accepted',
        isArchived: false,
        members: {
          some: {
            userId
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        members: {
          select: {
            userId: true,
            lastReadAt: true,
            user: {
              select: {
                id: true,
                username: true,
                isOnline: true,
                lastActiveAt: true,
                profile: { select: { displayName: true, avatar: true } }
              }
            }
          }
        },
        messages: {
          where: { deletedAt: null },
          take: 1,
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    const unreadByChat = await prisma.message.groupBy({
      by: ['chatId'],
      where: {
        chatId: { in: chats.map((chat) => chat.id) },
        senderId: { not: userId },
        isRead: false,
        deletedAt: null
      },
      _count: { _all: true }
    })
    const unreadCounts = new Map(unreadByChat.map((entry) => [entry.chatId, entry._count._all]))
    const now = Date.now()
    const chatsWithUnreadCounts = chats.map((chat) => ({
      ...chat,
      members: chat.members.map((member) => ({
        ...member,
        user: member.user ? {
          ...member.user,
          isOnline: member.user.isOnline && member.user.lastActiveAt !== null &&
            now - member.user.lastActiveAt.getTime() <= 90000
        } : member.user
      })),
      unreadCount: unreadCounts.get(chat.id) ?? 0
    }))

    return NextResponse.json({ chats: chatsWithUnreadCounts })
  } catch (error) {
    console.error('Error fetching chats:', error)
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 })
  }
}

// POST /api/chats - Create a new chat
export async function POST(request: Request) {
  try {
    const currentUserId = await getAuthenticatedUserId(request)
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const targetUserId = typeof body.userId === 'string' ? body.userId : ''

    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    if (targetUserId === currentUserId) {
      return NextResponse.json({ error: 'You cannot start a chat with yourself' }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true }
    })
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const existingChat = await prisma.chat.findFirst({
      where: {
        isGroup: false,
        AND: [
          { members: { some: { userId: currentUserId } } },
          { members: { some: { userId: targetUserId } } },
          { members: { every: { userId: { in: [currentUserId, targetUserId] } } } }
        ]
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                isOnline: true,
                lastActiveAt: true,
                profile: { select: { displayName: true, avatar: true } }
              }
            }
          }
        }
      }
    })

    if (existingChat) {
      return NextResponse.json({ chat: existingChat })
    }

    // Create new chat
    const chat = await prisma.chat.create({
      data: {
        isGroup: false,
        members: {
          create: [
            { userId: currentUserId },
            { userId: targetUserId }
          ]
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                isOnline: true,
                lastActiveAt: true,
                profile: {
                  select: {
                    displayName: true,
                    avatar: true
                  }
                }
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ chat }, { status: 201 })
  } catch (error) {
    console.error('Error creating chat:', error)
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 })
  }
}
