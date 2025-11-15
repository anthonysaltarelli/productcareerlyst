import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/jobs/companies - Get all companies (with optional search)
export const GET = async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const approved = searchParams.get('approved');

    let query = supabase
      .from('companies')
      .select('*')
      .order('name', { ascending: true });

    // Filter by search term
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Filter by approval status
    if (approved !== null) {
      query = query.eq('is_approved', approved === 'true');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching companies:', error);
      return NextResponse.json(
        { error: 'Failed to fetch companies' },
        { status: 500 }
      );
    }

    return NextResponse.json({ companies: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// POST /api/jobs/companies - Create a new company
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
    if (!body.name) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    // Create company (will need admin approval)
    const { data, error } = await supabase
      .from('companies')
      .insert({
        name: body.name,
        website: body.website,
        linkedin_url: body.linkedin_url,
        industry: body.industry,
        size: body.size,
        headquarters_city: body.headquarters_city,
        headquarters_state: body.headquarters_state,
        headquarters_country: body.headquarters_country || 'USA',
        description: body.description,
        founded_year: body.founded_year,
        is_approved: false, // Needs admin approval
        created_by_user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating company:', error);
      
      // Check for unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A company with this name already exists' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create company' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        company: data,
        message: 'Company created successfully and pending admin approval'
      },
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

