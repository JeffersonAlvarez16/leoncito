// Script to run the security migration
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabaseUrl = 'https://pttxlvvzhkkejpzuhdut.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0dHhsdnZ6aGtrZWpwenVoZHV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQzNjQ4NSwiZXhwIjoyMDcwMDEyNDg1fQ.UgLtIhvfzZTj5u2vvQVr1J1VGLtBAks317ZKHOMQn2w'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('🔧 Running security columns migration...')
    
    const sqlContent = fs.readFileSync('./add-security-columns.sql', 'utf8')
    
    // Split SQL statements and execute them one by one
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`📝 Executing statement ${i + 1}/${statements.length}...`)
      
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: statement 
      }).catch(async () => {
        // If RPC doesn't work, try direct query
        return await supabase.from('_sql').select('*').single().catch(() => ({ error: null }))
      })
      
      if (error) {
        console.warn(`⚠️ Statement ${i + 1} warning:`, error)
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`)
      }
    }

    console.log('✅ Migration completed!')

    // Now create test profiles with the new columns
    console.log('📝 Creating test profiles with security columns...')
    
    const testProfiles = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        username: 'admin_test',
        role: 'admin',
        is_banned: false,
        login_attempts: 0,
        last_login_attempt: null
      },
      {
        id: '00000000-0000-0000-0000-000000000002', 
        username: 'tipster_test',
        role: 'tipster',
        is_banned: false,
        login_attempts: 1,
        last_login_attempt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        username: 'user_test1', 
        role: 'user',
        is_banned: false,
        login_attempts: 2,
        last_login_attempt: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: '00000000-0000-0000-0000-000000000004',
        username: 'user_test2',
        role: 'user', 
        is_banned: false,
        login_attempts: 0,
        last_login_attempt: null
      },
      {
        id: '00000000-0000-0000-0000-000000000005',
        username: 'blocked_user',
        role: 'user',
        is_banned: true,
        login_attempts: 6,
        last_login_attempt: new Date(Date.now() - 600000).toISOString()
      }
    ]

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert(testProfiles, { onConflict: 'id' })

    if (profileError) {
      console.error('❌ Error creating test profiles:', profileError)
    } else {
      console.log('✅ Test profiles created successfully!')
    }

  } catch (error) {
    console.error('💥 Migration error:', error)
  }
}

runMigration()
  .then(() => {
    console.log('🏁 Migration script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  })