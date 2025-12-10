import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAdminStatus } from '@/lib/utils/admin';
import { getFlowById, getFlowSteps } from '@/lib/email/flows';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

/**
 * GET /api/email/flows/:id
 * Get flow details with steps (including template information)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: flowId } = await params;
    const flow = await getFlowById(flowId);

    if (!flow) {
      return NextResponse.json(
        { error: 'Flow not found' },
        { status: 404 }
      );
    }

    const steps = await getFlowSteps(flowId);

    // Fetch template information for each step
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

    const stepsWithTemplates = await Promise.all(
      steps.map(async (step) => {
        const { data: template } = await supabaseAdmin
          .from('email_templates')
          .select('name, subject')
          .eq('id', step.template_id)
          .eq('version', step.template_version)
          .maybeSingle();

        return {
          ...step,
          template_name: template?.name || 'Unknown',
          template_subject: template?.subject || 'No subject',
        };
      })
    );

    return NextResponse.json({
      flow,
      steps: stepsWithTemplates,
    });
  } catch (error) {
    console.error('Error fetching flow:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch flow';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

