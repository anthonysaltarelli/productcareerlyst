import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWizaListContacts } from '@/lib/utils/wiza';

/**
 * POST /api/jobs/wiza/import-contacts
 * 
 * Import contacts from Wiza into the database
 * 
 * Request body:
 * {
 *   list_id: string;
 *   company_id: string;
 *   application_id?: string;
 *   contact_ids?: string[]; // Optional: specific contacts to import, otherwise imports all
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
    const { list_id, company_id, application_id, contact_ids } = body;

    if (!list_id || !company_id) {
      return NextResponse.json(
        { error: 'list_id and company_id are required' },
        { status: 400 }
      );
    }

    // Verify company exists and user has access
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('id', company_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Get contacts from Wiza
    const contactsResponse = await getWizaListContacts(list_id, 'people');
    const wizaContacts = contactsResponse.contacts || [];

    // Filter to specific contacts if provided
    // Since Wiza doesn't return 'id', we'll match by email or index
    const contactsToImport = contact_ids
      ? wizaContacts.filter((c: any, index: number) => {
          const contactId = c.id || c.email || `contact-${index}`;
          return contact_ids.includes(contactId);
        })
      : wizaContacts;

    if (contactsToImport.length === 0) {
      return NextResponse.json(
        { error: 'No contacts found to import' },
        { status: 404 }
      );
    }

    // Transform Wiza contacts to our contact format
    const contactsToInsert = contactsToImport.map((wizaContact: any) => {
      const fullName = wizaContact.full_name || 
        `${wizaContact.first_name || ''} ${wizaContact.last_name || ''}`.trim() ||
        'Unknown';

      // Extract LinkedIn URL - Wiza returns both 'linkedin' and 'linkedin_profile_url'
      const linkedinUrl = wizaContact.linkedin_profile_url || 
                         wizaContact.linkedin_url || 
                         wizaContact.linkedin || 
                         null;

      // Format date as "Nov 21, 2025"
      const importDate = new Date();
      const formattedDate = importDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      return {
        user_id: user.id,
        company_id: company_id,
        application_id: application_id || null,
        name: fullName,
        title: wizaContact.title || null,
        email: wizaContact.email || null,
        phone: wizaContact.phone || null,
        linkedin_url: linkedinUrl,
        relationship: 'team_member' as const, // Default, user can update later
        notes: `Automatically discovered and imported on ${formattedDate}${wizaContact.email_status === 'risky' ? ' (risky email)' : ''}`,
      };
    });

    // Insert contacts (check for duplicates first to avoid errors)
    // Since there's no unique constraint, we'll insert all and let RLS handle permissions
    const { data: insertedContacts, error: insertError } = await supabase
      .from('contacts')
      .insert(contactsToInsert)
      .select(`
        *,
        company:companies(*)
      `);

    if (insertError) {
      console.error('Error inserting contacts:', insertError);
      return NextResponse.json(
        { error: 'Failed to import contacts' },
        { status: 500 }
      );
    }

    const importedCount = insertedContacts?.length || 0;

    // Update wiza_requests with import count
    const { data: wizaRequest } = await supabase
      .from('wiza_requests')
      .select('id')
      .eq('wiza_list_id', list_id)
      .eq('user_id', user.id)
      .single();
    
    if (wizaRequest) {
      await supabase
        .from('wiza_requests')
        .update({
          contacts_imported: importedCount,
        })
        .eq('id', wizaRequest.id);
    }

    return NextResponse.json({
      imported: importedCount,
      contacts: insertedContacts || [],
    });
  } catch (error) {
    console.error('Error importing contacts:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to import contacts' 
      },
      { status: 500 }
    );
  }
};

