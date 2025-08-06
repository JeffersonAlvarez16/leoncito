'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useNotifications } from '@/hooks/use-notifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Bell, 
  User, 
  Shield, 
  Settings,
  Check,
  X,
  Clock,
  Smartphone,
  AlertTriangle
} from 'lucide-react'

export default function ProfilePage() {
  const { user, profile, signOut } = useAuth()
  const { 
    isSupported, 
    permission, 
    isEnabled, 
    canRequest, 
    isLoading,
    requestPermission,
    sendNotification,
    getStatus 
  } = useNotifications()

  const [testNotificationSent, setTestNotificationSent] = useState(false)

  const handleEnableNotifications = async () => {
    const granted = await requestPermission()
    if (granted) {
      await sendTestNotification()
    }
  }

  const sendTestNotification = async () => {
    const success = await sendNotification({
      title: '🔔 ¡Notificaciones activadas!',
      body: 'Ahora recibirás alertas de tus picks favoritos',
      icon: '/icons/icon-192x192.png',
      tag: 'test-notification'
    })
    
    if (success) {
      setTestNotificationSent(true)
    }
  }

  const getNotificationStatusInfo = () => {
    const status = getStatus()
    
    if (!status.supported) {
      return {
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
        icon: X,
        title: 'No soportadas',
        description: 'Tu navegador no soporta notificaciones push'
      }
    }

    switch (status.permission) {
      case 'granted':
        return {
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
          icon: Check,
          title: 'Activadas',
          description: 'Recibirás notificaciones de tus picks'
        }
      case 'denied':
        return {
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
          icon: X,
          title: 'Bloqueadas',
          description: 'Debes habilitar notificaciones en tu navegador'
        }
      default:
        return {
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
          icon: AlertTriangle,
          title: 'Pendientes',
          description: 'Haz clic para habilitar notificaciones'
        }
    }
  }

  const notificationInfo = getNotificationStatusInfo()
  const StatusIcon = notificationInfo.icon

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Acceso denegado
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Debes iniciar sesión para ver tu perfil
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mi Perfil</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Gestiona tu cuenta y preferencias
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        
        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={20} />
              Información de cuenta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Email</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Rol</p>
                <div className="mt-1">
                  <Badge variant={profile?.role === 'admin' ? 'default' : 'secondary'}>
                    <Shield size={12} className="mr-1" />
                    {profile?.role || 'user'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell size={20} />
              Notificaciones Push
            </CardTitle>
            <CardDescription>
              Recibe alertas cuando hay nuevos picks disponibles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Status */}
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${notificationInfo.color}`}>
                  <StatusIcon size={16} />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {notificationInfo.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {notificationInfo.description}
                  </p>
                </div>
              </div>

              {canRequest && (
                <Button 
                  onClick={handleEnableNotifications}
                  disabled={isLoading}
                  className="shrink-0"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Activando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Bell size={16} />
                      Activar
                    </div>
                  )}
                </Button>
              )}
            </div>

            {/* Notification Features */}
            {isEnabled && (
              <div className="space-y-3 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <Check size={16} />
                  <span className="font-medium">Notificaciones activas</span>
                </div>
                
                <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    <span>30 minutos antes de cada partido</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    <span>5 minutos antes (recordatorio urgente)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone size={14} />
                    <span>Al inicio del partido</span>
                  </div>
                </div>

                {!testNotificationSent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={sendTestNotification}
                    className="mt-3"
                  >
                    <Bell size={14} className="mr-2" />
                    Enviar notificación de prueba
                  </Button>
                )}

                {testNotificationSent && (
                  <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300 mt-3">
                    <Check size={14} />
                    <span>Notificación de prueba enviada</span>
                  </div>
                )}
              </div>
            )}

            {permission === 'denied' && (
              <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="text-red-800 dark:text-red-200">
                  <p className="font-medium mb-2">Notificaciones bloqueadas</p>
                  <p className="text-sm">
                    Para habilitarlas, haz clic en el ícono de candado/configuración en la barra de direcciones 
                    de tu navegador y permite las notificaciones para este sitio.
                  </p>
                </div>
              </div>
            )}

            {!isSupported && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="text-gray-600 dark:text-gray-400">
                  <p className="font-medium mb-2">Notificaciones no disponibles</p>
                  <p className="text-sm">
                    Tu navegador no soporta notificaciones push. Considera usar un navegador más reciente.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings size={20} />
              Acciones de cuenta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              onClick={signOut}
              className="w-full sm:w-auto"
            >
              Cerrar Sesión
            </Button>
          </CardContent>
        </Card>

      </div>
      
      {/* Bottom padding for mobile nav */}
      <div className="md:hidden h-16" />
    </div>
  )
}