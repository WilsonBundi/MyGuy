'use client'

import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArchive, faThumbtack, faBellSlash, faEllipsisVertical } from '@fortawesome/free-solid-svg-icons'

interface ChatActionsProps {
  chatId: string
  onRefresh?: () => void
}

export default function ChatActions({ chatId, onRefresh }: ChatActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleArchive = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/chats/${chatId}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: true })
      })
      if (response.ok) {
        onRefresh?.()
      }
    } catch (error) {
      console.error('Error archiving chat:', error)
    } finally {
      setLoading(false)
      setIsOpen(false)
    }
  }

  const handlePin = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/chats/${chatId}/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: true })
      })
      if (response.ok) {
        onRefresh?.()
      }
    } catch (error) {
      console.error('Error pinning chat:', error)
    } finally {
      setLoading(false)
      setIsOpen(false)
    }
  }

  const handleMute = async () => {
    setLoading(true)
    try {
      // Mute for 24 hours
      const muteUntil = new Date()
      muteUntil.setHours(muteUntil.getHours() + 24)

      const response = await fetch(`/api/chats/${chatId}/mute`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ muteUntil: muteUntil.toISOString() })
      })
      if (response.ok) {
        onRefresh?.()
      }
    } catch (error) {
      console.error('Error muting chat:', error)
    } finally {
      setLoading(false)
      setIsOpen(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
      >
        <FontAwesomeIcon icon={faEllipsisVertical} className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-20 py-2 w-48">
            <button
              onClick={handlePin}
              disabled={loading}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 text-gray-700 dark:text-gray-300 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faThumbtack} className="w-4 h-4" />
              <span>Pin Chat</span>
            </button>
            <button
              onClick={handleMute}
              disabled={loading}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 text-gray-700 dark:text-gray-300 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faBellSlash} className="w-4 h-4" />
              <span>Mute 24h</span>
            </button>
            <button
              onClick={handleArchive}
              disabled={loading}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 text-gray-700 dark:text-gray-300 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faArchive} className="w-4 h-4" />
              <span>Archive</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
