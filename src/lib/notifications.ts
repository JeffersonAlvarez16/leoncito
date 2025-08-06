'use client'

import { supabase } from '@/lib/supabase'

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  requireInteraction?: boolean
}

export interface ScheduledNotification {
  id: number
  bet_id: number
  user_id: string
  title: string
  body: string
  notification_type: '30min' | '5min' | 'live'
  scheduled_time: string
  sent: boolean
  tag?: string
  icon?: string
  data?: any
  bet_title?: string
  home_team?: string
  away_team?: string
}

export interface NotificationPreferences {
  push_notifications: boolean
  email_notifications: boolean
  notification_30min: boolean
  notification_5min: boolean
  notification_live: boolean
}

export class NotificationService {
  private static instance: NotificationService
  private registration: ServiceWorkerRegistration | null = null
  private timeouts: Map<number, NodeJS.Timeout> = new Map()

  private constructor() {}

  /**
   * Inicializar el servicio - cargar notificaciones pendientes
   */
  async initialize() {
    await this.loadPendingNotifications()
    this.startNotificationWorker()
  }

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
          requireInteraction: payload.requireInteraction || false
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
   * Cargar y programar notificaciones pendientes desde la base de datos
   */
  async loadPendingNotifications(): Promise<void> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return

    const { data: notifications } = await supabase
      .rpc('get_pending_notifications', { user_uuid: user.user.id })

    if (!notifications) return

    // Limpiar timeouts anteriores
    this.timeouts.forEach(timeout => clearTimeout(timeout))
    this.timeouts.clear()

    // Programar cada notificación
    for (const notification of notifications) {
      this.scheduleNotificationFromDB(notification)
    }

    console.log(`Loaded ${notifications.length} pending notifications`)
  }

  /**
   * Programar una notificación desde la base de datos
   */
  private scheduleNotificationFromDB(notification: ScheduledNotification): void {
    const scheduledTime = new Date(notification.scheduled_time)
    const now = new Date()
    const delay = scheduledTime.getTime() - now.getTime()

    if (delay <= 0) {
      // La notificación ya debería haberse enviado
      return
    }

    const timeout = setTimeout(async () => {
      // Enviar notificación
      await this.sendNotification({
        title: notification.title,
        body: notification.body,
        tag: notification.tag,
        icon: notification.icon,
        data: notification.data
      })

      // Marcar como enviada en la base de datos
      await supabase
        .rpc('mark_notification_sent', { notification_id: notification.id })

      // Remover timeout
      this.timeouts.delete(notification.id)
    }, delay)

    this.timeouts.set(notification.id, timeout)
  }

  /**
   * Worker que verifica nuevas notificaciones cada minuto
   */
  private startNotificationWorker(): void {
    setInterval(async () => {
      await this.loadPendingNotifications()
    }, 60000) // Cada 60 segundos
  }

  /**
   * Programar notificaciones para una apuesta en la base de datos
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

    // Obtener usuarios que quieren notificaciones
    const { data: users } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'user')

    if (!users) return

    const notifications = []
    const selection = bet.bet_selections[0]

    for (const user of users) {
      // Verificar preferencias del usuario
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!prefs?.push_notifications) continue

      // Notificación 30 minutos antes
      const notification30min = new Date(gameTime.getTime() - 30 * 60 * 1000)
      if (notification30min > now && prefs.notification_30min) {
        notifications.push({
          bet_id: bet.id,
          user_id: user.id,
          title: '⚽ Pick disponible en 30 min',
          body: `${bet.title} - ${selection?.market || 'Nueva apuesta'}`,
          notification_type: '30min' as const,
          scheduled_time: notification30min.toISOString(),
          tag: `bet-${bet.id}-30min`,
          icon: '/icons/icon-192x192.png',
          data: { betId: bet.id, type: '30min' }
        })
      }

      // Notificación 5 minutos antes
      const notification5min = new Date(gameTime.getTime() - 5 * 60 * 1000)
      if (notification5min > now && prefs.notification_5min) {
        notifications.push({
          bet_id: bet.id,
          user_id: user.id,
          title: '🔥 ¡Pick empezando ya!',
          body: `${bet.title} - Solo quedan 5 minutos`,
          notification_type: '5min' as const,
          scheduled_time: notification5min.toISOString(),
          tag: `bet-${bet.id}-5min`,
          icon: '/icons/icon-192x192.png',
          data: { betId: bet.id, type: '5min' }
        })
      }

      // Notificación al inicio del partido
      if (prefs.notification_live) {
        notifications.push({
          bet_id: bet.id,
          user_id: user.id,
          title: '🚨 ¡Partido en vivo!',
          body: `${bet.title} - El pick está activo`,
          notification_type: 'live' as const,
          scheduled_time: gameTime.toISOString(),
          tag: `bet-${bet.id}-live`,
          icon: '/icons/icon-192x192.png',
          data: { betId: bet.id, type: 'live' }
        })
      }
    }

    // Insertar todas las notificaciones
    if (notifications.length > 0) {
      await supabase
        .from('scheduled_notifications')
        .insert(notifications)

      console.log(`Scheduled ${notifications.length} notifications for bet ${bet.id}`)
    }

    // Cargar notificaciones pendientes para programarlas
    await this.loadPendingNotifications()
  }

  /**
   * Obtener notificaciones programadas del usuario actual
   */
  async getUserNotifications(): Promise<ScheduledNotification[]> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return []

    const { data: notifications } = await supabase
      .rpc('get_pending_notifications', { user_uuid: user.user.id })

    return notifications || []
  }

  /**
   * Obtener todas las notificaciones programadas (solo admin)
   */
  async getAllNotifications(): Promise<ScheduledNotification[]> {
    const { data: notifications } = await supabase
      .rpc('get_pending_notifications')

    return notifications || []
  }

  /**
   * Obtener/crear preferencias de notificación del usuario
   */
  async getNotificationPreferences(): Promise<NotificationPreferences | null> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return null

    let { data: prefs } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.user.id)
      .single()

    // Crear preferencias por defecto si no existen
    if (!prefs) {
      const { data: newPrefs } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: user.user.id,
          push_notifications: true,
          email_notifications: false,
          notification_30min: true,
          notification_5min: true,
          notification_live: true
        })
        .select()
        .single()

      prefs = newPrefs
    }

    return prefs
  }

  /**
   * Actualizar preferencias de notificación
   */
  async updateNotificationPreferences(preferences: Partial<NotificationPreferences>): Promise<boolean> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return false

    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user.user.id,
        ...preferences
      })

    if (error) {
      console.error('Error updating notification preferences:', error)
      return false
    }

    return true
  }

  /**
   * Limpiar todas las notificaciones pendientes de una apuesta
   */
  async clearBetNotifications(betId: number): Promise<void> {
    // Limpiar de la base de datos
    await supabase
      .from('scheduled_notifications')
      .delete()
      .eq('bet_id', betId)
      .eq('sent', false)

    // Limpiar timeouts locales
    this.timeouts.forEach((timeout, notificationId) => {
      clearTimeout(timeout)
      this.timeouts.delete(notificationId)
    })

    // Limpiar del service worker
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

// Inicializar el servicio cuando se importe
if (typeof window !== 'undefined') {
  notificationService.initialize()
}