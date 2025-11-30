import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/jobs/contacts/[id]/outreach/[outreachId] - Get a specific outreach record
export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; outreachId: string }> }
) => {
  try {
    const supabase = await createClient();
    const { id: contactId, outreachId } = await params;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: outreach, error } = await supabase
      .from('contact_outreach')
      .select('*')
      .eq('id', outreachId)
      .eq('contact_id', contactId)
      .eq('user_id', user.id)
      .single();

    if (error || !outreach) {
      return NextResponse.json(
        { error: 'Outreach record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ outreach });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// PATCH /api/jobs/contacts/[id]/outreach/[outreachId] - Update an outreach record
export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; outreachId: string }> }
) => {
  try {
    const supabase = await createClient();
    const { id: contactId, outreachId } = await params;

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
      'outreach_type',
      'subject',
      'message_summary',
      'sent_at',
      'response_received',
      'response_at',
      'response_notes',
    ];

    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    updateData.updated_at = new Date().toISOString();

    const { data: outreach, error } = await supabase
      .from('contact_outreach')
      .update(updateData)
      .eq('id', outreachId)
      .eq('contact_id', contactId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating outreach:', error);
      return NextResponse.json(
        { error: 'Failed to update outreach record' },
        { status: 500 }
      );
    }

    if (!outreach) {
      return NextResponse.json(
        { error: 'Outreach record not found' },
        { status: 404 }
      );
    }

    // If response was received, update the contact's outreach status
    if (body.response_received === true) {
      await supabase
        .from('contacts')
        .update({
          outreach_status: 'replied',
          updated_at: new Date().toISOString(),
        })
        .eq('id', contactId);
    }

    return NextResponse.json({ outreach });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// DELETE /api/jobs/contacts/[id]/outreach/[outreachId] - Delete an outreach record
export const DELETE = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; outreachId: string }> }
) => {
  try {
    const supabase = await createClient();
    const { id: contactId, outreachId } = await params;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { error } = await supabase
      .from('contact_outreach')
      .delete()
      .eq('id', outreachId)
      .eq('contact_id', contactId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting outreach:', error);
      return NextResponse.json(
        { error: 'Failed to delete outreach record' },
        { status: 500 }
      );
    }

    // Update the contact's outreach count
    const { data: remainingOutreach } = await supabase
      .from('contact_outreach')
      .select('id')
      .eq('contact_id', contactId)
      .eq('user_id', user.id);

    const newCount = remainingOutreach?.length || 0;
    await supabase
      .from('contacts')
      .update({
        outreach_count: newCount,
        outreach_status: newCount === 0 ? 'not_contacted' : 'contacted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', contactId);

    return NextResponse.json(
      { message: 'Outreach record deleted successfully' },
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
