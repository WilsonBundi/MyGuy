import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'

const updateSchema = z.object({
  name: z.string().trim().min(2).max(40).optional(),
  description: z.string().trim().max(280).optional(),
  isPrivate: z.boolean().optional(),
  requiresApproval: z.boolean().optional(),
  groupImage: z.string().trim().max(500).nullable().optional(),
  rotateInvite: z.boolean().optional()
}).refine((value) => Object.keys(value).length > 0)

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const membership = await prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId: id, userId } },
      select: { role: true, chat: { select: { isGroup: true } } }
    })
    if (!membership?.chat.isGroup) return NextResponse.json({ error: 'Crew not found' }, { status: 404 })

    const crew = await prisma.chat.findFirst({
      where: { id, isGroup: true },
      include: {
        members: {
          select: {
            userId: true,
            joinedAt: true,
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
          orderBy: { joinedAt: 'asc' }
        }
      }
    })
    if (!crew) return NextResponse.json({ error: 'Crew not found' }, { status: 404 })
    return NextResponse.json({ crew, role: membership.role })
  } catch (error) {
    console.error('Error fetching Crew details:', error)
    return NextResponse.json({ error: 'Failed to fetch Crew details' }, { status: 500 })
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
    const body = updateSchema.safeParse(await request.json())
    if (!body.success) return NextResponse.json({ error: 'Invalid Crew settings.' }, { status: 400 })

    const membership = await prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId: id, userId } },
      select: { role: true, chat: { select: { isGroup: true } } }
    })
    if (!membership?.chat.isGroup || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Only Crew admins can change Crew settings.' }, { status: 403 })
    }

    const data = {
      ...(body.data.name !== undefined ? { groupName: body.data.name } : {}),
      ...(body.data.description !== undefined ? { description: body.data.description || null } : {}),
      ...(body.data.isPrivate !== undefined ? { isPrivate: body.data.isPrivate } : {}),
      ...(body.data.requiresApproval !== undefined ? { requiresApproval: body.data.requiresApproval } : {}),
      ...(body.data.groupImage !== undefined ? { groupImage: body.data.groupImage } : {}),
      ...(body.data.rotateInvite ? { inviteCode: randomBytes(18).toString('base64url') } : {})
    }
    const crew = await prisma.chat.update({
      where: { id },
      data,
      select: { id: true, groupName: true, groupImage: true, description: true, isPrivate: true, requiresApproval: true, inviteCode: true }
    })
    return NextResponse.json({ crew })
  } catch (error) {
    console.error('Error updating Crew settings:', error)
    return NextResponse.json({ error: 'Failed to update Crew settings' }, { status: 500 })
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
    const crew = await prisma.chat.findFirst({
      where: { id, isGroup: true },
      select: { id: true }
    })
    if (!crew) return NextResponse.json({ error: 'Crew not found' }, { status: 404 })
    const members = await prisma.chatMember.findMany({
      where: { chatId: id },
      orderBy: { joinedAt: 'asc' },
      select: { userId: true, role: true }
    })
    const leavingMember = members.find((member) => member.userId === userId)
    if (!leavingMember) return NextResponse.json({ error: 'Crew not found' }, { status: 404 })

    const remaining = members.filter((member) => member.userId !== userId)
    const nextOwner = leavingMember.role === 'owner'
      ? remaining.find((member) => member.role === 'admin') || remaining[0]
      : undefined

    await prisma.$transaction(async (tx) => {
      await tx.chatMember.delete({ where: { chatId_userId: { chatId: id, userId } } })
      if (!remaining.length) {
        await tx.chat.delete({ where: { id } })
        return
      }
      if (nextOwner) {
        await tx.chat.update({ where: { id }, data: { createdById: nextOwner.userId } })
        await tx.chatMember.update({
          where: { chatId_userId: { chatId: id, userId: nextOwner.userId } },
          data: { role: 'owner' }
        })
      }
    })
    return NextResponse.json({ success: true, transferredTo: nextOwner?.userId ?? null })
  } catch (error) {
    console.error('Error leaving Crew:', error)
    return NextResponse.json({ error: 'Failed to leave Crew' }, { status: 500 })
  }
}
