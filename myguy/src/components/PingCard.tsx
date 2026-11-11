'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHeart, faComment, faShare, faReply, faThumbsUp, faLaugh, faSadTear, faAngry, faEllipsisH, faGlobe, faCamera, faUsers, faImage, faVideo } from '@fortawesome/free-solid-svg-icons'
import Comments from './Comments'
import Reactions from './Reactions'

interface Ping {
  id: string
  content: string
  createdAt: string
  mediaUrls?: string[]
  location?: string
  taggedUsers?: string[]
  audience?: 'everyone' | 'connections' | 'circle'
  author: {
    id: string
    username: string
    profile?: {
      displayName: string
      avatar: string | null
      coverImage?: string | null
    }
  }
  _count: {
    likes: number
    comments: number
    shares: number
  }
}

interface PingCardProps {
  ping: Ping
}

export default function PingCard({ ping }: PingCardProps) {
  const { data: session } = useSession()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(ping._count.likes)
  const [shared, setShared] = useState(false)
  const [shareCount, setShareCount] = useState(ping._count.shares)
  const [showComments, setShowComments] = useState(false)

  const handleLike = async () => {
    if (!session) return

    try {
      const response = await fetch(`/api/pings/${ping.id}/like`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setLiked(data.liked)
        setLikeCount(prev => data.liked ? prev + 1 : prev - 1)
      }
    } catch (error) {
      console.error('Error liking ping:', error)
    }
  }

  const handleShare = async () => {
    if (!session) return

    try {
      const response = await fetch(`/api/pings/${ping.id}/share`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setShared(data.shared)
        setShareCount(prev => data.shared ? prev + 1 : prev - 1)
      }
    } catch (error) {
      console.error('Error sharing ping:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm mb-4 border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Cover Image */}
      {ping.author.profile?.coverImage && (
        <div className="h-40 bg-gradient-to-r from-orange-500 to-red-500 relative">
          <img 
            src={ping.author.profile.coverImage} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Author Info */}
      <div className={`p-4 ${ping.author.profile?.coverImage ? '-mt-12' : ''}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-xl border-4 border-white dark:border-gray-800 shadow-lg">
              {ping.author.profile?.displayName?.charAt(0) || ping.author.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                {ping.author.profile?.displayName || ping.author.username}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <span>{formatDate(ping.createdAt)}</span>
                {ping.audience && (
                  <>
                    <span>·</span>
                    <span className="flex items-center space-x-1">
                      <FontAwesomeIcon icon={faGlobe} className="w-3 h-3" />
                      <span className="capitalize">{ping.audience}</span>
                    </span>
                  </>
                )}
                {ping.location && (
                  <>
                    <span>·</span>
                    <span className="flex items-center space-x-1">
                      <FontAwesomeIcon icon={faCamera} className="w-3 h-3" />
                      <span>{ping.location}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
            <FontAwesomeIcon icon={faEllipsisH} className="text-gray-500" />
          </button>
        </div>

        {/* Ping Content */}
        <p className="text-gray-800 dark:text-gray-200 text-lg mb-4 whitespace-pre-wrap">{ping.content}</p>

        {/* Media Display */}
        {ping.mediaUrls && ping.mediaUrls.length > 0 && (
          <div className={`grid gap-2 mb-4 ${ping.mediaUrls.length === 1 ? 'grid-cols-1' : ping.mediaUrls.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
            {ping.mediaUrls.map((url, index) => (
              <div key={index} className="relative">
                {url.includes('video') || url.includes('.mp4') || url.includes('.webm') ? (
                  <video 
                    src={url} 
                    controls 
                    className="w-full h-64 object-cover rounded-xl"
                  />
                ) : (
                  <img 
                    src={url} 
                    alt="Post media" 
                    className="w-full h-64 object-cover rounded-xl cursor-pointer hover:opacity-90 transition"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tagged Users */}
        {ping.taggedUsers && ping.taggedUsers.length > 0 && (
          <div className="flex items-center space-x-2 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <FontAwesomeIcon icon={faUsers} className="text-blue-500" />
            <span className="text-sm text-blue-600 dark:text-blue-400">
              with {ping.taggedUsers.map(u => `@${u}`).join(', ')}
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1">
              <FontAwesomeIcon icon={faThumbsUp} className="text-blue-500" />
              <span>{likeCount}</span>
            </span>
            <span className="flex items-center space-x-1 cursor-pointer hover:text-blue-500" onClick={() => setShowComments(!showComments)}>
              <FontAwesomeIcon icon={faComment} />
              <span>{ping._count.comments} comments</span>
            </span>
          </div>
          <span>{shareCount} shares</span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-1">
            <button
              onClick={handleLike}
              disabled={!session}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                liked
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              } ${!session ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <FontAwesomeIcon icon={faThumbsUp} className="w-5 h-5" />
              <span>Like</span>
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <FontAwesomeIcon icon={faComment} className="w-5 h-5" />
              <span>Comment</span>
            </button>
            <button
              onClick={handleShare}
              disabled={!session}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                shared
                  ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              } ${!session ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <FontAwesomeIcon icon={faShare} className="w-5 h-5" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            <Comments pingId={ping.id} commentCount={ping._count.comments} />
          </div>
        )}
      </div>
    </div>
  )
}
