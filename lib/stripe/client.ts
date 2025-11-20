import Stripe from 'stripe';

// Initialize Stripe client
export const getStripeClient = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
  }

  return new Stripe(secretKey, {
    apiVersion: '2024-12-18.acacia',
    typescript: true,
  });
};

// Price IDs mapping
export const STRIPE_PRICE_IDS = {
  learn: {
    monthly: process.env.STRIPE_PRICE_LEARN_MONTHLY || 'price_learn_monthly_12',
    quarterly: process.env.STRIPE_PRICE_LEARN_QUARTERLY || 'price_learn_quarterly_27',
    yearly: process.env.STRIPE_PRICE_LEARN_YEARLY || 'price_learn_yearly_84',
  },
  accelerate: {
    monthly: process.env.STRIPE_PRICE_ACCELERATE_MONTHLY || 'price_accelerate_monthly_20',
    quarterly: process.env.STRIPE_PRICE_ACCELERATE_QUARTERLY || 'price_accelerate_quarterly_48',
    yearly: process.env.STRIPE_PRICE_ACCELERATE_YEARLY || 'price_accelerate_yearly_144',
  },
} as const;

// Plan limits configuration
export const PLAN_LIMITS = {
  learn: {
    pm_emails_discovered: 15,
    outreach_messages_created: 5,
    resume_bullet_optimizations: 30,
    resume_customizations_for_jobs: 5,
    product_portfolio_case_study_ideas: 5,
    jobs_tracked: 10,
    custom_questions_for_interviewers: 5,
    automated_company_research_searches: 5,
    product_portfolio_template: false,
  },
  accelerate: {
    pm_emails_discovered: Infinity,
    outreach_messages_created: Infinity,
    resume_bullet_optimizations: Infinity,
    resume_customizations_for_jobs: Infinity,
    product_portfolio_case_study_ideas: Infinity,
    jobs_tracked: Infinity,
    custom_questions_for_interviewers: Infinity,
    automated_company_research_searches: Infinity,
    product_portfolio_template: true,
  },
} as const;

export type PlanType = 'learn' | 'accelerate';
export type BillingCadence = 'monthly' | 'quarterly' | 'yearly';

