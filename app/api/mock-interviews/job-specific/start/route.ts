import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  GeneratedJobQuestion,
  JobInterviewContext,
  StartJobInterviewResponse,
} from '@/lib/types/job-interview';

// Beyond Presence configuration
const BEYOND_PRESENCE_API_KEY = process.env.BEYOND_PRESENCE_API_KEY;
const BEYOND_PRESENCE_API_URL = 'https://api.bey.dev/v1';
// Avatar ID for job-specific interviews (same as quick question)
const BEYOND_PRESENCE_AVATAR_ID = '694c83e2-8895-4a98-bd16-56332ca3f449';

interface BeyondPresenceAgentResponse {
  id: string;
  name: string;
  avatar_id: string;
  system_prompt: string;
  greeting?: string;
  max_session_length_minutes?: number;
}

interface BeyondPresenceCallResponse {
  id: string;
  agent_id: string;
  started_at: string;
  ended_at: string | null;
  livekit_url: string;
  livekit_token: string;
  tags?: Record<string, string>;
}

/**
 * Build the system prompt for a job-specific interview
 */
function buildJobSpecificSystemPrompt(
  companyName: string,
  jobTitle: string,
  questions: GeneratedJobQuestion[]
): string {
  const questionsList = questions
    .map((q, i) => `${i + 1}. "${q.question}" (${q.category})`)
    .join('\n');

  return `You are a senior product manager conducting an interview for the ${jobTitle} role at ${companyName}. Your name is Nelly and you're a hiring manager with 10+ years of PM experience at top tech companies.

## Your Behavior
1. **Opening**: Greet the candidate warmly, introduce yourself as Nelly from ${companyName}, and explain you'll be conducting a ~20 minute interview to learn more about them and their fit for the role.
2. **Questions**: Ask the questions below one at a time. Wait for complete answers (1-3 minutes each) before moving on.
3. **Follow-ups**: Ask 1-2 natural follow-up questions based on their answers to dig deeper.
4. **Transitions**: Smoothly transition between questions with brief acknowledgments.
5. **Closing**: Thank them warmly and let them know the interview is complete.

## Questions to Ask (in order)
${questionsList}

## Interview Style
- Be professional but friendly - like a real ${companyName} interviewer would be
- Show genuine interest in their answers with brief reactions ("That's interesting...", "I see...")
- Ask clarifying follow-ups when answers are vague or generic
- Keep track of time - aim for ~3 minutes per question including follow-ups
- If they go off-topic, gently redirect back to the question

## Important Rules
- Do NOT evaluate or give feedback during the interview
- Do NOT share that these questions were AI-generated
- Respond as if you actually work at ${companyName} and know the company well
- Reference ${companyName}'s products, values, or culture naturally in follow-ups when relevant
- Keep the conversation flowing naturally - this should feel like a real interview

## Pacing
You have about 20 minutes total. With 5-7 questions, that's roughly 3 minutes per question. Don't rush, but keep things moving.`;
}

/**
 * Build the greeting for a job-specific interview
 */
function buildJobSpecificGreeting(companyName: string, jobTitle: string): string {
  return `Hi there! I'm Nelly, and I'll be your interviewer today for the ${jobTitle} position here at ${companyName}. Thanks so much for taking the time to chat with me. Over the next 20 minutes or so, I'd love to learn more about your background and what makes you excited about this role. Ready to get started?`;
}

/**
 * Helper function to delete a temporary agent
 */
async function deleteAgent(agentId: string): Promise<void> {
  if (!BEYOND_PRESENCE_API_KEY) return;

  try {
    await fetch(`${BEYOND_PRESENCE_API_URL}/agents/${agentId}`, {
      method: 'DELETE',
      headers: {
        'x-api-key': BEYOND_PRESENCE_API_KEY,
      },
    });
  } catch (error) {
    console.error('Error deleting temporary agent:', error);
  }
}

