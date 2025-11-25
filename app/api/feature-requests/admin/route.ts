import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Helper function to get admin user IDs from environment variable
// Supports comma-separated list: ADMIN_USER_IDS=uuid1,uuid2,uuid3
const getAdminUserIds = (): string[] => {
  const adminIds = process.env.ADMIN_USER_IDS || process.env.ADMIN_USER_ID || '';
  return adminIds.split(',').map(id => id.trim()).filter(Boolean);
};

// GET /api/feature-requests/admin - List ALL feature requests (including archived) for admins
export const GET = async () => {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const adminUserIds = getAdminUserIds();
    const isAdmin = adminUserIds.includes(user.id);
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get ALL feature requests (including archived)
    const { data: featureRequests, error: fetchError } = await supabase
      .from('feature_requests')
      .select(`
        id,
        user_id,
        title,
        description,
        status,
        is_archived,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching feature requests:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch feature requests' },
        { status: 500 }
      );
    }

    // Get vote counts for each feature request
    const featureRequestIds = featureRequests?.map(fr => fr.id) || [];
    
    const { data: votes, error: votesError } = await supabase
      .from('feature_request_votes')
      .select('feature_request_id, user_id')
      .in('feature_request_id', featureRequestIds);

    if (votesError) {
      console.error('Error fetching votes:', votesError);
    }

    // Get profiles for feature request authors
    const userIds = [...new Set(featureRequests?.map(fr => fr.user_id) || [])];
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name')
      .in('user_id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    // Get user emails from auth (for admin view)
    // Note: We can't directly query auth.users, so we'll use the profiles as primary source

    // Build profile map
    const profileMap = new Map(
      profiles?.map(p => [p.user_id, { first_name: p.first_name, last_name: p.last_name }]) || []
    );

    // Count votes
    const voteCountMap = new Map<string, number>();
    const userVoteMap = new Map<string, boolean>();

    votes?.forEach(vote => {
      const currentCount = voteCountMap.get(vote.feature_request_id) || 0;
      voteCountMap.set(vote.feature_request_id, currentCount + 1);
      
      if (vote.user_id === user.id) {
        userVoteMap.set(vote.feature_request_id, true);
      }
    });

    // Combine data
    const enrichedRequests = featureRequests?.map(fr => ({
      ...fr,
      vote_count: voteCountMap.get(fr.id) || 0,
      user_has_voted: userVoteMap.get(fr.id) || false,
      author: profileMap.get(fr.user_id) || { first_name: null, last_name: null },
      is_own_request: fr.user_id === user.id,
    })) || [];

    return NextResponse.json({
      success: true,
      feature_requests: enrichedRequests,
      is_admin: true,
    });
  } catch (error) {
    console.error('Unexpected error fetching feature requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

