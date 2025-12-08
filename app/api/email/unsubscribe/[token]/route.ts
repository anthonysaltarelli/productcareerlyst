import { NextRequest, NextResponse } from 'next/server';
import {
  validateUnsubscribeToken,
  unsubscribeUser,
  resubscribeUser,
  getUserEmailPreferences,
} from '@/lib/email/preferences';

/**
 * GET /api/email/unsubscribe/[token]
 * Get unsubscribe page data (unauthenticated)
 */
export async function GET(
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

    // Get current preferences
    const preferences = await getUserEmailPreferences(
      tokenData.userId,
      tokenData.emailAddress
    );

    return NextResponse.json({
      success: true,
      token: {
        userId: tokenData.userId,
        emailAddress: tokenData.emailAddress,
        used: tokenData.used,
      },
      preferences,
    });
  } catch (error) {
    console.error('Error getting unsubscribe data:', error);
    return NextResponse.json(
      { error: 'Failed to get unsubscribe data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/email/unsubscribe/[token]
 * Unsubscribe user via token (unauthenticated)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { reason } = body;

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

    if (tokenData.used) {
      return NextResponse.json(
        { error: 'Token has already been used' },
        { status: 400 }
      );
    }

    // Mark token as used
    const { markTokenAsUsed } = await import('@/lib/email/preferences');
    await markTokenAsUsed(token);

    // Unsubscribe user
    await unsubscribeUser(
      tokenData.userId,
      tokenData.emailAddress,
      reason
    );

    // Get updated preferences
    const preferences = await getUserEmailPreferences(
      tokenData.userId,
      tokenData.emailAddress
    );

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from marketing emails',
      preferences,
    });
  } catch (error) {
    console.error('Error unsubscribing user:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}

