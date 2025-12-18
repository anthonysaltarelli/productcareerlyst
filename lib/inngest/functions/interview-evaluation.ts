import { inngest } from '../client';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

// Get service role Supabase client for admin operations
const getSupabaseAdmin = () => {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};

// Category-specific skills for quick question practice
const CATEGORY_SKILLS: Record<string, { skills: string[]; descriptions: Record<string, Record<number, string>> }> = {
  'Behavioral': {
    skills: [
      'Story Structure & Clarity',
      'Ownership & Accountability',
      'Impact & Results Orientation',
      'Communication & Executive Presence',
    ],
    descriptions: {
      'Story Structure & Clarity': {
        4: 'Clear, concise, well-structured (context → problem → actions → outcome → reflection). Easy to follow.',
        3: 'Mostly structured, minor tangents or missing transitions.',
        2: 'Lacks clear structure. Important elements unclear or jumbled.',
        1: 'Incoherent. Rambling, confusing, missing critical elements.',
      },
      'Ownership & Accountability': {
        4: 'Clear personal ownership. Distinguishes their role, takes responsibility for outcomes.',
        3: 'Shows ownership but occasionally blurs individual vs team contribution.',
        2: 'Over-credits team/external factors. Personal impact unclear.',
        1: 'Avoids responsibility or claims undue credit.',
      },
      'Impact & Results Orientation': {
        4: 'Clearly articulates measurable outcomes (metrics, user impact, business results).',
        3: 'Describes outcomes, but impact may be partially qualitative.',
        2: 'Mentions results superficially, focuses on effort over impact.',
        1: 'No clear outcomes or impact described.',
      },
      'Communication & Executive Presence': {
        4: 'Communicates confidently, succinctly, and credibly.',
        3: 'Communicates clearly but may over- or under-explain.',
        2: 'Inconsistent, overly verbose, or lacking confidence.',
        1: 'Poor communication; difficult to follow.',
      },
    },
  },
  'Product Sense': {
    skills: [
      'Problem Understanding & Framing',
      'User-Centric Thinking',
      'Solution Creativity & Feasibility',
      'Prioritization & Trade-offs',
    ],
    descriptions: {
      'Problem Understanding & Framing': {
        4: 'Deeply understands the problem space. Asks clarifying questions, identifies constraints and opportunities.',
        3: 'Good problem understanding with minor gaps in exploring edge cases.',
        2: 'Surface-level understanding. Misses key constraints or assumptions.',
        1: 'Fails to understand the problem or makes incorrect assumptions.',
      },
      'User-Centric Thinking': {
        4: 'Clearly identifies user segments, needs, and pain points. Builds solutions around user value.',
        3: 'Shows user awareness but may miss some user segments or needs.',
        2: 'Limited user focus. Solutions feel feature-driven not user-driven.',
        1: 'No clear user consideration in the approach.',
      },
      'Solution Creativity & Feasibility': {
        4: 'Proposes creative yet feasible solutions. Considers technical constraints and business viability.',
        3: 'Solid solutions with some creativity. May overlook feasibility concerns.',
        2: 'Generic solutions or impractical ideas.',
        1: 'Poor solution quality or completely unfeasible proposals.',
      },
      'Prioritization & Trade-offs': {
        4: 'Uses clear frameworks to prioritize. Articulates trade-offs between options.',
        3: 'Shows prioritization thinking but framework usage is inconsistent.',
        2: 'Weak prioritization. Struggles to compare options systematically.',
        1: 'No prioritization logic. Unable to make decisions between options.',
      },
    },
  },
  'Technical': {
    skills: [
      'Technical Communication',
      'System Design Thinking',
      'Data & Metrics Fluency',
      'Engineering Collaboration',
    ],
    descriptions: {
      'Technical Communication': {
        4: 'Explains technical concepts clearly. Adjusts depth appropriately for audience.',
        3: 'Good technical communication with occasional jargon or unclear explanations.',
        2: 'Struggles to explain technical concepts clearly.',
        1: 'Poor technical communication. Confusing or inaccurate explanations.',
      },
      'System Design Thinking': {
        4: 'Demonstrates understanding of system architecture, scalability, and technical trade-offs.',
        3: 'Shows basic system thinking but may miss scalability or edge cases.',
        2: 'Limited system design awareness.',
        1: 'No evidence of system design thinking.',
      },
      'Data & Metrics Fluency': {
        4: 'Defines clear success metrics. Understands data pipelines and instrumentation needs.',
        3: 'Good metrics thinking but may miss some measurement considerations.',
        2: 'Basic metrics awareness without depth.',
        1: 'No clear approach to measurement or data.',
      },
      'Engineering Collaboration': {
        4: 'Demonstrates effective partnership with engineering. Understands constraints and processes.',
        3: 'Shows collaboration ability but may miss some technical partnership nuances.',
        2: 'Limited engineering collaboration experience evident.',
        1: 'No evidence of effective engineering partnership.',
      },
    },
  },
  'Strategy': {
    skills: [
      'Market & Competitive Analysis',
      'Strategic Thinking',
      'Business Model Understanding',
      'Long-term Vision',
    ],
    descriptions: {
      'Market & Competitive Analysis': {
        4: 'Deep understanding of market dynamics, competitors, and positioning opportunities.',
        3: 'Good market awareness with some gaps in competitive analysis.',
        2: 'Surface-level market understanding.',
        1: 'No evident market or competitive awareness.',
      },
      'Strategic Thinking': {
        4: 'Connects tactical decisions to strategic goals. Considers multiple strategic options.',
        3: 'Shows strategic thinking but may focus too narrowly.',
        2: 'Limited strategic perspective. Focuses on tactics over strategy.',
        1: 'No strategic thinking demonstrated.',
      },
      'Business Model Understanding': {
        4: 'Clear understanding of revenue models, unit economics, and business sustainability.',
        3: 'Good business sense with some gaps in financial/economic thinking.',
        2: 'Basic business awareness without depth.',
        1: 'No business model understanding evident.',
      },
      'Long-term Vision': {
        4: 'Articulates compelling long-term vision. Balances short-term wins with long-term goals.',
        3: 'Shows vision but may struggle to connect short and long-term.',
        2: 'Limited long-term thinking.',
        1: 'No vision beyond immediate features.',
      },
    },
  },
  'Product Execution': {
    skills: [
      'Execution Planning',
      'Stakeholder Management',
      'Risk Identification & Mitigation',
      'Delivery & Iteration',
    ],
    descriptions: {
      'Execution Planning': {
        4: 'Creates clear, actionable plans. Breaks down complex work into manageable phases.',
        3: 'Good planning with some gaps in detail or sequencing.',
        2: 'Basic planning without sufficient detail or structure.',
        1: 'No clear execution planning demonstrated.',
      },
      'Stakeholder Management': {
        4: 'Identifies all stakeholders. Manages expectations and alignment effectively.',
        3: 'Good stakeholder awareness with some management gaps.',
        2: 'Limited stakeholder consideration.',
        1: 'No stakeholder management thinking.',
      },
      'Risk Identification & Mitigation': {
        4: 'Proactively identifies risks. Proposes mitigation strategies.',
        3: 'Identifies obvious risks but may miss edge cases.',
        2: 'Limited risk awareness.',
        1: 'No risk thinking demonstrated.',
      },
      'Delivery & Iteration': {
        4: 'Shows strong delivery mindset. Plans for learning and iteration.',
        3: 'Good delivery focus with some gaps in iteration planning.',
        2: 'Basic delivery thinking without iteration mindset.',
        1: 'No clear delivery or iteration approach.',
      },
    },
  },
  'Analytical': {
    skills: [
      'Problem Decomposition',
      'Quantitative Reasoning',
      'Data Interpretation',
      'Hypothesis Formation',
    ],
    descriptions: {
      'Problem Decomposition': {
        4: 'Breaks complex problems into clear, logical components. Systematic approach.',
        3: 'Good decomposition with minor gaps in structure.',
        2: 'Struggles to break down problems systematically.',
        1: 'Unable to decompose problems effectively.',
      },
      'Quantitative Reasoning': {
        4: 'Strong numerical reasoning. Makes reasonable estimates and calculations.',
        3: 'Good quantitative thinking with minor errors.',
        2: 'Basic math skills but struggles with complex reasoning.',
        1: 'Poor quantitative reasoning.',
      },
      'Data Interpretation': {
        4: 'Interprets data accurately. Identifies trends, anomalies, and insights.',
        3: 'Good data interpretation with some missed insights.',
        2: 'Surface-level data interpretation.',
        1: 'Cannot interpret data meaningfully.',
      },
      'Hypothesis Formation': {
        4: 'Forms clear, testable hypotheses. Designs experiments to validate.',
        3: 'Good hypothesis thinking but may miss validation approaches.',
        2: 'Basic hypothesis formation without rigor.',
        1: 'No hypothesis-driven thinking.',
      },
    },
  },
  'Leadership': {
    skills: [
      'Vision & Direction Setting',
      'Team Influence & Motivation',
      'Conflict Resolution',
      'Decision Making Under Uncertainty',
    ],
    descriptions: {
      'Vision & Direction Setting': {
        4: 'Sets clear direction. Inspires others with compelling vision.',
        3: 'Good direction setting with some clarity gaps.',
        2: 'Limited vision articulation.',
        1: 'Cannot set clear direction.',
      },
      'Team Influence & Motivation': {
        4: 'Influences without authority. Motivates teams effectively.',
        3: 'Good influence skills with some gaps.',
        2: 'Limited influence beyond direct authority.',
        1: 'Cannot influence or motivate others.',
      },
      'Conflict Resolution': {
        4: 'Handles conflict constructively. Finds win-win solutions.',
        3: 'Resolves conflict but may avoid difficult conversations.',
        2: 'Struggles with conflict resolution.',
        1: 'Avoids or escalates conflict inappropriately.',
      },
      'Decision Making Under Uncertainty': {
        4: 'Makes sound decisions with incomplete information. Comfortable with ambiguity.',
        3: 'Good decision making but may seek excessive certainty.',
        2: 'Struggles to decide without complete information.',
        1: 'Paralyzed by uncertainty.',
      },
    },
  },
  'Culture Fit': {
    skills: [
      'Values Alignment',
      'Collaboration Style',
      'Growth Mindset',
      'Professional Maturity',
    ],
    descriptions: {
      'Values Alignment': {
        4: 'Demonstrates strong alignment with company values. Articulates personal values clearly.',
        3: 'Good values alignment with some areas to explore.',
        2: 'Unclear values or potential misalignment.',
        1: 'Clear values misalignment.',
      },
      'Collaboration Style': {
        4: 'Collaborative approach. Works well across functions and levels.',
        3: 'Good collaboration with some style preferences.',
        2: 'Limited collaboration evidence.',
        1: 'Poor collaboration style.',
      },
      'Growth Mindset': {
        4: 'Demonstrates continuous learning. Embraces feedback and challenges.',
        3: 'Shows growth orientation with some fixed mindset tendencies.',
        2: 'Limited growth mindset evidence.',
        1: 'Fixed mindset; resistant to feedback.',
      },
      'Professional Maturity': {
        4: 'High EQ. Handles pressure and ambiguity with grace.',
        3: 'Good professional maturity with some development areas.',
        2: 'Some maturity concerns.',
        1: 'Significant maturity concerns.',
      },
    },
  },
  'Industry Knowledge': {
    skills: [
      'Domain Expertise',
      'Trend Awareness',
      'Regulatory & Compliance Understanding',
      'Customer Ecosystem Knowledge',
    ],
    descriptions: {
      'Domain Expertise': {
        4: 'Deep domain knowledge. Understands industry-specific challenges and opportunities.',
        3: 'Good domain knowledge with some gaps.',
        2: 'Basic industry understanding.',
        1: 'No domain expertise evident.',
      },
      'Trend Awareness': {
        4: 'Aware of industry trends. Connects trends to product opportunities.',
        3: 'Good trend awareness with some blind spots.',
        2: 'Limited trend knowledge.',
        1: 'Unaware of industry trends.',
      },
      'Regulatory & Compliance Understanding': {
        4: 'Understands regulatory landscape. Builds compliance into product thinking.',
        3: 'Good regulatory awareness with some gaps.',
        2: 'Basic compliance awareness.',
        1: 'No regulatory consideration.',
      },
      'Customer Ecosystem Knowledge': {
        4: 'Deep understanding of customer ecosystem, workflows, and pain points.',
        3: 'Good customer knowledge with some gaps.',
        2: 'Limited customer ecosystem understanding.',
        1: 'No customer ecosystem knowledge.',
      },
    },
  },
};

