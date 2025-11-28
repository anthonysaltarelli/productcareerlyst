import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Get current month-year string (YYYY-MM)
const getCurrentMonthYear = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// GET /api/resume/versions/[versionId]/analyze - Get analysis and usage info
export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) => {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { versionId } = await params;

    // Verify version ownership
    const { data: version, error: versionError } = await supabase
      .from('resume_versions')
      .select('*')
      .eq('id', versionId)
      .eq('user_id', user.id)
      .single();

    if (versionError || !version) {
      return NextResponse.json(
        { error: 'Resume version not found' },
        { status: 404 }
      );
    }

    // Get analysis if exists
    const { data: analysis } = await supabase
      .from('resume_analyses')
      .select('*')
      .eq('resume_version_id', versionId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get usage info from subscription system
    const { canUseFeature, getUserPlan } = await import('@/lib/utils/subscription');
    const usageCheck = await canUseFeature(user.id, 'comprehensive_resume_analysis');
    const userPlan = await getUserPlan(user.id);
    
    const usageCount = usageCheck.current;
    const limit = usageCheck.limit === Infinity ? null : usageCheck.limit;
    const remaining = limit === null ? Infinity : Math.max(0, limit - usageCount);

    // Calculate reset date
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const resetDate = nextMonth.toISOString().split('T')[0];

    if (!analysis) {
      return NextResponse.json({
        analysis: null,
        usage: {
          count: usageCount,
          remaining,
          limit: limit,
          resetDate,
        },
        plan: userPlan,
      });
    }

    const storedAnalysisData = analysis.analysis_data;
    const isOnboardingAnalysis = storedAnalysisData.analysisType === 'onboarding';

    return NextResponse.json({
      analysis: {
        id: analysis.id,
        overallScore: analysis.overall_score,
        categoryScores: storedAnalysisData.categoryScores,
        keywordAnalysis: storedAnalysisData.keywordAnalysis,
        atsCompatibility: storedAnalysisData.atsCompatibility,
        atsExplanation: storedAnalysisData.atsExplanation,
        recommendations: storedAnalysisData.recommendations,
        categoryDescriptions: storedAnalysisData.categoryDescriptions,
        createdAt: analysis.created_at,
        analysisType: isOnboardingAnalysis ? 'onboarding' : 'full',
      },
      usage: {
        count: usageCount,
        remaining,
        limit: limit,
        resetDate,
      },
      plan: userPlan,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// JSON Schema for FULL structured output (regular analysis)
const RESUME_ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    overallScore: {
      type: 'integer',
      minimum: 0,
      maximum: 100,
    },
    categoryScores: {
      type: 'object',
      additionalProperties: false,
      properties: {
        actionVerbs: { type: 'integer', minimum: 0, maximum: 100 },
        accomplishments: { type: 'integer', minimum: 0, maximum: 100 },
        quantification: { type: 'integer', minimum: 0, maximum: 100 },
        impact: { type: 'integer', minimum: 0, maximum: 100 },
        conciseness: { type: 'integer', minimum: 0, maximum: 100 },
      },
      required: ['actionVerbs', 'accomplishments', 'quantification', 'impact', 'conciseness'],
    },
    keywordAnalysis: {
      type: 'object',
      additionalProperties: false,
      properties: {
        present: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              keyword: { type: 'string' },
              count: { type: 'integer', minimum: 0 },
            },
            required: ['keyword', 'count'],
          },
        },
        missing: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              keyword: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
            },
            required: ['keyword', 'priority'],
          },
        },
        density: { type: 'number', minimum: 0, maximum: 100 },
      },
      required: ['present', 'missing', 'density'],
    },
    atsCompatibility: {
      type: 'string',
      enum: ['Good', 'Fair', 'Poor'],
    },
    atsExplanation: {
      type: 'string',
    },
    recommendations: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          priority: { type: 'integer', minimum: 1 },
          title: { type: 'string' },
          description: { type: 'string' },
          impact: { type: 'string', enum: ['high', 'medium', 'low'] },
        },
        required: ['priority', 'title', 'description', 'impact'],
      },
      minItems: 5,
      maxItems: 7,
    },
    categoryDescriptions: {
      type: 'object',
      additionalProperties: false,
      properties: {
        actionVerbs: { type: 'string' },
        accomplishments: { type: 'string' },
        quantification: { type: 'string' },
        impact: { type: 'string' },
        conciseness: { type: 'string' },
      },
      required: ['actionVerbs', 'accomplishments', 'quantification', 'impact', 'conciseness'],
    },
  },
  required: [
    'overallScore',
    'categoryScores',
    'keywordAnalysis',
    'atsCompatibility',
    'atsExplanation',
    'recommendations',
    'categoryDescriptions',
  ],
};

