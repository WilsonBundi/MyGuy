'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBroadcastTower, faMicrophone, faVideo, faPhone, faUsers, faPlus, faXmark, faCircle } from '@fortawesome/free-solid-svg-icons'

interface Room {
  id: string
  name: string
  description: string | null
  type: string
  isLive: boolean
  host: {
    id: string
    username: string
    profile?: {
      displayName: string
      avatar: string | null
    }
  }
  _count: {
    participants: number
  }
}

export default function RoomsSection() {
  const { data: session } = useSession()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'audio'
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms?live=true')
      const data = await response.json()
      setRooms(data.rooms || [])
    } catch (error) {
      console.error('Error fetching rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        setRooms([data.room, ...rooms])
        setShowCreate(false)
        setFormData({ name: '', description: '', type: 'audio' })
      }
    } catch (error) {
      console.error('Error creating room:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'audio':
        return faBroadcastTower
      case 'video':
        return faVideo
      case 'voice':
        return faPhone
      default:
        return faBroadcastTower
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'audio':
        return 'Audio Room'
      case 'video':
        return 'Video Room'
      case 'voice':
        return 'Voice Room'
      default:
        return 'Room'
    }
  }

  const handleJoin = (roomId: string) => {
    // TODO: Implement room joining logic
    alert('Room joining coming soon!')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FontAwesomeIcon icon={faBroadcastTower} className="text-primary-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Live Rooms</h3>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition flex items-center space-x-2"
        >
          <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
          <span>Create Room</span>
        </button>
      </div>

      {/* Create Room Modal */}
      {showCreate && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Create Room</h4>
            <button
              onClick={() => setShowCreate(false)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleCreate}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Room Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="What's this room about?"
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white"
                required
                maxLength={100}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your room..."
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white"
                rows={2}
                maxLength={500}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Room Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'audio' })}
                  className={`p-3 rounded-lg border-2 transition ${
                    formData.type === 'audio'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <FontAwesomeIcon icon={faBroadcastTower} className="w-5 h-5 mb-1 text-gray-700 dark:text-gray-300" />
                  <p className="text-xs text-gray-600 dark:text-gray-300">Audio</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'video' })}
                  className={`p-3 rounded-lg border-2 transition ${
                    formData.type === 'video'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <FontAwesomeIcon icon={faVideo} className="w-5 h-5 mb-1 text-gray-700 dark:text-gray-300" />
                  <p className="text-xs text-gray-600 dark:text-gray-300">Video</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'voice' })}
                  className={`p-3 rounded-lg border-2 transition ${
                    formData.type === 'voice'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <FontAwesomeIcon icon={faPhone} className="w-5 h-5 mb-1 text-gray-700 dark:text-gray-300" />
                  <p className="text-xs text-gray-600 dark:text-gray-300">Voice</p>
                </button>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={!formData.name || submitting}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating...' : 'Start Room'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rooms List */}
      {rooms.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
          <FontAwesomeIcon icon={faBroadcastTower} className="text-4xl text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Live Rooms</h3>
          <p className="text-gray-600 dark:text-gray-300">Start a live conversation!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rooms.map((room) => (
            <div key={room.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                    <FontAwesomeIcon icon={getIcon(room.type)} className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                      <span>{room.name}</span>
                      {room.isLive && (
                        <span className="flex items-center space-x-1">
                          <FontAwesomeIcon icon={faCircle} className="w-2 h-2 text-red-500" />
                          <span className="text-xs text-red-500">LIVE</span>
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{getTypeLabel(room.type)}</p>
                  </div>
                </div>
              </div>
              {room.description && (
                <p className="text-gray-600 dark:text-gray-300 mb-4">{room.description}</p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <FontAwesomeIcon icon={faUsers} className="w-4 h-4" />
                  <span>{room._count.participants} participants</span>
                </div>
                <button
                  onClick={() => handleJoin(room.id)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition"
                >
                  Join Room
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
