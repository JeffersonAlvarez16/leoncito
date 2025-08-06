// Environment variables with fallbacks
export const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pttxlvvzhkkejpzuhdut.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0dHhsdnZ6aGtrZWpwenVoZHV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MzY0ODUsImV4cCI6MjA3MDAxMjQ4NX0.nwPIvkZFRTc_UM6NCsjRQqHRh-r5hL_j33sXAH3TxxY',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0dHhsdnZ6aGtrZWpwenVoZHV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQzNjQ4NSwiZXhwIjoyMDcwMDEyNDg1fQ.UgLtIhvfzZTj5u2vvQVr1J1VGLtBAks317ZKHOMQn2w',
  NEXT_PUBLIC_FCM_VAPID_KEY: process.env.NEXT_PUBLIC_FCM_VAPID_KEY || 'BMXUzJBChsJQ44DEDvb4sSr83Dj-sHji91YhsIwwi8PIUJpXWO2oXy9IKUDzqz1VLCWDyN24p9UyeNH9g1H5et0',
  FCM_SERVER_KEY: process.env.FCM_SERVER_KEY || 'BLXmekD86XsAHB5x-xV7Y2FgcgvCB7P1oqIhW2llPW2TQGsKp7Ifp2Ape2EovSAmvtaiS7WYbABDw0cjFqUFht8',
  TZ: process.env.TZ || 'America/Guayaquil',
  POSTHOG_KEY: process.env.POSTHOG_KEY || 'phc_BcyyspYrgC4uNdmoYCPRI1X3C16cUhNWjWNLxQ9ItLf'
}

// Validation
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('❌ Critical environment variables missing')
}