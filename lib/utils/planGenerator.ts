// Plan generator utility that creates personalized action plans based on user onboarding data

export interface OnboardingData {
  personalInfo?: {
    firstName?: string;
    lastName?: string;
    currentRole?: string;
    careerStage?: string;
    currentSalary?: number;
  };
  goals?: {
    targetRole?: string;
    timeline?: string;
    struggles?: string;
    jobSearchStage?: string;
    interviewConfidence?: number;
  };
  portfolio?: {
    hasPortfolio?: string;
    wantsPortfolio?: string | null;
  };
}

export interface ActionItem {
  id: string;
  label: string;
  completed: boolean;
  sublabel?: string;
  target?: number | null;
}

export interface ActionSection {
  title: string;
  description: string;
  actions: ActionItem[];
}

export interface PersonalizedPlan {
  summary: string;
  baselineActions: ActionSection[];
  weeklyGoals: ActionSection;
}

// Helper to get role display name (handles legacy enum values and new direct values)
const getRoleDisplayName = (roleValue: string): string => {
  // Legacy enum mappings for backwards compatibility
  const legacyRoleMap: Record<string, string> = {
    associate_product_manager: 'Associate Product Manager',
    product_manager: 'Product Manager',
    senior_product_manager: 'Senior Product Manager',
    director_of_product: 'Director of Product',
    group_product_manager: 'Group Product Manager',
    vp_of_product: 'VP of Product',
    chief_product_officer: 'Chief Product Officer',
  };
  // Return mapped value for legacy enums, or the role as-is for new format
  return legacyRoleMap[roleValue] || roleValue;
};

// Helper to get job search stage label
const getJobSearchStageLabel = (stage: string): string => {
  const stageMap: Record<string, string> = {
    not_started: "haven't started actively applying yet",
    not_getting_interviews: 'are applying but not getting interviews',
    not_passing_first_round: 'get some interviews but rarely pass the first round',
    not_passing_later_rounds: 'pass first rounds but struggle with later interview stages',
    not_getting_offers: "get to final rounds but don't receive offers",
    offers_not_right_fit: "are getting offers but they're not the right fit",
  };
  return stageMap[stage] || stage;
};

// Helper to get timeline display
const getTimelineDisplay = (timeline: string): string => {
  const timelineMap: Record<string, string> = {
    '1_month': '1 month',
    '3_months': '3 months',
    '6_months': '6 months',
    '1_year': '1 year',
  };
  return timelineMap[timeline] || timeline;
};

// Calculate target date based on timeline
export const calculateTargetDate = (timeline: string): Date => {
  const now = new Date();
  if (timeline === '1_month') {
    now.setMonth(now.getMonth() + 1);
  } else if (timeline === '3_months') {
    now.setMonth(now.getMonth() + 3);
  } else if (timeline === '6_months') {
    now.setMonth(now.getMonth() + 6);
  } else if (timeline === '1_year') {
    now.setFullYear(now.getFullYear() + 1);
  }
  return now;
};

