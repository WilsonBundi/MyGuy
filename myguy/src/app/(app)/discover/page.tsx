'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGlobe, faFire, faUserPlus, faUsers, faSpinner, faSearch, faHashtag, faMapMarkerAlt, faClock, faFilter, faSlidersH, faCheckCircle, faVideo, faCalendar, faStar, faLightbulb, faMusic, faGamepad, faBriefcase, faHeart, faPlane, faUtensils } from '@fortawesome/free-solid-svg-icons'

interface TrendingPing {
  id: string
  content: string
  engagementScore: number
  author: {
    username: string
    profile?: {
      displayName: string
    }
  }
  _count: {
    likes: number
    comments: number
    shares: number
  }
}

interface SuggestedUser {
  id: string
  username: string
  profile?: {
    displayName: string
    avatar: string | null
  }
}

interface SuggestedCircle {
  id: string
  name: string
  description: string | null
  _count: {
    members: number
  }
}

export default function DiscoverPage() {
  const { data: session } = useSession()
  const [trending, setTrending] = useState<TrendingPing[]>([])
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([])
  const [suggestedCircles, setSuggestedCircles] = useState<SuggestedCircle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'foryou' | 'trending' | 'people' | 'circles' | 'locations'>('foryou')
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'nearby'>('popular')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null)

  useEffect(() => {
    fetchDiscoverData()
  }, [session])

  const fetchDiscoverData = async () => {
    try {
      const [trendingRes, suggestionsRes] = await Promise.all([
        fetch('/api/discover/trending'),
        fetch('/api/discover/suggestions')
      ])

      const trendingData = await trendingRes.json()
      const suggestionsData = await suggestionsRes.json()

      setTrending(trendingData.trending || [])
      setSuggestedUsers(suggestionsData.users || [])
      setSuggestedCircles(suggestionsData.circles || [])
    } catch (error) {
      console.error('Error fetching discover data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async (userId: string) => {
    try {
      await fetch('/api/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ receiverId: userId })
      })
      setSuggestedUsers(suggestedUsers.filter(u => u.id !== userId))
    } catch (error) {
      console.error('Error connecting:', error)
    }
  }

  const countries = [
    { name: 'Kenya', flag: '🇰🇪', users: '125K', region: 'Africa' },
    { name: 'Brazil', flag: '🇧🇷', users: '98K', region: 'South America' },
    { name: 'Japan', flag: '🇯🇵', users: '87K', region: 'Asia' },
    { name: 'Germany', flag: '🇩🇪', users: '76K', region: 'Europe' },
    { name: 'India', flag: '🇮🇳', users: '234K', region: 'Asia' },
    { name: 'USA', flag: '🇺🇸', users: '456K', region: 'North America' },
    { name: 'UK', flag: '🇬🇧', users: '89K', region: 'Europe' },
    { name: 'Nigeria', flag: '🇳🇬', users: '112K', region: 'Africa' }
  ]

  const categories = [
    { id: 'all', name: 'All', icon: faGlobe },
    { id: 'tech', name: 'Technology', icon: faLightbulb },
    { id: 'music', name: 'Music', icon: faMusic },
    { id: 'gaming', name: 'Gaming', icon: faGamepad },
    { id: 'business', name: 'Business', icon: faBriefcase },
    { id: 'lifestyle', name: 'Lifestyle', icon: faHeart },
    { id: 'travel', name: 'Travel', icon: faPlane },
    { id: 'food', name: 'Food', icon: faUtensils }
  ]

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'pt', name: 'Portuguese', flag: '🇧🇷' },
    { code: 'sw', name: 'Swahili', flag: '🇰🇪' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' }
  ]

  const liveRooms = [
    { id: 1, name: 'Tech Talk Live', host: 'Alex', viewers: 234, category: 'Technology' },
    { id: 2, name: 'Music Jam Session', host: 'Bella', viewers: 156, category: 'Music' },
    { id: 3, name: 'Gaming Tournament', host: 'Chris', viewers: 445, category: 'Gaming' }
  ]

  const upcomingEvents = [
    { id: 1, name: 'Global Tech Summit', date: 'Dec 15', attendees: 1200, location: 'Virtual' },
    { id: 2, name: 'Music Festival 2024', date: 'Dec 20', attendees: 3500, location: 'Nairobi' },
    { id: 3, name: 'Startup Pitch Night', date: 'Dec 22', attendees: 500, location: 'Lagos' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} className="w-12 h-12 animate-spin text-orange-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading discoveries...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Discover</h1>
          <p className="text-gray-600 dark:text-gray-300">Explore trending content and find new connections worldwide</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search people, circles, topics, or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400"
            />
            <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition">
              <FontAwesomeIcon icon={faSlidersH} />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Category Filter */}
          <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-xl px-4 py-2 border border-gray-200 dark:border-gray-700">
            <FontAwesomeIcon icon={faFilter} className="text-orange-500" />
            <select
              value={selectedCategory || 'all'}
              onChange={(e) => setSelectedCategory(e.target.value === 'all' ? null : e.target.value)}
              className="bg-transparent text-gray-900 dark:text-white focus:outline-none cursor-pointer appearance-none pr-8"
            >
              <option value="all" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">All Categories</option>
              {categories.slice(1).map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Language Filter */}
          <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-xl px-4 py-2 border border-gray-200 dark:border-gray-700">
            <span className="text-lg">🌐</span>
            <select
              value={selectedLanguage || 'all'}
              onChange={(e) => setSelectedLanguage(e.target.value === 'all' ? null : e.target.value)}
              className="bg-transparent text-gray-900 dark:text-white focus:outline-none cursor-pointer appearance-none pr-8"
            >
              <option value="all" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">All Languages</option>
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{lang.flag} {lang.name}</option>
              ))}
            </select>
          </div>

          {/* Sort Options */}
          <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-xl px-4 py-2 border border-gray-200 dark:border-gray-700">
            <FontAwesomeIcon icon={faClock} className="text-orange-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-gray-900 dark:text-white focus:outline-none cursor-pointer appearance-none pr-8"
            >
              <option value="popular" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Most Popular</option>
              <option value="newest" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Newest First</option>
              <option value="nearby" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Nearby</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-8 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id === 'all' ? null : cat.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition whitespace-nowrap ${
                selectedCategory === cat.id || (cat.id === 'all' && !selectedCategory)
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <FontAwesomeIcon icon={cat.icon} className="w-4 h-4" />
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'foryou', label: 'For You', icon: faStar },
            { id: 'trending', label: 'Trending', icon: faFire },
            { id: 'people', label: 'People', icon: faUserPlus },
            { id: 'circles', label: 'Circles', icon: faUsers },
            { id: 'locations', label: 'Locations', icon: faMapMarkerAlt }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <FontAwesomeIcon icon={tab.icon} className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* For You */}
            {activeTab === 'foryou' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faStar} className="text-orange-500 text-xl" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">For You</h2>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Personalized recommendations</span>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 border border-orange-200 dark:border-orange-800">
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Content tailored to your interests, connections, and activity. Connect with more people to get better recommendations!
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {trending.slice(0, 4).map((ping) => (
                      <div key={ping.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm">
                            {ping.author.profile?.displayName?.charAt(0) || ping.author.username.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white text-sm truncate">
                            {ping.author.profile?.displayName || ping.author.username}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{ping.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Trending Now */}
            {(activeTab === 'foryou' || activeTab === 'trending') && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faFire} className="text-orange-500 text-xl" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Trending Now</h2>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Based on engagement</span>
                </div>

                {trending.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
                    <FontAwesomeIcon icon={faHashtag} className="text-4xl text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No trending content yet</h3>
                    <p className="text-gray-600 dark:text-gray-300">Be the first to start a trend!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {trending.map((ping, index) => (
                      <div key={ping.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-lg transition cursor-pointer border border-gray-100 dark:border-gray-700">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm">
                                {ping.author.profile?.displayName?.charAt(0) || ping.author.username.charAt(0)}
                              </div>
                              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                {ping.author.profile?.displayName || ping.author.username}
                              </h3>
                            </div>
                            <p className="text-gray-700 dark:text-gray-200 mb-3 line-clamp-2">
                              {ping.content}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center space-x-1">
                                <FontAwesomeIcon icon={faFire} className="text-orange-500" />
                                <span className="font-semibold text-orange-600 dark:text-orange-400">{ping.engagementScore}</span>
                                <span>engagement</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span>❤️</span>
                                <span>{ping._count.likes}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span>💬</span>
                                <span>{ping._count.comments}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* People You May Connect With */}
            {(activeTab === 'foryou' || activeTab === 'people') && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faUserPlus} className="text-orange-500 text-xl" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">People to Connect</h2>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Based on your interests</span>
                </div>

                {suggestedUsers.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
                    <FontAwesomeIcon icon={faUserPlus} className="text-4xl text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No suggestions yet</h3>
                    <p className="text-gray-600 dark:text-gray-300">Start connecting to get recommendations!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {suggestedUsers.map((user) => (
                      <div key={user.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-lg transition border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
                            {user.profile?.displayName?.charAt(0) || user.username.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                              {user.profile?.displayName || user.username}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleConnect(user.id)}
                          className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition shadow-md"
                        >
                          Connect
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Popular Circles */}
            {(activeTab === 'foryou' || activeTab === 'circles') && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faUsers} className="text-orange-500 text-xl" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Popular Circles</h2>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Join communities</span>
                </div>

                {suggestedCircles.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
                    <FontAwesomeIcon icon={faUsers} className="text-4xl text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No circles yet</h3>
                    <p className="text-gray-600 dark:text-gray-300">Create or join circles to see them here!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {suggestedCircles.map((circle) => (
                      <div key={circle.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-lg transition cursor-pointer border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
                              {circle.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">{circle.name}</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                                <FontAwesomeIcon icon={faUsers} className="w-3 h-3" />
                                <span>{circle._count.members} members</span>
                              </p>
                            </div>
                          </div>
                          <button className="px-6 py-2 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition shadow-md">
                            Join
                          </button>
                        </div>
                        {circle.description && (
                          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                            {circle.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Locations */}
            {activeTab === 'locations' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-orange-500 text-xl" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Discover by Location</h2>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Connect globally</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {countries.map((country) => (
                    <div key={country.name} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-lg transition cursor-pointer border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-4xl">{country.flag}</span>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{country.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{country.region}</p>
                          </div>
                        </div>
                        <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">{country.users} active users</span>
                        <button className="px-4 py-2 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition text-sm">
                          Explore
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Live Rooms */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faVideo} className="text-red-500 text-xl" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Live Rooms</h3>
                </div>
                <span className="flex items-center space-x-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded-full">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  <span>LIVE</span>
                </span>
              </div>
              <div className="space-y-3">
                {liveRooms.map((room) => (
                  <div key={room.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">{room.name}</h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{room.viewers} watching</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">by {room.host}</span>
                      <span className="text-xs text-orange-500 font-medium">{room.category}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2 border-2 border-orange-500 text-orange-500 rounded-xl font-semibold hover:bg-orange-50 dark:hover:bg-orange-900/20 transition">
                View All Rooms
              </button>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-4">
                <FontAwesomeIcon icon={faCalendar} className="text-orange-500 text-xl" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Upcoming Events</h3>
              </div>
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">{event.name}</h4>
                      <span className="text-xs text-orange-500 font-medium">{event.date}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{event.location}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{event.attendees} attending</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2 border-2 border-orange-500 text-orange-500 rounded-xl font-semibold hover:bg-orange-50 dark:hover:bg-orange-900/20 transition">
                View All Events
              </button>
            </div>

            {/* International Discovery */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-4">
                <FontAwesomeIcon icon={faGlobe} className="text-orange-500 text-xl" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">International Discovery</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                Connect with people around the world
              </p>
              <div className="space-y-3">
                {countries.map((country) => (
                  <div key={country.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{country.flag}</span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{country.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{country.users} users</p>
                      </div>
                    </div>
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-orange-500" />
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Topics */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-4">
                <FontAwesomeIcon icon={faHashtag} className="text-orange-500 text-xl" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Trending Topics</h3>
              </div>
              <div className="space-y-3">
                {[
                  { tag: '#MyGuy', count: '1.2K' },
                  { tag: '#Connections', count: '856' },
                  { tag: '#International', count: '642' },
                  { tag: '#Tech', count: '423' },
                  { tag: '#Lifestyle', count: '312' }
                ].map((topic) => (
                  <div key={topic.tag} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <FontAwesomeIcon icon={faHashtag} className="text-orange-500" />
                      <span className="font-medium text-gray-900 dark:text-white">{topic.tag}</span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{topic.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg">
              <h3 className="text-lg font-bold mb-2">Start Exploring</h3>
              <p className="text-white/90 text-sm mb-4">
                Discover new people, join circles, and explore trending content from around the world.
              </p>
              <button className="w-full bg-white text-orange-600 py-3 rounded-xl font-semibold hover:bg-gray-100 transition">
                Explore Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
