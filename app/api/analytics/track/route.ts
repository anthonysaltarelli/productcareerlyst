import { NextRequest, NextResponse } from 'next/server';
import { initializeAmplitude, trackEvent } from '@/lib/amplitude/server';

// Ensure Amplitude is initialized for this API route
initializeAmplitude();

/**
 * API route for client-side event tracking
 * POST /api/analytics/track
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, eventProperties, userId, deviceId } = body;

    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Received tracking request:', {
        eventType,
        hasProperties: !!eventProperties,
        userId: userId || 'none',
        deviceId: deviceId || 'none',
      });
    }

    if (!eventType) {
      console.error('❌ Missing eventType in tracking request');
      return NextResponse.json(
        { error: 'eventType is required' },
        { status: 400 }
      );
    }

    // Fire-and-forget: Don't await tracking - analytics should never block API responses
    // This ensures the API returns immediately while tracking happens in the background
    trackEvent(eventType, eventProperties, userId, deviceId).catch((error) => {
      // Silently handle errors - analytics failures should never affect API responses
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Analytics tracking error (non-blocking):', error);
      }
    });

    // Return immediately - don't wait for tracking to complete
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error in analytics track route:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    return NextResponse.json(
      { error: 'Failed to track event', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

