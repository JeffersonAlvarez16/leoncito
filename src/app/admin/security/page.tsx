'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Shield,
  AlertTriangle,
  Activity,
  Eye,
  Calendar,
  Clock,
  MapPin,
  Smartphone,
  Monitor,
  Ban,
  RefreshCw,
  TrendingUp,
  Users,
  Lock,
  Unlock,
  Search
} from 'lucide-react'

interface LoginAttempt {
  id: string
  user_id: string
  email: string
  username?: string
  ip_address?: string
  user_agent?: string
  success: boolean
  attempt_time: string
  location?: string
  device_type: 'mobile' | 'desktop' | 'unknown'
  is_suspicious: boolean
  failure_reason?: string
}

interface SecurityMetrics {
  total_attempts_today: number
  failed_attempts_today: number
  blocked_ips: number
  suspicious_activity: number
  active_sessions: number
  banned_users: number
}

interface BlockedIP {
  ip_address: string
  reason?: string
  blocked_at: string
  is_permanent: boolean
}

export default function AdminSecurityPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([])
  const [blockedIps, setBlockedIps] = useState<BlockedIP[]>([])
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    total_attempts_today: 0,
    failed_attempts_today: 0,
    blocked_ips: 0,
    suspicious_activity: 0,
    active_sessions: 0,
    banned_users: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed' | 'suspicious'>('all')
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('today')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
      return
    }

    if (user) {
      fetchSecurityData()
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchSecurityData, 30000)
      return () => clearInterval(interval)
    }
  }, [user, loading, router])

  const fetchSecurityData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Obtener intentos de login reales de la base de datos
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('login_attempts')
        .select('*')
        .order('attempt_time', { ascending: false })
        .limit(100)

      if (attemptsError) {
        console.error('Error fetching login attempts:', attemptsError)
      }

      // Procesar los intentos de login
      const loginAttemptsList: LoginAttempt[] = (attemptsData || []).map(attempt => {
        // Detectar el tipo de dispositivo basado en el user agent
        const userAgent = attempt.user_agent || ''
        let deviceType: 'mobile' | 'desktop' | 'unknown' = 'unknown'
        
        if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
          deviceType = 'mobile'
        } else if (userAgent.includes('Windows') || userAgent.includes('Mac') || userAgent.includes('Linux')) {
          deviceType = 'desktop'
        }

        return {
          ...attempt,
          device_type: deviceType,
          location: attempt.location || 'Desconocido'
        }
      })

      // Obtener IPs bloqueadas
      const { data: blockedIpsData, error: blockedIpsError } = await supabase
        .from('blocked_ips')
        .select('*')

      if (blockedIpsError) {
        console.error('Error fetching blocked IPs:', blockedIpsError)
      }

      // Obtener usuarios baneados
      const { data: bannedUsers, error: bannedError } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_banned', true)

      if (bannedError) {
        console.error('Error fetching banned users:', bannedError)
      }

      // Obtener perfiles para contar sesiones activas (usuarios que se loguearon en las últimas 24 horas)
      const yesterday = new Date(Date.now() - 86400000).toISOString()
      const { data: activeSessions, error: sessionsError } = await supabase
        .from('profiles')
        .select('id')
        .gte('updated_at', yesterday)

      if (sessionsError) {
        console.error('Error fetching active sessions:', sessionsError)
      }

      // Calcular métricas del día
      const today = new Date()
      const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString()
      
      const todayAttempts = loginAttemptsList.filter(attempt => {
        return new Date(attempt.attempt_time) >= new Date(todayStart)
      })

      const newMetrics: SecurityMetrics = {
        total_attempts_today: todayAttempts.length,
        failed_attempts_today: todayAttempts.filter(a => !a.success).length,
        blocked_ips: blockedIpsData?.length || 0,
        suspicious_activity: loginAttemptsList.filter(a => a.is_suspicious).length,
        active_sessions: activeSessions?.length || 0,
        banned_users: bannedUsers?.length || 0
      }

      setLoginAttempts(loginAttemptsList)
      setBlockedIps(blockedIpsData || [])
      setMetrics(newMetrics)
      
    } catch (error) {
      console.error('Error fetching security data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const blockIP = async (ipAddress: string) => {
    try {
      console.log('Blocking IP:', ipAddress)
      
      // Insertar IP en la tabla de IPs bloqueadas
      const { error } = await supabase
        .from('blocked_ips')
        .insert({
          ip_address: ipAddress,
          reason: 'Bloqueada manualmente por administrador',
          is_permanent: false
        })

      if (error) {
        console.error('Error blocking IP:', error)
        alert(`Error bloqueando IP ${ipAddress}: ${error.message}`)
        return
      }

      // Marcar todos los intentos de esta IP como sospechosos
      await supabase
        .from('login_attempts')
        .update({ is_suspicious: true })
        .eq('ip_address', ipAddress)

      alert(`IP ${ipAddress} ha sido bloqueada exitosamente`)
      
      // Actualizar datos
      fetchSecurityData()
    } catch (error) {
      console.error('Error blocking IP:', error)
      alert('Error bloqueando la IP')
    }
  }

  const unblockIP = async (ipAddress: string) => {
    try {
      console.log('Unblocking IP:', ipAddress)
      
      // Eliminar IP de la tabla de IPs bloqueadas
      const { error } = await supabase
        .from('blocked_ips')
        .delete()
        .eq('ip_address', ipAddress)

      if (error) {
        console.error('Error unblocking IP:', error)
        alert(`Error desbloqueando IP ${ipAddress}: ${error.message}`)
        return
      }

      // Opcional: marcar intentos como no sospechosos
      await supabase
        .from('login_attempts')
        .update({ is_suspicious: false })
        .eq('ip_address', ipAddress)

      alert(`IP ${ipAddress} ha sido desbloqueada exitosamente`)
      
      // Actualizar datos
      fetchSecurityData()
    } catch (error) {
      console.error('Error unblocking IP:', error)
      alert('Error desbloqueando la IP')
    }
  }

  // Filter attempts based on search and filters
  const filteredAttempts = loginAttempts.filter(attempt => {
    const matchesSearch = 
      attempt.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (attempt.ip_address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (attempt.username || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'success' && attempt.success) ||
      (statusFilter === 'failed' && !attempt.success) ||
      (statusFilter === 'suspicious' && attempt.is_suspicious)

    // Time filter logic would go here
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (attempt: LoginAttempt) => {
    if (attempt.is_suspicious) {
      return <Badge variant="destructive">Sospechoso</Badge>
    }
    if (attempt.success) {
      return <Badge className="bg-green-500">Exitoso</Badge>
    }
    return <Badge variant="secondary">Fallido</Badge>
  }

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />
      case 'desktop':
        return <Monitor className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Centro de Seguridad
        </h1>
        <p className="text-muted-foreground">
          Monitorea intentos de login, detecta actividad sospechosa y controla la seguridad
        </p>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.total_attempts_today}</p>
                <p className="text-xs text-muted-foreground">Intentos Hoy</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.failed_attempts_today}</p>
                <p className="text-xs text-muted-foreground">Fallos Hoy</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.blocked_ips}</p>
                <p className="text-xs text-muted-foreground">IPs Bloqueadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.suspicious_activity}</p>
                <p className="text-xs text-muted-foreground">Sospechosos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.active_sessions}</p>
                <p className="text-xs text-muted-foreground">Sesiones</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.banned_users}</p>
                <p className="text-xs text-muted-foreground">Baneados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Filtros de Actividad</CardTitle>
            <Button onClick={fetchSecurityData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Email, IP, usuario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label>Estado</Label>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="success">Exitosos</SelectItem>
                  <SelectItem value="failed">Fallidos</SelectItem>
                  <SelectItem value="suspicious">Sospechosos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Período</Label>
              <Select value={timeFilter} onValueChange={(value: any) => setTimeFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="week">Esta semana</SelectItem>
                  <SelectItem value="month">Este mes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Login Attempts Log */}
      <Card>
        <CardHeader>
          <CardTitle>
            Registro de Intentos de Login ({filteredAttempts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Usuario</th>
                  <th className="text-left p-4 font-medium">IP / Ubicación</th>
                  <th className="text-left p-4 font-medium">Dispositivo</th>
                  <th className="text-left p-4 font-medium">Estado</th>
                  <th className="text-left p-4 font-medium">Tiempo</th>
                  <th className="text-left p-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttempts.map((attempt) => (
                  <tr key={attempt.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{attempt.email}</div>
                        {attempt.username && (
                          <div className="text-sm text-muted-foreground">
                            @{attempt.username}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="font-mono text-sm">{attempt.ip_address}</span>
                        </div>
                        {attempt.location && (
                          <div className="text-xs text-muted-foreground">
                            {attempt.location}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(attempt.device_type)}
                        <span className="text-sm capitalize">{attempt.device_type}</span>
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div className="space-y-1">
                        {getStatusBadge(attempt)}
                        {attempt.failure_reason && (
                          <div className="text-xs text-red-600">
                            {attempt.failure_reason}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(attempt.attempt_time).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(attempt.attempt_time).toLocaleTimeString()}
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div className="flex gap-2">
                        {attempt.ip_address && (
                          <>
                            {blockedIps.some(blocked => blocked.ip_address === attempt.ip_address) ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => unblockIP(attempt.ip_address!)}
                              >
                                <Unlock className="h-3 w-3 mr-1" />
                                Desbloquear
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => blockIP(attempt.ip_address!)}
                              >
                                <Lock className="h-3 w-3 mr-1" />
                                Bloquear IP
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredAttempts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron intentos de login con los filtros aplicados</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}