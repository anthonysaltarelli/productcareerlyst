'use client';

import { use } from 'react';
import PortfolioEditor from '@/app/components/portfolio/PortfolioEditor';
import { PORTFOLIO_COLOR_PALETTES } from '@/lib/constants/portfolio-palettes';
import { PORTFOLIO_FONT_COMBINATIONS } from '@/lib/constants/portfolio-fonts';

interface PageProps {
  params: Promise<{ templateId: string }>;
}

// Mock data for initial case studies
const getMockCaseStudies = () => [
  {
    id: 'case-study-1',
    title: 'E-commerce Checkout Optimization',
    description: 'Reduced cart abandonment by 35% through a redesigned checkout flow that simplified the payment process and improved mobile experience.',
    heroImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop',
    problemDiscover: 'User research revealed that 68% of mobile users abandoned their carts during checkout. Interviews showed frustration with multiple form fields and unclear progress indicators.',
    problemDefine: 'The checkout process was too complex, requiring users to fill out 12+ fields across multiple steps without clear visual feedback on their progress.',
    solutionDevelop: 'Designed a streamlined single-page checkout with auto-fill capabilities, progress indicators, and saved payment methods. Implemented real-time validation and error messaging.',
    solutionDeliver: 'Launched the new checkout flow to 50% of users via A/B test. Monitored key metrics including completion rate, time to checkout, and error rates.',
    process: 'Followed a user-centered design process: Discovered pain points through user interviews, defined the problem statement, developed wireframes and prototypes, tested with 20 users, iterated based on feedback, and delivered the final solution.',
    metrics: [
      { id: 'metric-1', label: 'Cart Abandonment Rate', value: '-35%' },
      { id: 'metric-2', label: 'Checkout Completion', value: '+42%' },
      { id: 'metric-3', label: 'Time to Checkout', value: '-28%' },
    ],
    outcomes: 'The new checkout flow resulted in a 35% reduction in cart abandonment and a 42% increase in checkout completion. User satisfaction scores improved by 28%, and the feature was rolled out to 100% of users after the successful A/B test.',
    images: [
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
    ],
    tags: ['E-commerce', 'UX Design', 'Mobile', 'Conversion Optimization'],
    order: 0,
  },
  {
    id: 'case-study-2',
    title: 'SaaS Onboarding Experience',
    description: 'Improved new user activation by 55% through a redesigned onboarding flow that reduced time-to-value from 3 days to 4 hours.',
    heroImage: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop',
    problemDiscover: 'Analytics showed that only 23% of new users completed the onboarding process. User interviews revealed confusion about product value and how to get started.',
    problemDefine: 'New users were overwhelmed by too much information upfront and lacked clear guidance on the first steps to take value from the product.',
    solutionDevelop: 'Created an interactive onboarding flow with progressive disclosure, personalized recommendations, and quick wins. Added tooltips, guided tours, and contextual help.',
    solutionDeliver: 'Launched the new onboarding experience with feature flags, allowing gradual rollout. Monitored activation rates, completion times, and user feedback.',
    process: 'Used a data-driven approach: Analyzed user behavior data, conducted user interviews, created user journey maps, designed and prototyped the new flow, tested with beta users, and iterated based on metrics.',
    metrics: [
      { id: 'metric-4', label: 'Activation Rate', value: '+55%' },
      { id: 'metric-5', label: 'Time to Value', value: '4 hours' },
      { id: 'metric-6', label: 'Onboarding Completion', value: '+67%' },
    ],
    outcomes: 'The redesigned onboarding experience increased activation rates by 55% and reduced time-to-value from 3 days to 4 hours. User satisfaction with the onboarding process improved significantly, and support tickets related to getting started decreased by 40%.',
    images: [
      'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=600&fit=crop',
    ],
    tags: ['SaaS', 'Onboarding', 'User Activation', 'Product Design'],
    order: 1,
  },
];

export default function PortfolioEditorPage({ params }: PageProps) {
  const { templateId } = use(params);

  // For now, only support modern-minimalist template
  if (templateId !== 'modern-minimalist') {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Template Not Found</h1>
        <p className="text-gray-600">
          The template "{templateId}" is not available yet. Please select a different template.
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden z-50 bg-white">
      <PortfolioEditor
        initialCaseStudies={getMockCaseStudies()}
        initialColorPalette={PORTFOLIO_COLOR_PALETTES[0]}
        initialFontCombination={PORTFOLIO_FONT_COMBINATIONS[0]}
        initialSiteTitle="Product Portfolio"
      />
    </div>
  );
}

