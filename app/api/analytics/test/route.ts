import { NextResponse } from 'next/server';
import { initializeAmplitude, trackEvent } from '@/lib/amplitude/server';

/**
 * Test endpoint to verify Amplitude setup
 * GET /api/analytics/test
 */
export async function GET() {
  try {
    // Check if API key is set
    const apiKey = process.env.AMPLITUDE_API_KEY;
    const hasApiKey = !!apiKey;

    // Initialize Amplitude
    initializeAmplitude();

    // Try to track a test event
    const testDeviceId = 'test-device-' + Date.now();
    await trackEvent('Test Event', {
      'Test Property': 'test value',
      'Timestamp': new Date().toISOString(),
    }, undefined, testDeviceId);

    return NextResponse.json({
      success: true,
      hasApiKey,
      apiKeyLength: apiKey?.length || 0,
      message: 'Test event sent. Check Amplitude dashboard and server logs.',
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

