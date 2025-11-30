/**
 * User-facing explanations and routes for baseline actions and weekly goals
 * These are shown as tooltips on hover in the dashboard
 */

interface ActionInfo {
  explanation: string;
  route: string;
}

export const BASELINE_ACTION_INFO: Record<string, ActionInfo> = {
  // Resume actions
  'resume-import': {
    explanation: 'Go to Dashboard > Resume and click "Import Resume" to upload your PDF or DOCX resume file.',
    route: '/dashboard/resume',
  },
  'resume-analyze': {
    explanation: 'After importing your resume, click "Analyze" to get an AI-powered score and recommendations.',
    route: '/dashboard/resume',
  },
  'resume-score-90': {
    explanation: 'Polish your resume to perfection until your score reaches 90 or higher.',
    route: '/dashboard/resume',
  },
  'resume-export': {
    explanation: 'Click "Export PDF" on your resume to download a professionally formatted version.',
    route: '/dashboard/resume',
  },
  'resume-clone-tailored': {
    explanation: 'Click "Clone" on your master resume to create a tailored version for a specific job.',
    route: '/dashboard/resume',
  },

  // Portfolio actions
  'portfolio-create': {
    explanation: 'Go to Dashboard > Portfolio and click "Create Portfolio" to get started.',
    route: '/dashboard/portfolio',
  },
  'portfolio-profile': {
    explanation: 'Fill out your portfolio profile with your bio, photo, and at least one social link (we recommend LinkedIn).',
    route: '/dashboard/portfolio/editor',
  },
  'portfolio-generate-ideas': {
    explanation: 'Use the AI idea generator to brainstorm compelling case study topics.',
    route: '/dashboard/portfolio/generate',
  },
  'portfolio-first-case': {
    explanation: 'Write and publish your first product case study to showcase your work.',
    route: '/dashboard/portfolio/editor',
  },
  'portfolio-second-case': {
    explanation: 'Add another case study to demonstrate breadth in your portfolio.',
    route: '/dashboard/portfolio/editor',
  },
  'portfolio-publish': {
    explanation: 'Toggle your portfolio to "Public" so recruiters and hiring managers can view it.',
    route: '/dashboard/portfolio',
  },

  // Course actions
  'course-resume-linkedin': {
    explanation: 'Complete all lessons in the Resume & LinkedIn course in the Courses section.',
    route: '/dashboard/courses/resume-linkedin',
  },
  'course-portfolio': {
    explanation: 'Complete all lessons in the Product Portfolio course.',
    route: '/dashboard/courses/portfolio',
  },
  'course-secure-referral': {
    explanation: 'Complete all lessons in the Secure a Referral course.',
    route: '/dashboard/courses/secure-referral',
  },
  'course-company-prep': {
    explanation: 'Complete all lessons in the Company Prep & Applying course.',
    route: '/dashboard/courses/company-prep',
  },
  'course-pm-interviews': {
    explanation: 'Complete all lessons in the PM Interviews course.',
    route: '/dashboard/courses/pm-interviews',
  },
  'course-negotiation': {
    explanation: 'Complete all lessons in the Negotiation course.',
    route: '/dashboard/courses/negotiation',
  },
  'course-pm-fundamentals': {
    explanation: 'Complete all lessons in the PM Fundamentals course.',
    route: '/dashboard/courses/pm-fundamentals',
  },

  // Job search actions
  'job-add-first': {
    explanation: 'Go to Dashboard > Jobs and click "Add Job" to start tracking a job opportunity.',
    route: '/dashboard/jobs',
  },
  'job-research-companies': {
    explanation: 'Click "Research" on any company to get AI-powered insights about the company.',
    route: '/dashboard/jobs',
  },
  'job-track-applications': {
    explanation: 'Update a job\'s status to "Applied" to track your application progress.',
    route: '/dashboard/jobs',
  },

  // Networking actions
  'networking-add-contact': {
    explanation: 'Go to a company page and click "Add Contact" to track networking connections.',
    route: '/dashboard/jobs',
  },
  'networking-find-contacts': {
    explanation: 'Use the contact finder to discover PM contacts at your target companies.',
    route: '/dashboard/jobs',
  },
  'networking-scripts': {
    explanation: 'Access the Networking Scripts resource in the PM Resources section to get email templates that convert to informational calls and referrals.',
    route: '/dashboard/templates',
  },

  // Interview prep actions (practice interview logging)
  'interview-prep-recruiter-screen': {
    explanation: 'Log a practice recruiter screen interview in the Interview Prep section.',
    route: '/dashboard/interview',
  },
  'interview-prep-hiring-manager': {
    explanation: 'Log a practice hiring manager interview in the Interview Prep section.',
    route: '/dashboard/interview',
  },
  'interview-prep-product-sense': {
    explanation: 'Log a practice product sense interview in the Interview Prep section.',
    route: '/dashboard/interview',
  },
  'interview-prep-product-design': {
    explanation: 'Log a practice product design interview in the Interview Prep section.',
    route: '/dashboard/interview',
  },
  'interview-prep-analytics': {
    explanation: 'Log a practice analytics/execution interview in the Interview Prep section.',
    route: '/dashboard/interview',
  },
  'interview-prep-system-design': {
    explanation: 'Log a practice system design interview in the Interview Prep section.',
    route: '/dashboard/interview',
  },
  'interview-prep-technical': {
    explanation: 'Log a practice technical interview in the Interview Prep section.',
    route: '/dashboard/interview',
  },
  'interview-prep-strategy': {
    explanation: 'Log a practice product strategy interview in the Interview Prep section.',
    route: '/dashboard/interview',
  },
  'interview-prep-estimation': {
    explanation: 'Log a practice estimation interview in the Interview Prep section.',
    route: '/dashboard/interview',
  },
  'interview-prep-executive': {
    explanation: 'Log a practice executive interview in the Interview Prep section.',
    route: '/dashboard/interview',
  },
  'interview-prep-cross-functional': {
    explanation: 'Log a practice cross-functional interview in the Interview Prep section.',
    route: '/dashboard/interview',
  },
  'interview-prep-behavioral': {
    explanation: 'Log a practice behavioral interview in the Interview Prep section, or access the My 8 Stories worksheet in the PM Resources section.',
    route: '/dashboard/interview',
  },
  'interview-practice-mock': {
    explanation: 'Log a mock interview session in the Interview Prep section.',
    route: '/dashboard/interview',
  },
  'interview-generate-questions': {
    explanation: 'Go to a job application, add an interview, and click "Generate Questions" to get AI-powered interview questions.',
    route: '/dashboard/jobs',
  },
  'interview-send-thank-you': {
    explanation: 'Go to an interview page and click "Mark Thank You Sent" to track when you\'ve sent your thank you note.',
    route: '/dashboard/jobs',
  },

  // Resource actions
  'resource-resume-guide': {
    explanation: 'Read through the PM Resume Guide in the Resources section.',
    route: '/dashboard/templates',
  },
  'resource-interview-frameworks': {
    explanation: 'Download and review the interview frameworks in Resources.',
    route: '/dashboard/templates',
  },
  'resource-negotiation-scripts': {
    explanation: 'Access the salary negotiation scripts and templates.',
    route: '/dashboard/templates',
  },
  'resource-prd-template': {
    explanation: 'Download the PRD template for your portfolio case studies.',
    route: '/dashboard/templates',
  },
};

