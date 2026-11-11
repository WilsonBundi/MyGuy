'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faPlus, faUserGroup, faComments, faGlobe, faVideo, faMicrophone, faUsers, faEllipsis, faFilter } from '@fortawesome/free-solid-svg-icons'
import ChatList from '@/components/ChatList'
import RoomsSection from '@/components/RoomsSection'
import MessageRequests from '@/components/MessageRequests'

export default function ChatsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState('all')
  const [showNewChatModal, setShowNewChatModal] = useState(false)

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter)
  }

  const handleNewChat = () => {
    setShowNewChatModal(true)
  }

  const handleDiscoverPeople = () => {
    router.push('/discover')
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chats</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Your conversations</p>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                <FontAwesomeIcon icon={faSearch} className="w-5 h-5" />
              </button>
              <button 
                onClick={handleNewChat}
                className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold transition flex items-center space-x-2"
              >
                <FontAwesomeIcon icon={faPlus} className="w-5 h-5" />
                <span>New Chat</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Chat Filters */}
          <div className="flex space-x-2 mb-6">
            {['all', 'unread', 'circles', 'requests'].map((filter) => (
              <button
                key={filter}
                onClick={() => handleFilterChange(filter)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition capitalize ${
                  activeFilter === filter
                    ? 'bg-orange-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {filter}
                {filter === 'requests' && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">3</span>
                )}
              </button>
            ))}
          </div>

          {/* Discover People Section */}
          <div 
            onClick={handleDiscoverPeople}
            className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-2xl p-6 mb-6 text-white cursor-pointer hover:shadow-xl transition"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <FontAwesomeIcon icon={faUserGroup} className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">Discover People</h3>
                  <p className="text-white/90 text-sm">Find and connect with people worldwide</p>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                <FontAwesomeIcon icon={faSearch} className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Chat Types Quick Access */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-6">
            {[
              { icon: faComments, label: 'Chat', desc: 'One-on-one', color: 'from-blue-500 to-blue-600' },
              { icon: faUsers, label: 'Circle', desc: 'Community', color: 'from-purple-500 to-purple-600' },
              { icon: faGlobe, label: 'Room', desc: 'Live', color: 'from-green-500 to-green-600' },
              { icon: faVideo, label: 'Video', desc: 'Live video', color: 'from-red-500 to-red-600' },
              { icon: faMicrophone, label: 'Voice', desc: 'Voice', color: 'from-yellow-500 to-yellow-600' },
              { icon: faGlobe, label: 'Global', desc: 'Worldwide', color: 'from-indigo-500 to-indigo-600' }
            ].map((item, index) => (
              <button 
                key={index}
                className="bg-white dark:bg-gray-800 rounded-2xl p-5 text-left hover:shadow-lg transition group hover:scale-105 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-md`}>
                    <FontAwesomeIcon icon={item.icon} className="w-7 h-7" />
                  </div>
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{item.label}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Content based on filter */}
          {activeFilter === 'requests' ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-semibold text-gray-900 dark:text-white">Message Requests</h2>
              </div>
              <MessageRequests />
            </div>
          ) : (
            <>
              {/* Live Rooms */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden mb-6">
                <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="font-semibold text-gray-900 dark:text-white">Live Rooms</h2>
                </div>
                <RoomsSection />
              </div>

              {/* Chat List */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="font-semibold text-gray-900 dark:text-white">Recent Chats</h2>
                </div>
                <ChatList filter={activeFilter} />
              </div>
            </>
          )}

          {/* New Chat Modal */}
          {showNewChatModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowNewChatModal(false)}>
              <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">New Chat</h3>
                  <button onClick={() => setShowNewChatModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    <FontAwesomeIcon icon={faEllipsis} className="w-5 h-5" />
                  </button>
                </div>
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search people..."
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 dark:text-white"
                  />
                </div>
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>Search for people to start a conversation</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
