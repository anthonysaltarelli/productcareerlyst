'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Briefcase, Building2, AlertCircle } from 'lucide-react';

interface JobWithCompany {
  id: string;
  title: string;
  description: string | null;
  company: {
    id: string;
    name: string;
  } | null;
}

interface JobSelectorProps {
  onSelect: (jobId: string) => void;
  emptyState: React.ReactNode;
}

export function JobSelector({ onSelect, emptyState }: JobSelectorProps) {
  const [jobs, setJobs] = useState<JobWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobWithCompany | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('/api/jobs/applications');
        if (!response.ok) {
          throw new Error('Failed to fetch jobs');
        }
        const data = await response.json();
        // Filter to only jobs with descriptions
        const jobsWithDescriptions = (data.applications || []).filter(
          (job: JobWithCompany) => job.description && job.description.trim().length > 0
        );
        setJobs(jobsWithDescriptions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const handleSelect = (job: JobWithCompany) => {
    setSelectedJob(job);
    setIsOpen(false);
    onSelect(job.id);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-purple-600"></div>
        <span className="text-sm font-medium">Loading jobs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-500">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm font-medium">{error}</span>
      </div>
    );
  }

  if (jobs.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-200 hover:border-purple-300 focus:border-purple-400 focus:ring-0 font-medium text-left flex items-center justify-between transition-colors"
      >
        {selectedJob ? (
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-purple-100 flex-shrink-0">
              <Briefcase className="w-4 h-4 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-800 truncate">{selectedJob.title}</p>
              <p className="text-xs text-gray-500 truncate">
                {selectedJob.company?.name || 'Unknown Company'}
              </p>
            </div>
          </div>
        ) : (
          <span className="text-gray-500">Select a job to practice for...</span>
        )}
        <ChevronDown
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl border-2 border-gray-200 shadow-lg max-h-64 overflow-y-auto">
          {jobs.map((job) => (
            <button
              key={job.id}
              onClick={() => handleSelect(job)}
              className="w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors first:rounded-t-xl last:rounded-b-xl flex items-center gap-3"
            >
              <div className="p-2 rounded-lg bg-gray-100 flex-shrink-0">
                <Building2 className="w-4 h-4 text-gray-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-800 truncate">{job.title}</p>
                <p className="text-xs text-gray-500 truncate">
                  {job.company?.name || 'Unknown Company'}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
