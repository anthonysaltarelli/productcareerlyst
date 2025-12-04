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
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get secret from environment (server-side only, NOT the NEXT_PUBLIC_ one)
    const secret = process.env.TIPTAP_AI_SECRET;
    const appId = process.env.NEXT_PUBLIC_TIPTAP_AI_APP_ID;

    if (!secret) {
      console.error('TIPTAP_AI_SECRET is not configured');
      return NextResponse.json(
        { error: 'AI not configured' },
        { status: 500 }
      );
    }

    if (!appId) {
      console.error('NEXT_PUBLIC_TIPTAP_AI_APP_ID is not configured');
      return NextResponse.json(
        { error: 'AI not configured' },
        { status: 500 }
      );
    }

    // Create JWT with user claims
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

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating AI token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}




