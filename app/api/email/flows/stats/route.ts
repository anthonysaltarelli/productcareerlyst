import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAdminStatus } from '@/lib/utils/admin';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

/**
 * GET /api/email/flows/stats
 * Get statistics for all flows (active instances, scheduled emails, etc.)
 */
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

    // Get all flows
    const { data: flows, error: flowsError } = await supabaseAdmin
      .from('email_flows')
      .select('id, name')
      .eq('is_active', true);

    if (flowsError) {
      throw new Error(`Failed to fetch flows: ${flowsError.message}`);
    }

    if (!flows || flows.length === 0) {
      return NextResponse.json({ flowStats: [] });
    }

    const flowIds = flows.map(f => f.id);

    // Get statistics for each flow
    const statsPromises = flowIds.map(async (flowId) => {
      // Get scheduled emails for this flow
      const { data: scheduledEmails, error: emailsError } = await supabaseAdmin
        .from('scheduled_emails')
        .select('id, status, flow_trigger_id, triggered_at, scheduled_at, sent_at, is_test, user_id, email_address')
        .eq('flow_id', flowId);

      if (emailsError) {
        console.error(`Error fetching emails for flow ${flowId}:`, emailsError);
        return {
          flowId,
          totalEmails: 0,
          pending: 0,
          scheduled: 0,
          sent: 0,
          cancelled: 0,
          failed: 0,
          activeInstances: 0,
          uniqueUsers: 0,
          testEmails: 0,
          productionEmails: 0,
        };
      }

      const emails = scheduledEmails || [];
      
      // Count by status
      const statusCounts = emails.reduce((acc, email) => {
        acc[email.status] = (acc[email.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Count active instances (unique flow_trigger_id with pending/scheduled emails)
      const activeTriggerIds = new Set(
        emails
          .filter(e => e.status === 'pending' || e.status === 'scheduled')
          .map(e => e.flow_trigger_id)
          .filter(Boolean)
      );

      // Count unique users
      const uniqueUsers = new Set(
        emails
          .map(e => e.user_id || e.email_address)
          .filter(Boolean)
      );

      // Count test vs production
      const testEmails = emails.filter(e => e.is_test).length;
      const productionEmails = emails.filter(e => !e.is_test).length;

      return {
        flowId,
        totalEmails: emails.length,
        pending: statusCounts.pending || 0,
        scheduled: statusCounts.scheduled || 0,
        sent: statusCounts.sent || 0,
        cancelled: statusCounts.cancelled || 0,
        failed: statusCounts.failed || 0,
        activeInstances: activeTriggerIds.size,
        uniqueUsers: uniqueUsers.size,
        testEmails,
        productionEmails,
      };
    });

    const flowStats = await Promise.all(statsPromises);

    // Map stats to flow IDs for easy lookup
    const statsMap = flowStats.reduce((acc, stat) => {
      acc[stat.flowId] = stat;
      return acc;
    }, {} as Record<string, typeof flowStats[0]>);

    return NextResponse.json({ flowStats: statsMap });
  } catch (error) {
    console.error('Error fetching flow stats:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch flow stats';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

