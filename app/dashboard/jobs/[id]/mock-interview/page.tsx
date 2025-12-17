'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { Video, Building2, Briefcase, AlertCircle, RefreshCw, Sparkles, X, Clock } from 'lucide-react';
import { BetaAccessModal } from '@/app/components/BetaAccessModal';
import type { GeneratedJobQuestion, GenerateQuestionsResponse, StartJobInterviewResponse } from '@/lib/types/job-interview';

type FlowState = 'loading_job' | 'ready' | 'generating_questions' | 'starting_interview' | 'error' | 'no_description';

interface JobApplication {
  id: string;
  title: string;
  description: string | null;
  company: {
    id: string;
    name: string;
  } | null;
}

export default function JobMockInterviewPrepPage() {
  const params = useParams();
  const router = useRouter();
  const { aiVideoCoach } = useFlags();
  const jobId = params.id as string;

  const [flowState, setFlowState] = useState<FlowState>('loading_job');
  const [job, setJob] = useState<JobApplication | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasBetaAccess, setHasBetaAccess] = useState<boolean | null>(null);
  const [showBetaModal, setShowBetaModal] = useState(false);

  // Redirect if feature flag is disabled
  useEffect(() => {
    if (aiVideoCoach === false) {
      router.push('/dashboard/interview');
    }
  }, [aiVideoCoach, router]);

  // Check beta access on mount
  useEffect(() => {
    const checkBetaAccess = async () => {
      try {
        const response = await fetch('/api/user/beta-access');
        if (response.ok) {
          const data = await response.json();
          setHasBetaAccess(data.hasAiVideoCoachBeta);
        } else {
          setHasBetaAccess(false);
        }
      } catch {
        setHasBetaAccess(false);
      }
    };

    checkBetaAccess();
  }, []);

  // Fetch job application details on mount (but don't generate questions yet)
  const fetchJob = useCallback(async () => {
    try {
      setFlowState('loading_job');
      setError(null);

      const response = await fetch(`/api/jobs/applications/${jobId}`);
      if (!response.ok) {
        throw new Error('Job application not found');
      }
      const data = await response.json();
      const jobData = data.application as JobApplication;
      setJob(jobData);

      // Check for description
      if (!jobData.description) {
        setFlowState('no_description');
        return;
      }

      // Job loaded successfully, show the ready state
      setFlowState('ready');
    } catch (err) {
      console.error('Failed to load job:', err);
      setError(err instanceof Error ? err.message : 'Failed to load job');
      setFlowState('error');
    }
  }, [jobId]);

  // Fetch job on mount
  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  // Generate interview questions
  const generateQuestions = useCallback(async (): Promise<GeneratedJobQuestion[]> => {
    const response = await fetch('/api/mock-interviews/job-specific/generate-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobApplicationId: jobId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to generate questions');
    }

    const data: GenerateQuestionsResponse = await response.json();
    return data.questions;
  }, [jobId]);

  // Start the interview
  const startInterview = useCallback(async (generatedQuestions: GeneratedJobQuestion[]): Promise<StartJobInterviewResponse> => {
    const response = await fetch('/api/mock-interviews/job-specific/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobApplicationId: jobId,
        questions: generatedQuestions,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to start interview');
    }

    return response.json();
  }, [jobId]);

  // Handle the "Start Interview" button click
  const handleStartInterview = async () => {
    // Check beta access before starting
    if (!hasBetaAccess) {
      setShowBetaModal(true);
      return;
    }

    try {
      // Step 1: Generate questions
      setFlowState('generating_questions');
      setError(null);
      const generatedQuestions = await generateQuestions();

      // Step 2: Start interview
      setFlowState('starting_interview');
      const interviewData = await startInterview(generatedQuestions);

      // Step 3: Navigate to interview session with credentials (base64 encoded)
      // Note: The interview page expects 'url' and 'token' keys
      const credentialsParam = btoa(
        JSON.stringify({
          url: interviewData.livekitUrl,
          token: interviewData.livekitToken,
        })
      );
      router.push(`/dashboard/interview/mock/${interviewData.interviewId}?credentials=${credentialsParam}&mode=job_specific`);
    } catch (err) {
      console.error('Flow error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setFlowState('error');
    }
  };

  const handleExitClick = () => {
    router.push('/dashboard/interview');
  };

  const handleRetry = () => {
    fetchJob();
  };

  const companyName = job?.company?.name || 'the company';
  const jobTitle = job?.title || 'this role';

  // Loading state - full screen
  if (flowState === 'loading_job' || aiVideoCoach === undefined || hasBetaAccess === null) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 flex items-center justify-center">
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 pointer-events-none" />
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400 font-medium">Loading job details...</p>
        </div>
      </div>
    );
  }

  // Error state - full screen
  if (flowState === 'error') {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col">
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 pointer-events-none" />

        {/* Header with Exit button */}
        <div className="relative z-10 flex items-center justify-between p-4 md:p-6">
          <button
            onClick={handleExitClick}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-gray-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
            <span className="hidden md:inline font-medium">Exit</span>
          </button>
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-6">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Something went wrong</h2>
            <p className="text-gray-400 mb-6">{error || 'We encountered an error while setting up your interview.'}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleExitClick}
                className="px-6 py-3 rounded-xl bg-slate-800 border border-slate-700 font-bold text-gray-300 hover:bg-slate-700 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleRetry}
                className="px-6 py-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-purple-600 font-bold text-white hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No description state - full screen
  if (flowState === 'no_description') {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col">
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 pointer-events-none" />

        {/* Header with Exit button */}
        <div className="relative z-10 flex items-center justify-between p-4 md:p-6">
          <button
            onClick={handleExitClick}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-gray-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
            <span className="hidden md:inline font-medium">Exit</span>
          </button>
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/20 mb-6">
              <Building2 className="w-8 h-8 text-orange-400" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Add a Job Description</h2>
            <p className="text-gray-400 mb-6">
              To generate relevant interview questions for the {jobTitle} role at {companyName},
              we need the job description. Add it to your job application to continue.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleExitClick}
                className="px-6 py-3 rounded-xl bg-slate-800 border border-slate-700 font-bold text-gray-300 hover:bg-slate-700 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => router.push(`/dashboard/jobs/${jobId}`)}
                className="px-6 py-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-purple-600 font-bold text-white hover:opacity-90 transition-opacity"
              >
                Edit Job Application
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Generating/Starting states - full screen with progress
  if (flowState === 'generating_questions' || flowState === 'starting_interview') {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col">
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 pointer-events-none" />

        {/* Header with job info */}
        <div className="relative z-10 flex items-center justify-between p-4 md:p-6">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/30">
            <Building2 className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 font-medium text-sm">{companyName}</span>
          </div>
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="flex justify-center mb-8">
              <div className="relative">
                {/* Animated rings */}
                <div className="absolute inset-0 rounded-full bg-purple-400 animate-ping opacity-20"></div>
                <div className="absolute inset-2 rounded-full bg-purple-400 animate-ping opacity-30 animation-delay-150"></div>
                <div className="relative p-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                  {flowState === 'generating_questions' ? (
                    <Sparkles className="w-8 h-8 text-white" />
                  ) : (
                    <Video className="w-8 h-8 text-white" />
                  )}
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-black text-white mb-2">
              {flowState === 'generating_questions'
                ? `Preparing your interview for ${companyName}...`
                : 'Starting your interview...'}
            </h2>
            <p className="text-gray-400 font-medium">
              {flowState === 'generating_questions'
                ? `Generating tailored questions for the ${jobTitle} role`
                : 'Connecting to your AI interviewer'}
            </p>

            {/* Progress indicator */}
            <div className="mt-8 flex items-center justify-center gap-2">
              <div className={`w-3 h-3 rounded-full ${flowState === 'generating_questions' ? 'bg-purple-500' : 'bg-purple-300'}`}></div>
              <div className={`w-3 h-3 rounded-full ${flowState === 'starting_interview' ? 'bg-purple-500' : 'bg-gray-600'}`}></div>
            </div>

            {/* Tips while generating */}
            {flowState === 'generating_questions' && (
              <div className="mt-12 p-6 rounded-2xl bg-slate-800 border border-slate-700 text-left">
                <h3 className="font-bold text-white mb-2">While you wait...</h3>
                <ul className="text-sm text-gray-400 space-y-2">
                  <li>• Take a deep breath and relax</li>
                  <li>• Have water nearby</li>
                  <li>• Make sure your camera and mic are ready</li>
                  <li>• Think about why you want this role</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Ready state - full screen preparation page
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 overflow-y-auto">
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 pointer-events-none" />

      {/* Header with Exit button and duration badge */}
      <div className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <button
          onClick={handleExitClick}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-gray-300 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
          <span className="hidden md:inline font-medium">Exit</span>
        </button>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/30">
          <Clock className="w-4 h-4 text-purple-400" />
          <span className="text-purple-300 font-medium text-sm">20 min interview</span>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex justify-center px-6 pb-12">
        <div className="max-w-2xl w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
              <Video className="w-10 h-10 text-white" />
            </div>
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 text-purple-300 font-semibold text-sm">
                <Building2 className="w-4 h-4" />
                {companyName}
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-4">
              Job-Specific Mock Interview
            </h1>
            <p className="text-lg text-gray-400 max-w-lg mx-auto">
              Practice with AI-generated questions tailored to the <span className="text-white font-semibold">{jobTitle}</span> role
            </p>
          </div>

          {/* Job Info Card */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden mb-6">
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/20">
                  <Briefcase className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{jobTitle}</h2>
                  <p className="text-sm text-gray-400">{companyName}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Before you begin checklist */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-4">Before you begin:</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-400 text-sm font-bold">1</span>
                </div>
                <span className="text-gray-300">
                  <strong className="text-white">Allow camera &amp; microphone access</strong> when prompted
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-400 text-sm font-bold">2</span>
                </div>
                <span className="text-gray-300">
                  <strong className="text-white">Find a quiet space</strong> and ensure your audio quality is strong
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-400 text-sm font-bold">3</span>
                </div>
                <span className="text-gray-300">
                  <strong className="text-white">Use the N+STAR+TL method</strong> for behavioral questions
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-400 text-sm font-bold">4</span>
                </div>
                <span className="text-gray-300">
                  <strong className="text-white">Speak naturally</strong> - the AI interviewer will respond conversationally
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-400 text-sm font-bold">5</span>
                </div>
                <span className="text-gray-300">
                  <strong className="text-white">Click &quot;Finish&quot; when done</strong> to receive your AI-powered feedback and evaluation
                </span>
              </li>
            </ul>
          </div>

          {/* Start Button */}
          <div className="text-center">
            <button
              onClick={handleStartInterview}
              className="px-10 py-5 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_8px_0_0_rgba(147,51,234,0.4)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_4px_0_0_rgba(147,51,234,0.4)] font-black text-white text-xl transition-all duration-200"
            >
              <span className="flex items-center justify-center gap-3">
                <Video className="w-6 h-6" />
                Start Interview
              </span>
            </button>
            <p className="mt-4 text-gray-500 text-sm">
              Questions will be specific to the job description
            </p>
          </div>
        </div>
      </div>

      {/* Beta Access Modal */}
      <BetaAccessModal
        isOpen={showBetaModal}
        onClose={() => setShowBetaModal(false)}
        featureName="AI Mock Interview"
      />
    </div>
  );
}
