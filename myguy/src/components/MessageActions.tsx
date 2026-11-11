'use client'

import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStar, faReply, faForward, faTrash, faCopy, faEllipsisVertical } from '@fortawesome/free-solid-svg-icons'

interface MessageActionsProps {
  messageId: string
  onReply?: () => void
  onCopy?: (content: string) => void
  content: string
}

export default function MessageActions({ messageId, onReply, onCopy, content }: MessageActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleStar = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/messages/${messageId}/star`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred: true })
      })
      if (response.ok) {
        // Handle success
      }
    } catch (error) {
      console.error('Error starring message:', error)
    } finally {
      setLoading(false)
      setIsOpen(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this message for everyone?')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        // Handle success - reload messages
        window.location.reload()
      }
    } catch (error) {
      console.error('Error deleting message:', error)
    } finally {
      setLoading(false)
      setIsOpen(false)
    }
  }

  const handleCopy = () => {
    if (onCopy) {
      onCopy(content)
    } else {
      navigator.clipboard.writeText(content)
    }
    setIsOpen(false)
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
              onClick={() => {
                onReply?.()
                setIsOpen(false)
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 text-gray-700 dark:text-gray-300"
            >
              <FontAwesomeIcon icon={faReply} className="w-4 h-4" />
              <span>Reply</span>
            </button>
            <button
              onClick={handleCopy}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 text-gray-700 dark:text-gray-300"
            >
              <FontAwesomeIcon icon={faCopy} className="w-4 h-4" />
              <span>Copy</span>
            </button>
            <button
              onClick={handleStar}
              disabled={loading}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 text-gray-700 dark:text-gray-300 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faStar} className="w-4 h-4" />
              <span>Star</span>
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 text-red-600 dark:text-red-400 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
