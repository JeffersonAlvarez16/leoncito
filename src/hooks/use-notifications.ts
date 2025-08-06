'use client'

import { useState, useEffect } from 'react'
import { notificationService, type NotificationPayload } from '@/lib/notifications'

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const status = notificationService.getPermissionStatus()
    setIsSupported(status.supported)
    setPermission(status.permission)

    // Listen for permission changes
    if (status.supported) {
      const checkPermission = () => {
        setPermission(Notification.permission)
      }

      // Check periodically for permission changes
      const interval = setInterval(checkPermission, 1000)
      return () => clearInterval(interval)
    }
  }, [])

  const requestPermission = async (): Promise<boolean> => {
    setIsLoading(true)
    
    try {
      const result = await notificationService.requestPermission()
      setPermission(result)
      return result === 'granted'
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const sendNotification = async (payload: NotificationPayload): Promise<boolean> => {
    if (!isSupported || permission !== 'granted') {
      return false
    }

    try {
      return await notificationService.sendNotification(payload)
    } catch (error) {
      console.error('Error sending notification:', error)
      return false
    }
  }

  const scheduleNotification = async (
    scheduledTime: Date, 
    payload: NotificationPayload
  ): Promise<boolean> => {
    if (!isSupported || permission !== 'granted') {
      return false
    }

    try {
      return await notificationService.scheduleNotification(scheduledTime, payload)
    } catch (error) {
      console.error('Error scheduling notification:', error)
      return false
    }
  }

  const scheduleBetNotifications = async (bet: {
    id: number
    title: string
    starts_at: string
    bet_selections: Array<{
      home_team: string
      away_team: string
      market: string
    }>
  }): Promise<boolean> => {
    if (!isSupported || permission !== 'granted') {
      return false
    }

    try {
      await notificationService.scheduleBetNotifications(bet)
      return true
    } catch (error) {
      console.error('Error scheduling bet notifications:', error)
      return false
    }
  }

  return {
    // Estado
    isSupported,
    permission,
    isEnabled: permission === 'granted',
    canRequest: permission === 'default',
    isLoading,

    // Acciones
    requestPermission,
    sendNotification,
    scheduleNotification,
    scheduleBetNotifications,

    // Helpers
    getStatus: () => ({
      supported: isSupported,
      permission,
      enabled: permission === 'granted'
    })
  }
}