import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'

const createCrewSchema = z.object({
  name: z.string().trim().min(2).max(40),
  description: z.string().trim().max(280).optional().default(''),
  isPrivate: z.boolean().optional().default(false),
  requiresApproval: z.boolean().optional().default(false),
  userIds: z.array(z.string().trim().min(1)).min(2).max(49)
})

const crewInclude = {
  members: {
    select: {
      userId: true,
      joinedAt: true,
      lastReadAt: true,
      role: true,
      user: {
        select: {
          id: true,
          username: true,
          isOnline: true,
          lastActiveAt: true,
          profile: { select: { displayName: true, avatar: true } }
        }
      }
    },
    orderBy: { joinedAt: 'asc' as const }
  },
  messages: {
    where: { deletedAt: null },
    take: 1,
    orderBy: { createdAt: 'desc' as const }
  },
  _count: { select: { members: true } }
}

export async function GET(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const crews = await prisma.chat.findMany({
      where: {
        isGroup: true,
        status: 'accepted',
        isArchived: false,
        members: { some: { userId } }
      },
      orderBy: { updatedAt: 'desc' },
      include: crewInclude
    })
    const now = Date.now()
    const memberState = await Promise.all(crews.map(async (crew) => {
      const currentMember = crew.members.find((member) => member.userId === userId)
      const unreadCount = await prisma.message.count({
        where: {
          chatId: crew.id,
          senderId: { not: userId },
          deletedAt: null,
          ...(currentMember?.lastReadAt ? { createdAt: { gt: currentMember.lastReadAt } } : {})
        }
      })
      return {
        ...crew,
        members: crew.members.map((member) => ({
          ...member,
          user: member.user ? {
            ...member.user,
            isOnline: member.user.isOnline && member.user.lastActiveAt !== null &&
              now - member.user.lastActiveAt.getTime() <= 90000
          } : member.user
        })),
        unreadCount
      }
    }))
    return NextResponse.json({ crews: memberState })
  } catch (error) {
    console.error('Error fetching Crews:', error)
    return NextResponse.json({ error: 'Failed to fetch Crews' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = createCrewSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Add a name and choose at least two people for your Crew.' }, { status: 400 })
    }
    const memberIds = [...new Set(parsed.data.userIds)]
    if (memberIds.length !== parsed.data.userIds.length || memberIds.includes(userId)) {
      return NextResponse.json({ error: 'Choose each Crew member once; you are added automatically.' }, { status: 400 })
    }
    const users = await prisma.user.findMany({
      where: { id: { in: memberIds } },
      select: { id: true }
    })
    if (users.length !== memberIds.length) {
      return NextResponse.json({ error: 'One or more selected people could not be found.' }, { status: 404 })
    }

    const crew = await prisma.chat.create({
      data: {
        isGroup: true,
        groupName: parsed.data.name,
        description: parsed.data.description || null,
        isPrivate: parsed.data.isPrivate,
        requiresApproval: parsed.data.requiresApproval,
        inviteCode: randomBytes(18).toString('base64url'),
        createdById: userId,
        members: {
          create: [
            { userId, role: 'owner' },
            ...memberIds.map((memberId) => ({ userId: memberId, role: 'member' }))
          ]
        }
      },
      include: crewInclude
    })
    return NextResponse.json({ crew }, { status: 201 })
  } catch (error) {
    console.error('Error creating Crew:', error)
    return NextResponse.json({ error: 'Failed to create Crew' }, { status: 500 })
  }
}
