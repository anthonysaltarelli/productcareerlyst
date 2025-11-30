import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generatePersonalizedPlan, calculateTargetDate } from '@/lib/utils/planGenerator';
import type { OnboardingData, PersonalizedPlan } from '@/lib/utils/planGenerator';

// JSON Schema for structured output
const PLAN_GENERATION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    summary: {
      type: 'string',
      description:
        'A personalized, motivating 2-3 sentence paragraph addressing the user by name, acknowledging their background and struggles, validating their goal, and setting the tone for their plan',
    },
    baselineActions: {
      type: 'array',
      description: 'One-time setup actions grouped by theme. 2-4 sections based on user needs.',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: {
            type: 'string',
            description:
              'Section title (e.g., "Build Your Foundation", "Stand Out From The Crowd")',
          },
          description: {
            type: 'string',
            description:
              'Personalized 1-2 sentence description of why this section matters for this user',
          },
          actions: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                id: { type: 'string', description: 'Must be from predefined action ID list' },
                label: {
                  type: 'string',
                  description: 'Customized action label (can personalize wording)',
                },
                sublabel: {
                  type: ['string', 'null'],
                  description:
                    'Optional additional context or personalized tip. Use null if not needed.',
                },
              },
              required: ['id', 'label', 'sublabel'],
            },
          },
        },
        required: ['title', 'description', 'actions'],
      },
    },
    weeklyGoals: {
      type: 'object',
      additionalProperties: false,
      properties: {
        title: { type: 'string', description: 'Always "Land The Offer"' },
        description: {
          type: 'string',
          description: 'Personalized description referencing their timeline and target date',
        },
        actions: {
          type: 'array',
          description: 'Weekly recurring actions. IDs must be from weekly-* predefined list.',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              id: {
                type: 'string',
                enum: [
                  'weekly-applications',
                  'weekly-networking-calls',
                  'weekly-outreach-emails',
                  'weekly-interview-practice',
                  'weekly-company-research',
                  'weekly-course-lessons',
                  'weekly-follow-ups',
                  'weekly-interview-prep',
                ],
                description: 'Must be from predefined weekly action IDs for tracking',
              },
              label: {
                type: 'string',
                description:
                  'Customized label with specific numbers (e.g., "Apply to 12 quality roles this week")',
              },
              target: {
                type: ['integer', 'null'],
                description:
                  'The numeric target for this weekly goal (e.g., 12 for "Apply to 12 roles"). Use null for non-numeric goals like thank-you notes.',
              },
            },
            required: ['id', 'label', 'target'],
          },
        },
      },
      required: ['title', 'description', 'actions'],
    },
  },
  required: ['summary', 'baselineActions', 'weeklyGoals'],
};

// Helper to get role display name
const getRoleDisplayName = (roleValue: string): string => {
  const roleMap: Record<string, string> = {
    associate_product_manager: 'Associate Product Manager',
    product_manager: 'Product Manager',
    senior_product_manager: 'Senior Product Manager',
    director_of_product: 'Director of Product',
  };
  return roleMap[roleValue] || roleValue;
};

// Helper to get career stage label
const getCareerStageLabel = (stage: string): string => {
  const stageMap: Record<string, string> = {
    breaking_into_product: 'Breaking into Product Management (career pivot)',
    already_in_product_new_role: 'Already in PM, seeking a new role',
    promotion: 'Seeking a promotion at current company',
    high_raise: 'Seeking a significant raise',
  };
  return stageMap[stage] || stage;
};

// Helper to get job search stage label
const getJobSearchStageLabel = (stage: string): string => {
  const stageMap: Record<string, string> = {
    not_started: "Haven't started actively applying yet",
    not_getting_interviews: 'Applying but not getting interviews',
    not_passing_first_round: 'Getting interviews but not passing first rounds',
    not_passing_later_rounds: 'Passing first rounds but struggling with later stages',
    not_getting_offers: 'Getting to final rounds but not receiving offers',
    offers_not_right_fit: 'Getting offers but they are not the right fit',
  };
  return stageMap[stage] || stage;
};

