import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Get onboarding progress
    const { data: progress, error: progressError } = await supabase
      .from('onboarding_progress')
      .select('progress_data')
      .eq('user_id', user.id)
      .maybeSingle();

    if (progressError) {
      console.error('Error fetching onboarding progress:', progressError);
      return NextResponse.json(
        { error: 'Failed to fetch progress' },
        { status: 500 }
      );
    }

    const resumeData = progress?.progress_data?.resume_upload;
    
    if (!resumeData?.versionId) {
      return NextResponse.json({
        hasResume: false,
        analysisStatus: null,
        analysisData: null,
      });
    }

    // Check if analysis exists
    const { data: analysis, error: analysisError } = await supabase
      .from('resume_analyses')
      .select('*')
      .eq('resume_version_id', resumeData.versionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (analysisError && analysisError.code !== 'PGRST116') {
      console.error('Error fetching analysis:', analysisError);
      return NextResponse.json(
        { error: 'Failed to fetch analysis' },
        { status: 500 }
      );
    }

    // Determine analysis status
    let finalStatus = resumeData.analysisStatus || (analysis ? 'completed' : 'pending');
    
    // If we have analysis in DB but status says processing, update status
    if (analysis && finalStatus === 'processing') {
      finalStatus = 'completed';
    }

    // Format analysis data for frontend
    let formattedAnalysisData = null;
    if (analysis) {
      formattedAnalysisData = {
        id: analysis.id,
        overallScore: analysis.overall_score,
        categoryScores: analysis.analysis_data?.categoryScores,
        keywordAnalysis: analysis.analysis_data?.keywordAnalysis,
        atsCompatibility: analysis.analysis_data?.atsCompatibility,
        atsExplanation: analysis.analysis_data?.atsExplanation,
        recommendations: analysis.analysis_data?.recommendations,
        categoryDescriptions: analysis.analysis_data?.categoryDescriptions,
        createdAt: analysis.created_at,
      };
    } else if (resumeData.analysisData) {
      // Use stored analysis data from onboarding progress
      formattedAnalysisData = resumeData.analysisData;
    }

    return NextResponse.json({
      hasResume: true,
      versionId: resumeData.versionId,
      analysisStatus: finalStatus,
      analysisData: formattedAnalysisData,
    });
  } catch (error) {
    console.error('Error in GET /api/onboarding/resume-analysis-status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

