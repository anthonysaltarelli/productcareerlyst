'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Sparkles,
  Lock,
  ArrowRight,
  BarChart3,
  Target,
  Zap,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { trackEvent } from '@/lib/amplitude/client';
import { getBaseUserContext } from '@/lib/utils/resume-tracking';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

type OnboardingStep =
  | 'idle' // Initial state - waiting for file
  | 'uploading' // File is being uploaded and processed
  | 'extracting' // OpenAI is extracting resume data
  | 'analyzing' // Running the free baseline analysis
  | 'complete'; // Analysis complete, showing results

type AnalysisData = {
  overallScore: number;
  categoryScores: {
    actionVerbs: number;
    accomplishments: number;
    quantification: number;
    impact: number;
    conciseness: number;
  };
  keywordAnalysis?: {
    present: { keyword: string; count?: number }[];
    missing: { keyword: string; priority?: 'high' | 'medium' | 'low' }[];
  } | null;
  recommendations?: {
    priority: number;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }[] | null;
  atsCompatibility?: 'Good' | 'Fair' | 'Poor' | null;
};

type Props = {
  userPlan: 'learn' | 'accelerate' | null;
  onImportComplete: (versionId: string) => void;
  onViewResume?: (versionId: string) => void;
  onCreateFromScratch?: () => void;
};

const UPLOAD_MESSAGES = [
  { text: 'Uploading your resume...', icon: '📤' },
];

const EXTRACTING_MESSAGES = [
  { text: 'Extracting contact information...', icon: '👤' },
  { text: 'Parsing work experiences...', icon: '💼' },
  { text: 'Identifying skills and education...', icon: '🎓' },
  { text: 'Formatting resume structure...', icon: '📋' },
];

const ANALYZING_MESSAGES = [
  { text: 'Analyzing action verbs and language...', icon: '✨' },
  { text: 'Evaluating accomplishments...', icon: '🏆' },
  { text: 'Checking quantification and metrics...', icon: '📊' },
  { text: 'Assessing impact statements...', icon: '🎯' },
  { text: 'Reviewing conciseness...', icon: '✂️' },
  { text: 'Scanning for PM keywords...', icon: '🔍' },
  { text: 'Calculating your resume score...', icon: '📈' },
];

const getScoreColor = (score: number) => {
  if (score >= 80) return 'from-green-500 to-emerald-500';
  if (score >= 60) return 'from-blue-500 to-cyan-500';
  if (score >= 40) return 'from-orange-500 to-amber-500';
  return 'from-red-500 to-pink-500';
};

const getScoreLabel = (score: number) => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Needs Work';
  return 'Needs Significant Improvement';
};

