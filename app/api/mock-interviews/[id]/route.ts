import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const BEYOND_PRESENCE_API_KEY = process.env.BEYOND_PRESENCE_API_KEY;
const BEYOND_PRESENCE_API_URL = 'https://api.bey.dev/v1';

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
 * GET /api/mock-interviews/[id]
 * Fetch a single mock interview with transcript
 * Will attempt to fetch transcript from Beyond Presence if not yet stored
 */
export async function GET(
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

    // Fetch the interview
    const { data: interview, error: fetchError } = await supabase
      .from('mock_interviews')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    // If we don't have a transcript yet and the call is completed, try to fetch it
    if (
      (!interview.transcript || interview.transcript.length === 0) &&
      interview.bey_call_id &&
      BEYOND_PRESENCE_API_KEY
    ) {
      try {
        // Check if the call is completed on Beyond Presence
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

          // Only fetch transcript if call is completed
          if (callData.status?.type === 'completed') {
            const messagesResponse = await fetch(
              `${BEYOND_PRESENCE_API_URL}/calls/${interview.bey_call_id}/messages`,
              {
                headers: {
                  'x-api-key': BEYOND_PRESENCE_API_KEY,
                },
              }
            );

            if (messagesResponse.ok) {
              const transcript: BeyondPresenceMessage[] = await messagesResponse.json();

              if (transcript && transcript.length > 0) {
                // Calculate duration from Beyond Presence
                let durationSeconds = interview.duration_seconds;
                if (callData.status.started_at && callData.status.ended_at) {
                  const start = new Date(callData.status.started_at);
                  const end = new Date(callData.status.ended_at);
                  durationSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);
                }

                // Update the database with the transcript
                const { error: updateError } = await supabase
                  .from('mock_interviews')
                  .update({
                    transcript,
                    duration_seconds: durationSeconds,
                    status: 'completed',
                  })
                  .eq('id', id)
                  .eq('user_id', user.id);

                if (!updateError) {
                  // Return updated interview data
                  return NextResponse.json({
                    ...interview,
                    transcript,
                    duration_seconds: durationSeconds,
                    status: 'completed',
                  });
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('[Get Interview] Error fetching from Beyond Presence:', err);
        // Continue and return what we have
      }
    }

    return NextResponse.json(interview);
  } catch (error) {
    console.error('Error fetching mock interview:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
