'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChartBar } from '@fortawesome/free-solid-svg-icons'

interface PollOption {
  id: string
  text: string
  votes: number
}

interface Poll {
  id: string
  question: string
  options: PollOption[]
  expiresAt: string | null
  isMultiple: boolean
}

interface PollDisplayProps {
  poll: Poll
  pingId: string
}

export default function PollDisplay({ poll, pingId }: PollDisplayProps) {
  const { data: session } = useSession()
  const [hasVoted, setHasVoted] = useState(false)
  const [voting, setVoting] = useState(false)

  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0)

  const handleVote = async (optionId: string) => {
    if (!session || hasVoted || voting) return

    setVoting(true)
    try {
      const response = await fetch(`/api/polls/${poll.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId })
      })

      if (response.ok) {
        setHasVoted(true)
      }
    } catch (error) {
      console.error('Error voting:', error)
    } finally {
      setVoting(false)
    }
  }

  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0
    return Math.round((votes / totalVotes) * 100)
  }

  const isExpired = poll.expiresAt && new Date(poll.expiresAt) < new Date()

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mt-3">
      <div className="flex items-center space-x-2 mb-3">
        <FontAwesomeIcon icon={faChartBar} className="w-4 h-4 text-primary-600 dark:text-primary-400" />
        <span className="font-medium text-gray-900 dark:text-white">Poll</span>
        {isExpired && (
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
            Ended
          </span>
        )}
      </div>

      <p className="text-gray-900 dark:text-white font-medium mb-4">{poll.question}</p>

      <div className="space-y-2">
        {poll.options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleVote(option.id)}
            disabled={hasVoted || isExpired || voting}
            className={`w-full text-left p-3 rounded-lg border-2 transition ${
              hasVoted || isExpired
                ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                : 'border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400 bg-white dark:bg-gray-900'
            }`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-900 dark:text-white">{option.text}</span>
              {hasVoted || isExpired ? (
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {getPercentage(option.votes)}%
                </span>
              ) : null}
            </div>
            {(hasVoted || isExpired) && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-primary-600 dark:bg-primary-400 h-2 rounded-full transition-all"
                  style={{ width: `${getPercentage(option.votes)}%` }}
                />
              </div>
            )}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
        {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
        {poll.expiresAt && ` • Ends ${new Date(poll.expiresAt).toLocaleDateString()}`}
      </p>
    </div>
  )
}
