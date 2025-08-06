'use client'

export const registerSW = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('SW registered: ', registration)
      return registration
    } catch (error) {
      console.log('SW registration failed: ', error)
    }
  }
}

export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }
  return false
}

export const getFCMToken = async () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      // This would be implemented with Firebase SDK
      // For now, return a placeholder
      console.log('FCM token would be requested here')
      return null
    } catch (error) {
      console.error('Error getting FCM token:', error)
      return null
    }
  }
  return null
}

export const isInstalled = () => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(display-mode: standalone)').matches || 
           (window.navigator as any).standalone === true
  }
  return false
}

export const canInstall = () => {
  return !isInstalled() && 'serviceWorker' in navigator
}