// JSON Schema for ONBOARDING analysis (faster, critical evaluation)
const ONBOARDING_ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    overallScore: {
      type: 'integer',
      minimum: 0,
      maximum: 100,
    },
    categoryScores: {
      type: 'object',
      additionalProperties: false,
      properties: {
        actionVerbs: { type: 'integer', minimum: 0, maximum: 100 },
        accomplishments: { type: 'integer', minimum: 0, maximum: 100 },
        quantification: { type: 'integer', minimum: 0, maximum: 100 },
        impact: { type: 'integer', minimum: 0, maximum: 100 },
        conciseness: { type: 'integer', minimum: 0, maximum: 100 },
      },
      required: ['actionVerbs', 'accomplishments', 'quantification', 'impact', 'conciseness'],
    },
    missingKeywords: {
      type: 'array',
      items: { type: 'string' },
      minItems: 10,
      maxItems: 15,
    },
  },
  required: ['overallScore', 'categoryScores', 'missingKeywords'],
};

// Format resume data into text for analysis
const formatResumeForAnalysis = (resumeData: any): string => {
  const parts: string[] = [];

  // Contact Info
  if (resumeData.contactInfo) {
    parts.push('=== CONTACT INFORMATION ===');
    if (resumeData.contactInfo.name) parts.push(`Name: ${resumeData.contactInfo.name}`);
    if (resumeData.contactInfo.email) parts.push(`Email: ${resumeData.contactInfo.email}`);
    if (resumeData.contactInfo.phone) parts.push(`Phone: ${resumeData.contactInfo.phone}`);
    if (resumeData.contactInfo.location) parts.push(`Location: ${resumeData.contactInfo.location}`);
    if (resumeData.contactInfo.linkedin) parts.push(`LinkedIn: ${resumeData.contactInfo.linkedin}`);
    if (resumeData.contactInfo.portfolio) parts.push(`Portfolio: ${resumeData.contactInfo.portfolio}`);
    parts.push('');
  }

  // Summary
  if (resumeData.summary) {
    parts.push('=== PROFESSIONAL SUMMARY ===');
    parts.push(resumeData.summary);
    parts.push('');
  }

  // Experiences
  if (resumeData.experiences && resumeData.experiences.length > 0) {
    parts.push('=== WORK EXPERIENCE ===');
    resumeData.experiences.forEach((exp: any) => {
      parts.push(`${exp.title} at ${exp.company}`);
      if (exp.location) parts.push(`Location: ${exp.location}`);
      if (exp.startDate || exp.endDate) {
        parts.push(`Dates: ${exp.startDate || ''} - ${exp.endDate || 'Present'}`);
      }
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets
          .filter((b: any) => b.isSelected)
          .forEach((bullet: any) => {
            parts.push(`  • ${bullet.content}`);
          });
      }
      parts.push('');
    });
  }

  // Education
  if (resumeData.education && resumeData.education.length > 0) {
    parts.push('=== EDUCATION ===');
    resumeData.education.forEach((edu: any) => {
      parts.push(`${edu.degree} in ${edu.field || 'N/A'}`);
      parts.push(`${edu.school}`);
      if (edu.location) parts.push(`Location: ${edu.location}`);
      if (edu.startDate || edu.endDate) {
        parts.push(`Dates: ${edu.startDate || ''} - ${edu.endDate || ''}`);
      }
      if (edu.gpa) parts.push(`GPA: ${edu.gpa}`);
      if (edu.achievements && edu.achievements.length > 0) {
        edu.achievements.forEach((ach: any) => {
          parts.push(`  • ${ach.achievement}`);
        });
      }
      parts.push('');
    });
  }

  // Skills
  if (resumeData.skills) {
    const technicalSkills = resumeData.skills.technical?.filter((s: string) => s && s.trim()) || [];
    const productSkills = resumeData.skills.product?.filter((s: string) => s && s.trim()) || [];
    const softSkills = resumeData.skills.soft?.filter((s: string) => s && s.trim()) || [];

    if (technicalSkills.length > 0 || productSkills.length > 0 || softSkills.length > 0) {
      parts.push('=== SKILLS ===');
      if (technicalSkills.length > 0) {
        parts.push(`Technical: ${technicalSkills.join(', ')}`);
      }
      if (productSkills.length > 0) {
        parts.push(`Product: ${productSkills.join(', ')}`);
      }
      if (softSkills.length > 0) {
        parts.push(`Soft: ${softSkills.join(', ')}`);
      }
      parts.push('');
    }
  }

  return parts.join('\n');
};

