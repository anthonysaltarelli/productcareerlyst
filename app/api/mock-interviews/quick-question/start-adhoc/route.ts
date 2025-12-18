import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Beyond Presence configuration
const BEYOND_PRESENCE_API_KEY = process.env.BEYOND_PRESENCE_API_KEY;
const BEYOND_PRESENCE_API_URL = 'https://api.bey.dev/v1';
// Avatar ID for quick question practice
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

interface AdHocQuestion {
  question: string;
  category: string;
  source?: {
    type: 'job_specific';
    companyName: string;
    jobTitle: string;
  };
}

/**
 * Get category-specific follow-up questions
 */
function getCategoryFollowUps(category: string): string {
  switch (category) {
    case 'Behavioral':
      return `   - "Can you tell me more about [specific part they mentioned]?"
   - "What metrics did you use to measure success?"
   - "How did that decision impact the team or product?"
   - "What would you do differently if you could do it again?"`;
    case 'Product Sense':
      return `   - "How did you identify those user segments?"
   - "What other solutions did you consider?"
   - "How would you prioritize those features?"
   - "How would you measure success for this product?"`;
    case 'Technical':
      return `   - "What trade-offs did you consider with that approach?"
   - "How would this scale as usage grows?"
   - "What metrics would you track to monitor this?"
   - "How would you work with engineering to implement this?"`;
    case 'Strategy':
      return `   - "What's the competitive landscape look like?"
   - "How does this align with the company's overall strategy?"
   - "What are the key risks with this approach?"
   - "What would make you change this strategy?"`;
    case 'Product Execution':
      return `   - "How would you break this down into phases?"
   - "Who are the key stakeholders you'd align with?"
   - "What are the biggest risks and how would you mitigate them?"
   - "How would you know if this is successful?"`;
    case 'Analytical':
      return `   - "Walk me through how you got to that estimate."
   - "What assumptions are you making?"
   - "How would you validate this hypothesis?"
   - "What data would you need to make this decision?"`;
    case 'Leadership':
      return `   - "How did you get buy-in from the team?"
   - "How did you handle disagreements?"
   - "What would you do differently next time?"
   - "How did you measure the team's success?"`;
    case 'Culture Fit':
      return `   - "Can you give me a specific example?"
   - "What did you learn from that experience?"
   - "How do you typically handle [related scenario]?"
   - "What's most important to you in a work environment?"`;
    case 'Industry Knowledge':
      return `   - "What trends do you see shaping this industry?"
   - "Who are the key players and what differentiates them?"
   - "What regulatory considerations are important here?"
   - "How do customers typically evaluate solutions in this space?"`;
    // Job-specific interview categories
    case 'company':
      return `   - "What specifically about this company's mission resonates with you?"
   - "How does this align with your career goals?"
   - "What do you know about this company's culture and values?"
   - "How would you contribute to the company's success?"`;
    case 'role':
      return `   - "What in your background makes you a good fit for this specific role?"
   - "How does this role align with your career trajectory?"
   - "What challenges do you anticipate in this position?"
   - "What would success look like for you in this role after 6 months?"`;
    case 'industry':
      return `   - "What trends do you see shaping this industry?"
   - "Who are the key competitors and how do they differentiate?"
   - "What regulatory or market challenges should we be aware of?"
   - "How do you stay current with industry developments?"`;
    // Handle lowercase variants from job-specific interviews
    case 'behavioral':
      return `   - "Can you tell me more about [specific part they mentioned]?"
   - "What metrics did you use to measure success?"
   - "How did that decision impact the team or product?"
   - "What would you do differently if you could do it again?"`;
    case 'product_sense':
      return `   - "How did you identify those user segments?"
   - "What other solutions did you consider?"
   - "How would you prioritize those features?"
   - "How would you measure success for this product?"`;
    default:
      return `   - "Can you tell me more about that?"
   - "What was the outcome?"
   - "What would you do differently?"
   - "How did you measure success?"`;
  }
}

/**
 * Get category-specific description for system prompt
 */
function getCategoryDescription(category: string): string {
  switch (category) {
    case 'Behavioral':
      return 'a behavioral interview question about their past experiences';
    case 'Product Sense':
      return 'a product sense question to evaluate their product thinking';
    case 'Technical':
      return 'a technical question to evaluate their technical acumen';
    case 'Strategy':
      return 'a strategy question to evaluate their strategic thinking';
    case 'Product Execution':
      return 'an execution question to evaluate their ability to ship products';
    case 'Analytical':
      return 'an analytical question to evaluate their problem-solving skills';
    case 'Leadership':
      return 'a leadership question to evaluate their leadership abilities';
    case 'Culture Fit':
      return 'a culture fit question to understand how they work';
    case 'Industry Knowledge':
      return 'an industry knowledge question to evaluate their domain expertise';
    // Job-specific interview categories
    case 'company':
      return 'a company-specific question about your interest and fit';
    case 'role':
      return 'a role-specific question about your qualifications and experience';
    case 'industry':
      return 'an industry knowledge question about market dynamics';
    // Handle lowercase variants from job-specific interviews
    case 'behavioral':
      return 'a behavioral interview question about their past experiences';
    case 'product_sense':
      return 'a product sense question to evaluate their product thinking';
    default:
      return 'a PM interview question';
  }
}

