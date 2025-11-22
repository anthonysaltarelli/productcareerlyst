import { createClient } from '@/lib/supabase/server';
import { getUserPlan } from '@/lib/utils/subscription';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { PortfolioTemplateRequestNotification } from '@/app/components/emails/PortfolioTemplateRequestNotification';

const resend = new Resend(process.env.RESEND_API_KEY);

// POST /api/portfolio/template-request - Create a portfolio template request
export const POST = async (request: NextRequest) => {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has Accelerate subscription
    const userPlan = await getUserPlan(user.id);
    if (userPlan !== 'accelerate') {
      return NextResponse.json(
        {
          error: 'Accelerate plan required',
          message: 'Product portfolio template requests are available exclusively for Accelerate plan subscribers.',
          requiresSubscription: true,
          requiresAccelerate: true,
        },
        { status: 403 }
      );
    }

    // Check if user already has a pending request
    const { data: existingRequest, error: checkError } = await supabase
      .from('portfolio_template_requests')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing request:', checkError);
      return NextResponse.json(
        { error: 'Failed to check existing requests' },
        { status: 500 }
      );
    }

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending template request' },
        { status: 400 }
      );
    }

    // Create the request
    const { data: newRequest, error: insertError } = await supabase
      .from('portfolio_template_requests')
      .insert({
        user_id: user.id,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating template request:', insertError);
      return NextResponse.json(
        { error: 'Failed to create template request' },
        { status: 500 }
      );
    }

    // Send email notification to team
    if (user.email && newRequest) {
      try {
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'Product Careerlyst <onboarding@resend.dev>';
        
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: fromEmail,
          to: ['team@productcareerlyst.com'],
          subject: 'New Product Portfolio Template Request',
          react: PortfolioTemplateRequestNotification({
            userEmail: user.email,
            requestDate: newRequest.created_at,
          }),
        });

        if (emailError) {
          console.error('Error sending email notification:', emailError);
          // Don't fail the request if email fails, just log it
        } else {
          console.log('Email notification sent successfully:', emailData);
        }
      } catch (emailErr) {
        console.error('Unexpected error sending email:', emailErr);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json(
      { 
        success: true,
        request: newRequest,
        message: 'Your portfolio template request has been submitted. You will receive it via email within 24-48 hours.'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in template request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// GET /api/portfolio/template-request - Get user's template request status
export const GET = async (request: NextRequest) => {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the most recent request
    const { data: request, error: fetchError } = await supabase
      .from('portfolio_template_requests')
      .select('id, status, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching template request:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch template request' },
        { status: 500 }
      );
    }

    return NextResponse.json({ request });
  } catch (error) {
    console.error('Unexpected error fetching template request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