// Generate personalized summary
const generateSummary = (data: OnboardingData): string => {
  const firstName = data.personalInfo?.firstName || 'there';
  const currentRole = data.personalInfo?.currentRole || 'your current role';
  const targetRole = data.goals?.targetRole
    ? getRoleDisplayName(data.goals.targetRole)
    : 'Product Manager';
  const jobSearchStage = data.goals?.jobSearchStage
    ? getJobSearchStageLabel(data.goals.jobSearchStage)
    : 'your job search';
  const careerStage = data.personalInfo?.careerStage;

  // Determine if it's a pivot/transition
  const isPivot =
    careerStage === 'breaking_into_product' || careerStage === 'already_in_product_new_role';

  let summary = `${firstName} - `;

  if (isPivot && currentRole !== targetRole) {
    summary += `it's awesome you're pivoting from a ${currentRole} role to a ${targetRole} role. `;

    // Add skill validation based on current role
    if (
      currentRole.toLowerCase().includes('data') ||
      currentRole.toLowerCase().includes('analyst')
    ) {
      summary += `You're going to be able to highlight your analytical skillset in interviews and networking calls and that will help you stand out from other candidates. `;
    } else if (
      currentRole.toLowerCase().includes('engineer') ||
      currentRole.toLowerCase().includes('developer')
    ) {
      summary += `You're going to be able to highlight your technical skillset in interviews and networking calls and that will help you stand out from other candidates. `;
    } else if (currentRole.toLowerCase().includes('design')) {
      summary += `You're going to be able to highlight your design skillset in interviews and networking calls and that will help you stand out from other candidates. `;
    } else {
      summary += `You're going to be able to highlight your unique skillset in interviews and networking calls and that will help you stand out from other candidates. `;
    }
  } else {
    summary += `it's great you're working towards becoming a ${targetRole}. `;
  }

  // Add challenge-specific context
  if (data.goals?.jobSearchStage) {
    summary += `Since you mentioned you ${jobSearchStage}, we've come up with a custom plan to help you `;

    if (data.goals.jobSearchStage === 'not_started') {
      summary += `get started on the right foot. `;
    } else if (data.goals.jobSearchStage === 'not_getting_interviews') {
      summary += `increase your resume passthrough rate. `;
    } else if (data.goals.jobSearchStage === 'not_passing_first_round') {
      summary += `improve your interview performance in early rounds. `;
    } else if (data.goals.jobSearchStage === 'not_passing_later_rounds') {
      summary += `excel in later-stage interviews. `;
    } else if (data.goals.jobSearchStage === 'not_getting_offers') {
      summary += `convert final rounds into offers. `;
    } else if (data.goals.jobSearchStage === 'offers_not_right_fit') {
      summary += `find the right opportunities for you. `;
    }
  }

  // Add plan overview
  const planItems: string[] = [];

  if (isPivot || data.goals?.jobSearchStage === 'not_getting_interviews') {
    planItems.push('launch a Product Portfolio to stand out against other candidates');
  }

  if (
    data.goals?.jobSearchStage === 'not_getting_interviews' ||
    data.goals?.jobSearchStage === 'not_passing_first_round'
  ) {
    planItems.push('improve your resume so that folks you network with take you seriously');
  }

  if (data.goals?.jobSearchStage !== 'offers_not_right_fit') {
    planItems.push('help you network with as many folks as possible for internal referrals');
  }

  if (planItems.length > 0) {
    if (planItems.length === 1) {
      summary += `We're going to help you ${planItems[0]}. `;
    } else if (planItems.length === 2) {
      summary += `We're going to help you ${planItems[0]} and ${planItems[1]}. `;
    } else {
      summary += `We're going to help you ${planItems.slice(0, -1).join(', ')}, and ${planItems[planItems.length - 1]}. `;
    }
  }

  summary += `Let's go!`;

  return summary;
};

