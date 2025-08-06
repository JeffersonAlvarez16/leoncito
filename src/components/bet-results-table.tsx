'use client'

import { ParsedBetData } from '@/lib/ocr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Save, Clock, Users, Target, TrendingUp } from 'lucide-react'

interface BetResultsTableProps {
  parsedData: ParsedBetData
  onSave?: () => void
  onSaveMultiple?: () => void
  onClear?: () => void
  isLoading?: boolean
}

export function BetResultsTable({ parsedData, onSave, onSaveMultiple, onClear, isLoading = false }: BetResultsTableProps) {
  const { bets = [], market, sport, confidence, matchDate } = parsedData

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Datos Parseados de la Imagen
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {sport && (
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              {sport}
            </div>
          )}
          {market && (
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              {market}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Fecha: {matchDate}
          </div>
          <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
            Confianza: {(confidence * 100).toFixed(0)}%
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {bets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-2 text-left font-medium">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Hora
                    </div>
                  </th>
                  <th className="border border-gray-200 px-4 py-2 text-left font-medium">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Equipos
                    </div>
                  </th>
                  <th className="border border-gray-200 px-4 py-2 text-left font-medium">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      Probabilidad
                    </div>
                  </th>
                  <th className="border border-gray-200 px-4 py-2 text-left font-medium">
                    Cuota
                  </th>
                  <th className="border border-gray-200 px-4 py-2 text-left font-medium">
                    % Bank
                  </th>
                </tr>
              </thead>
              <tbody>
                {bets.map((bet, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2 font-mono">
                      {bet.time}
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      <div className="font-medium">{bet.homeTeam}</div>
                      <div className="text-sm text-gray-500">vs</div>
                      <div className="font-medium">{bet.awayTeam}</div>
                    </td>
                    <td className="border border-gray-200 px-4 py-2 text-center">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                        {bet.probability}%
                      </span>
                    </td>
                    <td className="border border-gray-200 px-4 py-2 text-center font-mono">
                      {bet.odds === 0 ? '-' : bet.odds.toFixed(2)}
                    </td>
                    <td className="border border-gray-200 px-4 py-2 text-center font-mono">
                      {bet.bankPercent === 0 ? '-' : `${bet.bankPercent}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No se encontraron apuestas en el formato esperado</p>
            <p className="text-sm">Formato: HORA - EQUIPO vs EQUIPO - PROBABILIDAD%</p>
            <p className="text-xs text-gray-400 mt-1">Cuotas y % Bank se configurarán en 0 (editables después)</p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-2 pt-4 border-t">
          {onSave && bets.length > 0 && (
            <Button onClick={onSave} className="flex-1" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Guardando...' : `Individuales (${bets.length})`}
            </Button>
          )}
          {onSaveMultiple && bets.length > 0 && (
            <Button onClick={onSaveMultiple} variant="outline" className="flex-1" disabled={isLoading}>
              <Target className="h-4 w-4 mr-2" />
              {isLoading ? 'Guardando...' : `Múltiple (1)`}
            </Button>
          )}
          {onClear && (
            <Button onClick={onClear} variant="outline">
              Nueva Imagen
            </Button>
          )}
        </div>

        {/* Debug info (solo en desarrollo) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Ver datos raw (debug)
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(parsedData, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  )
}