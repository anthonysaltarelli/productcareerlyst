import { NextRequest, NextResponse } from 'next/server';
import { initializeAmplitude, identifyUser } from '@/lib/amplitude/server';

// Ensure Amplitude is initialized for this API route
initializeAmplitude();

/**
 * API route for client-side user identification
 * POST /api/analytics/identify
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userProperties } = body;

    if (process.env.NODE_ENV === 'development') {
      console.log('👤 Received identification request:', {
        userId: userId || 'none',
        hasProperties: !!userProperties,
      });
    }

    if (!userId) {
      console.error('❌ Missing userId in identification request');
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    await identifyUser(userId, userProperties);

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ User identified successfully:', userId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error in analytics identify route:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    return NextResponse.json(
      { error: 'Failed to identify user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