// Generate baseline action sections
const generateBaselineActions = (data: OnboardingData): ActionSection[] => {
  const sections: ActionSection[] = [];
  const isPivot =
    data.personalInfo?.careerStage === 'breaking_into_product' ||
    data.personalInfo?.careerStage === 'already_in_product_new_role';
  const currentRole = data.personalInfo?.currentRole || '';
  const jobSearchStage = data.goals?.jobSearchStage;
  const wantsPortfolio = data.portfolio?.hasPortfolio !== 'no_portfolio_not_interested';

  // Product Portfolio section (if pivot or not getting interviews, and wants portfolio)
  if ((isPivot || jobSearchStage === 'not_getting_interviews') && wantsPortfolio) {
    let portfolioDescription =
      'Product Portfolios are extremely important for showcasing your work and demonstrating your product thinking.';

    if (isPivot && currentRole) {
      if (
        currentRole.toLowerCase().includes('data') ||
        currentRole.toLowerCase().includes('analyst')
      ) {
        portfolioDescription =
          'Product Portfolios are extremely important for people transitioning in from related roles. Within your case studies, you can highlight your analytical skillset and how that can help you lead to better outcomes.';
      } else if (
        currentRole.toLowerCase().includes('engineer') ||
        currentRole.toLowerCase().includes('developer')
      ) {
        portfolioDescription =
          'Product Portfolios are extremely important for people transitioning in from related roles. Within your case studies, you can highlight your technical skillset and how that can help you lead to better outcomes.';
      } else if (currentRole.toLowerCase().includes('design')) {
        portfolioDescription =
          'Product Portfolios are extremely important for people transitioning in from related roles. Within your case studies, you can highlight your design skillset and how that can help you lead to better outcomes.';
      }
    }

    const portfolioActions: ActionItem[] = [
      { id: 'portfolio-create', label: 'Create a Product Portfolio Link', completed: false },
      {
        id: 'portfolio-profile',
        label: 'Fill out your profile & bio in the portfolio',
        completed: false,
      },
      { id: 'portfolio-favorite', label: 'Favorite 3 case study ideas', completed: false },
      { id: 'portfolio-first-case', label: 'Publish your first case study', completed: false },
      { id: 'portfolio-publish', label: 'Publish your Portfolio', completed: false },
      {
        id: 'course-portfolio',
        label: 'Complete Launch a Product Portfolio course',
        completed: false,
      },
    ];

    sections.push({
      title: 'Stand Out with a Product Portfolio',
      description: portfolioDescription,
      actions: portfolioActions,
    });
  }

  // Resume section (if not getting interviews or not passing first round)
  if (jobSearchStage === 'not_getting_interviews' || jobSearchStage === 'not_passing_first_round') {
    let resumeDescription =
      'Your resume needs to demonstrate your product management skills and experience effectively.';

    if (isPivot && currentRole) {
      resumeDescription = `Your resume needs to demonstrate that even though you've been a ${currentRole} and not a PM, you still have the skills required to be effective as a PM.`;
    }

    const resumeActions: ActionItem[] = [
      { id: 'resume-import', label: 'Import your resume', completed: false },
      { id: 'resume-score', label: 'Reach a 90+ score', completed: false },
      { id: 'resume-export', label: 'Export your improved resume', completed: false },
      {
        id: 'course-resume-linkedin',
        label: 'Complete Resume & LinkedIn course',
        completed: false,
      },
    ];

    // Add interview course if not passing first round
    if (jobSearchStage === 'not_passing_first_round') {
      resumeActions.push({
        id: 'course-pm-interviews',
        label: 'Complete Nail the PM Interviews course',
        completed: false,
      });
    }

    sections.push({
      title: 'Improve your Resume',
      description: resumeDescription,
      actions: resumeActions,
    });
  }

  // Interview prep section (if passing first round but not later rounds)
  if (jobSearchStage === 'not_passing_later_rounds') {
    const interviewActions: ActionItem[] = [
      { id: 'interview-practice', label: 'Schedule 3 mock interviews', completed: false },
      { id: 'interview-feedback', label: 'Review and incorporate feedback', completed: false },
      {
        id: 'course-pm-interviews',
        label: 'Complete Nail the PM Interviews course',
        completed: false,
      },
    ];

    sections.push({
      title: 'Prepare for Later-Stage Interviews',
      description:
        "Later-stage interviews often focus on system design, product strategy, and leadership. We'll help you prepare for these more advanced conversations.",
      actions: interviewActions,
    });
  }

  // Add PM Fundamentals course section for pivoters
  if (isPivot) {
    const existingPortfolioSection = sections.find(
      (s) => s.title === 'Stand Out with a Product Portfolio'
    );
    if (existingPortfolioSection) {
      existingPortfolioSection.actions.push({
        id: 'course-pm-fundamentals',
        label: 'Complete Product Management Fundamentals course',
        completed: false,
      });
    } else {
      sections.push({
        title: 'Build Product Management Fundamentals',
        description:
          "Since you're transitioning into product management, this course will help you build the foundational knowledge and skills needed to succeed.",
        actions: [
          {
            id: 'course-pm-fundamentals',
            label: 'Complete Product Management Fundamentals course',
            completed: false,
          },
        ],
      });
    }
  }

  // Add referral course
  if (jobSearchStage === 'not_getting_interviews' || isPivot) {
    const targetSection =
      sections.find((s) => s.title === 'Stand Out with a Product Portfolio') ||
      sections.find((s) => s.title === 'Improve your Resume');
    if (targetSection) {
      targetSection.actions.push({
        id: 'course-secure-referral',
        label: 'Complete Secure a Referral course',
        completed: false,
      });
    } else {
      sections.push({
        title: 'Master Networking & Referrals',
        description:
          '85% of offers go to people who were referred internally. Learn how to secure referrals and network effectively.',
        actions: [
          {
            id: 'course-secure-referral',
            label: 'Complete Secure a Referral course',
            completed: false,
          },
        ],
      });
    }
  }

  // Add company prep course
  if (jobSearchStage === 'not_getting_interviews') {
    const resumeSection = sections.find((s) => s.title === 'Improve your Resume');
    if (resumeSection) {
      resumeSection.actions.push({
        id: 'course-company-prep',
        label: 'Complete Company Prep & Applying course',
        completed: false,
      });
    }
  }

  // Add negotiation course for those not getting offers
  if (jobSearchStage === 'not_getting_offers') {
    sections.push({
      title: 'Close the Deal',
      description:
        'Learn how to negotiate effectively and maximize your compensation once you reach final rounds.',
      actions: [
        {
          id: 'course-offer-negotiation',
          label: 'Complete PM Offer Negotiation course',
          completed: false,
        },
      ],
    });
  }

  return sections;
};

