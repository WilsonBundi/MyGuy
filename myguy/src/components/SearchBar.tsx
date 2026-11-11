'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'

interface SearchResult {
  users: any[]
  pings: any[]
  circles: any[]
}

export default function SearchBar() {
  const { data: session } = useSession()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult>({ users: [], pings: [], circles: [] })
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query.trim()) {
        performSearch()
      } else {
        setResults({ users: [], pings: [], circles: [] })
        setShowResults(false)
      }
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [query, activeTab])

  const performSearch = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${activeTab}`)
      const data = await response.json()
      setResults(data)
      setShowResults(true)
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearSearch = () => {
    setQuery('')
    setResults({ users: [], pings: [], circles: [] })
    setShowResults(false)
  }

  return (
    <div className="relative w-full max-w-xl">
      <div className="relative">
        <FontAwesomeIcon 
          icon={faSearch} 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" 
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search MyGuy..."
          className="w-full pl-10 pr-10 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
          </button>
        )}
      </div>

      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {['all', 'users', 'pings', 'circles'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-2 text-sm font-medium capitalize transition ${
                  activeTab === tab
                    ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Searching...
            </div>
          ) : (
            <div className="p-4">
              {results.users.length === 0 && results.pings.length === 0 && results.circles.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No results found for "{query}"
                </div>
              ) : (
                <>
                  {/* Users */}
                  {(activeTab === 'all' || activeTab === 'users') && results.users.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Users</h4>
                      <div className="space-y-2">
                        {results.users.map((user) => (
                          <Link
                            key={user.id}
                            href={`/profile/${user.username}`}
                            className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                            onClick={() => setShowResults(false)}
                          >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                              {user.profile?.displayName?.charAt(0) || user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {user.profile?.displayName || user.username}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pings */}
                  {(activeTab === 'all' || activeTab === 'pings') && results.pings.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Pings</h4>
                      <div className="space-y-2">
                        {results.pings.map((ping) => (
                          <div key={ping.id} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                            <div className="flex items-center space-x-2 mb-1">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-xs">
                                {ping.author.profile?.displayName?.charAt(0) || ping.author.username.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {ping.author.profile?.displayName || ping.author.username}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{ping.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Circles */}
                  {(activeTab === 'all' || activeTab === 'circles') && results.circles.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Circles</h4>
                      <div className="space-y-2">
                        {results.circles.map((circle) => (
                          <Link
                            key={circle.id}
                            href={`/circles/${circle.id}`}
                            className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                            onClick={() => setShowResults(false)}
                          >
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white">
                              👥
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white">{circle.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{circle.memberCount} members</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
