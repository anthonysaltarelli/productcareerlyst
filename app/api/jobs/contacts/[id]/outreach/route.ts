import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { incrementWeeklyGoalProgress } from '@/lib/utils/weekly-goals';

// GET /api/jobs/contacts/[id]/outreach - Get all outreach for a contact
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

    // Fetch outreach records for this contact
    const { data: outreach, error } = await supabase
      .from('contact_outreach')
      .select('*')
      .eq('contact_id', contactId)
      .eq('user_id', user.id)
      .order('sent_at', { ascending: false });

    if (error) {
      console.error('Error fetching outreach:', error);
      return NextResponse.json(
        { error: 'Failed to fetch outreach records' },
        { status: 500 }
      );
    }

    return NextResponse.json({ outreach: outreach || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// POST /api/jobs/contacts/[id]/outreach - Log a new outreach
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
      .select('id, name, outreach_count')
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
      outreach_type = 'email',
      subject,
      message_summary,
      sent_at,
    } = body;

    if (!outreach_type) {
      return NextResponse.json(
        { error: 'Outreach type is required' },
        { status: 400 }
      );
    }

    // Create the outreach record
    const { data: outreach, error: createError } = await supabase
      .from('contact_outreach')
      .insert({
        user_id: user.id,
        contact_id: contactId,
        outreach_type,
        subject: subject || null,
        message_summary: message_summary || null,
        sent_at: sent_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating outreach:', createError);
      return NextResponse.json(
        { error: 'Failed to log outreach' },
        { status: 500 }
      );
    }

    // Update the contact's outreach status and count
    const newOutreachCount = (contact.outreach_count || 0) + 1;
    await supabase
      .from('contacts')
      .update({
        outreach_status: 'contacted',
        outreach_count: newOutreachCount,
        last_contacted_at: sent_at || new Date().toISOString(),
        last_contact_date: (sent_at || new Date().toISOString()).split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .eq('id', contactId);

    // Trigger the weekly goal progress for outreach emails
    try {
      const result = await incrementWeeklyGoalProgress(
        user.id,
        'outreach_email_sent',
        1
      );

      if (result.success && result.goalsUpdated > 0) {
        console.log(`Weekly outreach goal updated for user ${user.id}`);
      }
    } catch (goalError) {
      // Log but don't fail the request if goal tracking fails
      console.error('Error updating weekly goal:', goalError);
    }

    return NextResponse.json({
      outreach,
      message: 'Outreach logged successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};
