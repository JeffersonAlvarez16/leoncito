'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/auth-provider'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  Minus
} from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

interface BetWithSelections {
  id: number
  title: string
  sport: string
  league: string
  starts_at: string
  is_premium: boolean
  price_cents: number
  status: 'draft' | 'published' | 'settled' | 'void'
  outcome: 'win' | 'lose' | 'push' | null
  yield_pct: number | null
  published_at: string
  created_at: string
  bet_selections: Array<{
    id: number
    home_team: string
    away_team: string
    market: string
    odds: number
    result: string | null
  }>
}

export default function AdminBetsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [bets, setBets] = useState<BetWithSelections[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'settled'>('all')

  const fetchBets = useCallback(async () => {
    if (!user) return
    
    try {
      setIsLoading(true)

      let query = supabase
        .from('bets')
        .select(`
          *,
          bet_selections (*)
        `)
        .eq('tipster_id', user.id)
        .order('created_at', { ascending: false })

      // Apply status filter
      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      setBets(data || [])
    } catch (error) {
      console.error('Error fetching bets:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user, filter])

  useEffect(() => {
    if (user) {
      fetchBets()
    }
  }, [user, filter, fetchBets])

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

  const handlePublish = async (betId: number) => {
    try {
      const { error } = await supabase
        .from('bets')
        .update({
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', betId)

      if (error) {
        throw error
      }

      // TODO: Send push notification (call edge function)
      
      fetchBets()
    } catch (error) {
      console.error('Error publishing bet:', error)
      alert('Error publicando apuesta')
    }
  }

  const handleSettle = async (betId: number, outcome: 'win' | 'lose' | 'push') => {
    try {
      const { error } = await supabase
        .from('bets')
        .update({
          status: 'settled',
          outcome: outcome
        })
        .eq('id', betId)

      if (error) {
        throw error
      }

      fetchBets()
    } catch (error) {
      console.error('Error settling bet:', error)
      alert('Error liquidando apuesta')
    }
  }

  const handleDelete = async (betId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta apuesta?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('bets')
        .delete()
        .eq('id', betId)

      if (error) {
        throw error
      }

      fetchBets()
    } catch (error) {
      console.error('Error deleting bet:', error)
      alert('Error eliminando apuesta')
    }
  }

  const BetCard = ({ bet }: { bet: BetWithSelections }) => {
    const isDraft = bet.status === 'draft'
    const isPublished = bet.status === 'published'
    const isSettled = bet.status === 'settled'

    return (
      <Card className={`${
        isDraft ? 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950' :
        isSettled ? 
          bet.outcome === 'win' ? 'bet-settled-win' :
          bet.outcome === 'lose' ? 'bet-settled-lose' : 'bet-settled-push' :
        ''
      }`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">
                {bet.title}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <span>{bet.sport}</span>
                {bet.league && (
                  <>
                    <span>•</span>
                    <span>{bet.league}</span>
                  </>
                )}
              </CardDescription>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <Badge variant={
                isDraft ? 'secondary' :
                isPublished ? 'default' :
                isSettled ? 
                  bet.outcome === 'win' ? 'default' :
                  bet.outcome === 'lose' ? 'destructive' : 'secondary' :
                'secondary'
              }>
                {bet.status.toUpperCase()}
                {isSettled && bet.outcome && ` - ${bet.outcome.toUpperCase()}`}
              </Badge>
              
              {bet.is_premium && (
                <Badge variant="outline">
                  Premium - {formatCurrency(bet.price_cents)}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {/* Bet Selections */}
            {bet.bet_selections.map((selection) => (
              <div key={selection.id} className="p-3 bg-muted/50 rounded-md">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">
                      {selection.home_team && selection.away_team 
                        ? `${selection.home_team} vs ${selection.away_team}`
                        : bet.title
                      }
                    </p>
                    {selection.market && (
                      <p className="text-sm text-muted-foreground">
                        {selection.market} @ {selection.odds}
                      </p>
                    )}
                  </div>
                  
                  {selection.result && (
                    <Badge variant={
                      selection.result === 'win' ? 'default' :
                      selection.result === 'lose' ? 'destructive' : 'secondary'
                    }>
                      {selection.result.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>
            ))}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2">
              {isDraft && (
                <>
                  <Button size="sm" onClick={() => handlePublish(bet.id)}>
                    <Eye size={14} className="mr-1" />
                    Publicar
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/admin/bets/${bet.id}/edit`}>
                      <Edit size={14} className="mr-1" />
                      Editar
                    </Link>
                  </Button>
                </>
              )}
              
              {isPublished && (
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleSettle(bet.id, 'win')}
                  >
                    <CheckCircle size={14} className="mr-1" />
                    Win
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleSettle(bet.id, 'lose')}
                  >
                    <XCircle size={14} className="mr-1" />
                    Lose
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleSettle(bet.id, 'push')}
                  >
                    <Minus size={14} className="mr-1" />
                    Push
                  </Button>
                </div>
              )}
              
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => handleDelete(bet.id)}
              >
                <Trash2 size={14} className="mr-1" />
                Eliminar
              </Button>
            </div>

            {/* Metadata */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>Creado {formatDate(bet.created_at)}</span>
              </div>
              {bet.published_at && (
                <div className="flex items-center gap-1">
                  <TrendingUp size={12} />
                  <span>Publicado {formatDate(bet.published_at)}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mis Apuestas</h1>
          <p className="text-muted-foreground">
            Gestiona tus apuestas y picks
          </p>
        </div>
        
        <Button asChild>
          <Link href="/admin/upload">
            <Plus size={16} className="mr-2" />
            Nueva Apuesta
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(['all', 'draft', 'published', 'settled'] as const).map((filterOption) => (
          <Button
            key={filterOption}
            variant={filter === filterOption ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(filterOption)}
          >
            {filterOption === 'all' ? 'Todas' : 
             filterOption === 'draft' ? 'Borradores' :
             filterOption === 'published' ? 'Publicadas' : 'Liquidadas'}
          </Button>
        ))}
      </div>

      {/* Bets List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando apuestas...</p>
          </div>
        ) : bets.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No hay apuestas</h3>
            <p className="text-muted-foreground mb-4">
              Aún no has creado ninguna apuesta
            </p>
            <Button asChild>
              <Link href="/admin/upload">
                <Plus size={16} className="mr-2" />
                Crear Primera Apuesta
              </Link>
            </Button>
          </div>
        ) : (
          bets.map((bet) => (
            <BetCard key={bet.id} bet={bet} />
          ))
        )}
      </div>
    </div>
  )
}