import Tesseract from 'tesseract.js'

export interface OCRResult {
  text: string
  confidence: number
  data: any
}

export interface ParsedBetData {
  sport?: string
  league?: string
  homeTeam?: string
  awayTeam?: string
  teams?: string
  market?: string
  line?: string
  odds?: number
  stake?: number
  bookie?: string
  matchDate?: string
  confidence: number
  rawText: string
  bets?: Array<{
    time: string
    homeTeam: string
    awayTeam: string
    teams: string
    probability: number
    odds: number
    bankPercent: number
    line: number
  }>
}

export async function performOCR(imageFile: File): Promise<OCRResult> {
  try {
    const result = await Tesseract.recognize(imageFile, 'spa+eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${(m.progress * 100).toFixed(0)}%`)
        }
      }
    })

    return {
      text: result.data.text,
      confidence: result.data.confidence / 100,
      data: result.data
    }
  } catch (error) {
    console.error('OCR Error:', error)
    throw new Error('Error procesando OCR')
  }
}

export function parseBetText(text: string, confidence: number): ParsedBetData {
  console.log('🔍 Parsing text:', text.substring(0, 300))
  
  const parsed: ParsedBetData = {
    confidence,
    rawText: text,
    matchDate: new Date().toISOString().split('T')[0] // Fecha actual
  }

  // Dividir texto en líneas y procesar cada una
  const lines = text.split('\n').filter(line => line.trim())
  
  // Buscar mercado en la primera línea (ej: "+0.5 GOLES 1 TIEMPO")
  const marketLine = lines[0]?.trim()
  if (marketLine) {
    parsed.market = marketLine
    console.log('✅ Mercado detectado:', marketLine)
  }

  // Buscar líneas con formato: HORA - EQUIPO vs EQUIPO - PROBABILIDAD%
  const betLines: any[] = []
  
  lines.forEach((line, index) => {
    // Patrón: "03:45 - The Cove Res. vs South Adelaide Res. - 95%"
    const match = line.match(/(\d{1,2}:\d{2})\s*-\s*(.+?)\s+vs\.?\s+(.+?)\s*-\s*(\d+)%/)
    
    if (match) {
      const [, time, team1, team2, probability] = match
      
      const betData = {
        time: time.trim(),
        homeTeam: team1.trim(),
        awayTeam: team2.trim(),
        teams: `${team1.trim()} vs ${team2.trim()}`,
        probability: parseInt(probability),
        odds: 0, // Cuota en 0 por defecto
        bankPercent: 0, // Porcentaje del bank en 0 por defecto
        line: index + 1
      }
      
      betLines.push(betData)
      
      console.log(`✅ Apuesta ${index + 1}:`, {
        hora: betData.time,
        equipos: betData.teams,
        probabilidad: `${betData.probability}%`
      })
    }
  })

  // Si encontramos apuestas, usar la primera para los datos principales
  if (betLines.length > 0) {
    const firstBet = betLines[0]
    parsed.homeTeam = firstBet.homeTeam
    parsed.awayTeam = firstBet.awayTeam
    parsed.teams = firstBet.teams
    parsed.odds = 0 // Cuota por defecto en 0
    parsed.matchDate = firstBet.time // Usar hora como identificador
  }

  // Detectar deporte
  if (text.toLowerCase().includes('res.') || text.toLowerCase().includes('reserve')) {
    parsed.sport = 'Fútbol'
    console.log('✅ Deporte detectado: Fútbol (Reservas)')
  }

  // Agregar array de apuestas parseadas para mostrar en tabla
  parsed.bets = betLines

  console.log('📊 Parsing completado:', {
    mercado: parsed.market,
    deporte: parsed.sport,
    apuestas_encontradas: betLines.length,
    fecha: parsed.matchDate
  })

  return parsed;
}

// Función para limpiar y normalizar nombres de equipos
export function normalizeTeamName(name: string): string {
  if (!name) return ''
  
  const cleaned = name
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
  
  // Diccionario de normalizaciones comunes
  const normalizations: Record<string, string> = {
    'real madrid': 'Real Madrid',
    'barcelona': 'FC Barcelona', 
    'atletico madrid': 'Atlético Madrid',
    'manchester united': 'Manchester United',
    'manchester city': 'Manchester City',
    'liverpool': 'Liverpool FC',
    'chelsea': 'Chelsea FC'
  }
  
  const lower = cleaned.toLowerCase()
  return normalizations[lower] || cleaned
}