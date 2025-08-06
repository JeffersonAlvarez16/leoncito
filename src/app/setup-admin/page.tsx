'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  UserPlus,
  Mail,
  Lock,
  User,
  Shield,
  AlertCircle,
  Crown
} from 'lucide-react'

export default function SetupAdminPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    email: 'admin@test.com',
    password: 'admin123456',
    confirmPassword: 'admin123456',
    username: 'admin'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Validaciones
    if (!formData.email || !formData.password || !formData.username) {
      setError('Por favor completa todos los campos requeridos')
      return
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    try {
      setIsLoading(true)

      // Llamar a la función Edge para crear el primer admin
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email,
          password: formData.password,
          username: formData.username,
          role: 'admin',
          createFirstAdmin: true // Flag especial para bypass de verificación
        }
      })

      if (error) {
        console.error('Error calling create-user function:', error)
        setError(error.message || 'Error creando el usuario admin')
        return
      }

      if (!data.success) {
        setError(data.error || 'Error creando el usuario admin')
        return
      }

      setSuccess(true)
      
      // Redirigir después de 3 segundos
      setTimeout(() => {
        router.push('/auth')
      }, 3000)

    } catch (error) {
      console.error('Error creating admin user:', error)
      setError('Error inesperado al crear el usuario admin')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <Crown className="h-12 w-12 mx-auto text-green-600 mb-4" />
            <CardTitle className="text-xl text-green-900">
              ¡Admin Creado Exitosamente!
            </CardTitle>
            <CardDescription className="text-green-700">
              Tu usuario administrador ha sido configurado
            </CardDescription>
          </CardHeader>
          
          <CardContent className="text-center">
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-medium mb-2">Credenciales de Admin:</h3>
                <div className="text-sm space-y-1">
                  <p><strong>Email:</strong> {formData.email}</p>
                  <p><strong>Username:</strong> {formData.username}</p>
                  <p><strong>Rol:</strong> Administrador</p>
                </div>
              </div>
              
              <p className="text-sm text-green-700">
                Redirigiendo al login en 3 segundos...
              </p>
              
              <Button onClick={() => router.push('/auth')} className="w-full">
                Ir al Login Ahora
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Crown className="h-12 w-12 mx-auto text-indigo-600 mb-4" />
          <CardTitle className="text-2xl">Configuración Inicial</CardTitle>
          <CardDescription>
            Crea el primer usuario administrador del sistema
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-900">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email de Administrador *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Nombre de Usuario *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="admin"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repite la contraseña"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">Rol: Administrador</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Tendrás acceso completo al sistema
              </p>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creando Administrador...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Crear Administrador
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}