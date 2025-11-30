import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  markBaselineActionsComplete,
  type BaselineTrigger,
} from '@/lib/utils/baseline-actions';
import { incrementWeeklyGoalProgress } from '@/lib/utils/weekly-goals';

// Valid interview types matching the job application center
const VALID_INTERVIEW_TYPES = [
  'recruiter_screen',
  'hiring_manager_screen',
  'product_sense',
  'product_analytics_execution',
  'system_design',
  'technical',
  'product_strategy',
  'estimation',
  'executive',
  'cross_functional',
] as const;

type InterviewType = (typeof VALID_INTERVIEW_TYPES)[number];

// Map interview types to baseline action triggers
const INTERVIEW_TYPE_TO_TRIGGER: Record<InterviewType, BaselineTrigger> = {
  recruiter_screen: 'recruiter_screen_prep_completed',
  hiring_manager_screen: 'hiring_manager_prep_completed',
  product_sense: 'product_sense_prep_completed',
  product_analytics_execution: 'analytics_prep_completed',
  system_design: 'system_design_prep_completed',
  technical: 'technical_prep_completed',
  product_strategy: 'strategy_prep_completed',
  estimation: 'estimation_prep_completed',
  executive: 'executive_prep_completed',
  cross_functional: 'cross_functional_prep_completed',
};

interface CreatePracticeInterviewRequest {
  interview_type: string;
  completed_at?: string;
}

/**
 * GET /api/practice-interviews
 * Fetch all practice interviews for the current user
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: interviews, error } = await supabase
      .from('user_practice_interviews')
      .select('*')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching practice interviews:', error);
      return NextResponse.json(
        { error: 'Failed to fetch practice interviews' },
        { status: 500 }
      );
    }

    // Calculate stats by interview type
    const stats: Record<string, number> = {};
    for (const interview of interviews || []) {
      stats[interview.interview_type] = (stats[interview.interview_type] || 0) + 1;
    }

    return NextResponse.json({
      interviews: interviews || [],
      stats,
      total: interviews?.length || 0,
    });
  } catch (error) {
    console.error('Error in practice interviews GET API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/practice-interviews
 * Log a new practice interview
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as CreatePracticeInterviewRequest;
    const { interview_type, completed_at } = body;

    if (!interview_type) {
      return NextResponse.json({ error: 'Interview type is required' }, { status: 400 });
    }

    // Validate interview type
    if (!VALID_INTERVIEW_TYPES.includes(interview_type as InterviewType)) {
      return NextResponse.json(
        { error: `Invalid interview type: ${interview_type}` },
        { status: 400 }
      );
    }

    // Insert the practice interview
    const { data: interview, error } = await supabase
      .from('user_practice_interviews')
      .insert({
        user_id: user.id,
        interview_type,
        completed_at: completed_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating practice interview:', error);
      return NextResponse.json(
        { error: 'Failed to create practice interview' },
        { status: 500 }
      );
    }

    // Trigger the corresponding baseline action
    const trigger = INTERVIEW_TYPE_TO_TRIGGER[interview_type as InterviewType];
    if (trigger) {
      await markBaselineActionsComplete(user.id, trigger);
    }

    // Increment weekly interview practice goal
    await incrementWeeklyGoalProgress(user.id, 'interview_practice_completed');

    return NextResponse.json({
      success: true,
      interview,
    });
  } catch (error) {
    console.error('Error in practice interviews POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/practice-interviews
 * Delete a practice interview by ID
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Interview ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_practice_interviews')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting practice interview:', error);
      return NextResponse.json(
        { error: 'Failed to delete practice interview' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in practice interviews DELETE API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
