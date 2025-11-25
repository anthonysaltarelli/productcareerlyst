'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, FileText, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useOnboardingProgress } from '@/lib/hooks/useOnboardingProgress';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/amplitude/client';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

interface ResumeUploadStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export const ResumeUploadStep = ({ onNext, onSkip }: ResumeUploadStepProps) => {
  const { progress, updateStep, completeStep, skipStep } = useOnboardingProgress();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [uploadInitiated, setUploadInitiated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resumeData = progress?.progress_data?.resume_upload;

  // Check existing resume upload status
  useEffect(() => {
    if (resumeData?.analysisStatus) {
      setAnalysisStatus(resumeData.analysisStatus);
    }
    if (resumeData?.versionId) {
      setUploadInitiated(true);
    }
  }, [resumeData]);

  // Validate file
  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Unsupported file type: ${file.type}. Only PDF and DOCX files are supported.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds 5MB limit.`;
    }
    return null;
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      setFileError(error);
      setSelectedFile(null);
      
      // Track file validation error (non-blocking)
      setTimeout(() => {
        try {
          trackEvent('User Selected Invalid Resume File', {
            'Page Route': '/onboarding',
            'Step': 'resume_upload',
            'File Name': file.name,
            'File Size MB': (file.size / 1024 / 1024).toFixed(2),
            'File Type': file.type,
            'Error Message': error,
            'Error Type': file.size > MAX_FILE_SIZE ? 'file_too_large' : 'invalid_file_type',
          });
        } catch (trackError) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Tracking error (non-blocking):', trackError);
          }
        }
      }, 0);
      return;
    }

    setFileError(null);
    setSelectedFile(file);
    
    // Track file selection (non-blocking)
    setTimeout(() => {
      try {
        trackEvent('User Selected Resume File', {
          'Page Route': '/onboarding',
          'Step': 'resume_upload',
          'File Name': file.name,
          'File Size MB': (file.size / 1024 / 1024).toFixed(2),
          'File Type': file.type,
          'Selection Method': 'file_input', // Will be updated if drag-and-drop
        });
      } catch (trackError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Tracking error (non-blocking):', trackError);
        }
      }
    }, 0);
  }, [validateFile]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Handle drag and drop
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      // Track drag-and-drop selection (non-blocking)
      setTimeout(() => {
        try {
          trackEvent('User Selected Resume File', {
            'Page Route': '/onboarding',
            'Step': 'resume_upload',
            'File Name': file.name,
            'File Size MB': (file.size / 1024 / 1024).toFixed(2),
            'File Type': file.type,
            'Selection Method': 'drag_and_drop',
          });
        } catch (trackError) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Tracking error (non-blocking):', trackError);
          }
        }
      }, 0);
      
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Upload and analyze resume (non-blocking - allows user to continue immediately)
  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setFileError(null);
    setUploadInitiated(true);

    // Start upload in background (fire-and-forget)
    // User can continue to next step immediately
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('versionName', 'Master Resume');
    formData.append('isMaster', 'true');

    // Mark upload as initiated immediately so user can proceed
    toast.success('Resume upload started! You can continue to the next step while it processes.');

    // Track upload initiated (non-blocking)
    setTimeout(() => {
      try {
        trackEvent('User Initiated Resume Upload', {
          'Page Route': '/onboarding',
          'Step': 'resume_upload',
          'File Name': selectedFile.name,
          'File Size MB': (selectedFile.size / 1024 / 1024).toFixed(2),
          'File Type': selectedFile.type,
          'Version Name': 'Master Resume',
          'Is Master Resume': true,
        });
      } catch (trackError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Tracking error (non-blocking):', trackError);
        }
      }
    }, 0);

    // Upload and analyze in background
    fetch('/api/resume/import', {
      method: 'POST',
      body: formData,
    })
      .then(async (uploadResponse) => {
        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({ error: 'Failed to import resume' }));
          throw new Error(errorData.error || 'Failed to import resume');
        }

        const uploadData = await uploadResponse.json();
        const versionId = uploadData.version?.id;

        if (!versionId) {
          throw new Error('No version ID returned from import');
        }

        setUploadProgress(100);
        setIsUploading(false);

        // Store upload info
        await updateStep('resume_upload', {
          versionId,
          uploadedAt: new Date().toISOString(),
          analysisStatus: 'processing',
        });

        // Track upload success (non-blocking)
        setTimeout(() => {
          try {
            trackEvent('User Completed Resume Upload', {
              'Page Route': '/onboarding',
              'Step': 'resume_upload',
              'File Name': selectedFile.name,
              'File Size MB': (selectedFile.size / 1024 / 1024).toFixed(2),
              'File Type': selectedFile.type,
              'Version ID': versionId,
              'Version Name': 'Master Resume',
              'Upload Status': 'success',
            });
          } catch (trackError) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('⚠️ Tracking error (non-blocking):', trackError);
            }
          }
        }, 0);

        // Step 2: Trigger analysis in background
        setAnalysisStatus('processing');
        
        // Track analysis initiated (non-blocking)
        setTimeout(() => {
          try {
            trackEvent('User Initiated Resume Analysis', {
              'Page Route': '/onboarding',
              'Step': 'resume_upload',
              'Version ID': versionId,
              'Analysis Context': 'onboarding',
              'Is Onboarding Request': true,
            });
          } catch (trackError) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('⚠️ Tracking error (non-blocking):', trackError);
            }
          }
        }, 0);

        // Start analysis (fire and forget)
        // Include header to indicate this is an onboarding request for free analysis
        fetch(`/api/resume/versions/${versionId}/analyze`, {
          method: 'POST',
          headers: {
            'x-onboarding-request': 'true',
          },
        })
          .then(async (response) => {
            if (!response.ok) {
              // Try to extract error message from response
              let errorMessage = 'Analysis failed';
              let errorData: any = null;
              
              try {
                errorData = await response.json();
                errorMessage = errorData.error || errorData.message || errorMessage;
              } catch (e) {
                // If response is not JSON, use status text
                errorMessage = response.statusText || errorMessage;
              }
              
              // Handle 403 (subscription required) gracefully during onboarding
              if (response.status === 403) {
                const requiresSubscription = errorData?.requiresSubscription || false;
                const requiresAccelerate = errorData?.requiresAccelerate || false;
                
                // During onboarding, subscription errors are expected
                setAnalysisStatus('failed');
                await updateStep('resume_upload', {
                  versionId,
                  uploadedAt: new Date().toISOString(),
                  analysisStatus: 'failed',
                  errorReason: requiresAccelerate ? 'accelerate_required' : 'subscription_required',
                });
                
                // Track analysis failure due to subscription (non-blocking)
                setTimeout(() => {
                  try {
                    trackEvent('User Resume Analysis Failed', {
                      'Page Route': '/onboarding',
                      'Step': 'resume_upload',
                      'Version ID': versionId,
                      'Error Status': response.status,
                      'Error Type': 'subscription_required',
                      'Requires Subscription': requiresSubscription,
                      'Requires Accelerate': requiresAccelerate,
                      'Analysis Context': 'onboarding',
                      'Is Expected During Onboarding': true,
                    });
                  } catch (trackError) {
                    if (process.env.NODE_ENV === 'development') {
                      console.warn('⚠️ Tracking error (non-blocking):', trackError);
                    }
                  }
                }, 0);
                
                // Silently handle - user can continue onboarding
                if (process.env.NODE_ENV === 'development') {
                  console.log('Resume analysis skipped during onboarding (subscription required)');
                }
                return; // Don't throw - this is expected during onboarding
              }
              
              // For other errors, log but don't block
              if (process.env.NODE_ENV === 'development') {
                console.error('Resume analysis failed:', {
                  status: response.status,
                  statusText: response.statusText,
                  error: errorMessage,
                  details: errorData,
                });
              }
              
              setAnalysisStatus('failed');
              await updateStep('resume_upload', {
                versionId,
                uploadedAt: new Date().toISOString(),
                analysisStatus: 'failed',
                errorReason: 'analysis_failed',
              });
              
              // Track analysis failure (non-blocking)
              setTimeout(() => {
                try {
                  trackEvent('User Resume Analysis Failed', {
                    'Page Route': '/onboarding',
                    'Step': 'resume_upload',
                    'Version ID': versionId,
                    'Error Status': response.status,
                    'Error Type': 'analysis_failed',
                    'Error Message': errorMessage,
                    'Analysis Context': 'onboarding',
                  });
                } catch (trackError) {
                  if (process.env.NODE_ENV === 'development') {
                    console.warn('⚠️ Tracking error (non-blocking):', trackError);
                  }
                }
              }, 0);
              
              return; // Don't throw - allow user to continue
            }
            
            // Success case
            const analysisData = await response.json();
            
            // Store analysis results
            await updateStep('resume_upload', {
              versionId,
              uploadedAt: new Date().toISOString(),
              analysisStatus: 'completed',
              analysisData: analysisData,
            });

            setAnalysisStatus('completed');
            toast.success('Resume analysis complete!');
            
            // Track analysis completion (non-blocking)
            setTimeout(() => {
              try {
                const overallScore = analysisData?.analysis?.overallScore || analysisData?.overallScore || null;
                const categoryScores = analysisData?.analysis?.categoryScores || analysisData?.categoryScores || {};
                const missingKeywords = analysisData?.analysis?.keywordAnalysis?.missing || [];
                
                trackEvent('User Completed Resume Analysis', {
                  'Page Route': '/onboarding',
                  'Step': 'resume_upload',
                  'Version ID': versionId,
                  'Analysis Status': 'completed',
                  'Overall Score': overallScore,
                  'Has Category Scores': Object.keys(categoryScores).length > 0,
                  'Category Count': Object.keys(categoryScores).length,
                  'Missing Keywords Count': missingKeywords.length,
                  'Analysis Context': 'onboarding',
                  'Is Onboarding Request': true,
                });
              } catch (trackError) {
                if (process.env.NODE_ENV === 'development') {
                  console.warn('⚠️ Tracking error (non-blocking):', trackError);
                }
              }
            }, 0);
          })
          .catch((error) => {
            // Network errors or other unexpected errors
            if (process.env.NODE_ENV === 'development') {
              console.error('Error analyzing resume:', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
              });
            }
            
            setAnalysisStatus('failed');
            updateStep('resume_upload', {
              versionId,
              uploadedAt: new Date().toISOString(),
              analysisStatus: 'failed',
              errorReason: 'network_error',
            });
            
            // Track network error (non-blocking)
            setTimeout(() => {
              try {
                trackEvent('User Resume Analysis Failed', {
                  'Page Route': '/onboarding',
                  'Step': 'resume_upload',
                  'Version ID': versionId,
                  'Error Type': 'network_error',
                  'Error Message': error instanceof Error ? error.message : String(error),
                  'Analysis Context': 'onboarding',
                });
              } catch (trackError) {
                if (process.env.NODE_ENV === 'development') {
                  console.warn('⚠️ Tracking error (non-blocking):', trackError);
                }
              }
            }, 0);
            
            // Don't show error toast during onboarding - user can continue
            // Analysis will be available after they subscribe
          });
      })
      .catch((error) => {
        const errorMessage = error instanceof Error ? error.message : 'Failed to upload resume';
        setFileError(errorMessage);
        setIsUploading(false);
        setUploadProgress(0);
        setUploadInitiated(false);
        toast.error(errorMessage);
        
        // Track upload failure (non-blocking)
        setTimeout(() => {
          try {
            trackEvent('User Resume Upload Failed', {
              'Page Route': '/onboarding',
              'Step': 'resume_upload',
              'File Name': selectedFile?.name || 'unknown',
              'File Size MB': selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(2) : null,
              'File Type': selectedFile?.type || null,
              'Error Message': errorMessage,
              'Error Type': 'upload_failed',
            });
          } catch (trackError) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('⚠️ Tracking error (non-blocking):', trackError);
            }
          }
        }, 0);
      });
  }, [selectedFile, updateStep]);

  const hasUploaded = resumeData?.versionId || false;
  // Allow proceeding if file is selected, upload initiated, or already uploaded
  const canProceed = selectedFile !== null || hasUploaded || uploadInitiated;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-900 mb-4">
          Upload Your Resume
        </h2>
        <p className="text-lg text-gray-700 font-semibold">
          We'll analyze your resume and provide insights to help you improve it.
        </p>
      </div>

      {!hasUploaded && !uploadInitiated ? (
        <div className="space-y-6">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
              isDragging
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-50/50'
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
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
              disabled={isUploading}
            />
            <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-bold text-gray-700 mb-2">
              Drag and drop your resume here, or click to browse
            </p>
            <p className="text-sm text-gray-500">
              PDF or DOCX files up to 5MB
            </p>
          </div>

          {selectedFile && (
            <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-purple-600" />
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </div>
          )}

          {fileError && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 font-semibold">{fileError}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upload Status */}
          {hasUploaded ? (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-black text-green-900 mb-2">
                    Resume Uploaded Successfully!
                  </h3>
                  <p className="text-green-700 font-semibold">
                    Your resume has been imported and is being analyzed.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Loader2 className="w-8 h-8 text-blue-600 flex-shrink-0 animate-spin" />
                <div className="flex-1">
                  <h3 className="text-lg font-black text-blue-900 mb-2">
                    Upload in Progress
                  </h3>
                  <p className="text-blue-700 font-semibold">
                    Your resume is being uploaded and analyzed in the background. You can continue to the next step now!
                  </p>
                </div>
              </div>
              {isUploading && (
                <div className="mt-4">
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Analysis Status */}
          {analysisStatus === 'processing' && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                <div>
                  <p className="font-bold text-blue-900">Analyzing your resume...</p>
                  <p className="text-sm text-blue-700 font-semibold">
                    This may take a few moments. You can continue to the next step.
                  </p>
                </div>
              </div>
            </div>
          )}

          {analysisStatus === 'completed' && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-bold text-green-900">Analysis Complete!</p>
                  <p className="text-sm text-green-700 font-semibold">
                    Your resume analysis results will be shown at the end of onboarding.
                  </p>
                </div>
              </div>
            </div>
          )}

          {analysisStatus === 'failed' && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
                <div>
                  <p className="font-bold text-yellow-900">Analysis in progress</p>
                  <p className="text-sm text-yellow-700 font-semibold">
                    You can continue - we'll show results when available.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation - Mobile: stacked (Continue on top), Desktop: side by side */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row-reverse sm:items-center sm:justify-between">
        <button
          onClick={() => {
            if (!canProceed) return;

            // If file is selected but upload hasn't started, trigger upload in background
            if (selectedFile && !uploadInitiated && !hasUploaded) {
              // Start upload in background (non-blocking)
              handleUpload();
            }

            // Mark step as complete if upload finished, otherwise just proceed
            if (hasUploaded) {
              completeStep('resume_upload');
            }
            
            // Track step completion (non-blocking)
            setTimeout(() => {
              try {
                trackEvent('User Completed Onboarding Step', {
                  'Page Route': '/onboarding',
                  'Step': 'resume_upload',
                  'Step Name': 'Resume Upload',
                  'Has Uploaded': hasUploaded,
                  'Upload Initiated': uploadInitiated,
                  'Analysis Status': analysisStatus,
                  'Has Selected File': selectedFile !== null,
                  'File Name': selectedFile?.name || null,
                  'File Type': selectedFile?.type || null,
                });
              } catch (trackError) {
                if (process.env.NODE_ENV === 'development') {
                  console.warn('⚠️ Tracking error (non-blocking):', trackError);
                }
              }
            }, 0);
            
            // Proceed immediately - upload continues in background
            onNext();
          }}
          disabled={!canProceed}
          className="w-full sm:w-auto px-8 py-3 bg-gradient-to-br from-purple-500 to-pink-500 text-white font-black rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Continue →
        </button>
        <button
          onClick={() => {
            // Track skip (non-blocking)
            setTimeout(() => {
              try {
                trackEvent('User Skipped Onboarding Step', {
                  'Page Route': '/onboarding',
                  'Step': 'resume_upload',
                  'Step Name': 'Resume Upload',
                  'Has Selected File': selectedFile !== null,
                  'Has Uploaded': hasUploaded,
                  'Upload Initiated': uploadInitiated,
                  'Analysis Status': analysisStatus,
                });
              } catch (trackError) {
                if (process.env.NODE_ENV === 'development') {
                  console.warn('⚠️ Tracking error (non-blocking):', trackError);
                }
              }
            }, 0);
            
            skipStep('resume_upload');
            onSkip();
          }}
          className="w-full sm:w-auto px-6 py-3 text-gray-600 font-bold hover:text-gray-800 transition-colors text-center"
        >
          Skip this step
        </button>
      </div>
    </div>
  );
};