// Add lowercase aliases for job-specific interview categories
// These map to the same skills as their uppercase counterparts
CATEGORY_SKILLS['behavioral'] = CATEGORY_SKILLS['Behavioral'];
CATEGORY_SKILLS['product_sense'] = CATEGORY_SKILLS['Product Sense'];
// For company, role, and industry - use a general PM skills set (falls back to Behavioral)
CATEGORY_SKILLS['company'] = CATEGORY_SKILLS['Culture Fit']; // Company fit questions align with culture fit skills
CATEGORY_SKILLS['role'] = CATEGORY_SKILLS['Behavioral']; // Role fit questions align with behavioral skills
CATEGORY_SKILLS['industry'] = CATEGORY_SKILLS['Industry Knowledge']; // Industry questions use industry skills

// Default skills for unknown categories (falls back to behavioral)
const DEFAULT_CATEGORY = 'Behavioral';

// JSON Schema for full interview structured output (12 skills)
const FULL_INTERVIEW_EVALUATION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    skills: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          skillName: { type: 'string' },
          score: {
            type: 'number',
            enum: [1, 1.5, 2, 2.5, 3, 3.5, 4],
          },
          explanation: { type: 'string' },
          supportingQuotes: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['skillName', 'score', 'explanation', 'supportingQuotes'],
      },
      minItems: 12,
      maxItems: 12,
    },
    overallVerdict: {
      type: 'string',
      enum: ['Strong No Hire', 'No Hire', 'Hire', 'Strong Hire'],
    },
    overallExplanation: { type: 'string' },
    recommendedImprovements: {
      type: 'array',
      items: { type: 'string' },
      minItems: 3,
      maxItems: 7,
    },
  },
  required: ['skills', 'overallVerdict', 'overallExplanation', 'recommendedImprovements'],
};

