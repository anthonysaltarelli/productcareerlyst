'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface BaselineAction {
  actionId: string;
  label: string;
  route: string;
  triggerLogic: string;
  userExplanation: string;
  verified: boolean;
}

interface WeeklyGoal {
  goalId: string;
  label: string;
  route: string;
  triggerLogic: string;
  userExplanation: string;
  verified: boolean;
}

const BASELINE_ACTIONS: BaselineAction[] = [
  // Resume actions
  {
    actionId: 'resume-import',
    label: 'Import your current resume',
    route: '/dashboard/resume',
    triggerLogic: 'Triggered when POST /api/resume/import completes successfully. Calls markBaselineActionsComplete(userId, "resume_imported").',
    userExplanation: 'Go to Dashboard > Resume and click "Import Resume" to upload your PDF or DOCX resume file.',
    verified: true,
  },
  {
    actionId: 'resume-analyze',
    label: 'Analyze your resume and get a score',
    route: '/dashboard/resume',
    triggerLogic: 'Triggered when POST /api/resume/versions/[versionId]/analyze completes successfully. Calls markBaselineActionsComplete(userId, "resume_analyzed").',
    userExplanation: 'After importing your resume, click "Analyze" to get an AI-powered score and recommendations.',
    verified: true,
  },
  {
    actionId: 'resume-score-90',
    label: 'Reach a 90+ resume score',
    route: '/dashboard/resume',
    triggerLogic: 'Triggered when resume analysis returns overallScore >= 90. Calls markBaselineActionsComplete(userId, "resume_score_90").',
    userExplanation: 'Polish your resume to perfection until your score reaches 90 or higher.',
    verified: true,
  },
  {
    actionId: 'resume-export',
    label: 'Export your polished resume as PDF',
    route: '/dashboard/resume',
    triggerLogic: 'Triggered when PDF download completes successfully in ResumeLanding.tsx, resume editor page, or DocumentsTab.tsx. Calls POST /api/goals/baseline with trigger "resume_exported".',
    userExplanation: 'Click "Export PDF" on your resume to download a professionally formatted version.',
    verified: true,
  },
  {
    actionId: 'resume-clone-tailored',
    label: 'Create a tailored resume version',
    route: '/dashboard/resume',
    triggerLogic: 'Triggered when POST /api/resume/versions/[versionId]/clone completes successfully. Calls markBaselineActionsComplete(userId, "resume_cloned").',
    userExplanation: 'Click "Clone" on your master resume to create a tailored version for a specific job.',
    verified: true,
  },

  // Portfolio actions
  {
    actionId: 'portfolio-create',
    label: 'Create your Product Portfolio',
    route: '/dashboard/portfolio',
    triggerLogic: 'Triggered when POST /api/portfolio/manage creates a new portfolio. Calls markBaselineActionsComplete(userId, "portfolio_created").',
    userExplanation: 'Go to Dashboard > Portfolio and click "Create Portfolio" to get started.',
    verified: true,
  },
  {
    actionId: 'portfolio-profile',
    label: 'Complete your portfolio profile & bio',
    route: '/dashboard/portfolio/editor',
    triggerLogic: 'Triggered when PUT /api/portfolio/manage saves a portfolio with non-null profile_image_url, non-empty bio, and at least 1 social link. Calls markBaselineActionsComplete(userId, "portfolio_profile_completed").',
    userExplanation: 'Fill out your portfolio profile with your bio, photo, and at least one social link (we recommend LinkedIn).',
    verified: true,
  },
  {
    actionId: 'portfolio-generate-ideas',
    label: 'Generate case study ideas with AI',
    route: '/dashboard/portfolio/generate',
    triggerLogic: 'Triggered when POST /api/portfolio/generate-ideas completes successfully. Calls markBaselineActionsComplete(userId, "portfolio_idea_generated").',
    userExplanation: 'Use the AI idea generator to brainstorm compelling case study topics.',
    verified: true,
  },
  {
    actionId: 'portfolio-first-case',
    label: 'Publish your first case study',
    route: '/dashboard/portfolio/editor',
    triggerLogic: 'Triggered when PUT /api/portfolio/pages/[pageId] publishes a page and the total published page count becomes 1. Calls markBaselineActionsComplete(userId, "portfolio_first_case_added").',
    userExplanation: 'Write and publish your first product case study to showcase your work.',
    verified: true,
  },
  {
    actionId: 'portfolio-second-case',
    label: 'Publish a second case study',
    route: '/dashboard/portfolio/editor',
    triggerLogic: 'Triggered when PUT /api/portfolio/pages/[pageId] publishes a page and the total published page count becomes 2. Calls markBaselineActionsComplete(userId, "portfolio_second_case_added").',
    userExplanation: 'Add another case study to demonstrate breadth in your portfolio.',
    verified: true,
  },
  {
    actionId: 'portfolio-publish',
    label: 'Make your portfolio public',
    route: '/dashboard/portfolio',
    triggerLogic: 'Triggered when PUT /api/portfolio/manage sets is_published to true. Calls markBaselineActionsComplete(userId, "portfolio_published").',
    userExplanation: 'Toggle your portfolio to "Public" so recruiters and hiring managers can view it.',
    verified: true,
  },

  // Course actions
  {
    actionId: 'course-resume-linkedin',
    label: 'Complete Resume & LinkedIn course',
    route: '/dashboard/courses/resume-linkedin',
    triggerLogic: 'Triggered automatically when all lessons in the course are marked complete via POST /api/lessons/[lessonId]/progress. checkCourseCompletion() detects full completion and calls markBaselineActionsComplete(userId, "course_resume_linkedin_completed").',
    userExplanation: 'Complete all lessons in the Resume & LinkedIn course in the Courses section.',
    verified: true,
  },
  {
    actionId: 'course-portfolio',
    label: 'Complete Launch a Product Portfolio course',
    route: '/dashboard/courses/portfolio',
    triggerLogic: 'Triggered automatically when all lessons in the course are marked complete via POST /api/lessons/[lessonId]/progress. checkCourseCompletion() detects full completion and calls markBaselineActionsComplete(userId, "course_portfolio_completed").',
    userExplanation: 'Complete all lessons in the Product Portfolio course.',
    verified: true,
  },
  {
    actionId: 'course-secure-referral',
    label: 'Complete Secure a Referral course',
    route: '/dashboard/courses/secure-referral',
    triggerLogic: 'Triggered automatically when all lessons in the course are marked complete via POST /api/lessons/[lessonId]/progress. checkCourseCompletion() detects full completion and calls markBaselineActionsComplete(userId, "course_secure_referral_completed").',
    userExplanation: 'Complete all lessons in the Secure a Referral course.',
    verified: true,
  },
  {
    actionId: 'course-company-prep',
    label: 'Complete Company Prep & Applying course',
    route: '/dashboard/courses/company-prep',
    triggerLogic: 'Triggered automatically when all lessons in the course are marked complete via POST /api/lessons/[lessonId]/progress. checkCourseCompletion() detects full completion and calls markBaselineActionsComplete(userId, "course_company_prep_completed").',
    userExplanation: 'Complete all lessons in the Company Prep & Applying course.',
    verified: true,
  },
  {
    actionId: 'course-pm-interviews',
    label: 'Complete Nail the PM Interviews course',
    route: '/dashboard/courses/pm-interviews',
    triggerLogic: 'Triggered automatically when all lessons in the course are marked complete via POST /api/lessons/[lessonId]/progress. checkCourseCompletion() detects full completion and calls markBaselineActionsComplete(userId, "course_pm_interviews_completed").',
    userExplanation: 'Complete all lessons in the PM Interviews course.',
    verified: true,
  },
  {
    actionId: 'course-negotiation',
    label: 'Complete Negotiation course',
    route: '/dashboard/courses/negotiation',
    triggerLogic: 'Triggered automatically when all lessons in the course are marked complete via POST /api/lessons/[lessonId]/progress. checkCourseCompletion() detects full completion and calls markBaselineActionsComplete(userId, "course_negotiation_completed").',
    userExplanation: 'Complete all lessons in the Negotiation course.',
    verified: true,
  },
  {
    actionId: 'course-pm-fundamentals',
    label: 'Complete PM Fundamentals course',
    route: '/dashboard/courses/pm-fundamentals',
    triggerLogic: 'Triggered automatically when all lessons in the course are marked complete via POST /api/lessons/[lessonId]/progress. checkCourseCompletion() detects full completion and calls markBaselineActionsComplete(userId, "course_pm_fundamentals_completed").',
    userExplanation: 'Complete all lessons in the PM Fundamentals course.',
    verified: true,
  },

  // Job search actions
  {
    actionId: 'job-add-first',
    label: 'Add your first job to track',
    route: '/dashboard/jobs',
    triggerLogic: 'Triggered when POST /api/jobs/applications or POST /api/jobs/import-from-url creates a new application. Calls markBaselineActionsComplete(userId, "job_added").',
    userExplanation: 'Go to Dashboard > Jobs and click "Add Job" to start tracking a job opportunity.',
    verified: true,
  },
  {
    actionId: 'job-research-companies',
    label: 'Research companies using AI insights',
    route: '/dashboard/jobs',
    triggerLogic: 'Triggered when: (1) POST /api/jobs/companies/[id]/research generates new research (single or batch), or (2) GET /api/jobs/companies/[id]/research returns existing research. Both call markBaselineActionsComplete(userId, "company_researched").',
    userExplanation: 'Click "Research" on any company to get AI-powered insights about the company.',
    verified: true,
  },
  {
    actionId: 'job-track-applications',
    label: 'Track an application status',
    route: '/dashboard/jobs',
    triggerLogic: 'Triggered when job status is changed to "applied" via PATCH /api/jobs/applications/[id] or POST /api/jobs/applications. Auto-sets applied_date to current date if not provided. Calls markBaselineActionsComplete(userId, "application_tracked") and incrementWeeklyGoalProgress(userId, "job_applied").',
    userExplanation: 'Update a job\'s status to "Applied" to track your application progress.',
    verified: true,
  },

  // Networking actions
  {
    actionId: 'networking-add-contact',
    label: 'Add your first networking contact',
    route: '/dashboard/jobs',
    triggerLogic: 'Triggered when POST /api/jobs/contacts creates a new contact. Calls markBaselineActionsComplete(userId, "contact_added").',
    userExplanation: 'Go to a company page and click "Add Contact" to track networking connections.',
    verified: true,
  },
  {
    actionId: 'networking-find-contacts',
    label: 'Find PM contacts at target companies',
    route: '/dashboard/jobs',
    triggerLogic: 'Triggered when POST /api/jobs/wiza/import-contacts imports contacts. Calls markBaselineActionsComplete(userId, "contacts_found").',
    userExplanation: 'Use the contact finder to discover PM contacts at your target companies.',
    verified: true,
  },
  {
    actionId: 'networking-scripts',
    label: 'Access networking email scripts',
    route: '/dashboard/templates',
    triggerLogic: 'Triggered when user clicks "Networking Scripts" resource on PM Templates page. TemplatesPageContent.tsx maps resource to "networking_scripts_accessed" trigger which calls POST /api/goals/baseline.',
    userExplanation: 'Access the networking email templates in the Resources section.',
    verified: false,
  },

  // Interview prep actions
  {
    actionId: 'interview-prep-behavioral',
    label: 'Prepare behavioral stories',
    route: '/dashboard/templates',
    triggerLogic: 'Triggered when user clicks "My 8 Stories" resource on PM Templates page. TemplatesPageContent.tsx maps resource to "behavioral_prep_completed" trigger which calls POST /api/goals/baseline.',
    userExplanation: 'Complete the My 8 Stories worksheet to prepare your behavioral interview responses.',
    verified: false,
  },
  {
    actionId: 'interview-practice-mock',
    label: 'Complete a mock interview',
    route: '/dashboard/interview',
    triggerLogic: 'Triggered when mock interview is completed. Calls markBaselineActionsComplete(userId, "mock_interview_completed"). NOTE: Trigger not yet implemented.',
    userExplanation: 'Complete a mock interview session to practice your responses.',
    verified: false,
  },
  {
    actionId: 'interview-prep-product-design',
    label: 'Prep for product design questions',
    route: '/dashboard/interview',
    triggerLogic: 'Triggered when product design prep is completed. Calls markBaselineActionsComplete(userId, "product_design_prep_completed"). NOTE: Trigger not yet implemented.',
    userExplanation: 'Review and practice product design interview frameworks.',
    verified: false,
  },
  {
    actionId: 'interview-prep-strategy',
    label: 'Prep for strategy questions',
    route: '/dashboard/interview',
    triggerLogic: 'Triggered when strategy prep is completed. Calls markBaselineActionsComplete(userId, "strategy_prep_completed"). NOTE: Trigger not yet implemented.',
    userExplanation: 'Review and practice product strategy interview frameworks.',
    verified: false,
  },
  {
    actionId: 'interview-prep-metrics',
    label: 'Prep for metrics questions',
    route: '/dashboard/interview',
    triggerLogic: 'Triggered when metrics prep is completed. Calls markBaselineActionsComplete(userId, "metrics_prep_completed"). NOTE: Trigger not yet implemented.',
    userExplanation: 'Review and practice metrics and analytics interview frameworks.',
    verified: false,
  },
  {
    actionId: 'interview-generate-questions',
    label: 'Generate interview questions with AI',
    route: '/dashboard/jobs',
    triggerLogic: 'Triggered when POST /api/jobs/interviews/[id]/generate-questions successfully creates questions. Calls markBaselineActionsComplete(userId, "questions_generated").',
    userExplanation: 'Go to a job application, add an interview, and click "Generate Questions" to get AI-powered interview questions.',
    verified: true,
  },
  {
    actionId: 'interview-send-thank-you',
    label: 'Send a thank you note',
    route: '/dashboard/jobs',
    triggerLogic: 'Triggered when PATCH /api/jobs/interviews/[id] sets thank_you_sent_at. Calls markBaselineActionsComplete(userId, "thank_you_sent").',
    userExplanation: 'Go to an interview page and click "Mark Thank You Sent" to track when you\'ve sent your thank you note.',
    verified: true,
  },

  // Resource actions
  {
    actionId: 'resource-resume-guide',
    label: 'Review the PM Resume Guide',
    route: '/dashboard/templates',
    triggerLogic: 'Triggered when user clicks "Resume Guide" resource and has access (Learn or Accelerate plan). Calls POST /api/goals/baseline with trigger "resume_guide_accessed".',
    userExplanation: 'Read through the PM Resume Guide in the Resources section.',
    verified: true,
  },
  {
    actionId: 'resource-interview-frameworks',
    label: 'Access interview frameworks',
    route: '/dashboard/templates',
    triggerLogic: 'Triggered when user clicks "PM Interview Frameworks" resource and has access (Learn or Accelerate plan). Calls POST /api/goals/baseline with trigger "interview_frameworks_accessed".',
    userExplanation: 'Download and review the interview frameworks in Resources.',
    verified: true,
  },
  {
    actionId: 'resource-negotiation-scripts',
    label: 'Access negotiation scripts',
    route: '/dashboard/templates',
    triggerLogic: 'Triggered when user clicks "Negotiation Scripts" resource and has access (Learn or Accelerate plan). Calls POST /api/goals/baseline with trigger "negotiation_scripts_accessed".',
    userExplanation: 'Access the salary negotiation scripts and templates.',
    verified: true,
  },
  {
    actionId: 'resource-prd-template',
    label: 'Access PRD template',
    route: '/dashboard/templates',
    triggerLogic: 'Triggered when user clicks "Product Requirements Doc (PRD)" resource and has access (Learn or Accelerate plan). Calls POST /api/goals/baseline with trigger "prd_template_accessed".',
    userExplanation: 'Download the PRD template for your portfolio case studies.',
    verified: true,
  },
];

