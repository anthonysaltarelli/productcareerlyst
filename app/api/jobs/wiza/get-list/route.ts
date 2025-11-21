import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWizaListStatus } from '@/lib/utils/wiza';

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

    // Log the full response structure to understand actual status values
    console.log('[Wiza API] get-list response structure:', JSON.stringify(listData, null, 2));
    console.log('[Wiza API] listData.status:', listData.status);
    console.log('[Wiza API] listData.data?.status:', (listData as any).data?.status);
    console.log('[Wiza API] Full listData keys:', Object.keys(listData));

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

