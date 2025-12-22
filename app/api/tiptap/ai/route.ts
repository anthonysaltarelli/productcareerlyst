import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as jose from 'jose';

/**
 * TipTap AI JWT Token Generator
 *
 * This endpoint generates JWT tokens for TipTap AI features.
 * In production, this ensures:
 * 1. Only authenticated users can get tokens
 * 2. Tokens are short-lived (1 hour)
 * 3. Usage can be tracked per user
 *
 * Required environment variables:
 * - TIPTAP_AI_SECRET: Your AI secret key from TipTap Cloud (NOT the public one)
 * - NEXT_PUBLIC_TIPTAP_AI_APP_ID: Your AI App ID
 */

export async function POST() {
  const requestId = crypto.randomUUID().slice(0, 8);
  const startTime = Date.now();
  console.log(`[TipTap AI ${requestId}] Token generation request started at ${new Date().toISOString()}`);

  try {
    // Log environment variable status (not values for security)
    const secret = process.env.TIPTAP_AI_SECRET;
    const appId = process.env.NEXT_PUBLIC_TIPTAP_AI_APP_ID;

    console.log(`[TipTap AI ${requestId}] Environment check (+${Date.now() - startTime}ms):`, {
      hasSecret: !!secret,
      secretLength: secret?.length || 0,
      hasAppId: !!appId,
      appId: appId || 'NOT_SET',
    });

    // Verify user is authenticated
    console.log(`[TipTap AI ${requestId}] Creating Supabase client (+${Date.now() - startTime}ms)`);
    const supabase = await createClient();
    console.log(`[TipTap AI ${requestId}] Supabase client created (+${Date.now() - startTime}ms)`);

    console.log(`[TipTap AI ${requestId}] Getting user (+${Date.now() - startTime}ms)`);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log(`[TipTap AI ${requestId}] User retrieved (+${Date.now() - startTime}ms)`);

    console.log(`[TipTap AI ${requestId}] Auth check:`, {
      hasUser: !!user,
      userId: user?.id?.slice(0, 8) || 'none',
      authError: authError?.message || null,
    });

    if (authError || !user) {
      console.log(`[TipTap AI ${requestId}] Unauthorized - returning 401`);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!secret) {
      console.error(`[TipTap AI ${requestId}] TIPTAP_AI_SECRET is not configured`);
      return NextResponse.json(
        { error: 'AI not configured', detail: 'Missing TIPTAP_AI_SECRET' },
        { status: 500 }
      );
    }

    if (!appId) {
      console.error(`[TipTap AI ${requestId}] NEXT_PUBLIC_TIPTAP_AI_APP_ID is not configured`);
      return NextResponse.json(
        { error: 'AI not configured', detail: 'Missing NEXT_PUBLIC_TIPTAP_AI_APP_ID' },
        { status: 500 }
      );
    }

    // Create JWT with user claims
    console.log(`[TipTap AI ${requestId}] Generating JWT token for appId: ${appId}`);
    const secretKey = new TextEncoder().encode(secret);

    const token = await new jose.SignJWT({
      // TipTap required claims
      iat: Math.floor(Date.now() / 1000),
      // User ID for usage tracking
      userId: user.id,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h') // Token expires in 1 hour
      .setAudience(appId)
      .sign(secretKey);

    console.log(`[TipTap AI ${requestId}] Token generated successfully, length: ${token.length}`);

    // Log a snippet of the token for debugging (first 20 chars only)
    console.log(`[TipTap AI ${requestId}] Token preview: ${token.slice(0, 20)}...`);

    return NextResponse.json({ token });
  } catch (error) {
    console.error(`[TipTap AI ${requestId}] Error generating AI token:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}