export const ResumeOnboardingEmptyState = ({
  userPlan,
  onImportComplete,
  onViewResume,
  onCreateFromScratch,
}: Props) => {
  const [step, setStep] = useState<OnboardingStep>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [versionId, setVersionId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLearnOrNoPlan = userPlan === 'learn' || userPlan === null;

  // Progress through loading messages
  useEffect(() => {
    if (step === 'uploading' || step === 'extracting' || step === 'analyzing') {
      const messages =
        step === 'uploading'
          ? UPLOAD_MESSAGES
          : step === 'extracting'
          ? EXTRACTING_MESSAGES
          : ANALYZING_MESSAGES;

      const interval = setInterval(() => {
        setCurrentMessageIndex((prev) => {
          if (prev >= messages.length - 1) return prev;
          return prev + 1;
        });
      }, 3000);

      return () => clearInterval(interval);
    }
    setCurrentMessageIndex(0);
  }, [step]);

  // Validate file
  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Unsupported file type. Only PDF and DOCX files are supported.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds 5MB limit.`;
    }
    return null;
  }, []);

  // Handle file selection and start import
  const handleFileSelect = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setFileError(validationError);
        setSelectedFile(null);
        return;
      }

      setFileError(null);
      setSelectedFile(file);
      setError(null);
      setStep('uploading');

      // Track file selection
      setTimeout(() => {
        try {
          trackEvent('User Started Resume Import Onboarding', {
            'Page Route': '/dashboard/resume',
            'File Name': file.name,
            'File Size MB': (file.size / 1024 / 1024).toFixed(2),
            'File Type': file.type,
            'User Plan': userPlan || 'none',
          });
        } catch {
          // Silently fail
        }
      }, 0);

      try {
        // Step 1: Upload and import resume
        setStep('extracting');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('versionName', 'Master Resume');
        formData.append('isMaster', 'true');

        const importResponse = await fetch('/api/resume/import', {
          method: 'POST',
          body: formData,
        });

        if (!importResponse.ok) {
          const errorData = await importResponse.json().catch(() => ({ error: 'Failed to import resume' }));
          throw new Error(errorData.error || 'Failed to import resume');
        }

        const importData = await importResponse.json();
        const importedVersionId = importData.version?.id;

        if (!importedVersionId) {
          throw new Error('No version ID returned from import');
        }

        setVersionId(importedVersionId);

        // Track import success
        setTimeout(() => {
          try {
            const experiences = importData.version?.experiences || [];
            const education = importData.version?.education || [];
            const skills = importData.version?.skills || [];

            trackEvent('User Completed Resume Import Onboarding', {
              'Page Route': '/dashboard/resume',
              'Version ID': importedVersionId,
              'Import Success': true,
              'Experience Count': experiences.length,
              'Education Count': education.length,
              'Skills Count': Array.isArray(skills) ? skills.length : Object.keys(skills).length,
              'User Plan': userPlan || 'none',
            });
          } catch {
            // Silently fail
          }
        }, 0);

        // Step 2: Run free baseline analysis
        setStep('analyzing');
        setCurrentMessageIndex(0);

        const analyzeResponse = await fetch(`/api/resume/versions/${importedVersionId}/analyze`, {
          method: 'POST',
          headers: {
            'x-onboarding-request': 'true', // Flag for free analysis
          },
        });

        if (!analyzeResponse.ok) {
          // Analysis may fail for non-subscribers, but we still have the resume
          const errorData = await analyzeResponse.json().catch(() => ({}));
          console.log('Analysis response:', errorData);
          
          // Still mark as complete - they have their resume
          setStep('complete');
          onImportComplete(importedVersionId);
          return;
        }

        const analysisData = await analyzeResponse.json();
        setAnalysis(analysisData.analysis || analysisData);

        // Track analysis success
        setTimeout(() => {
          try {
            trackEvent('User Completed Baseline Analysis Onboarding', {
              'Page Route': '/dashboard/resume',
              'Version ID': importedVersionId,
              'Overall Score': analysisData.analysis?.overallScore || analysisData.overallScore,
              'Analysis Success': true,
              'User Plan': userPlan || 'none',
            });
          } catch {
            // Silently fail
          }
        }, 0);

        setStep('complete');
        onImportComplete(importedVersionId);
      } catch (err) {
        console.error('Error in resume import flow:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setStep('idle');

        // Track error
        setTimeout(() => {
          try {
            trackEvent('User Resume Import Onboarding Failed', {
              'Page Route': '/dashboard/resume',
              'Error Message': err instanceof Error ? err.message : 'Unknown error',
              'Step': step,
              'User Plan': userPlan || 'none',
            });
          } catch {
            // Silently fail
          }
        }, 0);
      }
    },
    [validateFile, userPlan, onImportComplete, step]
  );

  // Handle file input change
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  // Get current loading message
  const getCurrentMessage = () => {
    const messages =
      step === 'uploading'
        ? UPLOAD_MESSAGES
        : step === 'extracting'
        ? EXTRACTING_MESSAGES
        : ANALYZING_MESSAGES;
    return messages[Math.min(currentMessageIndex, messages.length - 1)];
  };

  // Render idle state (upload prompt)
  const renderIdleState = () => (
    <div className="min-h-[80vh] flex items-center justify-center p-4 md:p-8">
      <div className="max-w-3xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 border-2 border-blue-300 mb-6">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-blue-700">Free Resume Analysis</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 leading-tight">
            Import Resume & Get Your Score
          </h1>
          <p className="text-lg md:text-xl text-gray-600 font-medium max-w-xl mx-auto">
            Import your existing resume to see how it stacks up. We'll analyze it and give you a baseline score.
          </p>
        </div>

        {/* Upload Area */}
        <div
          className={`
            relative p-8 md:p-12 rounded-[2rem] border-2 border-dashed transition-all duration-200 cursor-pointer
            ${isDragging
              ? 'border-blue-500 bg-blue-50 scale-[1.02]'
              : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/50'
            }
          `}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Upload resume file"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={step !== 'idle'}
          />

          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-[1.5rem] bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-[0_8px_0_0_rgba(37,99,235,0.4)] border-2 border-blue-600">
              <Upload className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl md:text-2xl font-black text-gray-800 mb-2">
              Drop your resume here
            </h3>
            <p className="text-gray-600 font-medium mb-6">
              or click to browse • PDF or DOCX up to 5MB
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-blue-500 to-cyan-500 shadow-[0_6px_0_0_rgba(37,99,235,0.6)] border-2 border-blue-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(37,99,235,0.6)] font-black text-white transition-all duration-200 text-lg"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <FileText className="w-5 h-5" />
              Select Resume File
            </button>
          </div>
        </div>

        {/* Or Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-slate-300"></div>
          <span className="text-sm font-bold text-slate-500 uppercase">or</span>
          <div className="flex-1 h-px bg-slate-300"></div>
        </div>

        {/* Start from Scratch */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              // Track event
              setTimeout(() => {
                try {
                  trackEvent('User Started Resume From Scratch', {
                    'Page Route': '/dashboard/resume',
                    'User Plan': userPlan || 'none',
                  });
                } catch {
                  // Silently fail
                }
              }, 0);
              onCreateFromScratch?.();
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-[1.5rem] bg-white border-2 border-slate-300 shadow-[0_4px_0_0_rgba(0,0,0,0.1)] hover:translate-y-0.5 hover:shadow-[0_2px_0_0_rgba(0,0,0,0.1)] font-bold text-slate-700 transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            Start from Scratch Instead
          </button>
          <p className="text-sm text-slate-500 mt-2">
            Create a blank resume and add your experience manually
          </p>
        </div>

        {/* File Error */}
        {fileError && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 border-2 border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 font-semibold">{fileError}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 border-2 border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 font-semibold">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setSelectedFile(null);
                }}
                className="mt-2 text-sm text-red-600 hover:text-red-700 font-bold underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* What You'll Get */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-[1.5rem] bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center mb-3">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h4 className="font-bold text-gray-800 mb-1">Overall Score</h4>
            <p className="text-sm text-gray-600">See how your resume compares to top PM candidates</p>
          </div>
          <div className="p-5 rounded-[1.5rem] bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
            <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center mb-3">
              <Target className="w-5 h-5 text-white" />
            </div>
            <h4 className="font-bold text-gray-800 mb-1">Category Breakdown</h4>
            <p className="text-sm text-gray-600">Scores for verbs, impact, metrics, and more</p>
          </div>
          <div className="p-5 rounded-[1.5rem] bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
            <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h4 className="font-bold text-gray-800 mb-1">Quick Import</h4>
            <p className="text-sm text-gray-600">Your resume formatted and ready to edit</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render loading states (uploading, extracting, analyzing)
  const renderLoadingState = () => {
    const currentMessage = getCurrentMessage();
    const isAnalyzing = step === 'analyzing';
    const totalSteps = 3;
    const currentStep = step === 'uploading' ? 1 : step === 'extracting' ? 2 : 3;

    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 md:p-8">
        <div className="max-w-lg w-full text-center">
          {/* Progress Card */}
          <div className="p-8 md:p-12 rounded-[2rem] bg-white border-2 border-slate-200 shadow-xl">
            {/* Spinner */}
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-[1.5rem] mb-8 border-2 border-blue-300">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>

            {/* Step Label */}
            <div className="mb-4">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-200">
                <span className="text-sm font-bold text-purple-700">
                  Step {currentStep} of {totalSteps}
                </span>
              </span>
            </div>

            {/* Current Message */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-3xl">{currentMessage.icon}</span>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                {currentMessage.text}
              </h3>
            </div>

            {/* Progress Dots */}
            <div className="flex items-center justify-center gap-1.5 mb-6">
              {(step === 'uploading'
                ? UPLOAD_MESSAGES
                : step === 'extracting'
                ? EXTRACTING_MESSAGES
                : ANALYZING_MESSAGES
              ).map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-500 ${
                    index === currentMessageIndex
                      ? 'bg-blue-600 w-8'
                      : index < currentMessageIndex
                      ? 'bg-blue-300 w-2'
                      : 'bg-gray-200 w-2'
                  }`}
                />
              ))}
            </div>

            {/* Step Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${(currentStep / totalSteps) * 100}%`,
                }}
              />
            </div>

            {/* File Name */}
            {selectedFile && (
              <div className="mt-6 flex items-center justify-center gap-2 text-gray-600">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">{selectedFile.name}</span>
              </div>
            )}

            {/* Tip for analyzing */}
            {isAnalyzing && (
              <p className="mt-6 text-sm text-gray-500">
                This may take up to 60 seconds for a comprehensive analysis
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render complete state with results
  const renderCompleteState = () => {
    if (!analysis) {
      // Resume imported but no analysis (shouldn't happen often)
      return (
        <div className="min-h-[80vh] flex items-center justify-center p-4 md:p-8">
          <div className="max-w-lg w-full text-center">
            <div className="p-8 md:p-12 rounded-[2rem] bg-white border-2 border-slate-200 shadow-xl">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-400 rounded-[1.5rem] mb-6 border-2 border-green-500">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-4">Resume Imported!</h3>
              <p className="text-gray-600 font-medium mb-8">
                Your resume has been imported and is ready to edit.
              </p>
              {versionId && (
                <button
                  onClick={() => onViewResume?.(versionId)}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-blue-500 to-cyan-500 shadow-[0_6px_0_0_rgba(37,99,235,0.6)] border-2 border-blue-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(37,99,235,0.6)] font-black text-white transition-all duration-200"
                >
                  View & Edit Resume
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    const score = analysis.overallScore;
    const scoreColor = getScoreColor(score);
    const scoreLabel = getScoreLabel(score);

    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 md:p-8">
        <div className="max-w-4xl w-full">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 border-2 border-green-300 mb-4">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm font-bold text-green-700">Analysis Complete</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-black text-gray-900 mb-2">
              Your Resume Score
            </h2>
            <p className="text-gray-600 font-medium">
              Here's how your resume stacks up against PM best practices
            </p>
          </div>

          {/* Score Card */}
          <div className="p-8 md:p-10 rounded-[2rem] bg-white border-2 border-slate-200 shadow-xl mb-6">
            {/* Overall Score */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-8 pb-8 border-b-2 border-slate-100">
              <div
                className={`w-32 h-32 rounded-[2rem] bg-gradient-to-br ${scoreColor} flex items-center justify-center shadow-[0_8px_0_0_rgba(0,0,0,0.15)]`}
              >
                <span className="text-5xl font-black text-white">{score}</span>
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-3xl font-black text-gray-900 mb-1">{scoreLabel}</h3>
                <p className="text-gray-600 font-medium">
                  {score >= 60
                    ? "You're on the right track! Let's make it even better."
                    : "There's room for improvement. Let's work on it together."}
                </p>
              </div>
            </div>

            {/* Category Scores */}
            <div className="mb-8">
              <h4 className="text-lg font-bold text-gray-800 mb-4">Category Breakdown</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(analysis.categoryScores).map(([key, value]) => {
                  const categoryName = key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (str) => str.toUpperCase())
                    .trim();
                  const shortName =
                    key === 'actionVerbs'
                      ? 'Verbs'
                      : key === 'accomplishments'
                      ? 'Results'
                      : key === 'quantification'
                      ? 'Metrics'
                      : key === 'impact'
                      ? 'Impact'
                      : 'Concise';

                  return (
                    <div
                      key={key}
                      className="text-center p-4 rounded-[1rem] bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200"
                    >
                      <div className="text-2xl font-black text-gray-800 mb-1">{value}</div>
                      <p className="text-xs font-bold text-gray-600">{shortName}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Blurred Content for Learn/No Plan */}
            {isLearnOrNoPlan ? (
              <div className="relative">
                {/* Blurred Preview */}
                <div className="filter blur-sm pointer-events-none select-none">
                  {/* Fake Recommendations */}
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-gray-800 mb-4">Top Recommendations</h4>
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center text-white font-bold">
                              {i}
                            </div>
                            <div className="h-4 bg-gray-300 rounded w-48" />
                          </div>
                          <div className="h-3 bg-gray-200 rounded w-full" />
                          <div className="h-3 bg-gray-200 rounded w-3/4 mt-2" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fake Keywords */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-800 mb-4">Missing Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {['roadmap', 'A/B testing', 'stakeholders', 'metrics', 'user research'].map(
                        (kw) => (
                          <span
                            key={kw}
                            className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-sm font-medium"
                          >
                            {kw}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Upgrade Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl">
                  <div className="text-center p-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-[1rem] mb-4">
                      <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-xl font-black text-gray-900 mb-2">
                      Unlock Full Analysis
                    </h4>
                    <p className="text-gray-600 font-medium mb-6 max-w-sm">
                      Upgrade to Accelerate to see detailed recommendations, keyword analysis, and
                      ATS compatibility scores.
                    </p>
                    <Link
                      href="/dashboard/billing/plans"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_6px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200"
                    >
                      Upgrade to Accelerate
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Full Analysis for Accelerate Users */}
                {analysis.recommendations && analysis.recommendations.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-gray-800 mb-4">Top Recommendations</h4>
                    <div className="space-y-3">
                      {analysis.recommendations.slice(0, 3).map((rec) => (
                        <div
                          key={rec.priority}
                          className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center text-white font-bold">
                              {rec.priority}
                            </div>
                            <h5 className="font-bold text-gray-800">{rec.title}</h5>
                            <span
                              className={`ml-auto px-2 py-0.5 rounded text-xs font-bold ${
                                rec.impact === 'high'
                                  ? 'bg-red-100 text-red-700'
                                  : rec.impact === 'medium'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {rec.impact.charAt(0).toUpperCase() + rec.impact.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{rec.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.keywordAnalysis?.missing && analysis.keywordAnalysis.missing.length > 0 && (
                  <div>
                    <h4 className="text-lg font-bold text-gray-800 mb-4">Missing Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.keywordAnalysis.missing.slice(0, 8).map((kw, idx) => (
                        <span
                          key={idx}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                            kw.priority === 'high'
                              ? 'bg-red-100 text-red-700'
                              : kw.priority === 'medium'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {kw.keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* CTA Button */}
          <div className="text-center">
            {versionId && (
              <button
                onClick={() => onViewResume?.(versionId)}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-blue-500 to-cyan-500 shadow-[0_6px_0_0_rgba(37,99,235,0.6)] border-2 border-blue-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(37,99,235,0.6)] font-black text-white transition-all duration-200 text-lg"
              >
                View & Edit Your Resume
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Main render
  if (step === 'idle') return renderIdleState();
  if (step === 'complete') return renderCompleteState();
  return renderLoadingState();
};

export default ResumeOnboardingEmptyState;

