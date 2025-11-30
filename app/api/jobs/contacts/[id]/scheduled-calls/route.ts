import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { incrementWeeklyGoalProgress } from '@/lib/utils/weekly-goals';

// GET /api/jobs/contacts/[id]/scheduled-calls - Get all scheduled calls for a contact
export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const supabase = await createClient();
    const { id: contactId } = await params;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // First verify the contact belongs to the user
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', contactId)
      .eq('user_id', user.id)
      .single();

    if (contactError || !contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Fetch scheduled calls for this contact
    const { data: calls, error } = await supabase
      .from('scheduled_calls')
      .select('*')
      .eq('contact_id', contactId)
      .eq('user_id', user.id)
      .order('scheduled_for', { ascending: false });

    if (error) {
      console.error('Error fetching scheduled calls:', error);
      return NextResponse.json(
        { error: 'Failed to fetch scheduled calls' },
        { status: 500 }
      );
    }

    return NextResponse.json({ calls: calls || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// POST /api/jobs/contacts/[id]/scheduled-calls - Create a new scheduled call
export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const supabase = await createClient();
    const { id: contactId } = await params;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // First verify the contact belongs to the user
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, name')
      .eq('id', contactId)
      .eq('user_id', user.id)
      .single();

    if (contactError || !contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      scheduled_for,
      duration_minutes = 30,
      call_type = 'video_call',
      meeting_link,
      location,
      notes,
    } = body;

    if (!scheduled_for) {
      return NextResponse.json(
        { error: 'Scheduled date/time is required' },
        { status: 400 }
      );
    }

    // Create the scheduled call
    const { data: call, error: createError } = await supabase
      .from('scheduled_calls')
      .insert({
        user_id: user.id,
        contact_id: contactId,
        scheduled_for,
        duration_minutes,
        call_type,
        meeting_link: meeting_link || null,
        location: location || null,
        notes: notes || null,
        status: 'scheduled',
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating scheduled call:', createError);
      return NextResponse.json(
        { error: 'Failed to create scheduled call' },
        { status: 500 }
      );
    }

    // Trigger the weekly goal progress for networking calls
    try {
      const result = await incrementWeeklyGoalProgress(
        user.id,
        'networking_call_scheduled',
        1
      );

      if (result.success && result.goalsUpdated > 0) {
        console.log(`Weekly networking goal updated for user ${user.id}`);
      }
    } catch (goalError) {
      // Log but don't fail the request if goal tracking fails
      console.error('Error updating weekly goal:', goalError);
    }

    // Also update the contact's last_contact_date
    await supabase
      .from('contacts')
      .update({
        last_contact_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .eq('id', contactId);

    return NextResponse.json({
      call,
      message: 'Call scheduled successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};
