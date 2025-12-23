"use client";

import { useState, useEffect, useRef } from "react";
import { MoreVertical, Loader2 } from "lucide-react";
import Link from "next/link";
import type { ResumeVersion } from "@/lib/hooks/useResumeData";
import CreateFromMasterModal from "./CreateFromMasterModal";
import CloneToMasterModal from "./CloneToMasterModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import ImportResumeModal from "./ImportResumeModal";
import ResumeOnboardingEmptyState from "./ResumeOnboardingEmptyState";
import { trackEvent } from "@/lib/amplitude/client";
import { getUserPlanClient } from "@/lib/utils/resume-tracking";
import { createResumeDocument, downloadDocx } from "@/lib/utils/exportResume";
import { useUserPlan } from "@/lib/hooks/useUserPlan";

type Props = {
  versions: ResumeVersion[];
  isLoadingVersions?: boolean;
  onEditVersion: (versionId: string) => void;
  onCreateMaster?: () => void;
  onCloneFromMaster?: (sourceVersionId: string, newName: string, applicationId?: string, isMaster?: boolean) => Promise<void>;
  onDeleteVersion?: (versionId: string) => Promise<void>;
  onImportMaster?: (file: File, versionName: string, isMaster: boolean) => Promise<void>;
  onRefreshVersions?: () => void;
};

type JobApplication = {
  id: string;
  title: string;
  company: {
    name: string;
  };
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('en-US', options);
};

