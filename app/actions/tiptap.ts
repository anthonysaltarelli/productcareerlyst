"use server"

import { createClient } from '@/lib/supabase/server'
import * as jose from 'jose'

/**
 * Server Action to fetch TipTap AI token
 * This avoids browser fetch issues by running entirely on the server
 */
export async function getAiToken(): Promise<string | null> {
  const requestId = crypto.randomUUID().slice(0, 8)
  console.log(`[TipTap AI Action ${requestId}] Token generation started`)

  try {
    const secret = process.env.TIPTAP_AI_SECRET
    const appId = process.env.NEXT_PUBLIC_TIPTAP_AI_APP_ID

    if (!secret) {
      console.error(`[TipTap AI Action ${requestId}] TIPTAP_AI_SECRET is not configured`)
      return null
    }

    if (!appId) {
      console.error(`[TipTap AI Action ${requestId}] NEXT_PUBLIC_TIPTAP_AI_APP_ID is not configured`)
      return null
    }

    // Verify user is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log(`[TipTap AI Action ${requestId}] Unauthorized - no user`)
      return null
    }

    // Create JWT with user claims
    console.log(`[TipTap AI Action ${requestId}] Generating JWT token for user ${user.id.slice(0, 8)}`)
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

    console.log(`[TipTap AI Action ${requestId}] Token generated successfully`)
    return token
  } catch (error) {
    console.error(`[TipTap AI Action ${requestId}] Error:`, error)
    return null
  }
}
