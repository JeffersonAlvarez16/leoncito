'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Edit, 
  Save, 
  X, 
  Trophy, 
  TrendingDown, 
  Minus,
  Clock,
  Users,
  Target,
  Layers
} from 'lucide-react'

interface BetSelection {
  id: number
  bet_id: number
  home_team: string
  away_team: string
  market: string
  line: string
  odds: number
  stake: number
  result: 'win' | 'lose' | 'push' | null
}

interface MultipleBet {
  id: number
  title: string
  sport: string
  status: string
  created_at: string
  total_odds: number
  total_stake: number
  potential_return: number
  bet_selections: BetSelection[]
}

export default function MultipleBetsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [bets, setBets] = useState<MultipleBet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingSelection, setEditingSelection] = useState<number | null>(null)
  const [editData, setEditData] = useState({
    odds: 0,
    stake: 0,
    result: null as 'win' | 'lose' | 'push' | null
  })

  const fetchMultipleBets = useCallback(async () => {
    if (!user) return
    
    try {
      setIsLoading(true)
      
      // Obtener apuestas que tengan más de 1 selección (múltiples)
      const { data, error } = await supabase
        .from('bets')
        .select(`
          id,
          title,
          sport,
          status,
          created_at,
          bet_selections (
            id,
            bet_id,
            home_team,
            away_team,
            market,
            line,
            odds,
            stake,
            result
          )
        `)
        .eq('tipster_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Filtrar solo las apuestas que tienen múltiples selecciones
      const multipleBets = (data || [])
        .filter(bet => bet.bet_selections.length > 1)
        .map(bet => ({
          ...bet,
          total_odds: bet.bet_selections.reduce((acc: number, sel: any) => acc * (sel.odds || 1), 1),
          total_stake: bet.bet_selections.reduce((acc: number, sel: any) => acc + (sel.stake || 0), 0),
          potential_return: bet.bet_selections.reduce((acc: number, sel: any) => acc * (sel.odds || 1), 1) * 
                           bet.bet_selections.reduce((acc: number, sel: any) => acc + (sel.stake || 0), 0)
        }))

      setBets(multipleBets)
    } catch (error) {
      console.error('Error fetching multiple bets:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
      return
    }

    if (user) {
      fetchMultipleBets()
    }
  }, [user, loading, router, fetchMultipleBets])

  const handleEditSelection = (selection: BetSelection) => {
    setEditingSelection(selection.id)
    setEditData({
      odds: selection.odds,
      stake: selection.stake,
      result: selection.result
    })
  }

  const handleSaveSelection = async (selectionId: number) => {
    try {
      const { error } = await supabase
        .from('bet_selections')
        .update({
          odds: editData.odds,
          stake: editData.stake,
          result: editData.result
        })
        .eq('id', selectionId)

      if (error) throw error

      // Actualizar el estado local y recalcular totales
      setBets(prevBets => 
        prevBets.map(bet => ({
          ...bet,
          bet_selections: bet.bet_selections.map(selection =>
            selection.id === selectionId
              ? { ...selection, odds: editData.odds, stake: editData.stake, result: editData.result }
              : selection
          )
        })).map(bet => ({
          ...bet,
          total_odds: bet.bet_selections.reduce((acc, sel) => acc * (sel.odds || 1), 1),
          total_stake: bet.bet_selections.reduce((acc, sel) => acc + (sel.stake || 0), 0),
          potential_return: bet.bet_selections.reduce((acc, sel) => acc * (sel.odds || 1), 1) * 
                           bet.bet_selections.reduce((acc, sel) => acc + (sel.stake || 0), 0)
        }))
      )

      setEditingSelection(null)
      console.log('✅ Selección múltiple actualizada')
    } catch (error) {
      console.error('Error updating selection:', error)
      alert('Error actualizando selección')
    }
  }

  const getResultIcon = (result: string | null) => {
    switch (result) {
      case 'win':
        return <Trophy className="h-4 w-4 text-green-500" />
      case 'lose':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      case 'push':
        return <Minus className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getResultBadge = (result: string | null) => {
    switch (result) {
      case 'win':
        return <Badge className="bg-green-500">Ganada</Badge>
      case 'lose':
        return <Badge variant="destructive">Perdida</Badge>
      case 'push':
        return <Badge variant="secondary">Empate</Badge>
      default:
        return <Badge variant="outline">Pendiente</Badge>
    }
  }

  const getMultipleResult = (selections: BetSelection[]) => {
    const hasLose = selections.some(s => s.result === 'lose')
    const hasPending = selections.some(s => s.result === null)
    const allWin = selections.every(s => s.result === 'win')
    
    if (hasLose) return 'lose'
    if (hasPending) return null
    if (allWin) return 'win'
    return 'push'
  }

  if (loading) {
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
          <Layers className="h-8 w-8" />
          Apuestas Múltiples / Combinadas
        </h1>
        <p className="text-muted-foreground">
          Administra apuestas parlay con múltiples selecciones
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando apuestas múltiples...</p>
        </div>
      ) : bets.length === 0 ? (
        <div className="text-center py-12">
          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No hay apuestas múltiples</h3>
          <p className="text-muted-foreground mb-4">
            Las apuestas múltiples son aquellas con más de 1 selección
          </p>
          <Button onClick={() => router.push('/admin/upload')}>
            Subir Imagen
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {bets.map((bet) => (
            <Card key={bet.id} className="border-2">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Layers className="h-5 w-5" />
                      {bet.title}
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{bet.sport}</span>
                      <span>{new Date(bet.created_at).toLocaleDateString()}</span>
                      <Badge variant={bet.status === 'draft' ? 'outline' : 'default'}>
                        {bet.status}
                      </Badge>
                      <Badge variant="secondary">
                        {bet.bet_selections.length} selecciones
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Cuota Total</div>
                    <div className="text-2xl font-bold">{bet.total_odds.toFixed(2)}</div>
                    <div className="text-sm">
                      Stake: {bet.total_stake}% | Retorno: ${bet.potential_return.toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Resultado de la Combinada:</span>
                    {getResultBadge(getMultipleResult(bet.bet_selections))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">
                          <Users className="h-4 w-4 inline mr-1" />
                          Partido
                        </th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">
                          Mercado
                        </th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">
                          Línea
                        </th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">
                          Cuota
                        </th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">
                          % Bank
                        </th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">
                          Resultado
                        </th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {bet.bet_selections.map((selection) => (
                        <tr key={selection.id} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-3 py-2">
                            <div className="font-medium text-sm">
                              {selection.home_team} vs {selection.away_team}
                            </div>
                          </td>
                          <td className="border border-gray-200 px-3 py-2 text-sm">
                            {selection.market}
                          </td>
                          <td className="border border-gray-200 px-3 py-2 text-sm font-mono">
                            {selection.line}
                          </td>
                          <td className="border border-gray-200 px-3 py-2">
                            {editingSelection === selection.id ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={editData.odds}
                                onChange={(e) => setEditData(prev => ({ 
                                  ...prev, 
                                  odds: parseFloat(e.target.value) || 0 
                                }))}
                                className="w-20 text-sm"
                              />
                            ) : (
                              <span className="font-mono">
                                {selection.odds === 0 ? '-' : selection.odds.toFixed(2)}
                              </span>
                            )}
                          </td>
                          <td className="border border-gray-200 px-3 py-2">
                            {editingSelection === selection.id ? (
                              <Input
                                type="number"
                                step="0.1"
                                value={editData.stake}
                                onChange={(e) => setEditData(prev => ({ 
                                  ...prev, 
                                  stake: parseFloat(e.target.value) || 0 
                                }))}
                                className="w-20 text-sm"
                              />
                            ) : (
                              <span className="font-mono">
                                {selection.stake === 0 ? '-' : `${selection.stake}%`}
                              </span>
                            )}
                          </td>
                          <td className="border border-gray-200 px-3 py-2">
                            {editingSelection === selection.id ? (
                              <Select
                                value={editData.result || 'pending'}
                                onValueChange={(value) => setEditData(prev => ({
                                  ...prev,
                                  result: value === 'pending' ? null : value as 'win' | 'lose' | 'push'
                                }))}
                              >
                                <SelectTrigger className="w-28">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pendiente</SelectItem>
                                  <SelectItem value="win">Ganada</SelectItem>
                                  <SelectItem value="lose">Perdida</SelectItem>
                                  <SelectItem value="push">Empate</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="flex items-center gap-2">
                                {getResultIcon(selection.result)}
                                {getResultBadge(selection.result)}
                              </div>
                            )}
                          </td>
                          <td className="border border-gray-200 px-3 py-2">
                            {editingSelection === selection.id ? (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveSelection(selection.id)}
                                  className="px-2 py-1 h-auto"
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingSelection(null)}
                                  className="px-2 py-1 h-auto"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditSelection(selection)}
                                className="px-2 py-1 h-auto"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}