/**
 * Perplexity API Utility Functions
 * 
 * Handles communication with Perplexity API for company research
 */

const PERPLEXITY_API_BASE = 'https://api.perplexity.ai';
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

if (!PERPLEXITY_API_KEY) {
  console.warn('PERPLEXITY_API_KEY is not set in environment variables');
}

export type ResearchType = 
  | 'mission'
  | 'values'
  | 'origin_story'
  | 'product'
  | 'user_types'
  | 'competition'
  | 'risks'
  | 'recent_launches'
  | 'strategy'
  | 'funding'
  | 'partnerships'
  | 'customer_feedback'
  | 'business_model';

interface PerplexityResponse {
  id: string;
  model: string;
  created: number;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    search_context_size?: string;
    cost?: {
      total_cost: number;
    };
  };
  citations?: string[];
  search_results?: Array<{
    title: string;
    url: string;
    date?: string;
    last_updated?: string;
    snippet?: string;
    source?: string;
  }>;
  object: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
}

/**
 * Generate research query for a specific research type
 */
const getResearchQuery = (companyName: string, researchType: ResearchType): string => {
  const queries: Record<ResearchType, string> = {
    mission: `Provide a detailed summary of the mission statement for ${companyName}. Focus on what the company aims to achieve, its purpose, and how it seeks to impact its customers or the broader community. If available, include direct quotes from the company's official resources or leadership.`,
    values: `Provide a comprehensive overview of ${companyName}'s core values and culture principles. Include how these values are reflected in the company's operations, employee experience, and customer interactions.`,
    origin_story: `Tell the founding story and early history of ${companyName}. Include information about the founders, the problem they were solving, key milestones in the company's early years, and how the company evolved.`,
    product: `Provide a detailed overview of ${companyName}'s product portfolio and offerings. Include their main products or services, key features, target markets, and how their products have evolved over time.`,
    user_types: `Describe ${companyName}'s target users and customer segments. Include demographics, psychographics, user personas, and how the company understands and serves different user types.`,
    competition: `Analyze ${companyName}'s competitive landscape. Include main competitors, competitive positioning, market share, and how ${companyName} differentiates itself in the market.`,
    risks: `Identify and analyze the key business risks and challenges facing ${companyName}. Include regulatory risks, market risks, operational risks, and competitive threats.`,
    recent_launches: `Provide information about ${companyName}'s recent product launches, feature updates, and major announcements from the past 12 months. Include dates, descriptions, and impact.`,
    strategy: `Analyze ${companyName}'s strategic direction and priorities. Include their strategic goals, key initiatives, market expansion plans, and long-term vision.`,
    funding: `Provide a comprehensive overview of ${companyName}'s funding and investment history. Include funding rounds, investors, valuations, and current financial status if available.`,
    partnerships: `Identify and describe ${companyName}'s key partnerships and strategic alliances. Include partnership types, partner companies, and how these partnerships benefit the company.`,
    customer_feedback: `Summarize customer feedback, reviews, and sentiment about ${companyName}. Include common themes in reviews, customer satisfaction trends, and notable customer experiences.`,
    business_model: `Explain ${companyName}'s business model and revenue streams. Include how the company makes money, pricing strategies, revenue sources, and monetization approaches.`,
  };

  return queries[researchType];
};

/**
 * Call Perplexity API to generate research
 */
export const generateResearch = async (
  companyName: string,
  researchType: ResearchType
): Promise<PerplexityResponse> => {
  console.log(`[generateResearch] Starting for ${companyName} - ${researchType}`);
  
  if (!PERPLEXITY_API_KEY) {
    console.error('[generateResearch] PERPLEXITY_API_KEY is not configured');
    throw new Error('PERPLEXITY_API_KEY is not configured');
  }

  const query = getResearchQuery(companyName, researchType);
  console.log(`[generateResearch] Query length: ${query.length} characters`);

  console.log(`[generateResearch] Calling Perplexity API...`);
  const response = await fetch(`${PERPLEXITY_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        {
          role: 'user',
          content: query,
        },
      ],
      temperature: 0.2,
      max_tokens: 1000,
    }),
  });

  console.log(`[generateResearch] Response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[generateResearch] Perplexity API error: ${response.status} - ${errorText}`);
    throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log(`[generateResearch] Success! Response ID: ${data.id}`);
  return data;
};

/**
 * Check if research is still valid (within 7 days)
 */
export const isResearchValid = (generatedAt: string): boolean => {
  const generated = new Date(generatedAt);
  const now = new Date();
  const daysDiff = (now.getTime() - generated.getTime()) / (1000 * 60 * 60 * 24);
  return daysDiff < 7;
};

/**
 * All research types
 */
export const ALL_RESEARCH_TYPES: ResearchType[] = [
  'mission',
  'values',
  'origin_story',
  'product',
  'user_types',
  'competition',
  'risks',
  'recent_launches',
  'strategy',
  'funding',
  'partnerships',
  'customer_feedback',
  'business_model',
];

