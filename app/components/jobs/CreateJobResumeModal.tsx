'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, Copy, Loader2, Wand2, AlertCircle, FileText } from 'lucide-react';
import { ResumeVersion } from '@/lib/hooks/useResumeData';
import CustomizationSummaryModal from '@/app/components/resume/CustomizationSummaryModal';
import { useRouter } from 'next/navigation';

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

type CreateJobResumeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  applicationId: string;
  jobTitle: string;
  companyName: string;
  jobDescription?: string | null;
};

const CreateJobResumeModal = ({
  isOpen,
  onClose,
  onSuccess,
  applicationId,
  jobTitle,
  companyName,
  jobDescription: existingJobDescription,
}: CreateJobResumeModalProps) => {
  const router = useRouter();
  
  // Master resume state
  const [masterResumes, setMasterResumes] = useState<ResumeVersion[]>([]);
  const [isLoadingMasters, setIsLoadingMasters] = useState(false);
  const [selectedMasterId, setSelectedMasterId] = useState('');
  
  // Form state
  const [resumeName, setResumeName] = useState('');
  const [customizationMode, setCustomizationMode] = useState<'clone' | 'customize'>('customize'); // Default to AI customize
  const [jobDescription, setJobDescription] = useState('');
  
  // Loading and error state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Customization result state
  const [customizationResult, setCustomizationResult] = useState<CustomizationResult | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // Check if job has description
  const jobHasDescription = existingJobDescription && existingJobDescription.trim().length > 0;

  // Fetch master resumes when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchMasterResumes();
      // Auto-generate resume name
      setResumeName(`${companyName} - ${jobTitle}`);
    }
  }, [isOpen, companyName, jobTitle]);

  // Auto-select master if there's only one
  useEffect(() => {
    if (masterResumes.length === 1) {
      setSelectedMasterId(masterResumes[0].id);
    } else if (masterResumes.length === 0) {
      setSelectedMasterId('');
    }
  }, [masterResumes]);

  const fetchMasterResumes = async () => {
    setIsLoadingMasters(true);
    try {
      const response = await fetch('/api/resume/versions');
      if (response.ok) {
        const data = await response.json();
        const masters = (data.versions || []).filter((v: ResumeVersion) => v.is_master);
        setMasterResumes(masters);
      }
    } catch (error) {
      console.error('Error fetching master resumes:', error);
      setError('Failed to load your master resumes');
    } finally {
      setIsLoadingMasters(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedMasterId || !resumeName.trim()) {
      setError('Please select a master resume and enter a name.');
      return;
    }

    // Validate for customize mode
    if (customizationMode === 'customize') {
      if (!jobHasDescription && !jobDescription.trim()) {
        setError('Please enter a job description so AI can customize your resume.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (customizationMode === 'customize') {
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
            applicationId,
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
        const response = await fetch(`/api/resume/versions/${selectedMasterId}/clone`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            newName: resumeName.trim(),
            applicationId,
            isMaster: false,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to clone resume');
        }

        // Success - refresh and close
        onSuccess();
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
    setResumeName(`${companyName} - ${jobTitle}`);
    setCustomizationMode('customize');
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
      onSuccess();
      onClose();
    }
  };

  const handleCloseSummary = () => {
    setShowSummaryModal(false);
    resetForm();
    onSuccess();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-job-resume-title"
      >
        <div className="rounded-[2.5rem] bg-white shadow-[0_20px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300 max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-[0_4px_0_0_rgba(147,51,234,0.4)]">
                <Wand2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 id="create-job-resume-title" className="text-2xl font-black text-gray-900">
                  Create Tailored Resume
                </h2>
                <p className="text-sm text-gray-600 font-semibold">
                  for {jobTitle} at {companyName}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors p-2 hover:bg-gray-100 rounded-[1rem]"
              aria-label="Close modal"
              tabIndex={0}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Loading Overlay */}
          {isLoading && loadingMessage && (
            <div className="absolute inset-0 bg-white/95 rounded-[2.5rem] flex flex-col items-center justify-center z-10">
              <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-[0_8px_0_0_rgba(147,51,234,0.4)]">
                <Sparkles className="w-10 h-10 text-white animate-pulse" />
              </div>
              <p className="text-xl font-black text-gray-800">{loadingMessage}</p>
              <p className="text-sm text-gray-600 mt-2 font-medium">This may take 30-60 seconds...</p>
              <div className="mt-6 flex gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {/* No Master Resumes State */}
          {!isLoadingMasters && masterResumes.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-orange-200 to-yellow-200 flex items-center justify-center mx-auto mb-4 border-2 border-orange-300">
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2">No Master Resume Found</h3>
              <p className="text-gray-600 font-medium mb-6 max-w-sm mx-auto">
                You need at least one master resume to create a job-specific version. Import or create one first.
              </p>
              <button
                onClick={() => {
                  handleClose();
                  router.push('/dashboard/resume');
                }}
                className="px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_6px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200"
              >
                Go to Resume Builder
              </button>
            </div>
          )}

          {/* Loading Masters State */}
          {isLoadingMasters && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
          )}

          {/* Form */}
          {!isLoadingMasters && masterResumes.length > 0 && (
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
                    Based on Master Resume
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

              {/* Customization Mode - AI-focused */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  How would you like to create this resume?
                </label>
                <div className="space-y-3">
                  {/* Customize with AI Option - First and Default */}
                  <label 
                    className={`flex items-start gap-3 p-4 rounded-[1.25rem] border-2 cursor-pointer transition-all ${
                      customizationMode === 'customize' 
                        ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-pink-50 shadow-[0_4px_0_0_rgba(147,51,234,0.2)]' 
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
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <span className="font-black text-gray-900">AI-Tailored Resume</span>
                        <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">
                          RECOMMENDED
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                        AI analyzes the job description and automatically <strong>reorders bullets</strong> by relevance, 
                        <strong> optimizes language</strong> with keywords, and <strong>suggests skills</strong> to add.
                      </p>
                    </div>
                  </label>

                  {/* Clone Only Option */}
                  <label 
                    className={`flex items-start gap-3 p-4 rounded-[1.25rem] border-2 cursor-pointer transition-all ${
                      customizationMode === 'clone' 
                        ? 'border-purple-400 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setCustomizationMode('clone')}
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
                        <span className="font-bold text-gray-900">Quick Clone</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Create an exact copy to manually customize later.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Job Description Input - Show when customize mode and no stored description */}
              {customizationMode === 'customize' && !jobHasDescription && (
                <div>
                  <label htmlFor="job-description" className="block text-sm font-bold text-gray-700 mb-2">
                    Job Description <span className="text-red-500">*</span>
                  </label>
                  <p className="text-sm text-gray-500 mb-2">
                    Paste the job description so AI can tailor your resume perfectly.
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
              {customizationMode === 'customize' && jobHasDescription && (
                <div className="p-4 rounded-[1rem] bg-green-50 border-2 border-green-200">
                  <div className="flex items-center gap-2 text-green-700 font-bold text-sm">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Job description found in application
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    AI will use the saved job description to customize your resume.
                  </p>
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
                <div className="p-4 rounded-[1rem] bg-red-50 border-2 border-red-200 text-red-700 font-semibold text-sm flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3.5 border-2 border-gray-300 text-gray-700 rounded-[1.25rem] hover:bg-gray-50 font-bold disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !selectedMasterId || !resumeName.trim() || (customizationMode === 'customize' && !jobHasDescription && !jobDescription.trim())}
                  className={`flex-1 px-4 py-3.5 rounded-[1.25rem] font-black disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 ${
                    customizationMode === 'customize'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_6px_0_0_rgba(147,51,234,0.6)] hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.6)]'
                      : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-[0_6px_0_0_rgba(37,99,235,0.6)] hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(37,99,235,0.6)]'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : customizationMode === 'customize' ? (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Create AI Resume
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Clone Resume
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Customization Summary Modal */}
      {customizationResult && (
        <CustomizationSummaryModal
          isOpen={showSummaryModal}
          onClose={handleCloseSummary}
          onViewResume={handleViewResume}
          summary={customizationResult.customizationSummary}
          resumeName={customizationResult.version.name}
          jobTitle={jobTitle}
          companyName={companyName}
        />
      )}
    </>
  );
};

export default CreateJobResumeModal;

