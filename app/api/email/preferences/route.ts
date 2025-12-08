import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getUserEmailPreferences,
  updateEmailPreferences,
} from '@/lib/email/preferences';

/**
 * GET /api/email/preferences
 * Get user's email preferences (authenticated)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!user.email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    const preferences = await getUserEmailPreferences(user.id, user.email);

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('Error getting email preferences:', error);
    return NextResponse.json(
      { error: 'Failed to get email preferences' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/email/preferences
 * Update user's email preferences (authenticated)
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!user.email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { marketing_emails_enabled, unsubscribe_reason } = body;

    // Validate input
    if (marketing_emails_enabled !== undefined && typeof marketing_emails_enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'marketing_emails_enabled must be a boolean' },
        { status: 400 }
      );
    }

    const updated = await updateEmailPreferences(
      user.id,
      user.email,
      {
        marketing_emails_enabled,
        unsubscribe_reason,
      }
    );

    return NextResponse.json({
      success: true,
      preferences: updated,
    });
  } catch (error) {
    console.error('Error updating email preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update email preferences' },
      { status: 500 }
    );
  }
}

