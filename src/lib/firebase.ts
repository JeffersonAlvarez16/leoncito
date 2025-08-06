'use client'

// Firebase Web Push setup
declare global {
  interface Window {
    firebase: any
  }
}

export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

// Check if push notifications are supported
export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 
         'serviceWorker' in navigator && 
         'PushManager' in window
}

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isPushSupported()) {
    console.log('Push notifications not supported')
    return false
  }

  try {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  } catch (error) {
    console.error('Error requesting notification permission:', error)
    return false
  }
}

// Get FCM token (simplified version without Firebase SDK)
export async function getFCMToken(): Promise<string | null> {
  if (!isPushSupported()) {
    return null
  }

  try {
    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js')
    
    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription()
    
    if (existingSubscription) {
      return existingSubscription.endpoint
    }

    // Subscribe to push
    const vapidKey = process.env.NEXT_PUBLIC_FCM_VAPID_KEY
    if (!vapidKey) {
      throw new Error('VAPID key not configured')
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey)
    })

    return subscription.endpoint
    
  } catch (error) {
    console.error('Error getting FCM token:', error)
    return null
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration) return false

    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) return true

    return await subscription.unsubscribe()
  } catch (error) {
    console.error('Error unsubscribing from push:', error)
    return false
  }
}

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}