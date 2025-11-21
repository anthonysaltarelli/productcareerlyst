import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWizaListStatus } from '@/lib/utils/wiza';
import { extractWizaStatus, extractWizaStats, prepareStatusUpdate } from '@/lib/utils/wiza-status';

/**
 * GET /api/jobs/wiza/get-list?list_id=<id>
 * 
 * Get list details and status from Wiza
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

    // Get list status from Wiza
    const listData = await getWizaListStatus(listId);

    // Extract status and stats using utility functions
    const wizaStatus = extractWizaStatus(listData);
    const stats = extractWizaStats(listData);

    // Update the database record with the latest status
    const { data: wizaRequest } = await supabase
      .from('wiza_requests')
      .select('id, wiza_status, status')
      .eq('wiza_list_id', listId)
      .eq('user_id', user.id)
      .single();

    if (wizaRequest) {
      // Check if status or stats have changed
      const statusChanged = wizaRequest.wiza_status !== wizaStatus;
      const needsUpdate = statusChanged || wizaStatus === 'finished';

      if (needsUpdate) {
        // Prepare update data using utility function
        const updateData = prepareStatusUpdate(wizaStatus, stats, listData);
        updateData.updated_at = new Date().toISOString();

        // Only update status if it's still processing (don't override completed/no_contacts)
        if (wizaRequest.status !== 'completed' && wizaRequest.status !== 'no_contacts' && wizaRequest.status !== 'failed') {
          // Status will be set by prepareStatusUpdate
        } else {
          // Keep existing status but update wiza_status and stats
          updateData.status = wizaRequest.status;
        }

        await supabase
          .from('wiza_requests')
          .update(updateData)
          .eq('id', wizaRequest.id);
      }
    }

    return NextResponse.json({
      list_id: listId,
      list: listData,
    });
  } catch (error) {
    console.error('Error fetching Wiza list:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch list from Wiza' 
      },
      { status: 500 }
    );
  }
};

