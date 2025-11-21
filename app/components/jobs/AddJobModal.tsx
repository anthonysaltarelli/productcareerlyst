'use client';

import { useState, useEffect } from 'react';
import { useCompanies, createCompany } from '@/lib/hooks/useCompanies';
import { createJobApplication } from '@/lib/hooks/useJobApplications';
import { Company, ApplicationStatus, PriorityLevel, WorkMode } from '@/lib/types/jobs';

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddJobModal = ({ isOpen, onClose, onSuccess }: AddJobModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When searching, include all companies (approved and unapproved) to avoid suggesting duplicates
  // When not searching, only show approved companies
  const { companies, loading: loadingCompanies } = useCompanies(searchTerm, searchTerm ? undefined : true);

  // Form state
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

  // New company form state
  const [newCompanyData, setNewCompanyData] = useState({
    name: '',
    website: '',
    linkedin_url: '',
    industry: 'technology' as const,
    size: '51-200' as const,
    headquarters_city: '',
    headquarters_state: '',
    headquarters_country: 'USA',
    description: '',
  });

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        title: '',
        location: '',
        work_mode: 'remote',
        salary_min: '',
        salary_max: '',
        salary_currency: 'USD',
        job_url: '',
        description: '',
        status: 'wishlist',
        priority: 'medium',
        applied_date: '',
        deadline: '',
        notes: '',
      });
      setSelectedCompany(null);
      setSearchTerm('');
      setShowCompanyForm(false);
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCompany) {
      setError('Please select or create a company');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createJobApplication({
        company_id: selectedCompany.id,
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
      setError(err instanceof Error ? err.message : 'Failed to create job application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCompany = async () => {
    if (!newCompanyData.name) {
      setError('Company name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createCompany({
        name: newCompanyData.name,
        website: newCompanyData.website || undefined,
        linkedin_url: newCompanyData.linkedin_url || undefined,
        industry: newCompanyData.industry,
        size: newCompanyData.size,
        headquarters_city: newCompanyData.headquarters_city || undefined,
        headquarters_state: newCompanyData.headquarters_state || undefined,
        headquarters_country: newCompanyData.headquarters_country || undefined,
        description: newCompanyData.description || undefined,
      });

      setSelectedCompany(result.company);
      setShowCompanyForm(false);
      setSearchTerm('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create company');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2rem] max-w-3xl w-full max-h-[90vh] overflow-y-auto p-10 shadow-[0_20px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent">
            Add New Job 🎯
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
          {/* Company Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Company * {selectedCompany && '✓'}
            </label>
            
            {selectedCompany ? (
              <div className="flex items-center gap-3 p-4 bg-green-50 border-2 border-green-300 rounded-[1rem]">
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{selectedCompany.name}</p>
                  {selectedCompany.website && (
                    <p className="text-sm text-gray-600">{selectedCompany.website}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCompany(null)}
                  className="text-red-600 hover:text-red-700 font-bold text-sm"
                >
                  Change
                </button>
              </div>
            ) : showCompanyForm ? (
              <div className="space-y-4 p-6 bg-purple-50 border-2 border-purple-300 rounded-[1rem]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-gray-900">Create New Company</h3>
                  <button
                    type="button"
                    onClick={() => setShowCompanyForm(false)}
                    className="text-gray-600 hover:text-gray-700 text-sm font-bold"
                  >
                    Cancel
                  </button>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    value={newCompanyData.name}
                    onChange={(e) => setNewCompanyData({ ...newCompanyData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
                    placeholder="Google"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Website</label>
                    <input
                      type="url"
                      value={newCompanyData.website}
                      onChange={(e) => setNewCompanyData({ ...newCompanyData, website: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
                      placeholder="https://google.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">LinkedIn</label>
                    <input
                      type="url"
                      value={newCompanyData.linkedin_url}
                      onChange={(e) => setNewCompanyData({ ...newCompanyData, linkedin_url: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
                      placeholder="https://linkedin.com/company/..."
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCreateCompany}
                  disabled={isSubmitting || !newCompanyData.name}
                  className="w-full px-6 py-3 rounded-[1rem] bg-gradient-to-br from-purple-500 to-pink-500 text-white font-black hover:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating...' : 'Create Company'}
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search for a company..."
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
                />
                
                {searchTerm && (
                  <div className="mt-3 max-h-48 overflow-y-auto border-2 border-gray-300 rounded-[1rem] bg-white">
                    {loadingCompanies ? (
                      <div className="p-4 text-center text-gray-600 font-semibold">Searching...</div>
                    ) : companies.length > 0 ? (
                      companies.map((company) => (
                        <button
                          key={company.id}
                          type="button"
                          onClick={() => setSelectedCompany(company)}
                          className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors border-b border-gray-200 last:border-b-0"
                        >
                          <p className="font-bold text-gray-900">{company.name}</p>
                          {company.website && (
                            <p className="text-sm text-gray-600">{company.website}</p>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="p-4">
                        <p className="text-gray-600 font-semibold mb-3">No companies found</p>
                        <button
                          type="button"
                          onClick={() => {
                            setNewCompanyData({ ...newCompanyData, name: searchTerm });
                            setShowCompanyForm(true);
                          }}
                          className="w-full px-4 py-2 rounded-[1rem] bg-purple-100 text-purple-700 font-bold hover:bg-purple-200 transition-colors"
                        >
                          + Create "{searchTerm}"
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
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
                <option value="screening">Screening</option>
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
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-8 py-4 rounded-[1.5rem] bg-white border-2 border-gray-300 text-gray-700 font-black hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedCompany || !formData.title}
              className="flex-1 px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-green-500 to-emerald-500 shadow-[0_6px_0_0_rgba(22,163,74,0.6)] border-2 border-green-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(22,163,74,0.6)] font-black text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {isSubmitting ? 'Adding...' : 'Add Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

