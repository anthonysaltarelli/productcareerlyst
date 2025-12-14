import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { BEHAVIORAL_SKILLS } from '@/lib/types/interview-evaluation';

// JSON Schema for structured output
const INTERVIEW_EVALUATION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    skills: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          skillName: { type: 'string' },
          score: {
            type: 'number',
            enum: [1, 1.5, 2, 2.5, 3, 3.5, 4],
          },
          explanation: { type: 'string' },
          supportingQuotes: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['skillName', 'score', 'explanation', 'supportingQuotes'],
      },
      minItems: 12,
      maxItems: 12,
    },
    overallVerdict: {
      type: 'string',
      enum: ['Strong No Hire', 'No Hire', 'Hire', 'Strong Hire'],
    },
    overallExplanation: { type: 'string' },
    recommendedImprovements: {
      type: 'array',
      items: { type: 'string' },
      minItems: 3,
      maxItems: 7,
    },
  },
  required: ['skills', 'overallVerdict', 'overallExplanation', 'recommendedImprovements'],
};

// Build the comprehensive evaluation prompt
const createEvaluationPrompt = (transcript: { sender: string; message: string }[]) => {
  const transcriptText = transcript
    .map((msg) => `[${msg.sender.toUpperCase()}]: ${msg.message}`)
    .join('\n\n');

  return `You are a critical, nuanced, and action-oriented product management career coach evaluating a mock behavioral interview performance.

## Your Role
You are evaluating this candidate as if you were a senior PM interviewer at a top tech company. Be honest, constructive, and calibrated. Your feedback should help the candidate improve for real interviews.

## N+STAR+TL Framework

This is an elevated version of the traditional STAR method, optimized for product management interviews. The best PM candidates naturally structure their answers this way:

**N - Nugget**: The summary or punchline of the story. A quick, one-sentence overview that hooks the interviewer's attention and sets expectations for what's to come.

**S - Situation**: The context or circumstances of the story. Provides enough detail for the interviewer to understand what was going on, but remains concise. Sets the stage without over-explaining.

**T - Task**: The candidate's specific role or responsibility in the situation. What were they expected to accomplish? This clarifies ownership and scope.

**A - Action**: The specific actions the candidate took to address the task or problem. Must be specific and focus on what THEY did (not the team or manager). This is where individual contribution shines.

**R - Result**: The outcomes of the actions taken. Should be quantified with concrete numbers, percentages, or metrics whenever possible. Connects actions directly to business/user impact.

**T - Takeaway**: What the candidate learned or what insights they gained from the situation. Demonstrates self-awareness and a reflective mindset.

**L - Learning**: How they applied (or plan to apply) what they learned to future tasks or challenges. Shows growth mindset, adaptability, and continuous improvement.

**Why N+STAR+TL is effective**: It forces candidates to be concise (Nugget), provide context without rambling (Situation/Task), demonstrate ownership (Action), prove impact (Result), and show they're constantly learning and improving (Takeaway/Learning).

## Scoring Scale

**Per-Skill Scores** (1-4, half points like 2.5 or 3.5 allowed):
- **4 - Very Strong**: Candidate demonstrated exceptional experience with this skill
- **3 - Strong**: Candidate demonstrated decent experience with this skill
- **2 - Weak**: Candidate demonstrated sub-par experience with this skill
- **1 - Very Weak**: Candidate demonstrated a complete lack of this skill

**Overall Verdicts**:
- **Strong Hire**: One of the strongest candidates I've seen, we need them
- **Hire**: I think this candidate would have an impact on our team
- **No Hire**: I am not confident this candidate will have a positive impact
- **Strong No Hire**: I am confident this candidate will not perform well

## Skills to Evaluate (12 Total)

You MUST evaluate ALL 12 skills in the exact order below. For EACH skill, provide:
1. A score (1-4, half points allowed)
2. A detailed explanation of why you gave that score
3. 1-3 direct quotes from the candidate that support your assessment

### 1. Story Structure & Clarity
- **4**: Presents a clear, concise, and well-structured story (context → problem → actions → outcome → reflection). Easy to follow with no unnecessary detail.
- **3**: Story is mostly structured and understandable, but may include minor tangents or missing transitions.
- **2**: Story lacks clear structure. Important context or outcomes are unclear or jumbled.
- **1**: Unable to tell a coherent story. Rambling, confusing, or missing critical elements.

### 2. Ownership & Accountability
- **4**: Demonstrates clear personal ownership. Explicitly distinguishes their role from others and takes responsibility for both successes and failures.
- **3**: Shows ownership but occasionally blurs individual contribution with team outcomes.
- **2**: Over-credits the team or external factors. Personal impact is unclear.
- **1**: Avoids responsibility entirely or claims undue credit without evidence.

### 3. Decision-Making & Judgment
- **4**: Explains why decisions were made, including alternatives considered. Shows strong judgment under ambiguity or pressure.
- **3**: Explains decisions reasonably well, but with limited discussion of alternatives or tradeoffs.
- **2**: Decisions appear reactive or poorly reasoned. Limited explanation of rationale.
- **1**: Unable to explain decision-making process or shows consistently poor judgment.

### 4. Impact & Results Orientation
- **4**: Clearly articulates measurable outcomes (metrics, user impact, business results). Connects actions directly to outcomes.
- **3**: Describes outcomes, but impact may be partially qualitative or loosely tied to actions.
- **2**: Mentions results superficially or focuses on effort rather than impact.
- **1**: No clear outcomes or impact described.

### 5. Learning & Self-Reflection
- **4**: Demonstrates deep self-awareness. Clearly articulates lessons learned and how behavior changed as a result.
- **3**: Identifies lessons learned but reflection lacks depth or specificity.
- **2**: Acknowledges learning at a surface level without clear application.
- **1**: Shows no reflection or claims they would not change anything.

### 6. Handling Conflict & Stakeholder Management
- **4**: Navigates conflict thoughtfully. Demonstrates empathy, influence without authority, and effective stakeholder alignment.
- **3**: Handles conflict competently but may rely on escalation or authority.
- **2**: Struggles with conflict or avoids addressing it directly.
- **1**: Escalates unnecessarily, creates conflict, or avoids it entirely.

### 7. Bias for Action & Ownership Under Ambiguity
- **4**: Proactively identifies problems and takes initiative despite incomplete information. Comfortable making decisions under uncertainty.
- **3**: Takes action once direction is clear. Some hesitation in ambiguous situations.
- **2**: Requires significant guidance or validation before acting.
- **1**: Avoids action or waits indefinitely for direction.

### 8. Cross-Functional Collaboration
- **4**: Effectively partners across engineering, design, data, and business. Builds trust and drives alignment.
- **3**: Collaborates well but may struggle in more complex or contentious situations.
- **2**: Limited collaboration or unclear interaction with cross-functional partners.
- **1**: Demonstrates poor collaboration or adversarial behavior.

### 9. Communication & Executive Presence
- **4**: Communicates confidently, succinctly, and credibly. Adjusts depth and framing based on audience.
- **3**: Communicates clearly but may over- or under-explain at times.
- **2**: Communication is inconsistent, overly verbose, or lacking confidence.
- **1**: Poor communication; difficult to follow or disengaging.

### 10. Values, Integrity & Professional Maturity
- **4**: Demonstrates strong ethical judgment, humility, and respect for others. Aligns actions with company and product values.
- **3**: Generally professional and values-driven, with minor gaps.
- **2**: Occasional signs of misaligned priorities or questionable judgment.
- **1**: Demonstrates poor integrity, blame-shifting, or unprofessional behavior.

### 11. Adaptability & Resilience
- **4**: Responds constructively to failure, change, or feedback. Demonstrates resilience and growth mindset.
- **3**: Adapts to change but may take time to recalibrate.
- **2**: Struggles with change or feedback.
- **1**: Resistant to feedback or unable to adapt.

### 12. Product Mindset (Behavioral Signal)
- **4**: Consistently frames experiences through user value, business impact, and long-term product thinking—even in behavioral examples.
- **3**: Occasionally ties experiences back to product principles.
- **2**: Focuses mostly on execution or process without product framing.
- **1**: No evidence of product thinking in examples.

## Interview Transcript to Evaluate

${transcriptText}

## Instructions

1. Evaluate each of the 12 skills in the exact order listed above
2. For each skill, provide:
   - The skill name (exactly as written above)
   - A score from 1-4 (half points allowed: 1.5, 2.5, 3.5)
   - A detailed explanation referencing specific parts of the interview
   - 1-3 direct quotes from the candidate (the USER messages) that support your assessment
3. Provide an overall verdict (Strong No Hire, No Hire, Hire, or Strong Hire)
4. Write a comprehensive overall explanation (2-3 paragraphs) summarizing the candidate's performance
5. List 3-7 specific, actionable improvements the candidate should work on

Be rigorous but fair. Ground all feedback in specific evidence from the transcript.`;
};

