'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ResumeVersion } from '@/lib/hooks/useResumeData';

type JobApplication = {
  id: string;
  title: string;
  company: {
    name: string;
  };
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
  const [selectedMasterId, setSelectedMasterId] = useState('');
  const [resumeName, setResumeName] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);

  // Auto-select master if there's only one
  useEffect(() => {
    if (isOpen && masterResumes.length === 1) {
      setSelectedMasterId(masterResumes[0].id);
    } else if (isOpen && masterResumes.length === 0) {
      setSelectedMasterId('');
    }
  }, [isOpen, masterResumes]);

  // Fetch job applications when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchJobApplications();
    }
  }, [isOpen]);

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

    if (!selectedMasterId || !resumeName.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      await onClone(
        selectedMasterId,
        resumeName.trim(),
        selectedJobId || undefined
      );

      // Reset form and close
      setSelectedMasterId('');
      setResumeName('');
      setSelectedJobId('');
      onClose();
    } catch (error) {
      console.error('Error cloning resume:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setSelectedMasterId('');
      setResumeName('');
      setSelectedJobId('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Create Job-Specific Resume
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Select Master Resume - Only show if multiple masters */}
          {masterResumes.length > 1 && (
            <div>
              <label htmlFor="master-resume" className="block text-sm font-medium text-gray-700 mb-2">
                Select Master Resume
              </label>
              <select
                id="master-resume"
                value={selectedMasterId}
                onChange={(e) => setSelectedMasterId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cloning From
              </label>
              <div className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs font-bold bg-gradient-to-br from-blue-400 to-cyan-400 text-white rounded-md">
                    MASTER
                  </span>
                  <span className="font-medium text-gray-800">
                    {masterResumes[0].name}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Resume Name */}
          <div>
            <label htmlFor="resume-name" className="block text-sm font-medium text-gray-700 mb-2">
              Resume Name
            </label>
            <input
              id="resume-name"
              type="text"
              value={resumeName}
              onChange={(e) => setResumeName(e.target.value)}
              placeholder="e.g., Google PM Resume"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
              disabled={isLoading}
            />
          </div>

          {/* Link to Job Application (Optional) */}
          <div>
            <label htmlFor="job-application" className="block text-sm font-medium text-gray-700 mb-2">
              Link to Job Application <span className="text-gray-400">(Optional)</span>
            </label>
            {isLoadingJobs ? (
              <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                Loading job applications...
              </div>
            ) : jobApplications.length === 0 ? (
              <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                No job applications found
              </div>
            ) : (
              <select
                id="job-application"
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedMasterId || !resumeName.trim()}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create Resume'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
