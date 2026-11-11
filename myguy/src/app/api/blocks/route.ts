import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const blockSchema = z.object({
  blockedId: z.string()
})

// GET /api/blocks - Get blocked users
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const blocks = await prisma.block.findMany({
      where: { blockerId: session.user.id },
      include: {
        blockedUser: {
          select: {
            id: true,
            username: true,
            profile: true
          }
        }
      }
    })

    return NextResponse.json({ blocks })
  } catch (error) {
    console.error('Error fetching blocks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blocks' },
      { status: 500 }
    )
  }
}

// POST /api/blocks - Block a user
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { blockedId } = blockSchema.parse(body)

    // Check if already blocked
    const existingBlock = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: session.user.id,
          blockedId
        }
      }
    })

    if (existingBlock) {
      // Unblock
      await prisma.block.delete({
        where: { id: existingBlock.id }
      })
      return NextResponse.json({ blocked: false })
    } else {
      // Block
      const block = await prisma.block.create({
        data: {
          blockerId: session.user.id,
          blockedId
        },
        include: {
          blockedUser: {
            select: {
              id: true,
              username: true,
              profile: true
            }
          }
        }
      })
      return NextResponse.json({ blocked: true, block })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error blocking user:', error)
    return NextResponse.json(
      { error: 'Failed to block user' },
      { status: 500 }
    )
  }
}
