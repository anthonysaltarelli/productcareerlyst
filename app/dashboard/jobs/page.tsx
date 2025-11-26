'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useJobApplications } from '@/lib/hooks/useJobApplications';
import { useInterviews } from '@/lib/hooks/useInterviews';
import { ApplicationStatus, JobApplicationWithCompany } from '@/lib/types/jobs';
import { AddJobModal } from '@/app/components/jobs/AddJobModal';
import { EditJobModal } from '@/app/components/jobs/EditJobModal';
import { MobileDashboardHeader } from '@/app/components/MobileDashboardHeader';
import { JobsPageMobileGate } from '@/app/components/JobsPageMobileGate';
import { KanbanBoard } from '@/app/components/jobs/KanbanBoard';

// Status config for list view only (kanban uses its own in KanbanColumn)
const statusConfig: Record<ApplicationStatus, { label: string; color: string; bgColor: string }> = {
  wishlist: { label: 'Wishlist', color: 'text-gray-700', bgColor: 'bg-gray-50' },
  applied: { label: 'Applied', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  screening: { label: 'Screening', color: 'text-yellow-700', bgColor: 'bg-yellow-50' },
  interviewing: { label: 'Interviewing', color: 'text-purple-700', bgColor: 'bg-purple-50' },
  offer: { label: 'Offer', color: 'text-green-700', bgColor: 'bg-green-50' },
  rejected: { label: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-50' },
  accepted: { label: 'Accepted', color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  withdrawn: { label: 'Withdrawn', color: 'text-gray-700', bgColor: 'bg-gray-50' },
};

const priorityConfig = {
  high: { label: 'High', color: 'text-red-600', bgColor: 'bg-red-100' },
  medium: { label: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  low: { label: 'Low', color: 'text-gray-600', bgColor: 'bg-gray-100' },
};

export default function JobsPage() {
  const { applications, loading, error, refetch } = useJobApplications();
  const { interviews } = useInterviews();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingApplication, setEditingApplication] = useState<JobApplicationWithCompany | null>(null);

  // Column order is now managed by KanbanBoard component

  // Calculate metrics
  const totalApplications = applications.length;
  const activeApplications = applications.filter(app => 
    !['rejected', 'withdrawn', 'accepted'].includes(app.status)
  ).length;
  const interviewsScheduled = interviews.filter(int => int.status === 'scheduled').length;
  const offersReceived = applications.filter(app => app.status === 'offer').length;
  const responseRate = applications.filter(app => app.applied_date).length > 0
    ? Math.round((applications.filter(app => 
        app.applied_date && !['applied', 'wishlist'].includes(app.status)
      ).length / applications.filter(app => app.applied_date).length) * 100)
    : 0;

  const handleFormatSalary = (job: JobApplicationWithCompany): string => {
    if (!job.salary_min || !job.salary_max) return 'Not specified';
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: job.salary_currency || 'USD',
      minimumFractionDigits: 0,
    });
    return `${formatter.format(job.salary_min)} - ${formatter.format(job.salary_max)}`;
  };

  const handleFormatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleCalculateDaysAgo = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  if (loading) {
    return (
      <JobsPageMobileGate>
        <MobileDashboardHeader title="Job Applications" />
        <div className="min-h-screen p-6 pt-20 md:p-12 md:pt-12 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-semibold">Loading applications...</p>
          </div>
        </div>
      </JobsPageMobileGate>
    );
  }

  if (error) {
    return (
      <JobsPageMobileGate>
        <MobileDashboardHeader title="Job Applications" />
        <div className="min-h-screen p-6 pt-20 md:p-12 md:pt-12 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 font-bold mb-4">Error loading applications</p>
            <p className="text-gray-700 mb-4">{error}</p>
            <button
              onClick={() => refetch()}
              className="px-6 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </JobsPageMobileGate>
    );
  }

  return (
    <JobsPageMobileGate>
    <>
      <MobileDashboardHeader title="Job Applications" />
      <div className="min-h-screen p-6 pt-20 md:p-12 md:pt-12">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_12px_0_0_rgba(147,51,234,0.3)] md:shadow-[0_20px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent mb-2">
                💼 Job Applications
              </h1>
              <p className="text-base md:text-xl text-gray-700 font-semibold">Track your path to your dream PM role</p>
            </div>
            <div className="flex items-center gap-3">
              {/* View Toggle - Hidden on mobile, list view is forced */}
              <div className="hidden md:flex items-center gap-2 bg-white/60 rounded-[1.5rem] p-1.5 border-2 border-purple-300">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-5 py-2.5 rounded-[1rem] text-sm font-black transition-all ${
                    viewMode === 'kanban'
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-[0_4px_0_0_rgba(147,51,234,0.4)]'
                      : 'text-gray-700 hover:bg-white/50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                    Board
                  </span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-5 py-2.5 rounded-[1rem] text-sm font-black transition-all ${
                    viewMode === 'list'
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-[0_4px_0_0_rgba(147,51,234,0.4)]'
                      : 'text-gray-700 hover:bg-white/50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    List
                  </span>
                </button>
              </div>
              
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 md:px-8 rounded-[1.5rem] bg-gradient-to-br from-green-500 to-emerald-500 shadow-[0_6px_0_0_rgba(22,163,74,0.6)] border-2 border-green-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(22,163,74,0.6)] font-black text-white transition-all duration-200 flex items-center gap-2 text-sm md:text-base"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Add Job</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>

          {/* Metrics - 2 cols on mobile, 5 cols on desktop */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mt-6 md:mt-8">
            <div className="p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-br from-blue-200 to-cyan-200 shadow-[0_6px_0_0_rgba(37,99,235,0.3)] md:shadow-[0_10px_0_0_rgba(37,99,235,0.3)] border-2 border-blue-300 text-center">
              <p className="text-2xl md:text-4xl font-black text-blue-600 mb-1 md:mb-2">{totalApplications}</p>
              <p className="text-xs md:text-sm font-bold text-gray-700">Total</p>
            </div>
            <div className="p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_6px_0_0_rgba(147,51,234,0.3)] md:shadow-[0_10px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300 text-center">
              <p className="text-2xl md:text-4xl font-black text-purple-600 mb-1 md:mb-2">{activeApplications}</p>
              <p className="text-xs md:text-sm font-bold text-gray-700">Active</p>
            </div>
            <div className="p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-br from-orange-200 to-yellow-200 shadow-[0_6px_0_0_rgba(234,88,12,0.3)] md:shadow-[0_10px_0_0_rgba(234,88,12,0.3)] border-2 border-orange-300 text-center">
              <p className="text-2xl md:text-4xl font-black text-orange-600 mb-1 md:mb-2">{interviewsScheduled}</p>
              <p className="text-xs md:text-sm font-bold text-gray-700">Interviews</p>
            </div>
            <div className="p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-br from-green-200 to-emerald-200 shadow-[0_6px_0_0_rgba(22,163,74,0.3)] md:shadow-[0_10px_0_0_rgba(22,163,74,0.3)] border-2 border-green-300 text-center">
              <p className="text-2xl md:text-4xl font-black text-green-600 mb-1 md:mb-2">{offersReceived}</p>
              <p className="text-xs md:text-sm font-bold text-gray-700">Offers 🎉</p>
            </div>
            <div className="col-span-2 md:col-span-1 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-br from-indigo-200 to-purple-200 shadow-[0_6px_0_0_rgba(99,102,241,0.3)] md:shadow-[0_10px_0_0_rgba(99,102,241,0.3)] border-2 border-indigo-300 text-center">
              <p className="text-2xl md:text-4xl font-black text-indigo-600 mb-1 md:mb-2">{responseRate}%</p>
              <p className="text-xs md:text-sm font-bold text-gray-700">Response Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board - Hidden on mobile, with drag and drop */}
      {viewMode === 'kanban' && (
        <KanbanBoard
          applications={applications}
          onEdit={setEditingApplication}
          onRefetch={refetch}
        />
      )}

      {/* List View - Always shown on mobile, or when list view selected on desktop */}
      {(viewMode === 'list' || true) && (
        <div className={viewMode === 'kanban' ? 'md:hidden' : ''}>
          <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border-2 border-gray-300 overflow-hidden shadow-[0_8px_0_0_rgba(0,0,0,0.1)] md:shadow-[0_12px_0_0_rgba(0,0,0,0.1)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gradient-to-br from-purple-200 to-pink-200 border-b-2 border-purple-300">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Company & Role</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Salary</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Applied</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-200">
                {applications.map((job) => (
                  <tr key={job.id} className="hover:bg-purple-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/dashboard/jobs/${job.id}`} className="block cursor-pointer">
                        <div className="font-bold text-gray-900 hover:text-purple-600">{job.title}</div>
                        <div className="text-sm text-gray-700 font-semibold">{job.company?.name || 'Unknown Company'}</div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                      <div>{job.location || 'Not specified'}</div>
                      {job.work_mode && <div className="text-xs text-gray-600 capitalize font-semibold">{job.work_mode}</div>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800 font-bold">
                      {handleFormatSalary(job)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-[0.75rem] text-xs font-black border-2 ${statusConfig[job.status].bgColor} ${statusConfig[job.status].color} ${status === 'wishlist' || status === 'withdrawn' ? 'border-gray-400' : status === 'applied' ? 'border-blue-400' : status === 'screening' ? 'border-yellow-400' : status === 'interviewing' ? 'border-purple-400' : status === 'offer' || status === 'accepted' ? 'border-green-400' : 'border-red-400'}`}>
                        {statusConfig[job.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-semibold">
                      {job.applied_date ? handleFormatDate(job.applied_date) : 'Not applied'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-[0.75rem] text-xs font-black border-2 ${priorityConfig[job.priority].bgColor} ${priorityConfig[job.priority].color} ${job.priority === 'high' ? 'border-red-400' : job.priority === 'medium' ? 'border-yellow-400' : 'border-gray-400'}`}>
                        {priorityConfig[job.priority].label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setEditingApplication(job)}
                        className="px-4 py-2 rounded-[1rem] bg-purple-100 text-purple-700 font-bold hover:bg-purple-200 transition-colors text-sm"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddJobModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          refetch();
          setShowAddModal(false);
        }}
      />

      <EditJobModal
        isOpen={!!editingApplication}
        application={editingApplication}
        onClose={() => setEditingApplication(null)}
        onSuccess={() => {
          refetch();
          setEditingApplication(null);
        }}
      />
      </div>
    </>
    </JobsPageMobileGate>
  );
}

