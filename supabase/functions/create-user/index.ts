import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Iniciando función create-user')
    
    // Obtener datos del cuerpo de la petición primero
    const { email, password, username, role, createFirstAdmin } = await req.json()
    
    console.log('📝 Datos recibidos:', { email, username, role, createFirstAdmin })

    // Validaciones básicas
    if (!email || !password || !username || !role) {
      throw new Error('Todos los campos son requeridos')
    }

    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres')
    }

    if (!['user', 'tipster', 'admin'].includes(role)) {
      throw new Error('Rol inválido')
    }

    // Verificar variables de entorno
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    
    console.log('🌐 Variables de entorno:', {
      url: !!supabaseUrl,
      serviceKey: !!serviceRoleKey,
      anonKey: !!anonKey
    })

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      throw new Error('Variables de entorno faltantes')
    }

    // Crear cliente admin con service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Si no es para crear el primer admin, verificar permisos
    if (!createFirstAdmin) {
      console.log('🔒 Verificando permisos de admin...')
      
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        throw new Error('No authorization header')
      }

      // Crear cliente regular para verificar permisos del usuario actual
      const supabase = createClient(supabaseUrl, anonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            Authorization: authHeader,
          }
        }
      })

      // Verificar que el usuario actual es admin
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('Usuario no autenticado')
      }

      // Verificar rol de admin en profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError || !profile || profile.role !== 'admin') {
        throw new Error('Usuario no tiene permisos de administrador')
      }
      
      console.log('✅ Permisos verificados')
    } else {
      console.log('👑 Creando primer usuario admin sin verificación de permisos')
    }

    console.log('👤 Creando usuario en auth...')

    // Crear usuario usando admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        username: username,
        role: role
      }
    })

    if (authError) {
      console.log('❌ Error de auth:', authError)
      throw new Error(`Error creando usuario: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error('No se pudo crear el usuario')
    }

    console.log('✅ Usuario auth creado:', authData.user.id)

    // Crear perfil del usuario
    console.log('👤 Creando perfil...')
    
    const { error: profileCreateError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        username: username,
        role: role,
        is_banned: false,
        login_attempts: 0,
        last_login_attempt: null
      })

    if (profileCreateError) {
      console.log('❌ Error de perfil:', profileCreateError)
      // Si falla la creación del perfil, eliminar el usuario auth
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw new Error(`Error creando perfil: ${profileCreateError.message}`)
    }

    console.log('✅ Perfil creado exitosamente')

    // Intentar registrar la creación en login_attempts (opcional)
    try {
      await supabaseAdmin
        .from('login_attempts')
        .insert({
          user_id: authData.user.id,
          email: email,
          ip_address: req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown',
          user_agent: req.headers.get('user-agent') || 'unknown',
          success: true,
          attempt_time: new Date().toISOString(),
          failure_reason: null,
          is_suspicious: false
        })
      console.log('✅ Login attempt logged')
    } catch (logError) {
      console.warn('⚠️ Could not log user creation:', logError)
    }

    console.log('✅ Usuario y perfil creados exitosamente')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Usuario creado exitosamente',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          username: username,
          role: role
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Error in create-user function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Error interno del servidor'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})