import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const POST = async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user already has template access recorded
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('first_template_accessed_at')
      .eq('user_id', user.id)
      .maybeSingle();

    // If already recorded, just return success
    if (existingProfile?.first_template_accessed_at) {
      return NextResponse.json({ success: true, alreadyRecorded: true });
    }

    // Update or insert profile with first_template_accessed_at
    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        first_template_accessed_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('Error tracking template access:', error);
      return NextResponse.json(
        { error: 'Failed to track template access' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking template access:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

