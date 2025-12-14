// Score values: 1, 1.5, 2, 2.5, 3, 3.5, 4
export type SkillScore = 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4;

export type OverallVerdict = 'Strong No Hire' | 'No Hire' | 'Hire' | 'Strong Hire';

export interface SkillEvaluation {
  skillName: string;
  score: number; // 1-4, half points allowed
  explanation: string;
  supportingQuotes: string[];
}

export interface AIBehavioralEvaluation {
  skills: SkillEvaluation[];
  overallVerdict: OverallVerdict;
  overallExplanation: string;
  recommendedImprovements: string[];
  evaluatedAt: string; // ISO timestamp
  modelVersion: string; // e.g., "gpt-5.1"
}

// The 12 behavioral skills to evaluate
export const BEHAVIORAL_SKILLS = [
  'Story Structure & Clarity',
  'Ownership & Accountability',
  'Decision-Making & Judgment',
  'Impact & Results Orientation',
  'Learning & Self-Reflection',
  'Handling Conflict & Stakeholder Management',
  'Bias for Action & Ownership Under Ambiguity',
  'Cross-Functional Collaboration',
  'Communication & Executive Presence',
  'Values, Integrity & Professional Maturity',
  'Adaptability & Resilience',
  'Product Mindset (Behavioral Signal)',
] as const;

export type BehavioralSkill = (typeof BEHAVIORAL_SKILLS)[number];

// API response types
export interface EvaluateInterviewResponse {
  success: boolean;
  evaluation?: AIBehavioralEvaluation;
  error?: string;
}
