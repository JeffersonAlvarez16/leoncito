'use client'

import { useState } from 'react'
import { useNotifications } from '@/hooks/use-notifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, BellOff, X } from 'lucide-react'

interface NotificationPermissionProps {
  onDismiss?: () => void
  className?: string
}

export function NotificationPermission({ onDismiss, className }: NotificationPermissionProps) {
  const { isSupported, permission, canRequest, isLoading, requestPermission } = useNotifications()
  const [dismissed, setDismissed] = useState(false)

  // No mostrar si no está soportado o si ya se concedió permiso
  if (!isSupported || permission === 'granted' || dismissed) {
    return null
  }

  const handleRequest = async () => {
    const granted = await requestPermission()
    if (granted) {
      onDismiss?.()
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  if (permission === 'denied') {
    return (
      <Card className={`border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950 ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellOff className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <CardTitle className="text-sm text-yellow-900 dark:text-yellow-100">
                Notificaciones bloqueadas
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0 text-yellow-600 hover:text-yellow-700"
            >
              <X size={14} />
            </Button>
          </div>
          <CardDescription className="text-yellow-700 dark:text-yellow-300 text-sm">
            Habilitá las notificaciones en tu navegador para recibir alertas de tus picks
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className={`border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-sm text-blue-900 dark:text-blue-100">
              Recibí alertas de tus picks
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
          >
            <X size={14} />
          </Button>
        </div>
        <CardDescription className="text-blue-700 dark:text-blue-300 text-sm">
          Te notificaremos 30 min y 5 min antes de cada partido
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2">
          <Button
            onClick={handleRequest}
            disabled={isLoading || !canRequest}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? 'Solicitando...' : 'Habilitar notificaciones'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismiss}
            className="text-blue-600 border-blue-200"
          >
            Más tarde
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}