'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTheme } from '@/components/ThemeProvider'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faLock, faBell, faGlobe, faMoon, faSun, faShield, faPalette, faLanguage, faTrash, faSignOutAlt, faChevronRight, faToggleOn, faToggleOff, faCamera, faPen, faMapMarkerAlt, faLink, faEnvelope, faPhone, faUsers, faUserPlus, faUserMinus, faUserCheck } from '@fortawesome/free-solid-svg-icons'

export default function SettingsPage() {
  const { data: session } = useSession()
  const { theme, toggleTheme } = useTheme()
  const [activeSection, setActiveSection] = useState<'profile' | 'friends' | 'account' | 'privacy' | 'notifications' | 'appearance' | 'language'>('profile')
  const [saving, setSaving] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileData, setProfileData] = useState({
    displayName: session?.user?.name || '',
    username: session?.user?.username || '',
    bio: '',
    location: '',
    website: ''
  })
  const [friends, setFriends] = useState<any[]>([])
  const [friendRequests, setFriendRequests] = useState<any[]>([])
  const [darkMode, setDarkMode] = useState(theme === 'dark')
  const [compactMode, setCompactMode] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [profileImage, setProfileImage] = useState<string | null>(null)

  const settingsSections = [
    { id: 'profile', label: 'Profile', icon: faUser },
    { id: 'friends', label: 'Friends', icon: faUsers },
    { id: 'account', label: 'Account', icon: faLock },
    { id: 'privacy', label: 'Privacy & Security', icon: faShield },
    { id: 'notifications', label: 'Notifications', icon: faBell },
    { id: 'appearance', label: 'Appearance', icon: faPalette },
    { id: 'language', label: 'Language', icon: faLanguage }
  ]

  useEffect(() => {
    if (activeSection === 'friends') {
      fetchFriends()
    }
  }, [activeSection])

  useEffect(() => {
    setDarkMode(theme === 'dark')
    // Load saved images from localStorage
    const savedProfileImage = localStorage.getItem('profileImage')
    const savedCoverImage = localStorage.getItem('coverImage')
    if (savedProfileImage) setProfileImage(savedProfileImage)
    if (savedCoverImage) setCoverImage(savedCoverImage)
  }, [theme])

  const fetchFriends = async () => {
    try {
      const response = await fetch('/api/connections')
      const data = await response.json()
      setFriends(data.connections || [])
      setFriendRequests(data.requests || [])
    } catch (error) {
      console.error('Error fetching friends:', error)
    }
  }

  const accountSettings = [
    { label: 'Change Password', description: 'Update your password for security', action: 'password' },
    { label: 'Email Settings', description: 'Manage your email preferences', action: 'email' },
    { label: 'Phone Number', description: 'Add or remove your phone number', action: 'phone' },
    { label: 'Two-Factor Authentication', description: 'Add an extra layer of security', action: '2fa' }
  ]

  const privacySettings = [
    { label: 'Profile Visibility', description: 'Who can see your profile', value: 'Everyone' },
    { label: 'Who Can Message You', description: 'Control who can send you messages', value: 'Everyone' },
    { label: 'Who Can See Your Moments', description: 'Control moment visibility', value: 'Connections' },
    { label: 'Block Users', description: 'Manage your blocked users list', action: 'block' },
    { label: 'Download Your Data', description: 'Get a copy of your data', action: 'download' }
  ]

  const notificationSettings = [
    { label: 'Push Notifications', description: 'Receive notifications on your device', enabled: true },
    { label: 'Email Notifications', description: 'Receive updates via email', enabled: true },
    { label: 'Message Notifications', description: 'Get notified for new messages', enabled: true },
    { label: 'Moment Notifications', description: 'Get notified for new moments', enabled: false },
    { label: 'Mention Notifications', description: 'Get notified when mentioned', enabled: true }
  ]
  const [notifications, setNotifications] = useState(notificationSettings.map(n => n.enabled))

  const appearanceSettings = [
    { label: 'Dark Mode', description: 'Use dark theme', icon: faMoon, state: darkMode, setState: setDarkMode },
    { label: 'Compact Mode', description: 'Use more compact layout', icon: faPalette, state: compactMode, setState: setCompactMode },
    { label: 'Reduce Motion', description: 'Minimize animations', icon: faPalette, state: reduceMotion, setState: setReduceMotion }
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

  const handleSave = () => {
    setSaving(true)
    // Save images to localStorage for persistence
    if (profileImage) {
      localStorage.setItem('profileImage', profileImage)
    }
    if (coverImage) {
      localStorage.setItem('coverImage', coverImage)
    }
    setTimeout(() => {
      setSaving(false)
      setEditingProfile(false)
    }, 1000)
  }

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleProfileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 sticky top-6">
              <nav className="space-y-1">
                {settingsSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id as any)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition ${
                      activeSection === section.id
                        ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <FontAwesomeIcon icon={section.icon} className="w-5 h-5" />
                    <span>{section.label}</span>
                  </button>
                ))}
              </nav>

              <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
                <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                  <FontAwesomeIcon icon={faSignOutAlt} className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              {/* Profile Section */}
              {activeSection === 'profile' && (
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <FontAwesomeIcon icon={faUser} className="text-orange-500 text-2xl" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h2>
                  </div>

                  {/* Cover Photo */}
                  <div className="relative h-56 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 mb-20 overflow-hidden group">
                    {coverImage ? (
                      <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-white/30">
                        <span className="text-6xl">🖼️</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300"></div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      className="hidden"
                      id="cover-upload"
                    />
                    <label
                      htmlFor="cover-upload"
                      className="absolute bottom-4 right-4 px-5 py-2.5 bg-white/20 backdrop-blur-md rounded-xl text-white text-sm font-medium hover:bg-white/30 transition flex items-center space-x-2 cursor-pointer border border-white/30 shadow-lg"
                    >
                      <FontAwesomeIcon icon={faCamera} />
                      <span>Edit Cover</span>
                    </label>
                  </div>

                  {/* Profile Picture and Info */}
                  <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6 -mt-16 mb-6 px-6">
                    {/* Profile Photo */}
                    <div className="relative group">
                      {profileImage ? (
                        <img src={profileImage} alt="Profile" className="w-36 h-36 rounded-2xl object-cover border-4 border-white dark:border-gray-800 shadow-2xl" />
                      ) : (
                        <div className="w-36 h-36 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-4xl border-4 border-white dark:border-gray-800 shadow-2xl">
                          {session?.user?.name?.charAt(0) || 'U'}
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfileUpload}
                        className="hidden"
                        id="profile-upload"
                      />
                      <label
                        htmlFor="profile-upload"
                        className="absolute bottom-0 right-0 w-12 h-12 bg-white dark:bg-gray-700 rounded-full shadow-lg flex items-center justify-center text-orange-500 hover:bg-gray-100 dark:hover:bg-gray-600 transition border-4 border-white dark:border-gray-800 cursor-pointer hover:scale-110 transform"
                      >
                        <FontAwesomeIcon icon={faCamera} className="text-lg" />
                      </label>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 w-full">
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-3">
                        <div>
                          <a href={`/profile/${session?.user?.username}`} className="text-2xl font-bold text-gray-900 dark:text-white hover:text-orange-500 transition">
                            {session?.user?.name || 'User'}
                          </a>
                          <p className="text-gray-500 dark:text-gray-400">@{session?.user?.username || 'user'}</p>
                        </div>
                        <button
                          onClick={() => setEditingProfile(!editingProfile)}
                          className="mt-3 md:mt-0 px-6 py-2.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition flex items-center space-x-2 w-full md:w-auto justify-center"
                        >
                          <FontAwesomeIcon icon={faPen} className="w-4 h-4" />
                          <span>{editingProfile ? 'Cancel' : 'Edit Profile'}</span>
                        </button>
                      </div>

                      {!editingProfile && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                            <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4" />
                            <span>{session?.user?.email || 'user@example.com'}</span>
                          </div>
                          {profileData.bio && (
                            <p className="text-gray-700 dark:text-gray-200">{profileData.bio}</p>
                          )}
                          {profileData.location && (
                            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                              <FontAwesomeIcon icon={faMapMarkerAlt} className="w-4 h-4" />
                              <span>{profileData.location}</span>
                            </div>
                          )}
                          {profileData.website && (
                            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                              <FontAwesomeIcon icon={faLink} className="w-4 h-4" />
                              <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">
                                {profileData.website}
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Edit Form */}
                  {editingProfile && (
                    <div className="px-6 pb-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Display Name</label>
                        <input
                          type="text"
                          value={profileData.displayName}
                          onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username</label>
                        <input
                          type="text"
                          value={profileData.username}
                          onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</label>
                        <textarea
                          value={profileData.bio}
                          onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 dark:text-white"
                          rows={3}
                          maxLength={500}
                          placeholder="Tell us about yourself..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
                        <div className="relative">
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={profileData.location}
                            onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                            className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 dark:text-white"
                            placeholder="Add your location"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Website</label>
                        <div className="relative">
                          <FontAwesomeIcon icon={faLink} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="url"
                            value={profileData.website}
                            onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                            className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 dark:text-white"
                            placeholder="Add your website"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition shadow-md disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save Profile'}
                      </button>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="px-6 pb-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">0</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Pings</p>
                      </div>
                      <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{friends.length}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Friends</p>
                      </div>
                      <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 rounded-2xl border border-green-100 dark:border-green-900/30">
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">0</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Following</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Friends Section */}
              {activeSection === 'friends' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <FontAwesomeIcon icon={faUsers} className="text-orange-500 text-2xl" />
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Friends</h2>
                    </div>
                    <button className="px-4 py-2 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition flex items-center space-x-2">
                      <FontAwesomeIcon icon={faUserPlus} />
                      <span>Add Friend</span>
                    </button>
                  </div>

                  {/* Friend Requests */}
                  {friendRequests.length > 0 && (
                    <div className="mb-8">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                        <FontAwesomeIcon icon={faUserCheck} className="text-orange-500" />
                        <span>Friend Requests ({friendRequests.length})</span>
                      </h3>
                      <div className="space-y-3">
                        {friendRequests.map((request) => (
                          <div key={request.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                            <div className="flex items-center space-x-4">
                              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                {request.connectedTo?.profile?.displayName?.charAt(0) || request.connectedTo?.username?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white text-lg">
                                  {request.connectedTo?.profile?.displayName || request.connectedTo?.username}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">@{request.connectedTo?.username}</p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button className="px-5 py-2.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition shadow-md">
                                Accept
                              </button>
                              <button className="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                                Decline
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Friends List */}
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Your Friends ({friends.length})</h3>
                  {friends.length === 0 ? (
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
                      <FontAwesomeIcon icon={faUsers} className="text-5xl text-gray-400 dark:text-gray-600 mb-4" />
                      <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">No friends yet</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Connect with people to see their updates!</p>
                      <button className="mt-6 px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition">
                        Find Friends
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {friends.map((friend) => (
                        <div key={friend.id} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition border border-gray-100 dark:border-gray-700">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
                            {friend.connectedTo?.profile?.displayName?.charAt(0) || friend.connectedTo?.username?.charAt(0) || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">
                              {friend.connectedTo?.profile?.displayName || friend.connectedTo?.username}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">@{friend.connectedTo?.username}</p>
                          </div>
                          <button className="px-3 py-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition">
                            <FontAwesomeIcon icon={faUserMinus} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Account Section */}
              {activeSection === 'account' && (
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <FontAwesomeIcon icon={faLock} className="text-orange-500 text-2xl" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Account</h2>
                  </div>

                  <div className="space-y-3">
                    {accountSettings.map((setting) => (
                      <div key={setting.label} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer border border-gray-100 dark:border-gray-700">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{setting.label}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{setting.description}</p>
                        </div>
                        <FontAwesomeIcon icon={faChevronRight} className="text-gray-400" />
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button className="px-6 py-3 text-red-600 dark:text-red-400 font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition flex items-center space-x-2">
                      <FontAwesomeIcon icon={faTrash} />
                      <span>Delete Account</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Privacy Section */}
              {activeSection === 'privacy' && (
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <FontAwesomeIcon icon={faShield} className="text-orange-500 text-2xl" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Privacy & Security</h2>
                  </div>

                  <div className="space-y-3">
                    {privacySettings.map((setting) => (
                      <div key={setting.label} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer border border-gray-100 dark:border-gray-700">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{setting.label}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{setting.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {setting.value && <span className="text-sm text-orange-500 font-medium bg-orange-50 dark:bg-orange-900/30 px-3 py-1 rounded-full">{setting.value}</span>}
                          <FontAwesomeIcon icon={faChevronRight} className="text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notifications Section */}
              {activeSection === 'notifications' && (
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <FontAwesomeIcon icon={faBell} className="text-orange-500 text-2xl" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h2>
                  </div>

                  <div className="space-y-3">
                    {notificationSettings.map((setting, index) => (
                      <div key={setting.label} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{setting.label}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{setting.description}</p>
                        </div>
                        <button
                          onClick={() => {
                            const newNotifications = [...notifications]
                            newNotifications[index] = !newNotifications[index]
                            setNotifications(newNotifications)
                          }}
                          className={`w-14 h-8 rounded-full relative transition shadow-md ${
                            notifications[index] ? 'bg-orange-500 dark:bg-orange-600' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <div
                            className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                              notifications[index] ? 'right-1' : 'left-1'
                            }`}
                          ></div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Appearance Section */}
              {activeSection === 'appearance' && (
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <FontAwesomeIcon icon={faPalette} className="text-orange-500 text-2xl" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Appearance</h2>
                  </div>

                  <div className="space-y-3">
                    {appearanceSettings.map((setting) => (
                      <div key={setting.label} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                          <FontAwesomeIcon icon={setting.icon} className="text-orange-500 w-5 h-5" />
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{setting.label}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{setting.description}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (setting.label === 'Dark Mode') {
                              toggleTheme()
                              setDarkMode(!darkMode)
                            } else {
                              setting.setState(!setting.state)
                            }
                          }}
                          className={`w-14 h-8 rounded-full relative transition shadow-md ${
                            setting.state ? 'bg-orange-500 dark:bg-orange-600' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <div
                            className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                              setting.state ? 'right-1' : 'left-1'
                            }`}
                          ></div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Language Section */}
              {activeSection === 'language' && (
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <FontAwesomeIcon icon={faGlobe} className="text-orange-500 text-2xl" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Language</h2>
                  </div>

                  <div className="space-y-3">
                    {languages.map((lang) => (
                      <div key={lang.code} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{lang.flag}</span>
                          <span className="font-medium text-gray-900 dark:text-white">{lang.name}</span>
                        </div>
                        {lang.code === 'en' && (
                          <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-full font-medium">
                            Active
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Save Button */}
              {activeSection !== 'profile' && activeSection !== 'friends' && (
                <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition shadow-md disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
