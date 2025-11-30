import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/jobs/contacts/[id]/scheduled-calls/[callId] - Get a specific scheduled call
export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; callId: string }> }
) => {
  try {
    const supabase = await createClient();
    const { id: contactId, callId } = await params;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: call, error } = await supabase
      .from('scheduled_calls')
      .select('*')
      .eq('id', callId)
      .eq('contact_id', contactId)
      .eq('user_id', user.id)
      .single();

    if (error || !call) {
      return NextResponse.json(
        { error: 'Scheduled call not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ call });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// PATCH /api/jobs/contacts/[id]/scheduled-calls/[callId] - Update a scheduled call
export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; callId: string }> }
) => {
  try {
    const supabase = await createClient();
    const { id: contactId, callId } = await params;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Only allow updating certain fields
    const allowedFields = [
      'scheduled_for',
      'duration_minutes',
      'call_type',
      'status',
      'meeting_link',
      'location',
      'notes',
      'outcome_notes',
      'completed_at',
    ];

    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    updateData.updated_at = new Date().toISOString();

    const { data: call, error } = await supabase
      .from('scheduled_calls')
      .update(updateData)
      .eq('id', callId)
      .eq('contact_id', contactId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating scheduled call:', error);
      return NextResponse.json(
        { error: 'Failed to update scheduled call' },
        { status: 500 }
      );
    }

    if (!call) {
      return NextResponse.json(
        { error: 'Scheduled call not found' },
        { status: 404 }
      );
    }

    // If the call was marked as completed, update the contact's last_contact_date
    if (body.status === 'completed') {
      await supabase
        .from('contacts')
        .update({
          last_contact_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        })
        .eq('id', contactId);
    }

    return NextResponse.json({ call });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// DELETE /api/jobs/contacts/[id]/scheduled-calls/[callId] - Delete a scheduled call
export const DELETE = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; callId: string }> }
) => {
  try {
    const supabase = await createClient();
    const { id: contactId, callId } = await params;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { error } = await supabase
      .from('scheduled_calls')
      .delete()
      .eq('id', callId)
      .eq('contact_id', contactId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting scheduled call:', error);
      return NextResponse.json(
        { error: 'Failed to delete scheduled call' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Scheduled call deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};
