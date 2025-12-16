import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Fetch user's beta access flags
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('has_ai_video_coach_beta')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching beta access:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch beta access' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      hasAiVideoCoachBeta: profile?.has_ai_video_coach_beta ?? false,
    });
  } catch (error) {
    console.error('Error in beta access API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
