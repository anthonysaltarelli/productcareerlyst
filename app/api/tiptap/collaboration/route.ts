import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as jose from 'jose';

/**
 * TipTap Collaboration JWT Token Generator
 * 
 * This endpoint generates JWT tokens for TipTap Cloud collaboration.
 * In production, this ensures:
 * 1. Only authenticated users can get tokens
 * 2. Tokens are short-lived (1 hour)
 * 3. User information is included for collaboration cursors
 * 
 * Required environment variables:
 * - TIPTAP_COLLAB_SECRET: Your secret key from TipTap Cloud (NOT the public one)
 * - NEXT_PUBLIC_TIPTAP_COLLAB_APP_ID: Your collaboration App ID
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
    const secret = process.env.TIPTAP_COLLAB_SECRET;
    const appId = process.env.NEXT_PUBLIC_TIPTAP_COLLAB_APP_ID;

    if (!secret) {
      console.error('TIPTAP_COLLAB_SECRET is not configured');
      return NextResponse.json(
        { error: 'Collaboration not configured' },
        { status: 500 }
      );
    }

    if (!appId) {
      console.error('NEXT_PUBLIC_TIPTAP_COLLAB_APP_ID is not configured');
      return NextResponse.json(
        { error: 'Collaboration not configured' },
        { status: 500 }
      );
    }

    // Get user profile for display name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const userName = profile?.full_name || user.email?.split('@')[0] || 'Anonymous';

    // Create JWT with user claims
    const secretKey = new TextEncoder().encode(secret);
    
    const token = await new jose.SignJWT({
      // TipTap required claims
      iat: Math.floor(Date.now() / 1000),
      // User information for collaboration cursors
      user: {
        id: user.id,
        name: userName,
        email: user.email,
      },
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h') // Token expires in 1 hour
      .setAudience(appId)
      .sign(secretKey);

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating collaboration token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}







