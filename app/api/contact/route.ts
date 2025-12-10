import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { ContactNotification } from '@/app/components/emails/ContactNotification';
import { verifyBotIDRequest } from '@/lib/botid/verify';

const resend = new Resend(process.env.RESEND_API_KEY);

const ADMIN_EMAILS = ['team@productcareerlyst.com'];

// POST /api/contact - Handle contact form submission
export const POST = async (request: NextRequest) => {
  try {
    // Verify BotID first
    const { verified, error } = await verifyBotIDRequest();
    if (!verified) {
      return NextResponse.json(
        { error: error || 'Request verification failed. Please try again.' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    
    // Try to get user (may be null for unauthenticated users)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    const isAuthenticated = !authError && !!user;

    // Parse request body
    const body = await request.json();
    const { firstName, lastName, email, message } = body;

    // Validate required fields
    if (!firstName || typeof firstName !== 'string' || firstName.trim() === '') {
      return NextResponse.json(
        { error: 'First name is required' },
        { status: 400 }
      );
    }

    if (!lastName || typeof lastName !== 'string' || lastName.trim() === '') {
      return NextResponse.json(
        { error: 'Last name is required' },
        { status: 400 }
      );
    }

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

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Create the contact submission
    const { data: newSubmission, error: insertError } = await supabase
      .from('contact_submissions')
      .insert({
        user_id: user?.id || null,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        message: message.trim(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating contact submission:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit contact form' },
        { status: 500 }
      );
    }

    // Send email notification to team (fire-and-forget)
    sendEmailNotification({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      message: message.trim(),
      submissionDate: newSubmission.created_at,
      userId: user?.id || null,
      isAuthenticated,
    }).catch(error => {
      console.error('Failed to send email notification:', error);
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Thank you for contacting us! We will get back to you soon.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in contact submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// Helper function to send email notification (non-blocking)
const sendEmailNotification = async (params: {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
  submissionDate: string;
  userId: string | null;
  isAuthenticated: boolean;
}) => {
  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Product Careerlyst <onboarding@resend.dev>';
    
    // Render the React email component to HTML
    const emailHtml = await render(
      ContactNotification({
        firstName: params.firstName,
        lastName: params.lastName,
        email: params.email,
        message: params.message,
        submissionDate: params.submissionDate,
        userId: params.userId,
        isAuthenticated: params.isAuthenticated,
      })
    );
    
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: ADMIN_EMAILS,
      subject: `New Contact Form Submission from ${params.firstName} ${params.lastName}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error('Error sending email notification:', emailError);
    } else {
      console.log('Email notification sent successfully:', emailData);
    }
  } catch (emailErr) {
    console.error('Unexpected error sending email:', emailErr);
  }
};

