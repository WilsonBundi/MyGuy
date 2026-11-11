'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

const REACTIONS = [
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'funny', emoji: '😂', label: 'Funny' },
  { type: 'fire', emoji: '🔥', label: 'Fire' },
  { type: 'insight', emoji: '💡', label: 'Insight' },
  { type: 'respect', emoji: '👏', label: 'Respect' },
  { type: 'wow', emoji: '😮', label: 'Wow' }
]

interface ReactionsProps {
  pingId: string
}

export default function Reactions({ pingId }: ReactionsProps) {
  const { data: session } = useSession()
  const [showPicker, setShowPicker] = useState(false)
  const [reactions, setReactions] = useState<Record<string, any>>({})
  const [userReactions, setUserReactions] = useState<string[]>([])

  useEffect(() => {
    if (showPicker) {
      fetchReactions()
    }
  }, [showPicker, pingId])

  const fetchReactions = async () => {
    try {
      const response = await fetch(`/api/pings/${pingId}/reactions`)
      const data = await response.json()
      setReactions(data.reactions || {})
      
      // Track which reactions the current user has
      if (session) {
        const userReactionTypes: string[] = []
        Object.values(data.reactions || {}).forEach((reactionList: any) => {
          reactionList.forEach((reaction: any) => {
            if (reaction.user.id === session.user?.id) {
              userReactionTypes.push(reaction.reactionType)
            }
          })
        })
        setUserReactions(userReactionTypes)
      }
    } catch (error) {
      console.error('Error fetching reactions:', error)
    }
  }

  const handleReaction = async (reactionType: string) => {
    if (!session) return

    try {
      const response = await fetch(`/api/pings/${pingId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reactionType })
      })

      if (response.ok) {
        const data = await response.json()
        await fetchReactions()
        
        if (data.reacted) {
          setUserReactions([...userReactions, reactionType])
        } else {
          setUserReactions(userReactions.filter(r => r !== reactionType))
        }
      }
    } catch (error) {
      console.error('Error toggling reaction:', error)
    }
  }

  const totalReactions = Object.values(reactions).reduce((sum, list: any) => sum + list.length, 0)

  return (
    <div className="relative">
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
      >
        <span className="text-lg">❤️</span>
        <span>React</span>
        <span>{totalReactions}</span>
      </button>

      {showPicker && (
        <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 z-50 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-2">
            {REACTIONS.map((reaction) => (
              <button
                key={reaction.type}
                onClick={() => handleReaction(reaction.type)}
                className={`flex flex-col items-center p-2 rounded-lg transition ${
                  userReactions.includes(reaction.type)
                    ? 'bg-primary-50 dark:bg-primary-900/30'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={reaction.label}
              >
                <span className="text-2xl mb-1">{reaction.emoji}</span>
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  {reactions[reaction.type]?.length || 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
