"use server"

import { createClient } from '@/lib/supabase/server'
import * as jose from 'jose'

/**
 * Server Action to generate TipTap AI JWT token
 *
 * IMPORTANT: This MUST be a Server Action (not an API route with fetch).
 *
 * Why Server Action instead of API route?
 * ----------------------------------------
 * Browser fetch() calls to Next.js API routes can hang indefinitely during
 * React hydration in Next.js 15/16 with Turbopack. This is a known issue where
 * the request is made but never reaches the server.
 *
 * Server Actions use React's Server Components protocol which doesn't have
 * this issue. The action executes entirely on the server without browser fetch.
 *
 * Requirements for this to work:
 * 1. File must have "use server" directive at the top
 * 2. Must be called via dynamic import in client code (see fetchAiToken in tiptap-collab-utils.ts)
 * 3. NEXT_PUBLIC_USE_JWT_TOKEN_API_ENDPOINT must be set to use server-generated tokens
 * 4. TIPTAP_AI_SECRET and NEXT_PUBLIC_TIPTAP_AI_APP_ID must be configured
 *
 * DO NOT convert this back to a fetch() call to an API route - it will break.
 */
export async function getAiToken(): Promise<string | null> {
  try {
    const secret = process.env.TIPTAP_AI_SECRET
    const appId = process.env.NEXT_PUBLIC_TIPTAP_AI_APP_ID

    if (!secret || !appId) {
      console.error('[TipTap AI] Missing required env vars: TIPTAP_AI_SECRET or NEXT_PUBLIC_TIPTAP_AI_APP_ID')
      return null
    }

    // Verify user is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return null
    }

    // Create JWT with user claims (1 hour expiry)
    const secretKey = new TextEncoder().encode(secret)
    const token = await new jose.SignJWT({
      iat: Math.floor(Date.now() / 1000),
      userId: user.id,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .setAudience(appId)
      .sign(secretKey)

    return token
  } catch (error) {
    console.error('[TipTap AI] Token generation failed:', error)
    return null
  }
}
