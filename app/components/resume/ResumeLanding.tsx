"use client";

import { useState, useEffect, useRef } from "react";
import { MoreVertical } from "lucide-react";
import type { ResumeVersion } from "@/lib/hooks/useResumeData";
import CreateFromMasterModal from "./CreateFromMasterModal";
import CloneToMasterModal from "./CloneToMasterModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import ImportResumeModal from "./ImportResumeModal";

type Props = {
  versions: ResumeVersion[];
  onEditVersion: (versionId: string) => void;
  onCreateMaster?: () => void;
  onCloneFromMaster?: (sourceVersionId: string, newName: string, applicationId?: string, isMaster?: boolean) => Promise<void>;
  onDeleteVersion?: (versionId: string) => Promise<void>;
  onImportMaster?: (file: File, versionName: string, isMaster: boolean) => Promise<void>;
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

export default function ResumeLanding({ versions, onEditVersion, onCreateMaster, onCloneFromMaster, onDeleteVersion, onImportMaster }: Props) {
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

  // Split versions into masters and job-specific
  const masterResumes = versions.filter(v => v.is_master);
  const jobSpecificResumes = versions.filter(v => !v.is_master);

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

  return (
    <div className="p-8 md:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-blue-200 to-cyan-200 shadow-[0_20px_0_0_rgba(37,99,235,0.3)] border-2 border-blue-300">
            <div className="inline-block px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-bold mb-4">
              📄 RESUME BUILDER
            </div>
            <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-br from-blue-700 to-cyan-600 bg-clip-text text-transparent mb-4 leading-tight">
              Craft Your Perfect Resume 🎯
            </h1>
            <p className="text-xl text-gray-700 font-semibold">
              Create multiple versions for different jobs. Stand out, get hired.
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-[2rem] bg-gradient-to-br from-green-200 to-emerald-200 shadow-[0_10px_0_0_rgba(22,163,74,0.3)] border-2 border-green-300 text-center">
            {(() => {
              const scores = Object.values(analysisScores);
              const averageScore = scores.length > 0 
                ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
                : null;
              
              return averageScore !== null ? (
                <p className="text-4xl font-black text-green-600 mb-2">{averageScore}</p>
              ) : (
                <p className="text-2xl font-black text-green-600 mb-2">—</p>
              );
            })()}
            <p className="text-sm font-bold text-gray-700">Resume Score</p>
          </div>

          <div className="p-6 rounded-[2rem] bg-gradient-to-br from-blue-200 to-cyan-200 shadow-[0_10px_0_0_rgba(37,99,235,0.3)] border-2 border-blue-300 text-center">
            <p className="text-4xl font-black text-blue-600 mb-2">{versions.length}</p>
            <p className="text-sm font-bold text-gray-700">Resume Versions</p>
          </div>

          <div className="p-6 rounded-[2rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_10px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300 text-center">
            <p className="text-4xl font-black text-purple-600 mb-2">Good</p>
            <p className="text-sm font-bold text-gray-700">ATS Compatible</p>
          </div>
        </div>

        {/* Master Resumes Section */}
        <div className="mb-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-3xl font-black text-gray-800">📋 Master Resumes</h2>
            <div className="flex gap-3">
              {onImportMaster && (
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-green-500 to-emerald-500 shadow-[0_6px_0_0_rgba(22,163,74,0.6)] border-2 border-green-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(22,163,74,0.6)] font-black text-white transition-all duration-200"
                  aria-label="Import existing resume"
                >
                  📥 Import Resume
                </button>
              )}
              {onCreateMaster && (
                <button
                  onClick={onCreateMaster}
                  className="px-8 py-3 rounded-[1.5rem] bg-gradient-to-br from-blue-500 to-cyan-500 shadow-[0_6px_0_0_rgba(37,99,235,0.6)] border-2 border-blue-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(37,99,235,0.6)] font-black text-white transition-all duration-200"
                  aria-label="Create new master resume"
                >
                  + Create Master
                </button>
              )}
            </div>
          </div>

          {masterResumes.length === 0 ? (
            <div className="text-center py-12 px-6 rounded-[2rem] bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-slate-300">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-[1.5rem] border-2 border-blue-400 mb-4">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2">No Master Resumes</h3>
              <p className="text-gray-600 font-medium mb-4">Import an existing resume or create a new one from scratch.</p>
              <div className="flex gap-3 justify-center">
                {onImportMaster && (
                  <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="px-6 py-2 rounded-[1.5rem] bg-gradient-to-br from-green-500 to-emerald-500 shadow-[0_6px_0_0_rgba(22,163,74,0.6)] border-2 border-green-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(22,163,74,0.6)] font-black text-white transition-all duration-200"
                    aria-label="Import existing resume"
                  >
                    📥 Import Resume
                  </button>
                )}
                {onCreateMaster && (
                  <button
                    onClick={onCreateMaster}
                    className="px-6 py-2 rounded-[1.5rem] bg-gradient-to-br from-blue-500 to-cyan-500 shadow-[0_6px_0_0_rgba(37,99,235,0.6)] border-2 border-blue-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(37,99,235,0.6)] font-black text-white transition-all duration-200"
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
                />
              ))}
            </div>
          )}
        </div>

        {/* Job-Specific Resumes Section */}
        <div className="mb-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-3xl font-black text-gray-800">📄 Job-Specific Resumes</h2>
            {masterResumes.length > 0 && (
              <button
                onClick={() => setIsCloneModalOpen(true)}
                className="px-8 py-3 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_6px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200"
              >
                + Create from Master
              </button>
            )}
          </div>

          {jobSpecificResumes.length === 0 ? (
            <div className="text-center py-12 px-6 rounded-[2rem] bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-slate-300">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-200 to-pink-200 rounded-[1.5rem] border-2 border-purple-400 mb-4">
                <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2">No Job-Specific Resumes</h3>
              <p className="text-gray-600 font-medium mb-4">Clone a master resume to create a tailored version for specific jobs.</p>
              {masterResumes.length > 0 && (
                <button
                  onClick={() => setIsCloneModalOpen(true)}
                  className="px-6 py-2 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_6px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200"
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
            onClose={() => setIsImportModalOpen(false)}
            onImport={onImportMaster}
          />
        )}

        {/* Help Section */}
        <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-slate-700 to-slate-900 shadow-[0_20px_0_0_rgba(15,23,42,0.4)] border-2 border-slate-800">
          <h3 className="text-2xl font-black text-white mb-4">🎯 Getting Started</h3>
          <p className="text-gray-300 font-medium text-lg mb-6">
            Your Master Resumes contain all your experiences and bullets. Create job-specific
            versions by cloning a master and tailoring it for each application.
          </p>
          <div className="flex gap-4">
            <button className="px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_6px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200">
              📺 Watch Tutorial
            </button>
            <button className="px-6 py-3 rounded-[1.5rem] bg-white/10 border-2 border-slate-600 hover:bg-white/20 font-bold text-white transition-all duration-200">
              📚 View Documentation
            </button>
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
};

function ResumeCard({ version, onEdit, isMaster, analysisScore, onCloneToJobSpecific, onCloneToMaster, onDelete, jobApplication }: ResumeCardProps) {
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
    <div className="rounded-[2rem] bg-gradient-to-br from-slate-100 to-slate-200 shadow-[0_10px_0_0_rgba(51,65,85,0.3)] border-2 border-slate-300 hover:translate-y-1 hover:shadow-[0_6px_0_0_rgba(51,65,85,0.3)] transition-all duration-200 overflow-visible relative flex flex-col h-full">
      {/* Card Header */}
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-black text-gray-800">
                {version.name}
              </h3>
              {isMaster && (
                <span className="px-3 py-1 text-xs font-bold bg-gradient-to-br from-blue-400 to-cyan-400 text-white rounded-[0.75rem] border-2 border-blue-500">
                  MASTER
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 font-medium">
              Modified: {formatDate(version.updated_at)}
            </p>

            {/* Job Application Link */}
            {jobApplication && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <div className="px-3 py-1 bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-300 rounded-[0.75rem]">
                  <span className="font-bold text-purple-700">
                    {jobApplication.title}
                  </span>
                  <span className="text-purple-600"> at </span>
                  <span className="font-bold text-purple-700">
                    {jobApplication.company?.name || 'Unknown'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Score */}
        <div className="mt-auto">
          <div className="bg-white rounded-[1rem] p-4 border-2 border-slate-300">
            <p className="text-xs text-gray-600 font-bold mb-1">Resume Score</p>
            {analysisScore !== undefined ? (
              <p className="text-3xl font-black text-gray-800">
                {analysisScore}
                <span className="text-lg text-gray-500 font-semibold">/100</span>
              </p>
            ) : (
              <p className="text-lg font-medium text-gray-400 italic">
                No analysis yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Card Actions */}
      <div className="p-4 bg-white/60 flex gap-2 rounded-b-[2rem]">
        <button
          onClick={() => onEdit(version.id)}
          className="flex-1 px-4 py-2 rounded-[1rem] bg-gradient-to-br from-blue-500 to-cyan-500 shadow-[0_4px_0_0_rgba(37,99,235,0.6)] border-2 border-blue-600 hover:translate-y-0.5 hover:shadow-[0_2px_0_0_rgba(37,99,235,0.6)] font-black text-white transition-all duration-200 text-sm"
        >
          Edit →
        </button>

        {/* Master Resume Menu */}
        {isMaster && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="px-4 py-2 rounded-[1rem] bg-white hover:bg-gray-50 text-gray-700 font-bold border-2 border-slate-300 shadow-[0_4px_0_0_rgba(51,65,85,0.3)] hover:translate-y-0.5 hover:shadow-[0_2px_0_0_rgba(51,65,85,0.3)] transition-all duration-200 text-sm flex items-center"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-64 bg-white rounded-xl shadow-2xl border-2 border-slate-300 overflow-hidden z-10">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    // TODO: Implement PDF download
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 font-medium text-gray-700 border-b border-gray-200 flex items-center gap-2"
                >
                  📄 Download PDF
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    // TODO: Implement DOCX download
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 font-medium text-gray-700 border-b border-gray-200 flex items-center gap-2"
                >
                  📝 Download DOCX
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onCloneToMaster?.();
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 font-medium text-gray-700 border-b border-gray-200 flex items-center gap-2"
                >
                  📋 Clone to New Master Resume
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onCloneToJobSpecific?.();
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 font-medium text-gray-700 border-b border-gray-200 flex items-center gap-2"
                >
                  📄 Clone to New Job-Specific Resume
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onDelete?.(version.id, version.name);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-red-50 font-medium text-red-600 flex items-center gap-2"
                >
                  🗑️ Delete Master Resume
                </button>
              </div>
            )}
          </div>
        )}

        {/* Job-Specific PDF Button */}
        {!isMaster && (
          <button className="px-4 py-2 rounded-[1rem] bg-white hover:bg-gray-50 text-gray-700 font-bold border-2 border-slate-300 shadow-[0_4px_0_0_rgba(51,65,85,0.3)] hover:translate-y-0.5 hover:shadow-[0_2px_0_0_rgba(51,65,85,0.3)] transition-all duration-200 text-sm">
            PDF
          </button>
        )}
      </div>
    </div>
  );
}

