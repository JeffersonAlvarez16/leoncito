import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pttxlvvzhkkejpzuhdut.supabase.co'
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0dHhsdnZ6aGtrZWpwenVoZHV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQzNjQ4NSwiZXhwIjoyMDcwMDEyNDg1fQ.UgLtIhvfzZTj5u2vvQVr1J1VGLtBAks317ZKHOMQn2w'

const supabase = createClient(supabaseUrl, serviceKey)

async function verifyColumns() {
  console.log('🔍 Verificando estado actual de la tabla profiles...')

  try {
    // Intentar seleccionar todas las posibles columnas
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, role, created_at, updated_at, is_banned, login_attempts, last_login_attempt')
      .limit(1)

    if (error) {
      console.error('❌ Error accediendo a profiles:', error.message)
      
      if (error.message.includes('is_banned')) {
        console.log('💡 Confirmado: Faltan las columnas de seguridad')
        console.log('📋 Necesitas ejecutar el SQL en Dashboard de Supabase')
      }
    } else {
      console.log('✅ Todas las columnas existen')
      console.log('📋 Estructura:', Object.keys(data[0] || {}))
      
      // Probar inserción si las columnas existen
      console.log('\n🧪 Probando inserción con todas las columnas...')
      const testId = 'test-' + Date.now()
      
      const { data: insertData, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: testId,
          username: 'test_user_' + Date.now(),
          role: 'user',
          is_banned: false,
          login_attempts: 0,
          last_login_attempt: null
        })
        .select()

      if (insertError) {
        console.error('❌ Error insertando:', insertError)
      } else {
        console.log('✅ Inserción exitosa')
        
        // Limpiar
        await supabase.from('profiles').delete().eq('id', testId)
        console.log('🧹 Registro de prueba eliminado')
      }
    }
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

verifyColumns().catch(console.error)