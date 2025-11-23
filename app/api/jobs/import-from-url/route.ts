import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// JSON Schema for structured output - extracting job and company data
// Note: With strict mode, all properties must be in required array or be nullable
const JOB_IMPORT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    company: {
      type: 'object',
      additionalProperties: false,
      properties: {
        name: {
          type: 'string',
          description: 'Company name',
        },
        website: {
          type: ['string', 'null'],
          description: 'Company website URL (e.g., https://company.com) or null if not found',
        },
        linkedin_url: {
          type: ['string', 'null'],
          description: 'Company LinkedIn URL or null if not found',
        },
        industry: {
          type: ['string', 'null'],
          enum: ['technology', 'finance', 'healthcare', 'retail', 'consulting', 'education', 'manufacturing', 'media', 'other', null],
          description: 'Company industry or null if not found',
        },
        size: {
          type: ['string', 'null'],
          enum: ['1-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+', null],
          description: 'Company size or null if not found',
        },
        headquarters_city: {
          type: ['string', 'null'],
          description: 'Company headquarters city or null if not found',
        },
        headquarters_state: {
          type: ['string', 'null'],
          description: 'Company headquarters state/province or null if not found',
        },
        headquarters_country: {
          type: ['string', 'null'],
          description: 'Company headquarters country or null if not found',
        },
        description: {
          type: ['string', 'null'],
          description: 'Company description or null if not found',
        },
      },
      required: ['name', 'website', 'linkedin_url', 'industry', 'size', 'headquarters_city', 'headquarters_state', 'headquarters_country', 'description'],
    },
    job: {
      type: 'object',
      additionalProperties: false,
      properties: {
        title: {
          type: 'string',
          description: 'Job title',
        },
        location: {
          type: ['string', 'null'],
          description: 'Job location (e.g., "San Francisco, CA" or "Remote") or null if not found',
        },
        work_mode: {
          type: ['string', 'null'],
          enum: ['remote', 'hybrid', 'onsite', null],
          description: 'Work mode or null if not found',
        },
        salary_min: {
          type: ['number', 'null'],
          description: 'Minimum salary or null if not mentioned',
        },
        salary_max: {
          type: ['number', 'null'],
          description: 'Maximum salary or null if not mentioned',
        },
        salary_currency: {
          type: ['string', 'null'],
          enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR', null],
          description: 'Salary currency or null if not found',
        },
        description: {
          type: ['string', 'null'],
          description: 'Full job description or null if not found',
        },
        deadline: {
          type: ['string', 'null'],
          description: 'Application deadline in ISO date format (YYYY-MM-DD) or null if not mentioned',
        },
      },
      required: ['title', 'location', 'work_mode', 'salary_min', 'salary_max', 'salary_currency', 'description', 'deadline'],
    },
  },
  required: ['company', 'job'],
};

