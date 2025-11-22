import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// JSON Schema for structured output
const PORTFOLIO_IDEAS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    ideas: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          company_name: {
            type: 'string',
            description: 'The well-known company/product name for this case study',
          },
          problem_description: {
            type: 'string',
            description: 'A specific problem that exists for this company/product that has not been solved',
          },
          hypothesis: {
            type: 'string',
            description: 'Hypothesis in "If ___, then ___" format',
          },
          user_segment: {
            type: 'object',
            additionalProperties: false,
            properties: {
              age: { type: 'string' },
              location: { type: 'string' },
              income: { type: 'string' },
              interests: { type: 'string' },
              pain_points: { type: 'string' },
              motivations: { type: 'string' },
              personas: { type: 'string' },
              job_type: { type: 'string' },
            },
            required: ['age', 'location', 'income', 'interests', 'pain_points', 'motivations', 'personas', 'job_type'],
            description: 'Target user segment details. Include all fields, using empty string for fields that are not applicable.',
          },
        },
        required: ['company_name', 'problem_description', 'hypothesis', 'user_segment'],
      },
      minItems: 3,
      maxItems: 3,
    },
  },
  required: ['ideas'],
};

// Prompt for generating portfolio case study ideas
const createPortfolioIdeasPrompt = (inputText: string, previousIdeas?: Array<{ company_name: string; problem_description: string }>) => {
  const previousIdeasSection = previousIdeas && previousIdeas.length > 0
    ? `\n\n⚠️ CRITICAL - PREVIOUS IDEAS TO AVOID:\nThe user has already generated the following case study ideas for "${inputText}". You MUST generate 3 COMPLETELY NEW ideas that are DISTINCT and DIFFERENT from these. \n\nPREVIOUS IDEAS (DO NOT REPEAT):\n${previousIdeas.map((idea, idx) => `${idx + 1}. ${idea.company_name}: ${idea.problem_description}`).join('\n')}\n\nREQUIREMENTS FOR NEW IDEAS:\n- Must be for DIFFERENT companies/products than those listed above\n- Must address DIFFERENT problems than those listed above\n- Must have DIFFERENT angles or approaches\n- Do NOT create variations or similar versions of the previous ideas\n- Each new idea should be unique and distinct\n\nIf you cannot generate 3 completely different ideas, you must still provide 3 ideas that are as different as possible from the previous ones.`
    : '';

  return `You are an assistant helping a Product Management candidate create case studies to put on their Product Portfolio. Your goal is to create a list of 3 Case Study ideas. You will receive an input of either an industry, company/product name, or a combination of those. You should take those inputs and then create 3 Case Study ideas based on them. The case studies should be focused on solving a specific problem that exists for a real company/product. The company/product should be well known within that industry and not obscure. You should do research to find current problems. The problems you choose should be very specific - this will make it easier to build the case studies. The problems you choose should not have already been solved.${previousIdeasSection}

BACKGROUND CONTEXT ON CASE STUDIES

Product Portfolios are created for 2 main purposes.

1. Competitive Advantage

Product Manager jobs are hard to get. 

Lots of people apply and there is typically only one PM (and opening) per team

Compared to Software Engineers who can be placed on any team (and there are many of them per team)

Companies are looking for candidates to have a 4 vector fit: 

Role (mobile, platform, growth, etc.)

Technology (native mobile, web, machine learning, etc.)

Industry (fintech, healthcare, ecommerce, etc.)

Business Model (subscription, freemium, licensing, etc.)

A product portfolio can be a key differentiator in the competitive job market for Product Managers. They really help candidates stand out.

2. Helps visually represent your skillset 

Product is inherently very visual. What we work on ends up on a screen for users to interact with.

With a product portfolio, you can present your expertise in a concise and structured visual format, making it easier for potential employers to quickly understand  your skills and value that you could bring to their team

Your Portfolio can help you to demonstrate your ability to work on a diverse range of products, identify and solve complex problems, and deliver successful outcomes

B2B

B2C

SaaS

Enterprise

Etc.  

There are 4 parts of a case study:

Discover: This stage involves researching the market, identifying problems, and gathering information about potential customers and their needs.

Define: In this stage, the information gathered in the Discover stage is used to define the problem and state a clear goal for solving that problem. 

Develop: During the Develop stage, the product is designed, developed, and tested. This stage also includes iterating on the product based on feedback from user testing.

Deliver: In the final stage, the final product is defined and prepared for launch. There's a focus on ensuring successful adoption and identifying improvements based on user feedback.

HYPOTHESIS:

State what you believe will happen if you solve the problem at hand

The hypothesis should be specific and able to be validated / invalidated

It should be in the format of "If ____, then ____" 

Examples: 

If Airbnb removed or replaced their Cleaning Fee, then more customers would book through Airbnb.

If Google Sheets made it easy to import scraped data from the internet, then their user growth would explode. 

USER SEGMENT

Determine who the target audience is for your problem – i.e. what type of person is experiencing your problem the most? Describe them!

Age (millennial, gen x, etc.)

Location (U.S. vs International, Cities vs Suburbs) 

Income (High net worth / lots of disposable income vs lower income)

Interests (Playing music, traveling, eating out, etc.)

Pain points (What pain points do they experience related to this topic?)

Motivations (What motivates them in life?)

Personas (Parents, students, teenagers, professionals, etc.)

Job type (Hourly worker, blue collar, white collar, etc.)

You don't need to include all of these if they're not applicable, but the more specific you can get at defining the target audience, the better your solution will be.

IMPORTANT: When providing user_segment data, you must include all fields (age, location, income, interests, pain_points, motivations, personas, job_type). For fields that are not applicable, use an empty string "".

INPUT:
${inputText}

Generate 3 unique case study ideas based on this input. Each idea should:
1. Focus on a well-known company/product
2. Identify a specific, unsolved problem
3. Include a clear hypothesis in "If ___, then ___" format
4. Define a detailed user segment with all fields (use empty string for non-applicable fields)

Make sure the 3 ideas are distinct from each other and cover different aspects or companies within the input domain.`;
};

