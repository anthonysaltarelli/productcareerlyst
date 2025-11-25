import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { OnboardingProgress } from '@/lib/utils/onboarding';

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

    const { data, error } = await supabase
      .from('onboarding_progress')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching onboarding progress:', error);
      return NextResponse.json(
        { error: 'Failed to fetch onboarding progress' },
        { status: 500 }
      );
    }

    return NextResponse.json({ progress: data || null });
  } catch (error) {
    console.error('Error in GET /api/onboarding/progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

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

    const body = await request.json();
    const {
      current_step,
      completed_steps,
      skipped_steps,
      progress_data,
      is_complete,
    } = body;

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (current_step !== undefined) updateData.current_step = current_step;
    if (completed_steps !== undefined) updateData.completed_steps = completed_steps;
    if (skipped_steps !== undefined) updateData.skipped_steps = skipped_steps;
    if (progress_data !== undefined) {
      // Merge with existing progress_data if it exists
      const { data: existing } = await supabase
        .from('onboarding_progress')
        .select('progress_data')
        .eq('user_id', user.id)
        .maybeSingle();
      
      updateData.progress_data = {
        ...(existing?.progress_data || {}),
        ...progress_data,
      };
    }
    if (is_complete !== undefined) {
      updateData.is_complete = is_complete;
      if (is_complete) {
        updateData.completed_at = new Date().toISOString();
      }
    }

    // Upsert the progress
    const { data, error } = await supabase
      .from('onboarding_progress')
      .upsert({
        user_id: user.id,
        ...updateData,
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating onboarding progress:', error);
      return NextResponse.json(
        { error: 'Failed to update onboarding progress' },
        { status: 500 }
      );
    }

    return NextResponse.json({ progress: data });
  } catch (error) {
    console.error('Error in POST /api/onboarding/progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

export const PATCH = async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { step, stepData } = body;

    if (!step) {
      return NextResponse.json(
        { error: 'Step is required' },
        { status: 400 }
      );
    }

    // Get existing progress
    const { data: existing, error: fetchError } = await supabase
      .from('onboarding_progress')
      .select('progress_data, completed_steps, skipped_steps')
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching existing progress:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch existing progress' },
        { status: 500 }
      );
    }

    const existingProgressData = existing?.progress_data || {};
    const completedSteps = existing?.completed_steps || [];
    const skippedSteps = existing?.skipped_steps || [];

    // Update progress_data for the specific step
    const updatedProgressData = {
      ...existingProgressData,
      [step]: stepData || existingProgressData[step],
    };

    // Update completed_steps if stepData is provided and step is being completed
    let updatedCompletedSteps = [...completedSteps];
    if (stepData && !completedSteps.includes(step)) {
      updatedCompletedSteps.push(step);
    }

    const { data, error } = await supabase
      .from('onboarding_progress')
      .upsert({
        user_id: user.id,
        progress_data: updatedProgressData,
        completed_steps: updatedCompletedSteps,
        skipped_steps: skippedSteps,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating step progress:', error);
      return NextResponse.json(
        { error: 'Failed to update step progress' },
        { status: 500 }
      );
    }

    return NextResponse.json({ progress: data });
  } catch (error) {
    console.error('Error in PATCH /api/onboarding/progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};



