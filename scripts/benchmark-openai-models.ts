/**
 * OpenAI Model Benchmark Script
 * 
 * Compares gpt-5.1, gpt-5-mini, and gpt-5-nano for resume processing:
 * 1. Resume Extraction - Parse PDF into structured data
 * 2. Resume Analysis - Generate comprehensive PM resume analysis
 * 
 * Usage: npx tsx scripts/benchmark-openai-models.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const OPENAI_API_KEY = process.env.OPEN_AI_SECRET_KEY;
const MODELS_TO_TEST = ['gpt-5.1', 'gpt-5-mini', 'gpt-5-nano'];
const PDF_PATH = path.join(process.cwd(), 'public/Files/Anthony+Saltarelli+Resume copy.pdf');
const RESULTS_PATH = path.join(process.cwd(), 'scripts/benchmark-results.json');

// ============================================================================
// SCHEMAS (from existing API routes)
// ============================================================================

const RESUME_EXTRACTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    contactInfo: {
      type: 'object',
      additionalProperties: false,
      properties: {
        full_name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: ['string', 'null'] },
        location: { type: ['string', 'null'] },
        linkedin: { type: ['string', 'null'] },
        portfolio: { type: ['string', 'null'] },
      },
      required: ['full_name', 'email', 'phone', 'location', 'linkedin', 'portfolio'],
    },
    summary: {
      type: ['string', 'null'],
    },
    experiences: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          company: { type: 'string' },
          location: { type: ['string', 'null'] },
          start_date: { type: ['string', 'null'] },
          end_date: { type: ['string', 'null'] },
          bullets: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['title', 'company', 'location', 'start_date', 'end_date', 'bullets'],
      },
    },
    education: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          school: { type: 'string' },
          degree: { type: 'string' },
          field: { type: ['string', 'null'] },
          location: { type: ['string', 'null'] },
          start_date: { type: ['string', 'null'] },
          end_date: { type: ['string', 'null'] },
          gpa: { type: ['string', 'null'] },
          achievements: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['school', 'degree', 'field', 'location', 'start_date', 'end_date', 'gpa', 'achievements'],
      },
    },
    skills: {
      type: 'object',
      additionalProperties: false,
      properties: {
        technical: { type: 'array', items: { type: 'string' } },
        product: { type: 'array', items: { type: 'string' } },
        soft: { type: 'array', items: { type: 'string' } },
      },
      required: ['technical', 'product', 'soft'],
    },
  },
  required: ['contactInfo', 'summary', 'experiences', 'education', 'skills'],
};

const RESUME_ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    overallScore: {
      type: 'integer',
      minimum: 0,
      maximum: 100,
    },
    categoryScores: {
      type: 'object',
      additionalProperties: false,
      properties: {
        actionVerbs: { type: 'integer', minimum: 0, maximum: 100 },
        accomplishments: { type: 'integer', minimum: 0, maximum: 100 },
        quantification: { type: 'integer', minimum: 0, maximum: 100 },
        impact: { type: 'integer', minimum: 0, maximum: 100 },
        conciseness: { type: 'integer', minimum: 0, maximum: 100 },
      },
      required: ['actionVerbs', 'accomplishments', 'quantification', 'impact', 'conciseness'],
    },
    keywordAnalysis: {
      type: 'object',
      additionalProperties: false,
      properties: {
        present: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              keyword: { type: 'string' },
              count: { type: 'integer', minimum: 0 },
            },
            required: ['keyword', 'count'],
          },
        },
        missing: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              keyword: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
            },
            required: ['keyword', 'priority'],
          },
        },
        density: { type: 'number', minimum: 0, maximum: 100 },
      },
      required: ['present', 'missing', 'density'],
    },
    atsCompatibility: {
      type: 'string',
      enum: ['Good', 'Fair', 'Poor'],
    },
    atsExplanation: {
      type: 'string',
    },
    recommendations: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          priority: { type: 'integer', minimum: 1 },
          title: { type: 'string' },
          description: { type: 'string' },
          impact: { type: 'string', enum: ['high', 'medium', 'low'] },
        },
        required: ['priority', 'title', 'description', 'impact'],
      },
      minItems: 5,
      maxItems: 7,
    },
    categoryDescriptions: {
      type: 'object',
      additionalProperties: false,
      properties: {
        actionVerbs: { type: 'string' },
        accomplishments: { type: 'string' },
        quantification: { type: 'string' },
        impact: { type: 'string' },
        conciseness: { type: 'string' },
      },
      required: ['actionVerbs', 'accomplishments', 'quantification', 'impact', 'conciseness'],
    },
  },
  required: [
    'overallScore',
    'categoryScores',
    'keywordAnalysis',
    'atsCompatibility',
    'atsExplanation',
    'recommendations',
    'categoryDescriptions',
  ],
};

// ============================================================================
// PROMPTS (from existing API routes)
// ============================================================================

const EXTRACTION_PROMPT = `Extract all information from this resume and return it in the specified JSON format. Include:
- Contact information (name, email, phone, location, LinkedIn, portfolio)
- Professional summary
- All work experiences with their bullet points
- All education entries with achievements
- Skills categorized as technical, product, or soft skills

IMPORTANT: When a person has multiple roles at the same company (e.g., "Product Manager" then "Senior Product Manager" at Squarespace), create separate experience entries for each role. Each role should have:
- Its own title
- Its own start_date and end_date (the end_date of one role should match the start_date of the next role, or be the same if overlapping)
- Its own bullets that were specific to that role
- The same company name and location

For dates, use either:
- Year only format: "2022" (when only the year is available)
- Month Year format: "July 2022" or "Jul 2022" (when month and year are available)
- Preserve "Present" for current roles
- Use the format that best matches what's shown on the resume`;

const createAnalysisPrompt = (resumeText: string): string => {
  return `You are an expert resume reviewer specializing in Product Management resumes. Your task is to comprehensively evaluate a resume and provide detailed, actionable feedback.

**Evaluation Criteria:**

1. **Action Verbs Quality (0-100)**: Assess the strength and variety of action verbs used. Strong verbs (e.g., "Led", "Drove", "Spearheaded", "Orchestrated") score higher than weak ones (e.g., "Worked on", "Helped", "Assisted").

2. **Accomplishments Strength (0-100)**: Evaluate how well the resume demonstrates concrete achievements vs. just responsibilities. Look for quantifiable results, successful launches, measurable improvements.

3. **Quantification Level (0-100)**: Measure how extensively numbers, percentages, metrics, and data are used throughout the resume. More quantification = higher score.

4. **Impact Demonstration (0-100)**: Assess how clearly the resume shows business impact, user impact, or organizational value. Look for outcomes, not just activities.

5. **Conciseness (0-100)**: Evaluate how efficiently information is presented. Good conciseness means clear, scannable content without unnecessary words.

**Keyword Analysis:**
- Identify Product Management keywords that ACTUALLY APPEAR in the resume text (e.g., roadmap, strategy, stakeholders, metrics, OKRs, KPIs, user research, A/B testing, product launch, go-to-market, product-market fit, user experience, data-driven, agile, scrum, sprint, backlog, prioritization, etc.)
- Count the EXACT number of occurrences of each keyword found in the resume
- IMPORTANT: Only include keywords in the "present" array if they have a count greater than 0. Do NOT include keywords with count 0 in the "present" array.
- Identify missing keywords that are commonly expected in PM resumes but are NOT found in the resume (or have count 0)
- Calculate keyword density as: (total count of all PM keywords found) / (total word count of resume) * 100
- Be case-insensitive when matching keywords (e.g., "Stakeholder" and "stakeholder" should be counted together)
- Group similar keywords together (e.g., "stakeholder" and "stakeholders" should be combined into one entry with combined count)

**ATS Compatibility:**
- Evaluate how well the resume will parse through Applicant Tracking Systems
- Consider formatting, keyword usage, standard sections, file structure
- Provide explanation for the rating

**Overall Score:**
- Calculate weighted average: Action Verbs (20%), Accomplishments (25%), Quantification (20%), Impact (25%), Conciseness (10%)
- Round to nearest integer

**Recommendations:**
- Provide 5-7 prioritized recommendations
- Each should be specific, actionable, and include impact level
- Focus on the highest-impact improvements first

**Category Descriptions:**
- Provide 2-3 sentence explanations for each category score
- Explain what's working well and what could be improved

**Resume to Analyze:**

${resumeText}

**Instructions:**
- Be thorough but constructive
- Focus on actionable feedback
- Consider this is for a Product Manager role
- Provide specific examples where possible
- Be honest but encouraging`;
};

// ============================================================================
// TYPES
// ============================================================================

interface TimingData {
  fileUploadMs: number;
  apiCallMs: number;
  pollingMs: number;
  totalMs: number;
  pollAttempts: number;
}

interface ExtractionResult {
  model: string;
  success: boolean;
  timing: TimingData;
  data?: any;
  error?: string;
}

interface AnalysisResult {
  model: string;
  success: boolean;
  timing: Omit<TimingData, 'fileUploadMs'>;
  data?: any;
  error?: string;
}

interface BenchmarkResults {
  timestamp: string;
  pdfFile: string;
  extraction: ExtractionResult[];
  analysis: AnalysisResult[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const log = (message: string) => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${timestamp}] ${message}`);
};

const uploadFileToOpenAI = async (filePath: string): Promise<{ fileId: string; durationMs: number }> => {
  const startTime = Date.now();
  
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: 'application/pdf' });
  
  const formData = new FormData();
  formData.append('file', blob, path.basename(filePath));
  formData.append('purpose', 'assistants');

  const response = await fetch('https://api.openai.com/v1/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`File upload failed: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  return {
    fileId: data.id,
    durationMs: Date.now() - startTime,
  };
};

const deleteFileFromOpenAI = async (fileId: string): Promise<void> => {
  try {
    await fetch(`https://api.openai.com/v1/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
    });
  } catch (error) {
    // Non-fatal, just log
    console.warn(`Warning: Could not delete file ${fileId}`);
  }
};

// Response from initial API call - may be completed immediately or need polling
interface ApiCallResult {
  responseId: string;
  durationMs: number;
  isCompleted: boolean;
  data?: any; // Present if completed immediately
}

const callOpenAIResponses = async (
  model: string,
  payload: any
): Promise<ApiCallResult> => {
  const startTime = Date.now();
  
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model, ...payload }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API call failed: ${JSON.stringify(errorData)}`);
  }

  const responseData = await response.json();
  const durationMs = Date.now() - startTime;
  
  // Check if response is already completed (common for these models)
  if (responseData.status === 'completed') {
    const data = extractOutputFromResponse(responseData);
    return {
      responseId: responseData.id,
      durationMs,
      isCompleted: true,
      data,
    };
  }
  
  return {
    responseId: responseData.id,
    durationMs,
    isCompleted: false,
  };
};

// Helper to extract structured data from OpenAI response
// Handles different response structures from gpt-5.1 vs gpt-5-mini/nano
// - gpt-5.1: output[0] is the message
// - gpt-5-mini/nano: output[0] is "reasoning", output[1] is the "message"
const extractOutputFromResponse = (responseData: any): any => {
  if (!responseData.output || !Array.isArray(responseData.output)) {
    throw new Error('No output array in response');
  }

  // Find the message output item (may be at index 0 or 1 depending on model)
  for (const outputItem of responseData.output) {
    if (outputItem.type === 'message' && outputItem.content) {
      for (const contentItem of outputItem.content) {
        if (contentItem.type === 'output_text' && contentItem.text) {
          try {
            return JSON.parse(contentItem.text);
          } catch (e) {
            // Continue to next content item
          }
        }
        if (contentItem.type === 'refusal' && contentItem.refusal) {
          throw new Error(`OpenAI refused: ${contentItem.refusal}`);
        }
      }
    }
  }

  // Log what we found for debugging
  const outputTypes = responseData.output.map((o: any) => o.type).join(', ');
  throw new Error(`Could not find message output. Output types found: ${outputTypes}`);
};

const pollForCompletion = async (
  responseId: string,
  maxAttempts: number = 60,
  intervalMs: number = 2000
): Promise<{ data: any; durationMs: number; attempts: number }> => {
  const startTime = Date.now();
  let attempts = 0;
  let lastStatusData: any = null;

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, intervalMs));
    attempts++;

    const statusResponse = await fetch(`https://api.openai.com/v1/responses/${responseId}`, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
    });

    if (!statusResponse.ok) {
      const errorData = await statusResponse.json().catch(() => ({}));
      throw new Error(`Status check failed: ${JSON.stringify(errorData)}`);
    }

    const statusData = await statusResponse.json();
    lastStatusData = statusData;
    
    if (statusData.status === 'failed') {
      throw new Error(`OpenAI processing failed: ${JSON.stringify(statusData.error || {})}`);
    }

    if (statusData.status !== 'in_progress' && statusData.status !== 'queued') {
      const data = extractOutputFromResponse(statusData);
      return {
        data,
        durationMs: Date.now() - startTime,
        attempts,
      };
    }
  }

  throw new Error(`Timeout after ${maxAttempts} polling attempts. Last status: ${lastStatusData?.status || 'unknown'}`);
};

// ============================================================================
// BENCHMARK FUNCTIONS
// ============================================================================

const runExtractionBenchmark = async (model: string, fileId: string): Promise<ExtractionResult> => {
  log(`  Running extraction with ${model}...`);
  const totalStart = Date.now();
  
  try {
    // Create request payload
    const payload = {
      input: [
        {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: EXTRACTION_PROMPT,
            },
            {
              type: 'input_file',
              file_id: fileId,
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'resume_data',
          schema: RESUME_EXTRACTION_SCHEMA,
          strict: true,
        },
      },
    };

    // Call OpenAI
    const apiResult = await callOpenAIResponses(model, payload);
    
    let data: any;
    let pollingMs = 0;
    let attempts = 0;
    
    if (apiResult.isCompleted) {
      // Response came back immediately
      log(`    API call completed in ${apiResult.durationMs}ms (immediate response)`);
      data = apiResult.data;
    } else {
      // Need to poll for completion
      log(`    API call completed in ${apiResult.durationMs}ms, polling...`);
      const pollResult = await pollForCompletion(apiResult.responseId);
      data = pollResult.data;
      pollingMs = pollResult.durationMs;
      attempts = pollResult.attempts;
    }
    
    const totalMs = Date.now() - totalStart;
    log(`    ✓ Completed in ${totalMs}ms${attempts > 0 ? ` (${attempts} poll attempts)` : ''}`);

    return {
      model,
      success: true,
      timing: {
        fileUploadMs: 0, // Will be set by caller
        apiCallMs: apiResult.durationMs,
        pollingMs,
        totalMs,
        pollAttempts: attempts,
      },
      data,
    };
  } catch (error) {
    const totalMs = Date.now() - totalStart;
    log(`    ✗ Failed after ${totalMs}ms: ${error instanceof Error ? error.message : String(error)}`);
    
    return {
      model,
      success: false,
      timing: {
        fileUploadMs: 0,
        apiCallMs: 0,
        pollingMs: 0,
        totalMs,
        pollAttempts: 0,
      },
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

const formatResumeText = (extractedData: any): string => {
  const parts: string[] = [];

  // Contact Info
  if (extractedData.contactInfo) {
    parts.push('=== CONTACT INFORMATION ===');
    if (extractedData.contactInfo.full_name) parts.push(`Name: ${extractedData.contactInfo.full_name}`);
    if (extractedData.contactInfo.email) parts.push(`Email: ${extractedData.contactInfo.email}`);
    if (extractedData.contactInfo.phone) parts.push(`Phone: ${extractedData.contactInfo.phone}`);
    if (extractedData.contactInfo.location) parts.push(`Location: ${extractedData.contactInfo.location}`);
    if (extractedData.contactInfo.linkedin) parts.push(`LinkedIn: ${extractedData.contactInfo.linkedin}`);
    if (extractedData.contactInfo.portfolio) parts.push(`Portfolio: ${extractedData.contactInfo.portfolio}`);
    parts.push('');
  }

  // Summary
  if (extractedData.summary) {
    parts.push('=== PROFESSIONAL SUMMARY ===');
    parts.push(extractedData.summary);
    parts.push('');
  }

  // Experiences
  if (extractedData.experiences && extractedData.experiences.length > 0) {
    parts.push('=== WORK EXPERIENCE ===');
    extractedData.experiences.forEach((exp: any) => {
      parts.push(`${exp.title} at ${exp.company}`);
      if (exp.location) parts.push(`Location: ${exp.location}`);
      if (exp.start_date || exp.end_date) {
        parts.push(`Dates: ${exp.start_date || ''} - ${exp.end_date || 'Present'}`);
      }
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach((bullet: string) => {
          parts.push(`  • ${bullet}`);
        });
      }
      parts.push('');
    });
  }

  // Education
  if (extractedData.education && extractedData.education.length > 0) {
    parts.push('=== EDUCATION ===');
    extractedData.education.forEach((edu: any) => {
      parts.push(`${edu.degree} in ${edu.field || 'N/A'}`);
      parts.push(`${edu.school}`);
      if (edu.location) parts.push(`Location: ${edu.location}`);
      if (edu.start_date || edu.end_date) {
        parts.push(`Dates: ${edu.start_date || ''} - ${edu.end_date || ''}`);
      }
      if (edu.gpa) parts.push(`GPA: ${edu.gpa}`);
      if (edu.achievements && edu.achievements.length > 0) {
        edu.achievements.forEach((ach: string) => {
          parts.push(`  • ${ach}`);
        });
      }
      parts.push('');
    });
  }

  // Skills
  if (extractedData.skills) {
    const technical = extractedData.skills.technical || [];
    const product = extractedData.skills.product || [];
    const soft = extractedData.skills.soft || [];

    if (technical.length > 0 || product.length > 0 || soft.length > 0) {
      parts.push('=== SKILLS ===');
      if (technical.length > 0) parts.push(`Technical: ${technical.join(', ')}`);
      if (product.length > 0) parts.push(`Product: ${product.join(', ')}`);
      if (soft.length > 0) parts.push(`Soft: ${soft.join(', ')}`);
      parts.push('');
    }
  }

  return parts.join('\n');
};

const runAnalysisBenchmark = async (model: string, resumeText: string): Promise<AnalysisResult> => {
  log(`  Running analysis with ${model}...`);
  const totalStart = Date.now();
  
  try {
    const prompt = createAnalysisPrompt(resumeText);
    
    const payload = {
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
          name: 'resume_analysis',
          schema: RESUME_ANALYSIS_SCHEMA,
          strict: true,
        },
      },
    };

    // Call OpenAI
    const apiResult = await callOpenAIResponses(model, payload);
    
    let data: any;
    let pollingMs = 0;
    let attempts = 0;
    
    if (apiResult.isCompleted) {
      // Response came back immediately
      log(`    API call completed in ${apiResult.durationMs}ms (immediate response)`);
      data = apiResult.data;
    } else {
      // Need to poll for completion
      log(`    API call completed in ${apiResult.durationMs}ms, polling...`);
      const pollResult = await pollForCompletion(apiResult.responseId);
      data = pollResult.data;
      pollingMs = pollResult.durationMs;
      attempts = pollResult.attempts;
    }
    
    const totalMs = Date.now() - totalStart;
    log(`    ✓ Completed in ${totalMs}ms${attempts > 0 ? ` (${attempts} poll attempts)` : ''}`);

    return {
      model,
      success: true,
      timing: {
        apiCallMs: apiResult.durationMs,
        pollingMs,
        totalMs,
        pollAttempts: attempts,
      },
      data,
    };
  } catch (error) {
    const totalMs = Date.now() - totalStart;
    log(`    ✗ Failed after ${totalMs}ms: ${error instanceof Error ? error.message : String(error)}`);
    
    return {
      model,
      success: false,
      timing: {
        apiCallMs: 0,
        pollingMs: 0,
        totalMs,
        pollAttempts: 0,
      },
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

// ============================================================================
// REPORT GENERATION
// ============================================================================

const generateReport = (results: BenchmarkResults): void => {
  console.log('\n');
  console.log('═'.repeat(80));
  console.log('                    OPENAI MODEL BENCHMARK REPORT');
  console.log('═'.repeat(80));
  console.log(`\nTimestamp: ${results.timestamp}`);
  console.log(`PDF File: ${results.pdfFile}`);

  // Extraction Results
  console.log('\n' + '─'.repeat(80));
  console.log('EXTRACTION BENCHMARK (PDF → Structured Data)');
  console.log('─'.repeat(80));
  console.log('\n┌────────────────┬──────────┬────────────┬────────────┬──────────────┬────────┐');
  console.log('│ Model          │ Status   │ API Call   │ Polling    │ Total Time   │ Polls  │');
  console.log('├────────────────┼──────────┼────────────┼────────────┼──────────────┼────────┤');
  
  for (const result of results.extraction) {
    const status = result.success ? '✓ OK' : '✗ FAIL';
    const apiCall = result.timing.apiCallMs > 0 ? `${result.timing.apiCallMs}ms` : '-';
    const polling = result.timing.pollingMs > 0 ? `${result.timing.pollingMs}ms` : '-';
    const total = `${result.timing.totalMs}ms`;
    const polls = result.timing.pollAttempts > 0 ? String(result.timing.pollAttempts) : '-';
    
    console.log(
      `│ ${result.model.padEnd(14)} │ ${status.padEnd(8)} │ ${apiCall.padStart(10)} │ ${polling.padStart(10)} │ ${total.padStart(12)} │ ${polls.padStart(6)} │`
    );
  }
  console.log('└────────────────┴──────────┴────────────┴────────────┴──────────────┴────────┘');

  // Extraction Data Quality
  console.log('\nExtraction Quality Summary:');
  for (const result of results.extraction) {
    if (result.success && result.data) {
      const expCount = result.data.experiences?.length || 0;
      const bulletCount = result.data.experiences?.reduce((sum: number, exp: any) => sum + (exp.bullets?.length || 0), 0) || 0;
      const eduCount = result.data.education?.length || 0;
      const skillCount = (result.data.skills?.technical?.length || 0) + 
                         (result.data.skills?.product?.length || 0) + 
                         (result.data.skills?.soft?.length || 0);
      console.log(`  ${result.model}: ${expCount} experiences, ${bulletCount} bullets, ${eduCount} education, ${skillCount} skills`);
    } else if (!result.success) {
      console.log(`  ${result.model}: FAILED - ${result.error?.substring(0, 50)}...`);
    }
  }

  // Analysis Results
  console.log('\n' + '─'.repeat(80));
  console.log('ANALYSIS BENCHMARK (Resume Text → PM Analysis)');
  console.log('─'.repeat(80));
  console.log('\n┌────────────────┬──────────┬────────────┬────────────┬──────────────┬────────┐');
  console.log('│ Model          │ Status   │ API Call   │ Polling    │ Total Time   │ Polls  │');
  console.log('├────────────────┼──────────┼────────────┼────────────┼──────────────┼────────┤');
  
  for (const result of results.analysis) {
    const status = result.success ? '✓ OK' : '✗ FAIL';
    const apiCall = result.timing.apiCallMs > 0 ? `${result.timing.apiCallMs}ms` : '-';
    const polling = result.timing.pollingMs > 0 ? `${result.timing.pollingMs}ms` : '-';
    const total = `${result.timing.totalMs}ms`;
    const polls = result.timing.pollAttempts > 0 ? String(result.timing.pollAttempts) : '-';
    
    console.log(
      `│ ${result.model.padEnd(14)} │ ${status.padEnd(8)} │ ${apiCall.padStart(10)} │ ${polling.padStart(10)} │ ${total.padStart(12)} │ ${polls.padStart(6)} │`
    );
  }
  console.log('└────────────────┴──────────┴────────────┴────────────┴──────────────┴────────┘');

  // Analysis Scores Comparison
  console.log('\nAnalysis Quality Comparison:');
  console.log('\n┌────────────────┬─────────┬─────────────┬────────────────┬───────────┬─────────────┬─────────────┐');
  console.log('│ Model          │ Overall │ ActionVerbs │ Accomplishments│ Quantify  │ Impact      │ Concise     │');
  console.log('├────────────────┼─────────┼─────────────┼────────────────┼───────────┼─────────────┼─────────────┤');
  
  for (const result of results.analysis) {
    if (result.success && result.data) {
      const scores = result.data.categoryScores;
      console.log(
        `│ ${result.model.padEnd(14)} │ ${String(result.data.overallScore).padStart(7)} │ ${String(scores.actionVerbs).padStart(11)} │ ${String(scores.accomplishments).padStart(14)} │ ${String(scores.quantification).padStart(9)} │ ${String(scores.impact).padStart(11)} │ ${String(scores.conciseness).padStart(11)} │`
      );
    } else {
      console.log(
        `│ ${result.model.padEnd(14)} │ ${'N/A'.padStart(7)} │ ${'N/A'.padStart(11)} │ ${'N/A'.padStart(14)} │ ${'N/A'.padStart(9)} │ ${'N/A'.padStart(11)} │ ${'N/A'.padStart(11)} │`
      );
    }
  }
  console.log('└────────────────┴─────────┴─────────────┴────────────────┴───────────┴─────────────┴─────────────┘');

  // ATS Compatibility
  console.log('\nATS Compatibility:');
  for (const result of results.analysis) {
    if (result.success && result.data) {
      console.log(`  ${result.model}: ${result.data.atsCompatibility}`);
    } else {
      console.log(`  ${result.model}: N/A`);
    }
  }

  // Summary
  console.log('\n' + '─'.repeat(80));
  console.log('SUMMARY');
  console.log('─'.repeat(80));

  const successfulExtractions = results.extraction.filter(r => r.success);
  const successfulAnalyses = results.analysis.filter(r => r.success);

  if (successfulExtractions.length > 0) {
    const fastest = successfulExtractions.reduce((a, b) => a.timing.totalMs < b.timing.totalMs ? a : b);
    const slowest = successfulExtractions.reduce((a, b) => a.timing.totalMs > b.timing.totalMs ? a : b);
    console.log(`\nExtraction:`);
    console.log(`  Fastest: ${fastest.model} (${fastest.timing.totalMs}ms)`);
    console.log(`  Slowest: ${slowest.model} (${slowest.timing.totalMs}ms)`);
    console.log(`  Speed difference: ${((slowest.timing.totalMs / fastest.timing.totalMs - 1) * 100).toFixed(1)}% slower`);
  }

  if (successfulAnalyses.length > 0) {
    const fastest = successfulAnalyses.reduce((a, b) => a.timing.totalMs < b.timing.totalMs ? a : b);
    const slowest = successfulAnalyses.reduce((a, b) => a.timing.totalMs > b.timing.totalMs ? a : b);
    console.log(`\nAnalysis:`);
    console.log(`  Fastest: ${fastest.model} (${fastest.timing.totalMs}ms)`);
    console.log(`  Slowest: ${slowest.model} (${slowest.timing.totalMs}ms)`);
    console.log(`  Speed difference: ${((slowest.timing.totalMs / fastest.timing.totalMs - 1) * 100).toFixed(1)}% slower`);
  }

  console.log('\n' + '═'.repeat(80));
  console.log(`Results saved to: ${RESULTS_PATH}`);
  console.log('═'.repeat(80) + '\n');
};

// ============================================================================
// MAIN
// ============================================================================

const main = async () => {
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('  OPENAI MODEL BENCHMARK');
  console.log('  Testing: ' + MODELS_TO_TEST.join(', '));
  console.log('═'.repeat(60));

  // Validate environment
  if (!OPENAI_API_KEY) {
    console.error('Error: OPEN_AI_SECRET_KEY not found in .env.local');
    process.exit(1);
  }

  if (!fs.existsSync(PDF_PATH)) {
    console.error(`Error: PDF file not found at ${PDF_PATH}`);
    process.exit(1);
  }

  log('Starting benchmark...');

  const results: BenchmarkResults = {
    timestamp: new Date().toISOString(),
    pdfFile: PDF_PATH,
    extraction: [],
    analysis: [],
  };

  // Step 1: Upload PDF to OpenAI once
  log('\n📄 Uploading PDF to OpenAI...');
  let fileUploadDuration: number;
  let fileId: string;
  
  try {
    const upload = await uploadFileToOpenAI(PDF_PATH);
    fileId = upload.fileId;
    fileUploadDuration = upload.durationMs;
    log(`   ✓ File uploaded in ${fileUploadDuration}ms (ID: ${fileId})`);
  } catch (error) {
    console.error(`   ✗ File upload failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  // Step 2: Run extraction benchmark for each model
  log('\n📊 EXTRACTION BENCHMARK');
  log('─'.repeat(40));
  
  for (const model of MODELS_TO_TEST) {
    const result = await runExtractionBenchmark(model, fileId);
    result.timing.fileUploadMs = fileUploadDuration;
    results.extraction.push(result);
  }

  // Clean up the uploaded file
  await deleteFileFromOpenAI(fileId);
  log('   File deleted from OpenAI');

  // Step 3: Get resume text for analysis (use first successful extraction)
  const successfulExtraction = results.extraction.find(r => r.success);
  if (!successfulExtraction) {
    console.error('\nNo successful extractions - cannot run analysis benchmark');
    // Save partial results
    fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2));
    generateReport(results);
    process.exit(1);
  }

  const resumeText = formatResumeText(successfulExtraction.data);

  // Step 4: Run analysis benchmark for each model
  log('\n📈 ANALYSIS BENCHMARK');
  log('─'.repeat(40));
  
  for (const model of MODELS_TO_TEST) {
    const result = await runAnalysisBenchmark(model, resumeText);
    results.analysis.push(result);
  }

  // Step 5: Save results and generate report
  fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2));
  generateReport(results);
};

// Run the benchmark
main().catch((error) => {
  console.error('Benchmark failed:', error);
  process.exit(1);
});

