import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { checkAdminStatus } from '@/lib/utils/admin'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check admin status
    const isAdmin = await checkAdminStatus(user.id)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Check if includeTestAccounts query parameter is set
    const { searchParams } = new URL(request.url)
    const includeTestAccounts = searchParams.get('includeTestAccounts') === 'true'

    // Use service role client for admin operations
    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Get recent users (last 100, excluding test accounts by default)
    const { data: allUsersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    })

    if (listError) {
      console.error('Error fetching users:', listError)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    const allUsers = allUsersData?.users || []

    // Filter out test accounts (unless includeTestAccounts is true)
    const filteredUsers = includeTestAccounts 
      ? allUsers
      : allUsers.filter((u) => {
          const email = u.email?.toLowerCase() || ''
          return (
            !email.includes('anthsalt') &&
            !email.includes('anth.saltarelli')
          )
        })

    // Sort by created_at descending (most recent first)
    filteredUsers.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    // Get user IDs
    const userIds = filteredUsers.map((u) => u.id)

    // If no users, return empty array
    if (userIds.length === 0) {
      return NextResponse.json({ users: [] })
    }

    // Fetch profiles, subscriptions, onboarding, portfolios, and resume contact info in parallel
    // These are effectively LEFT JOINs - all users will be included even if they don't have related data
    const [
      { data: profiles },
      { data: subscriptions },
      { data: onboardingProgress },
      { data: portfolios },
      { data: resumeVersions },
    ] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select('user_id, first_name, last_name, linkedin')
        .in('user_id', userIds),
      supabaseAdmin
        .from('subscriptions')
        .select('user_id, plan, status, stripe_customer_id')
        .in('user_id', userIds)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('onboarding_progress')
        .select('user_id, is_complete')
        .in('user_id', userIds),
      supabaseAdmin
        .from('portfolios')
        .select('user_id, social_links')
        .in('user_id', userIds),
      supabaseAdmin
        .from('resume_versions')
        .select('user_id, id')
        .in('user_id', userIds)
        .order('created_at', { ascending: false }),
    ])

    // Get the latest resume version per user
    const latestVersionPerUser = new Map<string, string>()
    ;(resumeVersions || []).forEach((version) => {
      if (!latestVersionPerUser.has(version.user_id)) {
        latestVersionPerUser.set(version.user_id, version.id)
      }
    })

    const versionIds = Array.from(latestVersionPerUser.values())

    const { data: resumeContactInfo } = versionIds.length > 0
      ? await supabaseAdmin
          .from('resume_contact_info')
          .select('version_id, linkedin')
          .in('version_id', versionIds)
      : { data: null }

    // Create a map of version_id to user_id
    const versionToUserMap = new Map(
      Array.from(latestVersionPerUser.entries()).map(([userId, versionId]) => [versionId, userId])
    )

    // Create lookup maps
    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]))
    const subscriptionMap = new Map()
    ;(subscriptions || []).forEach((sub) => {
      if (!subscriptionMap.has(sub.user_id)) {
        subscriptionMap.set(sub.user_id, sub)
      }
    })
    const onboardingMap = new Map((onboardingProgress || []).map((o) => [o.user_id, o]))
    const portfolioMap = new Map((portfolios || []).map((p) => [p.user_id, p]))
    
    // Map resume contact info by user_id (from version_id)
    const resumeContactMap = new Map()
    ;(resumeContactInfo || []).forEach((r) => {
      const userId = versionToUserMap.get(r.version_id)
      if (userId && !resumeContactMap.has(userId)) {
        resumeContactMap.set(userId, r)
      }
    })

    // Combine data
    const usersWithData = filteredUsers.map((user) => {
      const profile = profileMap.get(user.id)
      const subscription = subscriptionMap.get(user.id)
      const onboarding = onboardingMap.get(user.id)
      const portfolio = portfolioMap.get(user.id)
      const resumeContact = resumeContactMap.get(user.id)

      // Get LinkedIn from profile, portfolio, or resume contact info (in that order)
      let linkedin = profile?.linkedin || null
      if (!linkedin && portfolio?.social_links) {
        const socialLinks = typeof portfolio.social_links === 'string' 
          ? JSON.parse(portfolio.social_links) 
          : portfolio.social_links
        linkedin = socialLinks?.linkedin || null
      }
      if (!linkedin) {
        linkedin = resumeContact?.linkedin || null
      }

      return {
        id: user.id,
        email: user.email || '',
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at,
        fullName: profile
          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || null
          : null,
        linkedin,
        subscriptionPlan: subscription?.plan || null,
        subscriptionStatus: subscription?.status || null,
        stripeCustomerId: subscription?.stripe_customer_id || null,
        onboardingCompleted: onboarding?.is_complete === true,
      }
    })

    return NextResponse.json({ users: usersWithData })
  } catch (error) {
    console.error('Error in admin users API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

