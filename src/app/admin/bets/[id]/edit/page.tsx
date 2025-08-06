'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  ArrowLeft,
  Save, 
  Trophy, 
  TrendingDown, 
  Minus,
  Clock,
  Users,
  Target,
  Edit
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
  league: string
  status: string
  created_at: string
  bet_selections: BetSelection[]
}

export default function EditBetPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const betId = params.id as string

  const [bet, setBet] = useState<Bet | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editData, setEditData] = useState({
    title: '',
    sport: '',
    league: '',
    status: '' as 'draft' | 'published' | 'settled' | 'void'
  })
  const [selections, setSelections] = useState<BetSelection[]>([])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
      return
    }

    if (user && betId) {
      fetchBet()
    }
  }, [user, loading, router, betId])

  const fetchBet = async () => {
    try {
      setIsLoading(true)
      
      const { data, error } = await supabase
        .from('bets')
        .select(`
          id,
          title,
          sport,
          league,
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
        .eq('id', betId)
        .eq('tipster_id', user!.id)
        .single()

      if (error) throw error

      setBet(data)
      setEditData({
        title: data.title,
        sport: data.sport,
        league: data.league,
        status: data.status
      })
      setSelections(data.bet_selections || [])
      
    } catch (error) {
      console.error('Error fetching bet:', error)
      alert('Error cargando la apuesta')
      router.push('/admin/bets')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveBet = async () => {
    if (!bet) return

    try {
      setIsSaving(true)

      // Actualizar información general de la apuesta
      const { error: betError } = await supabase
        .from('bets')
        .update({
          title: editData.title,
          sport: editData.sport,
          league: editData.league,
          status: editData.status
        })
        .eq('id', bet.id)

      if (betError) throw betError

      // Actualizar todas las selecciones
      for (const selection of selections) {
        const { error: selectionError } = await supabase
          .from('bet_selections')
          .update({
            odds: selection.odds,
            stake: selection.stake,
            result: selection.result
          })
          .eq('id', selection.id)

        if (selectionError) throw selectionError
      }

      alert('¡Apuesta actualizada exitosamente!')
      router.push('/admin/bets')
      
    } catch (error) {
      console.error('Error saving bet:', error)
      alert('Error guardando cambios')
    } finally {
      setIsSaving(false)
    }
  }

  const updateSelection = (selectionId: number, field: string, value: any) => {
    setSelections(prev =>
      prev.map(sel =>
        sel.id === selectionId
          ? { ...sel, [field]: value }
          : sel
      )
    )
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

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || !bet) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/bets')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Mis Apuestas
        </Button>
        
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Edit className="h-8 w-8" />
          Editar Apuesta #{bet.id}
        </h1>
        <p className="text-muted-foreground">
          Modifica los datos generales y selecciones de la apuesta
        </p>
      </div>

      <div className="space-y-6">
        {/* Información General */}
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={editData.title}
                  onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Título de la apuesta"
                />
              </div>
              
              <div>
                <Label htmlFor="sport">Deporte</Label>
                <Input
                  id="sport"
                  value={editData.sport}
                  onChange={(e) => setEditData(prev => ({ ...prev, sport: e.target.value }))}
                  placeholder="Fútbol, Tenis, etc."
                />
              </div>
              
              <div>
                <Label htmlFor="league">Liga/Competición</Label>
                <Input
                  id="league"
                  value={editData.league}
                  onChange={(e) => setEditData(prev => ({ ...prev, league: e.target.value }))}
                  placeholder="Champions League, LaLiga, etc."
                />
              </div>
              
              <div>
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={editData.status}
                  onValueChange={(value) => setEditData(prev => ({ 
                    ...prev, 
                    status: value as 'draft' | 'published' | 'settled' | 'void' 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="published">Publicada</SelectItem>
                    <SelectItem value="settled">Liquidada</SelectItem>
                    <SelectItem value="void">Anulada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selecciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Selecciones ({selections.length})
            </CardTitle>
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
                  </tr>
                </thead>
                <tbody>
                  {selections.map((selection) => (
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
                        <Input
                          type="number"
                          step="0.01"
                          value={selection.odds}
                          onChange={(e) => updateSelection(
                            selection.id, 
                            'odds', 
                            parseFloat(e.target.value) || 0
                          )}
                          className="w-20 text-sm"
                        />
                      </td>
                      <td className="border border-gray-200 px-3 py-2">
                        <Input
                          type="number"
                          step="0.1"
                          value={selection.stake}
                          onChange={(e) => updateSelection(
                            selection.id, 
                            'stake', 
                            parseFloat(e.target.value) || 0
                          )}
                          className="w-20 text-sm"
                        />
                      </td>
                      <td className="border border-gray-200 px-3 py-2">
                        <Select
                          value={selection.result || 'pending'}
                          onValueChange={(value) => updateSelection(
                            selection.id,
                            'result',
                            value === 'pending' ? null : value as 'win' | 'lose' | 'push'
                          )}
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Botones de Acción */}
        <div className="flex gap-4">
          <Button onClick={handleSaveBet} disabled={isSaving} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin/bets')}
            className="flex-1"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  )
}