import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAdminStatus } from '@/lib/utils/admin';
import { getTemplate, renderTemplate } from '@/lib/email/templates';

/**
 * POST /api/email/templates/preview
 * Preview a template with sample data (admin only)
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { templateId, variables = {}, unsubscribeUrl } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: 'templateId is required' },
        { status: 400 }
      );
    }

    // Get template
    const template = await getTemplate(templateId);
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Render template
    const html = await renderTemplate(
      template,
      variables,
      unsubscribeUrl || `https://productcareerlyst.com/unsubscribe/preview-token`
    );

    return NextResponse.json({
      success: true,
      html,
    });
  } catch (error) {
    console.error('Error previewing template:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

