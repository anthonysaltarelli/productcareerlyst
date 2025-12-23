'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * AuthStateListener - Keeps browser Supabase client in sync with server-side session
 *
 * This component listens for auth state changes (token refresh, sign out, etc.)
 * and ensures the browser client stays synchronized with cookies set by middleware.
 *
 * Without this, the browser client can get out of sync with the server-side session,
 * causing API calls to fail until the user refreshes the page.
 */
export function AuthStateListener() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // Listen for auth state changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        // Token was refreshed - the client is now in sync with new cookies
        // No action needed, but we could refresh server components if needed
        console.log('[Auth] Token refreshed, session synced')
      }

      if (event === 'SIGNED_OUT') {
        // User signed out - redirect to login
        router.push('/auth/login')
      }

      if (event === 'SIGNED_IN' && session) {
        // User signed in - refresh to get fresh server-side data
        router.refresh()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  // This component doesn't render anything
  return null
}
