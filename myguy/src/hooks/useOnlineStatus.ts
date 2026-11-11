'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

export function useOnlineStatus() {
  const { data: session } = useSession()

  useEffect(() => {
    if (!session?.user?.id) return

    // Set user as online when component mounts
    const setOnline = async () => {
      try {
        await fetch('/api/user/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isOnline: true })
        })
      } catch (error) {
        console.error('Error setting online status:', error)
      }
    }

    // Set user as offline when component unmounts
    const setOffline = async () => {
      try {
        await fetch('/api/user/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isOnline: false })
        })
      } catch (error) {
        console.error('Error setting offline status:', error)
      }
    }

    setOnline()

    // Update last active time every 30 seconds
    const interval = setInterval(setOnline, 30000)

    // Cleanup
    return () => {
      clearInterval(interval)
      setOffline()
    }
  }, [session?.user?.id])
}