// Build the comprehensive prompt
const buildPrompt = (data: OnboardingData): string => {
  const firstName = data.personalInfo?.firstName || 'there';
  const currentRole = data.personalInfo?.currentRole || 'your current role';
  const careerStage = data.personalInfo?.careerStage
    ? getCareerStageLabel(data.personalInfo.careerStage)
    : 'career transition';
  const targetRole = data.goals?.targetRole
    ? getRoleDisplayName(data.goals.targetRole)
    : 'Product Manager';
  const timeline = data.goals?.timeline || '3_months';
  const jobSearchStage = data.goals?.jobSearchStage
    ? getJobSearchStageLabel(data.goals.jobSearchStage)
    : 'job searching';
  const struggles = data.goals?.struggles || 'general job search challenges';
  const interviewConfidence = data.goals?.interviewConfidence || 3;

  // Calculate target date
  const targetDate = calculateTargetDate(timeline);
  const targetDateStr = targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return `You are an expert PM career coach creating a personalized action plan for a user on Product Careerlyst.

PLATFORM CAPABILITIES:
1. Resume Builder - AI-powered analysis, bullet optimization, score 0-100, PDF export
2. Product Portfolio - Custom URL, AI case study idea generator, templates for showcasing PM work
3. Job Center - Kanban job tracking, AI company research (13 vectors), verified PM contact finder
4. Interview Coach - Practice all PM interview types with AI feedback
5. Compensation Intelligence - Salary benchmarking, negotiation simulator

COURSES (7 total, 120+ video lessons):
- Resume & LinkedIn (2 hrs) - Optimize application materials for PM roles
- Launch a Product Portfolio (3 hrs) - Stand out with compelling case studies
- Secure a Referral (45 min) - 85% of offers come from internal referrals
- Company Prep & Applying (40 min) - Research companies and apply strategically
- Nail the PM Interviews (3 hrs) - Excel at behavioral, product design, strategy, and metrics interviews
- PM Offer Negotiation (45 min) - Maximize total compensation
- Product Management Fundamentals (10 hrs) - Core PM skills for career pivoters

RESOURCES (20+ templates):
- Resume Guide, Case Study Template, Networking Scripts
- Interview Prep worksheets, PRD Template, Negotiation Scripts

---

USER PROFILE:
- Name: ${firstName}
- Current Role: ${currentRole}
- Career Stage: ${careerStage}
- Target Role: ${targetRole}
- Timeline: ${timeline.replace('_', ' ')} (target: ${targetDateStr})
- Job Search Stage: ${jobSearchStage}
- Interview Confidence: ${interviewConfidence}/5
- Their Struggles (PERSONALIZE HEAVILY based on this): "${struggles}"

---

PREDEFINED ACTION IDs (you MUST use these exact IDs):

Resume Actions:
- resume-import: Import your current resume
- resume-analyze: Analyze your resume and get a score
- resume-score-90: Optimize your resume to a 90+ score
- resume-export: Export your polished resume as PDF
- resume-clone-tailored: Create a tailored resume for target roles

Portfolio Actions:
- portfolio-create: Create your Product Portfolio
- portfolio-profile: Complete your portfolio profile & bio
- portfolio-generate-ideas: Generate case study ideas with AI
- portfolio-first-case: Publish your first case study
- portfolio-second-case: Publish a second case study
- portfolio-publish: Make your portfolio public

Course Actions:
- course-resume-linkedin: Complete Resume & LinkedIn course (2 hrs)
- course-portfolio: Complete Launch a Product Portfolio course (3 hrs)
- course-secure-referral: Complete Secure a Referral course (45 min)
- course-company-prep: Complete Company Prep & Applying course (40 min)
- course-pm-interviews: Complete Nail the PM Interviews course (3 hrs)
- course-negotiation: Complete PM Offer Negotiation course (45 min)
- course-pm-fundamentals: Complete PM Fundamentals course (10 hrs)

Job Search Actions:
- job-add-first: Add your first job application to track
- job-research-companies: Research companies using AI insights
- job-track-applications: Track all applications in Job Center

Networking Actions:
- networking-add-contact: Add your first networking contact
- networking-find-contacts: Find PM contacts at target companies
- networking-scripts: Access networking email scripts

Interview Prep Actions (log practice interviews by type):
- interview-prep-recruiter-screen: Practice recruiter screen interviews
- interview-prep-hiring-manager: Practice hiring manager interviews
- interview-prep-product-sense: Practice product sense interviews
- interview-prep-product-design: Practice product design interviews
- interview-prep-analytics: Practice analytics/execution interviews
- interview-prep-system-design: Practice system design interviews
- interview-prep-technical: Practice technical interviews
- interview-prep-strategy: Practice product strategy interviews
- interview-prep-estimation: Practice estimation interviews
- interview-prep-executive: Practice executive interviews
- interview-prep-cross-functional: Practice cross-functional interviews
- interview-prep-behavioral: Practice behavioral interviews (My 8 Stories worksheet)
- interview-practice-mock: Complete general mock interview sessions
- interview-generate-questions: Generate tailored questions for upcoming interviews
- interview-send-thank-you: Send personalized thank you notes after interviews

Resource Actions:
- resource-resume-guide: Review PM Resume Guide
- resource-interview-frameworks: Study PM Interview Frameworks
- resource-negotiation-scripts: Access Negotiation Scripts
- resource-prd-template: Access PRD Template

Weekly Action IDs (for weeklyGoals - MUST use these):
IMPORTANT: Frame all weekly actions as "per week" in the label (e.g., "Apply to 12 quality roles per week")
- weekly-applications: Apply to X quality roles per week (bounds: 5-25/week)
- weekly-networking-calls: Schedule X networking calls per week (bounds: 2-5/week)
- weekly-outreach-emails: Send X personalized outreach emails per week (bounds: 10-40/week)
- weekly-interview-practice: Complete X mock interview sessions per week (bounds: 1-3/week)
- weekly-company-research: Research X target companies deeply per week (bounds: 2-5/week)
- weekly-course-lessons: Watch X course lessons per week (bounds: 3-10/week)
- weekly-follow-ups: Follow up on X pending applications per week (bounds: 3-10/week)
- weekly-interview-prep: Generate questions & prep for X upcoming interviews per week (bounds: 1-3/week)

---

PERSONALIZATION REQUIREMENTS:

1. Summary (2-3 sentences):
   - Address ${firstName} directly by name
   - Acknowledge their specific background as a ${currentRole}
   - Reference their stated struggles explicitly ("${struggles}")
   - Validate their goal of becoming a ${targetRole} and create excitement
   - Be warm and encouraging but not cheesy

2. Get Started (baselineActions): 2-4 sections of one-time setup actions
   - PREFER predefined action IDs for trackable platform actions
   - You MAY create custom IDs (prefix with "custom-") for highly personalized recommendations
   - Group logically by theme
   - 4-8 actions per section, ordered by priority
   - Include relevant courses naturally integrated
   - Add sublabels with personalized tips when helpful

3. Land The Offer (weeklyGoals): 3-5 recurring weekly actions
   - Use weekly action IDs with specific numbers in the label
   - IMPORTANT: Include a "target" integer for numeric goals
   - Calculate intensity based on timeline:
     * 1 month: Aggressive (higher end of all bounds)
     * 3 months: Steady-aggressive
     * 6 months: Consistent moderate pace
     * 1 year: Sustainable long-term pace
   - Emphasize quality over quantity in the description
   - Reference their target date (${targetDateStr})

Now generate a hyper-personalized plan for ${firstName}.`;
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { onboardingData } = body as { onboardingData: OnboardingData };

    if (!onboardingData) {
      return NextResponse.json({ error: 'Onboarding data is required' }, { status: 400 });
    }

    // Check for OpenAI API key
    const openAIApiKey = process.env.OPEN_AI_SECRET_KEY;

    let plan: PersonalizedPlan;

    if (!openAIApiKey) {
      // Use fallback plan generator if no API key
      console.log('No OpenAI API key configured, using fallback plan generator');
      plan = generatePersonalizedPlan(onboardingData);
    } else {
      try {
        // Build the prompt
        const prompt = buildPrompt(onboardingData);

        // Call OpenAI Responses API with structured output
        const requestPayload = {
          model: 'gpt-4.1',
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
              name: 'personalized_plan',
              schema: PLAN_GENERATION_SCHEMA,
              strict: true,
            },
          },
        };

        const responseResponse = await fetch('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openAIApiKey}`,
          },
          body: JSON.stringify(requestPayload),
        });

        if (!responseResponse.ok) {
          const errorData = await responseResponse.json().catch(() => ({}));
          console.error('OpenAI response error:', errorData);
          // Fall back to deterministic plan
          plan = generatePersonalizedPlan(onboardingData);
        } else {
          const responseData = await responseResponse.json();
          const responseId = responseData.id;

          if (!responseId) {
            plan = generatePersonalizedPlan(onboardingData);
          } else {
            // Poll for completion
            let status = 'in_progress';
            let attempts = 0;
            const maxAttempts = 60;

            while (status === 'in_progress' || status === 'queued') {
              await new Promise((resolve) => setTimeout(resolve, 2000));
              attempts++;

              if (attempts > maxAttempts) {
                plan = generatePersonalizedPlan(onboardingData);
                break;
              }

              const statusResponse = await fetch(
                `https://api.openai.com/v1/responses/${responseId}`,
                {
                  headers: {
                    Authorization: `Bearer ${openAIApiKey}`,
                  },
                }
              );

              if (!statusResponse.ok) {
                plan = generatePersonalizedPlan(onboardingData);
                break;
              }

              const statusData = await statusResponse.json();
              status = statusData.status;

              if (status === 'failed') {
                plan = generatePersonalizedPlan(onboardingData);
                break;
              }
            }

            if (!plan!) {
              // Get final response
              const finalResponse = await fetch(
                `https://api.openai.com/v1/responses/${responseId}`,
                {
                  headers: {
                    Authorization: `Bearer ${openAIApiKey}`,
                  },
                }
              );

              if (!finalResponse.ok) {
                plan = generatePersonalizedPlan(onboardingData);
              } else {
                const finalData = await finalResponse.json();

                // Extract structured output
                let extractedData: any = null;

                const outputItem = finalData.output?.[0];
                if (outputItem?.content) {
                  for (const contentItem of outputItem.content) {
                    if (contentItem.type === 'output_text' && contentItem.text) {
                      try {
                        extractedData = JSON.parse(contentItem.text);
                        break;
                      } catch {
                        // Try next content item
                      }
                    }
                  }
                }

                if (!extractedData) {
                  plan = generatePersonalizedPlan(onboardingData);
                } else {
                  // Transform to match PersonalizedPlan interface
                  plan = {
                    summary: extractedData.summary,
                    baselineActions: extractedData.baselineActions.map((section: any) => ({
                      title: section.title,
                      description: section.description,
                      actions: section.actions.map((action: any) => ({
                        id: action.id,
                        label: action.label,
                        sublabel: action.sublabel,
                        completed: false,
                      })),
                    })),
                    weeklyGoals: {
                      title: extractedData.weeklyGoals.title,
                      description: extractedData.weeklyGoals.description,
                      actions: extractedData.weeklyGoals.actions.map((action: any) => ({
                        id: action.id,
                        label: action.label,
                        target: action.target,
                        completed: false,
                      })),
                    },
                  };
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error calling OpenAI:', error);
        plan = generatePersonalizedPlan(onboardingData);
      }
    }

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