const WEEKLY_GOALS: WeeklyGoal[] = [
  {
    goalId: 'weekly-applications',
    label: 'Apply to jobs',
    route: '/dashboard/jobs',
    triggerLogic: 'Incremented when job status is changed to "applied" via POST /api/jobs/applications or PATCH /api/jobs/applications/[id]. Calls incrementWeeklyGoalProgress(userId, "job_applied").',
    userExplanation: 'Track your job applications by adding jobs and marking them as "Applied".',
    verified: false,
  },
  {
    goalId: 'weekly-networking-calls',
    label: 'Schedule networking calls',
    route: '/dashboard/jobs',
    triggerLogic: 'Incremented when networking call is scheduled. Calls incrementWeeklyGoalProgress(userId, "networking_call_scheduled"). NOTE: Trigger not yet implemented.',
    userExplanation: 'Schedule and log networking calls with industry contacts.',
    verified: false,
  },
  {
    goalId: 'weekly-outreach-emails',
    label: 'Send outreach emails',
    route: '/dashboard/jobs',
    triggerLogic: 'Incremented when outreach email is sent. Calls incrementWeeklyGoalProgress(userId, "outreach_email_sent"). NOTE: Trigger not yet implemented.',
    userExplanation: 'Send personalized outreach emails to contacts at your target companies.',
    verified: false,
  },
  {
    goalId: 'weekly-interview-practice',
    label: 'Complete interview practice sessions',
    route: '/dashboard/interview',
    triggerLogic: 'Incremented when interview practice, mock interview, or negotiation practice is completed. Calls incrementWeeklyGoalProgress(userId, "interview_practice_completed" | "mock_interview_completed" | "negotiation_practice_completed"). NOTE: Triggers not yet implemented.',
    userExplanation: 'Complete mock interviews or practice sessions to improve your interview skills.',
    verified: false,
  },
  {
    goalId: 'weekly-company-research',
    label: 'Research target companies',
    route: '/dashboard/jobs',
    triggerLogic: 'Incremented when POST /api/jobs/companies/[id]/research completes successfully. Calls incrementWeeklyGoalProgress(userId, "company_researched"). NOTE: Trigger not yet implemented.',
    userExplanation: 'Use AI insights to deeply research your target companies.',
    verified: false,
  },
  {
    goalId: 'weekly-course-lessons',
    label: 'Watch course lessons',
    route: '/dashboard/courses',
    triggerLogic: 'Incremented when a course lesson is completed. Calls incrementWeeklyGoalProgress(userId, "lesson_completed"). NOTE: Trigger not yet implemented.',
    userExplanation: 'Complete lessons from the PM career courses to build your skills.',
    verified: false,
  },
  {
    goalId: 'weekly-follow-ups',
    label: 'Follow up on applications',
    route: '/dashboard/jobs',
    triggerLogic: 'Incremented when application follow-up is logged. Calls incrementWeeklyGoalProgress(userId, "application_followed_up"). NOTE: Trigger not yet implemented.',
    userExplanation: 'Follow up on pending job applications to stay top of mind.',
    verified: false,
  },
  {
    goalId: 'weekly-interview-prep',
    label: 'Prep for upcoming interviews',
    route: '/dashboard/interview',
    triggerLogic: 'Incremented when interview prep questions are generated for a specific company. Calls incrementWeeklyGoalProgress(userId, "interview_prep_completed"). NOTE: Trigger not yet implemented.',
    userExplanation: 'Generate tailored questions and prep materials for upcoming interviews.',
    verified: false,
  },
];

