import { NextRequest, NextResponse } from 'next/server';
import { createAndAddSubscriberToForm } from '@/lib/utils/convertkit';

const NEWSLETTER_FORM_ID = 7348426;

export async function POST(request: NextRequest) {
  try {
    const { email, firstName } = await request.json();

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Create subscriber and add to ConvertKit form
    const result = await createAndAddSubscriberToForm(
      NEWSLETTER_FORM_ID,
      email.toLowerCase().trim(),
      firstName?.trim() || undefined
    );

    if (result.success) {
      console.log(`[Newsletter] Successfully subscribed ${email} to form ${NEWSLETTER_FORM_ID}`);
      return NextResponse.json({
        success: true,
        message: 'Successfully subscribed to newsletter',
      });
    } else {
      // Check if it's a "already subscribed" type error
      if (result.error?.includes('already') || result.error?.includes('exists')) {
        return NextResponse.json({
          success: true,
          message: "You're already subscribed! Check your inbox.",
        });
      }
      
      console.error('[Newsletter] Subscription error:', result.error);
      return NextResponse.json(
        { error: 'Failed to subscribe. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Newsletter] Subscription error:', error);
    
    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again.' },
      { status: 500 }
    );
  }
}

