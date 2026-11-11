import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  avatar: z.string().max(2048).optional().refine((value) =>
    value === undefined || value === '' || value.startsWith('/uploads/') || z.string().url().safeParse(value).success
  ),
  coverImage: z.string().max(2048).optional().refine((value) =>
    value === undefined || value === '' || value.startsWith('/uploads/') || z.string().url().safeParse(value).success
  ),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().optional().or(z.literal('')),
  language: z.string().optional(),
  secondaryLanguages: z.array(z.string()).optional(),
  autoTranslate: z.boolean().optional(),
  timezone: z.string().optional(),
  country: z.string().optional(),
  interests: z.array(z.string()).optional(),
  dateOfBirth: z.string().optional(),
  phone: z.string().optional(),
  creatorCategory: z.string().optional(),
  businessCategory: z.string().optional(),
  businessType: z.string().optional(),
  onboardingCompleted: z.boolean().optional()
})

// GET /api/profile - Get current user's profile
export async function GET(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            createdAt: true
          }
        }
      }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// PUT /api/profile - Update current user's profile
export async function PUT(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const data = updateProfileSchema.parse(body)

    const profile = await prisma.$transaction(async (transaction) => {
      const currentProfile = await transaction.profile.findUnique({
        where: { userId },
        select: { avatar: true, coverImage: true }
      })

      const nextAvatar = data.avatar === '' ? null : data.avatar
      const nextCoverImage = data.coverImage === '' ? null : data.coverImage
      const changedPhotos: { label: string; url: string | null | undefined }[] = []
      if (data.avatar !== undefined && nextAvatar !== currentProfile?.avatar) {
        changedPhotos.push({ label: 'profile photo', url: nextAvatar })
      }
      if (data.coverImage !== undefined && nextCoverImage !== currentProfile?.coverImage) {
        changedPhotos.push({ label: 'cover photo', url: nextCoverImage })
      }

      const updatedProfile = await transaction.profile.update({
        where: { userId },
        data: {
          ...data,
          website: data.website === '' ? null : data.website,
          avatar: nextAvatar,
          coverImage: nextCoverImage
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      })

      for (const changedPhoto of changedPhotos) {
        await transaction.ping.create({
          data: {
            content: `Changed their ${changedPhoto.label}.`,
            mediaUrls: changedPhoto.url ? [changedPhoto.url] : [],
            authorId: userId
          }
        })
      }

      return updatedProfile
    })

    return NextResponse.json({ profile })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