// Generate weekly goals section
const generateWeeklyGoals = (data: OnboardingData): ActionSection => {
  const timeline = data.goals?.timeline
    ? getTimelineDisplay(data.goals.timeline)
    : 'your target date';

  // Calculate target date based on timeline
  const now = new Date();
  let targetDate = '';
  if (data.goals?.timeline === '1_month') {
    const future = new Date(now);
    future.setMonth(future.getMonth() + 1);
    targetDate = future.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } else if (data.goals?.timeline === '3_months') {
    const future = new Date(now);
    future.setMonth(future.getMonth() + 3);
    targetDate = future.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } else if (data.goals?.timeline === '6_months') {
    const future = new Date(now);
    future.setMonth(future.getMonth() + 6);
    targetDate = future.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } else if (data.goals?.timeline === '1_year') {
    const future = new Date(now);
    future.setFullYear(future.getFullYear() + 1);
    targetDate = future.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  const jobSearchStage = data.goals?.jobSearchStage;
  const isPivot =
    data.personalInfo?.careerStage === 'breaking_into_product' ||
    data.personalInfo?.careerStage === 'already_in_product_new_role';

  let description = targetDate
    ? `Because you want to land an offer by ${targetDate}, you must stay disciplined every week with your strategy. `
    : `To achieve your goals, you must stay disciplined every week with your strategy. `;

  if (isPivot) {
    description += `Networking for referrals and applying as a fallback is your best bet as someone pivoting into product from a related role.`;
  } else if (jobSearchStage === 'not_getting_interviews') {
    description += `Focus on improving your application materials and networking for referrals to maximize your chances.`;
  } else if (
    jobSearchStage === 'not_passing_first_round' ||
    jobSearchStage === 'not_passing_later_rounds'
  ) {
    description += `Continue applying while improving your interview skills through practice and preparation.`;
  } else if (jobSearchStage === 'not_getting_offers') {
    description += `Focus on closing the deal by improving your negotiation skills and following up effectively.`;
  } else {
    description += `Stay consistent with your job search activities to maintain momentum.`;
  }

  const actions: ActionItem[] = [];

  // Adjust actions based on job search stage
  if (jobSearchStage === 'not_getting_interviews' || !jobSearchStage) {
    actions.push(
      {
        id: 'weekly-outreach-emails',
        label: 'Send 50 customized emails for open roles',
        target: 50,
        completed: false,
      },
      {
        id: 'weekly-networking-calls',
        label: 'Schedule 3 networking calls',
        target: 3,
        completed: false,
      },
      { id: 'weekly-applications', label: 'Apply to 10 roles', target: 10, completed: false }
    );
  } else if (
    jobSearchStage === 'not_passing_first_round' ||
    jobSearchStage === 'not_passing_later_rounds'
  ) {
    actions.push(
      { id: 'weekly-applications', label: 'Apply to 10 roles', target: 10, completed: false },
      {
        id: 'weekly-interview-practice',
        label: 'Complete 2 interview practice sessions',
        target: 2,
        completed: false,
      },
      {
        id: 'weekly-networking-calls',
        label: 'Schedule 2 networking calls',
        target: 2,
        completed: false,
      }
    );
  } else if (jobSearchStage === 'not_getting_offers') {
    actions.push(
      {
        id: 'weekly-outreach-emails',
        label: 'Send 10 outreach emails to contacts',
        target: 10,
        completed: false,
      },
      {
        id: 'weekly-interview-practice',
        label: 'Complete 2 negotiation practice sessions',
        target: 2,
        completed: false,
      },
      { id: 'weekly-applications', label: 'Apply to 5 new roles', target: 5, completed: false }
    );
  } else {
    actions.push(
      {
        id: 'weekly-outreach-emails',
        label: 'Send 30 customized emails for open roles',
        target: 30,
        completed: false,
      },
      {
        id: 'weekly-networking-calls',
        label: 'Schedule 2 networking calls',
        target: 2,
        completed: false,
      },
      { id: 'weekly-applications', label: 'Apply to 5 roles', target: 5, completed: false }
    );
  }

  return {
    title: 'Land The Offer',
    description,
    actions,
  };
};

// Main plan generator function (fallback when AI is unavailable)
export const generatePersonalizedPlan = (data: OnboardingData): PersonalizedPlan => {
  return {
    summary: generateSummary(data),
    baselineActions: generateBaselineActions(data),
    weeklyGoals: generateWeeklyGoals(data),
  };
};
