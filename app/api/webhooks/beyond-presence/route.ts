import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role client to bypass RLS for webhook updates
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Beyond Presence webhook event types
interface BeyondPresenceMessage {
  sender: 'user' | 'agent' | 'ai';
  message: string;
  timestamp?: string;
  sent_at?: string;
}

interface BeyondPresenceEvaluation {
  topic?: string;
  user_sentiment?: 'positive' | 'neutral' | 'negative';
  duration?: number;
  message_count?: number;
}

interface BeyondPresenceCallData {
  userName?: string;
  agentId?: string;
}

interface BeyondPresenceWebhookEvent {
  event_type: 'test' | 'message' | 'call_ended';
  call_id?: string;
  sender?: 'user' | 'agent';
  message?: string;
  timestamp?: string;
  messages?: BeyondPresenceMessage[];
  evaluation?: BeyondPresenceEvaluation;
  call_data?: BeyondPresenceCallData;
}

// CORS headers required by Beyond Presence (will be removed in future per their docs)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body: BeyondPresenceWebhookEvent = await request.json();

    // Log all webhook events for debugging
    console.log('[Beyond Presence Webhook] Event received:', JSON.stringify(body, null, 2));

    // Handle test event (sent when webhook URL is configured)
    if (body.event_type === 'test') {
      console.log('[Beyond Presence Webhook] Test event received - webhook configured successfully');
      return NextResponse.json(
        { success: true, message: 'Webhook test successful' },
        { status: 200, headers: corsHeaders }
      );
    }

    // Handle message events (real-time during call)
    if (body.event_type === 'message') {
      console.log('[Beyond Presence Webhook] Message event:', {
        call_id: body.call_id,
        sender: body.sender,
        message: body.message?.substring(0, 100), // Truncate for logging
      });

      // For now, just acknowledge - we'll get full transcript in call_ended
      return NextResponse.json(
        { success: true },
        { status: 200, headers: corsHeaders }
      );
    }

    // Handle call_ended events (contains full transcript and evaluation)
    if (body.event_type === 'call_ended') {
      const { call_id, messages, evaluation, call_data } = body;

      console.log('[Beyond Presence Webhook] Call ended:', {
        call_id,
        message_count: messages?.length,
        evaluation,
        call_data,
      });

      if (!call_id) {
        console.error('[Beyond Presence Webhook] call_ended event missing call_id');
        return NextResponse.json(
          { success: false, error: 'Missing call_id' },
          { status: 400, headers: corsHeaders }
        );
      }

      // Find the mock interview record by bey_call_id
      const { data: existingInterview, error: findError } = await supabaseAdmin
        .from('mock_interviews')
        .select('id')
        .eq('bey_call_id', call_id)
        .single();

      if (findError && findError.code !== 'PGRST116') {
        // PGRST116 = not found, which is okay
        console.error('[Beyond Presence Webhook] Error finding interview:', findError);
      }

      if (existingInterview) {
        // Update existing record with transcript and evaluation
        const { error: updateError } = await supabaseAdmin
          .from('mock_interviews')
          .update({
            status: 'completed',
            ended_at: new Date().toISOString(),
            duration_seconds: evaluation?.duration,
            transcript: messages,
            evaluation: evaluation,
          })
          .eq('id', existingInterview.id);

        if (updateError) {
          console.error('[Beyond Presence Webhook] Error updating interview:', updateError);
          return NextResponse.json(
            { success: false, error: 'Failed to update interview' },
            { status: 500, headers: corsHeaders }
          );
        }

        console.log('[Beyond Presence Webhook] Successfully updated interview:', existingInterview.id);
      } else {
        // No matching record found - log for debugging
        // This could happen if someone uses the agent directly without going through our app
        console.log('[Beyond Presence Webhook] No matching mock_interview found for call_id:', call_id);
        console.log('[Beyond Presence Webhook] Full payload stored in logs for debugging');
      }

      return NextResponse.json(
        { success: true },
        { status: 200, headers: corsHeaders }
      );
    }

    // Unknown event type
    console.log('[Beyond Presence Webhook] Unknown event type:', body.event_type);
    return NextResponse.json(
      { success: true, message: 'Event acknowledged' },
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('[Beyond Presence Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
