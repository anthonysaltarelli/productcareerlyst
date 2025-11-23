import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getUserPlan } from '@/lib/utils/subscription';

// JSON Schema for structured output
const INTERVIEW_QUESTIONS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          question: {
            type: 'string',
            description: 'A thoughtful question to ask during the interview',
          },
        },
        required: ['question'],
      },
      minItems: 2,
      maxItems: 3,
    },
  },
  required: ['questions'],
};

// POST /api/jobs/interviews/[id]/generate-questions - Generate interview questions with OpenAI
export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const supabase = await createClient();
    const { id: interviewId } = await params;
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check user plan - only Accelerate users can generate questions
    const userPlan = await getUserPlan(user.id);
    if (userPlan !== 'accelerate') {
      return NextResponse.json(
        { error: 'Accelerate plan required', requiresAccelerate: true },
        { status: 403 }
      );
    }

    // Get interview with relations
    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .select(`
        *,
        application:job_applications(
          *,
          company:companies(*)
        ),
        interview_interviewers(
          id,
          role,
          contact:contacts(*)
        )
      `)
      .eq('id', interviewId)
      .eq('user_id', user.id)
      .single();

    if (interviewError || !interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    // Check for OpenAI API key
    const openAIApiKey = process.env.OPEN_AI_SECRET_KEY;
    if (!openAIApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Build context for question generation
    const companyName = interview.application?.company?.name || 'the company';
    const jobTitle = interview.application?.title || 'this role';
    const interviewType = interview.type || 'general';
    const interviewers = interview.interview_interviewers || [];
    
    // Build interviewer context
    let interviewerContext = '';
    if (interviewers.length > 0) {
      const interviewerDetails = interviewers
        .map((ii: any) => {
          const contact = ii.contact;
          if (!contact) return null;
          return `${contact.name}${contact.title ? ` (${contact.title})` : ''}`;
        })
        .filter(Boolean)
        .join(', ');
      
      if (interviewerDetails) {
        interviewerContext = `\n\nInterviewers:\n- ${interviewerDetails}`;
      }
    }

    // Create prompt
    const prompt = `You are helping a Product Manager prepare for an interview. Generate 2-3 thoughtful, specific questions they should ask during this interview.

Context:
- Company: ${companyName}
- Role: ${jobTitle}
- Interview Type: ${interviewType.replace('_', ' ')}${interviewerContext}

Requirements:
1. Questions should be tailored to the interview type (e.g., Product Sense interviews should focus on product strategy; Technical interviews should focus on technical aspects, especially if the interviewer is not a PM)
2. Questions should be specific to ${companyName} and ${jobTitle}, not generic
3. Questions should demonstrate genuine interest and help the candidate learn about the role, team, product, or company
4. Questions should be professional and appropriate for the interview context
5. If the interviewer's role is not a PM, tailor technical questions accordingly

Generate 2-3 high-quality questions that will help the candidate stand out and gather valuable information.`;

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
          name: 'interview_questions',
          schema: INTERVIEW_QUESTIONS_SCHEMA,
          strict: true,
        },
      },
    };

    const responseResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify(requestPayload),
    });

    if (!responseResponse.ok) {
      const errorData = await responseResponse.json().catch(() => ({}));
      console.error('OpenAI response error:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate questions with OpenAI', details: errorData },
        { status: 500 }
      );
    }

    const responseData = await responseResponse.json();
    const responseId = responseData.id;

    if (!responseId) {
      return NextResponse.json(
        { error: 'Failed to get response ID from OpenAI' },
        { status: 500 }
      );
    }

    // Step 2: Poll for completion
    let status = 'in_progress';
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes max

    while (status === 'in_progress' || status === 'queued') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;

      if (attempts > maxAttempts) {
        return NextResponse.json(
          { error: 'Request timeout - OpenAI took too long to respond' },
          { status: 504 }
        );
      }

      const statusResponse = await fetch(`https://api.openai.com/v1/responses/${responseId}`, {
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
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

    // Step 3: Get final response when completed
    const finalResponse = await fetch(`https://api.openai.com/v1/responses/${responseId}`, {
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
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
    let parsedQuestions: any = null;

    // Try to get output_text from content
    const outputItem = finalData.output?.[0];
    if (outputItem?.content) {
      for (const contentItem of outputItem.content) {
        if (contentItem.type === 'output_text' && contentItem.text) {
          try {
            parsedQuestions = JSON.parse(contentItem.text);
            break;
          } catch (e) {
            // Try next content item
          }
        }
      }
    }

    // Fallback: try to parse refusal or other content
    if (!parsedQuestions) {
      // Check for refusal
      if (outputItem?.content) {
        for (const contentItem of outputItem.content) {
          if (contentItem.type === 'refusal' && contentItem.refusal) {
            return NextResponse.json(
              { error: 'OpenAI refused to process the request', refusal: contentItem.refusal },
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

    if (!parsedQuestions.questions || !Array.isArray(parsedQuestions.questions)) {
      return NextResponse.json(
        { error: 'No questions generated in OpenAI response' },
        { status: 500 }
      );
    }

    // Create questions in database
    const questionsToCreate = parsedQuestions.questions || [];
    const createdQuestions = [];

    for (const q of questionsToCreate) {
      const { data: question, error: insertError } = await supabase
        .from('interview_questions')
        .insert({
          user_id: user.id,
          interview_id: interviewId,
          question: q.question,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating question:', insertError);
        // Continue with other questions even if one fails
      } else {
        createdQuestions.push(question);
      }
    }

    return NextResponse.json(
      { questions: createdQuestions },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error generating questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

