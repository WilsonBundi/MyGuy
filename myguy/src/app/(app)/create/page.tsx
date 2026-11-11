'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function CreatePage() {
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
    }
  }, [session, router])

  if (!session) {
    return null
  }

  const createOptions = [
    {
      emoji: '📷',
      title: 'Moment',
      description: 'Share a photo or video that disappears after 24 hours',
      action: () => router.push('/create/moment')
    },
    {
      emoji: '🎥',
      title: 'Video',
      description: 'Upload and share a video with your audience',
      action: () => router.push('/create/video')
    },
    {
      emoji: '✍️',
      title: 'Ping',
      description: 'Share a short public thought with the world',
      action: () => router.push('/')
    },
    {
      emoji: '📍',
      title: 'Event',
      description: 'Create an event and invite people to join',
      action: () => router.push('/create/event')
    },
    {
      emoji: '👥',
      title: 'Circle Post',
      description: 'Post to one of your circles or communities',
      action: () => router.push('/create/circle-post')
    },
    {
      emoji: '📡',
      title: 'Live Room',
      description: 'Start a live group conversation',
      action: () => router.push('/create/room')
    }
  ]

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create</h1>
          <p className="text-gray-600 dark:text-gray-300">What do you want to share?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {createOptions.map((option) => (
            <button
              key={option.title}
              onClick={option.action}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 text-left hover:shadow-md transition group"
            >
              <div className="flex items-start space-x-4">
                <div className="text-4xl">{option.emoji}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition">
                    {option.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">{option.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}