/**
 * POST /api/mock-interviews/job-specific/start
 * Start a job-specific mock interview with Beyond Presence
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

    if (!BEYOND_PRESENCE_API_KEY) {
      console.error('BEYOND_PRESENCE_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Mock interview service is not configured' },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { jobApplicationId, questions } = body;

    if (!jobApplicationId) {
      return NextResponse.json(
        { error: 'jobApplicationId is required' },
        { status: 400 }
      );
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'questions array is required' },
        { status: 400 }
      );
    }

    // Fetch job application with company data
    const { data: application, error: appError } = await supabase
      .from('job_applications')
      .select(`
        id,
        title,
        description,
        company_id,
        company:companies(
          id,
          name,
          description
        )
      `)
      .eq('id', jobApplicationId)
      .eq('user_id', user.id)
      .single();

    if (appError || !application) {
      console.error('Error fetching job application:', appError);
      return NextResponse.json(
        { error: 'Job application not found' },
        { status: 404 }
      );
    }

    // Supabase returns relations as arrays, but with single() it's guaranteed to be a single record or null
    const companyData = application.company as unknown;
    const company = Array.isArray(companyData) ? companyData[0] : companyData as { id: string; name: string; description?: string } | null;
    const companyName = company?.name || 'the company';
    const companyId = company?.id || null;

    // Step 1: Create temporary Bey.dev agent with job-specific prompt
    const agentPayload = {
      name: 'Nelly',
      avatar_id: BEYOND_PRESENCE_AVATAR_ID,
      system_prompt: buildJobSpecificSystemPrompt(
        companyName,
        application.title,
        questions as GeneratedJobQuestion[]
      ),
      greeting: buildJobSpecificGreeting(companyName, application.title),
      max_session_length_minutes: 20,
      language: 'en',
      capabilities: [{ type: 'webcam_vision' }],
    };

    const agentResponse = await fetch(`${BEYOND_PRESENCE_API_URL}/agents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': BEYOND_PRESENCE_API_KEY,
      },
      body: JSON.stringify(agentPayload),
    });

    if (!agentResponse.ok) {
      const errorText = await agentResponse.text();
      console.error('Beyond Presence agent creation error:', agentResponse.status, errorText);
      return NextResponse.json(
        { error: 'Failed to create interview agent' },
        { status: 500 }
      );
    }

    const agentData: BeyondPresenceAgentResponse = await agentResponse.json();
    const temporaryAgentId = agentData.id;

    // Build job context for storage
    const jobContext: JobInterviewContext = {
      companyName,
      companyId: companyId || '',
      jobTitle: application.title,
      jobApplicationId: application.id,
      descriptionSnippet: application.description?.slice(0, 500) || '',
      generatedAt: new Date().toISOString(),
    };

    // Step 2: Create the mock interview record
    const { data: interview, error: insertError } = await supabase
      .from('mock_interviews')
      .insert({
        user_id: user.id,
        status: 'pending',
        started_at: new Date().toISOString(),
        interview_mode: 'job_specific',
        job_application_id: jobApplicationId,
        company_id: companyId,
        bey_agent_id: temporaryAgentId,
        max_duration_minutes: 20,
        generated_questions: questions,
        job_context: jobContext,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating mock interview:', insertError);
      // Clean up the agent we created
      await deleteAgent(temporaryAgentId);
      return NextResponse.json(
        { error: 'Failed to create mock interview session' },
        { status: 500 }
      );
    }

    // Step 3: Create call with the temporary agent
    const callResponse = await fetch(`${BEYOND_PRESENCE_API_URL}/calls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': BEYOND_PRESENCE_API_KEY,
      },
      body: JSON.stringify({
        agent_id: temporaryAgentId,
        livekit_username: user.email?.split('@')[0] || 'User',
        tags: {
          interview_id: interview.id,
          user_id: user.id,
          interview_mode: 'job_specific',
          job_application_id: jobApplicationId,
          company_name: companyName,
        },
      }),
    });

    if (!callResponse.ok) {
      const errorText = await callResponse.text();
      console.error('Beyond Presence call creation error:', callResponse.status, errorText);
      // Clean up
      await supabase.from('mock_interviews').delete().eq('id', interview.id);
      await deleteAgent(temporaryAgentId);
      return NextResponse.json(
        { error: 'Failed to start video interview session' },
        { status: 500 }
      );
    }

    const callData: BeyondPresenceCallResponse = await callResponse.json();

    // Step 4: Update the interview record with the call ID
    const { error: updateError } = await supabase
      .from('mock_interviews')
      .update({
        bey_call_id: callData.id,
        status: 'in_progress',
      })
      .eq('id', interview.id);

    if (updateError) {
      console.error('Error updating mock interview with call ID:', updateError);
      // Don't fail - the interview can still proceed
    }

    const response: StartJobInterviewResponse = {
      success: true,
      interviewId: interview.id,
      callId: callData.id,
      livekitUrl: callData.livekit_url,
      livekitToken: callData.livekit_token,
      jobContext: {
        companyName,
        jobTitle: application.title,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in job-specific interview start API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
