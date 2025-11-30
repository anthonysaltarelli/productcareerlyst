import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { markBaselineActionsComplete } from '@/lib/utils/baseline-actions';

// GET /api/jobs/contacts - Get contacts for user (optionally filtered by company or application)
export const GET = async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('company_id');
    const applicationId = searchParams.get('application_id');

    let query = supabase
      .from('contacts')
      .select(`
        *,
        company:companies(*),
        interactions:contact_interactions(*)
      `)
      .eq('user_id', user.id)
      .order('last_contact_date', { ascending: false, nullsFirst: false });

    // Filter by company if provided
    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    // Filter by application if provided
    if (applicationId) {
      query = query.eq('application_id', applicationId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching contacts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch contacts' },
        { status: 500 }
      );
    }

    return NextResponse.json({ contacts: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// POST /api/jobs/contacts - Create a new contact
export const POST = async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.company_id || !body.name) {
      return NextResponse.json(
        { error: 'Company ID and name are required' },
        { status: 400 }
      );
    }

    // Create contact
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        user_id: user.id,
        company_id: body.company_id,
        application_id: body.application_id,
        name: body.name,
        title: body.title,
        email: body.email,
        phone: body.phone,
        linkedin_url: body.linkedin_url,
        relationship: body.relationship,
        last_contact_date: body.last_contact_date,
        notes: body.notes,
      })
      .select(`
        *,
        company:companies(*)
      `)
      .single();

    if (error) {
      console.error('Error creating contact:', error);
      return NextResponse.json(
        { error: 'Failed to create contact' },
        { status: 500 }
      );
    }

    // Mark baseline action complete for adding a contact
    markBaselineActionsComplete(user.id, 'contact_added').catch((err) => {
      console.error('Error marking contact_added baseline action:', err);
    });

    return NextResponse.json(
      { contact: data },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

