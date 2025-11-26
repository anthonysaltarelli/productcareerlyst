'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Download, Sparkles, ExternalLink, Loader2, Plus } from 'lucide-react';
import BulletComparisonModal from '@/app/components/resume/BulletComparisonModal';

type BulletChange = {
  bulletId: string;
  originalContent: string;
  newContent: string;
  wasOptimized: boolean;
  wasReordered: boolean;
  originalOrder: number;
  newOrder: number;
  changeReason?: string | null;
};

type ExperienceChange = {
  experienceId: string;
  experienceTitle: string;
  experienceCompany: string;
  bullets: BulletChange[];
};

type CustomizationSummary = {
  overallDescription?: string;
  keyChanges?: string[];
  keywordsInjected?: string[];
  bulletsReordered: number;
  bulletsOptimized: number;
  skillsAdded: number;
  originalSummary?: string | null;
  optimizedSummary?: string | null;
  summaryChangeReason?: string | null;
  bulletChanges?: ExperienceChange[];
  suggestedSkills?: Array<{
    category: string;
    skillName: string;
    reason: string;
  }>;
};

type ResumeVersion = {
  id: string;
  name: string;
  slug: string;
  is_master: boolean;
  application_id: string | null;
  customization_summary: CustomizationSummary | null;
  created_at: string;
  updated_at: string;
};

type Props = {
  applicationId: string;
  jobTitle: string;
  companyName: string;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
  });
};

export default function DocumentsTab({ applicationId, jobTitle, companyName }: Props) {
  const [resumes, setResumes] = useState<ResumeVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedSummary, setSelectedSummary] = useState<ResumeVersion | null>(null);

  useEffect(() => {
    fetchResumes();
  }, [applicationId]);

  const fetchResumes = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/resume/versions?applicationId=${applicationId}`);
      if (response.ok) {
        const data = await response.json();
        setResumes(data.versions || []);
      } else {
        setError('Failed to load resumes');
      }
    } catch (err) {
      console.error('Error fetching resumes:', err);
      setError('Failed to load resumes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async (resume: ResumeVersion) => {
    setDownloadingId(resume.id);
    
    try {
      // First fetch the resume data
      const dataResponse = await fetch(`/api/resume/versions/${resume.id}/data`);
      if (!dataResponse.ok) {
        throw new Error('Failed to fetch resume data');
      }
      const resumeData = await dataResponse.json();

      // Then generate PDF
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
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Format filename
      const now = new Date();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const monthYear = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
      link.download = `${resumeData.contactInfo?.name || 'Resume'} - ${monthYear}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-[2rem] bg-red-50 border-2 border-red-200 text-center">
        <p className="text-red-700 font-semibold">{error}</p>
        <button
          onClick={fetchResumes}
          className="mt-4 px-6 py-2 rounded-[1rem] bg-red-100 text-red-700 font-bold hover:bg-red-200 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent">
            Documents 📄
          </h2>
          <p className="text-gray-700 font-semibold mt-2">
            Resumes and other documents for this application
          </p>
        </div>
        <Link
          href="/dashboard/resume"
          className="px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_6px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Resume
        </Link>
      </div>

      {/* Resumes Section */}
      <div className="mb-8">
        <h3 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-600" />
          Resumes ({resumes.length})
        </h3>

        {resumes.length === 0 ? (
          <div className="p-12 rounded-[2rem] bg-gradient-to-br from-gray-100 to-gray-200 shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300 text-center">
            <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center mx-auto mb-4 border-2 border-purple-300">
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
            <h4 className="text-xl font-black text-gray-800 mb-2">No Resumes Yet</h4>
            <p className="text-gray-600 font-medium mb-6">
              Create a customized resume tailored for this job application.
            </p>
            <Link
              href="/dashboard/resume"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_6px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              Create Resume
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className="p-6 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300 hover:border-purple-400 hover:shadow-[0_10px_0_0_rgba(147,51,234,0.3)] transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-black text-gray-900">{resume.name}</h4>
                      {resume.customization_summary && (
                        <button
                          onClick={() => setSelectedSummary(resume)}
                          className="px-3 py-1 rounded-[0.75rem] bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 font-bold text-xs border-2 border-purple-300 flex items-center gap-1.5 hover:from-purple-200 hover:to-pink-200 transition-colors"
                          aria-label="View AI customization summary"
                        >
                          <Sparkles className="w-3 h-3" />
                          View AI Customizations
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 font-medium">
                      <span>Last modified: {formatDate(resume.updated_at)}</span>
                      <span className="text-gray-300">•</span>
                      <span>Created: {formatDate(resume.created_at)}</span>
                    </div>

                    {/* Customization Summary Preview */}
                    {resume.customization_summary && (
                      <div className="mt-3 p-3 rounded-[1rem] bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
                        <p className="text-sm text-gray-700 font-medium line-clamp-2">
                          {resume.customization_summary.overallDescription}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs font-bold">
                          <span className="text-blue-600">
                            {resume.customization_summary.bulletsReordered} reordered
                          </span>
                          <span className="text-purple-600">
                            {resume.customization_summary.bulletsOptimized} optimized
                          </span>
                          <span className="text-orange-600">
                            {resume.customization_summary.skillsAdded} skills added
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      href={`/dashboard/resume/${resume.id}`}
                      className="px-4 py-2.5 rounded-[1rem] bg-gradient-to-br from-blue-500 to-cyan-500 shadow-[0_4px_0_0_rgba(37,99,235,0.6)] border-2 border-blue-600 hover:translate-y-0.5 hover:shadow-[0_2px_0_0_rgba(37,99,235,0.6)] font-black text-white text-sm transition-all duration-200 flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDownloadPDF(resume)}
                      disabled={downloadingId === resume.id}
                      className="px-4 py-2.5 rounded-[1rem] bg-white shadow-[0_4px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300 hover:translate-y-0.5 hover:shadow-[0_2px_0_0_rgba(0,0,0,0.1)] font-black text-gray-700 text-sm transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Download PDF"
                    >
                      {downloadingId === resume.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      PDF
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Future: Cover Letters Section */}
      <div className="p-8 rounded-[2rem] bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-slate-300">
        <h3 className="text-lg font-black text-gray-700 mb-2">Cover Letters</h3>
        <p className="text-gray-500 font-medium">
          Cover letter generation coming soon! Create tailored cover letters for each application.
        </p>
      </div>

      {/* Bullet Comparison Modal */}
      <BulletComparisonModal
        isOpen={!!selectedSummary}
        onClose={() => setSelectedSummary(null)}
        customizationSummary={selectedSummary?.customization_summary || null}
      />
    </div>
  );
}

