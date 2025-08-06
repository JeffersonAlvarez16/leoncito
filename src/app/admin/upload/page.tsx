'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { ImageUpload } from '@/components/image-upload'
import { BetResultsTable } from '@/components/bet-results-table'
import { useOCR } from '@/hooks/use-ocr'
import { supabase } from '@/lib/supabase'
import { scheduleBetNotifications } from '@/lib/bet-notifications'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Upload as UploadIcon } from 'lucide-react'

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

export default function UploadPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { isProcessing, progress, error, parsedData, processImage, reset } = useOCR()
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if not authenticated or not admin/tipster
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

  const handleImageSelect = async (file: File) => {
    setSelectedFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Process OCR
    await processImage(file)
  }

  const handleImageRemove = () => {
    setSelectedFile(null)
    setImagePreview(null)
    reset()
  }

  const handleSaveApuestasIndividuales = async (parsedData: any) => {
    if (!user || !parsedData.bets || parsedData.bets.length === 0) {
      alert('No hay apuestas para guardar')
      return
    }

    setIsSubmitting(true)
    
    try {
      console.log('💾 Creando apuestas individuales:', parsedData.bets.length)
      console.log('📊 Mercado detectado:', parsedData.market)
      
      // FORZAR CREACIÓN DE APUESTAS INDIVIDUALES
      console.log('🎯 Creando APUESTAS INDIVIDUALES (una por línea)')
      
      // PRIMERO: Asegurar que el perfil del usuario existe
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single()
      
      if (profileError && profileError.code === 'PGRST116') {
        // Usuario no existe en profiles, crearlo
        console.log('🔧 Creando perfil para usuario:', user.id)
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: user.email?.split('@')[0] || 'user', // Usar parte del email como username
            role: 'tipster'
          })
        
        if (createError) {
          throw new Error(`Error creando perfil: ${createError.message}`)
        }
        console.log('✅ Perfil creado exitosamente')
      } else if (profileError) {
        throw new Error(`Error verificando perfil: ${profileError.message}`)
      } else {
        console.log('✅ Perfil existe:', profile.role)
      }
      
      // CREAR APUESTAS INDIVIDUALES (UNA POR CADA LÍNEA)
      console.log('🎯 Creando apuestas individuales')
      const createdBets = []
      
      for (let i = 0; i < parsedData.bets.length; i++) {
        const betLine = parsedData.bets[i]
        
        // Parse time from OCR (e.g., "15:30") and create date/time for tomorrow
        const parseGameDateTime = (timeString: string) => {
          if (!timeString || !timeString.match(/^\d{1,2}:\d{2}$/)) {
            // If no valid time, default to tomorrow at noon
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            tomorrow.setHours(12, 0, 0, 0)
            return tomorrow.toISOString()
          }

          const [hours, minutes] = timeString.split(':').map(Number)
          const gameDate = new Date()
          
          // Set for tomorrow (most common case for betting)
          gameDate.setDate(gameDate.getDate() + 1)
          gameDate.setHours(hours, minutes, 0, 0)
          
          return gameDate.toISOString()
        }

        const betData = {
          tipster_id: user.id,
          title: `${betLine.homeTeam} vs ${betLine.awayTeam}`,
          sport: parsedData.sport || 'Fútbol',
          league: 'Mixed',
          status: 'draft',
          starts_at: parseGameDateTime(betLine.time),
          published_at: null,
          is_premium: false,
          price_cents: 0
        }

        const { data: bet, error: betError } = await supabase
          .from('bets')
          .insert(betData)
          .select()
          .single()

        if (betError) {
          throw new Error(`Error creando apuesta ${i+1}: ${betError.message}`)
        }

        const selection = {
          bet_id: bet.id,
          match_id: `${betLine.time}_${i}`,
          home_team: betLine.homeTeam,
          away_team: betLine.awayTeam,
          market: parsedData.market || '+0.5 GOLES 1 TIEMPO',
          line: `${betLine.probability}%`,
          odds: betLine.odds || 0,
          stake: betLine.bankPercent || 0,
          bookie: 'OCR Import',
          result: null
        }

        const { error: selectionError } = await supabase
          .from('bet_selections')
          .insert(selection)

        if (selectionError) {
          throw new Error(`Error creando selección ${i+1}: ${selectionError.message}`)
        }

        createdBets.push({bet, selection})
        
        // Programar notificaciones para esta apuesta
        try {
          await scheduleBetNotifications(bet.id)
        } catch (error) {
          console.error('Error scheduling notifications for bet:', bet.id, error)
        }
      }

      console.log('✅ Apuestas individuales guardadas:', createdBets.length)
      alert(`¡Éxito! Se crearon ${parsedData.bets.length} apuestas individuales. Mercado: ${parsedData.market}`)
      
      // Limpiar formulario
      setSelectedFile(null)
      setImagePreview(null)
      reset()
      
    } catch (error) {
      console.error('❌ Error guardando apuestas:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveApuestasMultiples = async (parsedData: any) => {
    if (!user || !parsedData.bets || parsedData.bets.length === 0) {
      alert('No hay apuestas para guardar')
      return
    }

    setIsSubmitting(true)
    
    try {
      console.log('💾 Creando apuesta múltiple:', parsedData.bets.length, 'selecciones')
      console.log('📊 Mercado detectado:', parsedData.market)
      
      // CREAR UNA SOLA APUESTA MÚLTIPLE CON TODAS LAS SELECCIONES
      console.log('📦 Creando apuesta múltiple/combinada')
      
      // PRIMERO: Asegurar que el perfil del usuario existe
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single()
      
      if (profileError && profileError.code === 'PGRST116') {
        // Usuario no existe en profiles, crearlo
        console.log('🔧 Creando perfil para usuario:', user.id)
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: user.email?.split('@')[0] || 'user', // Usar parte del email como username
            role: 'tipster'
          })
        
        if (createError) {
          throw new Error(`Error creando perfil: ${createError.message}`)
        }
        console.log('✅ Perfil creado exitosamente')
      } else if (profileError) {
        throw new Error(`Error verificando perfil: ${profileError.message}`)
      } else {
        console.log('✅ Perfil existe:', profile.role)
      }
      
      // For multiple bets, use the earliest game time
      const earliestTime = parsedData.bets.reduce((earliest: { hours: number, minutes: number } | null, bet: any) => {
        if (!bet.time) return earliest
        
        const [hours, minutes] = bet.time.split(':').map(Number)
        const gameTime = hours * 60 + minutes
        const earliestMinutes = earliest ? earliest.hours * 60 + earliest.minutes : Infinity
        
        return gameTime < earliestMinutes ? { hours, minutes } : earliest
      }, null as { hours: number, minutes: number } | null)

      const parseEarliestGameTime = () => {
        if (!earliestTime) {
          const tomorrow = new Date()
          tomorrow.setDate(tomorrow.getDate() + 1)
          tomorrow.setHours(12, 0, 0, 0)
          return tomorrow.toISOString()
        }

        const gameDate = new Date()
        gameDate.setDate(gameDate.getDate() + 1)
        gameDate.setHours(earliestTime.hours, earliestTime.minutes, 0, 0)
        return gameDate.toISOString()
      }

      const betData = {
        tipster_id: user.id,
        title: `${parsedData.market || 'Combinada'} - ${new Date().toLocaleDateString()}`,
        sport: parsedData.sport || 'Fútbol',
        league: 'Mixed',
        status: 'draft',
        starts_at: parseEarliestGameTime(),
        published_at: null,
        is_premium: false,
        price_cents: 0
      }

      // Insertar apuesta múltiple
      const { data: bet, error: betError } = await supabase
        .from('bets')
        .insert(betData)
        .select()
        .single()

      if (betError) {
        throw new Error(`Error creando apuesta múltiple: ${betError.message}`)
      }

      console.log('✅ Apuesta múltiple creada:', bet.id)

      // Insertar todas las selecciones en la misma apuesta
      const selections = parsedData.bets.map((betLine: any, index: number) => ({
        bet_id: bet.id,
        match_id: `${betLine.time}_${index}`,
        home_team: betLine.homeTeam,
        away_team: betLine.awayTeam,
        market: parsedData.market || '+0.5 GOLES 1 TIEMPO',
        line: `${betLine.probability}%`,
        odds: betLine.odds || 0,
        stake: betLine.bankPercent || 0,
        bookie: 'OCR Import',
        result: null
      }))

      const { error: selectionsError } = await supabase
        .from('bet_selections')
        .insert(selections)

      if (selectionsError) {
        throw new Error(`Error creando selecciones múltiples: ${selectionsError.message}`)
      }

      console.log('✅ Selecciones múltiples guardadas:', selections.length)
      
      // Programar notificaciones para esta apuesta múltiple
      try {
        await scheduleBetNotifications(bet.id)
      } catch (error) {
        console.error('Error scheduling notifications for multiple bet:', bet.id, error)
      }
      
      alert(`¡Éxito! Se creó 1 apuesta múltiple con ${parsedData.bets.length} selecciones. Mercado: ${parsedData.market}`)
      
      // Limpiar formulario
      setSelectedFile(null)
      setImagePreview(null)
      reset()
      
    } catch (error) {
      console.error('❌ Error guardando apuesta múltiple:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (formData: BetFormData) => {
    if (!user || !selectedFile) return

    try {
      setIsSubmitting(true)

      // Create the bet record
      const { data: bet, error: betError } = await supabase
        .from('bets')
        .insert({
          tipster_id: user.id,
          title: formData.title || `${formData.homeTeam} vs ${formData.awayTeam}`,
          sport: formData.sport,
          league: formData.league,
          starts_at: formData.startsAt || null,
          is_premium: formData.isPremium,
          price_cents: formData.isPremium ? (formData.priceCents as number) : 0,
          status: 'published',
          published_at: new Date().toISOString()
        })
        .select()
        .single()

      if (betError) {
        throw new Error(`Error creando apuesta: ${betError.message}`)
      }

      // Create bet selections
      if (formData.homeTeam || formData.awayTeam || formData.market) {
        const { error: selectionError } = await supabase
          .from('bet_selections')
          .insert({
            bet_id: bet.id,
            home_team: formData.homeTeam,
            away_team: formData.awayTeam,
            market: formData.market,
            line: formData.line,
            odds: formData.odds as number,
            stake: formData.stake as number,
            bookie: formData.bookie
          })

        if (selectionError) {
          console.error('Error creating selection:', selectionError)
        }
      }

      // TODO: Trigger push notifications (Sprint 2)
      
      router.push('/admin/bets')
      
    } catch (err) {
      console.error('Error submitting bet:', err)
      alert(err instanceof Error ? err.message : 'Error publicando apuesta')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveDraft = async (formData: BetFormData) => {
    if (!user) return

    try {
      setIsSubmitting(true)

      const { data: bet, error: betError } = await supabase
        .from('bets')
        .insert({
          tipster_id: user.id,
          title: formData.title || `${formData.homeTeam} vs ${formData.awayTeam}`,
          sport: formData.sport,
          league: formData.league,
          starts_at: formData.startsAt || null,
          is_premium: formData.isPremium,
          price_cents: formData.isPremium ? (formData.priceCents as number) : 0,
          status: 'draft'
        })
        .select()
        .single()

      if (betError) {
        throw new Error(`Error guardando borrador: ${betError.message}`)
      }

      if (formData.homeTeam || formData.awayTeam || formData.market) {
        const { error: selectionError } = await supabase
          .from('bet_selections')
          .insert({
            bet_id: bet.id,
            home_team: formData.homeTeam,
            away_team: formData.awayTeam,
            market: formData.market,
            line: formData.line,
            odds: formData.odds as number,
            stake: formData.stake as number,
            bookie: formData.bookie
          })

        if (selectionError) {
          console.error('Error creating selection:', selectionError)
        }
      }

      alert('Borrador guardado exitosamente')
      
    } catch (err) {
      console.error('Error saving draft:', err)
      alert(err instanceof Error ? err.message : 'Error guardando borrador')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Subir Nueva Apuesta</h1>
        <p className="text-muted-foreground">
          Sube una imagen del ticket y completa los detalles de la apuesta
        </p>
      </div>

      <div className="space-y-8">
        {/* Image Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadIcon size={20} />
              Imagen del Ticket
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload
              onImageSelect={handleImageSelect}
              onImageRemove={handleImageRemove}
              isProcessing={isProcessing}
              processingProgress={progress}
              preview={imagePreview}
            />
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-900 dark:text-red-100">
                    Error procesando imagen
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {error}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabla de Resultados */}
        {parsedData && (
          <BetResultsTable
            parsedData={parsedData}
            onSave={() => handleSaveApuestasIndividuales(parsedData)}
            onSaveMultiple={() => handleSaveApuestasMultiples(parsedData)}
            onClear={() => {
              setSelectedFile(null)
              setImagePreview(null)
              reset()
            }}
            isLoading={isSubmitting}
          />
        )}
      </div>
    </div>
  )
}