// POST /api/portfolio/generate-ideas - Generate portfolio case study ideas with OpenAI
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
    const { inputText, previousIdeas, requestId } = body;

    if (!inputText || typeof inputText !== 'string' || inputText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Input text is required' },
        { status: 400 }
      );
    }

    // Validate previousIdeas if provided
    if (previousIdeas && !Array.isArray(previousIdeas)) {
      return NextResponse.json(
        { error: 'previousIdeas must be an array' },
        { status: 400 }
      );
    }

    // If requestId is provided, validate it belongs to the user
    let existingRequest = null;
    if (requestId) {
      const { data: requestData, error: requestError } = await supabase
        .from('portfolio_idea_requests')
        .select('id, input_text, user_id, created_at')
        .eq('id', requestId)
        .eq('user_id', user.id)
        .single();

      if (requestError || !requestData) {
        return NextResponse.json(
          { error: 'Invalid or unauthorized request ID' },
          { status: 400 }
        );
      }
      existingRequest = requestData;
    }

    // Check for OpenAI API key
    const openAIApiKey = process.env.OPEN_AI_SECRET_KEY;
    if (!openAIApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Create prompt with context, including previous ideas if provided
    const prompt = createPortfolioIdeasPrompt(
      inputText.trim(),
      previousIdeas as Array<{ company_name: string; problem_description: string }> | undefined
    );

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
          name: 'portfolio_ideas',
          schema: PORTFOLIO_IDEAS_SCHEMA,
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
        { error: 'Failed to process request with OpenAI', details: errorData },
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
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      attempts++;

      if (attempts > maxAttempts) {
        return NextResponse.json(
          { error: 'Timeout waiting for OpenAI response' },
          { status: 500 }
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

    // Step 3: Get final response
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
    let extractedData: any = null;

    // Try to get output_text from content
    const outputItem = finalData.output?.[0];
    if (outputItem?.content) {
      for (const contentItem of outputItem.content) {
        if (contentItem.type === 'output_text' && contentItem.text) {
          try {
            extractedData = JSON.parse(contentItem.text);
            break;
          } catch (e) {
            // Try next content item
          }
        }
      }
    }

    // Fallback: try to parse refusal or other content
    if (!extractedData) {
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

    // Validate we got 3 ideas
    if (!extractedData.ideas || extractedData.ideas.length !== 3) {
      return NextResponse.json(
        { error: 'Expected 3 ideas, got ' + (extractedData.ideas?.length || 0) },
        { status: 500 }
      );
    }

    // Step 4: Save to database
    // Use existing request or create a new one
    let requestRecord;
    if (existingRequest) {
      // Use existing request
      requestRecord = existingRequest;
    } else {
      // Create new request record
      const { data: newRequestRecord, error: requestError } = await supabase
        .from('portfolio_idea_requests')
        .insert({
          user_id: user.id,
          input_text: inputText.trim(),
        })
        .select()
        .single();

      if (requestError || !newRequestRecord) {
        console.error('Error creating request record:', requestError);
        return NextResponse.json(
          { error: 'Failed to save request to database' },
          { status: 500 }
        );
      }
      requestRecord = newRequestRecord;
    }

    // Get the highest idea_number for this request to calculate next numbers
    const { data: existingIdeas } = await supabase
      .from('portfolio_ideas')
      .select('idea_number')
      .eq('request_id', requestRecord.id)
      .order('idea_number', { ascending: false })
      .limit(1);

    const nextIdeaNumber = existingIdeas && existingIdeas.length > 0
      ? existingIdeas[0].idea_number + 1
      : 1;

    // Create the idea records with sequential numbering
    const ideasToInsert = extractedData.ideas.map((idea: any, index: number) => ({
      request_id: requestRecord.id,
      idea_number: nextIdeaNumber + index,
      company_name: idea.company_name,
      problem_description: idea.problem_description,
      hypothesis: idea.hypothesis,
      user_segment: idea.user_segment,
    }));

    const { data: ideaRecords, error: ideasError } = await supabase
      .from('portfolio_ideas')
      .insert(ideasToInsert)
      .select();

    if (ideasError || !ideaRecords) {
      console.error('Error creating idea records:', ideasError);
      // Still return the ideas even if database save fails
      return NextResponse.json({
        request: {
          id: requestRecord.id,
          input_text: requestRecord.input_text,
          created_at: requestRecord.created_at,
          ideas: extractedData.ideas.map((idea: any, index: number) => ({
            id: `temp-${index}`,
            idea_number: index + 1,
            ...idea,
          })),
        },
        warning: 'Ideas generated but failed to save to database',
      });
    }

    // Fetch all ideas for this request to return complete list
    const { data: allIdeas } = await supabase
      .from('portfolio_ideas')
      .select('id, idea_number, company_name, problem_description, hypothesis, user_segment')
      .eq('request_id', requestRecord.id)
      .order('idea_number', { ascending: true });

    return NextResponse.json({
      request: {
        id: requestRecord.id,
        input_text: requestRecord.input_text,
        created_at: requestRecord.created_at,
        ideas: (allIdeas || []).map((idea) => ({
          id: idea.id,
          idea_number: idea.idea_number,
          company_name: idea.company_name,
          problem_description: idea.problem_description,
          hypothesis: idea.hypothesis,
          user_segment: idea.user_segment,
        })),
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

