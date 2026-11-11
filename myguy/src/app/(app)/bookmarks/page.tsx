'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBookmark, faFolder, faSpinner, faTrash } from '@fortawesome/free-solid-svg-icons'

interface Bookmark {
  id: string
  folder: string | null
  createdAt: string
  ping: {
    id: string
    content: string
    createdAt: string
    author: {
      id: string
      username: string
      profile?: {
        displayName: string
        avatar: string | null
      }
    }
  }
}

export default function BookmarksPage() {
  const { data: session } = useSession()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)

  useEffect(() => {
    if (session) {
      fetchBookmarks()
    }
  }, [session, selectedFolder])

  const fetchBookmarks = async () => {
    try {
      const url = selectedFolder
        ? `/api/bookmarks?folder=${encodeURIComponent(selectedFolder)}`
        : '/api/bookmarks'
      const response = await fetch(url)
      const data = await response.json()
      setBookmarks(data.bookmarks || [])
    } catch (error) {
      console.error('Error fetching bookmarks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (bookmarkId: string) => {
    try {
      await fetch(`/api/bookmarks/${bookmarkId}`, { method: 'DELETE' })
      setBookmarks(bookmarks.filter(b => b.id !== bookmarkId))
    } catch (error) {
      console.error('Error removing bookmark:', error)
    }
  }

  const folders = ['Favorites', 'To Read', 'Inspiration', 'Humor']

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} className="w-12 h-12 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Bookmarks</h1>
          <p className="text-gray-600 dark:text-gray-300">Your saved Pings</p>
        </div>

        {/* Folder Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedFolder(null)}
            className={`px-4 py-2 rounded-xl font-medium transition ${
              selectedFolder === null
                ? 'bg-orange-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            All
          </button>
          {folders.map((folder) => (
            <button
              key={folder}
              onClick={() => setSelectedFolder(folder)}
              className={`px-4 py-2 rounded-xl font-medium transition flex items-center space-x-2 ${
                selectedFolder === folder
                  ? 'bg-orange-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <FontAwesomeIcon icon={faFolder} className="w-4 h-4" />
              <span>{folder}</span>
            </button>
          ))}
        </div>

        {bookmarks.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-12 text-center">
            <FontAwesomeIcon icon={faBookmark} className="text-4xl text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Bookmarks Yet</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Save Pings to view them later
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookmarks.map((bookmark) => (
              <div key={bookmark.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold">
                      {bookmark.ping.author.profile?.displayName?.charAt(0) || bookmark.ping.author.username.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {bookmark.ping.author.profile?.displayName || bookmark.ping.author.username}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">@{bookmark.ping.author.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(bookmark.id)}
                    className="text-gray-400 hover:text-red-500 transition"
                  >
                    <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-gray-900 dark:text-white mb-2">{bookmark.ping.content}</p>
                {bookmark.folder && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <FontAwesomeIcon icon={faFolder} className="w-4 h-4" />
                    <span>{bookmark.folder}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