// Create comprehensive analysis prompt
const createAnalysisPrompt = (resumeText: string): string => {
  return `You are an expert resume reviewer specializing in Product Management resumes. Your task is to comprehensively evaluate a resume and provide detailed, actionable feedback.

**Evaluation Criteria:**

1. **Action Verbs Quality (0-100)**: Assess the strength and variety of action verbs used. Strong verbs (e.g., "Led", "Drove", "Spearheaded", "Orchestrated") score higher than weak ones (e.g., "Worked on", "Helped", "Assisted").

2. **Accomplishments Strength (0-100)**: Evaluate how well the resume demonstrates concrete achievements vs. just responsibilities. Look for quantifiable results, successful launches, measurable improvements.

3. **Quantification Level (0-100)**: Measure how extensively numbers, percentages, metrics, and data are used throughout the resume. More quantification = higher score.

4. **Impact Demonstration (0-100)**: Assess how clearly the resume shows business impact, user impact, or organizational value. Look for outcomes, not just activities.

5. **Conciseness (0-100)**: Evaluate how efficiently information is presented. Good conciseness means clear, scannable content without unnecessary words.

**Keyword Analysis:**
- Identify Product Management keywords that ACTUALLY APPEAR in the resume text (e.g., roadmap, strategy, stakeholders, metrics, OKRs, KPIs, user research, A/B testing, product launch, go-to-market, product-market fit, user experience, data-driven, agile, scrum, sprint, backlog, prioritization, etc.)
- Count the EXACT number of occurrences of each keyword found in the resume
- IMPORTANT: Only include keywords in the "present" array if they have a count greater than 0. Do NOT include keywords with count 0 in the "present" array.
- Identify missing keywords that are commonly expected in PM resumes but are NOT found in the resume (or have count 0)
- Calculate keyword density as: (total count of all PM keywords found) / (total word count of resume) * 100
- Be case-insensitive when matching keywords (e.g., "Stakeholder" and "stakeholder" should be counted together)
- Group similar keywords together (e.g., "stakeholder" and "stakeholders" should be combined into one entry with combined count)

**ATS Compatibility:**
- Evaluate how well the resume will parse through Applicant Tracking Systems
- Consider formatting, keyword usage, standard sections, file structure
- Provide explanation for the rating

**Overall Score:**
- Calculate weighted average: Action Verbs (20%), Accomplishments (25%), Quantification (20%), Impact (25%), Conciseness (10%)
- Round to nearest integer

**Recommendations:**
- Provide 5-7 prioritized recommendations
- Each should be specific, actionable, and include impact level
- Focus on the highest-impact improvements first

**Category Descriptions:**
- Provide 2-3 sentence explanations for each category score
- Explain what's working well and what could be improved

**Resume to Analyze:**

${resumeText}

**Instructions:**
- Be thorough but constructive
- Focus on actionable feedback
- Consider this is for a Product Manager role
- Provide specific examples where possible
- Be honest but encouraging`;
};

