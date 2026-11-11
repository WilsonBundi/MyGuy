'use client'

import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircle } from '@fortawesome/free-solid-svg-icons'

interface UserStatusProps {
  userId: string
  showLastSeen?: boolean
}

export default function UserStatus({ userId, showLastSeen = true }: UserStatusProps) {
  const [status, setStatus] = useState<{ isOnline: boolean; lastActiveAt: string | null } | null>(null)

  useEffect(() => {
    fetchStatus()
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [userId])

  const fetchStatus = async () => {
    try {
      const response = await fetch(`/api/user/status?userId=${userId}`)
      const data = await response.json()
      setStatus(data.user)
    } catch (error) {
      console.error('Error fetching user status:', error)
    }
  }

  const formatLastSeen = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (!status) {
    return <span className="text-xs text-gray-500 dark:text-gray-400">Loading...</span>
  }

  if (status.isOnline) {
    return (
      <div className="flex items-center space-x-1">
        <FontAwesomeIcon icon={faCircle} className="w-2 h-2 text-orange-500" />
        <span className="text-xs text-orange-600 dark:text-orange-400">Online</span>
      </div>
    )
  }

  if (showLastSeen && status.lastActiveAt) {
    const lastSeen = formatLastSeen(status.lastActiveAt)
    return (
      <div className="flex items-center space-x-1">
        <FontAwesomeIcon icon={faCircle} className="w-2 h-2 text-gray-400" />
        <span className="text-xs text-gray-500 dark:text-gray-400">Last seen {lastSeen}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-1">
      <FontAwesomeIcon icon={faCircle} className="w-2 h-2 text-gray-400" />
      <span className="text-xs text-gray-500 dark:text-gray-400">Offline</span>
    </div>
  )
}
