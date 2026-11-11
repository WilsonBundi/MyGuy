'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBookmark, faFolder, faXmark } from '@fortawesome/free-solid-svg-icons'

interface BookmarkProps {
  pingId: string
  isBookmarked?: boolean
}

export default function BookmarkButton({ pingId, isBookmarked: initialBookmarked = false }: BookmarkProps) {
  const { data: session } = useSession()
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState('')
  const [loading, setLoading] = useState(false)

  const handleBookmark = async (folder?: string) => {
    if (!session) return

    setLoading(true)
    try {
      if (isBookmarked) {
        await fetch(`/api/bookmarks/${pingId}`, { method: 'DELETE' })
        setIsBookmarked(false)
      } else {
        await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pingId, folder })
        })
        setIsBookmarked(true)
      }
    } catch (error) {
      console.error('Error bookmarking:', error)
    } finally {
      setLoading(false)
      setShowFolderModal(false)
    }
  }

  const folders = ['Favorites', 'To Read', 'Inspiration', 'Humor']

  return (
    <>
      <button
        onClick={() => {
          if (isBookmarked) {
            handleBookmark()
          } else {
            setShowFolderModal(true)
          }
        }}
        disabled={loading}
        className={`flex items-center space-x-1 text-sm transition ${
          isBookmarked
            ? 'text-primary-600 dark:text-primary-400'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
      >
        <FontAwesomeIcon icon={faBookmark} className={isBookmarked ? 'fas' : 'far'} />
        <span>Save</span>
      </button>

      {showFolderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Save to</h3>
              <button
                onClick={() => setShowFolderModal(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              <button
                onClick={() => handleBookmark()}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
              >
                <FontAwesomeIcon icon={faBookmark} className="w-5 h-5 text-gray-500" />
                <span className="text-gray-900 dark:text-white">Saved Items</span>
              </button>

              {folders.map((folder) => (
                <button
                  key={folder}
                  onClick={() => handleBookmark(folder)}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                >
                  <FontAwesomeIcon icon={faFolder} className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-900 dark:text-white">{folder}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowFolderModal(false)}
              className="w-full py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}
