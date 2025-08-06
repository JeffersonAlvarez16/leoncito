'use client'

import { useEffect, useState } from 'react'
import { Bell, Clock, Users, Trash2, RefreshCw } from 'lucide-react'
import { notificationService, ScheduledNotification } from '@/lib/notifications'
import { useLoadingManager } from '@/hooks/use-loading-manager'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<ScheduledNotification[]>([])
  const { isLoading, startLoading, stopLoading, setLoadingError } = useLoadingManager()
  const [filter, setFilter] = useState<'all' | '30min' | '5min' | 'live'>('all')

  const fetchNotifications = async () => {
    startLoading()
    try {
      const data = await notificationService.getAllNotifications()
      setNotifications(data)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setLoadingError('Error al cargar las notificaciones')
    } finally {
      stopLoading()
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const filteredNotifications = notifications.filter(n => 
    filter === 'all' || n.notification_type === filter
  )

  const getTypeColor = (type: string) => {
    switch (type) {
      case '30min': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case '5min': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      case 'live': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case '30min': return '⏰'
      case '5min': return '🔥'
      case 'live': return '🚨'
      default: return '🔔'
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isOverdue = (scheduledTime: string) => {
    return new Date(scheduledTime) < new Date()
  }

  const deleteNotification = async (notificationId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta notificación?')) {
      return
    }

    try {
      // TODO: Implement delete functionality
      console.log('Delete notification', notificationId)
      await fetchNotifications() // Refresh list
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const stats = {
    total: notifications.length,
    pending: notifications.filter(n => !n.sent && !isOverdue(n.scheduled_time)).length,
    overdue: notifications.filter(n => !n.sent && isOverdue(n.scheduled_time)).length,
    sent: notifications.filter(n => n.sent).length
  }

  if (isLoading && notifications.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">Cargando notificaciones...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Notificaciones Programadas
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona las notificaciones automáticas del sistema
          </p>
        </div>
        <button
          onClick={fetchNotifications}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Bell className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pendientes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Vencidas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.overdue}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold">
              ✓
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Enviadas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.sent}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Todas ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('30min')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filter === '30min'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          ⏰ 30min ({notifications.filter(n => n.notification_type === '30min').length})
        </button>
        <button
          onClick={() => setFilter('5min')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filter === '5min'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          🔥 5min ({notifications.filter(n => n.notification_type === '5min').length})
        </button>
        <button
          onClick={() => setFilter('live')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filter === 'live'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          🚨 En vivo ({notifications.filter(n => n.notification_type === 'live').length})
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'all' ? 'No hay notificaciones programadas' : `No hay notificaciones de tipo ${filter}`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredNotifications.map((notification) => (
              <div key={notification.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getTypeIcon(notification.notification_type)}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(notification.notification_type)}`}>
                        {notification.notification_type}
                      </span>
                      {notification.sent && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          Enviada
                        </span>
                      )}
                      {isOverdue(notification.scheduled_time) && !notification.sent && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                          Vencida
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                      {notification.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {notification.body}
                    </p>
                    
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>📅 {formatDateTime(notification.scheduled_time)}</span>
                      {notification.bet_title && (
                        <span>🎯 {notification.bet_title}</span>
                      )}
                      {notification.home_team && notification.away_team && (
                        <span>⚽ {notification.home_team} vs {notification.away_team}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Eliminar notificación"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}