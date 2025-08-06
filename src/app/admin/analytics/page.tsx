'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MetricsDashboard } from '@/components/metrics-dashboard'
import { 
  calculateBetMetrics, 
  calculateSportMetrics, 
  calculateMonthlyMetrics,
  BetMetrics,
  SportMetrics,
  MonthlyMetrics
} from '@/lib/analytics'
import { 
  BarChart3, 
  TrendingUp,
  Calendar,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react'

export default function AdminAnalyticsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [bets, setBets] = useState<any[]>([])
  const [metrics, setMetrics] = useState<BetMetrics | null>(null)
  const [sportMetrics, setSportMetrics] = useState<SportMetrics[]>([])
  const [monthlyMetrics, setMonthlyMetrics] = useState<MonthlyMetrics[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'quarter' | 'year'>('all')

  const fetchBets = async () => {
    try {
      setIsLoading(true)

      // Calculate date filter
      let dateFilter: string | null = null
      const now = new Date()
      
      switch (timeFilter) {
        case 'month':
          dateFilter = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
          break
        case 'quarter':
          const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
          dateFilter = quarterStart.toISOString()
          break
        case 'year':
          dateFilter = new Date(now.getFullYear(), 0, 1).toISOString()
          break
      }

      let query = supabase
        .from('bets')
        .select(`
          *,
          bet_selections (*)
        `)
        .eq('tipster_id', user!.id)
        .order('published_at', { ascending: false })

      if (dateFilter) {
        query = query.gte('published_at', dateFilter)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      const betsData = data || []
      setBets(betsData)

      // Calculate metrics
      const overallMetrics = calculateBetMetrics(betsData)
      const sportStats = calculateSportMetrics(betsData)
      const monthlyStats = calculateMonthlyMetrics(betsData)

      setMetrics(overallMetrics)
      setSportMetrics(sportStats)
      setMonthlyMetrics(monthlyStats)

    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchBets()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, timeFilter])

  // Redirect if not authenticated
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    router.push('/auth')
    return null
  }

  const exportData = () => {
    if (!metrics) return

    const csvContent = [
      'Metric,Value',
      `Total Bets,${metrics.totalBets}`,
      `Win Rate,${metrics.winRate.toFixed(2)}%`,
      `Yield,${metrics.yieldPct.toFixed(2)}%`,
      `ROI,${metrics.roi.toFixed(2)}%`,
      `Total Stake,${metrics.totalStake.toFixed(2)}`,
      `Total Return,${metrics.totalReturn.toFixed(2)}`,
      `Profit,${metrics.profit.toFixed(2)}`,
      `Average Odds,${metrics.averageOdds.toFixed(2)}`
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${timeFilter}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics & Métricas</h1>
          <p className="text-muted-foreground">
            Análisis detallado de tu rendimiento como tipster
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchBets}
            disabled={isLoading}
          >
            <RefreshCw size={14} className={`mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={exportData}
            disabled={isLoading || !metrics}
          >
            <Download size={14} className="mr-1" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Time Filter */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter size={16} />
          <span className="text-sm font-medium">Período:</span>
        </div>
        <div className="flex gap-2">
          {([
            { key: 'all', label: 'Todo el Tiempo', icon: BarChart3 },
            { key: 'year', label: 'Este Año', icon: Calendar },
            { key: 'quarter', label: 'Este Trimestre', icon: TrendingUp },
            { key: 'month', label: 'Este Mes', icon: Calendar }
          ] as const).map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={timeFilter === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeFilter(key)}
            >
              <Icon size={14} className="mr-1" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Calculando métricas...</p>
        </div>
      ) : !metrics ? (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium mb-2">No hay datos suficientes</h3>
          <p className="text-muted-foreground">
            Publica algunas apuestas y márcalas como liquidadas para ver métricas
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <p className="text-2xl font-bold">{metrics.totalBets}</p>
                <p className="text-sm text-muted-foreground">Total Apuestas</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="text-2xl font-bold">{bets.filter(b => b.status === 'published').length}</p>
                <p className="text-sm text-muted-foreground">Publicadas</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                <p className="text-2xl font-bold">{bets.filter(b => b.status === 'settled').length}</p>
                <p className="text-sm text-muted-foreground">Liquidadas</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-8 w-8 mx-auto text-orange-500 mb-2" />
                <p className="text-2xl font-bold">{bets.filter(b => b.is_premium).length}</p>
                <p className="text-sm text-muted-foreground">Premium</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Metrics Dashboard */}
          <MetricsDashboard
            metrics={metrics}
            sportMetrics={sportMetrics}
            monthlyMetrics={monthlyMetrics}
          />

          {/* Additional Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Información Clave</CardTitle>
                <CardDescription>
                  Insights importantes sobre tu rendimiento
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {metrics.winRate > 55 && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <p className="text-sm">
                        Tu win rate está por encima del promedio de la industria (53%)
                      </p>
                    </div>
                  )}
                  
                  {metrics.yieldPct > 5 && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                      <p className="text-sm">
                        Excelente yield - mantén esta consistencia
                      </p>
                    </div>
                  )}
                  
                  {metrics.averageOdds > 2 && (
                    <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      <p className="text-sm">
                        Buena selección de cuotas de valor
                      </p>
                    </div>
                  )}
                  
                  {metrics.totalBets >= 100 && (
                    <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                      <Calendar className="h-4 w-4 text-orange-600" />
                      <p className="text-sm">
                        Muestra estadísticamente significativa (100+ apuestas)
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Próximos Objetivos</CardTitle>
                <CardDescription>
                  Metas sugeridas para mejorar tu rendimiento
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium text-sm">Win Rate Objetivo</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">
                        Actual: {metrics.winRate.toFixed(1)}%
                      </span>
                      <Badge variant="outline">55%+</Badge>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium text-sm">Yield Objetivo</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">
                        Actual: {metrics.yieldPct.toFixed(1)}%
                      </span>
                      <Badge variant="outline">8%+</Badge>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium text-sm">Volumen Mensual</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">
                        Mantén consistencia
                      </span>
                      <Badge variant="outline">20+ picks/mes</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}