import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { checkAdminStatus } from '@/lib/utils/admin';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { NPSEmail } from '@/app/components/emails/NPSEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

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
    const { email, userId } = body;

    // Validate required fields
    if (!email || typeof email !== 'string' || email.trim() === '') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Use service role client to fetch user profile
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

    // Fetch user profile to get first name
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('first_name')
      .eq('user_id', userId)
      .maybeSingle();

    const firstName = profile?.first_name || null;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://productcareerlyst.com';

    // Render the email component
    const emailHtml = await render(
      NPSEmail({
        firstName,
        userId,
        baseUrl,
      })
    );

    // Send email
    const fromEmail = 'Anthony from Product Careerlyst <team@productcareerlyst.com>';
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: email.trim(),
      subject: 'Thank you + one quick question',
      html: emailHtml,
    });

    if (emailError) {
      console.error('Error sending NPS email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send email', details: emailError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'NPS email sent successfully',
      emailId: emailData?.id,
    });
  } catch (error) {
    console.error('Error in NPS email API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

