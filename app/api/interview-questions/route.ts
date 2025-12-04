'use server';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('pm_interview_questions')
      .select('*')
      .order('category', { ascending: true })
      .order('question', { ascending: true });

    if (error) {
      console.error('Error fetching PM interview questions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch interview questions' },
        { status: 500 },
      );
    }

    return NextResponse.json({ questions: data ?? [] });
  } catch (error) {
    console.error('Error in interview questions GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}




