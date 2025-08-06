'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageUpload } from '@/components/image-upload'
import { ParsedBetData } from '@/lib/ocr'
import { Save, Eye, CheckCircle } from 'lucide-react'

interface BetFormData {
  title: string
  sport: string
  league: string
  homeTeam: string
  awayTeam: string
  market: string
  line: string
  odds: number | ''
  stake: number | ''
  bookie: string
  startsAt: string
  isPremium: boolean
  priceCents: number | ''
}

interface BetFormProps {
  onSubmit: (data: BetFormData) => Promise<void>
  onSaveDraft: (data: BetFormData) => Promise<void>
  parsedData?: ParsedBetData
  imagePreview?: string | null
  isLoading?: boolean
}

export function BetForm({
  onSubmit,
  onSaveDraft,
  parsedData,
  imagePreview,
  isLoading = false
}: BetFormProps) {
  const [formData, setFormData] = useState<BetFormData>({
    title: '',
    sport: '',
    league: '',
    homeTeam: '',
    awayTeam: '',
    market: '',
    line: '',
    odds: '',
    stake: '',
    bookie: '',
    startsAt: '',
    isPremium: false,
    priceCents: ''
  })

  // Actualizar formulario cuando lleguen datos del OCR
  useEffect(() => {
    if (parsedData) {
      setFormData(prev => ({
        ...prev,
        sport: parsedData.sport || prev.sport,
        league: parsedData.league || prev.league,
        homeTeam: parsedData.homeTeam || prev.homeTeam,
        awayTeam: parsedData.awayTeam || prev.awayTeam,
        market: parsedData.market || prev.market,
        line: parsedData.line || prev.line,
        odds: parsedData.odds || prev.odds,
        stake: parsedData.stake || prev.stake,
        bookie: parsedData.bookie || prev.bookie,
        title: parsedData.homeTeam && parsedData.awayTeam 
          ? `${parsedData.homeTeam} vs ${parsedData.awayTeam}` 
          : prev.title
      }))
    }
  }, [parsedData])

  const handleInputChange = (field: keyof BetFormData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const handleSaveDraft = async () => {
    await onSaveDraft(formData)
  }

  const isFormValid = formData.sport && formData.odds && (formData.homeTeam || formData.title)

  return (
    <div className="space-y-6">
      {/* OCR Confidence Indicator */}
      {parsedData && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">
                  OCR Procesado - Confianza: {Math.round(parsedData.confidence * 100)}%
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                Revisa y corrige los datos si es necesario
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Título de la Apuesta</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Ej: Real Madrid vs Barcelona"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sport">Deporte *</Label>
                <Input
                  id="sport"
                  value={formData.sport}
                  onChange={(e) => handleInputChange('sport', e.target.value)}
                  placeholder="Ej: Fútbol"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="league">Liga/Competición</Label>
                <Input
                  id="league"
                  value={formData.league}
                  onChange={(e) => handleInputChange('league', e.target.value)}
                  placeholder="Ej: La Liga"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="startsAt">Fecha y Hora del Evento</Label>
              <Input
                id="startsAt"
                type="datetime-local"
                value={formData.startsAt}
                onChange={(e) => handleInputChange('startsAt', e.target.value)}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Detalles de la Apuesta */}
        <Card>
          <CardHeader>
            <CardTitle>Detalles de la Apuesta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="homeTeam">Equipo Local</Label>
                <Input
                  id="homeTeam"
                  value={formData.homeTeam}
                  onChange={(e) => handleInputChange('homeTeam', e.target.value)}
                  placeholder="Equipo 1"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="awayTeam">Equipo Visitante</Label>
                <Input
                  id="awayTeam"
                  value={formData.awayTeam}
                  onChange={(e) => handleInputChange('awayTeam', e.target.value)}
                  placeholder="Equipo 2"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="market">Mercado</Label>
                <Input
                  id="market"
                  value={formData.market}
                  onChange={(e) => handleInputChange('market', e.target.value)}
                  placeholder="Ej: Moneyline, Over/Under"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="line">Línea</Label>
                <Input
                  id="line"
                  value={formData.line}
                  onChange={(e) => handleInputChange('line', e.target.value)}
                  placeholder="Ej: -1.5, 2.5"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="bookie">Casa de Apuestas</Label>
                <Input
                  id="bookie"
                  value={formData.bookie}
                  onChange={(e) => handleInputChange('bookie', e.target.value)}
                  placeholder="Ej: Bet365"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="odds">Cuota *</Label>
                <Input
                  id="odds"
                  type="number"
                  step="0.01"
                  min="1"
                  value={formData.odds}
                  onChange={(e) => handleInputChange('odds', parseFloat(e.target.value) || '')}
                  placeholder="Ej: 2.50"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="stake">Stake (Unidades)</Label>
                <Input
                  id="stake"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={formData.stake}
                  onChange={(e) => handleInputChange('stake', parseFloat(e.target.value) || '')}
                  placeholder="Ej: 1.0"
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuración Premium */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración de Publicación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                id="isPremium"
                type="checkbox"
                checked={formData.isPremium}
                onChange={(e) => handleInputChange('isPremium', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isPremium">Marcar como Premium (Fija)</Label>
            </div>

            {formData.isPremium && (
              <div>
                <Label htmlFor="priceCents">Precio (USD)</Label>
                <Input
                  id="priceCents"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.priceCents ? (formData.priceCents as number) / 100 : ''}
                  onChange={(e) => {
                    const dollars = parseFloat(e.target.value) || 0
                    handleInputChange('priceCents', Math.round(dollars * 100))
                  }}
                  placeholder="Ej: 5.00"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Precio en dólares que pagarán los usuarios por acceder a esta fija
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Save size={16} />
            Guardar Borrador
          </Button>
          
          <Button
            type="submit"
            disabled={isLoading || !isFormValid}
            className="flex items-center gap-2"
          >
            <Eye size={16} />
            Publicar Apuesta
          </Button>
        </div>

        {!isFormValid && (
          <p className="text-sm text-muted-foreground">
            * Campos requeridos: Deporte, Cuota y (Título o Equipos)
          </p>
        )}
      </form>
    </div>
  )
}