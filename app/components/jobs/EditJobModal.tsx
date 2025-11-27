'use client';

import { useState, useEffect } from 'react';
import { updateJobApplication, deleteJobApplication } from '@/lib/hooks/useJobApplications';
import { JobApplicationWithCompany, ApplicationStatus, PriorityLevel, WorkMode } from '@/lib/types/jobs';

interface EditJobModalProps {
  isOpen: boolean;
  application: JobApplicationWithCompany | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditJobModal = ({ isOpen, application, onClose, onSuccess }: EditJobModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    location: '',
    work_mode: 'remote' as WorkMode,
    salary_min: '',
    salary_max: '',
    salary_currency: 'USD',
    job_url: '',
    description: '',
    status: 'wishlist' as ApplicationStatus,
    priority: 'medium' as PriorityLevel,
    applied_date: '',
    deadline: '',
    notes: '',
  });

  useEffect(() => {
    if (application) {
      setFormData({
        title: application.title,
        location: application.location || '',
        work_mode: application.work_mode || 'remote',
        salary_min: application.salary_min?.toString() || '',
        salary_max: application.salary_max?.toString() || '',
        salary_currency: application.salary_currency || 'USD',
        job_url: application.job_url || '',
        description: application.description || '',
        status: application.status,
        priority: application.priority,
        applied_date: application.applied_date || '',
        deadline: application.deadline || '',
        notes: application.notes || '',
      });
    }
  }, [application]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!application) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await updateJobApplication(application.id, {
        title: formData.title,
        location: formData.location || undefined,
        work_mode: formData.work_mode || undefined,
        salary_min: formData.salary_min ? parseInt(formData.salary_min) : undefined,
        salary_max: formData.salary_max ? parseInt(formData.salary_max) : undefined,
        salary_currency: formData.salary_currency || 'USD',
        job_url: formData.job_url || undefined,
        description: formData.description || undefined,
        status: formData.status,
        priority: formData.priority,
        applied_date: formData.applied_date || undefined,
        deadline: formData.deadline || undefined,
        notes: formData.notes || undefined,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update job application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!application) return;

    setIsDeleting(true);
    setError(null);

    try {
      await deleteJobApplication(application.id);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete job application');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!isOpen || !application) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2rem] max-w-3xl w-full max-h-[90vh] overflow-y-auto p-10 shadow-[0_20px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent">
            Edit Job Application ✏️
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-[1rem] text-red-700 font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company (read-only) */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Company</label>
            <div className="px-5 py-3.5 bg-gray-100 border-2 border-gray-300 rounded-[1rem] font-bold text-gray-700">
              {application.company?.name || 'Unknown Company'}
            </div>
          </div>

          {/* Job Details */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Job Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Senior Product Manager"
              className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="San Francisco, CA"
                className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Work Mode</label>
              <select
                value={formData.work_mode}
                onChange={(e) => setFormData({ ...formData, work_mode: e.target.value as WorkMode })}
                className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-bold"
              >
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">Onsite</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Job URL</label>
            <input
              type="url"
              value={formData.job_url}
              onChange={(e) => setFormData({ ...formData, job_url: e.target.value })}
              placeholder="https://company.com/jobs/123"
              className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Min Salary</label>
              <input
                type="number"
                value={formData.salary_min}
                onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                placeholder="120000"
                className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Max Salary</label>
              <input
                type="number"
                value={formData.salary_max}
                onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                placeholder="160000"
                className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Currency</label>
              <select
                value={formData.salary_currency}
                onChange={(e) => setFormData({ ...formData, salary_currency: e.target.value })}
                className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-bold"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Job description..."
              className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ApplicationStatus })}
                className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-bold"
              >
                <option value="wishlist">Wishlist</option>
                <option value="applied">Applied</option>
                <option value="interviewing">Interviewing</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
                <option value="accepted">Accepted</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as PriorityLevel })}
                className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-bold"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Applied Date</label>
              <input
                type="date"
                value={formData.applied_date}
                onChange={(e) => setFormData({ ...formData, applied_date: e.target.value })}
                className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Deadline</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Any notes about this application..."
              className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium resize-none"
            />
          </div>

          <div className="flex items-center gap-4 mt-10">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSubmitting || isDeleting}
              className="px-6 py-4 rounded-[1.5rem] bg-white border-2 border-red-300 text-red-700 font-black hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isDeleting}
              className="px-8 py-4 rounded-[1.5rem] bg-white border-2 border-gray-300 text-gray-700 font-black hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isDeleting || !formData.title}
              className="px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_6px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-[2rem] max-w-md w-full p-8 shadow-[0_20px_0_0_rgba(239,68,68,0.3)] border-2 border-red-300">
              <h3 className="text-2xl font-black text-red-700 mb-4">Delete Application?</h3>
              <p className="text-gray-700 font-semibold mb-6">
                Are you sure you want to delete this job application? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 rounded-[1rem] bg-white border-2 border-gray-300 text-gray-700 font-black hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 rounded-[1rem] bg-gradient-to-br from-red-500 to-red-600 shadow-[0_4px_0_0_rgba(239,68,68,0.6)] border-2 border-red-700 hover:translate-y-1 hover:shadow-[0_2px_0_0_rgba(239,68,68,0.6)] font-black text-white transition-all disabled:opacity-50 disabled:translate-y-0"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

