'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft,
  ExternalLink,
  Settings,
  CheckCircle,
  AlertTriangle,
  Copy
} from 'lucide-react'

export default function UserSetupPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const supabaseUrl = 'https://supabase.com/dashboard/project/pttxlvvzhkkejpzuhdut/auth/settings'

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/users')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Usuarios
        </Button>
        
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Configuración de Usuarios
        </h1>
        <p className="text-muted-foreground">
          Configura Supabase para permitir la creación de usuarios desde el admin
        </p>
      </div>

      <div className="space-y-6">
        {/* Problema identificado */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              Problema Identificado
            </CardTitle>
            <CardDescription className="text-yellow-700">
              La creación de usuarios está fallando con &quot;Database error creating new user&quot;
            </CardDescription>
          </CardHeader>
          <CardContent className="text-yellow-800">
            <p>
              <strong>Causa:</strong> Supabase tiene deshabilitado el registro de nuevos usuarios por defecto.
              Esto impide que la función Edge pueda crear usuarios, incluso usando la service role key.
            </p>
          </CardContent>
        </Card>

        {/* Solución paso a paso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Solución: Habilitar Signup Temporalmente
            </CardTitle>
            <CardDescription>
              Sigue estos pasos para permitir que el admin pueda crear usuarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium">Abrir Dashboard de Supabase</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      Auth → Settings
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(supabaseUrl, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Abrir
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium">Buscar &quot;User Signups&quot;</p>
                  <p className="text-sm text-muted-foreground">
                    En la sección de configuración de autenticación
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-medium">Habilitar estas opciones:</p>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <code className="text-sm">Allow new users to sign up</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <code className="text-sm">Enable email confirmations = false</code>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <div className="flex-1">
                  <p className="font-medium">Guardar cambios</p>
                  <p className="text-sm text-muted-foreground">
                    Haz clic en &quot;Save&quot; en el Dashboard
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  5
                </div>
                <div className="flex-1">
                  <p className="font-medium">¡Listo! Probar creación de usuarios</p>
                  <Button
                    size="sm"
                    onClick={() => router.push('/admin/users/create')}
                    className="mt-2"
                  >
                    Crear Usuario Ahora
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alternativa manual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Alternativa: Creación Manual
            </CardTitle>
            <CardDescription>
              Si prefieres no habilitar signup, puedes crear usuarios manualmente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p>1. Ve a <strong>Dashboard → Auth → Users</strong></p>
              <p>2. Haz clic en <strong>&quot;Add user&quot;</strong></p>
              <p>3. Completa email y password</p>
              <p>4. Marca <strong>&quot;Auto Confirm User&quot;</strong></p>
              <p>5. El perfil se creará automáticamente en la base de datos</p>
              
              <Button
                variant="outline"
                onClick={() => window.open('https://supabase.com/dashboard/project/pttxlvvzhkkejpzuhdut/auth/users', '_blank')}
                className="mt-3"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ir a Users Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estado después de configurar */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Después de la Configuración
            </CardTitle>
          </CardHeader>
          <CardContent className="text-green-800">
            <p className="mb-3">Una vez completada la configuración:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>✅ El admin podrá crear usuarios desde la interfaz web</li>
              <li>✅ La función Edge funcionará perfectamente</li>
              <li>✅ Los usuarios se crearán con perfiles automáticamente</li>
              <li>✅ Se mantendrá la seguridad (solo admin puede crear usuarios)</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}