// JSON Schema for quick question structured output (4 skills)
const QUICK_QUESTION_EVALUATION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    skills: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          skillName: { type: 'string' },
          score: {
            type: 'number',
            enum: [1, 1.5, 2, 2.5, 3, 3.5, 4],
          },
          explanation: { type: 'string' },
          supportingQuotes: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['skillName', 'score', 'explanation', 'supportingQuotes'],
      },
      minItems: 4,
      maxItems: 4,
    },
    overallVerdict: {
      type: 'string',
      enum: ['Strong', 'Good', 'Needs Work', 'Weak'],
    },
    overallExplanation: { type: 'string' },
    recommendedImprovements: {
      type: 'array',
      items: { type: 'string' },
      minItems: 2,
      maxItems: 4,
    },
  },
  required: ['skills', 'overallVerdict', 'overallExplanation', 'recommendedImprovements'],
};

// JSON Schema for job-specific interview structured output (6 skills)
const JOB_SPECIFIC_EVALUATION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    skills: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          skillName: { type: 'string' },
          score: {
            type: 'number',
            enum: [1, 1.5, 2, 2.5, 3, 3.5, 4],
          },
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
      enum: ['Strong No Hire', 'No Hire', 'Hire', 'Strong Hire'],
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
  required: ['skills', 'overallVerdict', 'overallExplanation', 'recommendedImprovements', 'companyFitAssessment'],
};

