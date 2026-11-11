import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'

const commentSchema = z.object({
  content: z.string().trim().min(1).max(500),
  parentCommentId: z.string().optional()
})

// GET /api/pings/[id]/comments - Get comments for a ping
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const comments = await prisma.comment.findMany({
      where: { pingId: id, parentCommentId: null },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: { select: { displayName: true, avatar: true } }
          }
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profile: { select: { displayName: true, avatar: true } }
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST /api/pings/[id]/comments - Create a comment on a ping
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { content, parentCommentId } = commentSchema.parse(body)

    if (parentCommentId) {
      const parentComment = await prisma.comment.findFirst({
        where: { id: parentCommentId, pingId: id, parentCommentId: null },
        select: { id: true }
      })
      if (!parentComment) {
        return NextResponse.json(
          { error: 'The comment you are replying to was not found.' },
          { status: 404 }
        )
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        userId,
        pingId: id,
        parentCommentId
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: { select: { displayName: true, avatar: true } }
          }
        }
      }
    })

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
