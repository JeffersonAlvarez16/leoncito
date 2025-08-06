import { notificationService } from '@/lib/notifications'
import { supabase } from '@/lib/supabase'

/**
 * Programa notificaciones automáticas para una apuesta
 */
export async function scheduleBetNotifications(betId: number) {
  try {
    // Obtener los detalles de la apuesta
    const { data: bet, error } = await supabase
      .from('bets')
      .select(`
        id,
        title,
        starts_at,
        bet_selections (
          home_team,
          away_team,
          market
        )
      `)
      .eq('id', betId)
      .single()

    if (error || !bet) {
      console.error('Error fetching bet for notifications:', error)
      return false
    }

    // Verificar que tenga fecha de inicio
    if (!bet.starts_at) {
      console.warn('Bet has no start time, skipping notifications')
      return false
    }

    const gameTime = new Date(bet.starts_at)
    const now = new Date()

    // No programar si el partido ya empezó
    if (gameTime <= now) {
      console.warn('Game already started, skipping notifications')
      return false
    }

    // Programar las notificaciones
    await notificationService.scheduleBetNotifications({
      id: bet.id,
      title: bet.title,
      starts_at: bet.starts_at,
      bet_selections: bet.bet_selections || []
    })

    console.log(`Notifications scheduled for bet ${bet.id}: ${bet.title}`)
    return true

  } catch (error) {
    console.error('Error scheduling bet notifications:', error)
    return false
  }
}

/**
 * Programa notificaciones para todas las apuestas futuras
 */
export async function scheduleAllFutureNotifications() {
  try {
    const now = new Date()
    
    // Obtener todas las apuestas futuras publicadas
    const { data: bets, error } = await supabase
      .from('bets')
      .select(`
        id,
        title,
        starts_at,
        bet_selections (
          home_team,
          away_team,
          market
        )
      `)
      .eq('status', 'published')
      .gte('starts_at', now.toISOString())
      .order('starts_at', { ascending: true })

    if (error) {
      console.error('Error fetching bets for notifications:', error)
      return 0
    }

    let scheduledCount = 0

    for (const bet of bets || []) {
      if (bet.starts_at) {
        await notificationService.scheduleBetNotifications({
          id: bet.id,
          title: bet.title,
          starts_at: bet.starts_at,
          bet_selections: bet.bet_selections || []
        })
        scheduledCount++
      }
    }

    console.log(`Scheduled notifications for ${scheduledCount} bets`)
    return scheduledCount

  } catch (error) {
    console.error('Error scheduling all notifications:', error)
    return 0
  }
}

/**
 * Cancela notificaciones para una apuesta específica
 */
export async function cancelBetNotifications(betId: number) {
  try {
    await notificationService.clearBetNotifications(betId)
    console.log(`Cancelled notifications for bet ${betId}`)
    return true
  } catch (error) {
    console.error('Error cancelling bet notifications:', error)
    return false
  }
}

/**
 * Verifica y programa notificaciones para apuestas nuevas
 * Esta función debe ejecutarse periódicamente
 */
export async function checkAndScheduleNewNotifications() {
  try {
    const now = new Date()
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)

    // Buscar apuestas que empiecen en la próxima hora y no tengan notificaciones programadas
    const { data: recentBets, error } = await supabase
      .from('bets')
      .select(`
        id,
        title,
        starts_at,
        created_at,
        bet_selections (
          home_team,
          away_team,
          market
        )
      `)
      .eq('status', 'published')
      .gte('starts_at', now.toISOString())
      .lte('starts_at', oneHourFromNow.toISOString())
      .gte('created_at', new Date(now.getTime() - 10 * 60 * 1000).toISOString()) // Creadas en los últimos 10 min

    if (error) {
      console.error('Error checking for new bets:', error)
      return 0
    }

    let scheduledCount = 0

    for (const bet of recentBets || []) {
      if (bet.starts_at) {
        await notificationService.scheduleBetNotifications({
          id: bet.id,
          title: bet.title,
          starts_at: bet.starts_at,
          bet_selections: bet.bet_selections || []
        })
        scheduledCount++
      }
    }

    if (scheduledCount > 0) {
      console.log(`Scheduled notifications for ${scheduledCount} new bets`)
    }

    return scheduledCount

  } catch (error) {
    console.error('Error checking for new notifications:', error)
    return 0
  }
}

/**
 * Hook para verificar notificaciones periódicamente en el cliente
 */
export function startNotificationChecker() {
  // Verificar inmediatamente
  checkAndScheduleNewNotifications()

  // Verificar cada 5 minutos
  const interval = setInterval(() => {
    checkAndScheduleNewNotifications()
  }, 5 * 60 * 1000)

  // Retornar función para limpiar el intervalo
  return () => clearInterval(interval)
}