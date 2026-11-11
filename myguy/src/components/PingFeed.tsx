'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import PingCard from './PingCard'
import MediaUpload from './MediaUpload'
import PollCreator from './PollCreator'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCamera, faVideo, faLocationDot, faFaceSmile, faAt, faImage, faMusic, faClock, faUsers, faGlobe, faEllipsisH, faXmark } from '@fortawesome/free-solid-svg-icons'

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

export default function PingFeed() {
  const { data: session } = useSession()
  const [pings, setPings] = useState<Ping[]>([])
  const [loading, setLoading] = useState(true)
  const [newPing, setNewPing] = useState('')
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [location, setLocation] = useState('')
  const [taggedUsers, setTaggedUsers] = useState<string[]>([])
  const [hideLikeCount, setHideLikeCount] = useState(false)
  const [audience, setAudience] = useState<'everyone' | 'connections' | 'circle'>('everyone')
  const [scheduledFor, setScheduledFor] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showFullComposer, setShowFullComposer] = useState(false)

  useEffect(() => {
    fetchPings()
  }, [])

  const fetchPings = async () => {
    try {
      const response = await fetch('/api/pings')
      const data = await response.json()
      setPings(data.pings || [])
    } catch (error) {
      console.error('Error fetching pings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPing.trim() || !session) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/pings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newPing,
          mediaUrls,
          location,
          taggedUsers,
          hideLikeCount,
          audience
        })
      })

      if (response.ok) {
        const data = await response.json()
        setPings([data.ping, ...pings])
        setNewPing('')
        setMediaUrls([])
        setLocation('')
        setTaggedUsers([])
        setHideLikeCount(false)
        setShowFullComposer(false)
      }
    } catch (error) {
      console.error('Error creating ping:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Create Ping - Compact */}
      {session && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 mb-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-xl">
              {session.user?.name?.charAt(0) || 'U'}
            </div>
            <div 
              onClick={() => setShowFullComposer(true)}
              className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              <span className="text-gray-500 dark:text-gray-400">What's on your mind?</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <FontAwesomeIcon icon={faCamera} className="text-orange-500 w-5 h-5" />
                <span className="text-sm font-medium">Photo</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <FontAwesomeIcon icon={faVideo} className="text-green-500 w-5 h-5" />
                <span className="text-sm font-medium">Video</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <FontAwesomeIcon icon={faFaceSmile} className="text-yellow-500 w-5 h-5" />
                <span className="text-sm font-medium">Feeling</span>
              </button>
            </div>
            <button
              onClick={() => setShowFullComposer(true)}
              className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition shadow-md"
            >
              Post
            </button>
          </div>
        </div>
      )}

      {/* Full Composer Modal */}
      {showFullComposer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Post</h2>
              <button onClick={() => setShowFullComposer(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition">
                <FontAwesomeIcon icon={faXmark} className="text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-xl">
                  {session?.user?.name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newPing}
                    onChange={(e) => setNewPing(e.target.value)}
                    placeholder="What's on your mind?"
                    className="w-full p-4 border-none bg-transparent resize-none focus:outline-none text-gray-900 dark:text-white text-lg"
                    rows={4}
                    maxLength={500}
                  />
                </div>
              </div>

              {/* Media Preview */}
              {mediaUrls.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {mediaUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img src={url} alt="Media" className="w-full h-40 object-cover rounded-xl" />
                      <button
                        type="button"
                        onClick={() => setMediaUrls(mediaUrls.filter((_, i) => i !== index))}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition"
                      >
                        <FontAwesomeIcon icon={faXmark} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Additional Options */}
              <div className="flex flex-wrap gap-2 mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <MediaUpload
                  onUploadComplete={(url) => setMediaUrls([...mediaUrls, url])}
                  label="Add Photo/Video"
                />
                <button
                  type="button"
                  onClick={() => {
                    const mention = prompt('Mention a user (@username):')
                    if (mention) setNewPing(newPing + ` @${mention.replace('@', '')}`)
                  }}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <FontAwesomeIcon icon={faAt} className="w-4 h-4" />
                  <span className="text-sm">Tag People</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const gif = prompt('Add GIF URL:')
                    if (gif) setNewPing(newPing + ` ${gif}`)
                  }}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <FontAwesomeIcon icon={faImage} className="w-4 h-4" />
                  <span className="text-sm">GIF</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const music = prompt('Add music track:')
                    if (music) setNewPing(newPing + ` 🎵 ${music}`)
                  }}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <FontAwesomeIcon icon={faMusic} className="w-4 h-4" />
                  <span className="text-sm">Music</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const loc = prompt('Enter location:')
                    if (loc) setLocation(loc)
                  }}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <FontAwesomeIcon icon={faLocationDot} className="w-4 h-4" />
                  <span className="text-sm">{location ? location : 'Location'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const options = ['Everyone', 'Connections', 'Circle']
                    const selected = prompt(`Choose audience:\n1. Everyone\n2. Connections\n3. Circle\n\nEnter number (1-3):`)
                    if (selected === '1') setAudience('everyone')
                    if (selected === '2') setAudience('connections')
                    if (selected === '3') setAudience('circle')
                  }}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <FontAwesomeIcon icon={faGlobe} className="w-4 h-4" />
                  <span className="text-sm">Audience: {audience.charAt(0).toUpperCase() + audience.slice(1)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const schedule = prompt('Schedule for (YYYY-MM-DD HH:MM):')
                    if (schedule) setScheduledFor(schedule)
                  }}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <FontAwesomeIcon icon={faClock} className="w-4 h-4" />
                  <span className="text-sm">{scheduledFor ? 'Scheduled' : 'Schedule'}</span>
                </button>
                <PollCreator onPollCreated={fetchPings} />
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-500 dark:text-gray-400">{newPing.length}/500</span>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowFullComposer(false)}
                    className="px-6 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newPing.trim() || submitting}
                    className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pings Feed */}
      {pings.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-12 text-center border border-gray-100 dark:border-gray-700">
          <div className="text-6xl mb-4">✍️</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Pings Yet</h3>
          <p className="text-gray-600 dark:text-gray-300">Be the first to share a thought!</p>
        </div>
      ) : (
        pings.map((ping) => <PingCard key={ping.id} ping={ping} />)
      )}
    </div>
  )
}
