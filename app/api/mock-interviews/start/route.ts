import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Beyond Presence configuration
const BEYOND_PRESENCE_API_KEY = process.env.BEYOND_PRESENCE_API_KEY;
const BEYOND_PRESENCE_AGENT_ID = process.env.BEYOND_PRESENCE_AGENT_ID || 'd8fb7a43-1df7-4e32-ba1d-60435a254c13';
const BEYOND_PRESENCE_API_URL = 'https://api.bey.dev/v1';

interface BeyondPresenceCallResponse {
  id: string;
  agent_id: string;
  started_at: string;
  ended_at: string | null;
  livekit_url: string;
  livekit_token: string;
  tags?: Record<string, string>;
}

/**
 * POST /api/mock-interviews/start
 * Create a new mock interview session via Beyond Presence API
 * Returns LiveKit credentials for direct connection
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!BEYOND_PRESENCE_API_KEY) {
      console.error('BEYOND_PRESENCE_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Mock interview service is not configured' },
        { status: 500 }
      );
    }

    // Create the mock interview record first
    const { data: interview, error: insertError } = await supabase
      .from('mock_interviews')
      .insert({
        user_id: user.id,
        status: 'pending',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating mock interview:', insertError);
      return NextResponse.json(
        { error: 'Failed to create mock interview session' },
        { status: 500 }
      );
    }

    // Call Beyond Presence API to create a call and get LiveKit credentials
    const beyResponse = await fetch(`${BEYOND_PRESENCE_API_URL}/calls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': BEYOND_PRESENCE_API_KEY,
      },
      body: JSON.stringify({
        agent_id: BEYOND_PRESENCE_AGENT_ID,
        livekit_username: user.email?.split('@')[0] || 'User',
        tags: {
          interview_id: interview.id,
          user_id: user.id,
        },
      }),
    });

    if (!beyResponse.ok) {
      const errorText = await beyResponse.text();
      console.error('Beyond Presence API error:', beyResponse.status, errorText);

      // Clean up the interview record
      await supabase.from('mock_interviews').delete().eq('id', interview.id);

      return NextResponse.json(
        { error: 'Failed to start video interview session' },
        { status: 500 }
      );
    }

    const beyData: BeyondPresenceCallResponse = await beyResponse.json();

    // Update the interview record with the Beyond Presence call ID
    const { error: updateError } = await supabase
      .from('mock_interviews')
      .update({
        bey_call_id: beyData.id,
        status: 'in_progress',
      })
      .eq('id', interview.id);

    if (updateError) {
      console.error('Error updating mock interview with call ID:', updateError);
      // Don't fail the request, the interview can still proceed
    }

    return NextResponse.json({
      success: true,
      interviewId: interview.id,
      callId: beyData.id,
      livekitUrl: beyData.livekit_url,
      livekitToken: beyData.livekit_token,
    });
  } catch (error) {
    console.error('Error in mock interviews start API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
