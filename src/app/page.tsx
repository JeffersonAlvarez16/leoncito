'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Users, Shield, Smartphone } from 'lucide-react'

export default function HomePage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  // Redirect logged in users based on their role
  useEffect(() => {
    if (!loading && user && profile) {
      if (profile.role === 'admin' || profile.role === 'tipster') {
        // Admin and tipsters go to admin panel
        router.push('/admin/users')
      } else {
        // Regular users go to feed
        router.push('/feed')
      }
    }
  }, [user, profile, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // If user is logged in, show loading while redirecting
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Redirigiendo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Apuestas Pro
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            La plataforma definitiva para gestión de picks y apuestas deportivas. 
            Análisis profesional, notificaciones instantáneas y acceso premium.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8" asChild>
              <a href="/auth">Comenzar Ahora</a>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8" asChild>
              <a href="/feed">Ver Picks Gratuitos</a>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="text-center">
            <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Análisis Pro</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Picks analizados por tipsters profesionales con track record verificado
            </p>
          </div>

          <div className="text-center">
            <div className="bg-green-100 dark:bg-green-900 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Smartphone className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">PWA Móvil</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Aplicación móvil rápida con notificaciones push instantáneas
            </p>
          </div>

          <div className="text-center">
            <div className="bg-purple-100 dark:bg-purple-900 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Seguridad</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Plataforma segura con autenticación y protección anti-leaks
            </p>
          </div>

          <div className="text-center">
            <div className="bg-orange-100 dark:bg-orange-900 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Users className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Comunidad</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Únete a una comunidad de apostadores profesionales
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-4">¿Listo para empezar?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Únete ahora y recibe acceso a picks gratuitos. Actualiza a premium para contenido exclusivo.
          </p>
          <Button size="lg" className="text-lg px-8" asChild>
            <a href="/auth">Crear Cuenta Gratis</a>
          </Button>
        </div>
      </div>
    </div>
  )
}