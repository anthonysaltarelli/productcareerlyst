// Types for job-specific mock interviews

/**
 * Question categories for job-specific interviews
 */
export type JobQuestionCategory =
  | 'company'      // "Why do you want to work at [Company]?"
  | 'role'         // Based on job description requirements
  | 'industry'     // Market challenges, competitive landscape
  | 'behavioral'   // PM behavioral questions contextualized to role
  | 'product_sense'; // Product thinking related to company's products

/**
 * A generated question for a job-specific interview
 */
export interface GeneratedJobQuestion {
  question: string;
  category: JobQuestionCategory;
  rationale: string; // Why this question is relevant to the job/company
}

/**
 * Context snapshot stored with the interview for evaluation
 */
export interface JobInterviewContext {
  companyName: string;
  companyId: string;
  jobTitle: string;
  jobApplicationId: string;
  descriptionSnippet: string; // First ~500 chars of job description
  generatedAt: string; // ISO timestamp
}

/**
 * Response from the generate-questions API
 */
export interface GenerateQuestionsResponse {
  success: boolean;
  questions: GeneratedJobQuestion[];
  jobContext: {
    companyName: string;
    jobTitle: string;
    descriptionSnippet: string;
  };
  error?: string;
}

/**
 * Request body for the generate-questions API
 */
export interface GenerateQuestionsRequest {
  jobApplicationId: string;
}

/**
 * Request body for the job-specific start API
 */
export interface StartJobInterviewRequest {
  jobApplicationId: string;
  questions: GeneratedJobQuestion[];
}

/**
 * Response from the job-specific start API
 */
export interface StartJobInterviewResponse {
  success: boolean;
  interviewId: string;
  callId: string;
  livekitUrl: string;
  livekitToken: string;
  jobContext: {
    companyName: string;
    jobTitle: string;
  };
  error?: string;
}

/**
 * Skills evaluated for job-specific interviews
 */
export const JOB_SPECIFIC_SKILLS = [
  'Company Knowledge & Enthusiasm',
  'Role Fit & Relevant Experience',
  'Industry/Market Awareness',
  'Story Structure & Clarity',
  'Impact & Results Orientation',
  'Communication & Executive Presence',
] as const;

export type JobSpecificSkill = typeof JOB_SPECIFIC_SKILLS[number];

/**
 * Skill evaluation for job-specific interviews
 */
export interface JobSpecificSkillEvaluation {
  skillName: JobSpecificSkill;
  score: number; // 1-4, half-points allowed (e.g., 2.5)
  explanation: string;
  supportingQuotes: string[];
}

/**
 * Overall evaluation for job-specific interviews
 */
export interface JobSpecificEvaluation {
  skills: JobSpecificSkillEvaluation[];
  overallVerdict: 'Strong Hire' | 'Hire' | 'No Hire' | 'Strong No Hire';
  overallExplanation: string;
  recommendedImprovements: string[];
  companyFitAssessment: string; // Specific feedback on fit for this company/role
  evaluatedAt: string; // ISO timestamp
  modelVersion: string;
  jobContext: JobInterviewContext;
}

/**
 * JSON Schema for OpenAI structured output - question generation
 */
export const JOB_QUESTIONS_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          question: { type: 'string' },
          category: {
            type: 'string',
            enum: ['company', 'role', 'industry', 'behavioral', 'product_sense'],
          },
          rationale: { type: 'string' },
        },
        required: ['question', 'category', 'rationale'],
      },
      minItems: 5,
      maxItems: 7,
    },
  },
  required: ['questions'],
};

/**
 * JSON Schema for OpenAI structured output - job-specific evaluation
 */
export const JOB_EVALUATION_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    skills: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          skillName: {
            type: 'string',
            enum: JOB_SPECIFIC_SKILLS,
          },
          score: { type: 'number', minimum: 1, maximum: 4 },
          explanation: { type: 'string' },
          supportingQuotes: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['skillName', 'score', 'explanation', 'supportingQuotes'],
      },
      minItems: 6,
      maxItems: 6,
    },
    overallVerdict: {
      type: 'string',
      enum: ['Strong Hire', 'Hire', 'No Hire', 'Strong No Hire'],
    },
    overallExplanation: { type: 'string' },
    recommendedImprovements: {
      type: 'array',
      items: { type: 'string' },
      minItems: 2,
      maxItems: 5,
    },
    companyFitAssessment: { type: 'string' },
  },
  required: [
    'skills',
    'overallVerdict',
    'overallExplanation',
    'recommendedImprovements',
    'companyFitAssessment',
  ],
};
