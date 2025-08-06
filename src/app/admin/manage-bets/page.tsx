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
  Target
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

interface Bet {
  id: number
  title: string
  sport: string
  status: string
  created_at: string
  bet_selections: BetSelection[]
}

export default function ManageBetsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [bets, setBets] = useState<Bet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingSelection, setEditingSelection] = useState<number | null>(null)
  const [editData, setEditData] = useState({
    odds: 0,
    stake: 0,
    result: null as 'win' | 'lose' | 'push' | null
  })

  const fetchBets = useCallback(async () => {
    if (!user) return
    
    try {
      setIsLoading(true)
      
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

      // Filtrar solo apuestas individuales (1 selección)
      const individualBets = (data || []).filter(bet => bet.bet_selections.length === 1)
      setBets(individualBets)
    } catch (error) {
      console.error('Error fetching bets:', error)
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
      fetchBets()
    }
  }, [user, loading, router, fetchBets])

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

      // Actualizar el estado local
      setBets(prevBets => 
        prevBets.map(bet => ({
          ...bet,
          bet_selections: bet.bet_selections.map(selection =>
            selection.id === selectionId
              ? { ...selection, odds: editData.odds, stake: editData.stake, result: editData.result }
              : selection
          )
        }))
      )

      setEditingSelection(null)
      console.log('✅ Selección actualizada')
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
        <h1 className="text-3xl font-bold mb-2">Apuestas Individuales</h1>
        <p className="text-muted-foreground">
          Administra apuestas con una sola selección - Edita cuotas, % bank y resultados
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando apuestas...</p>
        </div>
      ) : bets.length === 0 ? (
        <div className="text-center py-12">
          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No hay apuestas individuales</h3>
          <p className="text-muted-foreground mb-4">
            Sube imágenes con pocas selecciones (≤3) para crear apuestas individuales
          </p>
          <Button onClick={() => router.push('/admin/upload')}>
            Subir Imagen
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {bets.map((bet) => (
            <Card key={bet.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{bet.title}</CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{bet.sport}</span>
                      <span>{new Date(bet.created_at).toLocaleDateString()}</span>
                      <Badge variant={bet.status === 'draft' ? 'outline' : 'default'}>
                        {bet.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">
                          <Users className="h-4 w-4 inline mr-1" />
                          Equipos
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
                            <div className="font-medium">{selection.home_team}</div>
                            <div className="text-sm text-gray-500">vs</div>
                            <div className="font-medium">{selection.away_team}</div>
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