// Build the comprehensive evaluation prompt for full interviews
const createFullEvaluationPrompt = (transcript: { sender: string; message: string }[]) => {
  const transcriptText = transcript
    .map((msg) => `[${msg.sender.toUpperCase()}]: ${msg.message}`)
    .join('\n\n');

  return `You are a critical, nuanced, and action-oriented product management career coach evaluating a mock behavioral interview performance.

## Your Role
You are evaluating this candidate as if you were a senior PM interviewer at a top tech company. Be honest, constructive, and calibrated. Your feedback should help the candidate improve for real interviews.

## N+STAR+TL Framework

This is an elevated version of the traditional STAR method, optimized for product management interviews. The best PM candidates naturally structure their answers this way:

**N - Nugget**: The summary or punchline of the story. A quick, one-sentence overview that hooks the interviewer's attention and sets expectations for what's to come.

**S - Situation**: The context or circumstances of the story. Provides enough detail for the interviewer to understand what was going on, but remains concise. Sets the stage without over-explaining.

**T - Task**: The candidate's specific role or responsibility in the situation. What were they expected to accomplish? This clarifies ownership and scope.

**A - Action**: The specific actions the candidate took to address the task or problem. Must be specific and focus on what THEY did (not the team or manager). This is where individual contribution shines.

**R - Result**: The outcomes of the actions taken. Should be quantified with concrete numbers, percentages, or metrics whenever possible. Connects actions directly to business/user impact.

**T - Takeaway**: What the candidate learned or what insights they gained from the situation. Demonstrates self-awareness and a reflective mindset.

**L - Learning**: How they applied (or plan to apply) what they learned to future tasks or challenges. Shows growth mindset, adaptability, and continuous improvement.

**Why N+STAR+TL is effective**: It forces candidates to be concise (Nugget), provide context without rambling (Situation/Task), demonstrate ownership (Action), prove impact (Result), and show they're constantly learning and improving (Takeaway/Learning).

## Scoring Scale

**Per-Skill Scores** (1-4, half points like 2.5 or 3.5 allowed):
- **4 - Very Strong**: Candidate demonstrated exceptional experience with this skill
- **3 - Strong**: Candidate demonstrated decent experience with this skill
- **2 - Weak**: Candidate demonstrated sub-par experience with this skill
- **1 - Very Weak**: Candidate demonstrated a complete lack of this skill

**Overall Verdicts**:
- **Strong Hire**: One of the strongest candidates I've seen, we need them
- **Hire**: I think this candidate would have an impact on our team
- **No Hire**: I am not confident this candidate will have a positive impact
- **Strong No Hire**: I am confident this candidate will not perform well

## Skills to Evaluate (12 Total)

You MUST evaluate ALL 12 skills in the exact order below. For EACH skill, provide:
1. A score (1-4, half points allowed)
2. A detailed explanation of why you gave that score
3. 1-3 direct quotes from the candidate that support your assessment

### 1. Story Structure & Clarity
- **4**: Presents a clear, concise, and well-structured story (context → problem → actions → outcome → reflection). Easy to follow with no unnecessary detail.
- **3**: Story is mostly structured and understandable, but may include minor tangents or missing transitions.
- **2**: Story lacks clear structure. Important context or outcomes are unclear or jumbled.
- **1**: Unable to tell a coherent story. Rambling, confusing, or missing critical elements.

### 2. Ownership & Accountability
- **4**: Demonstrates clear personal ownership. Explicitly distinguishes their role from others and takes responsibility for both successes and failures.
- **3**: Shows ownership but occasionally blurs individual contribution with team outcomes.
- **2**: Over-credits the team or external factors. Personal impact is unclear.
- **1**: Avoids responsibility entirely or claims undue credit without evidence.

### 3. Decision-Making & Judgment
- **4**: Explains why decisions were made, including alternatives considered. Shows strong judgment under ambiguity or pressure.
- **3**: Explains decisions reasonably well, but with limited discussion of alternatives or tradeoffs.
- **2**: Decisions appear reactive or poorly reasoned. Limited explanation of rationale.
- **1**: Unable to explain decision-making process or shows consistently poor judgment.

### 4. Impact & Results Orientation
- **4**: Clearly articulates measurable outcomes (metrics, user impact, business results). Connects actions directly to outcomes.
- **3**: Describes outcomes, but impact may be partially qualitative or loosely tied to actions.
- **2**: Mentions results superficially or focuses on effort rather than impact.
- **1**: No clear outcomes or impact described.

### 5. Learning & Self-Reflection
- **4**: Demonstrates deep self-awareness. Clearly articulates lessons learned and how behavior changed as a result.
- **3**: Identifies lessons learned but reflection lacks depth or specificity.
- **2**: Acknowledges learning at a surface level without clear application.
- **1**: Shows no reflection or claims they would not change anything.

### 6. Handling Conflict & Stakeholder Management
- **4**: Navigates conflict thoughtfully. Demonstrates empathy, influence without authority, and effective stakeholder alignment.
- **3**: Handles conflict competently but may rely on escalation or authority.
- **2**: Struggles with conflict or avoids addressing it directly.
- **1**: Escalates unnecessarily, creates conflict, or avoids it entirely.

### 7. Bias for Action & Ownership Under Ambiguity
- **4**: Proactively identifies problems and takes initiative despite incomplete information. Comfortable making decisions under uncertainty.
- **3**: Takes action once direction is clear. Some hesitation in ambiguous situations.
- **2**: Requires significant guidance or validation before acting.
- **1**: Avoids action or waits indefinitely for direction.

### 8. Cross-Functional Collaboration
- **4**: Effectively partners across engineering, design, data, and business. Builds trust and drives alignment.
- **3**: Collaborates well but may struggle in more complex or contentious situations.
- **2**: Limited collaboration or unclear interaction with cross-functional partners.
- **1**: Demonstrates poor collaboration or adversarial behavior.

### 9. Communication & Executive Presence
- **4**: Communicates confidently, succinctly, and credibly. Adjusts depth and framing based on audience.
- **3**: Communicates clearly but may over- or under-explain at times.
- **2**: Communication is inconsistent, overly verbose, or lacking confidence.
- **1**: Poor communication; difficult to follow or disengaging.

### 10. Values, Integrity & Professional Maturity
- **4**: Demonstrates strong ethical judgment, humility, and respect for others. Aligns actions with company and product values.
- **3**: Generally professional and values-driven, with minor gaps.
- **2**: Occasional signs of misaligned priorities or questionable judgment.
- **1**: Demonstrates poor integrity, blame-shifting, or unprofessional behavior.

### 11. Adaptability & Resilience
- **4**: Responds constructively to failure, change, or feedback. Demonstrates resilience and growth mindset.
- **3**: Adapts to change but may take time to recalibrate.
- **2**: Struggles with change or feedback.
- **1**: Resistant to feedback or unable to adapt.

### 12. Product Mindset (Behavioral Signal)
- **4**: Consistently frames experiences through user value, business impact, and long-term product thinking—even in behavioral examples.
- **3**: Occasionally ties experiences back to product principles.
- **2**: Focuses mostly on execution or process without product framing.
- **1**: No evidence of product thinking in examples.

## Interview Transcript to Evaluate

${transcriptText}

## Instructions

1. Evaluate each of the 12 skills in the exact order listed above
2. For each skill, provide:
   - The skill name (exactly as written above)
   - A score from 1-4 (half points allowed: 1.5, 2.5, 3.5)
   - A detailed explanation referencing specific parts of the interview
   - 1-3 direct quotes from the candidate (the USER messages) that support your assessment
3. Provide an overall verdict (Strong No Hire, No Hire, Hire, or Strong Hire)
4. Write a comprehensive overall explanation (2-3 paragraphs) summarizing the candidate's performance
5. List 3-7 specific, actionable improvements the candidate should work on

Be rigorous but fair. Ground all feedback in specific evidence from the transcript.`;
};