export const WEEKLY_GOAL_INFO: Record<string, ActionInfo> = {
  'weekly-applications': {
    explanation: 'Track your job applications by adding jobs and marking them as "Applied".',
    route: '/dashboard/jobs',
  },
  'weekly-networking-calls': {
    explanation: 'Schedule and log networking calls with industry contacts.',
    route: '/dashboard/jobs',
  },
  'weekly-outreach-emails': {
    explanation: 'Send personalized outreach emails to contacts at your target companies.',
    route: '/dashboard/jobs',
  },
  'weekly-interview-practice': {
    explanation: 'Complete mock interviews or practice sessions to improve your interview skills.',
    route: '/dashboard/interview',
  },
  'weekly-company-research': {
    explanation: 'Use AI insights to deeply research your target companies.',
    route: '/dashboard/jobs',
  },
  'weekly-course-lessons': {
    explanation: 'Complete lessons from the PM career courses to build your skills.',
    route: '/dashboard/courses',
  },
  'weekly-interview-prep': {
    explanation: 'Generate tailored questions and prep materials for upcoming interviews.',
    route: '/dashboard/interview',
  },
};

/**
 * Get info for a baseline action
 */
export function getBaselineActionInfo(actionId: string): ActionInfo | null {
  return BASELINE_ACTION_INFO[actionId] || null;
}

/**
 * Get info for a weekly goal
 */
export function getWeeklyGoalInfo(goalId: string): ActionInfo | null {
  return WEEKLY_GOAL_INFO[goalId] || null;
}

// Legacy functions for backwards compatibility
export function getBaselineActionExplanation(actionId: string): string | null {
  return BASELINE_ACTION_INFO[actionId]?.explanation || null;
}

export function getWeeklyGoalExplanation(goalId: string): string | null {
  return WEEKLY_GOAL_INFO[goalId]?.explanation || null;
}