export default function GoalTestingPage() {
  const [expandedBaseline, setExpandedBaseline] = useState<Set<string>>(new Set());
  const [expandedWeekly, setExpandedWeekly] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified' | 'implemented' | 'not-implemented'>('all');
  const [isDevMode, setIsDevMode] = useState<boolean | null>(null);

  // Check if we're in development mode on the client
  useEffect(() => {
    setIsDevMode(process.env.NODE_ENV === 'development');
  }, []);

  // Show loading state while checking
  if (isDevMode === null) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Block access in production
  if (!isDevMode) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">This page is only accessible in development mode.</p>
        </div>
      </div>
    );
  }

  const toggleBaseline = (actionId: string) => {
    setExpandedBaseline((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(actionId)) {
        newSet.delete(actionId);
      } else {
        newSet.add(actionId);
      }
      return newSet;
    });
  };

  const toggleWeekly = (goalId: string) => {
    setExpandedWeekly((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(goalId)) {
        newSet.delete(goalId);
      } else {
        newSet.add(goalId);
      }
      return newSet;
    });
  };

  const isImplemented = (triggerLogic: string) => !triggerLogic.includes('NOTE: Trigger not yet implemented') && !triggerLogic.includes('NOTE: Not yet implemented');

  const filteredBaseline = BASELINE_ACTIONS.filter((action) => {
    if (filter === 'all') return true;
    if (filter === 'verified') return action.verified;
    if (filter === 'unverified') return !action.verified;
    if (filter === 'implemented') return isImplemented(action.triggerLogic);
    if (filter === 'not-implemented') return !isImplemented(action.triggerLogic);
    return true;
  });

  const filteredWeekly = WEEKLY_GOALS.filter((goal) => {
    if (filter === 'all') return true;
    if (filter === 'verified') return goal.verified;
    if (filter === 'unverified') return !goal.verified;
    if (filter === 'implemented') return isImplemented(goal.triggerLogic);
    if (filter === 'not-implemented') return !isImplemented(goal.triggerLogic);
    return true;
  });

  const stats = {
    totalBaseline: BASELINE_ACTIONS.length,
    verifiedBaseline: BASELINE_ACTIONS.filter((a) => a.verified).length,
    implementedBaseline: BASELINE_ACTIONS.filter((a) => isImplemented(a.triggerLogic)).length,
    totalWeekly: WEEKLY_GOALS.length,
    verifiedWeekly: WEEKLY_GOALS.filter((g) => g.verified).length,
    implementedWeekly: WEEKLY_GOALS.filter((g) => isImplemented(g.triggerLogic)).length,
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Goal Testing Dashboard</h1>
          <p className="text-gray-600 font-medium mb-4">
            Development-only page for testing baseline actions and weekly goal triggers.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-black text-purple-600">{stats.totalBaseline}</div>
              <div className="text-sm font-semibold text-gray-600">Baseline Actions</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-black text-green-600">
                {stats.implementedBaseline}/{stats.totalBaseline}
              </div>
              <div className="text-sm font-semibold text-gray-600">Implemented</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-black text-blue-600">{stats.totalWeekly}</div>
              <div className="text-sm font-semibold text-gray-600">Weekly Goals</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-black text-green-600">
                {stats.implementedWeekly}/{stats.totalWeekly}
              </div>
              <div className="text-sm font-semibold text-gray-600">Implemented</div>
            </div>
          </div>

          {/* Filter */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'implemented', 'not-implemented', 'verified', 'unverified'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  filter === f
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Baseline Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-black text-gray-900 mb-4">
            Baseline Actions ({filteredBaseline.length})
          </h2>
          <div className="space-y-3">
            {filteredBaseline.map((action) => {
              const implemented = isImplemented(action.triggerLogic);
              const expanded = expandedBaseline.has(action.actionId);

              return (
                <div
                  key={action.actionId}
                  className={`border-2 rounded-xl overflow-hidden ${
                    action.verified
                      ? 'border-green-300 bg-green-50'
                      : implemented
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <button
                    onClick={() => toggleBaseline(action.actionId)}
                    className="w-full p-4 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      {action.verified ? (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}
                      <div>
                        <div className="font-bold text-gray-900">{action.label}</div>
                        <div className="text-xs font-mono text-gray-500">{action.actionId}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {implemented ? (
                        <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs font-bold rounded">
                          Implemented
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs font-bold rounded">
                          Not Implemented
                        </span>
                      )}
                      {expanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>
                  {expanded && (
                    <div className="px-4 pb-4 space-y-3">
                      <div>
                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">
                          Route
                        </div>
                        <a
                          href={action.route}
                          className="text-sm font-mono bg-white p-3 rounded-lg border border-gray-200 block text-purple-600 hover:text-purple-800 hover:bg-purple-50 transition-colors"
                        >
                          {action.route}
                        </a>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">
                          Trigger Logic
                        </div>
                        <div className="text-sm font-mono bg-white p-3 rounded-lg border border-gray-200">
                          {action.triggerLogic}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">
                          User-Facing Explanation
                        </div>
                        <div className="text-sm bg-white p-3 rounded-lg border border-gray-200">
                          {action.userExplanation}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly Goals */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-black text-gray-900 mb-4">
            Weekly Goals ({filteredWeekly.length})
          </h2>
          <div className="space-y-3">
            {filteredWeekly.map((goal) => {
              const implemented = isImplemented(goal.triggerLogic);
              const expanded = expandedWeekly.has(goal.goalId);

              return (
                <div
                  key={goal.goalId}
                  className={`border-2 rounded-xl overflow-hidden ${
                    goal.verified
                      ? 'border-green-300 bg-green-50'
                      : implemented
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <button
                    onClick={() => toggleWeekly(goal.goalId)}
                    className="w-full p-4 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      {goal.verified ? (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}
                      <div>
                        <div className="font-bold text-gray-900">{goal.label}</div>
                        <div className="text-xs font-mono text-gray-500">{goal.goalId}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {implemented ? (
                        <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs font-bold rounded">
                          Implemented
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs font-bold rounded">
                          Not Implemented
                        </span>
                      )}
                      {expanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>
                  {expanded && (
                    <div className="px-4 pb-4 space-y-3">
                      <div>
                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">
                          Route
                        </div>
                        <a
                          href={goal.route}
                          className="text-sm font-mono bg-white p-3 rounded-lg border border-gray-200 block text-purple-600 hover:text-purple-800 hover:bg-purple-50 transition-colors"
                        >
                          {goal.route}
                        </a>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">
                          Trigger Logic
                        </div>
                        <div className="text-sm font-mono bg-white p-3 rounded-lg border border-gray-200">
                          {goal.triggerLogic}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">
                          User-Facing Explanation
                        </div>
                        <div className="text-sm bg-white p-3 rounded-lg border border-gray-200">
                          {goal.userExplanation}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
