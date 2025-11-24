import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getUserPlan } from '@/lib/utils/subscription';

// JSON Schema for structured output
const THANK_YOU_EMAIL_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    subject: {
      type: 'string',
      description: 'Subject line for the thank you email',
    },
    body: {
      type: 'string',
      description: 'Body of the thank you email (plain text, will be formatted as HTML)',
    },
  },
  required: ['subject', 'body'],
};

// POST /api/jobs/interviews/[id]/generate-email - Generate thank you email from question answers
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
        ),
        questions:interview_questions(*)
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

    // Check if user has Accelerate plan
    const userPlan = await getUserPlan(user.id);
    if (userPlan !== 'accelerate') {
      return NextResponse.json(
        { error: 'This feature requires an Accelerate plan subscription', requiresAccelerate: true },
        { status: 403 }
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

    // Get questions with answers
    const questions = interview.questions || [];
    const questionsWithAnswers = questions.filter((q: any) => q.answer && q.answer.trim().length > 0);

    if (questionsWithAnswers.length === 0) {
      return NextResponse.json(
        { error: 'No questions with answers found. Please add answers to questions before generating the email.' },
        { status: 400 }
      );
    }

    // Get primary interviewer (first interviewer or first contact)
    const interviewers = interview.interview_interviewers || [];
    const primaryInterviewer = interviewers.length > 0 && interviewers[0].contact
      ? interviewers[0].contact
      : null;

    // Build context
    const companyName = interview.application?.company?.name || 'the company';
    const jobTitle = interview.application?.title || 'this role';
    const interviewerName = primaryInterviewer?.name || 'the interviewer';
    const interviewerTitle = primaryInterviewer?.title || '';

    // Build questions and answers context
    const qaContext = questionsWithAnswers
      .map((q: any, idx: number) => `Q${idx + 1}: ${q.question}\nA${idx + 1}: ${q.answer}`)
      .join('\n\n');

    // Create prompt
    const prompt = `You are helping a Product Manager write a personalized thank you email after an interview. Generate a professional, warm, and specific thank you email that references the conversation.

Context:
- Company: ${companyName}
- Role: ${jobTitle}
- Interviewer: ${interviewerName}${interviewerTitle ? ` (${interviewerTitle})` : ''}
- Interview Date: ${interview.scheduled_for ? new Date(interview.scheduled_for).toLocaleDateString() : 'recently'}

Questions and Answers from the Interview:
${qaContext}

Requirements:
1. The email should be personalized and reference specific points from the conversation
2. It should demonstrate genuine interest in the role and company
3. It should be professional but warm and authentic
4. It should be concise (2-3 paragraphs)
5. The subject line should be clear and professional
6. Reference specific insights or information learned from the answers provided
7. Express enthusiasm for the opportunity

Generate a thank you email that will help the candidate stand out and reinforce their interest in the role.`;

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
          name: 'thank_you_email',
          schema: THANK_YOU_EMAIL_SCHEMA,
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
        { error: 'Failed to generate email with OpenAI', details: errorData },
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
    let parsedEmail: any = null;

    // Try to get output_text from content
    const outputItem = finalData.output?.[0];
    if (outputItem?.content) {
      for (const contentItem of outputItem.content) {
        if (contentItem.type === 'output_text' && contentItem.text) {
          try {
            parsedEmail = JSON.parse(contentItem.text);
            break;
          } catch (e) {
            // Try next content item
          }
        }
      }
    }

    // Fallback: try to parse refusal or other content
    if (!parsedEmail) {
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

    if (!parsedEmail.subject || !parsedEmail.body) {
      return NextResponse.json(
        { error: 'No email generated in OpenAI response' },
        { status: 500 }
      );
    }

    // Convert plain text body to HTML (simple conversion)
    const htmlBody = parsedEmail.body
      .split('\n\n')
      .map((paragraph: string) => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
      .join('');

    // Save the email to the interview
    const { error: updateError } = await supabase
      .from('interviews')
      .update({
        thank_you_email_subject: parsedEmail.subject,
        thank_you_email_body: parsedEmail.body,
      })
      .eq('id', interviewId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error saving thank you email:', updateError);
      // Don't fail the request, just log the error - email was still generated
    }

    return NextResponse.json({
      subject: parsedEmail.subject,
      body: parsedEmail.body,
      htmlBody: htmlBody,
    });
  } catch (error) {
    console.error('Unexpected error generating email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

