'use client'

import { useNotifications } from '@/hooks/use-notifications'
import { Button } from '@/components/ui/button'
import { Bell, BellOff, Settings } from 'lucide-react'
import Link from 'next/link'

export function NotificationStatus() {
  const { isEnabled, permission, isSupported } = useNotifications()

  if (!isSupported) {
    return null
  }

  return (
    <Link href="/profile" className="flex items-center gap-1 text-xs">
      {isEnabled ? (
        <>
          <Bell size={14} className="text-green-600 dark:text-green-400" />
          <span className="text-green-600 dark:text-green-400 hidden sm:inline">Activas</span>
        </>
      ) : (
        <>
          <BellOff size={14} className="text-gray-400" />
          <span className="text-gray-400 hidden sm:inline">
            {permission === 'denied' ? 'Bloqueadas' : 'Inactivas'}
          </span>
        </>
      )}
    </Link>
  )
}