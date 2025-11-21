import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createWizaProspectList, WizaProspectListRequest } from '@/lib/utils/wiza';

/**
 * POST /api/jobs/wiza/create-list
 * 
 * Create a prospect list in Wiza for finding contacts at a company
 * 
 * Request body:
 * {
 *   company_name: string;
 *   job_titles?: string[]; // Optional, defaults to product management titles
 * }
 */
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
    const { company_id, company_name, company_linkedin_url, job_titles, application_id } = body;
    const max_profiles = 10; // Fixed to 10

    if (!company_id) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Get company details to use linkedin_url if available
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('name, linkedin_url')
      .eq('id', company_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Use linkedin_url if available, otherwise use company name
    const searchValue = company.linkedin_url || company_name || company.name;
    const searchType = company.linkedin_url ? 'linkedin_url' : 'company_name';
    
    if (!searchValue) {
      return NextResponse.json(
        { error: 'Company name or LinkedIn URL is required' },
        { status: 400 }
      );
    }

    // Default product management job titles if not provided
    const defaultJobTitles = [
      'Product Manager',
      'Director of Product',
      'Chief Product Officer',
      'VP of Product',
      'Associate Product Manager',
      'Product Owner',
      'Vice President of Product Management',
      'Sr. Director Product Management',
      'Technical Product Manager',
      'Director of Product Management',
      'Director of Product Operations',
    ];

    const titlesToSearch = job_titles && job_titles.length > 0 
      ? job_titles 
      : defaultJobTitles;

    // Create prospect list request
    // If we have LinkedIn URL, use profile_url filter; otherwise use company name
    const listName = `Product Managers at ${company.name}`;
    const filters: any = {
      job_title: titlesToSearch.map((title: string) => ({ v: title, s: 'i' })),
    };

    if (searchType === 'linkedin_url' && company.linkedin_url) {
      // Use LinkedIn profile URL filter
      filters.profile_url = [{ v: company.linkedin_url, s: 'i' }];
    } else {
      // Use company name filter
      filters.job_company = [{ v: searchValue, s: 'i' }];
    }

    const enrichmentLevel: 'partial' = 'partial';
    const wizaRequest: WizaProspectListRequest = {
      list: {
        name: listName,
        max_profiles: max_profiles,
        enrichment_level: enrichmentLevel,
        email_options: {
          accept_work: true,
          accept_personal: false,
          accept_generic: false,
        },
      },
      filters: filters,
    };

    // Create the list (this is async, returns immediately)
    const listResponse = await createWizaProspectList(wizaRequest);

    // Log the response for debugging
    console.log('Wiza create list response:', JSON.stringify(listResponse, null, 2));

    // Handle nested response structure - Wiza returns { data: { id, status, ... } }
    const responseData = listResponse.data || listResponse;
    const listId = responseData.id || listResponse.id;
    const wizaStatus = responseData.status || listResponse.status || 'queued';
    
    if (!listId) {
      console.error('Wiza response missing list ID:', listResponse);
      return NextResponse.json(
        { 
          error: 'Wiza API did not return a list ID. Response: ' + JSON.stringify(listResponse)
        },
        { status: 500 }
      );
    }

    // Store request in database
    const { data: wizaRequestRecord, error: dbError } = await supabase
      .from('wiza_requests')
      .insert({
        user_id: user.id,
        company_id: company_id,
        application_id: application_id || null,
        wiza_list_id: String(listId),
        search_name: searchValue,
        search_type: searchType,
        max_profiles: max_profiles,
        job_titles: titlesToSearch,
        status: 'processing',
        wiza_status: wizaStatus,
        wiza_response: listResponse,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error storing wiza request:', dbError);
      // Don't fail the request, just log the error
    }

    // Return the list ID immediately - client will poll for completion
    return NextResponse.json({
      list_id: String(listId),
      request_id: wizaRequestRecord?.id,
      status: wizaStatus,
      message: 'Prospect list created. Use the list_id to fetch contacts when ready.',
    });
  } catch (error) {
    console.error('Error creating Wiza list:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create Wiza prospect list' 
      },
      { status: 500 }
    );
  }
};

