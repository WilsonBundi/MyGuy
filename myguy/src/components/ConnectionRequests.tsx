'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUserPlus, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons'

interface Connection {
  id: string
  status: string
  connectedTo: {
    id: string
    username: string
    profile?: {
      displayName: string
      avatar: string | null
    }
  }
}

export default function ConnectionRequests() {
  const { data: session } = useSession()
  const [requests, setRequests] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session) {
      fetchRequests()
    }
  }, [session])

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/connections?status=pending')
      const data = await response.json()
      setRequests(data.connections || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'accepted' })
      })

      if (response.ok) {
        setRequests(requests.filter(req => req.id !== connectionId))
      }
    } catch (error) {
      console.error('Error accepting request:', error)
    }
  }

  const handleReject = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setRequests(requests.filter(req => req.id !== connectionId))
      }
    } catch (error) {
      console.error('Error rejecting request:', error)
    }
  }

  if (loading) {
    return <div className="text-gray-500 dark:text-gray-400">Loading...</div>
  }

  if (requests.length === 0) {
    return null
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <FontAwesomeIcon icon={faUserPlus} className="text-primary-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Connection Requests ({requests.length})
        </h3>
      </div>

      <div className="space-y-3">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                {request.connectedTo.profile?.displayName?.charAt(0) ||
                 request.connectedTo.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {request.connectedTo.profile?.displayName || request.connectedTo.username}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  @{request.connectedTo.username}
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => handleAccept(request.id)}
                className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                title="Accept"
              >
                <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleReject(request.id)}
                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                title="Reject"
              >
                <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
