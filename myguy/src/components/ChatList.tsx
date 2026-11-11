'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faComments, faUsers, faClock, faUser } from '@fortawesome/free-solid-svg-icons'

interface Chat {
  id: string
  isGroup: boolean
  groupName: string | null
  groupImage: string | null
  updatedAt: string
  isPinned: boolean
  isArchived: boolean
  members: {
    user: {
      id: string
      username: string
      profile?: {
        displayName: string
        avatar: string | null
      }
    }
  }[]
  messages: {
    id: string
    content: string
    createdAt: string
    sender: {
      profile?: {
        displayName: string
      }
    }
  }[]
  _count: {
    members: number
    messages: number
  }
}

interface ChatListProps {
  filter?: string
}

export default function ChatList({ filter = 'all' }: ChatListProps) {
  const { data: session } = useSession()
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session) {
      fetchChats()
    }
  }, [session, filter])

  const fetchChats = async () => {
    try {
      const response = await fetch('/api/chats')
      const data = await response.json()
      let filteredChats = data.chats || []
      
      // Apply filters
      if (filter === 'unread') {
        filteredChats = filteredChats.filter((chat: Chat) => {
          // Check if chat has unread messages
          return chat.messages.some((msg: any) => !msg.isRead)
        })
      } else if (filter === 'circles') {
        filteredChats = filteredChats.filter((chat: Chat) => chat.isGroup)
      }
      
      setChats(filteredChats)
    } catch (error) {
      console.error('Error fetching chats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getChatName = (chat: Chat) => {
    if (chat.isGroup) {
      return chat.groupName || `${chat._count.members} members`
    }
    const otherMember = chat.members.find(m => m.user.id !== session?.user?.id)
    return otherMember?.user.profile?.displayName || otherMember?.user.username || 'Unknown'
  }

  const getChatAvatar = (chat: Chat) => {
    if (chat.isGroup) {
      return chat.groupImage || null
    }
    const otherMember = chat.members.find(m => m.user.id !== session?.user?.id)
    return otherMember?.user.profile?.avatar || null
  }

  const getLastMessage = (chat: Chat) => {
    if (chat.messages.length === 0) return 'No messages yet'
    const msg = chat.messages[0]
    const senderName = msg.sender.profile?.displayName || 'Someone'
    return `${senderName}: ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    if (days < 7) return `${days}d`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (chats.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="text-6xl mb-4 text-orange-400">
          <FontAwesomeIcon icon={faComments} className="w-16 h-16" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No conversations yet</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Start talking to people around the world.</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-700">
      {chats.map((chat) => (
        <Link
          key={chat.id}
          href={`/chats/${chat.id}`}
          className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
        >
          <div className="flex items-center space-x-4">
            <div className="relative flex-shrink-0">
              {getChatAvatar(chat) ? (
                <img
                  src={getChatAvatar(chat)!}
                  alt={getChatName(chat)}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold text-lg">
                  {chat.isGroup ? <FontAwesomeIcon icon={faUsers} className="w-5 h-5" /> : getChatName(chat).charAt(0).toUpperCase()}
                </div>
              )}
              {chat.isPinned && (
                <div className="absolute -top-1 -right-1 bg-orange-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                  📌
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{getChatName(chat)}</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTime(chat.updatedAt)}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{getLastMessage(chat)}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
