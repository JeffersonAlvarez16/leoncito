// Analytics and metrics utilities

export interface BetMetrics {
  totalBets: number
  wins: number
  losses: number
  pushes: number
  winRate: number
  yieldPct: number
  roi: number
  totalStake: number
  totalReturn: number
  averageOdds: number
  profit: number
}

export interface SportMetrics {
  sport: string
  bets: number
  wins: number
  winRate: number
  yieldPct: number
  profit: number
}

export interface MonthlyMetrics {
  month: string
  bets: number
  wins: number
  profit: number
  yieldPct: number
}

export function calculateBetMetrics(bets: any[]): BetMetrics {
  const settledBets = bets.filter(bet => bet.status === 'settled' && bet.outcome)
  
  if (settledBets.length === 0) {
    return {
      totalBets: bets.length,
      wins: 0,
      losses: 0,
      pushes: 0,
      winRate: 0,
      yieldPct: 0,
      roi: 0,
      totalStake: 0,
      totalReturn: 0,
      averageOdds: 0,
      profit: 0
    }
  }

  const wins = settledBets.filter(bet => bet.outcome === 'win').length
  const losses = settledBets.filter(bet => bet.outcome === 'lose').length
  const pushes = settledBets.filter(bet => bet.outcome === 'push').length

  // Calculate totals from bet_selections
  let totalStake = 0
  let totalReturn = 0
  let totalOdds = 0
  let oddsCount = 0

  settledBets.forEach(bet => {
    if (bet.bet_selections && bet.bet_selections.length > 0) {
      bet.bet_selections.forEach((selection: any) => {
        const stake = selection.stake || 1
        const odds = selection.odds || 1

        totalStake += stake
        totalOdds += odds
        oddsCount++

        if (selection.result === 'win') {
          totalReturn += stake * odds
        } else if (selection.result === 'push') {
          totalReturn += stake // Return original stake
        }
        // For losses, return is 0
      })
    }
  })

  const profit = totalReturn - totalStake
  const winRate = settledBets.length > 0 ? (wins / settledBets.length) * 100 : 0
  const yieldPct = totalStake > 0 ? (profit / totalStake) * 100 : 0
  const roi = totalStake > 0 ? (totalReturn / totalStake - 1) * 100 : 0
  const averageOdds = oddsCount > 0 ? totalOdds / oddsCount : 0

  return {
    totalBets: bets.length,
    wins,
    losses,
    pushes,
    winRate,
    yieldPct,
    roi,
    totalStake,
    totalReturn,
    averageOdds,
    profit
  }
}

export function calculateSportMetrics(bets: any[]): SportMetrics[] {
  const sportGroups: Record<string, any[]> = {}
  
  bets.forEach(bet => {
    const sport = bet.sport || 'Unknown'
    if (!sportGroups[sport]) {
      sportGroups[sport] = []
    }
    sportGroups[sport].push(bet)
  })

  return Object.entries(sportGroups).map(([sport, sportBets]) => {
    const metrics = calculateBetMetrics(sportBets)
    
    return {
      sport,
      bets: metrics.totalBets,
      wins: metrics.wins,
      winRate: metrics.winRate,
      yieldPct: metrics.yieldPct,
      profit: metrics.profit
    }
  }).sort((a, b) => b.bets - a.bets) // Sort by number of bets
}

export function calculateMonthlyMetrics(bets: any[]): MonthlyMetrics[] {
  const monthGroups: Record<string, any[]> = {}
  
  bets.forEach(bet => {
    if (bet.published_at) {
      const date = new Date(bet.published_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = []
      }
      monthGroups[monthKey].push(bet)
    }
  })

  return Object.entries(monthGroups).map(([month, monthBets]) => {
    const metrics = calculateBetMetrics(monthBets)
    
    return {
      month,
      bets: metrics.totalBets,
      wins: metrics.wins,
      profit: metrics.profit,
      yieldPct: metrics.yieldPct
    }
  }).sort((a, b) => a.month.localeCompare(b.month))
}

export function formatMetric(value: number, type: 'percentage' | 'currency' | 'number' | 'decimal'): string {
  switch (type) {
    case 'percentage':
      return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
    case 'currency':
      return new Intl.NumberFormat('es-EC', {
        style: 'currency',
        currency: 'USD'
      }).format(value)
    case 'decimal':
      return value.toFixed(2)
    case 'number':
    default:
      return Math.round(value).toString()
  }
}

export function getMetricColor(value: number, type: 'profit' | 'percentage' | 'neutral'): string {
  if (type === 'neutral') return 'text-foreground'
  
  if (value > 0) return 'text-green-600 dark:text-green-400'
  if (value < 0) return 'text-red-600 dark:text-red-400'
  return 'text-muted-foreground'
}

export function getPerformanceRating(winRate: number, yieldPct: number): {
  rating: string
  color: string
  description: string
} {
  if (winRate >= 60 && yieldPct >= 10) {
    return {
      rating: 'Excelente',
      color: 'text-green-600 dark:text-green-400',
      description: 'Rendimiento excepcional'
    }
  } else if (winRate >= 55 && yieldPct >= 5) {
    return {
      rating: 'Muy Bueno',
      color: 'text-green-600 dark:text-green-400',
      description: 'Rendimiento por encima del promedio'
    }
  } else if (winRate >= 50 && yieldPct >= 0) {
    return {
      rating: 'Bueno',
      color: 'text-blue-600 dark:text-blue-400',
      description: 'Rendimiento sólido'
    }
  } else if (winRate >= 45 && yieldPct >= -5) {
    return {
      rating: 'Regular',
      color: 'text-yellow-600 dark:text-yellow-400',
      description: 'Rendimiento promedio'
    }
  } else {
    return {
      rating: 'Necesita Mejorar',
      color: 'text-red-600 dark:text-red-400',
      description: 'Rendimiento por debajo del promedio'
    }
  }
}