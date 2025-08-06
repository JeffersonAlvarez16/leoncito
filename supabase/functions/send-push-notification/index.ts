import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  title: string
  body: string
  url?: string
  betId?: number
  tipsterId?: string
  sport?: string
  league?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { payload } = await req.json() as { payload: NotificationPayload }
    
    if (!payload || !payload.title || !payload.body) {
      return new Response(
        JSON.stringify({ error: 'Missing required payload fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get active push tokens based on follows/preferences
    let tokensQuery = supabaseClient
      .from('push_tokens')
      .select('user_id, token, device_info')
      .eq('is_active', true)

    // Filter by follows if bet-related notification
    if (payload.betId || payload.tipsterId || payload.sport || payload.league) {
      // Get users who follow the tipster, sport, or league
      const followsQuery = supabaseClient
        .from('follows')
        .select('follower_id')
      
      const followConditions = []
      if (payload.tipsterId) {
        followConditions.push({ target_type: 'tipster', target_id: payload.tipsterId })
      }
      if (payload.sport) {
        followConditions.push({ target_type: 'sport', target_id: payload.sport.toLowerCase() })
      }
      if (payload.league) {
        followConditions.push({ target_type: 'league', target_id: payload.league.toLowerCase() })
      }

      if (followConditions.length > 0) {
        const { data: followers } = await followsQuery.or(
          followConditions.map(cond => 
            `and(target_type.eq.${cond.target_type},target_id.eq.${cond.target_id})`
          ).join(',')
        )

        if (followers && followers.length > 0) {
          const followerIds = followers.map(f => f.follower_id)
          tokensQuery = tokensQuery.in('user_id', followerIds)
        } else {
          // No followers found, send to all active users
          console.log('No specific followers found, sending to all active users')
        }
      }
    }

    const { data: tokens, error: tokensError } = await tokensQuery

    if (tokensError) {
      throw tokensError
    }

    if (!tokens || tokens.length === 0) {
      console.log('No active push tokens found')
      return new Response(
        JSON.stringify({ message: 'No active push tokens found', sent: 0 }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prepare FCM message
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY')
    if (!fcmServerKey) {
      throw new Error('FCM_SERVER_KEY not configured')
    }

    // Send push notifications using FCM legacy API
    const fcmPayload = {
      registration_ids: tokens.map(t => t.token),
      notification: {
        title: payload.title,
        body: payload.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        click_action: payload.url || '/'
      },
      data: {
        url: payload.url || '/',
        betId: payload.betId?.toString() || '',
        tipsterId: payload.tipsterId || '',
        sport: payload.sport || '',
        league: payload.league || ''
      }
    }

    const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${fcmServerKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fcmPayload)
    })

    if (!fcmResponse.ok) {
      throw new Error(`FCM request failed: ${fcmResponse.status}`)
    }

    const fcmResult = await fcmResponse.json()
    console.log('FCM Response:', fcmResult)

    // Log notification in database
    const { error: logError } = await supabaseClient
      .from('notifications')
      .insert({
        type: 'new_bet',
        title: payload.title,
        body: payload.body,
        payload: payload,
        sent_at: new Date().toISOString()
      })

    if (logError) {
      console.error('Error logging notification:', logError)
    }

    return new Response(
      JSON.stringify({ 
        message: 'Push notifications sent successfully',
        sent: fcmResult.success || 0,
        failed: fcmResult.failure || 0
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error sending push notification:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})