/**
 * Get simple category description for greeting (user-facing)
 */
function getGreetingDescription(category: string): string {
  switch (category) {
    case 'Behavioral':
      return 'a behavioral question';
    case 'Product Sense':
      return 'a product sense question';
    case 'Technical':
      return 'a technical question';
    case 'Strategy':
      return 'a strategy question';
    case 'Product Execution':
      return 'a product execution question';
    case 'Analytical':
      return 'an analytical question';
    case 'Leadership':
      return 'a leadership question';
    case 'Culture Fit':
      return 'a culture fit question';
    case 'Industry Knowledge':
      return 'an industry knowledge question';
    // Job-specific interview categories
    case 'company':
      return 'a company-specific question';
    case 'role':
      return 'a role-specific question';
    case 'industry':
      return 'an industry question';
    // Handle lowercase variants from job-specific interviews
    case 'behavioral':
      return 'a behavioral question';
    case 'product_sense':
      return 'a product sense question';
    default:
      return 'a PM interview question';
  }
}

/**
 * Build the system prompt for a quick question interview
 */
function buildQuickQuestionSystemPrompt(question: AdHocQuestion): string {
  const followUps = getCategoryFollowUps(question.category);
  const categoryDesc = getCategoryDescription(question.category);

  return `You are a product management career coach conducting a focused mock interview practice session. Your role is to help the candidate practice answering ${categoryDesc}.

## Your Behavior
1. **Opening**: Greet them briefly, then ask the question clearly
2. **Active Listening**: Let them answer fully without interruption (1-3 minutes)
3. **Follow-up**: Ask 1-2 clarifying follow-up questions based on their answer, such as:
${followUps}
4. **Closing**: Thank them for their answer and let them know the session is complete

## The Question
Category: ${question.category}
Question: "${question.question}"

## Guidelines
- Be encouraging but professional
- Don't provide feedback during the session
- Keep the session focused on this one question
- If they go off-topic, gently redirect back to the question
- Total session should be under 5 minutes

## Important
- Do NOT evaluate their answer during the call
- Do NOT give tips or coaching during the call
- Simply listen, ask follow-ups, and conclude the session`;
}

/**
 * Build the greeting for a quick question interview
 */
function buildQuickQuestionGreeting(question: AdHocQuestion): string {
  const greetingDesc = getGreetingDescription(question.category);
  return `Hi! My name is Nelly. Thanks for practicing with me today. I'm going to ask you ${greetingDesc}, and I'd like you to answer it as if you were in a real interview. Here's your question: "${question.question}"`;
}

/**
 * POST /api/mock-interviews/quick-question/start-adhoc
 * Create a quick question practice session with an ad-hoc question (not from question bank)
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
    const { question, category, source } = body as AdHocQuestion;

    if (!question || !category) {
      return NextResponse.json(
        { error: 'question and category are required' },
        { status: 400 }
      );
    }

    const adhocQuestion: AdHocQuestion = {
      question,
      category,
      source,
    };

    // Step 1: Create temporary Bey.dev agent
    const agentPayload = {
      name: 'Nelly',
      avatar_id: BEYOND_PRESENCE_AVATAR_ID,
      system_prompt: buildQuickQuestionSystemPrompt(adhocQuestion),
      greeting: buildQuickQuestionGreeting(adhocQuestion),
      max_session_length_minutes: 5,
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

    // Step 2: Create the mock interview record with ad-hoc question
    const { data: interview, error: insertError } = await supabase
      .from('mock_interviews')
      .insert({
        user_id: user.id,
        status: 'pending',
        started_at: new Date().toISOString(),
        interview_mode: 'quick_question',
        adhoc_question: adhocQuestion,
        bey_agent_id: temporaryAgentId,
        max_duration_minutes: 5,
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
          interview_mode: 'quick_question',
          adhoc: 'true',
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

    return NextResponse.json({
      success: true,
      interviewId: interview.id,
      callId: callData.id,
      livekitUrl: callData.livekit_url,
      livekitToken: callData.livekit_token,
      question: {
        question: adhocQuestion.question,
        category: adhocQuestion.category,
      },
    });
  } catch (error) {
    console.error('Error in ad-hoc quick question start API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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
