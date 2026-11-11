import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'

const addMembersSchema = z.object({
  userIds: z.array(z.string().trim().min(1)).min(1).max(49)
})

const updateRoleSchema = z.object({
  userId: z.string().trim().min(1),
  role: z.enum(['admin', 'member'])
})

async function getCrewRole(chatId: string, userId: string) {
  const membership = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId, userId } },
    select: { role: true, chat: { select: { isGroup: true } } }
  })
  return membership?.chat.isGroup ? membership : null
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const membership = await getCrewRole(id, userId)
    if (!membership) return NextResponse.json({ error: 'Crew not found' }, { status: 404 })

    const members = await prisma.chatMember.findMany({
      where: { chatId: id },
      select: {
        userId: true,
        role: true,
        joinedAt: true,
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
      orderBy: { joinedAt: 'asc' }
    })
    return NextResponse.json({ members })
  } catch (error) {
    console.error('Error fetching Crew members:', error)
    return NextResponse.json({ error: 'Failed to fetch Crew members' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const membership = await getCrewRole(id, userId)
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Only Crew admins can add members.' }, { status: 403 })
    }
    const parsed = addMembersSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'Choose at least one person to add.' }, { status: 400 })
    const ids = [...new Set(parsed.data.userIds)]
    if (ids.length !== parsed.data.userIds.length || ids.includes(userId)) {
      return NextResponse.json({ error: 'Choose each person once; Crew members are already included.' }, { status: 400 })
    }

    const users = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true } })
    if (users.length !== ids.length) return NextResponse.json({ error: 'One or more people could not be found.' }, { status: 404 })
    const existing = await prisma.chatMember.findMany({
      where: { chatId: id, userId: { in: ids } },
      select: { userId: true }
    })
    const existingIds = new Set(existing.map((member) => member.userId))
    const newIds = ids.filter((memberId) => !existingIds.has(memberId))
    if (!newIds.length) return NextResponse.json({ error: 'Those people are already in this Crew.' }, { status: 409 })

    await prisma.chatMember.createMany({
      data: newIds.map((memberId) => ({ chatId: id, userId: memberId }))
    })
    return NextResponse.json({ added: newIds.length }, { status: 201 })
  } catch (error) {
    console.error('Error adding Crew members:', error)
    return NextResponse.json({ error: 'Failed to add Crew members' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const actor = await getCrewRole(id, userId)
    if (!actor || actor.role !== 'owner') {
      return NextResponse.json({ error: 'Only the Crew owner can change admin roles.' }, { status: 403 })
    }
    const parsed = updateRoleSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'Invalid Crew role update.' }, { status: 400 })
    const target = await getCrewRole(id, parsed.data.userId)
    if (!target) return NextResponse.json({ error: 'Crew member not found.' }, { status: 404 })
    if (target.role === 'owner') return NextResponse.json({ error: 'The owner role cannot be changed here.' }, { status: 400 })

    const member = await prisma.chatMember.update({
      where: { chatId_userId: { chatId: id, userId: parsed.data.userId } },
      data: { role: parsed.data.role },
      select: { userId: true, role: true }
    })
    return NextResponse.json({ member })
  } catch (error) {
    console.error('Error changing Crew role:', error)
    return NextResponse.json({ error: 'Failed to change Crew role' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const actor = await getCrewRole(id, userId)
    if (!actor || !['owner', 'admin'].includes(actor.role)) {
      return NextResponse.json({ error: 'Only Crew admins can remove members.' }, { status: 403 })
    }
    const targetId = new URL(request.url).searchParams.get('userId') || ''
    if (!targetId || targetId === userId) {
      return NextResponse.json({ error: 'Choose another member to remove.' }, { status: 400 })
    }
    const target = await getCrewRole(id, targetId)
    if (!target) return NextResponse.json({ error: 'Crew member not found.' }, { status: 404 })
    if (target.role === 'owner') return NextResponse.json({ error: 'The Crew owner cannot be removed.' }, { status: 403 })
    if (actor.role !== 'owner' && target.role === 'admin') {
      return NextResponse.json({ error: 'Only the owner can remove another admin.' }, { status: 403 })
    }

    await prisma.chatMember.delete({ where: { chatId_userId: { chatId: id, userId: targetId } } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing Crew member:', error)
    return NextResponse.json({ error: 'Failed to remove Crew member' }, { status: 500 })
  }
}
