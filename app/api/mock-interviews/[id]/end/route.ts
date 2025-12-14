import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const BEYOND_PRESENCE_API_KEY = process.env.BEYOND_PRESENCE_API_KEY;
const BEYOND_PRESENCE_API_URL = 'https://api.bey.dev/v1';

interface EndMockInterviewRequest {
  early_exit?: boolean;
}

interface BeyondPresenceMessage {
  sender: 'user' | 'agent' | 'ai';
  message: string;
  sent_at?: string;
}

interface BeyondPresenceCall {
  id: string;
  status: {
    type: string;
    started_at: string;
    ended_at: string | null;
  };
}

/**
 * POST /api/mock-interviews/[id]/end
 * End a mock interview session (either early exit or normal completion)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as EndMockInterviewRequest;

    // Verify the interview belongs to the user and get the bey_call_id
    const { data: interview, error: fetchError } = await supabase
      .from('mock_interviews')
      .select('id, status, started_at, bey_call_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    // Calculate duration if started_at exists
    let durationSeconds: number | null = null;
    if (interview.started_at) {
      const startedAt = new Date(interview.started_at);
      const now = new Date();
      durationSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
    }

    // Try to fetch transcript from Beyond Presence API
    let transcript: BeyondPresenceMessage[] | null = null;
    if (interview.bey_call_id && BEYOND_PRESENCE_API_KEY) {
      try {
        // Fetch transcript from Beyond Presence
        const messagesResponse = await fetch(
          `${BEYOND_PRESENCE_API_URL}/calls/${interview.bey_call_id}/messages`,
          {
            headers: {
              'x-api-key': BEYOND_PRESENCE_API_KEY,
            },
          }
        );

        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          transcript = messagesData.messages || messagesData;
          console.log(`[End Interview] Fetched ${Array.isArray(transcript) ? transcript.length : 0} messages from Beyond Presence`);
        } else {
          console.log(`[End Interview] Could not fetch messages: ${messagesResponse.status}`);
        }

        // Also fetch call details for actual duration
        const callResponse = await fetch(
          `${BEYOND_PRESENCE_API_URL}/calls/${interview.bey_call_id}`,
          {
            headers: {
              'x-api-key': BEYOND_PRESENCE_API_KEY,
            },
          }
        );

        if (callResponse.ok) {
          const callData: BeyondPresenceCall = await callResponse.json();
          if (callData.status?.started_at && callData.status?.ended_at) {
            const start = new Date(callData.status.started_at);
            const end = new Date(callData.status.ended_at);
            durationSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);
            console.log(`[End Interview] Call duration from BP: ${durationSeconds}s`);
          }
        }
      } catch (err) {
        console.error('[End Interview] Error fetching from Beyond Presence:', err);
        // Continue anyway - we'll still update our record
      }
    }

    // Update the interview status with transcript if available
    const updateData: Record<string, unknown> = {
      status: body.early_exit ? 'failed' : 'completed',
      ended_at: new Date().toISOString(),
      duration_seconds: durationSeconds,
    };

    if (transcript && transcript.length > 0) {
      updateData.transcript = transcript;
    }

    const { error: updateError } = await supabase
      .from('mock_interviews')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error ending mock interview:', updateError);
      return NextResponse.json(
        { error: 'Failed to end mock interview' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      interviewId: id,
      earlyExit: body.early_exit || false,
      durationSeconds,
      hasTranscript: transcript && transcript.length > 0,
    });
  } catch (error) {
    console.error('Error in mock interviews end API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
