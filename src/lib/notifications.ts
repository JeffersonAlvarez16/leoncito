'use client'

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  requireInteraction?: boolean
}

export class NotificationService {
  private static instance: NotificationService
  private registration: ServiceWorkerRegistration | null = null

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  /**
   * Solicitar permisos de notificación
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return 'denied'
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission
    }

    return Notification.permission
  }

  /**
   * Verificar si las notificaciones están habilitadas
   */
  isNotificationSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator
  }

  /**
   * Obtener el service worker registration
   */
  async getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      return null
    }

    try {
      this.registration = await navigator.serviceWorker.ready
      return this.registration
    } catch (error) {
      console.error('Error getting service worker registration:', error)
      return null
    }
  }

  /**
   * Enviar notificación inmediata
   */
  async sendNotification(payload: NotificationPayload): Promise<boolean> {
    const permission = await this.requestPermission()
    
    if (permission !== 'granted') {
      console.warn('Notification permission not granted')
      return false
    }

    try {
      const registration = await this.getServiceWorkerRegistration()
      
      if (registration) {
        // Use service worker for better control
        await registration.showNotification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/icons/icon-192x192.png',
          badge: payload.badge || '/icons/icon-192x192.png',
          tag: payload.tag || 'bet-notification',
          data: payload.data,
          requireInteraction: payload.requireInteraction || false,
          actions: [
            {
              action: 'view',
              title: 'Ver Pick'
            },
            {
              action: 'close',
              title: 'Cerrar'
            }
          ]
        })
      } else {
        // Fallback to browser notification
        new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/icons/icon-192x192.png',
          tag: payload.tag || 'bet-notification',
          data: payload.data,
          requireInteraction: payload.requireInteraction || false
        })
      }
      
      return true
    } catch (error) {
      console.error('Error sending notification:', error)
      return false
    }
  }

  /**
   * Programar notificación para una hora específica
   */
  async scheduleNotification(
    scheduledTime: Date, 
    payload: NotificationPayload
  ): Promise<boolean> {
    const now = new Date()
    const delay = scheduledTime.getTime() - now.getTime()

    if (delay <= 0) {
      console.warn('Scheduled time is in the past')
      return false
    }

    // Para notificaciones inmediatas (menos de 1 minuto)
    if (delay < 60000) {
      return await this.sendNotification(payload)
    }

    // Para notificaciones futuras, usar setTimeout
    setTimeout(async () => {
      await this.sendNotification(payload)
    }, delay)

    console.log(`Notification scheduled for ${scheduledTime.toLocaleString()}`)
    return true
  }

  /**
   * Programar notificaciones para una apuesta
   */
  async scheduleBetNotifications(bet: {
    id: number
    title: string
    starts_at: string
    bet_selections: Array<{
      home_team: string
      away_team: string
      market: string
    }>
  }): Promise<void> {
    const gameTime = new Date(bet.starts_at)
    const now = new Date()

    // No programar si el partido ya empezó
    if (gameTime <= now) {
      return
    }

    // Notificación 30 minutos antes
    const notification30min = new Date(gameTime.getTime() - 30 * 60 * 1000)
    if (notification30min > now) {
      await this.scheduleNotification(notification30min, {
        title: '⚽ Pick disponible en 30 min',
        body: `${bet.title} - ${bet.bet_selections[0]?.market || 'Nueva apuesta'}`,
        tag: `bet-${bet.id}-30min`,
        data: { betId: bet.id, type: '30min' },
        requireInteraction: false
      })
    }

    // Notificación 5 minutos antes
    const notification5min = new Date(gameTime.getTime() - 5 * 60 * 1000)
    if (notification5min > now) {
      await this.scheduleNotification(notification5min, {
        title: '🔥 ¡Pick empezando ya!',
        body: `${bet.title} - Solo quedan 5 minutos`,
        tag: `bet-${bet.id}-5min`,
        data: { betId: bet.id, type: '5min' },
        requireInteraction: true
      })
    }

    // Notificación al inicio del partido
    await this.scheduleNotification(gameTime, {
      title: '🚨 ¡Partido en vivo!',
      body: `${bet.title} - El pick está activo`,
      tag: `bet-${bet.id}-live`,
      data: { betId: bet.id, type: 'live' },
      requireInteraction: true
    })
  }

  /**
   * Limpiar todas las notificaciones pendientes de una apuesta
   */
  async clearBetNotifications(betId: number): Promise<void> {
    const registration = await this.getServiceWorkerRegistration()
    if (!registration) return

    const notifications = await registration.getNotifications({
      tag: `bet-${betId}`
    })

    notifications.forEach(notification => {
      notification.close()
    })
  }

  /**
   * Obtener estado de permisos
   */
  getPermissionStatus(): {
    supported: boolean
    permission: NotificationPermission
    canRequest: boolean
  } {
    const supported = this.isNotificationSupported()
    const permission = supported ? Notification.permission : 'denied'
    const canRequest = supported && permission === 'default'

    return {
      supported,
      permission,
      canRequest
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance()