'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, Copy, Loader2, Lock } from 'lucide-react';
import { ResumeVersion } from '@/lib/hooks/useResumeData';
import CustomizationSummaryModal from './CustomizationSummaryModal';
import PremiumFeatureGateModal from './PremiumFeatureGateModal';
import { useRouter } from 'next/navigation';
import { getUserPlanClient } from '@/lib/utils/resume-tracking';

type JobApplication = {
  id: string;
  title: string;
  description?: string | null;
  company: {
    name: string;
  };
};

type CustomizationSummary = {
  overallDescription?: string;
  keyChanges?: string[];
  keywordsInjected?: string[];
  bulletsReordered: number;
  bulletsOptimized: number;
  skillsAdded: number;
};

type CustomizationResult = {
  version: {
    id: string;
    name: string;
  };
  customizationSummary: CustomizationSummary;
};

type CreateFromMasterModalProps = {
  isOpen: boolean;
  onClose: () => void;
  masterResumes: ResumeVersion[];
  onClone: (sourceVersionId: string, newName: string, applicationId?: string) => Promise<void>;
};

export default function CreateFromMasterModal({
  isOpen,
  onClose,
  masterResumes,
  onClone,
}: CreateFromMasterModalProps) {
  const router = useRouter();
  const [selectedMasterId, setSelectedMasterId] = useState('');
  const [resumeName, setResumeName] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  
  // New state for customization
  const [customizationMode, setCustomizationMode] = useState<'clone' | 'customize'>('clone');
  const [jobDescription, setJobDescription] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Customization result state
  const [customizationResult, setCustomizationResult] = useState<CustomizationResult | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  
  // Premium feature gate state
  const [userPlan, setUserPlan] = useState<'learn' | 'accelerate' | null>(null);
  const [showPremiumGate, setShowPremiumGate] = useState(false);
  
  // Check if user can access AI customization (Accelerate plan only)
  const canAccessAICustomization = userPlan === 'accelerate';

  // Get selected job details
  const selectedJob = jobApplications.find(job => job.id === selectedJobId);
  const jobHasDescription = selectedJob?.description && selectedJob.description.trim().length > 0;

  // Auto-select master if there's only one
  useEffect(() => {
    if (isOpen && masterResumes.length === 1) {
      setSelectedMasterId(masterResumes[0].id);
    } else if (isOpen && masterResumes.length === 0) {
      setSelectedMasterId('');
    }
  }, [isOpen, masterResumes]);

  // Fetch job applications and user plan when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchJobApplications();
      fetchUserPlan();
    }
  }, [isOpen]);

  // Fetch user subscription plan
  const fetchUserPlan = async () => {
    try {
      const plan = await getUserPlanClient();
      setUserPlan(plan);
    } catch (error) {
      console.error('Error fetching user plan:', error);
    }
  };

  // Reset customization mode when job changes
  useEffect(() => {
    if (!selectedJobId) {
      setCustomizationMode('clone');
    }
    setJobDescription('');
    setError(null);
  }, [selectedJobId]);

  // Auto-generate resume name when job is selected
  useEffect(() => {
    if (selectedJob && !resumeName) {
      setResumeName(`${selectedJob.company?.name || 'Company'} - ${selectedJob.title}`);
    }
  }, [selectedJob, resumeName]);

  const fetchJobApplications = async () => {
    setIsLoadingJobs(true);
    try {
      const response = await fetch('/api/jobs/applications');
      if (response.ok) {
        const data = await response.json();
        setJobApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Error fetching job applications:', error);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedMasterId || !resumeName.trim()) {
      return;
    }

    // Validate for customize mode
    if (customizationMode === 'customize') {
      // Check if user has Accelerate plan for AI customization
      if (!canAccessAICustomization) {
        setShowPremiumGate(true);
        return;
      }
      
      if (!selectedJobId) {
        setError('Please select a job application to customize for.');
        return;
      }
      if (!jobHasDescription && !jobDescription.trim()) {
        setError('Please enter a job description to customize your resume.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (customizationMode === 'customize' && selectedJobId) {
        // AI Customization flow
        setLoadingMessage('Analyzing job description...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setLoadingMessage('Customizing your resume with AI...');
        
        const response = await fetch(`/api/resume/versions/${selectedMasterId}/customize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            applicationId: selectedJobId,
            newName: resumeName.trim(),
            jobDescription: jobHasDescription ? undefined : jobDescription.trim(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to customize resume');
        }

        const result = await response.json();
        
        setCustomizationResult({
          version: result.version,
          customizationSummary: result.customizationSummary,
        });
        
        setShowSummaryModal(true);
        setLoadingMessage('');
      } else {
        // Standard clone flow
        await onClone(
          selectedMasterId,
          resumeName.trim(),
          selectedJobId || undefined
        );

        // Reset form and close
        resetForm();
        onClose();
      }
    } catch (error) {
      console.error('Error creating resume:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const resetForm = () => {
    setSelectedMasterId(masterResumes.length === 1 ? masterResumes[0].id : '');
    setResumeName('');
    setSelectedJobId('');
    setCustomizationMode('clone');
    setJobDescription('');
    setError(null);
    setCustomizationResult(null);
  };

  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  const handleViewResume = () => {
    if (customizationResult?.version?.id) {
      router.push(`/dashboard/resume/${customizationResult.version.id}`);
      setShowSummaryModal(false);
      resetForm();
      onClose();
    }
  };

  const handleCloseSummary = () => {
    setShowSummaryModal(false);
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="rounded-[2.5rem] bg-white shadow-[0_20px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300 max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-gray-900">
              Create Job-Specific Resume
            </h2>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors p-2 hover:bg-gray-100 rounded-[1rem]"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Loading Overlay */}
          {isLoading && loadingMessage && (
            <div className="absolute inset-0 bg-white/90 rounded-[2.5rem] flex flex-col items-center justify-center z-10">
              <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-[0_6px_0_0_rgba(147,51,234,0.4)]">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <p className="text-lg font-bold text-gray-800">{loadingMessage}</p>
              <p className="text-sm text-gray-600 mt-2">This may take 30-60 seconds...</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Select Master Resume - Only show if multiple masters */}
            {masterResumes.length > 1 && (
              <div>
                <label htmlFor="master-resume" className="block text-sm font-bold text-gray-700 mb-2">
                  Select Master Resume
                </label>
                <select
                  id="master-resume"
                  value={selectedMasterId}
                  onChange={(e) => setSelectedMasterId(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
                  required
                  disabled={isLoading}
                >
                  <option value="">Choose a master resume...</option>
                  {masterResumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Show selected master name if only one */}
            {masterResumes.length === 1 && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Cloning From
                </label>
                <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-[1rem] bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 text-xs font-black bg-gradient-to-br from-blue-400 to-cyan-400 text-white rounded-[0.5rem]">
                      MASTER
                    </span>
                    <span className="font-bold text-gray-800">
                      {masterResumes[0].name}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Link to Job Application */}
            <div>
              <label htmlFor="job-application" className="block text-sm font-bold text-gray-700 mb-2">
                Link to Job Application
              </label>
              {isLoadingJobs ? (
                <div className="w-full px-4 py-3 border-2 border-gray-300 rounded-[1rem] bg-gray-50 text-gray-500 font-medium">
                  Loading job applications...
                </div>
              ) : jobApplications.length === 0 ? (
                <div className="w-full px-4 py-3 border-2 border-gray-300 rounded-[1rem] bg-gray-50 text-gray-500 font-medium">
                  No job applications found
                </div>
              ) : (
                <select
                  id="job-application"
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
                  disabled={isLoading}
                >
                  <option value="">None (create without linking)</option>
                  {jobApplications.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title} at {job.company?.name || 'Unknown Company'}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Customization Mode - Only show when job is selected */}
            {selectedJobId && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Customization Mode
                </label>
                <div className="space-y-3">
                  {/* Clone Only Option */}
                  <label 
                    className={`flex items-start gap-3 p-4 rounded-[1.25rem] border-2 cursor-pointer transition-all ${
                      customizationMode === 'clone' 
                        ? 'border-purple-400 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="customization-mode"
                      value="clone"
                      checked={customizationMode === 'clone'}
                      onChange={() => setCustomizationMode('clone')}
                      disabled={isLoading}
                      className="mt-1 w-4 h-4 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Copy className="w-4 h-4 text-gray-600" />
                        <span className="font-bold text-gray-900">Clone Only</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Create an exact copy of your master resume linked to this job.
                      </p>
                    </div>
                  </label>

                  {/* Customize with AI Option */}
                  <label 
                    className={`flex items-start gap-3 p-4 rounded-[1.25rem] border-2 cursor-pointer transition-all ${
                      customizationMode === 'customize' 
                        ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-pink-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setCustomizationMode('customize')}
                  >
                    <input
                      type="radio"
                      name="customization-mode"
                      value="customize"
                      checked={customizationMode === 'customize'}
                      onChange={() => setCustomizationMode('customize')}
                      disabled={isLoading}
                      className="mt-1 w-4 h-4 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="font-bold text-gray-900">Customize with AI</span>
                        <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">
                          NEW
                        </span>
                        {!canAccessAICustomization && (
                          <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            ACCELERATE
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        AI will reorder bullets, optimize language, and add relevant keywords based on the job description.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Job Description Input - Show when customize mode and no stored description */}
            {customizationMode === 'customize' && selectedJobId && !jobHasDescription && (
              <div>
                <label htmlFor="job-description" className="block text-sm font-bold text-gray-700 mb-2">
                  Job Description <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-500 mb-2">
                  Paste the job description so AI can customize your resume.
                </p>
                <textarea
                  id="job-description"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here..."
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium resize-none"
                  disabled={isLoading}
                  required={customizationMode === 'customize' && !jobHasDescription}
                />
              </div>
            )}

            {/* Show stored description indicator */}
            {customizationMode === 'customize' && selectedJobId && jobHasDescription && (
              <div className="p-4 rounded-[1rem] bg-green-50 border-2 border-green-200">
                <div className="flex items-center gap-2 text-green-700 font-bold text-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Job description found - AI will use it to customize your resume
                </div>
              </div>
            )}

            {/* Resume Name */}
            <div>
              <label htmlFor="resume-name" className="block text-sm font-bold text-gray-700 mb-2">
                Resume Name
              </label>
              <input
                id="resume-name"
                type="text"
                value={resumeName}
                onChange={(e) => setResumeName(e.target.value)}
                placeholder="e.g., Google PM Resume"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
                required
                disabled={isLoading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-[1rem] bg-red-50 border-2 border-red-200 text-red-700 font-semibold text-sm">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-[1.25rem] hover:bg-gray-50 font-bold disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !selectedMasterId || !resumeName.trim() || (customizationMode === 'customize' && !selectedJobId)}
                className={`flex-1 px-4 py-3 rounded-[1.25rem] font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 ${
                  customizationMode === 'customize'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_4px_0_0_rgba(147,51,234,0.6)] hover:translate-y-0.5 hover:shadow-[0_2px_0_0_rgba(147,51,234,0.6)]'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_4px_0_0_rgba(147,51,234,0.6)] hover:translate-y-0.5 hover:shadow-[0_2px_0_0_rgba(147,51,234,0.6)]'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : customizationMode === 'customize' ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Customize Resume
                  </>
                ) : (
                  'Create Resume'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Customization Summary Modal */}
      {customizationResult && selectedJob && (
        <CustomizationSummaryModal
          isOpen={showSummaryModal}
          onClose={handleCloseSummary}
          onViewResume={handleViewResume}
          summary={customizationResult.customizationSummary}
          resumeName={customizationResult.version.name}
          jobTitle={selectedJob.title}
          companyName={selectedJob.company?.name || 'Unknown Company'}
        />
      )}

      {/* Premium Feature Gate Modal for AI Customization */}
      <PremiumFeatureGateModal
        isOpen={showPremiumGate}
        onClose={() => setShowPremiumGate(false)}
        featureName="AI Resume Customization"
        featureDescription="AI-powered resume customization is available exclusively for Accelerate plan subscribers. Upgrade to automatically tailor your resume to any job description."
        currentPlan={userPlan}
        requiresAccelerate={true}
      />
    </>
  );
}
