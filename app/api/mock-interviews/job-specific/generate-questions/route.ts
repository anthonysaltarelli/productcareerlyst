import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  GeneratedJobQuestion,
  GenerateQuestionsResponse,
  JOB_QUESTIONS_JSON_SCHEMA,
} from '@/lib/types/job-interview';

/**
 * Build the prompt for generating job-specific interview questions
 */
function buildQuestionGenerationPrompt(
  companyName: string,
  jobTitle: string,
  jobDescription: string,
  companyDescription?: string,
  companyResearch?: string
): string {
  let contextSection = '';

  if (companyDescription) {
    contextSection += `\n\nCompany Description:\n${companyDescription}`;
  }

  if (companyResearch) {
    contextSection += `\n\nCompany Research:\n${companyResearch}`;
  }

  return `You are a senior PM interview question designer helping a product manager prepare for an interview at ${companyName} for the ${jobTitle} role.

## Context
- Company: ${companyName}
- Role: ${jobTitle}

## Job Description:
${jobDescription}
${contextSection}

## Your Task
Generate exactly 7 interview questions that would realistically be asked in an interview for this specific role at this specific company. These should feel like questions a real interviewer at ${companyName} would ask.

## Question Types to Include (mix these categories)

1. **Company-Specific (2 questions)**
   - "Why do you want to work at ${companyName}?"
   - Questions about the company's mission, values, products, or recent initiatives
   - Questions that test knowledge of the company

2. **Role-Specific (2 questions)**
   - Based on requirements and responsibilities in the job description
   - Skills and experiences mentioned in the JD
   - Specific challenges the role might face

3. **Industry/Market (1 question)**
   - Challenges facing the company or industry
   - Competitive landscape questions
   - Market trends relevant to their products

4. **Product/Behavioral (2 questions)**
   - Product sense questions related to their actual products
   - Behavioral questions about PM competencies (with company context)
   - "Tell me about a time when..." questions relevant to the role

## Requirements
- Questions MUST be specific to ${companyName} and the ${jobTitle} role
- Reference actual requirements from the job description
- Include company name and product names when relevant
- Feel like a real interview, not generic PM questions
- Mix of question types for variety
- Each question should have a clear rationale explaining why it's relevant

## Output Format
For each question, provide:
- The question itself
- The category (company, role, industry, behavioral, or product_sense)
- A brief rationale explaining why this question is relevant to this specific job`;
}

/**
 * POST /api/mock-interviews/job-specific/generate-questions
 * Generate 7 tailored interview questions for a specific job application
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

    // Parse request body
    const body = await request.json();
    const { jobApplicationId } = body;

    if (!jobApplicationId) {
      return NextResponse.json(
        { error: 'jobApplicationId is required' },
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
          description,
          website
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

    // Validate that the job has a description
    if (!application.description) {
      return NextResponse.json(
        { error: 'Job application must have a description to generate questions' },
        { status: 400 }
      );
    }

    // Supabase returns relations as arrays, but with single() it's guaranteed to be a single record or null
    const companyData = application.company as unknown;
    const company = Array.isArray(companyData) ? companyData[0] : companyData as { id: string; name: string; description?: string; website?: string } | null;
    const companyName = company?.name || 'the company';
    const companyId = company?.id || null;

    // Try to fetch company research if available
    let companyResearch: string | undefined;
    if (companyId) {
      const { data: research } = await supabase
        .from('company_research')
        .select('perplexity_response')
        .eq('company_id', companyId)
        .limit(1)
        .maybeSingle();

      if (research?.perplexity_response?.content) {
        // Limit research context to avoid token limits
        companyResearch = research.perplexity_response.content.slice(0, 2000);
      }
    }

    // Check for OpenAI API key
    const openAIApiKey = process.env.OPEN_AI_SECRET_KEY;
    if (!openAIApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Build the prompt
    const prompt = buildQuestionGenerationPrompt(
      companyName,
      application.title,
      application.description,
      company?.description,
      companyResearch
    );

    // Call OpenAI Responses API with structured output
    const requestPayload = {
      model: 'gpt-4.1',
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
          name: 'job_interview_questions',
          schema: JOB_QUESTIONS_JSON_SCHEMA,
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

    // Poll for completion
    let status = 'in_progress';
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes max

    while (status === 'in_progress' || status === 'queued') {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      attempts++;

      if (attempts > maxAttempts) {
        return NextResponse.json(
          { error: 'Request timeout - OpenAI took too long to respond' },
          { status: 504 }
        );
      }

      const statusResponse = await fetch(
        `https://api.openai.com/v1/responses/${responseId}`,
        {
          headers: {
            Authorization: `Bearer ${openAIApiKey}`,
          },
        }
      );

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

    // Get final response when completed
    const finalResponse = await fetch(
      `https://api.openai.com/v1/responses/${responseId}`,
      {
        headers: {
          Authorization: `Bearer ${openAIApiKey}`,
        },
      }
    );

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
    let parsedQuestions: { questions: GeneratedJobQuestion[] } | null = null;

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
        // Check for refusal
        if (contentItem.type === 'refusal' && contentItem.refusal) {
          return NextResponse.json(
            { error: 'OpenAI refused to process the request', refusal: contentItem.refusal },
            { status: 400 }
          );
        }
      }
    }

    if (!parsedQuestions?.questions || !Array.isArray(parsedQuestions.questions)) {
      return NextResponse.json(
        { error: 'Failed to extract structured data from OpenAI response' },
        { status: 500 }
      );
    }

    // Build response
    const response: GenerateQuestionsResponse = {
      success: true,
      questions: parsedQuestions.questions,
      jobContext: {
        companyName,
        jobTitle: application.title,
        descriptionSnippet: application.description.slice(0, 500),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in job-specific question generation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
