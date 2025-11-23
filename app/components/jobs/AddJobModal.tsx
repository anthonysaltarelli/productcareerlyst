'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCompanies, createCompany } from '@/lib/hooks/useCompanies';
import { createJobApplication } from '@/lib/hooks/useJobApplications';
import { Company, ApplicationStatus, PriorityLevel, WorkMode } from '@/lib/types/jobs';

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface BrandfetchBrand {
  icon?: string | null;
  name?: string | null;
  domain?: string;
  claimed?: boolean;
  brandId?: string;
}

type ImportMode = 'import' | 'manual';
type ImportStep = 'idle' | 'scraping' | 'extracting' | 'creating' | 'complete';

export const AddJobModal = ({ isOpen, onClose, onSuccess }: AddJobModalProps) => {
  const router = useRouter();
  const [mode, setMode] = useState<ImportMode>('import');
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importStep, setImportStep] = useState<ImportStep>('idle');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brandfetchBrands, setBrandfetchBrands] = useState<BrandfetchBrand[]>([]);
  const [loadingBrandfetch, setLoadingBrandfetch] = useState(false);

  // When searching, include all companies (approved and unapproved) to avoid suggesting duplicates
  // When not searching, only show approved companies
  const { companies, loading: loadingCompanies } = useCompanies(searchTerm, searchTerm ? undefined : true);

  // Search Brandfetch API
  const searchBrandfetch = useCallback(async (name: string) => {
    if (!name || name.trim().length < 2) {
      setBrandfetchBrands([]);
      return;
    }

    setLoadingBrandfetch(true);
    try {
      const response = await fetch(`/api/jobs/brandfetch/search?name=${encodeURIComponent(name)}`);
      if (response.ok) {
        const data = await response.json();
        setBrandfetchBrands(data.brands || []);
      } else {
        setBrandfetchBrands([]);
      }
    } catch (err) {
      console.error('Error searching Brandfetch:', err);
      setBrandfetchBrands([]);
    } finally {
      setLoadingBrandfetch(false);
    }
  }, []);

  // Debounce Brandfetch search
  useEffect(() => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setBrandfetchBrands([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchBrandfetch(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchBrandfetch]);

  // Helper function to normalize strings for comparison
  const normalizeString = (str: string | null | undefined): string => {
    if (!str) return '';
    return str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  };

  // Helper function to extract domain from URL
  const extractDomain = (url: string | null | undefined): string => {
    if (!url) return '';
    try {
      // Remove protocol if present
      let domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
      // Remove path
      domain = domain.split('/')[0];
      return normalizeString(domain);
    } catch {
      return normalizeString(url);
    }
  };

  // Filter out Brandfetch brands that match existing companies
  const filteredBrandfetchBrands = brandfetchBrands.filter((brand) => {
    if (!brand.name) return false;
    
    const brandNameNormalized = normalizeString(brand.name);
    const brandDomainNormalized = brand.domain ? extractDomain(brand.domain) : '';

    // Check if any existing company matches by name or domain
    return !companies.some((company) => {
      const companyNameNormalized = normalizeString(company.name);
      const companyDomainNormalized = company.website ? extractDomain(company.website) : '';
      
      return (
        companyNameNormalized === brandNameNormalized ||
        (brandDomainNormalized && companyDomainNormalized && brandDomainNormalized === companyDomainNormalized)
      );
    });
  });

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
      setMode('import');
      setImportUrl('');
      setIsImporting(false);
      setImportStep('idle');
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
      setBrandfetchBrands([]);
    }
  }, [isOpen]);

  const handleImportFromUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!importUrl || importUrl.trim().length === 0) {
      setError('Please enter a job description URL');
      return;
    }

    // Validate URL format
    try {
      new URL(importUrl);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setIsImporting(true);
    setError(null);
    setImportStep('scraping');

    try {
      // Step 1: Scraping (we'll update this as we go)
      setImportStep('scraping');
      
      const response = await fetch('/api/jobs/import-from-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: importUrl }),
      });

      // Update step to extracting (happens during the API call)
      setImportStep('extracting');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to import job');
      }

      const data = await response.json();
      
      // Step 3: Creating (company and job are being created)
      setImportStep('creating');
      
      // Small delay to show the creating step
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Success! Navigate to job detail page
      setImportStep('complete');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Close modal first
      onClose();
      
      // Navigate to the job detail page
      if (data.application?.id) {
        router.push(`/dashboard/jobs/${data.application.id}`);
      } else {
        // Fallback: refresh the list if no ID
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import job. Please try adding it manually.');
      setImportStep('idle');
    } finally {
      setIsImporting(false);
    }
  };

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

  const handleSelectBrandfetchBrand = async (brand: BrandfetchBrand) => {
    if (!brand.name) {
      setError('Invalid brand data');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create company from Brandfetch data
      const result = await createCompany({
        name: brand.name,
        website: brand.domain || undefined,
        // Brandfetch doesn't provide industry/size, so we'll use defaults
        industry: 'technology' as const,
        size: '51-200' as const,
      });

      setSelectedCompany(result.company);
      setSearchTerm('');
      setBrandfetchBrands([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create company from Brandfetch');
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
            disabled={isSubmitting || isImporting}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mode Selector */}
        <div className="mb-6 flex gap-2 p-1 bg-gray-100 rounded-[1rem] border-2 border-gray-300">
          <button
            type="button"
            onClick={() => {
              setMode('import');
              setError(null);
            }}
            disabled={isSubmitting || isImporting}
            className={`flex-1 px-4 py-2.5 rounded-[0.75rem] font-black transition-all ${
              mode === 'import'
                ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            } disabled:opacity-50`}
          >
            📋 Paste JD Link
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('manual');
              setError(null);
            }}
            disabled={isSubmitting || isImporting}
            className={`flex-1 px-4 py-2.5 rounded-[0.75rem] font-black transition-all ${
              mode === 'manual'
                ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            } disabled:opacity-50`}
          >
            ✏️ Add Manually
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-[1rem] text-red-700 font-bold">
            {error}
          </div>
        )}

        {mode === 'import' ? (
          <form onSubmit={handleImportFromUrl} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Job Description URL *
              </label>
              <input
                type="url"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder="Paste in the job description URL here..."
                className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
                disabled={isImporting}
                required
              />
              <p className="mt-2 text-xs text-gray-600">
                Paste the link to the job posting. We'll automatically extract the company and job details.
              </p>
            </div>

            {/* Loading Progress Indicator */}
            {isImporting && (
              <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-[1rem] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {importStep === 'scraping' ? (
                      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : importStep === 'extracting' ? (
                      <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : importStep === 'creating' ? (
                      <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-gray-900">
                      {importStep === 'scraping' && '📄 Scraping job description...'}
                      {importStep === 'extracting' && '🤖 Extracting company and job details...'}
                      {importStep === 'creating' && '💾 Creating job application...'}
                      {importStep === 'complete' && '✅ Job imported successfully!'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {importStep === 'scraping' && 'Reading the job posting from the URL'}
                      {importStep === 'extracting' && 'Using AI to extract structured information'}
                      {importStep === 'creating' && 'Saving company and job to your list'}
                      {importStep === 'complete' && 'All done! Your job has been added.'}
                    </p>
                  </div>
                </div>
                
                {/* Progress Steps */}
                <div className="flex items-center gap-2 pt-2">
                  <div className={`flex-1 h-2 rounded-full ${importStep === 'scraping' || importStep === 'extracting' || importStep === 'creating' || importStep === 'complete' ? 'bg-purple-500' : 'bg-gray-200'}`}></div>
                  <div className={`flex-1 h-2 rounded-full ${importStep === 'extracting' || importStep === 'creating' || importStep === 'complete' ? 'bg-pink-500' : 'bg-gray-200'}`}></div>
                  <div className={`flex-1 h-2 rounded-full ${importStep === 'creating' || importStep === 'complete' ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 mt-10">
              <button
                type="button"
                onClick={onClose}
                disabled={isImporting}
                className="flex-1 px-8 py-4 rounded-[1.5rem] bg-white border-2 border-gray-300 text-gray-700 font-black hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isImporting || !importUrl.trim()}
                className="flex-1 px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_6px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
              >
                {isImporting ? 'Importing...' : 'Import Job'}
              </button>
            </div>
          </form>
        ) : (
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
                  <div className="mt-3 max-h-96 overflow-y-auto border-2 border-gray-300 rounded-[1rem] bg-white">
                    {(loadingCompanies || loadingBrandfetch) ? (
                      <div className="p-4 text-center text-gray-600 font-semibold">Searching...</div>
                    ) : (
                      <>
                        {/* Database Companies */}
                        {companies.map((company) => (
                          <button
                            key={company.id}
                            type="button"
                            onClick={() => setSelectedCompany(company)}
                            disabled={isSubmitting}
                            className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors border-b border-gray-200 last:border-b-0 disabled:opacity-50"
                          >
                            <p className="font-bold text-gray-900">{company.name}</p>
                            {company.website && (
                              <p className="text-sm text-gray-600">{company.website}</p>
                            )}
                          </button>
                        ))}

                        {/* Brandfetch Results (de-duplicated) */}
                        {filteredBrandfetchBrands.map((brand, index) => (
                          <button
                            key={brand.brandId || `brandfetch-${index}`}
                            type="button"
                            onClick={() => handleSelectBrandfetchBrand(brand)}
                            disabled={isSubmitting}
                            className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors border-b border-gray-200 last:border-b-0 disabled:opacity-50 flex items-center gap-3"
                          >
                            {brand.icon && (
                              <img
                                src={brand.icon}
                                alt={brand.name || 'Brand icon'}
                                className="w-8 h-8 object-contain flex-shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900">{brand.name}</p>
                              {brand.domain && (
                                <p className="text-sm text-gray-600">{brand.domain}</p>
                              )}
                            </div>
                            {brand.claimed && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-semibold flex-shrink-0">
                                Verified
                              </span>
                            )}
                          </button>
                        ))}

                        {/* No Results */}
                        {companies.length === 0 && filteredBrandfetchBrands.length === 0 && !loadingCompanies && !loadingBrandfetch && (
                          <div className="p-4">
                            <p className="text-gray-600 font-semibold mb-3">No companies found</p>
                            <button
                              type="button"
                              onClick={() => {
                                setNewCompanyData({ ...newCompanyData, name: searchTerm });
                                setShowCompanyForm(true);
                              }}
                              disabled={isSubmitting}
                              className="w-full px-4 py-2 rounded-[1rem] bg-purple-100 text-purple-700 font-bold hover:bg-purple-200 transition-colors disabled:opacity-50"
                            >
                              + Create "{searchTerm}"
                            </button>
                          </div>
                        )}
                      </>
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
        )}
      </div>
    </div>
  );
};

