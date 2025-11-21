import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWizaListContacts } from '@/lib/utils/wiza';

/**
 * GET /api/jobs/wiza/list-contacts?list_id=<id>
 * 
 * Get contacts from a Wiza prospect list
 */
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
    const listId = searchParams.get('list_id');

    if (!listId) {
      return NextResponse.json(
        { error: 'list_id query parameter is required' },
        { status: 400 }
      );
    }

    // Get contacts from the list
    let contactsResponse;
    try {
      contactsResponse = await getWizaListContacts(listId, 'people');
    } catch (error) {
      // Handle "No contacts" error gracefully
      if (error instanceof Error && (error.message.includes('400') || error.message.includes('No contacts'))) {
        console.warn(`List ${listId} has no contacts`);
        
        // Update request status in database
        const { data: wizaRequest } = await supabase
          .from('wiza_requests')
          .select('id')
          .eq('wiza_list_id', listId)
          .eq('user_id', user.id)
          .single();
        
        if (wizaRequest) {
          await supabase
            .from('wiza_requests')
            .update({
              status: 'no_contacts',
              contacts_found: 0,
              completed_at: new Date().toISOString(),
              error_message: 'No contacts found',
            })
            .eq('id', wizaRequest.id);
        }
        
        return NextResponse.json({
          contacts: [],
          list_id: listId,
          status: 'no_contacts',
          message: 'No contacts found for this search',
        });
      }
      
      // If list doesn't exist, return empty array
      if (error instanceof Error && error.message.includes('404')) {
        console.warn(`List ${listId} not found`);
        return NextResponse.json({
          contacts: [],
          list_id: listId,
          status: 'not_found',
          message: 'List not found',
        });
      }
      throw error;
    }

    const contacts = contactsResponse.contacts || [];
    
    // Update request in database with results
    const { data: wizaRequest } = await supabase
      .from('wiza_requests')
      .select('id')
      .eq('wiza_list_id', listId)
      .eq('user_id', user.id)
      .single();
    
    if (wizaRequest) {
      await supabase
        .from('wiza_requests')
        .update({
          status: contacts.length > 0 ? 'completed' : 'no_contacts',
          contacts_found: contacts.length,
          completed_at: new Date().toISOString(),
        })
        .eq('id', wizaRequest.id);
    }

    return NextResponse.json({
      contacts: contacts,
      list_id: listId,
      status: contacts.length > 0 ? 'completed' : 'no_contacts',
    });
  } catch (error) {
    console.error('Error fetching Wiza contacts:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch contacts from Wiza' 
      },
      { status: 500 }
    );
  }
};

