import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const BEYOND_PRESENCE_API_KEY = process.env.BEYOND_PRESENCE_API_KEY;
const BEYOND_PRESENCE_API_URL = 'https://api.bey.dev/v1';

interface BeyondPresenceMessage {
  sender: 'user' | 'agent' | 'ai';
  message: string;
  sent_at?: string;
}

/**
 * POST /api/mock-interviews/[id]/refresh-transcript
 * Force refresh the transcript from Beyond Presence API
 * Use this when the user thinks the transcript is incomplete
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

    // Fetch the interview to get the bey_call_id
    const { data: interview, error: fetchError } = await supabase
      .from('mock_interviews')
      .select('id, bey_call_id, transcript')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    if (!interview.bey_call_id) {
      return NextResponse.json(
        { error: 'No call ID associated with this interview' },
        { status: 400 }
      );
    }

    if (!BEYOND_PRESENCE_API_KEY) {
      return NextResponse.json(
        { error: 'Transcript refresh service unavailable' },
        { status: 503 }
      );
    }

    // Fetch fresh transcript from Beyond Presence
    const messagesResponse = await fetch(
      `${BEYOND_PRESENCE_API_URL}/calls/${interview.bey_call_id}/messages`,
      {
        headers: {
          'x-api-key': BEYOND_PRESENCE_API_KEY,
        },
      }
    );

    if (!messagesResponse.ok) {
      console.error(
        `[Refresh Transcript] Failed to fetch from Beyond Presence: ${messagesResponse.status}`
      );
      return NextResponse.json(
        { error: 'Failed to fetch transcript from provider' },
        { status: 502 }
      );
    }

    const messagesData = await messagesResponse.json();
    const transcript: BeyondPresenceMessage[] = messagesData.messages || messagesData;

    if (!transcript || transcript.length === 0) {
      return NextResponse.json({
        success: true,
        transcript: interview.transcript || [],
        message: 'No new transcript data available',
      });
    }

    // Check if we got more messages than before
    const previousCount = interview.transcript?.length || 0;
    const newCount = transcript.length;

    // Update the database with the new transcript
    const { error: updateError } = await supabase
      .from('mock_interviews')
      .update({ transcript })
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('[Refresh Transcript] Error updating database:', updateError);
      return NextResponse.json(
        { error: 'Failed to save refreshed transcript' },
        { status: 500 }
      );
    }

    console.log(
      `[Refresh Transcript] Updated transcript for interview ${id}: ${previousCount} -> ${newCount} messages`
    );

    return NextResponse.json({
      success: true,
      transcript,
      previousCount,
      newCount,
      updated: newCount > previousCount,
    });
  } catch (error) {
    console.error('Error in refresh-transcript API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
