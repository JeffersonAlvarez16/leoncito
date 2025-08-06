'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Target,
  BarChart3,
  Trophy,
  Zap
} from 'lucide-react'
import { 
  BetMetrics, 
  SportMetrics, 
  MonthlyMetrics,
  formatMetric, 
  getMetricColor,
  getPerformanceRating
} from '@/lib/analytics'

interface MetricsDashboardProps {
  metrics: BetMetrics
  sportMetrics: SportMetrics[]
  monthlyMetrics: MonthlyMetrics[]
  className?: string
}

export function MetricsDashboard({
  metrics,
  sportMetrics,
  monthlyMetrics,
  className = ''
}: MetricsDashboardProps) {
  const performanceRating = getPerformanceRating(metrics.winRate, metrics.yieldPct)

  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    type = 'number',
    colorType = 'neutral' 
  }: {
    title: string
    value: number
    subtitle?: string
    icon: any
    type?: 'percentage' | 'currency' | 'number' | 'decimal'
    colorType?: 'profit' | 'percentage' | 'neutral'
  }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold ${getMetricColor(value, colorType)}`}>
              {formatMetric(value, type)}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className="p-2 bg-muted rounded-lg">
            <Icon size={20} className="text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Resumen de Rendimiento</CardTitle>
              <CardDescription>
                Métricas generales de tus apuestas
              </CardDescription>
            </div>
            <Badge className={performanceRating.color}>
              <Trophy size={14} className="mr-1" />
              {performanceRating.rating}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {performanceRating.description}
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{metrics.totalBets}</p>
              <p className="text-xs text-muted-foreground">Total Apuestas</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${getMetricColor(metrics.winRate, 'percentage')}`}>
                {formatMetric(metrics.winRate, 'percentage')}
              </p>
              <p className="text-xs text-muted-foreground">Win Rate</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${getMetricColor(metrics.yieldPct, 'profit')}`}>
                {formatMetric(metrics.yieldPct, 'percentage')}
              </p>
              <p className="text-xs text-muted-foreground">Yield</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${getMetricColor(metrics.profit, 'profit')}`}>
                {formatMetric(metrics.profit, 'currency')}
              </p>
              <p className="text-xs text-muted-foreground">Profit</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Win Rate"
          value={metrics.winRate}
          subtitle={`${metrics.wins}W-${metrics.losses}L-${metrics.pushes}P`}
          icon={Target}
          type="percentage"
          colorType="percentage"
        />
        
        <MetricCard
          title="Yield"
          value={metrics.yieldPct}
          subtitle="Retorno sobre inversión"
          icon={TrendingUp}
          type="percentage"
          colorType="profit"
        />
        
        <MetricCard
          title="ROI"
          value={metrics.roi}
          subtitle="Return on Investment"
          icon={DollarSign}
          type="percentage"
          colorType="profit"
        />
        
        <MetricCard
          title="Cuota Promedio"
          value={metrics.averageOdds}
          subtitle="Promedio de odds"
          icon={BarChart3}
          type="decimal"
        />
      </div>

      {/* Advanced Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Total Stake"
          value={metrics.totalStake}
          subtitle="Unidades apostadas"
          icon={Zap}
          type="decimal"
        />
        
        <MetricCard
          title="Total Return"
          value={metrics.totalReturn}
          subtitle="Unidades devueltas"
          icon={TrendingUp}
          type="decimal"
        />
        
        <MetricCard
          title="Profit Neto"
          value={metrics.profit}
          subtitle="Ganancia/Pérdida"
          icon={DollarSign}
          type="decimal"
          colorType="profit"
        />
      </div>

      {/* Sport Breakdown */}
      {sportMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rendimiento por Deporte</CardTitle>
            <CardDescription>
              Análisis de performance por categoría deportiva
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              {sportMetrics.slice(0, 5).map((sport) => (
                <div key={sport.sport} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{sport.sport}</p>
                    <p className="text-sm text-muted-foreground">
                      {sport.bets} apuestas • {sport.wins} ganadas
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className={`font-semibold ${getMetricColor(sport.winRate, 'percentage')}`}>
                      {formatMetric(sport.winRate, 'percentage')}
                    </p>
                    <p className={`text-sm ${getMetricColor(sport.yieldPct, 'profit')}`}>
                      Yield: {formatMetric(sport.yieldPct, 'percentage')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Trend */}
      {monthlyMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tendencia Mensual</CardTitle>
            <CardDescription>
              Evolución del rendimiento en el tiempo
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              {monthlyMetrics.slice(-6).map((month) => {
                const [year, monthNum] = month.month.split('-')
                const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('es', { 
                  month: 'long', 
                  year: 'numeric' 
                })
                
                return (
                  <div key={month.month} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium capitalize">{monthName}</p>
                      <p className="text-sm text-muted-foreground">
                        {month.bets} apuestas • {month.wins} ganadas
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className={`font-semibold ${getMetricColor(month.profit, 'profit')}`}>
                        {formatMetric(month.profit, 'decimal')}u
                      </p>
                      <p className={`text-sm ${getMetricColor(month.yieldPct, 'profit')}`}>
                        {formatMetric(month.yieldPct, 'percentage')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}