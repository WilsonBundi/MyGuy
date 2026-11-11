'use client'

import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export default function OnlineStatusManager() {
  useOnlineStatus()
  return null
}