// Get category-specific guidance for the evaluation prompt
function getCategoryGuidance(category: string): string {
  switch (category) {
    case 'Behavioral':
      return `## N+STAR+TL Framework

The best PM candidates structure their behavioral answers using this elevated STAR method:

**N - Nugget**: Quick summary that hooks the interviewer
**S - Situation**: Concise context setting
**T - Task**: Their specific role/responsibility
**A - Action**: Specific actions THEY took (not the team)
**R - Result**: Quantified outcomes with metrics
**T - Takeaway**: Lessons learned
**L - Learning**: How they applied those lessons`;

    case 'Product Sense':
      return `## Product Sense Framework

Strong product sense answers typically include:

**Problem Clarification**: Asking clarifying questions to understand scope, constraints, and goals
**User Segmentation**: Identifying and prioritizing target users
**Pain Points**: Understanding user needs and pain points
**Solution Generation**: Creative yet feasible solutions
**Prioritization**: Using frameworks to prioritize features/solutions
**Success Metrics**: Defining how to measure success`;

    case 'Technical':
      return `## Technical Interview Framework

Strong technical answers demonstrate:

**System Understanding**: Clear grasp of how systems work
**Technical Depth**: Ability to go deep when needed
**Trade-off Analysis**: Understanding pros/cons of technical decisions
**Collaboration Mindset**: How they work with engineering
**Data Fluency**: Comfort with metrics, analytics, and data pipelines`;

    case 'Strategy':
      return `## Strategy Framework

Strong strategy answers include:

**Market Analysis**: Understanding of market dynamics and competition
**Business Model**: Clear thinking about revenue and sustainability
**Strategic Options**: Considering multiple paths forward
**Long-term Thinking**: Balancing short-term wins with long-term vision
**Trade-offs**: Articulating what you're choosing NOT to do`;

    case 'Product Execution':
      return `## Execution Framework

Strong execution answers demonstrate:

**Planning**: Breaking down complex work into phases
**Stakeholder Management**: Identifying and aligning stakeholders
**Risk Management**: Anticipating and mitigating risks
**Delivery Focus**: Shipping mindset with quality
**Iteration**: Learning and improving based on feedback`;

    case 'Analytical':
      return `## Analytical Framework

Strong analytical answers include:

**Problem Decomposition**: Breaking complex problems into components
**Quantitative Reasoning**: Making reasonable estimates and calculations
**Data Interpretation**: Drawing insights from information
**Hypothesis Thinking**: Forming and testing hypotheses
**Structured Approach**: Systematic problem-solving`;

    case 'Leadership':
      return `## Leadership Framework

Strong leadership answers demonstrate:

**Vision Setting**: Articulating direction and inspiring others
**Influence**: Leading without formal authority
**Conflict Resolution**: Handling disagreements constructively
**Decision Making**: Making calls with incomplete information
**Team Development**: Growing and empowering others`;

    case 'Culture Fit':
      return `## Culture Fit Framework

Strong culture fit answers show:

**Values Alignment**: Authentic connection to company values
**Self-Awareness**: Understanding of own strengths and growth areas
**Collaboration**: How they work with others
**Growth Mindset**: Openness to feedback and learning
**Professional Maturity**: Handling pressure and ambiguity`;

    case 'Industry Knowledge':
    case 'industry':
      return `## Industry Knowledge Framework

Strong industry answers demonstrate:

**Domain Expertise**: Deep understanding of the industry
**Trend Awareness**: Knowledge of current and emerging trends
**Regulatory Understanding**: Awareness of compliance considerations
**Customer Knowledge**: Understanding of customer ecosystem`;

    // Job-specific interview categories (lowercase)
    case 'behavioral':
      return getCategoryGuidance('Behavioral');

    case 'product_sense':
      return getCategoryGuidance('Product Sense');

    case 'company':
      return `## Company Fit Framework

Strong company fit answers demonstrate:

**Company Knowledge**: Specific knowledge of the company's mission, products, and values
**Genuine Enthusiasm**: Authentic interest, not generic enthusiasm
**Career Alignment**: Clear connection between your goals and the company
**Cultural Fit**: Understanding of how you'd contribute to the company culture`;

    case 'role':
      return `## Role Fit Framework

Strong role fit answers demonstrate:

**Relevant Experience**: Clear examples that map to role requirements
**Skill Transfer**: How existing skills apply to this specific role
**Role Understanding**: Deep knowledge of the position's responsibilities
**Growth Trajectory**: How this role fits your career path`;

    default:
      return `## General PM Interview Framework

Strong answers typically demonstrate:

**Clear Communication**: Structured, concise responses
**Evidence-Based**: Specific examples and metrics
**User Focus**: Customer-centric thinking
**Business Awareness**: Understanding of business impact
**Self-Reflection**: Lessons learned and growth`;
  }
}

