'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUserPlus, faCheck, faXmark, faClock } from '@fortawesome/free-solid-svg-icons'

interface MessageRequest {
  id: string
  isGroup: boolean
  groupName: string | null
  members: {
    user: {
      id: string
      username: string
      profile?: {
        displayName: string
        avatar: string | null
      }
    }
  }[]
  _count: {
    messages: number
  }
}

export default function MessageRequests() {
  const { data: session } = useSession()
  const [requests, setRequests] = useState<MessageRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showRequests, setShowRequests] = useState(false)

  useEffect(() => {
    if (session) {
      fetchRequests()
    }
  }, [session])

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/message-requests')
      const data = await response.json()
      setRequests(data.requests || [])
    } catch (error) {
      console.error('Error fetching message requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (chatId: string, action: 'accept' | 'decline') => {
    try {
      await fetch('/api/message-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ chatId, action })
      })

      setRequests(requests.filter(r => r.id !== chatId))
    } catch (error) {
      console.error('Error handling message request:', error)
    }
  }

  const getRequestName = (request: MessageRequest) => {
    if (request.isGroup) {
      return request.groupName || 'Group'
    }
    const otherMember = request.members.find(m => m.user.id !== session?.user?.id)
    return otherMember?.user.profile?.displayName || otherMember?.user.username || 'Unknown'
  }

  if (loading) {
    return null
  }

  if (requests.length === 0) {
    return null
  }

  return (
    <div className="mb-6">
      <button
        onClick={() => setShowRequests(!showRequests)}
        className="w-full bg-gradient-to-r from-accent-500 to-accent-600 rounded-xl p-4 text-white mb-4 hover:shadow-md transition"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faUserPlus} className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold">Message Requests</h3>
              <p className="text-white/80 text-sm">{requests.length} pending</p>
            </div>
          </div>
          <FontAwesomeIcon icon={faClock} className="w-5 h-5" />
        </div>
      </button>

      {showRequests && (
        <div className="space-y-2">
          {requests.map((request) => (
            <div key={request.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white font-bold text-lg">
                    {getRequestName(request).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{getRequestName(request)}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {request.isGroup ? 'Group invitation' : 'Wants to message you'}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAction(request.id, 'decline')}
                    className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                  >
                    <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleAction(request.id, 'accept')}
                    className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition"
                  >
                    <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
