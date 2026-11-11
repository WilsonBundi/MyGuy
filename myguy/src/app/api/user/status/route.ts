import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'

const presenceSchema = z.object({ isOnline: z.boolean() })
const ONLINE_WINDOW_MS = 90000

export async function PATCH(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { isOnline } = presenceSchema.parse(await request.json())
    await prisma.user.update({
      where: { id: userId },
      data: { isOnline, lastActiveAt: new Date() }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'A valid online status is required.' }, { status: 400 })
    }
    console.error('Error updating user status:', error)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const viewerId = await getAuthenticatedUserId(request)
    if (!viewerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isOnline: true, lastActiveAt: true }
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isOnline = user.isOnline && user.lastActiveAt !== null &&
      Date.now() - user.lastActiveAt.getTime() <= ONLINE_WINDOW_MS
    return NextResponse.json({ user: { ...user, isOnline } })
  } catch (error) {
    console.error('Error fetching user status:', error)
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 })
  }
}
