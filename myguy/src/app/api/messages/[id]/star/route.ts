import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/messages/[id]/star - Star/unstar a message
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
    const { isStarred } = body

    const message = await prisma.message.update({
      where: { id: id },
      data: { isStarred }
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Error starring message:', error)
    return NextResponse.json({ error: 'Failed to star message' }, { status: 500 })
  }
}
