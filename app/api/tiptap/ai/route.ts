import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as jose from 'jose';

/**
 * TipTap AI JWT Token Generator (API Route - DEPRECATED)
 *
 * WARNING: This API route exists for backwards compatibility but should NOT
 * be called via browser fetch(). Browser fetch calls to Next.js API routes
 * can hang indefinitely during React hydration in Next.js 15/16 with Turbopack.
 *
 * Use the Server Action in app/actions/tiptap.ts instead.
 * See fetchAiToken() in lib/tiptap-collab-utils.ts for the correct implementation.
 *
 * Required environment variables:
 * - TIPTAP_AI_SECRET: Your AI secret key from TipTap Cloud (NOT the public one)
 * - NEXT_PUBLIC_TIPTAP_AI_APP_ID: Your AI App ID
 */

export async function POST() {
  try {
    const secret = process.env.TIPTAP_AI_SECRET;
    const appId = process.env.NEXT_PUBLIC_TIPTAP_AI_APP_ID;

    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!secret) {
      console.error('[TipTap AI Route] TIPTAP_AI_SECRET is not configured');
      return NextResponse.json(
        { error: 'AI not configured', detail: 'Missing TIPTAP_AI_SECRET' },
        { status: 500 }
      );
    }

    if (!appId) {
      console.error('[TipTap AI Route] NEXT_PUBLIC_TIPTAP_AI_APP_ID is not configured');
      return NextResponse.json(
        { error: 'AI not configured', detail: 'Missing NEXT_PUBLIC_TIPTAP_AI_APP_ID' },
        { status: 500 }
      );
    }

    // Create JWT with user claims (1 hour expiry)
    const secretKey = new TextEncoder().encode(secret);
    const token = await new jose.SignJWT({
      iat: Math.floor(Date.now() / 1000),
      userId: user.id,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .setAudience(appId)
      .sign(secretKey);

    return NextResponse.json({ token });
  } catch (error) {
    console.error('[TipTap AI Route] Token generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}
