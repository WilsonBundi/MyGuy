'use client'

import Link from 'next/link'

interface Circle {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  isPrivate: boolean
  memberCount: number
  postsCount: number
  admin: {
    profile?: {
      displayName: string
    }
  }
}

interface CircleCardProps {
  circle: Circle
}

export default function CircleCard({ circle }: CircleCardProps) {
  return (
    <Link
      href={`/circles/${circle.id}`}
      className="block bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition"
    >
      <div className="flex items-start space-x-4">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
          {circle.imageUrl ? (
            <img src={circle.imageUrl} alt={circle.name} className="w-full h-full rounded-xl object-cover" />
          ) : (
            circle.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{circle.name}</h3>
            {circle.isPrivate && (
              <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full font-medium">
                Private
              </span>
            )}
          </div>
          {circle.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">{circle.description}</p>
          )}
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <span>{circle.memberCount} members</span>
            <span>{circle.postsCount} posts</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
