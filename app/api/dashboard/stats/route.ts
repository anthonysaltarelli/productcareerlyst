import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDashboardStats } from '@/lib/utils/dashboard-stats';

export interface DashboardStats {
  // Course Progress
  lessonsCompleted: number;
  coursesCompleted: number;
  totalWatchTime: number; // in seconds
  
  // Resume Stats
  resumeVersionsCount: number;
  highestResumeScore: number | null;
  hasImportedResume: boolean;
  
  // Job Applications
  totalJobApplications: number;
  jobApplicationsByStatus: {
    wishlist: number;
    applied: number;
    interviewing: number;
    offer: number;
    rejected: number;
    withdrawn: number;
  };
  
  // Contacts
  contactsCount: number;
  
  // Company Research
  companiesResearchedCount: number;
  
  // Subscription
  subscription: {
    plan: 'learn' | 'accelerate' | null;
    status: string | null;
    isActive: boolean;
  };
  
  // Onboarding Milestones
  milestones: {
    firstLessonWatched: boolean;
    firstCourseCompleted: boolean;
    firstResumeImported: boolean;
    resumeScore70: boolean;
    resumeScore80: boolean;
    resumeScore90: boolean;
    firstTemplateAccessed: boolean; // Tracked via profiles.first_template_accessed_at
    firstJobAdded: boolean;
    firstContactAdded: boolean;
    firstResearchViewed: boolean;
  };
}

export const GET = async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const stats = await getDashboardStats(user.id);

    if (!stats) {
      return NextResponse.json(
        { error: 'Failed to fetch dashboard stats' },
        { status: 500 }
      );
    }

    return NextResponse.json({ stats }, { status: 200 });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
};

