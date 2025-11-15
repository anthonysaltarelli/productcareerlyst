import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const supabase = await createClient();
    const { lessonId } = await params;
    const { completed } = await request.json();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if progress record already exists
    const { data: existingProgress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .single();

    if (existingProgress) {
      // Update existing progress
      const { data, error } = await supabase
        .from('user_progress')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          last_watched_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data });
    } else {
      // Create new progress record
      const { data, error } = await supabase
        .from('user_progress')
        .insert({
          user_id: user.id,
          lesson_id: lessonId,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          last_watched_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data });
    }
  } catch (error) {
    console.error('Error updating lesson progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const supabase = await createClient();
    const { lessonId } = await params;

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get progress for this lesson
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" which is ok
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || null });
  } catch (error) {
    console.error('Error fetching lesson progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

