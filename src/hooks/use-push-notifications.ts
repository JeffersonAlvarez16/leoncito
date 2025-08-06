'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth-provider'
import { supabase } from '@/lib/supabase'
import { 
  isPushSupported, 
  requestNotificationPermission, 
  getFCMToken, 
  unsubscribeFromPush 
} from '@/lib/firebase'

interface UsePushNotificationsResult {
  isSupported: boolean
  isSubscribed: boolean
  isLoading: boolean
  permission: NotificationPermission
  subscribe: () => Promise<boolean>
  unsubscribe: () => Promise<boolean>
  error: string | null
}

export function usePushNotifications(): UsePushNotificationsResult {
  const { user } = useAuth()
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [error, setError] = useState<string | null>(null)

  const isSupported = isPushSupported()

  // Check subscription status on mount
  useEffect(() => {
    if (!isSupported || !user) return

    const checkSubscriptionStatus = async () => {
      try {
        // Check permission
        const currentPermission = Notification.permission
        setPermission(currentPermission)

        if (currentPermission !== 'granted') {
          setIsSubscribed(false)
          return
        }

        // Check if we have a token stored
        const { data, error } = await supabase
          .from('push_tokens')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle()

        if (error) {
          console.error('Error checking push subscription:', error)
          return
        }

        setIsSubscribed(!!data)
      } catch (err) {
        console.error('Error in checkSubscriptionStatus:', err)
      }
    }

    checkSubscriptionStatus()
  }, [isSupported, user])

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user) {
      setError('Push notifications not supported or user not logged in')
      return false
    }

    try {
      setIsLoading(true)
      setError(null)

      // Request permission
      const hasPermission = await requestNotificationPermission()
      if (!hasPermission) {
        setError('Notification permission denied')
        setPermission('denied')
        return false
      }

      setPermission('granted')

      // Get FCM token
      const token = await getFCMToken()
      if (!token) {
        setError('Failed to get push token')
        return false
      }

      // Save token to database
      const { error: dbError } = await supabase
        .from('push_tokens')
        .upsert({
          user_id: user.id,
          provider: 'fcm',
          token: token,
          device_info: {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          },
          is_active: true
        }, {
          onConflict: 'provider,token'
        })

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`)
      }

      setIsSubscribed(true)
      return true

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe to notifications'
      setError(errorMessage)
      console.error('Error subscribing to push notifications:', err)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, user])

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!user) return false

    try {
      setIsLoading(true)
      setError(null)

      // Unsubscribe from browser
      await unsubscribeFromPush()

      // Deactivate tokens in database
      const { error: dbError } = await supabase
        .from('push_tokens')
        .update({ is_active: false })
        .eq('user_id', user.id)

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`)
      }

      setIsSubscribed(false)
      return true

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unsubscribe from notifications'
      setError(errorMessage)
      console.error('Error unsubscribing from push notifications:', err)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [user])

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
    error
  }
}