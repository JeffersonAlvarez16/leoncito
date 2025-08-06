'use client'

import { useState, useCallback } from 'react'
import { performOCR, parseBetText, type ParsedBetData } from '@/lib/ocr'

interface UseOCRResult {
  isProcessing: boolean
  progress: number
  error: string | null
  parsedData: ParsedBetData | undefined
  processImage: (file: File) => Promise<void>
  reset: () => void
}

export function useOCR(): UseOCRResult {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [parsedData, setParsedData] = useState<ParsedBetData | undefined>(undefined)

  const processImage = useCallback(async (file: File) => {
    try {
      setIsProcessing(true)
      setProgress(0)
      setError(null)
      setParsedData(undefined)

      console.log('🚀 PROCESAMIENTO LOCAL - SIN SUPABASE')
      console.log('📁 Archivo:', file.name, file.size, 'bytes')

      // 1. Procesamiento OCR directo del archivo
      setProgress(20)
      console.log('🔍 Iniciando OCR local...')
      
      const ocrResult = await performOCR(file)
      setProgress(60)
      
      console.log('📊 OCR completado:', {
        confidence: ocrResult.confidence,
        text_length: ocrResult.text.length,
        text_preview: ocrResult.text.substring(0, 100) + '...'
      })

      // 2. Parse de los datos
      setProgress(80)
      console.log('🎯 Parseando datos de apuestas...')
      
      const parsed = parseBetText(ocrResult.text, ocrResult.confidence)
      setParsedData(parsed)
      
      console.log('✅ DATOS PARSEADOS:', {
        sport: parsed.sport,
        teams: parsed.teams,
        odds: parsed.odds,
        stake: parsed.stake,
        confidence: parsed.confidence
      })

      setProgress(100)
      
      // Delay para mostrar completación
      setTimeout(() => {
        setIsProcessing(false)
      }, 500)

    } catch (err) {
      console.error('❌ Error en procesamiento:', err)
      setError(err instanceof Error ? err.message : 'Error procesando imagen')
      setIsProcessing(false)
      setProgress(0)
    }
  }, [])

  const reset = useCallback(() => {
    setIsProcessing(false)
    setProgress(0)
    setError(null)
    setParsedData(undefined)
  }, [])

  return {
    isProcessing,
    progress,
    error,
    parsedData,
    processImage,
    reset
  }
}