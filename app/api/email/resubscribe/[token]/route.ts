import { NextRequest, NextResponse } from 'next/server';
import {
  validateUnsubscribeToken,
  resubscribeUser,
  getUserEmailPreferences,
} from '@/lib/email/preferences';

/**
 * POST /api/email/resubscribe/[token]
 * Resubscribe user via token (unauthenticated)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const tokenData = await validateUnsubscribeToken(token);

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // Mark token as used
    const { markTokenAsUsed } = await import('@/lib/email/preferences');
    await markTokenAsUsed(token);

    // Resubscribe user
    await resubscribeUser(
      tokenData.userId,
      tokenData.emailAddress
    );

    // Get updated preferences
    const preferences = await getUserEmailPreferences(
      tokenData.userId,
      tokenData.emailAddress
    );

    return NextResponse.json({
      success: true,
      message: 'Successfully resubscribed to marketing emails',
      preferences,
    });
  } catch (error) {
    console.error('Error resubscribing user:', error);
    return NextResponse.json(
      { error: 'Failed to resubscribe' },
      { status: 500 }
    );
  }
}

