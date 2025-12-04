import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { checkAdminStatus } from '@/lib/utils/admin';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin status
    const isAdmin = await checkAdminStatus(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Use service role client for admin operations
    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get all users (no filtering - show all including test accounts)
    const { data: allUsersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000, // Get more users for NPS page
    });

    if (listError) {
      console.error('Error fetching users:', listError);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    const allUsers = allUsersData?.users || [];

    // Sort by created_at descending (most recent first)
    allUsers.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    // Get user IDs
    const userIds = allUsers.map((u) => u.id);

    // If no users, return empty array
    if (userIds.length === 0) {
      return NextResponse.json({ users: [] });
    }

    // Fetch profiles and subscriptions in parallel
    const [
      { data: profiles },
      { data: subscriptions },
    ] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds),
      supabaseAdmin
        .from('subscriptions')
        .select('user_id, plan, status')
        .in('user_id', userIds)
        .order('created_at', { ascending: false }),
    ]);

    // Create lookup maps
    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
    const subscriptionMap = new Map();
    (subscriptions || []).forEach((sub) => {
      if (!subscriptionMap.has(sub.user_id)) {
        subscriptionMap.set(sub.user_id, sub);
      }
    });

    // Combine data
    const usersWithData = allUsers.map((user) => {
      const profile = profileMap.get(user.id);
      const subscription = subscriptionMap.get(user.id);

      return {
        id: user.id,
        email: user.email || '',
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at,
        firstName: profile?.first_name || null,
        lastName: profile?.last_name || null,
        subscriptionPlan: subscription?.plan || null,
        subscriptionStatus: subscription?.status || null,
      };
    });

    return NextResponse.json({ users: usersWithData });
  } catch (error) {
    console.error('Error in admin NPS users API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