// POST /api/jobs/import-from-url - Import job from JD URL
export const POST = async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Step 1: Scrape URL with Firecrawl
    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    if (!firecrawlApiKey) {
      return NextResponse.json(
        { error: 'Firecrawl API key not configured' },
        { status: 500 }
      );
    }

    const firecrawlResponse = await fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        onlyMainContent: false,
        maxAge: 172800000, // 2 days
        parsers: ['pdf'],
        formats: ['markdown'],
      }),
    });

    if (!firecrawlResponse.ok) {
      const errorData = await firecrawlResponse.json().catch(() => ({}));
      console.error('Firecrawl error:', errorData);
      return NextResponse.json(
        { error: 'Failed to scrape job description', details: errorData },
        { status: 500 }
      );
    }

    const firecrawlData = await firecrawlResponse.json();
    const markdownContent = firecrawlData.data?.markdown || firecrawlData.markdown || '';

    if (!markdownContent || markdownContent.trim().length === 0) {
      return NextResponse.json(
        { error: 'No content extracted from URL' },
        { status: 400 }
      );
    }

    // Step 2: Extract structured data with OpenAI
    const openAIApiKey = process.env.OPEN_AI_SECRET_KEY;
    if (!openAIApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const prompt = `Extract job and company information from the following job description. Extract as much detail as possible.

Job Description:
${markdownContent}

Extract:
1. Company information: name, website, LinkedIn URL, industry, size, headquarters location, description
2. Job information: title, location, work mode (remote/hybrid/onsite), salary range, full description, application deadline

Be thorough and extract all available information. If information is not available, omit that field.`;

    // Use OpenAI Responses API with structured output
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
          name: 'job_import',
          schema: JOB_IMPORT_SCHEMA,
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
        { error: 'Failed to extract job data with OpenAI', details: errorData },
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

      if (status === 'completed') {
        // Get the final response
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
        let parsedData: any = null;

        // Try to get output_text from content
        const outputItem = finalData.output?.[0];
        if (outputItem?.content) {
          for (const contentItem of outputItem.content) {
            if (contentItem.type === 'output_text' && contentItem.text) {
              try {
                parsedData = JSON.parse(contentItem.text);
                break;
              } catch (e) {
                // Try next content item
              }
            }
          }
        }

        // Fallback: try to parse refusal or other content
        if (!parsedData) {
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

        const { company: companyData, job: jobData } = parsedData;

        if (!companyData?.name || !jobData?.title) {
          return NextResponse.json(
            { error: 'Missing required fields: company name or job title' },
            { status: 400 }
          );
        }

        // Helper to convert null to undefined (for database insertion)
        const toUndefined = (value: any) => value === null ? undefined : value;

        // Step 3: Find or create company
        // First, try to find existing company by name
        const { data: existingCompany } = await supabase
          .from('companies')
          .select('*')
          .ilike('name', companyData.name)
          .limit(1)
          .single();

        let company;
        if (existingCompany) {
          company = existingCompany;
        } else {
          // Create new company
          
          const { data: newCompany, error: companyError } = await supabase
            .from('companies')
            .insert({
              name: companyData.name,
              website: toUndefined(companyData.website),
              linkedin_url: toUndefined(companyData.linkedin_url),
              industry: toUndefined(companyData.industry) || 'technology',
              size: toUndefined(companyData.size) || '51-200',
              headquarters_city: toUndefined(companyData.headquarters_city),
              headquarters_state: toUndefined(companyData.headquarters_state),
              headquarters_country: toUndefined(companyData.headquarters_country) || 'USA',
              description: toUndefined(companyData.description),
              is_approved: false, // Needs admin approval
              created_by_user_id: user.id,
            })
            .select()
            .single();

          if (companyError) {
            console.error('Error creating company:', companyError);
            
            // If company already exists (race condition), fetch it
            if (companyError.code === '23505') {
              const { data: fetchedCompany } = await supabase
                .from('companies')
                .select('*')
                .eq('name', companyData.name)
                .single();
              
              if (fetchedCompany) {
                company = fetchedCompany;
              } else {
                return NextResponse.json(
                  { error: 'Failed to create company' },
                  { status: 500 }
                );
              }
            } else {
              return NextResponse.json(
                { error: 'Failed to create company' },
                { status: 500 }
              );
            }
          } else {
            company = newCompany;
          }
        }

        // Step 4: Create job application
        const { data: application, error: applicationError } = await supabase
          .from('job_applications')
          .insert({
            user_id: user.id,
            company_id: company.id,
            title: jobData.title,
            location: toUndefined(jobData.location),
            work_mode: toUndefined(jobData.work_mode),
            salary_min: toUndefined(jobData.salary_min),
            salary_max: toUndefined(jobData.salary_max),
            salary_currency: toUndefined(jobData.salary_currency) || 'USD',
            job_url: url, // Use the original URL
            description: toUndefined(jobData.description),
            status: 'wishlist',
            priority: 'medium',
            deadline: toUndefined(jobData.deadline),
          })
          .select(`
            *,
            company:companies(*)
          `)
          .single();

        if (applicationError) {
          console.error('Error creating application:', applicationError);
          return NextResponse.json(
            { error: 'Failed to create job application' },
            { status: 500 }
          );
        }

        return NextResponse.json(
          { 
            application,
            message: 'Job imported successfully'
          },
          { status: 201 }
        );
      } else if (status === 'failed') {
        return NextResponse.json(
          { error: 'OpenAI request failed' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Unexpected status from OpenAI' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Unexpected error importing job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

