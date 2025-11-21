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
    const max_profiles = 2; // Set to 2 for testing

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

    // IDEMPOTENCY CHECK: Insert pending record first, use unique constraint to prevent duplicates
    // The unique constraint on (user_id, company_id, application_id) for pending/processing status
    // will prevent the second insert from succeeding, causing a conflict error
    let reservationRecord = null;
    
    try {
      // Try to insert a pending reservation record FIRST
      // If a duplicate exists (pending/processing), the unique constraint will prevent this insert
      const { data: insertResult, error: insertError } = await supabase
        .from('wiza_requests')
        .insert({
          user_id: user.id,
          company_id: company_id,
          application_id: application_id || null,
          search_name: searchValue,
          search_type: searchType,
          max_profiles: max_profiles,
          job_titles: titlesToSearch,
          status: 'pending',
          wiza_status: 'queued',
          wiza_list_id: null, // Will be set after Wiza API call
        })
        .select()
        .single();

      if (insertError) {
        // Check if it's a unique constraint violation (duplicate)
        const isDuplicateError = insertError.code === '23505' || 
                                 insertError.message?.includes('duplicate') ||
                                 insertError.message?.includes('unique') ||
                                 insertError.message?.includes('idx_wiza_requests_unique_active');
        
        if (isDuplicateError) {
          console.log('[Wiza API] Duplicate detected via unique constraint violation, fetching existing request');
          
          // Query for the existing pending/processing request
          let existingQuery = supabase
            .from('wiza_requests')
            .select('id, wiza_list_id, status, wiza_status')
            .eq('user_id', user.id)
            .eq('company_id', company_id)
            .in('status', ['pending', 'processing'])
            .order('created_at', { ascending: false })
            .limit(1);

          if (application_id) {
            existingQuery = existingQuery.eq('application_id', application_id);
          } else {
            existingQuery = existingQuery.is('application_id', null);
          }

          const { data: existingRequests } = await existingQuery;
          
          if (existingRequests && existingRequests.length > 0) {
            const existing = existingRequests[0];
            
            // If list_id exists, return it immediately
            if (existing.wiza_list_id) {
              console.log('[Wiza API] Found existing request with list_id:', existing.wiza_list_id);
              return NextResponse.json({
                list_id: String(existing.wiza_list_id),
                request_id: existing.id,
                status: existing.wiza_status || 'processing',
                message: 'Using existing prospect list (duplicate request prevented).',
              });
            }
            
            // If no list_id yet, wait for it (other request is still calling Wiza API)
            console.log('[Wiza API] Found existing reservation, waiting for list_id...');
            let waited = 0;
            while (waited < 2000) {
              await new Promise(resolve => setTimeout(resolve, 200));
              waited += 200;
              
              const { data: checkResult } = await supabase
                .from('wiza_requests')
                .select('id, wiza_list_id, wiza_status')
                .eq('id', existing.id)
                .single();
              
              if (checkResult?.wiza_list_id) {
                console.log('[Wiza API] Got list_id after waiting:', checkResult.wiza_list_id);
                return NextResponse.json({
                  list_id: String(checkResult.wiza_list_id),
                  request_id: existing.id,
                  status: checkResult.wiza_status || 'processing',
                  message: 'Using existing prospect list (duplicate request prevented).',
                });
              }
            }
            
            // Still no list_id after waiting
            return NextResponse.json({
              error: 'Another request is in progress. Please try again in a moment.',
            }, { status: 409 });
          }
        }
        
        // Not a duplicate error, or couldn't find existing - return error
        console.error('[Wiza API] Insert failed with non-duplicate error:', insertError);
        return NextResponse.json({
          error: 'Failed to create request. Please try again.',
        }, { status: 500 });
      }
      
      // Insert succeeded - we have a new reservation
      reservationRecord = insertResult;
      console.log('[Wiza API] New reservation created:', reservationRecord.id);
      
    } catch (error) {
      console.error('[Wiza API] Exception in duplicate prevention:', error);
      return NextResponse.json({
        error: 'Failed to prevent duplicate requests. Please try again.',
      }, { status: 500 });
    }
    
    // If we don't have a reservation record, something went wrong
    if (!reservationRecord) {
      console.error('[Wiza API] No reservation record after insert - this should not happen');
      return NextResponse.json({
        error: 'Failed to create reservation. Please try again.',
      }, { status: 500 });
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
    // Only called if no duplicate was found
    const listResponse = await createWizaProspectList(wizaRequest);

    // Log the response for debugging
    console.log('Wiza create list response:', JSON.stringify(listResponse, null, 2));

    // Handle nested response structure - Wiza returns { data: { id, status, ... } }
    const responseData = listResponse.data || listResponse;
    const listId = responseData.id || listResponse.id;
    const wizaStatus = responseData.status || listResponse.status || 'queued';
    
    // Log the full response structure to understand actual status values
    console.log('[Wiza API] create-list response structure:', JSON.stringify(listResponse, null, 2));
    console.log('[Wiza API] Initial status:', wizaStatus);
    console.log('[Wiza API] responseData.status:', responseData.status);
    console.log('[Wiza API] listResponse.status:', listResponse.status);
    console.log('[Wiza API] Full responseData keys:', Object.keys(responseData));
    
    if (!listId) {
      console.error('Wiza response missing list ID:', listResponse);
      return NextResponse.json(
        { 
          error: 'Wiza API did not return a list ID. Response: ' + JSON.stringify(listResponse)
        },
        { status: 500 }
      );
    }

    // Update the reservation record with the Wiza API response
    let wizaRequestRecord = reservationRecord;
    
    if (reservationRecord && reservationRecord.id) {
      // Update the existing reservation record
      const { data: updatedRecord, error: updateError } = await supabase
        .from('wiza_requests')
        .update({
          wiza_list_id: String(listId),
          status: 'processing',
          wiza_status: wizaStatus,
          wiza_response: listResponse,
        })
        .eq('id', reservationRecord.id)
        .select()
        .single();

      if (updateError) {
        console.error('[Wiza API] Error updating reservation record:', updateError);
        wizaRequestRecord = reservationRecord; // Use original if update fails
      } else {
        wizaRequestRecord = updatedRecord;
      }
    } else {
      // Fallback: insert new record (shouldn't happen, but handle gracefully)
      console.warn('[Wiza API] No reservation record, inserting new record');
      const { data: newRecord, error: insertError } = await supabase
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

      if (insertError) {
        console.error('[Wiza API] Error inserting wiza request:', insertError);
      } else {
        wizaRequestRecord = newRecord;
      }
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