// Create CRITICAL onboarding prompt (faster, stricter evaluation to drive conversions)
const createOnboardingPrompt = (resumeText: string): string => {
  return `You are a STRICT expert PM resume reviewer. Evaluate this resume critically - most resumes score 70-85, only exceptional ones reach 90+.

**Score STRICTLY (0-100):**

1. **Action Verbs (0-100):**
   - 90+: Every bullet starts with powerful, varied verbs (Spearheaded, Orchestrated, Drove, Transformed)
   - 80-89: Strong verbs but some repetition or occasional weak verbs
   - 70-79: Mix of strong and generic verbs (Created, Managed, Worked on)
   - Below 70: Mostly weak/passive verbs

2. **Accomplishments (0-100):**
   - 90+: Every bullet shows measurable business outcomes, not just activities
   - 80-89: Most bullets show results, a few are activity-focused
   - 70-79: Some results, but many bullets describe duties without outcomes
   - Below 70: Mostly responsibilities, few concrete achievements

3. **Quantification (0-100):**
   - 90+: 80%+ of bullets have specific numbers, percentages, or metrics
   - 80-89: 60-80% quantified, some bullets lack data
   - 70-79: 40-60% quantified, many opportunities missed
   - Below 70: Under 40% quantified

4. **Impact (0-100):**
   - 90+: Clear business/user/revenue impact in every role, shows scale
   - 80-89: Good impact shown but missing context (team size, user base, revenue)
   - 70-79: Some impact but often vague or lacks business connection
   - Below 70: Activities described without showing why they mattered

5. **Conciseness (0-100):**
   - 90+: Every word serves a purpose, no redundancy, highly scannable
   - 80-89: Generally tight but some wordy bullets or duplicated content
   - 70-79: Several long bullets, some redundancy across roles
   - Below 70: Verbose, hard to scan, significant redundancy

**Overall Score:** Calculate weighted average: Action Verbs 20%, Accomplishments 25%, Quantification 20%, Impact 25%, Conciseness 10%. Round to integer.

**Missing Keywords:** List 10-15 PM keywords NOT found in this resume. Include essential PM keywords like:
stakeholders, OKRs, KPIs, go-to-market, agile, scrum, backlog, prioritization framework, product-market fit, user stories, competitive analysis, roadmap ownership, sprint, customer journey, data-driven, A/B testing, user research, product strategy, cross-functional, MVP, etc.

**Resume:**
${resumeText}

Score RIGOROUSLY. Identify real gaps. Be honest about weaknesses - this helps users understand where they need to improve.`;
};

// Check and increment usage limit using subscription system
const checkAndIncrementUsage = async (supabase: any, userId: string): Promise<{ allowed: boolean; count: number; resetDate: string; limit: number | null; requiresSubscription: boolean; requiresAccelerate: boolean }> => {
  const { canUseFeature, incrementFeatureUsage, getUserPlan } = await import('@/lib/utils/subscription');
  
  // Check if user is on Accelerate plan
  const userPlan = await getUserPlan(userId);
  if (userPlan !== 'accelerate') {
    return {
      allowed: false,
      count: 0,
      resetDate: '',
      limit: null,
      requiresSubscription: true,
      requiresAccelerate: true,
    };
  }
  
  // Check if user can use comprehensive resume analysis
  const usageCheck = await canUseFeature(userId, 'comprehensive_resume_analysis');
  
  if (!usageCheck.allowed) {
    return {
      allowed: false,
      count: usageCheck.current,
      resetDate: usageCheck.resetDate,
      limit: usageCheck.limit,
      requiresSubscription: usageCheck.limit === null,
      requiresAccelerate: false,
    };
  }

  // Increment usage
  const { success, newCount } = await incrementFeatureUsage(userId, 'comprehensive_resume_analysis');
  
  if (!success) {
    throw new Error('Failed to increment usage count');
  }

  return {
    allowed: true,
    count: newCount,
    resetDate: usageCheck.resetDate,
    limit: usageCheck.limit,
    requiresSubscription: false,
    requiresAccelerate: false,
  };
};

