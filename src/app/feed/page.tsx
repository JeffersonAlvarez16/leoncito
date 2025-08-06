'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NotificationPermission } from '@/components/notification-permission'
import { NotificationStatus } from '@/components/notification-status'
import { useNotifications } from '@/hooks/use-notifications'
import { useLoadingManager } from '@/hooks/use-loading-manager'
import { usePageVisibility } from '@/hooks/use-page-visibility'
import { startNotificationChecker } from '@/lib/bet-notifications'
import { 
  Clock, 
  DollarSign, 
  Lock,
  RefreshCw,
  WifiOff
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { formatTime, formatDateTime, isToday } from '@/lib/date-utils'

interface BetWithSelections {
  id: number
  title: string
  sport: string
  league: string
  starts_at: string
  is_premium: boolean
  price_cents: number
  status: string
  outcome: string | null
  yield_pct: number | null
  published_at: string
  tipster_id: string
  bet_selections: Array<{
    id: number
    home_team: string
    away_team: string
    market: string
    line: string
    odds: number
    stake: number
    bookie: string
    result: string | null
  }>
  profiles: {
    username: string
  } | null
  hasAccess?: boolean
}

export default function FeedPage() {
  const { user } = useAuth()
  const { isEnabled: notificationsEnabled, scheduleBetNotifications } = useNotifications()
  const [bets, setBets] = useState<BetWithSelections[]>([])
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(true)
  const [filter, setFilter] = useState<'all' | 'free' | 'premium'>('all')
  const { isLoading, startLoading, stopLoading, setLoadingError, error } = useLoadingManager({ timeout: 15000 })
  const { isVisible } = usePageVisibility()
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)
  const [isOffline, setIsOffline] = useState(false)

  const fetchBets = async (forceRefresh = false) => {
    // Evitar refetch múltiples si ya se está cargando
    if (isLoading && !forceRefresh) {
      console.log('⚠️ Ya está cargando, saltando...')
      return
    }
    
    // Cache simple - no refetch si fue hace menos de 30 segundos
    const now = Date.now()
    if (!forceRefresh && now - lastFetchTime < 30000 && bets.length > 0) {
      console.log('⏰ Cache válido, saltando refetch...')
      return
    }

    try {
      console.log('🔄 Iniciando fetchBets...')
      startLoading()

      let query = supabase
        .from('bets')
        .select(`
          *,
          bet_selections (*),
          profiles (username)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false })

      // Apply filters
      if (filter === 'free') {
        query = query.eq('is_premium', false)
      } else if (filter === 'premium') {
        query = query.eq('is_premium', true)
      }

      console.log('📊 Ejecutando consulta con filtro:', filter)
      const { data: betsData, error: betsError } = await query

      if (betsError) {
        console.error('❌ Error en consulta:', betsError)
        throw betsError
      }

      console.log('✅ Consulta exitosa. Apuestas encontradas:', betsData?.length || 0)

      // Check access for premium bets if user is logged in
      let betsWithAccess = betsData || []
      
      if (user) {
        console.log('👤 Procesando con usuario logueado:', user.email)
        const premiumBetIds = betsWithAccess
          .filter(bet => bet.is_premium)
          .map(bet => bet.id)

        if (premiumBetIds.length > 0) {
          console.log('💎 Verificando acceso a', premiumBetIds.length, 'apuestas premium')
          const { data: accessData } = await supabase
            .from('access_grants')
            .select('bet_id')
            .eq('buyer_id', user.id)
            .in('bet_id', premiumBetIds)
            .or('expires_at.is.null,expires_at.gt.now()')

          const accessibleBetIds = new Set(accessData?.map(a => a.bet_id) || [])
          
          betsWithAccess = betsWithAccess.map(bet => ({
            ...bet,
            hasAccess: bet.is_premium ? accessibleBetIds.has(bet.id) : true
          }))
        } else {
          betsWithAccess = betsWithAccess.map(bet => ({
            ...bet,
            hasAccess: true
          }))
        }
      } else {
        console.log('🔓 Procesando sin usuario logueado')
        betsWithAccess = betsWithAccess.map(bet => ({
          ...bet,
          hasAccess: !bet.is_premium
        }))
      }

      console.log('📋 Estableciendo', betsWithAccess.length, 'apuestas en estado')
      setBets(betsWithAccess)
      setLastFetchTime(Date.now())
      setIsOffline(false)
      console.log('✅ fetchBets completado exitosamente')
    } catch (error: any) {
      console.error('❌ Error en fetchBets:', error)
      
      // Detectar si es error de conexión
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        setIsOffline(true)
        setLoadingError('Sin conexión a internet. Intentando reconectar...')
      } else {
        setLoadingError('Error al cargar las apuestas. Intenta refrescar.')
      }
    } finally {
      console.log('🏁 Finalizando fetchBets')
      stopLoading()
    }
  }

  // Auto-refetch cuando la página vuelve a ser visible
  useEffect(() => {
    if (isVisible && user?.id && bets.length > 0) {
      // Solo refetch si han pasado más de 2 minutos desde la última actualización
      const now = Date.now()
      if (now - lastFetchTime > 120000) {
        console.log('🔄 Auto-refetch por visibilidad')
        fetchBets()
      }
    }
  }, [isVisible, user?.id, lastFetchTime])

  // Detectar cambios de conectividad
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Volviendo online')
      setIsOffline(false)
      if (user?.id) {
        fetchBets() // Force refresh cuando volvemos online
      }
    }

    const handleOffline = () => {
      console.log('🚫 Desconectado')
      setIsOffline(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [user?.id])

  useEffect(() => {
    console.log('🔔 useEffect disparado. Filter:', filter, 'User:', user?.email || 'no-user')
    fetchBets()
  }, [filter, user?.id]) // Use user.id instead of user object to prevent infinite loops

  // Inicializar checker de notificaciones
  useEffect(() => {
    if (user && notificationsEnabled) {
      console.log('🔔 Starting notification checker...')
      const cleanup = startNotificationChecker()
      return cleanup
    }
  }, [user, notificationsEnabled])

  // Programar notificaciones para apuestas existentes al cargar
  useEffect(() => {
    if (notificationsEnabled && bets.length > 0) {
      bets.forEach(async (bet) => {
        if (bet.starts_at && new Date(bet.starts_at) > new Date()) {
          await scheduleBetNotifications({
            id: bet.id,
            title: bet.title,
            starts_at: bet.starts_at,
            bet_selections: bet.bet_selections
          })
        }
      })
    }
  }, [notificationsEnabled, bets, scheduleBetNotifications])

  const BetCard = ({ bet }: { bet: BetWithSelections }) => {
    const isPremium = bet.is_premium
    const hasAccess = bet.hasAccess !== false
    const isSettled = bet.status === 'settled'
    const gameTime = bet.starts_at ? new Date(bet.starts_at) : null
    
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:shadow-sm transition-shadow ${
        isSettled ? 
          bet.outcome === 'win' ? 'border-l-3 border-l-green-500' : 
          bet.outcome === 'lose' ? 'border-l-3 border-l-red-500' : 
          'border-l-3 border-l-gray-500' : ''
      }`}>
        
        {/* Header */}
        <div className="mb-2">
          <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1 leading-tight">
            {bet.title}
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <span>{bet.sport}</span>
              {gameTime && (
                <>
                  <span>•</span>
                  <Clock size={12} />
                  <span>{isToday(gameTime) ? formatTime(gameTime) : formatDateTime(gameTime)}</span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              {isPremium && (
                <Badge variant={hasAccess ? 'default' : 'secondary'} className="text-xs py-0 px-2 h-5">
                  <Lock size={10} className="mr-1" />
                  {hasAccess ? 'Premium' : `$${(bet.price_cents / 100).toFixed(2)}`}
                </Badge>
              )}
              
              {isSettled && bet.outcome && (
                <Badge variant={
                  bet.outcome === 'win' ? 'default' : 
                  bet.outcome === 'lose' ? 'destructive' : 'secondary'
                } className="text-xs py-0 px-2 h-5">
                  {bet.outcome.toUpperCase()}
                  {bet.yield_pct && ` ${bet.yield_pct > 0 ? '+' : ''}${bet.yield_pct.toFixed(1)}%`}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {hasAccess ? (
          <div className="space-y-2">
            {bet.bet_selections.map((selection) => (
              <div key={selection.id} className="border-l-2 border-blue-500 pl-2">
                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    {selection.market && (
                      <p className="font-medium text-xs text-blue-600 dark:text-blue-400 truncate">
                        {selection.market}
                        {selection.line && ` (${selection.line})`}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs flex-shrink-0">
                    {selection.odds && (
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        @{selection.odds}
                      </span>
                    )}
                    {selection.stake && (
                      <span className="text-gray-600 dark:text-gray-400">
                        {selection.stake}u
                      </span>
                    )}
                    {selection.result && (
                      <Badge variant={
                        selection.result === 'win' ? 'default' : 
                        selection.result === 'lose' ? 'destructive' : 'secondary'
                      } className="text-xs py-0 px-1 h-4">
                        {selection.result.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-3 border border-dashed border-gray-300 dark:border-gray-600 rounded">
            <Lock className="h-5 w-5 mx-auto text-gray-400 mb-1" />
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Premium • {formatCurrency(bet.price_cents)}
            </p>
            <Button size="sm" variant="outline" className="h-7 text-xs px-3">
              <DollarSign size={12} className="mr-1" />
              Desbloquear
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Feed</h1>
                <NotificationStatus />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Picks y análisis profesionales
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Simple filter toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {(['all', 'free', 'premium'] as const).map((filterOption) => (
                  <button
                    key={filterOption}
                    onClick={() => setFilter(filterOption)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      filter === filterOption
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    {filterOption === 'all' ? 'Todas' : filterOption === 'free' ? 'Gratis' : 'Premium'}
                  </button>
                ))}
              </div>
              
              <button 
                onClick={() => fetchBets(true)} 
                disabled={isLoading}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Notification Permission Prompt */}
        {showNotificationPrompt && (
          <NotificationPermission 
            onDismiss={() => setShowNotificationPrompt(false)}
            className="mb-4"
          />
        )}
        
        {isLoading && bets.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Cargando picks...</p>
            {error && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-2">{error}</p>
            )}
            {isOffline && (
              <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 text-sm mt-2">
                <WifiOff className="h-4 w-4" />
                <span>Sin conexión a internet</span>
              </div>
            )}
          </div>
        ) : bets.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">No hay picks disponibles</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Vuelve más tarde para ver nuevos análisis
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bets.map((bet) => (
              <BetCard key={bet.id} bet={bet} />
            ))}
          </div>
        )}
      </div>
      
      {/* Bottom padding for mobile nav */}
      <div className="md:hidden h-16" />
    </div>
  )
}