// Build the evaluation prompt for quick question practice (category-aware)
const createQuickQuestionEvaluationPrompt = (
  transcript: { sender: string; message: string }[],
  question: { question: string; category: string }
) => {
  const transcriptText = transcript
    .map((msg) => `[${msg.sender.toUpperCase()}]: ${msg.message}`)
    .join('\n\n');

  // Get category-specific skills or fall back to default
  const categoryConfig = CATEGORY_SKILLS[question.category] || CATEGORY_SKILLS[DEFAULT_CATEGORY];
  const skills = categoryConfig.skills;
  const descriptions = categoryConfig.descriptions;

  // Build skills section dynamically
  const skillsSection = skills.map((skill, index) => {
    const desc = descriptions[skill];
    return `### ${index + 1}. ${skill}
- **4**: ${desc[4]}
- **3**: ${desc[3]}
- **2**: ${desc[2]}
- **1**: ${desc[1]}`;
  }).join('\n\n');

  // Different context guidance based on category
  const categoryGuidance = getCategoryGuidance(question.category);

  return `You are a product management career coach evaluating a candidate's response to a PM interview question.

## The Question Asked
Category: ${question.category}
Question: "${question.question}"

## Your Role
Evaluate this answer as if you were a senior PM interviewer at a top tech company. Be honest, constructive, and helpful. This is practice - your feedback should help them improve.

${categoryGuidance}

## Scoring Scale (1-4, half points allowed)
- **4 - Very Strong**: Exceptional demonstration of this skill
- **3 - Strong**: Good demonstration of this skill
- **2 - Weak**: Sub-par demonstration of this skill
- **1 - Very Weak**: Did not demonstrate this skill

## Skills to Evaluate (${skills.length} Total)

Evaluate these ${skills.length} skills in order:

${skillsSection}

## Transcript to Evaluate

${transcriptText}

## Overall Verdict Scale
- **Strong**: Excellent answer - would stand out in a real interview
- **Good**: Solid answer - would meet expectations
- **Needs Work**: Has potential but needs improvement
- **Weak**: Significant gaps - needs substantial practice

## Instructions

1. Evaluate each of the ${skills.length} skills in the exact order listed above
2. For each skill, provide:
   - The skill name (exactly as written)
   - A score from 1-4 (half points allowed)
   - A 2-3 sentence explanation
   - 1-2 direct quotes from the candidate
3. Provide an overall verdict (Strong, Good, Needs Work, or Weak)
4. Write a brief overall explanation (1 paragraph) summarizing their answer
5. List 2-4 specific, actionable improvements

Be constructive but honest. This is practice - help them improve.`;
};

// Build the evaluation prompt for job-specific interviews
const createJobSpecificEvaluationPrompt = (
  transcript: { sender: string; message: string }[],
  jobContext: {
    companyName: string;
    jobTitle: string;
    descriptionSnippet?: string;
  },
  questions: Array<{ question: string; category: string }>
) => {
  const transcriptText = transcript
    .map((msg) => `[${msg.sender.toUpperCase()}]: ${msg.message}`)
    .join('\n\n');

  const questionsAsked = questions
    .map((q, i) => `${i + 1}. "${q.question}" (${q.category})`)
    .join('\n');

  return `You are a senior product management interviewer evaluating a candidate's performance in a mock interview for the ${jobContext.jobTitle} role at ${jobContext.companyName}.

## Interview Context
- **Company**: ${jobContext.companyName}
- **Role**: ${jobContext.jobTitle}
${jobContext.descriptionSnippet ? `- **Job Description Snippet**: ${jobContext.descriptionSnippet}` : ''}

## Questions Asked in This Interview
${questionsAsked}

## Your Role
Evaluate this candidate as if you were a hiring manager at ${jobContext.companyName}. Consider both their general PM skills AND their specific fit for this company and role. Be honest, constructive, and calibrated.

## Scoring Scale (1-4, half points allowed)
- **4 - Very Strong**: Exceptional demonstration - would stand out at ${jobContext.companyName}
- **3 - Strong**: Solid demonstration - meets expectations for this role
- **2 - Weak**: Below expectations - has gaps to address
- **1 - Very Weak**: Significant concerns - not ready for this role

## Skills to Evaluate (6 Total)

### 1. Company Knowledge & Enthusiasm
- **4**: Demonstrates deep knowledge of ${jobContext.companyName}'s mission, products, challenges, and culture. Shows genuine enthusiasm and specific reasons for interest.
- **3**: Good company knowledge with some gaps. Shows clear interest but could be more specific.
- **2**: Surface-level company knowledge. Generic enthusiasm that could apply to any company.
- **1**: Little to no knowledge of ${jobContext.companyName}. No compelling reason for interest.

### 2. Role Fit & Relevant Experience
- **4**: Experience aligns strongly with role requirements. Clear examples of similar challenges and successes.
- **3**: Good alignment with most requirements. Some gaps but shows transferable skills.
- **2**: Limited alignment with role requirements. Struggles to connect experience to this position.
- **1**: Poor fit for role requirements. No relevant experience demonstrated.

### 3. Industry/Market Awareness
- **4**: Deep understanding of ${jobContext.companyName}'s competitive landscape, market challenges, and industry trends.
- **3**: Good market awareness with some blind spots.
- **2**: Basic industry understanding without depth.
- **1**: No market or competitive awareness demonstrated.

### 4. Story Structure & Clarity
- **4**: Clear, well-structured answers. Uses specific examples with quantified results.
- **3**: Mostly structured answers with minor gaps in clarity.
- **2**: Disorganized or vague answers. Lacks specific examples.
- **1**: Rambling or incoherent answers. Unable to provide clear examples.

### 5. Impact & Results Orientation
- **4**: Consistently demonstrates measurable impact with specific metrics and outcomes.
- **3**: Shows impact but metrics are sometimes qualitative or vague.
- **2**: Focuses on activities rather than outcomes.
- **1**: No clear impact or results demonstrated.

### 6. Communication & Executive Presence
- **4**: Confident, articulate, and engaging. Adjusts communication style appropriately.
- **3**: Clear communication with minor issues.
- **2**: Inconsistent communication. Overly verbose or lacking confidence.
- **1**: Poor communication that detracts from content.

## Interview Transcript to Evaluate

${transcriptText}

## Overall Verdict Scale
- **Strong Hire**: Exceptional candidate for ${jobContext.companyName} - would make an immediate impact
- **Hire**: Good candidate - would succeed in this role at ${jobContext.companyName}
- **No Hire**: Not confident this candidate would succeed at ${jobContext.companyName}
- **Strong No Hire**: Clear gaps that would prevent success in this role

## Instructions

1. Evaluate ALL 6 skills in the exact order listed above
2. For each skill, provide:
   - The skill name (exactly as written)
   - A score from 1-4 (half points allowed)
   - A detailed explanation referencing specific parts of the interview
   - 1-3 direct quotes from the candidate (USER messages) that support your assessment
3. Provide an overall verdict for this candidate at ${jobContext.companyName}
4. Write an overall explanation (2 paragraphs) summarizing their performance and fit
5. List 2-5 specific improvements they should work on for ${jobContext.companyName} interviews
6. Provide a company fit assessment (1 paragraph) specifically addressing how well they would fit at ${jobContext.companyName}

Be rigorous but fair. Ground all feedback in specific evidence from the transcript.`;
};