// POST /api/resume/versions/[versionId]/analyze - Analyze resume with AI
export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) => {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { versionId } = await params;

    // Verify version ownership
    const { data: version, error: versionError } = await supabase
      .from('resume_versions')
      .select('*')
      .eq('id', versionId)
      .eq('user_id', user.id)
      .single();

    if (versionError || !version) {
      return NextResponse.json(
        { error: 'Resume version not found' },
        { status: 404 }
      );
    }

    // Check if this is an onboarding request and if user is eligible for free onboarding analysis
    const isOnboardingRequest = request.headers.get('x-onboarding-request') === 'true';
    let onboardingAnalysisUsed = false;
    let allowOnboardingAnalysis = false;

    console.log('[Analyze API] Onboarding check:', {
      isOnboardingRequest,
      versionId,
      userId: user.id,
    });

    if (isOnboardingRequest) {
      // Check onboarding progress to see if user is in onboarding and hasn't used analysis yet
      const { data: onboardingProgress, error: progressError } = await supabase
        .from('onboarding_progress')
        .select('progress_data, is_complete')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('[Analyze API] Onboarding progress result:', {
        hasProgress: !!onboardingProgress,
        progressError: progressError?.message,
        isComplete: onboardingProgress?.is_complete,
        progressData: onboardingProgress?.progress_data ? 'exists' : 'null',
        resumeUploadData: onboardingProgress?.progress_data?.resume_upload ? 'exists' : 'null',
      });

      if (onboardingProgress) {
        // Check if onboarding analysis has been used (regardless of is_complete status)
        // This allows users who completed onboarding but are using resume import flow for first time
        const resumeUploadData = onboardingProgress.progress_data?.resume_upload;
        const onboardingVersionId = resumeUploadData?.versionId;
        onboardingAnalysisUsed = resumeUploadData?.onboardingAnalysisUsed === true;
        
        console.log('[Analyze API] Onboarding analysis check:', {
          onboardingVersionId,
          requestVersionId: versionId,
          versionIdsMatch: onboardingVersionId === versionId,
          onboardingAnalysisUsed,
          isComplete: onboardingProgress.is_complete,
        });
        
        // Only allow if: user hasn't used it yet AND (versionId matches OR no versionId stored yet)
        if (!onboardingAnalysisUsed) {
          if (onboardingVersionId === versionId) {
            // VersionId matches - allow it
            allowOnboardingAnalysis = true;
            console.log('[Analyze API] ✓ Onboarding analysis ALLOWED (versionId match)');
          } else if (!onboardingVersionId) {
            // No versionId stored yet - allow it (handles first-time resume import)
            allowOnboardingAnalysis = true;
            console.log('[Analyze API] ✓ Onboarding analysis ALLOWED (fallback - no stored versionId yet)');
          } else {
            // VersionId mismatch - don't allow
            console.log('[Analyze API] ✗ Onboarding analysis NOT allowed:', {
              reason: 'versionId mismatch',
            });
          }
        } else {
          console.log('[Analyze API] ✗ Onboarding analysis NOT allowed:', {
            reason: 'already used',
          });
        }
      } else if (!onboardingProgress) {
        // No progress record exists yet - this is a new user
        // Allow the free analysis since they clearly haven't used it
        allowOnboardingAnalysis = true;
        console.log('[Analyze API] ✓ Onboarding analysis ALLOWED (new user - no progress record)');
      }
    }

    // Check usage limit (skip if onboarding analysis is allowed)
    let usageCheck;
    console.log('[Analyze API] Usage check:', { allowOnboardingAnalysis });
    
    if (!allowOnboardingAnalysis) {
      console.log('[Analyze API] Checking subscription/usage (onboarding not allowed)...');
      usageCheck = await checkAndIncrementUsage(supabase, user.id);
      console.log('[Analyze API] Usage check result:', usageCheck);
      
      if (!usageCheck.allowed) {
        // Check if Accelerate plan is required
        if (usageCheck.requiresAccelerate) {
          return NextResponse.json(
            {
              error: 'Accelerate plan required',
              message: 'Resume analysis is available exclusively for Accelerate plan subscribers.',
              requiresSubscription: true,
              requiresAccelerate: true,
            },
            { status: 403 }
          );
        }
        
        // Distinguish between no subscription and limit reached
        if (usageCheck.requiresSubscription) {
          return NextResponse.json(
            {
              error: 'Subscription required',
              message: 'An active subscription is required to use resume analysis.',
              requiresSubscription: true,
              requiresAccelerate: false,
            },
            { status: 403 }
          );
        }
        
        return NextResponse.json(
          {
            error: 'Monthly analysis limit reached',
            count: usageCheck.count,
            limit: usageCheck.limit,
            resetDate: usageCheck.resetDate,
            requiresSubscription: false,
            requiresAccelerate: false,
          },
          { status: 429 }
        );
      }
    }

    // Check for OpenAI API key
    const openAIApiKey = process.env.OPEN_AI_SECRET_KEY;
    if (!openAIApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Fetch complete resume data
    const [
      { data: contactInfo },
      { data: summary },
      { data: experiences },
      { data: education },
      { data: skills },
    ] = await Promise.all([
      supabase
        .from('resume_contact_info')
        .select('*')
        .eq('version_id', versionId)
        .maybeSingle(),
      supabase
        .from('resume_summaries')
        .select('*')
        .eq('version_id', versionId)
        .maybeSingle(),
      supabase
        .from('resume_experiences')
        .select(`
          *,
          bullets:resume_experience_bullets(*)
        `)
        .eq('version_id', versionId)
        .order('display_order', { ascending: true }),
      supabase
        .from('resume_education')
        .select(`
          *,
          achievements:resume_education_achievements(*)
        `)
        .eq('version_id', versionId)
        .order('display_order', { ascending: true }),
      supabase
        .from('resume_skills')
        .select('*')
        .eq('version_id', versionId)
        .order('display_order', { ascending: true }),
    ]);

    // Group experiences by role_group_id
    const experienceGroups = new Map<string, any[]>();
    const standaloneExperiences: any[] = [];

    (experiences || []).forEach((exp: any) => {
      if (exp.role_group_id) {
        if (!experienceGroups.has(exp.role_group_id)) {
          experienceGroups.set(exp.role_group_id, []);
        }
        experienceGroups.get(exp.role_group_id)!.push(exp);
      } else {
        standaloneExperiences.push(exp);
      }
    });

    // Process grouped experiences
    const processedGroupedExperiences: any[] = [];
    experienceGroups.forEach((groupExps, groupId) => {
      // Sort by display_order to get the first experience
      const sortedGroup = [...groupExps].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      const firstExp = sortedGroup[0];
      const bulletMode = firstExp.bullet_mode || 'per_role';

      if (bulletMode === 'per_experience') {
        // For per_experience mode, show all bullets once (from first experience)
        // Collect all selected bullets from the first experience
        const allBullets = (firstExp.bullets || [])
          .filter((b: any) => b.is_selected)
          .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
          .map((b: any) => ({
            content: b.content,
            isSelected: b.is_selected,
          }));

        // Create separate entries for each role with distinct dates
        // Bullets will only appear after the last role
        sortedGroup.forEach((exp: any, index: number) => {
          const isLastRole = index === sortedGroup.length - 1;
        processedGroupedExperiences.push({
            title: exp.title,
            company: exp.company,
            location: exp.location || '',
            startDate: exp.start_date || '',
            endDate: exp.end_date || '',
            bullets: isLastRole ? allBullets : [], // Only add bullets to the last role
          });
        });
      } else {
        // For per_role mode, show each role with its own bullets
        sortedGroup.forEach((exp: any) => {
          processedGroupedExperiences.push({
            title: exp.title,
            company: exp.company,
            location: exp.location || '',
            startDate: exp.start_date || '',
            endDate: exp.end_date || '',
            bullets: (exp.bullets || [])
              .filter((b: any) => b.is_selected)
              .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
              .map((b: any) => ({
                content: b.content,
                isSelected: b.is_selected,
              })),
          });
        });
      }
    });

    // Process standalone experiences
    const processedStandaloneExperiences = standaloneExperiences.map((exp: any) => ({
      title: exp.title,
      company: exp.company,
      location: exp.location || '',
      startDate: exp.start_date || '',
      endDate: exp.end_date || '',
      bullets: (exp.bullets || [])
        .filter((b: any) => b.is_selected)
        .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
        .map((b: any) => ({
          content: b.content,
          isSelected: b.is_selected,
        })),
    }));

    // Format resume data
    const resumeData = {
      contactInfo: contactInfo ? {
        name: contactInfo.full_name,
        email: contactInfo.email,
        phone: contactInfo.phone || '',
        location: contactInfo.location || '',
        linkedin: contactInfo.linkedin || '',
        portfolio: contactInfo.portfolio || '',
      } : null,
      summary: summary?.content || '',
      experiences: [...processedGroupedExperiences, ...processedStandaloneExperiences],
      education: (education || []).map((edu: any) => ({
        degree: edu.degree,
        field: edu.field || '',
        school: edu.school,
        location: edu.location || '',
        startDate: edu.start_date || '',
        endDate: edu.end_date || '',
        gpa: edu.gpa || '',
        achievements: (edu.achievements || [])
          .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
          .map((a: any) => ({
            achievement: a.achievement,
          })),
      })),
      skills: {
        technical: (skills || []).filter((s: any) => s.category === 'technical' && s.skill_name).map((s: any) => s.skill_name),
        product: (skills || []).filter((s: any) => s.category === 'product' && s.skill_name).map((s: any) => s.skill_name),
        soft: (skills || []).filter((s: any) => s.category === 'soft' && s.skill_name).map((s: any) => s.skill_name),
      },
    };

    const resumeText = formatResumeForAnalysis(resumeData);
    
    // Use different prompt and schema for onboarding (faster, critical evaluation)
    const prompt = allowOnboardingAnalysis 
      ? createOnboardingPrompt(resumeText) 
      : createAnalysisPrompt(resumeText);
    const schema = allowOnboardingAnalysis 
      ? ONBOARDING_ANALYSIS_SCHEMA 
      : RESUME_ANALYSIS_SCHEMA;
    const schemaName = allowOnboardingAnalysis 
      ? 'resume_analysis_onboarding' 
      : 'resume_analysis';

    console.log('[Analyze API] Starting OpenAI call:', {
      allowOnboardingAnalysis,
      schemaName,
      promptLength: prompt.length,
    });

    // Call OpenAI Responses API with structured output
    const requestPayload = {
      model: 'gpt-5.1',
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

    const responseResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify(requestPayload),
    });

    if (!responseResponse.ok) {
      const errorData = await responseResponse.json().catch(() => ({}));
      console.error('OpenAI response error:', errorData);
      return NextResponse.json(
        { error: 'Failed to process resume with OpenAI', details: errorData },
        { status: 500 }
      );
    }

    const responseData = await responseResponse.json();
    const responseId = responseData.id;

    if (!responseId) {
      return NextResponse.json(
        { error: 'Failed to get response ID from OpenAI' },
        { status: 500 }
      );
    }

    // Poll for completion
    let status = 'in_progress';
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes max

    while (status === 'in_progress' || status === 'queued') {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      attempts++;

      if (attempts > maxAttempts) {
        return NextResponse.json(
          { error: 'Timeout waiting for OpenAI response' },
          { status: 500 }
        );
      }

      const statusResponse = await fetch(`https://api.openai.com/v1/responses/${responseId}`, {
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
        },
      });

      if (!statusResponse.ok) {
        const errorData = await statusResponse.json().catch(() => ({}));
        console.error('OpenAI status check error:', errorData);
        return NextResponse.json(
          { error: 'Failed to check OpenAI response status', details: errorData },
          { status: 500 }
        );
      }

      const statusData = await statusResponse.json();
      status = statusData.status;

      if (status === 'failed') {
        const errorDetails = statusData.error || {};
        return NextResponse.json(
          { error: 'OpenAI processing failed', details: errorDetails },
          { status: 500 }
        );
      }
    }

    // Get final response
    const finalResponse = await fetch(`https://api.openai.com/v1/responses/${responseId}`, {
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
    });

    if (!finalResponse.ok) {
      const errorData = await finalResponse.json().catch(() => ({}));
      console.error('OpenAI final response error:', errorData);
      return NextResponse.json(
        { error: 'Failed to retrieve final response from OpenAI', details: errorData },
        { status: 500 }
      );
    }

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
          } catch (e) {
            // Try next content item
          }
        }
      }
    }

    if (!extractedData) {
      // Check for refusal
      if (outputItem?.content) {
        for (const contentItem of outputItem.content) {
          if (contentItem.type === 'refusal' && contentItem.refusal) {
            return NextResponse.json(
              { error: 'OpenAI refused to process the resume', refusal: contentItem.refusal },
              { status: 400 }
            );
          }
        }
      }

      return NextResponse.json(
        { error: 'Failed to extract structured data from OpenAI response' },
        { status: 500 }
      );
    }

    // Transform onboarding analysis to compatible format if needed
    let analysisDataToStore = extractedData;
    if (allowOnboardingAnalysis) {
      // Transform missingKeywords array to keywordAnalysis format for consistency
      analysisDataToStore = {
        ...extractedData,
        analysisType: 'onboarding', // Flag to indicate this is a slim analysis
        keywordAnalysis: {
          present: [], // Not analyzed in onboarding mode
          missing: (extractedData.missingKeywords || []).map((keyword: string) => ({
            keyword,
            priority: 'medium' as const, // Default priority for onboarding
          })),
          density: 0, // Not calculated in onboarding mode
        },
        // Placeholder values for fields not in onboarding analysis
        atsCompatibility: null,
        atsExplanation: null,
        recommendations: null,
        categoryDescriptions: null,
      };
    }

    // Save analysis to database
    const analysisData = {
      resume_version_id: versionId,
      user_id: user.id,
      overall_score: extractedData.overallScore,
      analysis_data: analysisDataToStore,
    };

    // Check if analysis exists
    const { data: existingAnalysis } = await supabase
      .from('resume_analyses')
      .select('id')
      .eq('resume_version_id', versionId)
      .eq('user_id', user.id)
      .maybeSingle();

    let savedAnalysis;
    if (existingAnalysis) {
      // Update existing
      const { data, error: updateError } = await supabase
        .from('resume_analyses')
        .update({
          overall_score: extractedData.overallScore,
          analysis_data: extractedData,
        })
        .eq('id', existingAnalysis.id)
        .select()
        .single();
      
      if (updateError) {
        throw updateError;
      }
      savedAnalysis = data;
    } else {
      // Insert new
      const { data, error: insertError } = await supabase
        .from('resume_analyses')
        .insert(analysisData)
        .select()
        .single();
      
      if (insertError) {
        throw insertError;
      }
      savedAnalysis = data;
    }

    // Mark onboarding analysis as used if this was an onboarding request
    if (allowOnboardingAnalysis) {
      const { data: onboardingProgress } = await supabase
        .from('onboarding_progress')
        .select('progress_data')
        .eq('user_id', user.id)
        .maybeSingle();

      if (onboardingProgress) {
        const updatedProgressData = {
          ...onboardingProgress.progress_data,
          resume_upload: {
            ...onboardingProgress.progress_data?.resume_upload,
            onboardingAnalysisUsed: true,
            versionId,
            uploadedAt: new Date().toISOString(),
            analysisStatus: 'completed',
            analysisData: {
              id: savedAnalysis.id,
              overallScore: extractedData.overallScore,
            },
          },
        };

        await supabase
          .from('onboarding_progress')
          .update({
            progress_data: updatedProgressData,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      }
    }

    return NextResponse.json({
      id: savedAnalysis.id,
      overallScore: extractedData.overallScore,
      categoryScores: extractedData.categoryScores,
      keywordAnalysis: analysisDataToStore.keywordAnalysis,
      atsCompatibility: analysisDataToStore.atsCompatibility,
      atsExplanation: analysisDataToStore.atsExplanation,
      recommendations: analysisDataToStore.recommendations,
      categoryDescriptions: analysisDataToStore.categoryDescriptions,
      createdAt: savedAnalysis.created_at,
      usageCount: usageCheck?.count ?? 0,
      onboardingAnalysis: allowOnboardingAnalysis,
      analysisType: allowOnboardingAnalysis ? 'onboarding' : 'full',
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