export default function ResumeLanding({ versions, isLoadingVersions = false, onEditVersion, onCreateMaster, onCloneFromMaster, onDeleteVersion, onImportMaster, onRefreshVersions }: Props) {
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [isCloneToMasterModalOpen, setIsCloneToMasterModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedMasterForClone, setSelectedMasterForClone] = useState<string | null>(null);
  const [jobApplications, setJobApplications] = useState<Record<string, JobApplication>>({});
  const [analysisScores, setAnalysisScores] = useState<Record<string, number>>({});
  const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; versionId: string | null; versionName: string }>({
    isOpen: false,
    versionId: null,
    versionName: '',
  });
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);
  const [downloadingDocxId, setDownloadingDocxId] = useState<string | null>(null);

  // Get user plan for the empty state
  const { plan: userPlan, isLoading: isPlanLoading } = useUserPlan();

  // Split versions into masters and job-specific
  const masterResumes = versions.filter(v => v.is_master);
  const jobSpecificResumes = versions.filter(v => !v.is_master);

  // Show the onboarding empty state if user has no resumes
  const showOnboardingEmptyState = versions.length === 0;

  // Fetch job applications for job-specific resumes
  useEffect(() => {
    const fetchJobApplications = async () => {
      const applicationIds = jobSpecificResumes
        .map(v => v.application_id)
        .filter((id): id is string => !!id);

      if (applicationIds.length === 0) return;

      try {
        const response = await fetch('/api/jobs/applications');
        if (response.ok) {
          const data = await response.json();
          const applicationsMap: Record<string, JobApplication> = {};

          data.applications?.forEach((app: JobApplication) => {
            applicationsMap[app.id] = app;
          });

          setJobApplications(applicationsMap);
        }
      } catch (error) {
        console.error('Error fetching job applications:', error);
      }
    };

    fetchJobApplications();
  }, [jobSpecificResumes.length]);

  // Fetch analysis scores for all versions
  useEffect(() => {
    const fetchAnalysisScores = async () => {
      const scoresMap: Record<string, number> = {};

      await Promise.all(
        versions.map(async (version) => {
          try {
            const response = await fetch(`/api/resume/versions/${version.id}/analyze`);
            if (response.ok) {
              const data = await response.json();
              if (data.analysis?.overallScore !== undefined) {
                scoresMap[version.id] = data.analysis.overallScore;
              }
            }
          } catch (error) {
            // Silently fail - no analysis available for this version
            console.debug(`No analysis found for version ${version.id}`);
          }
        })
      );

      setAnalysisScores(scoresMap);
    };

    if (versions.length > 0) {
      fetchAnalysisScores();
    }
  }, [versions]);

  const handleClone = async (sourceVersionId: string, newName: string, applicationId?: string) => {
    if (onCloneFromMaster) {
      await onCloneFromMaster(sourceVersionId, newName, applicationId, false);
    }
  };

  const handleCloneToMaster = async (sourceVersionId: string, newName: string) => {
    if (onCloneFromMaster) {
      // Clone as a master resume (isMaster = true, no application_id)
      await onCloneFromMaster(sourceVersionId, newName, undefined, true);
    }
  };

  const handleDeleteMaster = async () => {
    if (onDeleteVersion && deleteModalState.versionId) {
      await onDeleteVersion(deleteModalState.versionId);
      setDeleteModalState({ isOpen: false, versionId: null, versionName: '' });
    }
  };

  // Format month/year for filename
  const formatMonthYear = (): string => {
    const date = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const handleDownloadPDF = async (version: ResumeVersion) => {
    setDownloadingPdfId(version.id);
    const exportStartTime = Date.now();
    
    try {
      // Fetch the resume data
      const dataResponse = await fetch(`/api/resume/versions/${version.id}/data`);
      if (!dataResponse.ok) {
        throw new Error('Failed to fetch resume data');
      }
      const resumeData = await dataResponse.json();

      // Generate PDF
      const pdfResponse = await fetch('/api/resume/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resumeData),
      });

      if (!pdfResponse.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await pdfResponse.blob();
      const exportDuration = Date.now() - exportStartTime;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Format filename: "Name - Month Year.pdf"
      const resumeName = resumeData.contactInfo?.name || 'Resume';
      link.download = `${resumeName} - ${formatMonthYear()}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Track export success
      const userPlan = await getUserPlanClient();
      setTimeout(() => {
        try {
          trackEvent('User Exported Resume PDF', {
            'Resume Version ID': version.id,
            'Resume Name': version.name,
            'Is Master Resume': version.is_master,
            'Export Success': true,
            'Export Duration': exportDuration,
            'File Size': blob.size,
            'Export Location': 'Resume Landing Page',
            'User Plan': userPlan,
          });
        } catch {
          // Silently fail - tracking should never block
        }
      }, 0);

      // Trigger baseline action completion for resume export
      try {
        await fetch('/api/goals/baseline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trigger: 'resume_exported' }),
        });
      } catch {
        // Silently fail - baseline tracking should never block
      }
    } catch (err) {
      console.error('Error downloading PDF:', err);
      
      // Track export failure
      const userPlan = await getUserPlanClient();
      setTimeout(() => {
        try {
          trackEvent('User Exported Resume PDF', {
            'Resume Version ID': version.id,
            'Resume Name': version.name,
            'Is Master Resume': version.is_master,
            'Export Success': false,
            'Error Message': err instanceof Error ? err.message : 'Unknown error',
            'Export Location': 'Resume Landing Page',
            'User Plan': userPlan,
          });
        } catch {
          // Silently fail
        }
      }, 0);
      
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const handleDownloadDocx = async (version: ResumeVersion) => {
    setDownloadingDocxId(version.id);
    const exportStartTime = Date.now();
    
    try {
      // Fetch the resume data
      const dataResponse = await fetch(`/api/resume/versions/${version.id}/data`);
      if (!dataResponse.ok) {
        throw new Error('Failed to fetch resume data');
      }
      const resumeData = await dataResponse.json();

      // Generate DOCX
      const doc = createResumeDocument(resumeData);
      
      // Format filename: "Name - Month Year.docx"
      const resumeName = resumeData.contactInfo?.name || 'Resume';
      const filename = `${resumeName} - ${formatMonthYear()}.docx`;
      
      await downloadDocx(doc, filename);
      const exportDuration = Date.now() - exportStartTime;

      // Track export success
      const userPlan = await getUserPlanClient();
      setTimeout(() => {
        try {
          trackEvent('User Exported Resume DOCX', {
            'Resume Version ID': version.id,
            'Resume Name': version.name,
            'Is Master Resume': version.is_master,
            'Export Success': true,
            'Export Duration': exportDuration,
            'Export Location': 'Resume Landing Page',
            'User Plan': userPlan,
          });
        } catch {
          // Silently fail
        }
      }, 0);
    } catch (err) {
      console.error('Error downloading DOCX:', err);
      
      // Track export failure
      const userPlan = await getUserPlanClient();
      setTimeout(() => {
        try {
          trackEvent('User Exported Resume DOCX', {
            'Resume Version ID': version.id,
            'Resume Name': version.name,
            'Is Master Resume': version.is_master,
            'Export Success': false,
            'Error Message': err instanceof Error ? err.message : 'Unknown error',
            'Export Location': 'Resume Landing Page',
            'User Plan': userPlan,
          });
        } catch {
          // Silently fail
        }
      }, 0);
      
      alert('Failed to download DOCX. Please try again.');
    } finally {
      setDownloadingDocxId(null);
    }
  };

  // Show the onboarding empty state when user has no resumes
  // Wait for both versions and plan to finish loading before showing empty state
  if (showOnboardingEmptyState && !isPlanLoading && !isLoadingVersions) {
    return (
      <ResumeOnboardingEmptyState
        userPlan={userPlan}
        onImportComplete={(versionId) => {
          // DON'T refresh versions here - wait until user clicks "View & Edit Resume"
          // This prevents the landing page from flashing before the score page
          // The versions will be refreshed when onViewResume is called
        }}
        onViewResume={(versionId) => {
          // Refresh versions when user explicitly navigates to the editor
          onRefreshVersions?.();
          onEditVersion(versionId);
        }}
        onCreateFromScratch={() => {
          // Create a new master resume from scratch
          onCreateMaster?.();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 pt-6 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-black text-gray-800 mb-2">
            Resume Builder
          </h1>
          <p className="text-gray-600 font-medium">
            Create multiple versions for different jobs. Stand out, get hired.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-5 rounded-[2rem] bg-white border-2 border-gray-200 shadow-sm text-center">
            {(() => {
              const scores = Object.values(analysisScores);
              const averageScore = scores.length > 0
                ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
                : null;

              return averageScore !== null ? (
                <p className="text-3xl font-black text-green-600 mb-1">{averageScore}<span className="text-lg text-gray-400">/100</span></p>
              ) : (
                <p className="text-2xl font-black text-gray-400 mb-1">—</p>
              );
            })()}
            <p className="text-sm font-semibold text-gray-600">Resume Score</p>
          </div>

          <div className="p-5 rounded-[2rem] bg-white border-2 border-gray-200 shadow-sm text-center">
            <p className="text-3xl font-black text-blue-600 mb-1">{versions.length}</p>
            <p className="text-sm font-semibold text-gray-600">Resume Versions</p>
          </div>

          <div className="p-5 rounded-[2rem] bg-white border-2 border-gray-200 shadow-sm text-center">
            <p className="text-3xl font-black text-purple-600 mb-1">Good</p>
            <p className="text-sm font-semibold text-gray-600">ATS Compatible</p>
          </div>
        </div>

        {/* Master Resumes Section */}
        <div className="mb-8">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-2xl font-black text-gray-800">Master Resumes</h2>
            <div className="flex gap-2">
              {onImportMaster && (
                <button
                  onClick={async () => {
                    const userPlan = await getUserPlanClient();
                    trackEvent('User Opened Import Resume Modal', {
                      'Total Resume Count': versions.length,
                      'User Plan': userPlan,
                    });
                    setIsImportModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 font-bold text-white transition-colors text-sm"
                  aria-label="Import existing resume"
                >
                  Import Resume
                </button>
              )}
              {onCreateMaster && (
                <button
                  onClick={onCreateMaster}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 font-bold text-white transition-colors text-sm"
                  aria-label="Create new master resume"
                >
                  + Create Master
                </button>
              )}
            </div>
          </div>

          {masterResumes.length === 0 ? (
            <div className="text-center py-10 px-6 rounded-[2rem] bg-white border-2 border-gray-200 shadow-sm">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-xl mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">No Master Resumes</h3>
              <p className="text-gray-600 font-medium text-sm mb-4">Import an existing resume or create a new one from scratch.</p>
              <div className="flex gap-2 justify-center">
                {onImportMaster && (
                  <button
                    onClick={async () => {
                      const userPlan = await getUserPlanClient();
                      trackEvent('User Opened Import Resume Modal', {
                        'Total Resume Count': versions.length,
                        'User Plan': userPlan,
                      });
                      setIsImportModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 font-bold text-white transition-colors text-sm"
                    aria-label="Import existing resume"
                  >
                    Import Resume
                  </button>
                )}
                {onCreateMaster && (
                  <button
                    onClick={onCreateMaster}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 font-bold text-white transition-colors text-sm"
                    aria-label="Create new master resume"
                  >
                    + Start from Scratch
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {masterResumes.map((version) => (
                <ResumeCard
                  key={version.id}
                  version={version}
                  onEdit={onEditVersion}
                  isMaster={true}
                  analysisScore={analysisScores[version.id]}
                  onCloneToJobSpecific={() => {
                    setSelectedMasterForClone(version.id);
                    setIsCloneModalOpen(true);
                  }}
                  onCloneToMaster={() => {
                    setSelectedMasterForClone(version.id);
                    setIsCloneToMasterModalOpen(true);
                  }}
                  onDelete={(versionId, versionName) => {
                    setDeleteModalState({ isOpen: true, versionId, versionName });
                  }}
                  onDownloadPDF={handleDownloadPDF}
                  onDownloadDocx={handleDownloadDocx}
                  isDownloadingPDF={downloadingPdfId === version.id}
                  isDownloadingDocx={downloadingDocxId === version.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Job-Specific Resumes Section */}
        <div className="mb-8">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-2xl font-black text-gray-800">Job-Specific Resumes</h2>
            {masterResumes.length > 0 && (
              <button
                onClick={() => setIsCloneModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 font-bold text-white transition-colors text-sm"
              >
                + Create from Master
              </button>
            )}
          </div>

          {jobSpecificResumes.length === 0 ? (
            <div className="text-center py-10 px-6 rounded-[2rem] bg-white border-2 border-gray-200 shadow-sm">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-xl mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">No Job-Specific Resumes</h3>
              <p className="text-gray-600 font-medium text-sm mb-4">Clone a master resume to create a tailored version for specific jobs.</p>
              {masterResumes.length > 0 && (
                <button
                  onClick={() => setIsCloneModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 font-bold text-white transition-colors text-sm"
                >
                  + Create from Master
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobSpecificResumes.map((version) => (
                <ResumeCard
                  key={version.id}
                  version={version}
                  onEdit={onEditVersion}
                  isMaster={false}
                  analysisScore={analysisScores[version.id]}
                  jobApplication={version.application_id ? jobApplications[version.application_id] : undefined}
                  onDownloadPDF={handleDownloadPDF}
                  isDownloadingPDF={downloadingPdfId === version.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Clone to Job-Specific Modal */}
        <CreateFromMasterModal
          isOpen={isCloneModalOpen}
          onClose={() => {
            setIsCloneModalOpen(false);
            setSelectedMasterForClone(null);
          }}
          masterResumes={selectedMasterForClone ? masterResumes.filter(m => m.id === selectedMasterForClone) : masterResumes}
          onClone={handleClone}
        />

        {/* Clone to Master Modal */}
        <CloneToMasterModal
          isOpen={isCloneToMasterModalOpen}
          onClose={() => {
            setIsCloneToMasterModalOpen(false);
            setSelectedMasterForClone(null);
          }}
          sourceMaster={selectedMasterForClone ? masterResumes.find(m => m.id === selectedMasterForClone) : null}
          onClone={handleCloneToMaster}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={deleteModalState.isOpen}
          onClose={() => setDeleteModalState({ isOpen: false, versionId: null, versionName: '' })}
          onConfirm={handleDeleteMaster}
          title="Delete Master Resume"
          message={`Are you sure you want to delete "${deleteModalState.versionName}"? This action cannot be undone.`}
        />

        {/* Import Resume Modal */}
        {onImportMaster && (
          <ImportResumeModal
            isOpen={isImportModalOpen}
            onClose={async () => {
              const userPlan = await getUserPlanClient();
              trackEvent('User Closed Import Resume Modal', {
                'Modal Action': 'cancelled',
                'User Plan': userPlan,
              });
              setIsImportModalOpen(false);
            }}
            onImport={async (file, versionName, isMaster) => {
              try {
                await onImportMaster(file, versionName, isMaster);
                // Track successful import (modal close with imported action)
                const userPlan = await getUserPlanClient();
                trackEvent('User Closed Import Resume Modal', {
                  'Modal Action': 'imported',
                  'User Plan': userPlan,
                });
              } catch (error) {
                // Track cancelled/error (modal close with cancelled action)
                const userPlan = await getUserPlanClient();
                trackEvent('User Closed Import Resume Modal', {
                  'Modal Action': 'cancelled',
                  'User Plan': userPlan,
                });
                throw error;
              }
            }}
          />
        )}

        {/* Help Section */}
        <div className="p-6 rounded-[2rem] bg-white border-2 border-gray-200 shadow-sm">
          <h3 className="text-lg font-black text-gray-800 mb-2">Getting Started</h3>
          <p className="text-gray-600 font-medium text-sm mb-4">
            Your Master Resumes contain all your experiences and bullets. Create job-specific
            versions by cloning a master and tailoring it for each application.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/courses/resume-linkedin"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 font-bold text-white transition-colors text-sm"
            >
              Watch Tutorial
            </Link>
            <a
              href="https://docs.google.com/document/d/1TgMhFSh1PLJ4q8rSskt7iQi4GzaNzDgUA5Gt7HH0o5c/edit"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl border-2 border-gray-200 hover:bg-gray-50 font-bold text-gray-700 transition-colors text-sm"
            >
              View Documentation
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Resume Card Component
type ResumeCardProps = {
  version: ResumeVersion;
  onEdit: (versionId: string) => void;
  isMaster: boolean;
  analysisScore?: number;
  onCloneToJobSpecific?: () => void;
  onCloneToMaster?: () => void;
  onDelete?: (versionId: string, versionName: string) => void;
  jobApplication?: JobApplication;
  onDownloadPDF?: (version: ResumeVersion) => void;
  onDownloadDocx?: (version: ResumeVersion) => void;
  isDownloadingPDF?: boolean;
  isDownloadingDocx?: boolean;
};

function ResumeCard({ version, onEdit, isMaster, analysisScore, onCloneToJobSpecific, onCloneToMaster, onDelete, jobApplication, onDownloadPDF, onDownloadDocx, isDownloadingPDF, isDownloadingDocx }: ResumeCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="p-6 rounded-[2rem] bg-white border-2 border-gray-200 hover:border-purple-300 shadow-sm hover:shadow-md transition-all duration-200 overflow-visible relative flex flex-col h-full">
      {/* Card Header */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-gray-800">
                {version.name}
              </h3>
              {isMaster && (
                <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-700 rounded-lg">
                  MASTER
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 font-medium">
              Modified: {formatDate(version.updated_at)}
            </p>

            {/* Job Application Link */}
            {jobApplication && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <div className="px-2 py-1 bg-purple-50 border border-purple-200 rounded-lg">
                  <span className="font-semibold text-purple-700">
                    {jobApplication.title}
                  </span>
                  <span className="text-purple-600"> at </span>
                  <span className="font-semibold text-purple-700">
                    {jobApplication.company?.name || 'Unknown'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Score */}
        <div className="mt-auto">
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
            <p className="text-xs text-gray-500 font-semibold mb-1">Resume Score</p>
            {analysisScore !== undefined ? (
              <p className="text-2xl font-black text-gray-800">
                {analysisScore}
                <span className="text-sm text-gray-400 font-semibold">/100</span>
              </p>
            ) : (
              <p className="text-sm font-medium text-gray-400">
                No analysis yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Card Actions */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onEdit(version.id)}
          className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 font-bold text-white transition-colors text-sm"
        >
          Edit Resume
        </button>

        {/* Master Resume Menu */}
        {isMaster && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="px-3 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors text-sm flex items-center"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-10">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onDownloadPDF?.(version);
                  }}
                  disabled={isDownloadingPDF || isDownloadingDocx}
                  className={`w-full px-4 py-2.5 text-left font-medium text-gray-700 border-b border-gray-100 flex items-center gap-2 text-sm ${
                    isDownloadingPDF || isDownloadingDocx ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                  }`}
                  aria-label="Download resume as PDF"
                >
                  {isDownloadingPDF ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    'Download PDF'
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onDownloadDocx?.(version);
                  }}
                  disabled={isDownloadingPDF || isDownloadingDocx}
                  className={`w-full px-4 py-2.5 text-left font-medium text-gray-700 border-b border-gray-100 flex items-center gap-2 text-sm ${
                    isDownloadingPDF || isDownloadingDocx ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                  }`}
                  aria-label="Download resume as DOCX"
                >
                  {isDownloadingDocx ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating DOCX...
                    </>
                  ) : (
                    'Download DOCX'
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onCloneToMaster?.();
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-gray-50 font-medium text-gray-700 border-b border-gray-100 text-sm"
                >
                  Clone to New Master
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onCloneToJobSpecific?.();
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-gray-50 font-medium text-gray-700 border-b border-gray-100 text-sm"
                >
                  Clone to Job-Specific
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onDelete?.(version.id, version.name);
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-red-50 font-medium text-red-600 text-sm"
                >
                  Delete Resume
                </button>
              </div>
            )}
          </div>
        )}

        {/* Job-Specific PDF Button */}
        {!isMaster && (
          <button
            onClick={() => onDownloadPDF?.(version)}
            disabled={isDownloadingPDF}
            className={`px-3 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold transition-colors text-sm flex items-center gap-1.5 ${
              isDownloadingPDF
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-200'
            }`}
            aria-label="Download resume as PDF"
          >
            {isDownloadingPDF ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>...</span>
              </>
            ) : (
              'PDF'
            )}
          </button>
        )}
      </div>
    </div>
  );
}