/**
 * Evaluate interview using OpenAI - Inngest background function
 *
 * This function handles the long-running OpenAI evaluation in the background,
 * allowing users to navigate away and return to see results.
 */
export const evaluateInterview = inngest.createFunction(
  {
    id: 'evaluate-interview',
    retries: 1,
  },
  { event: 'interview/evaluation.requested' },
  async ({ event, step }) => {
    const { interviewId, userId, interviewMode } = event.data;

    console.log('[Inngest] evaluateInterview started', { interviewId, userId, interviewMode });

    const supabase = getSupabaseAdmin();

    // Step 1: Fetch interview data and build prompt
    const interviewData = await step.run('fetch-interview-data', async () => {
      const { data: interview, error } = await supabase
        .from('mock_interviews')
        .select(`
          id,
          user_id,
          transcript,
          interview_mode,
          question_id,
          job_context,
          generated_questions,
          adhoc_question,
          pm_interview_questions (
            id,
            category,
            question,
            guidance
          )
        `)
        .eq('id', interviewId)
        .eq('user_id', userId)
        .single();

      if (error || !interview) {
        throw new Error(`Interview not found: ${error?.message || 'unknown'}`);
      }

      if (!interview.transcript || interview.transcript.length === 0) {
        throw new Error('No transcript available for evaluation');
      }

      return interview;
    });

    // Step 2: Build prompt and schema based on interview mode
    const { prompt, schema, expectedSkillCount, schemaName } = await step.run('build-prompt', async () => {
      const mode = interviewData.interview_mode;

      if (mode === 'quick_question') {
        // Check for question from question bank OR ad-hoc question
        const questionFromBank = interviewData.pm_interview_questions as unknown as { question: string; category: string } | null;
        const adhocQuestion = interviewData.adhoc_question as { question: string; category: string } | null;
        const question = questionFromBank || adhocQuestion;

        if (!question) {
          throw new Error('Question data not found for quick question interview');
        }
        const categoryConfig = CATEGORY_SKILLS[question.category] || CATEGORY_SKILLS[DEFAULT_CATEGORY];
        return {
          prompt: createQuickQuestionEvaluationPrompt(interviewData.transcript, question),
          schema: QUICK_QUESTION_EVALUATION_SCHEMA,
          expectedSkillCount: categoryConfig.skills.length,
          schemaName: 'quick_question_evaluation',
        };
      } else if (mode === 'job_specific') {
        // Job-specific interview mode
        const jobContext = interviewData.job_context as { companyName: string; jobTitle: string; descriptionSnippet?: string } | null;
        const generatedQuestions = interviewData.generated_questions as Array<{ question: string; category: string }> | null;

        if (!jobContext) {
          throw new Error('Job context not found for job-specific interview');
        }
        if (!generatedQuestions || generatedQuestions.length === 0) {
          throw new Error('Generated questions not found for job-specific interview');
        }

        return {
          prompt: createJobSpecificEvaluationPrompt(interviewData.transcript, jobContext, generatedQuestions),
          schema: JOB_SPECIFIC_EVALUATION_SCHEMA,
          expectedSkillCount: 6,
          schemaName: 'job_specific_evaluation',
        };
      } else {
        // Full interview mode (default)
        return {
          prompt: createFullEvaluationPrompt(interviewData.transcript),
          schema: FULL_INTERVIEW_EVALUATION_SCHEMA,
          expectedSkillCount: 12,
          schemaName: 'interview_evaluation',
        };
      }
    });

    // Step 3: Create OpenAI response
    const responseId = await step.run('create-openai-response', async () => {
      const openAIApiKey = process.env.OPEN_AI_SECRET_KEY;
      if (!openAIApiKey) {
        throw new Error('OpenAI API key not configured');
      }

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
            name: schemaName,
            schema: schema,
            strict: true,
          },
        },
      };

      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAIApiKey}`,
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[Inngest] OpenAI response error:', errorData);
        throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      if (!data.id) {
        throw new Error('Failed to get response ID from OpenAI');
      }

      console.log('[Inngest] OpenAI response created', { responseId: data.id });
      return data.id;
    });

    // Step 4: Poll for completion
    const evaluation = await step.run('poll-for-completion', async () => {
      const openAIApiKey = process.env.OPEN_AI_SECRET_KEY!;
      let status = 'in_progress';
      let attempts = 0;
      const maxAttempts = 60; // 2 minutes max

      while (status === 'in_progress' || status === 'queued') {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
        attempts++;

        if (attempts > maxAttempts) {
          throw new Error('Timeout waiting for OpenAI response');
        }

        const statusResponse = await fetch(`https://api.openai.com/v1/responses/${responseId}`, {
          headers: {
            Authorization: `Bearer ${openAIApiKey}`,
          },
        });

        if (!statusResponse.ok) {
          const errorData = await statusResponse.json().catch(() => ({}));
          console.error('[Inngest] OpenAI status check error:', errorData);
          throw new Error(`Failed to check OpenAI response status: ${JSON.stringify(errorData)}`);
        }

        const statusData = await statusResponse.json();
        status = statusData.status;

        console.log('[Inngest] OpenAI status check', { attempt: attempts, status });

        if (status === 'failed') {
          throw new Error(`OpenAI processing failed: ${JSON.stringify(statusData.error || {})}`);
        }
      }

      // Get final response
      const finalResponse = await fetch(`https://api.openai.com/v1/responses/${responseId}`, {
        headers: {
          Authorization: `Bearer ${openAIApiKey}`,
        },
      });

      if (!finalResponse.ok) {
        throw new Error('Failed to retrieve final response from OpenAI');
      }

      const finalData = await finalResponse.json();

      // Extract structured output
      let extractedData: {
        skills: Array<{
          skillName: string;
          score: number;
          explanation: string;
          supportingQuotes: string[];
        }>;
        overallVerdict: string;
        overallExplanation: string;
        recommendedImprovements: string[];
        companyFitAssessment?: string; // Only for job_specific mode
      } | null = null;

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

      // Check for refusal
      if (!extractedData) {
        if (outputItem?.content) {
          for (const contentItem of outputItem.content) {
            if (contentItem.type === 'refusal' && contentItem.refusal) {
              throw new Error(`OpenAI refused to evaluate: ${contentItem.refusal}`);
            }
          }
        }
        throw new Error('Failed to extract structured data from OpenAI response');
      }

      // Validate skill count
      if (!extractedData.skills || extractedData.skills.length !== expectedSkillCount) {
        throw new Error(
          `Expected ${expectedSkillCount} skill evaluations, got ${extractedData.skills?.length || 0}`
        );
      }

      return extractedData;
    });

    // Step 5: Save evaluation to database
    await step.run('save-evaluation', async () => {
      const questionData = interviewData.pm_interview_questions as unknown as { question: string; category: string } | null;
      const mode = interviewData.interview_mode;
      const isQuickQuestion = mode === 'quick_question';
      const isJobSpecific = mode === 'job_specific';

      // Build the evaluation object based on interview mode
      const fullEvaluation: Record<string, unknown> = {
        ...evaluation,
        interviewMode: mode || 'full',
        evaluatedAt: new Date().toISOString(),
        modelVersion: 'gpt-4.1',
      };

      // Add question context for quick question mode
      if (isQuickQuestion) {
        const adhocQuestion = interviewData.adhoc_question as { question: string; category: string; source?: { type: string; companyName: string; jobTitle: string } } | null;
        if (questionData) {
          fullEvaluation.questionPracticed = {
            question: questionData.question,
            category: questionData.category,
          };
        } else if (adhocQuestion) {
          fullEvaluation.questionPracticed = {
            question: adhocQuestion.question,
            category: adhocQuestion.category,
            source: adhocQuestion.source,
          };
        }
      }

      // Add job context for job-specific mode
      if (isJobSpecific) {
        const jobContext = interviewData.job_context as { companyName: string; jobTitle: string; descriptionSnippet?: string } | null;
        const generatedQuestions = interviewData.generated_questions as Array<{ question: string; category: string }> | null;

        fullEvaluation.jobContext = jobContext;
        fullEvaluation.questionsAsked = generatedQuestions;
        // companyFitAssessment is already included via ...evaluation spread
      }

      const { error: updateError } = await supabase
        .from('mock_interviews')
        .update({
          ai_evaluation: fullEvaluation,
          ai_evaluation_created_at: new Date().toISOString(),
          ai_evaluation_status: 'completed',
          ai_evaluation_error: null,
        })
        .eq('id', interviewId)
        .eq('user_id', userId);

      if (updateError) {
        console.error('[Inngest] Error saving evaluation:', updateError);
        throw new Error(`Failed to save evaluation: ${updateError.message}`);
      }

      console.log('[Inngest] Evaluation saved successfully', { interviewId });
    });

    return {
      success: true,
      interviewId,
      skillsEvaluated: evaluation.skills.length,
      verdict: evaluation.overallVerdict,
    };
  }
);

/**
 * Handle evaluation failure - update status in database
 */
export const handleEvaluationFailure = inngest.createFunction(
  {
    id: 'handle-evaluation-failure',
    retries: 0, // Don't retry failure handler
  },
  { event: 'inngest/function.failed' },
  async ({ event, step }) => {
    // Only handle failures from evaluate-interview function
    if (event.data.function_id !== 'evaluate-interview') {
      return { skipped: true };
    }

    const originalEvent = event.data.event as { data: { interviewId: string; userId: string } };
    const { interviewId, userId } = originalEvent.data;
    const errorMessage = event.data.error?.message || 'Unknown error occurred';

    console.log('[Inngest] Handling evaluation failure', { interviewId, errorMessage });

    await step.run('update-status-failed', async () => {
      const supabase = getSupabaseAdmin();

      const { error } = await supabase
        .from('mock_interviews')
        .update({
          ai_evaluation_status: 'failed',
          ai_evaluation_error: errorMessage,
        })
        .eq('id', interviewId)
        .eq('user_id', userId);

      if (error) {
        console.error('[Inngest] Failed to update failure status:', error);
      }
    });

    return { success: true, interviewId, error: errorMessage };
  }
);
