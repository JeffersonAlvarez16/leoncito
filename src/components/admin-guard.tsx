'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'

interface AdminGuardProps {
  children: React.ReactNode
  fallbackPath?: string
}

export function AdminGuard({ children, fallbackPath = '/feed' }: AdminGuardProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // No hay usuario logueado, redirigir al login
        router.push('/auth')
        return
      }

      if (!profile) {
        // No hay perfil, esperar a que cargue
        return
      }

      // Solo admin y tipster pueden acceder
      if (profile.role !== 'admin' && profile.role !== 'tipster') {
        console.log('Access denied: User role is', profile.role, 'redirecting to', fallbackPath)
        router.push(fallbackPath)
        return
      }
    }
  }, [user, profile, loading, router, fallbackPath])

  // Mostrar loading mientras se verifica
  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Usuario no logueado
  if (!user) {
    return null
  }

  // Usuario sin permisos
  if (profile.role !== 'admin' && profile.role !== 'tipster') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Acceso Denegado</h2>
          <p className="text-gray-600 mb-4">No tienes permisos para acceder a esta página</p>
          <p className="text-sm text-gray-500">Redirigiendo...</p>
        </div>
      </div>
    )
  }

  // Usuario con permisos - mostrar contenido
  return <>{children}</>
}