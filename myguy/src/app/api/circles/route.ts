import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'

const createCircleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isPrivate: z.boolean().optional().default(false)
})

// GET /api/circles - Get user's circles
export async function GET(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const circles = await prisma.circle.findMany({
      where: {
        members: {
          some: {
            id: userId
          }
        }
      },
      include: {
        admin: {
          include: {
            profile: true
          }
        },
        _count: {
          select: {
            members: true,
            posts: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ circles })
  } catch (error) {
    console.error('Error fetching circles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch circles' },
      { status: 500 }
    )
  }
}

// POST /api/circles - Create a new circle
export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, imageUrl, isPrivate } = createCircleSchema.parse(body)

    const circle = await prisma.circle.create({
      data: {
        name,
        description,
        imageUrl: imageUrl === '' ? null : imageUrl,
        isPrivate,
        adminId: userId,
        memberCount: 1,
        members: {
          connect: { id: userId }
        }
      },
      include: {
        admin: {
          include: {
            profile: true
          }
        },
        _count: {
          select: {
            members: true,
            posts: true
          }
        }
      }
    })

    return NextResponse.json({ circle }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating circle:', error)
    return NextResponse.json(
      { error: 'Failed to create circle' },
      { status: 500 }
    )
  }
}
