'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCamera, faXmark, faHeart, faComment, faEye, faMapMarkerAlt, faMusic, faVideo, faUsers, faClock, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'

interface Moment {
  id: string
  mediaUrl: string
  mediaType: string
  caption: string | null
  location: string | null
  music: string | null
  musicPreviewUrl: string | null
  expiresAt: string
  createdAt: string
  views: number
  _count: {
    reactions: number
    replies: number
  }
  author: {
    id: string
    username: string
    profile?: {
      displayName: string
      avatar: string | null
    }
  }
}

export default function MomentsFeed() {
  const { data: session } = useSession()
  const [moments, setMoments] = useState<Moment[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image')
  const [caption, setCaption] = useState('')
  const [location, setLocation] = useState('')
  const [music, setMusic] = useState('')
  const [audience, setAudience] = useState<'everyone' | 'connections' | 'circle'>('everyone')
  const [duration, setDuration] = useState<'24h' | '12h' | '6h'>('24h')
  const [uploading, setUploading] = useState(false)
  const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null)
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([])
  const [musicSuggestions, setMusicSuggestions] = useState<string[]>([])
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const [showMusicSuggestions, setShowMusicSuggestions] = useState(false)
  const [musicPreviewUrl, setMusicPreviewUrl] = useState('')
  const [searchingLocation, setSearchingLocation] = useState(false)
  const [searchingMusic, setSearchingMusic] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState<any[]>([])
  const [showComments, setShowComments] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const handleNextMoment = () => {
    if (currentIndex < moments.length - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      setSelectedMoment(moments[nextIndex])
      setCommentText('')
      setComments([])
      setShowComments(false)
    }
  }

  const handlePreviousMoment = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1
      setCurrentIndex(prevIndex)
      setSelectedMoment(moments[prevIndex])
      setCommentText('')
      setComments([])
      setShowComments(false)
    }
  }

  useEffect(() => {
    if (selectedMoment) {
      const index = moments.findIndex(m => m.id === selectedMoment.id)
      setCurrentIndex(index)
    }
  }, [selectedMoment, moments])

  const fetchComments = async (momentId: string) => {
    try {
      const response = await fetch(`/api/moments/${momentId}/replies`)
      const data = await response.json()
      setComments(data.replies || [])
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const handleComment = async () => {
    if (!commentText.trim() || !selectedMoment || !session) return

    try {
      const response = await fetch(`/api/moments/${selectedMoment.id}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: commentText })
      })

      if (response.ok) {
        const data = await response.json()
        setComments([...comments, data.reply])
        setCommentText('')
      }
    } catch (error) {
      console.error('Error posting comment:', error)
    }
  }

  // Comprehensive locations worldwide
  const popularLocations = [
    // Africa
    'Nairobi, Kenya', 'Mombasa, Kenya', 'Kisumu, Kenya',
    'Cairo, Egypt', 'Lagos, Nigeria', 'Johannesburg, South Africa',
    'Cape Town, South Africa', 'Accra, Ghana', 'Dar es Salaam, Tanzania',
    'Addis Ababa, Ethiopia', 'Casablanca, Morocco', 'Dakar, Senegal',
    'Abuja, Nigeria', 'Kampala, Uganda', 'Harare, Zimbabwe',
    // North America
    'New York, USA', 'Los Angeles, USA', 'Chicago, USA', 'Miami, USA',
    'Toronto, Canada', 'Vancouver, Canada', 'Montreal, Canada',
    'Mexico City, Mexico', 'Guadalajara, Mexico',
    // South America
    'São Paulo, Brazil', 'Rio de Janeiro, Brazil', 'Buenos Aires, Argentina',
    'Lima, Peru', 'Bogotá, Colombia', 'Santiago, Chile',
    'Caracas, Venezuela', 'Quito, Ecuador',
    // Europe
    'London, UK', 'Paris, France', 'Berlin, Germany', 'Rome, Italy',
    'Madrid, Spain', 'Amsterdam, Netherlands', 'Barcelona, Spain',
    'Vienna, Austria', 'Prague, Czech Republic', 'Warsaw, Poland',
    'Athens, Greece', 'Dublin, Ireland', 'Stockholm, Sweden',
    'Copenhagen, Denmark', 'Oslo, Norway', 'Helsinki, Finland',
    'Lisbon, Portugal', 'Zurich, Switzerland', 'Brussels, Belgium',
    // Asia
    'Tokyo, Japan', 'Seoul, South Korea', 'Beijing, China', 'Shanghai, China',
    'Singapore', 'Hong Kong', 'Bangkok, Thailand', 'Mumbai, India',
    'Delhi, India', 'Jakarta, Indonesia', 'Manila, Philippines',
    'Kuala Lumpur, Malaysia', 'Dubai, UAE', 'Abu Dhabi, UAE',
    'Doha, Qatar', 'Riyadh, Saudi Arabia', 'Tel Aviv, Israel',
    'Ho Chi Minh City, Vietnam', 'Hanoi, Vietnam',
    // Oceania
    'Sydney, Australia', 'Melbourne, Australia', 'Brisbane, Australia',
    'Auckland, New Zealand', 'Wellington, New Zealand',
    'Fiji', 'Tahiti'
  ]

  // Comprehensive music from around the world
  const popularMusic = [
    // Pop
    'Blinding Lights - The Weeknd', 'Shape of You - Ed Sheeran',
    'Dance Monkey - Tones and I', 'Levitating - Dua Lipa',
    'Stay - Justin Bieber', 'Heat Waves - Glass Animals',
    'As It Was - Harry Styles', 'Anti-Hero - Taylor Swift',
    'Flowers - Miley Cyrus', 'Vampire - Olivia Rodrigo',
    'Cruel Summer - Taylor Swift', 'Last Night - Morgan Wallen',
    // Hip Hop/Rap
    'God\'s Plan - Drake', 'HUMBLE. - Kendrick Lamar',
    'Old Town Road - Lil Nas X', 'Sicko Mode - Travis Scott',
    'Money - Cardi B', 'Rockstar - Post Malone',
    'Bad Guy - Billie Eilish', 'In Da Club - 50 Cent',
    // Afrobeats/African
    'Calm Down - Rema', 'Unavailable - Davido',
    'Ku Lo Sa - Oxlade', 'Essence - Wizkid',
    'Terminator - Ayra Starr', 'Rush - Ayra Starr',
    'Peru - Fireboy DML', 'Jowo - Wizkid',
    'Koroba - Tiwa Savage', 'Alte - Odunsi',
    // Latin
    'Despacito - Luis Fonsi', 'Mi Gente - J Balvin',
    'Dakiti - Bad Bunny', 'Tití Me Preguntó - Bad Bunny',
    'Me Porto Bonito - Bad Bunny', 'Bichota - Karol G',
    'TQG - Karol G', 'Provenza - Karol G',
    // K-Pop
    'Dynamite - BTS', 'Butter - BTS', 'Blackpink - Pink Venom',
    'BLACKPINK - Kill This Love', 'BTS - Boy With Luv',
    'BTS - Fake Love', 'BLACKPINK - How You Like That',
    // Reggae/Dancehall
    'One Love - Bob Marley', 'No Woman No Cry - Bob Marley',
    'Three Little Birds - Bob Marley', 'Stir It Up - Bob Marley',
    'Girls Like You - Bob Marley', 'Buffalo Soldier - Bob Marley',
    // Electronic/Dance
    'Wake Me Up - Avicii', 'Levels - Avicii',
    'Titanium - David Guetta', 'Get Lucky - Daft Punk',
    'One More Time - Daft Punk', 'Closer - The Chainsmokers',
    // Rock
    'Bohemian Rhapsody - Queen', 'Stairway to Heaven - Led Zeppelin',
    'Hotel California - Eagles', 'Sweet Child O\' Mine - Guns N\' Roses',
    'Smells Like Teen Spirit - Nirvana',
    // R&B/Soul
    'Thinking Out Loud - Ed Sheeran', 'All of Me - John Legend',
    'Hello - Adele', 'Someone Like You - Adele',
    'When I Was Your Man - Bruno Mars'
  ]

  const handleLocationChange = async (value: string) => {
    setLocation(value)
    if (value.length > 2) {
      setSearchingLocation(true)
      try {
        // Use OpenStreetMap Nominatim API for worldwide location search
        // This covers cities, towns, villages, and even small settlements globally
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=10&addressdetails=1`
        )
        const data = await response.json()
        
        if (data && data.length > 0) {
          const locations = data.map((place: any) => {
            // Format the location name nicely
            const parts = []
            if (place.display_name) {
              // Take the first few parts for cleaner display
              const nameParts = place.display_name.split(',').slice(0, 3)
              parts.push(nameParts.join(',').trim())
            }
            return parts[0] || place.display_name
          })
          setLocationSuggestions(locations)
          setShowLocationSuggestions(true)
        } else {
          setLocationSuggestions([])
          setShowLocationSuggestions(false)
        }
      } catch (error) {
        console.error('Error searching locations:', error)
        setLocationSuggestions([])
      } finally {
        setSearchingLocation(false)
      }
    } else {
      setShowLocationSuggestions(false)
    }
  }

  const handleMusicChange = async (value: string) => {
    setMusic(value)
    if (value.length > 2) {
      setSearchingMusic(true)
      try {
        // Use iTunes Search API for music (free, no API key required)
        // Has a large catalog of songs worldwide
        const response = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(value)}&media=music&entity=song&limit=10`
        )
        const data = await response.json()
        
        if (data && data.results && data.results.length > 0) {
          const songs = data.results.map((song: any) => {
            return `${song.trackName} - ${song.artistName}`
          })
          setMusicSuggestions(songs)
          setShowMusicSuggestions(true)
        } else {
          setMusicSuggestions([])
          setShowMusicSuggestions(false)
        }
      } catch (error) {
        console.error('Error searching music:', error)
        setMusicSuggestions([])
      } finally {
        setSearchingMusic(false)
      }
    } else {
      setShowMusicSuggestions(false)
      setMusicPreviewUrl('')
    }
  }

  const handleMusicSelect = async (song: string) => {
    setMusic(song)
    setShowMusicSuggestions(false)
    
    // Get the preview URL from iTunes
    try {
      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(song)}&media=music&entity=song&limit=1`
      )
      const data = await response.json()
      if (data && data.results && data.results.length > 0) {
        setMusicPreviewUrl(data.results[0].previewUrl)
      }
    } catch (error) {
      console.error('Error getting music preview:', error)
    }
  }

  useEffect(() => {
    if (session) {
      fetchMoments()
    }
  }, [session])

  const fetchMoments = async () => {
    try {
      const response = await fetch('/api/moments')
      const data = await response.json()
      console.log('Fetched moments:', data.moments)
      setMoments(data.moments || [])
    } catch (error) {
      console.error('Error fetching moments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('handleUpload called')
    console.log('mediaFile:', mediaFile)
    console.log('session:', session)

    if (!mediaFile || !session) {
      console.error('Missing file or session')
      return
    }

    setUploading(true)
    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', mediaFile)
      formData.append('mediaType', mediaType)
      formData.append('caption', caption)
      formData.append('location', location)
      formData.append('music', music)
      formData.append('musicPreviewUrl', musicPreviewUrl)
      formData.append('audience', audience)
      formData.append('duration', duration)

      console.log('Sending request to /api/moments')
      const response = await fetch('/api/moments', {
        method: 'POST',
        body: formData
      })

      console.log('Response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Moment created:', data.moment)
        setMoments([data.moment, ...moments])
        setMediaFile(null)
        setMediaUrl('')
        setCaption('')
        setLocation('')
        setMusic('')
        setAudience('everyone')
        setDuration('24h')
        setShowUpload(false)
      } else {
        const error = await response.json()
        console.error('Failed to create moment:', error)
        alert('Failed to create moment: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error creating moment:', error)
      alert('Error creating moment: ' + (error as Error).message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Moments</h3>
        <button
          onClick={() => setShowUpload(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition flex items-center space-x-2"
        >
          <FontAwesomeIcon icon={faCamera} className="w-4 h-4" />
          <span>Create Moment</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading moments...</div>
      ) : (
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {moments.length === 0 ? (
            <div className="flex-shrink-0">
              <div 
                onClick={() => setShowUpload(true)}
                className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-xl border-2 border-dashed border-primary-300 dark:border-primary-700 flex items-center justify-center cursor-pointer hover:border-primary-500 transition"
              >
                <FontAwesomeIcon icon={faCamera} className="text-primary-400 dark:text-primary-600 text-2xl" />
              </div>
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1">Add your first moment</p>
            </div>
          ) : (
            moments.map((moment) => (
              <div
                key={moment.id}
                onClick={() => setSelectedMoment(moment)}
                className="flex-shrink-0 cursor-pointer"
              >
                <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-transparent hover:border-primary-500 transition relative">
                  {moment.mediaType === 'image' ? (
                    <img
                      src={moment.mediaUrl}
                      alt="Moment"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white">
                      <FontAwesomeIcon icon={faVideo} className="text-2xl" />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-4">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xl font-bold text-gray-900 dark:text-white">Create Moment</h4>
            <button
              onClick={() => setShowUpload(false)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
            >
              <FontAwesomeIcon icon={faXmark} className="w-6 h-6" />
            </button>
          </div>
          <form onSubmit={handleUpload}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Upload Photo or Video
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-primary-500 transition cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setMediaFile(file)
                      setMediaType(file.type.startsWith('video') ? 'video' : 'image')
                      const url = URL.createObjectURL(file)
                      setMediaUrl(url)
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  required
                />
                {!mediaUrl ? (
                  <div>
                    <FontAwesomeIcon icon={faCamera} className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3" />
                    <p className="text-gray-600 dark:text-gray-400 font-medium">
                      Click to upload photo or video
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                      JPG, PNG, GIF, MP4, WebM
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    {mediaType === 'image' ? (
                      <img src={mediaUrl} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                    ) : (
                      <video src={mediaUrl} className="max-h-64 mx-auto rounded-lg" controls />
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setMediaFile(null)
                        setMediaUrl('')
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition"
                    >
                      <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value as '24h' | '12h' | '6h')}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white"
              >
                <option value="24h">🕐 24 hours</option>
                <option value="12h">🕐 12 hours</option>
                <option value="6h">🕐 6 hours</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Caption
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption..."
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white resize-none"
                rows={3}
                maxLength={500}
              />
              <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">{caption.length}/500</div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="w-4 h-4 mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  placeholder="Search any location worldwide..."
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white"
                />
                {showLocationSuggestions && locationSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {searchingLocation ? (
                      <div className="px-4 py-2 text-gray-500 dark:text-gray-400 text-sm">
                        Searching...
                      </div>
                    ) : (
                      locationSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            setLocation(suggestion)
                            setShowLocationSuggestions(false)
                          }}
                          className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-white text-sm flex items-center space-x-2"
                        >
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="w-4 h-4 text-gray-400" />
                          <span>{suggestion}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FontAwesomeIcon icon={faMusic} className="w-4 h-4 mr-1" />
                  Music
                </label>
                <input
                  type="text"
                  value={music}
                  onChange={(e) => handleMusicChange(e.target.value)}
                  placeholder="Search any song worldwide..."
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white"
                />
                {musicPreviewUrl && (
                  <div className="mt-2">
                    <audio controls className="w-full h-10" src={musicPreviewUrl}>
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}
                {showMusicSuggestions && musicSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {searchingMusic ? (
                      <div className="px-4 py-2 text-gray-500 dark:text-gray-400 text-sm">
                        Searching...
                      </div>
                    ) : (
                      musicSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          onClick={() => handleMusicSelect(suggestion)}
                          className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-white text-sm flex items-center space-x-2"
                        >
                          <FontAwesomeIcon icon={faMusic} className="w-4 h-4 text-gray-400" />
                          <span>{suggestion}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FontAwesomeIcon icon={faUsers} className="w-4 h-4 mr-1" />
                Audience
              </label>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setAudience('everyone')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
                    audience === 'everyone'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Everyone
                </button>
                <button
                  type="button"
                  onClick={() => setAudience('connections')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
                    audience === 'connections'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Connections
                </button>
                <button
                  type="button"
                  onClick={() => setAudience('circle')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
                    audience === 'circle'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Circle
                </button>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowUpload(false)}
                className="flex-1 px-4 py-3 rounded-lg font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!mediaFile || uploading}
                className="flex-1 bg-primary-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {uploading ? (
                  <>
                    <FontAwesomeIcon icon={faClock} className="w-4 h-4 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCamera} className="w-4 h-4" />
                    <span>Share Moment</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Moment Viewer Modal */}
      {selectedMoment && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4" onClick={() => setSelectedMoment(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            {/* Media Section */}
            <div className="relative bg-black">
              {/* Previous Button */}
              {currentIndex > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePreviousMoment()
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-10 h-10 flex items-center justify-center transition backdrop-blur-md z-10"
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="w-5 h-5" />
                </button>
              )}

              {/* Next Button */}
              {currentIndex < moments.length - 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleNextMoment()
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-10 h-10 flex items-center justify-center transition backdrop-blur-md z-10"
                >
                  <FontAwesomeIcon icon={faChevronRight} className="w-5 h-5" />
                </button>
              )}

              {selectedMoment.mediaType === 'image' ? (
                <img
                  src={selectedMoment.mediaUrl}
                  alt="Moment"
                  className="w-full max-h-[50vh] object-contain"
                />
              ) : (
                <div className="w-full h-80 bg-gradient-to-br from-orange-400 via-red-500 to-purple-600 flex items-center justify-center text-white">
                  <FontAwesomeIcon icon={faVideo} className="text-5xl" />
                </div>
              )}
              <button
                onClick={() => setSelectedMoment(null)}
                className="absolute top-4 left-4 bg-black/40 hover:bg-black/60 text-white rounded-full w-10 h-10 flex items-center justify-center transition backdrop-blur-md"
              >
                <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
              </button>
              {/* Time Badge */}
              <div className="absolute bottom-4 left-4 bg-black/40 text-white px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md">
                <FontAwesomeIcon icon={faClock} className="w-3 h-3 mr-1" />
                {Math.ceil((new Date(selectedMoment.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60))}h left
              </div>
              {/* Navigation Dots */}
              {moments.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                  {moments.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-2 h-2 rounded-full transition ${
                        idx === currentIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="p-5">
              {/* Author Info */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {selectedMoment.author.profile?.avatar ? (
                    <img
                      src={selectedMoment.author.profile.avatar}
                      alt={selectedMoment.author.username}
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-primary-500 ring-offset-2"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-lg ring-2 ring-primary-500 ring-offset-2">
                      {selectedMoment.author.username?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{selectedMoment.author.profile?.displayName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">@{selectedMoment.author.username}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(selectedMoment.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Caption */}
              {selectedMoment.caption && (
                <p className="text-gray-800 dark:text-gray-200 mb-4 text-sm leading-relaxed">{selectedMoment.caption}</p>
              )}

              {/* Location */}
              {selectedMoment.location && (
                <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400 mb-3">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3.5 h-3.5 text-orange-500" />
                  <span>{selectedMoment.location}</span>
                </div>
              )}

              {/* Music Player */}
              {selectedMoment.music && (
                <div className="mb-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-3">
                  <div className="flex items-center space-x-2 text-xs text-gray-700 dark:text-gray-300 mb-2">
                    <FontAwesomeIcon icon={faMusic} className="w-3.5 h-3.5 text-orange-500" />
                    <span className="font-semibold">{selectedMoment.music}</span>
                  </div>
                  {selectedMoment.musicPreviewUrl && (
                    <audio 
                      controls 
                      className="w-full h-8 rounded-lg"
                      src={selectedMoment.musicPreviewUrl}
                      autoPlay
                    >
                      Your browser does not support the audio element.
                    </audio>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center space-x-4">
                  <button className="flex items-center space-x-1.5 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition">
                    <FontAwesomeIcon icon={faHeart} className="w-5 h-5" />
                    <span className="text-sm font-medium">{selectedMoment._count.reactions}</span>
                  </button>
                  <button 
                    onClick={() => {
                      setShowComments(!showComments)
                      if (!showComments) {
                        fetchComments(selectedMoment.id)
                      }
                    }}
                    className="flex items-center space-x-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition"
                  >
                    <FontAwesomeIcon icon={faComment} className="w-5 h-5" />
                    <span className="text-sm font-medium">{selectedMoment._count.replies}</span>
                  </button>
                  <button className="flex items-center space-x-1.5 text-gray-600 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 transition">
                    <FontAwesomeIcon icon={faEye} className="w-5 h-5" />
                    <span className="text-sm font-medium">{selectedMoment.views}</span>
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              {showComments && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="max-h-48 overflow-y-auto mb-3 space-y-3">
                    {comments.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No comments yet. Be the first to comment!</p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="flex items-start space-x-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {comment.user?.username?.charAt(0) || 'U'}
                          </div>
                          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl px-3 py-2">
                            <p className="text-xs font-semibold text-gray-900 dark:text-white">{comment.user?.profile?.displayName || comment.user?.username}</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-full text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={handleComment}
                      disabled={!commentText.trim()}
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full text-sm font-semibold hover:from-orange-600 hover:to-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Post
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
