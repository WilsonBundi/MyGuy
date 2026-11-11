import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'
import { z } from 'zod'

const createConnectionSchema = z.object({ connectedId: z.string().min(1) })

// GET /api/connections - Get user's connections
export async function GET(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { userId },
          { connectedId: userId }
        ],
        status: 'accepted'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                avatar: true
              }
            }
          }
        },
        connectedTo: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                avatar: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ connections })
  } catch (error) {
    console.error('Error fetching connections:', error)
    return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 })
  }
}

// POST /api/connections - Send connection request
export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { connectedId } = createConnectionSchema.parse(await request.json())
    if (connectedId === userId) {
      return NextResponse.json({ error: 'You cannot connect with yourself' }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: connectedId },
      select: { id: true }
    })
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const existing = await prisma.connection.findFirst({
      where: {
        OR: [
          { userId, connectedId },
          { userId: connectedId, connectedId: userId }
        ]
      }
    })
    if (existing) {
      return NextResponse.json({ error: 'A connection request already exists' }, { status: 409 })
    }

    const connection = await prisma.connection.create({
      data: {
        userId,
        connectedId,
        status: 'pending'
      }
    })

    return NextResponse.json({ connection }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'A valid user ID is required' }, { status: 400 })
    }
    console.error('Error creating connection:', error)
    return NextResponse.json({ error: 'Failed to create connection' }, { status: 500 })
  }
}
