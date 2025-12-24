import { createClient } from '@/lib/supabase/server'

export interface OnboardingProgress {
  course_lesson: boolean
  upload_resume: boolean
  resume_score_90: boolean
  publish_portfolio: boolean
  add_job: boolean
  custom_resume: boolean
  company_research: boolean
  contact_email: boolean
  mock_interview: boolean
  isMinimized: boolean
  completedCount: number
  totalCount: number
}

export async function getOnboardingProgress(userId: string): Promise<OnboardingProgress> {
  const supabase = await createClient()

  // Query all data in parallel for performance
  const [
    lessonProgress,
    resumeVersions,
    resumeAnalysis,
    portfolio,
    jobApplications,
    jobSpecificResumes,
    userJobCompanies,
    contacts,
    mockInterviews,
    profile,
  ] = await Promise.all([
    // 1. First course lesson completed
    supabase
      .from('user_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('completed', true)
      .limit(1)
      .maybeSingle(),

    // 2. Resume uploaded
    supabase
      .from('resume_versions')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle(),

    // 3. Resume score 90+
    supabase
      .from('resume_analyses')
      .select('overall_score')
      .eq('user_id', userId)
      .gte('overall_score', 90)
      .limit(1)
      .maybeSingle(),

    // 4. Portfolio published
    supabase
      .from('portfolios')
      .select('is_published')
      .eq('user_id', userId)
      .eq('is_published', true)
      .limit(1)
      .maybeSingle(),

    // 5. First job added
    supabase
      .from('job_applications')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle(),

    // 6. Job-specific resume created (has application_id)
    supabase
      .from('resume_versions')
      .select('id')
      .eq('user_id', userId)
      .not('application_id', 'is', null)
      .limit(1)
      .maybeSingle(),

    // 7. Get user's job application company IDs (for company research check)
    supabase
      .from('job_applications')
      .select('company_id')
      .eq('user_id', userId),

    // 8. Verified PM contact (has email)
    supabase
      .from('contacts')
      .select('id')
      .eq('user_id', userId)
      .not('email', 'is', null)
      .limit(1)
      .maybeSingle(),

    // 9. Mock interview completed
    supabase
      .from('mock_interviews')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .limit(1)
      .maybeSingle(),

    // Get minimized state from profile
    supabase
      .from('profiles')
      .select('onboarding_minimized')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  // For company research, check if any of the user's job application companies have research
  let hasCompanyResearch = false
  if (userJobCompanies.data && userJobCompanies.data.length > 0) {
    const companyIds = userJobCompanies.data.map(j => j.company_id).filter(Boolean)
    if (companyIds.length > 0) {
      const { data: research } = await supabase
        .from('company_research')
        .select('company_id')
        .in('company_id', companyIds)
        .limit(1)
        .maybeSingle()

      hasCompanyResearch = !!research
    }
  }

  const progress: OnboardingProgress = {
    course_lesson: !!lessonProgress.data,
    upload_resume: !!resumeVersions.data,
    resume_score_90: !!resumeAnalysis.data,
    publish_portfolio: !!portfolio.data,
    add_job: !!jobApplications.data,
    custom_resume: !!jobSpecificResumes.data,
    company_research: hasCompanyResearch,
    contact_email: !!contacts.data,
    mock_interview: !!mockInterviews.data,
    isMinimized: profile.data?.onboarding_minimized ?? false,
    completedCount: 0,
    totalCount: 9,
  }

  // Calculate completed count
  progress.completedCount = [
    progress.course_lesson,
    progress.upload_resume,
    progress.resume_score_90,
    progress.publish_portfolio,
    progress.add_job,
    progress.custom_resume,
    progress.company_research,
    progress.contact_email,
    progress.mock_interview,
  ].filter(Boolean).length

  return progress
}
