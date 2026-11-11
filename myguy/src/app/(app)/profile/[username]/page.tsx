'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faUserPlus, faUserMinus, faUserCheck, faEllipsisH, faShare, faCamera, faMapMarkerAlt, faLink, faEnvelope, faGlobe } from '@fortawesome/free-solid-svg-icons'

interface UserProfile {
  id: string
  username: string
  profile?: {
    displayName: string
    avatar: string | null
    coverImage: string | null
    bio: string
    location: string
    website: string
  }
  _count: {
    pings: number
    followers: number
    following: number
  }
}

export default function PublicProfilePage() {
  const params = useParams()
  const { data: session } = useSession()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFriend, setIsFriend] = useState(false)
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    fetchUserProfile()
  }, [params.username])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/users/${params.username}`)
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setIsFriend(data.isFriend || false)
        setIsPending(data.isPending || false)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    if (!session) return

    try {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: user?.id })
      })

      if (response.ok) {
        setIsPending(true)
      }
    } catch (error) {
      console.error('Error sending connection request:', error)
    }
  }

  const handleAccept = async () => {
    try {
      const response = await fetch(`/api/connections/${user?.id}/accept`, {
        method: 'POST'
      })

      if (response.ok) {
        setIsFriend(true)
        setIsPending(false)
      }
    } catch (error) {
      console.error('Error accepting connection:', error)
    }
  }

  const handleRemove = async () => {
    try {
      const response = await fetch(`/api/connections/${user?.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setIsFriend(false)
      }
    } catch (error) {
      console.error('Error removing connection:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">User Not Found</h2>
          <p className="text-gray-600 dark:text-gray-300">This user doesn't exist or has been deleted.</p>
        </div>
      </div>
    )
  }

  const isOwnProfile = session?.user?.username === user.username

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        {/* Cover Photo */}
        <div className="h-48 bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 relative">
          {user.profile?.coverImage ? (
            <img src={user.profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/30">
              <span className="text-6xl">🖼️</span>
            </div>
          )}
        </div>

        {/* Profile Header */}
        <div className="px-6 -mt-16 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6">
            {/* Profile Photo */}
            <div className="relative">
              {user.profile?.avatar ? (
                <img src={user.profile.avatar} alt="Profile" className="w-32 h-32 rounded-2xl object-cover border-4 border-white dark:border-gray-800 shadow-2xl" />
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-4xl border-4 border-white dark:border-gray-800 shadow-2xl">
                  {user.profile?.displayName?.charAt(0) || user.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-3">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user.profile?.displayName || user.username}
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400">@{user.username}</p>
                </div>
                {!isOwnProfile && (
                  <div className="flex space-x-2 mt-3 md:mt-0">
                    {isFriend ? (
                      <button
                        onClick={handleRemove}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                      >
                        <FontAwesomeIcon icon={faUserMinus} className="mr-2" />
                        Friends
                      </button>
                    ) : isPending ? (
                      <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold cursor-not-allowed">
                        <FontAwesomeIcon icon={faUserCheck} className="mr-2" />
                        Pending
                      </button>
                    ) : (
                      <button
                        onClick={handleConnect}
                        className="px-4 py-2 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition"
                      >
                        <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                        Add Friend
                      </button>
                    )}
                    <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                      <FontAwesomeIcon icon={faShare} />
                    </button>
                  </div>
                )}
              </div>

              {/* Bio and Info */}
              {user.profile?.bio && (
                <p className="text-gray-700 dark:text-gray-200 mb-3">{user.profile.bio}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
                {user.profile?.location && (
                  <div className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="w-4 h-4" />
                    <span>{user.profile.location}</span>
                  </div>
                )}
                {user.profile?.website && (
                  <div className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faLink} className="w-4 h-4" />
                    <a href={user.profile.website} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">
                      {user.profile.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl border border-orange-100 dark:border-orange-900/30">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{user._count.pings}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Pings</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 rounded-2xl border border-blue-100 dark:border-blue-900/30">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{user._count.followers}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Friends</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 rounded-2xl border border-green-100 dark:border-green-900/30">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{user._count.following}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Following</p>
            </div>
          </div>
        </div>

        {/* User's Pings */}
        <div className="px-6 pb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Pings</h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-100 dark:border-gray-700">
            <FontAwesomeIcon icon={faUser} className="text-4xl text-gray-400 dark:text-gray-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-300">No pings yet</p>
          </div>
        </div>
      </div>
    </main>
  )
}
