import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// JSON Schema for structured output
const BULLET_OPTIMIZATION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    optimizedVersions: {
      type: 'array',
      items: {
        type: 'string',
      },
      minItems: 3,
      maxItems: 3,
    },
  },
  required: ['optimizedVersions'],
};

// Prompt for optimizing resume bullet
const createOptimizationPrompt = (bulletContent: string, company?: string, role?: string) => {
  const contextParts: string[] = [];
  
  if (company) {
    contextParts.push(`Company: ${company}`);
  }
  if (role) {
    contextParts.push(`Role: ${role}`);
  }
  
  const contextSection = contextParts.length > 0 
    ? `\n\nContext:\n${contextParts.join('\n')}`
    : '';

  return `You are an expert resume writer specializing in product management resumes. Your task is to create 3 improved versions of a resume bullet point.

**What makes an incredible resume bullet:**
- **Clear and scannable**: Easy to understand quickly, no unnecessary jargon
- **Impact-focused**: Clearly demonstrates value delivered to the organization
- **Action-oriented**: Shows specific actions the person took to achieve results
- **Quantified**: Includes numbers, percentages, or metrics that demonstrate scale
- **Concise**: Gets to the point quickly while maintaining impact
- **Results-driven**: Focuses on outcomes and accomplishments, not just responsibilities

**Guidelines for optimization:**
- Maintain the core accomplishment and facts from the original
- Enhance clarity, impact, action clarity, and quantification where applicable
- Make each version distinct - try different approaches (e.g., one more metric-focused, one more impact-focused, one more action-focused)
- Keep the same level of detail or add more specific details if they strengthen the bullet
- Ensure each version is compelling and would stand out to a hiring manager

Create 3 optimized versions that are all strong but offer different approaches to presenting the same accomplishment.${contextSection}

Original bullet point to optimize:
${bulletContent}`;
};

// POST /api/resume/bullets/[bulletId]/optimize - Optimize bullet with OpenAI
export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ bulletId: string }> }
) => {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { bulletId } = await params;

    // Verify ownership and get bullet content with experience context
    const { data: bullet } = await supabase
      .from('resume_experience_bullets')
      .select(`
        *,
        experience:resume_experiences(
          title,
          company,
          version:resume_versions(user_id)
        )
      `)
      .eq('id', bulletId)
      .single();

    if (!bullet || bullet.experience?.version?.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Bullet not found' },
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

    // Create prompt with context
    const prompt = createOptimizationPrompt(
      bullet.content,
      bullet.experience?.company,
      bullet.experience?.title
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
          name: 'bullet_optimization',
          schema: BULLET_OPTIMIZATION_SCHEMA,
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
        { error: 'Failed to process bullet with OpenAI', details: errorData },
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
              { error: 'OpenAI refused to process the bullet', refusal: contentItem.refusal },
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

    // Validate we got 3 versions
    if (!extractedData.optimizedVersions || extractedData.optimizedVersions.length !== 3) {
      return NextResponse.json(
        { error: 'Expected 3 optimized versions, got ' + (extractedData.optimizedVersions?.length || 0) },
        { status: 500 }
      );
    }

    return NextResponse.json({
      optimizedVersions: extractedData.optimizedVersions,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

