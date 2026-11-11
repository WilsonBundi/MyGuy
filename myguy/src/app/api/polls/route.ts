import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const pollSchema = z.object({
  question: z.string().min(1).max(200),
  options: z.array(z.string().min(1).max(100)).min(2).max(4),
  expiresAt: z.string().optional(),
  isMultiple: z.boolean().default(false)
})

// POST /api/polls - Create a poll
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { question, options, expiresAt, isMultiple } = pollSchema.parse(body)

    // First create the ping
    const ping = await prisma.ping.create({
      data: {
        content: `📊 ${question}`,
        authorId: session.user.id
      }
    })

    // Then create the poll with options
    const poll = await prisma.poll.create({
      data: {
        question,
        pingId: ping.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isMultiple,
        options: {
          create: options.map(text => ({ text, votes: 0 }))
        }
      },
      include: {
        options: true
      }
    })

    return NextResponse.json({ poll }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Error creating poll:', error)
    return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 })
  }
}