// POST /api/mock-interviews/[id]/evaluate - Generate AI evaluation of interview
export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch the interview
    const { data: interview, error: fetchError } = await supabase
      .from('mock_interviews')
      .select('id, user_id, transcript, ai_evaluation')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    // Check for transcript
    if (!interview.transcript || interview.transcript.length === 0) {
      return NextResponse.json(
        { error: 'No transcript available. Please wait for the transcript to be processed.' },
        { status: 400 }
      );
    }

    // Check for OpenAI API key
    const openAIApiKey = process.env.OPEN_AI_SECRET_KEY;
    if (!openAIApiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // Create prompt
    const prompt = createEvaluationPrompt(interview.transcript);

    // Step 1: Call OpenAI Responses API with structured output
    const requestPayload = {
      model: 'gpt-5.1',
      input: [
        {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: prompt,
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'interview_evaluation',
          schema: INTERVIEW_EVALUATION_SCHEMA,
          strict: true,
        },
      },
    };

    const responseResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify(requestPayload),
    });

    if (!responseResponse.ok) {
      const errorData = await responseResponse.json().catch(() => ({}));
      console.error('OpenAI response error:', errorData);
      return NextResponse.json(
        { error: 'Failed to process interview with OpenAI', details: errorData },
        { status: 500 }
      );
    }

    const responseData = await responseResponse.json();
    const responseId = responseData.id;

    if (!responseId) {
      return NextResponse.json({ error: 'Failed to get response ID from OpenAI' }, { status: 500 });
    }

    // Step 2: Poll for completion
    let status = 'in_progress';
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes max

    while (status === 'in_progress' || status === 'queued') {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
      attempts++;

      if (attempts > maxAttempts) {
        return NextResponse.json({ error: 'Timeout waiting for OpenAI response' }, { status: 500 });
      }

      const statusResponse = await fetch(`https://api.openai.com/v1/responses/${responseId}`, {
        headers: {
          Authorization: `Bearer ${openAIApiKey}`,
        },
      });

      if (!statusResponse.ok) {
        const errorData = await statusResponse.json().catch(() => ({}));
        console.error('OpenAI status check error:', errorData);
        return NextResponse.json(
          { error: 'Failed to check OpenAI response status', details: errorData },
          { status: 500 }
        );
      }

      const statusData = await statusResponse.json();
      status = statusData.status;

      if (status === 'failed') {
        const errorDetails = statusData.error || {};
        return NextResponse.json(
          { error: 'OpenAI processing failed', details: errorDetails },
          { status: 500 }
        );
      }
    }

    // Step 3: Get final response
    const finalResponse = await fetch(`https://api.openai.com/v1/responses/${responseId}`, {
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
      },
    });

    if (!finalResponse.ok) {
      const errorData = await finalResponse.json().catch(() => ({}));
      console.error('OpenAI final response error:', errorData);
      return NextResponse.json(
        { error: 'Failed to retrieve final response from OpenAI', details: errorData },
        { status: 500 }
      );
    }

    const finalData = await finalResponse.json();

    // Extract structured output
    let extractedData: {
      skills: Array<{
        skillName: string;
        score: number;
        explanation: string;
        supportingQuotes: string[];
      }>;
      overallVerdict: string;
      overallExplanation: string;
      recommendedImprovements: string[];
    } | null = null;

    // Try to get output_text from content
    const outputItem = finalData.output?.[0];
    if (outputItem?.content) {
      for (const contentItem of outputItem.content) {
        if (contentItem.type === 'output_text' && contentItem.text) {
          try {
            extractedData = JSON.parse(contentItem.text);
            break;
          } catch {
            // Try next content item
          }
        }
      }
    }

    // Check for refusal
    if (!extractedData) {
      if (outputItem?.content) {
        for (const contentItem of outputItem.content) {
          if (contentItem.type === 'refusal' && contentItem.refusal) {
            return NextResponse.json(
              { error: 'OpenAI refused to evaluate the interview', refusal: contentItem.refusal },
              { status: 400 }
            );
          }
        }
      }

      return NextResponse.json(
        { error: 'Failed to extract structured data from OpenAI response' },
        { status: 500 }
      );
    }

    // Validate we got 12 skills
    if (!extractedData.skills || extractedData.skills.length !== 12) {
      return NextResponse.json(
        {
          error: 'Expected 12 skill evaluations, got ' + (extractedData.skills?.length || 0),
        },
        { status: 500 }
      );
    }

    // Build the full evaluation object
    const evaluation = {
      ...extractedData,
      evaluatedAt: new Date().toISOString(),
      modelVersion: 'gpt-5.1',
    };

    // Save to database
    const { error: updateError } = await supabase
      .from('mock_interviews')
      .update({
        ai_evaluation: evaluation,
        ai_evaluation_created_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error saving evaluation:', updateError);
      return NextResponse.json({ error: 'Failed to save evaluation' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      evaluation,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};
