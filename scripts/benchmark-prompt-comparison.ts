/**
 * Prompt Comparison Benchmark
 * 
 * Compares FULL analysis prompt vs SLIM (onboarding-only) prompt for gpt-5.1
 * 
 * Usage: npx tsx scripts/benchmark-prompt-comparison.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

config({ path: '.env.local' });

const OPENAI_API_KEY = process.env.OPEN_AI_SECRET_KEY;
const MODEL = 'gpt-5.1';

// ============================================================================
// SCHEMAS
// ============================================================================

// FULL schema (current implementation)
const FULL_ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    overallScore: { type: 'integer', minimum: 0, maximum: 100 },
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
    atsCompatibility: { type: 'string', enum: ['Good', 'Fair', 'Poor'] },
    atsExplanation: { type: 'string' },
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

// SLIM schema (only what's needed for onboarding display)
const SLIM_ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    overallScore: { type: 'integer', minimum: 0, maximum: 100 },
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
    missingKeywords: {
      type: 'array',
      items: { type: 'string' },
      maxItems: 15,
    },
  },
  required: ['overallScore', 'categoryScores', 'missingKeywords'],
};

// ============================================================================
// PROMPTS
// ============================================================================

// FULL prompt (current implementation)
const createFullPrompt = (resumeText: string): string => {
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

// SLIM prompt (optimized for speed - only what's needed for onboarding)
const createSlimPrompt = (resumeText: string): string => {
  return `You are an expert PM resume reviewer. Quickly evaluate this resume and provide scores.

**Score these categories (0-100):**
1. **Action Verbs**: Strong verbs like "Led", "Drove" score higher than "Helped", "Worked on"
2. **Accomplishments**: Concrete achievements with results vs just responsibilities
3. **Quantification**: Use of numbers, percentages, metrics throughout
4. **Impact**: Clear business/user impact demonstration
5. **Conciseness**: Efficient, scannable presentation

**Overall Score:** Weighted average: Action Verbs 20%, Accomplishments 25%, Quantification 20%, Impact 25%, Conciseness 10%

**Missing Keywords:** List up to 15 important PM keywords NOT present in the resume (e.g., stakeholders, OKRs, go-to-market, agile, backlog, etc.)

**Resume:**
${resumeText}

Be direct and concise. Focus only on scoring.`;
};

// CRITICAL prompt (strict evaluation - drives conversions by showing room for improvement)
const createCriticalPrompt = (resumeText: string): string => {
  return `You are a STRICT expert PM resume reviewer. Evaluate this resume critically - most resumes score 70-85, only exceptional ones reach 90+.

**Score STRICTLY (0-100):**

1. **Action Verbs (0-100):**
   - 90+: Every bullet starts with powerful, varied verbs (Spearheaded, Orchestrated, Drove, Transformed)
   - 80-89: Strong verbs but some repetition or occasional weak verbs
   - 70-79: Mix of strong and generic verbs (Created, Managed, Worked on)
   - Below 70: Mostly weak/passive verbs

2. **Accomplishments (0-100):**
   - 90+: Every bullet shows measurable business outcomes, not just activities
   - 80-89: Most bullets show results, a few are activity-focused
   - 70-79: Some results, but many bullets describe duties without outcomes
   - Below 70: Mostly responsibilities, few concrete achievements

3. **Quantification (0-100):**
   - 90+: 80%+ of bullets have specific numbers, percentages, or metrics
   - 80-89: 60-80% quantified, some bullets lack data
   - 70-79: 40-60% quantified, many opportunities missed
   - Below 70: Under 40% quantified

4. **Impact (0-100):**
   - 90+: Clear business/user/revenue impact in every role, shows scale
   - 80-89: Good impact shown but missing context (team size, user base, revenue)
   - 70-79: Some impact but often vague or lacks business connection
   - Below 70: Activities described without showing why they mattered

5. **Conciseness (0-100):**
   - 90+: Every word serves a purpose, no redundancy, highly scannable
   - 80-89: Generally tight but some wordy bullets or duplicated content
   - 70-79: Several long bullets, some redundancy across roles
   - Below 70: Verbose, hard to scan, significant redundancy

**Overall Score:** Calculate weighted average: Action Verbs 20%, Accomplishments 25%, Quantification 20%, Impact 25%, Conciseness 10%. Round to integer.

**Missing Keywords:** List 10-15 PM keywords NOT found (stakeholders, OKRs, go-to-market, agile, scrum, backlog, prioritization framework, product-market fit, user stories, competitive analysis, roadmap ownership, sprint, customer journey, data-driven, etc.)

**Resume:**
${resumeText}

Score RIGOROUSLY. Identify real gaps. Be honest about weaknesses.`;
};

// ============================================================================
// HELPERS
// ============================================================================

const log = (msg: string) => {
  const time = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${time}] ${msg}`);
};

// Extract output from response (handles reasoning models)
const extractOutput = (response: any): any => {
  if (!response.output || !Array.isArray(response.output)) {
    throw new Error('No output array');
  }
  for (const item of response.output) {
    if (item.type === 'message' && item.content) {
      for (const content of item.content) {
        if (content.type === 'output_text' && content.text) {
          return JSON.parse(content.text);
        }
      }
    }
  }
  throw new Error('Could not extract output');
};

// Call OpenAI and get result
const callOpenAI = async (prompt: string, schema: any, schemaName: string): Promise<{
  data: any;
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
}> => {
  const startTime = Date.now();

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      input: [{
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text: prompt }],
      }],
      text: {
        format: {
          type: 'json_schema',
          name: schemaName,
          schema,
          strict: true,
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`API error: ${JSON.stringify(error)}`);
  }

  const responseData = await response.json();
  const durationMs = Date.now() - startTime;

  const data = extractOutput(responseData);

  return {
    data,
    durationMs,
    inputTokens: responseData.usage?.input_tokens || 0,
    outputTokens: responseData.usage?.output_tokens || 0,
  };
};

// ============================================================================
// SAMPLE RESUME TEXT (extracted from previous benchmark)
// ============================================================================

const RESUME_TEXT = `=== CONTACT INFORMATION ===
Name: Anthony Saltarelli
Email: anth.saltarelli@gmail.com
Phone: (203) 722 - 3285
Location: New York, NY
Portfolio: anthonysaltarelli.com

=== WORK EXPERIENCE ===
Lead Product Manager at SageSpot
Location: New York, NY
Dates: March 2022 - Present
  • Defined, executed, and iterated product strategy in collaboration with CEO, CTO, and broader team
  • Launched several key Creator tools including Subscriptions, Livestreams, Libraries, and Engage Forums
  • Increased member account creation rate by 44% and subscription rate by 60%
  • De-risked new feature work by creating dozens of wireframes and prototypes to test with user panel
  • Decreased time to production for new features by 2-3x by religiously prioritizing MVP functionality
  • Built out analytics eventing and dashboards to track user behavior, KPIs, and inform product decisions
  • Created automated re-engagement email campaigns, leading to a 38% increase in users posting content
  • Interviewed users to explore problem & opportunity spaces, leading to more impactful product solutions
  • Delivered monthly product roadmap report citing metric changes, wins, and new problems to tackle

Senior Product Manager, Commerce at Squarespace
Location: New York, NY
Dates: September 2021 - March 2022
  • Launched and executed our product strategy for Squarespace Scheduling, the first standalone product offering on SQSP outside of their flagship Website product, after SQSP acquired Acuity Scheduling
  • Increased YoY trial to subscription rate of Scheduling by 47% by A/B testing multiple UX improvements
  • Expanded the Squarespace Scheduling product offering by introducing Invoicing functionality
  • Updated Payment Settings, leading to 130% increase in Payment Processor connections & $1.2MM+ ARR
  • Conducted user research to better understand user problems, validate, and de-risk product solutions
  • Built out Enterprise Scheduling, leading to 15+ new Enterprise contracts, increased Enterprise ARR by 5x
  • Maintained strategic partner relationships with Meta, Twilio, Square, and other vendors

Product Manager, Commerce at Squarespace
Location: New York, NY
Dates: June 2020 - September 2021
  • Launched and executed our product strategy for Squarespace Scheduling
  • Increased YoY trial to subscription rate of Scheduling by 47% by A/B testing multiple UX improvements
  • Expanded the Squarespace Scheduling product offering by introducing Invoicing functionality
  • Updated Payment Settings, leading to 130% increase in Payment Processor connections & $1.2MM+ ARR
  • Conducted user research to better understand user problems, validate, and de-risk product solutions
  • Built out Enterprise Scheduling, leading to 15+ new Enterprise contracts, increased Enterprise ARR by 5x
  • Maintained strategic partner relationships with Meta, Twilio, Square, and other vendors

Associate Product Manager, Mobile at SeatGeek
Location: New York, NY
Dates: June 2018 - April 2020
  • Led planning and development of various features and experiments in the iOS and Android apps focused on event discovery, core shopping funnel, and checkout that increased checkout conversion by 19% YoY
  • Created and managed the mobile product roadmap in collaboration with engineering leads
  • Defined and built out a native sharing strategy that increased event shares by 132% YoY
  • Introduced in-app rating feature that increased SeatGeek's Android Play Store rating from 3.7 to 4.6 stars
  • Reduced mobile customer support inquires by 44% by shipping native customer support workflow
  • Defined KPIs and set up various analytics dashboards to track overall product health and feature usage
  • Designed wireframes and created prototypes for 40+ consumer and enterprise features

Founder & Engineer at Stand Up Tech, LLC
Dates: February 2015 - May 2018
  • Developed Stand Up For Change, an iOS App to empower users to engage in political process and The Networking Assistant, a CRM platform to organize contacts and interactions, acquired 4,000+ users
  • Developed Chin Up!, a positive social media iOS App which had 6,000+ downloads & 45,000+ user posts

=== EDUCATION ===
Bachelor of Arts in Computer Science
College of the Holy Cross
Location: Worcester, MA
GPA: 3.25
  • Student Government
  • Campus Activities Board
  • Resident Assistant
  • Orientation Leader

=== SKILLS ===
Technical: Figma, Sketch, Invision, Amplitude, Google Analytics, Maze, UserTesting, Jira, Github, Airtable, A/B Testing & Analysis, SQL, Python
Product: A/B Testing & Analysis, User research, Product strategy, Roadmapping, Wireframing, Prototyping, Analytics dashboards, Experimentation
Soft: Collaboration with executives, Cross-functional collaboration, User interviewing, Strategic partner management, Roadmap communication, Prioritization, Leadership`;

// ============================================================================
// MAIN
// ============================================================================

const main = async () => {
  console.log('\n');
  console.log('═'.repeat(70));
  console.log('  PROMPT COMPARISON BENCHMARK (gpt-5.1 only)');
  console.log('  Testing: FULL vs SLIM vs CRITICAL');
  console.log('═'.repeat(70));

  if (!OPENAI_API_KEY) {
    console.error('Error: OPEN_AI_SECRET_KEY not found');
    process.exit(1);
  }

  const results: any = {
    timestamp: new Date().toISOString(),
    model: MODEL,
    full: null,
    slim: null,
    critical: null,
  };

  // Test 1: FULL prompt
  log('\n📊 Testing FULL analysis prompt...');
  try {
    const fullPrompt = createFullPrompt(RESUME_TEXT);
    log(`   Prompt length: ${fullPrompt.length} chars`);
    
    const fullResult = await callOpenAI(fullPrompt, FULL_ANALYSIS_SCHEMA, 'resume_analysis_full');
    
    log(`   ✓ Completed in ${fullResult.durationMs}ms`);
    log(`   Tokens: ${fullResult.inputTokens} in / ${fullResult.outputTokens} out`);
    
    results.full = {
      success: true,
      durationMs: fullResult.durationMs,
      inputTokens: fullResult.inputTokens,
      outputTokens: fullResult.outputTokens,
      promptLength: fullPrompt.length,
      data: fullResult.data,
    };
  } catch (error) {
    log(`   ✗ Failed: ${error instanceof Error ? error.message : String(error)}`);
    results.full = { success: false, error: String(error) };
  }

  // Test 2: SLIM prompt
  log('\n📊 Testing SLIM analysis prompt...');
  try {
    const slimPrompt = createSlimPrompt(RESUME_TEXT);
    log(`   Prompt length: ${slimPrompt.length} chars`);
    
    const slimResult = await callOpenAI(slimPrompt, SLIM_ANALYSIS_SCHEMA, 'resume_analysis_slim');
    
    log(`   ✓ Completed in ${slimResult.durationMs}ms`);
    log(`   Tokens: ${slimResult.inputTokens} in / ${slimResult.outputTokens} out`);
    
    results.slim = {
      success: true,
      durationMs: slimResult.durationMs,
      inputTokens: slimResult.inputTokens,
      outputTokens: slimResult.outputTokens,
      promptLength: slimPrompt.length,
      data: slimResult.data,
    };
  } catch (error) {
    log(`   ✗ Failed: ${error instanceof Error ? error.message : String(error)}`);
    results.slim = { success: false, error: String(error) };
  }

  // Test 3: CRITICAL prompt
  log('\n📊 Testing CRITICAL analysis prompt...');
  try {
    const criticalPrompt = createCriticalPrompt(RESUME_TEXT);
    log(`   Prompt length: ${criticalPrompt.length} chars`);
    
    const criticalResult = await callOpenAI(criticalPrompt, SLIM_ANALYSIS_SCHEMA, 'resume_analysis_critical');
    
    log(`   ✓ Completed in ${criticalResult.durationMs}ms`);
    log(`   Tokens: ${criticalResult.inputTokens} in / ${criticalResult.outputTokens} out`);
    
    results.critical = {
      success: true,
      durationMs: criticalResult.durationMs,
      inputTokens: criticalResult.inputTokens,
      outputTokens: criticalResult.outputTokens,
      promptLength: criticalPrompt.length,
      data: criticalResult.data,
    };
  } catch (error) {
    log(`   ✗ Failed: ${error instanceof Error ? error.message : String(error)}`);
    results.critical = { success: false, error: String(error) };
  }

  // Save results
  const resultsPath = path.join(process.cwd(), 'scripts/prompt-comparison-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

  // Print report
  console.log('\n');
  console.log('═'.repeat(70));
  console.log('  RESULTS');
  console.log('═'.repeat(70));

  console.log('\n┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐');
  console.log('│ Prompt       │ Duration     │ Input Tokens │ Output Tokens│ Prompt Chars │');
  console.log('├──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤');
  
  if (results.full?.success) {
    console.log(`│ FULL         │ ${String(results.full.durationMs + 'ms').padStart(12)} │ ${String(results.full.inputTokens).padStart(12)} │ ${String(results.full.outputTokens).padStart(12)} │ ${String(results.full.promptLength).padStart(12)} │`);
  }
  if (results.slim?.success) {
    console.log(`│ SLIM         │ ${String(results.slim.durationMs + 'ms').padStart(12)} │ ${String(results.slim.inputTokens).padStart(12)} │ ${String(results.slim.outputTokens).padStart(12)} │ ${String(results.slim.promptLength).padStart(12)} │`);
  }
  if (results.critical?.success) {
    console.log(`│ CRITICAL     │ ${String(results.critical.durationMs + 'ms').padStart(12)} │ ${String(results.critical.inputTokens).padStart(12)} │ ${String(results.critical.outputTokens).padStart(12)} │ ${String(results.critical.promptLength).padStart(12)} │`);
  }
  console.log('└──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘');

  if (results.full?.success && results.critical?.success) {
    const speedup = ((results.full.durationMs - results.critical.durationMs) / results.full.durationMs * 100).toFixed(1);
    console.log(`\n⚡ CRITICAL is ${speedup}% faster than FULL (${results.full.durationMs - results.critical.durationMs}ms saved)`);
  }

  // Score comparison
  console.log('\n📈 SCORE COMPARISON:');
  console.log('┌──────────────────────┬──────────┬──────────┬──────────┐');
  console.log('│ Category             │ FULL     │ SLIM     │ CRITICAL │');
  console.log('├──────────────────────┼──────────┼──────────┼──────────┤');
  
  const fullData = results.full?.data;
  const slimData = results.slim?.data;
  const critData = results.critical?.data;
  
  const getScore = (data: any, path: string) => data ? String(path.split('.').reduce((o, k) => o?.[k], data) ?? 'N/A').padStart(8) : '     N/A';
  
  console.log(`│ Overall Score        │ ${getScore(fullData, 'overallScore')} │ ${getScore(slimData, 'overallScore')} │ ${getScore(critData, 'overallScore')} │`);
  console.log(`│ Action Verbs         │ ${getScore(fullData, 'categoryScores.actionVerbs')} │ ${getScore(slimData, 'categoryScores.actionVerbs')} │ ${getScore(critData, 'categoryScores.actionVerbs')} │`);
  console.log(`│ Accomplishments      │ ${getScore(fullData, 'categoryScores.accomplishments')} │ ${getScore(slimData, 'categoryScores.accomplishments')} │ ${getScore(critData, 'categoryScores.accomplishments')} │`);
  console.log(`│ Quantification       │ ${getScore(fullData, 'categoryScores.quantification')} │ ${getScore(slimData, 'categoryScores.quantification')} │ ${getScore(critData, 'categoryScores.quantification')} │`);
  console.log(`│ Impact               │ ${getScore(fullData, 'categoryScores.impact')} │ ${getScore(slimData, 'categoryScores.impact')} │ ${getScore(critData, 'categoryScores.impact')} │`);
  console.log(`│ Conciseness          │ ${getScore(fullData, 'categoryScores.conciseness')} │ ${getScore(slimData, 'categoryScores.conciseness')} │ ${getScore(critData, 'categoryScores.conciseness')} │`);
  console.log('└──────────────────────┴──────────┴──────────┴──────────┘');

  // Missing keywords
  const fullMissing = fullData?.keywordAnalysis?.missing?.length || 0;
  const slimMissing = slimData?.missingKeywords?.length || 0;
  const critMissing = critData?.missingKeywords?.length || 0;
  console.log(`\n🔑 Missing Keywords: FULL=${fullMissing}, SLIM=${slimMissing}, CRITICAL=${critMissing}`);
  
  if (critData?.missingKeywords) {
    console.log(`   CRITICAL keywords: ${critData.missingKeywords.slice(0, 5).join(', ')}...`);
  }

  // Analysis of score alignment
  if (fullData && critData) {
    console.log('\n📊 CRITICAL vs FULL alignment:');
    const categories = ['actionVerbs', 'accomplishments', 'quantification', 'impact', 'conciseness'];
    let totalDiff = 0;
    categories.forEach(cat => {
      const diff = Math.abs((fullData.categoryScores?.[cat] || 0) - (critData.categoryScores?.[cat] || 0));
      totalDiff += diff;
      const arrow = diff <= 3 ? '✓' : diff <= 7 ? '~' : '✗';
      console.log(`   ${arrow} ${cat}: diff=${diff}`);
    });
    console.log(`   Average difference: ${(totalDiff / categories.length).toFixed(1)} points`);
  }

  console.log('\n═'.repeat(70));
  console.log(`Results saved to: ${resultsPath}`);
  console.log('═'.repeat(70) + '\n');
};

main().catch(console.error);

