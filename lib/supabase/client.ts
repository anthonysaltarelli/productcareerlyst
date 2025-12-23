import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Singleton pattern to ensure consistent session state across the app
// This prevents the browser client from getting out of sync with cookies
// when the middleware refreshes tokens
let client: SupabaseClient | null = null

export const createClient = () => {
  if (client) return client

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return client
}

