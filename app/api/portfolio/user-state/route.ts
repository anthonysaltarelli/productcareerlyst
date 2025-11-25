import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getUserPlan } from '@/lib/utils/subscription';

export interface PortfolioUserState {
  userPlan: 'learn' | 'accelerate' | null;
  hasActiveSubscription: boolean;
  daysSinceSignUp: number | null;
  hasPendingTemplateRequest: boolean;
  templateRequestStatus: 'pending' | 'fulfilled' | 'cancelled' | null;
  totalPortfolioRequests: number;
  totalFavoritedIdeas: number;
  hasCompletedPortfolioCourse: boolean;
}

export const GET = async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all data in parallel
    const [
      userPlan,
      portfolioRequests,
      favorites,
      templateRequest,
      userProgress,
      userCreatedAt,
    ] = await Promise.all([
      // User plan
      getUserPlan(user.id),
      
      // Portfolio requests count
      supabase
        .from('portfolio_idea_requests')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      
      // Favorites count
      supabase
        .from('portfolio_idea_favorites')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      
      // Template request status
      supabase
        .from('portfolio_template_requests')
        .select('status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      
      // Check if user completed portfolio course
      supabase
        .from('courses')
        .select('id')
        .eq('slug', 'launch-product-portfolio')
        .single()
        .then(async (courseResult) => {
          if (courseResult.error || !courseResult.data) {
            return { completed: false };
          }
          
          const courseId = courseResult.data.id;
          
          // Get all lessons for this course
          const { data: lessons } = await supabase
            .from('lessons')
            .select('id')
            .eq('course_id', courseId);
          
          if (!lessons || lessons.length === 0) {
            return { completed: false };
          }
          
          const lessonIds = lessons.map(l => l.id);
          
          // Check if user completed all lessons
          const { data: completedLessons } = await supabase
            .from('user_progress')
            .select('lesson_id')
            .eq('user_id', user.id)
            .eq('completed', true)
            .in('lesson_id', lessonIds);
          
          const completed = completedLessons?.length === lessonIds.length;
          return { completed };
        }),
      
      // User creation date
      supabase.auth.getUser().then(({ data }) => ({
        createdAt: data?.user?.created_at || null,
      })),
    ]);

    // Calculate days since sign up
    let daysSinceSignUp: number | null = null;
    if (userCreatedAt?.createdAt) {
      const signUpDate = new Date(userCreatedAt.createdAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - signUpDate.getTime());
      daysSinceSignUp = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    // Check subscription status
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle();
    
    const hasActiveSubscription = subscription?.status === 'active' || subscription?.status === 'trialing';

    const state: PortfolioUserState = {
      userPlan: userPlan || null,
      hasActiveSubscription,
      daysSinceSignUp,
      hasPendingTemplateRequest: templateRequest?.data?.status === 'pending',
      templateRequestStatus: templateRequest?.data?.status || null,
      totalPortfolioRequests: portfolioRequests.count || 0,
      totalFavoritedIdeas: favorites.count || 0,
      hasCompletedPortfolioCourse: userProgress?.completed || false,
    };

    return NextResponse.json({ state });
  } catch (error) {
    console.error('Error fetching portfolio user state:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user state' },
      { status: 500 }
    );
  }
};




