'use client'

import { usePushNotifications } from '@/hooks/use-push-notifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, BellOff, AlertCircle, CheckCircle } from 'lucide-react'

export function NotificationSettings() {
  const {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
    error
  } = usePushNotifications()

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notificaciones Push
          </CardTitle>
          <CardDescription>
            Las notificaciones push no están soportadas en este navegador
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const handleToggleNotifications = async () => {
    if (isSubscribed) {
      await unsubscribe()
    } else {
      await subscribe()
    }
  }

  const getStatusInfo = () => {
    if (permission === 'denied') {
      return {
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        title: 'Notificaciones Bloqueadas',
        description: 'Has bloqueado las notificaciones. Habilítalas en la configuración del navegador.'
      }
    }
    
    if (isSubscribed) {
      return {
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        title: 'Notificaciones Activas',
        description: 'Recibirás notificaciones cuando haya nuevas apuestas disponibles.'
      }
    }

    return {
      icon: <Bell className="h-5 w-5 text-muted-foreground" />,
      title: 'Notificaciones Inactivas',
      description: 'Activa las notificaciones para recibir nuevas apuestas al instante.'
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {statusInfo.icon}
          Notificaciones Push
        </CardTitle>
        <CardDescription>
          {statusInfo.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          </div>
        )}

        {permission !== 'denied' && (
          <Button
            onClick={handleToggleNotifications}
            disabled={isLoading}
            variant={isSubscribed ? 'outline' : 'default'}
            className="w-full"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                Procesando...
              </div>
            ) : (
              <>
                {isSubscribed ? (
                  <>
                    <BellOff className="h-4 w-4 mr-2" />
                    Desactivar Notificaciones
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4 mr-2" />
                    Activar Notificaciones
                  </>
                )}
              </>
            )}
          </Button>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Recibe notificaciones cuando se publiquen nuevas apuestas</p>
          <p>• Solo se envían notificaciones de deportes y tipsters que sigues</p>
          <p>• Puedes desactivar las notificaciones en cualquier momento</p>
        </div>
      </CardContent>
    </Card>
  )
}