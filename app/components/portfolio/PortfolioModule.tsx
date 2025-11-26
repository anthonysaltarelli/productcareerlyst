'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, ExternalLink, Eye, Edit, Check, Globe, Lock, FolderOpen, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { TrackedLink } from '@/app/components/TrackedLink';
import { TrackedButton } from '@/app/components/TrackedButton';
import PremiumFeatureGateModal from '@/app/components/resume/PremiumFeatureGateModal';
import { getUserPlanClient } from '@/lib/utils/resume-tracking';
import { Portfolio, PortfolioCategoryWithPages, PortfolioAPIResponse } from '@/lib/types/portfolio';

// ============================================================================
// Types
// ============================================================================

interface PortfolioModuleState {
  portfolio: Portfolio | null;
  categories: PortfolioCategoryWithPages[];
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// Main Component
// ============================================================================

export const PortfolioModule = () => {
  const [state, setState] = useState<PortfolioModuleState>({
    portfolio: null,
    categories: [],
    isLoading: true,
    error: null,
  });
  const [userPlan, setUserPlan] = useState<'learn' | 'accelerate' | null>(null);
  const [isPlanLoading, setIsPlanLoading] = useState(true);
  const [showPremiumGate, setShowPremiumGate] = useState(false);

  // Fetch user plan on mount
  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        const plan = await getUserPlanClient();
        setUserPlan(plan);
      } catch (error) {
        console.error('Error fetching user plan:', error);
      } finally {
        setIsPlanLoading(false);
      }
    };
    fetchUserPlan();
  }, []);

  // Fetch portfolio data
  const fetchPortfolio = useCallback(async () => {
    try {
      const response = await fetch('/api/portfolio/manage');
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio');
      }
      const data: PortfolioAPIResponse = await response.json();
      setState({
        portfolio: data.portfolio,
        categories: data.categories || [],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: null, // Don't show error, just means no portfolio exists
      }));
    }
  }, []);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  // Loading state
  if (state.isLoading || isPlanLoading) {
    return (
      <div className="mb-6 md:mb-8">
        <div className="p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_10px_0_0_rgba(168,85,247,0.3)] md:shadow-[0_15px_0_0_rgba(168,85,247,0.3)] border-2 border-purple-300">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        </div>
      </div>
    );
  }

  // Portfolio exists - show overview
  if (state.portfolio) {
    return (
      <PortfolioOverview
        portfolio={state.portfolio}
        categories={state.categories}
      />
    );
  }

  // No portfolio - show create state
  return (
    <>
      <CreatePortfolioCard
        userPlan={userPlan}
        onComplete={fetchPortfolio}
        onShowPremiumGate={() => setShowPremiumGate(true)}
      />
      <PremiumFeatureGateModal
        isOpen={showPremiumGate}
        onClose={() => setShowPremiumGate(false)}
        featureName="Product Portfolio"
        featureDescription="Create a professional product portfolio to showcase your experience and case studies. This feature is available exclusively for Accelerate plan subscribers."
        currentPlan={userPlan}
        requiresAccelerate={true}
      />
    </>
  );
};

// ============================================================================
// Portfolio Overview Component
// ============================================================================

interface PortfolioOverviewProps {
  portfolio: Portfolio;
  categories: PortfolioCategoryWithPages[];
}

const PortfolioOverview = ({ portfolio, categories }: PortfolioOverviewProps) => {
  const categoriesCount = categories.filter((c) => c.id !== 'uncategorized').length;
  const pagesCount = categories.reduce((acc, c) => acc + c.pages.length, 0);
  const portfolioUrl = `/p/${portfolio.slug}`;

  return (
    <div className="mb-6 md:mb-8">
      <div className="p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_10px_0_0_rgba(168,85,247,0.3)] md:shadow-[0_15px_0_0_rgba(168,85,247,0.3)] border-2 border-purple-300">
        <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
          {/* Icon */}
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-[1.5rem] bg-gradient-to-br from-purple-400 to-pink-400 shadow-[0_4px_0_0_rgba(168,85,247,0.4)] md:shadow-[0_6px_0_0_rgba(168,85,247,0.4)] border-2 border-purple-500 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl md:text-3xl">🎨</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header with status badge */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-2">
              <div className="min-w-0">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 truncate">
                  {portfolio.display_name}
                </h2>
                {portfolio.subtitle && (
                  <p className="text-sm md:text-base text-gray-700 font-medium truncate">
                    {portfolio.subtitle}
                  </p>
                )}
              </div>
              {/* Publish Status Badge */}
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-xs md:text-sm font-bold flex-shrink-0 w-fit ${
                  portfolio.is_published
                    ? 'bg-green-100 text-green-800 border-2 border-green-300'
                    : 'bg-amber-100 text-amber-800 border-2 border-amber-300'
                }`}
              >
                {portfolio.is_published ? (
                  <>
                    <Globe className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    Published
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    Draft
                  </>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-4">
              <div className="flex items-center gap-1.5 text-xs md:text-sm text-gray-600 font-medium">
                <FolderOpen className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-600" />
                <span>{categoriesCount} {categoriesCount === 1 ? 'Category' : 'Categories'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs md:text-sm text-gray-600 font-medium">
                <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 text-pink-600" />
                <span>{pagesCount} {pagesCount === 1 ? 'Page' : 'Pages'}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
              {/* View/Preview Button */}
              <TrackedLink
                href={portfolio.is_published ? portfolioUrl : `${portfolioUrl}?preview=true`}
                linkId="portfolio-module-view-link"
                eventName="User Clicked View Portfolio Link"
                eventProperties={{
                  'Link Section': 'Portfolio Module',
                  'Link Position': 'Center of Portfolio Overview Card',
                  'Link Text': portfolio.is_published ? 'View Portfolio' : 'Preview',
                  'Link Type': 'Secondary Action',
                  'Link Context': 'Below portfolio stats',
                  'Link Destination': portfolio.is_published ? portfolioUrl : `${portfolioUrl}?preview=true`,
                  'Portfolio ID': portfolio.id,
                  'Portfolio Slug': portfolio.slug,
                  'Is Published': portfolio.is_published,
                  'Page Section': 'Above the fold',
                }}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-[1.5rem] bg-white/80 hover:bg-white border-2 border-purple-300 font-bold text-sm md:text-base text-gray-800 transition-all duration-200"
              >
                {portfolio.is_published ? (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    View Portfolio
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Preview
                  </>
                )}
              </TrackedLink>

              {/* Edit Button */}
              <TrackedLink
                href="/dashboard/portfolio/editor"
                linkId="portfolio-module-edit-link"
                eventName="User Clicked Edit Portfolio Link"
                eventProperties={{
                  'Link Section': 'Portfolio Module',
                  'Link Position': 'Center of Portfolio Overview Card',
                  'Link Text': 'Edit Portfolio',
                  'Link Type': 'Primary Action',
                  'Link Context': 'Below portfolio stats',
                  'Link Destination': '/dashboard/portfolio/editor',
                  'Portfolio ID': portfolio.id,
                  'Portfolio Slug': portfolio.slug,
                  'Is Published': portfolio.is_published,
                  'Categories Count': categoriesCount,
                  'Pages Count': pagesCount,
                  'Page Section': 'Above the fold',
                }}
                className="inline-flex items-center justify-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-2 border-purple-400 font-bold text-sm md:text-base text-white transition-all duration-200 shadow-sm"
              >
                <Edit className="w-4 h-4" />
                Edit Portfolio
              </TrackedLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Create Portfolio Card Component
// ============================================================================

interface CreatePortfolioCardProps {
  userPlan: 'learn' | 'accelerate' | null;
  onComplete: () => void;
  onShowPremiumGate: () => void;
}

const CreatePortfolioCard = ({ userPlan, onComplete, onShowPremiumGate }: CreatePortfolioCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    slug: '',
    subtitle: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [slugError, setSlugError] = useState<string | null>(null);

  // Load user profile when expanding (allow all users to fill the form, gate on submit)
  const handleExpand = async () => {
    setIsExpanded(true);
    setIsLoadingProfile(true);

    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        const firstName = data.first_name || '';
        const lastName = data.last_name || '';

        if (firstName || lastName) {
          const fullName = [firstName, lastName].filter(Boolean).join(' ');
          const suggestedSlug = fullName
            .toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[^a-z0-9-_]/g, '');

          setFormData({
            display_name: fullName,
            slug: suggestedSlug,
            subtitle: '',
          });

          if (suggestedSlug) {
            checkSlug(suggestedSlug);
          }
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const checkSlug = async (slug: string) => {
    if (!slug) {
      setSlugStatus('idle');
      return;
    }

    setSlugStatus('checking');
    try {
      const response = await fetch(`/api/portfolio/manage/check-slug?slug=${slug}`);
      const data = await response.json();
      setSlugStatus(data.available ? 'available' : 'taken');
    } catch {
      setSlugStatus('idle');
    }
  };

  const handleSlugChange = (value: string) => {
    const formatted = value.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    setFormData((prev) => ({ ...prev, slug: formatted }));
    // Clear any existing slug error when user edits the slug
    if (slugError) setSlugError(null);
    checkSlug(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.display_name || !formData.slug || !formData.subtitle || slugStatus === 'taken') return;

    if (userPlan !== 'accelerate') {
      onShowPremiumGate();
      return;
    }

    // Clear any previous slug error
    setSlugError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/portfolio/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle duplicate slug error specifically
        if (response.status === 409 || errorData.error?.toLowerCase().includes('slug') || errorData.error?.toLowerCase().includes('already exists')) {
          setSlugError('This portfolio URL is already taken. Please choose a different one.');
          setSlugStatus('taken');
          return;
        }

        throw new Error(errorData.error || 'Failed to create portfolio');
      }

      toast.success('Portfolio created!');
      onComplete();
    } catch (error) {
      console.error('Error creating portfolio:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create portfolio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsExpanded(false);
    setFormData({ display_name: '', slug: '', subtitle: '' });
    setSlugStatus('idle');
    setSlugError(null);
  };

  return (
    <div className="mb-6 md:mb-8">
      <div className="p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_10px_0_0_rgba(168,85,247,0.3)] md:shadow-[0_15px_0_0_rgba(168,85,247,0.3)] border-2 border-purple-300">
        <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
          {/* Icon */}
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-[1.5rem] bg-gradient-to-br from-purple-400 to-pink-400 shadow-[0_4px_0_0_rgba(168,85,247,0.4)] md:shadow-[0_6px_0_0_rgba(168,85,247,0.4)] border-2 border-purple-500 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl md:text-3xl">🎨</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
              Create a Product Portfolio
            </h2>
            <p className="text-sm md:text-base text-gray-700 font-medium mb-4">
              Stand out in the competitive market with a professional portfolio showcasing your experience and case studies.
            </p>

            {!isExpanded ? (
              <TrackedButton
                onClick={handleExpand}
                buttonId="portfolio-module-create-button"
                eventName="User Clicked Create Portfolio Button"
                eventProperties={{
                  'Button Section': 'Portfolio Module',
                  'Button Position': 'Center of Create Portfolio Card',
                  'Button Text': 'Create Portfolio →',
                  'Button Type': 'Primary CTA',
                  'Button Context': 'Below "Create a Product Portfolio" description',
                  'Page Section': 'Above the fold',
                  'User Plan': userPlan,
                }}
                className="inline-flex items-center gap-2 px-5 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-2 border-purple-400 font-black text-sm md:text-base text-white transition-all duration-200 shadow-sm"
              >
                Create Portfolio →
              </TrackedButton>
            ) : (
              <CreatePortfolioForm
                formData={formData}
                setFormData={setFormData}
                slugStatus={slugStatus}
                slugError={slugError}
                isLoadingProfile={isLoadingProfile}
                isSubmitting={isSubmitting}
                onSlugChange={handleSlugChange}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Create Portfolio Form Component
// ============================================================================

interface CreatePortfolioFormProps {
  formData: {
    display_name: string;
    slug: string;
    subtitle: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    display_name: string;
    slug: string;
    subtitle: string;
  }>>;
  slugStatus: 'idle' | 'checking' | 'available' | 'taken';
  slugError: string | null;
  isLoadingProfile: boolean;
  isSubmitting: boolean;
  onSlugChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const CreatePortfolioForm = ({
  formData,
  setFormData,
  slugStatus,
  slugError,
  isLoadingProfile,
  isSubmitting,
  onSlugChange,
  onSubmit,
  onCancel,
}: CreatePortfolioFormProps) => {
  if (isLoadingProfile) {
    return (
      <div className="flex items-center gap-2 py-4">
        <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
        <span className="text-gray-600 font-medium text-sm md:text-base">Loading your profile...</span>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 md:space-y-4 mt-4 bg-white/50 rounded-xl md:rounded-2xl p-4 md:p-5 border-2 border-purple-200">
      {/* Live Preview */}
      {(formData.display_name || formData.subtitle) && (
        <div className="rounded-lg md:rounded-xl bg-white/80 p-3 md:p-4 text-center border border-purple-200">
          <p className="mb-1 text-[10px] md:text-xs font-medium uppercase tracking-wider text-gray-400">Preview</p>
          <h3 className="text-sm md:text-lg leading-tight text-gray-900">
            <span className="font-bold">{formData.display_name || 'Your Name'}</span>
            <span className="font-normal">
              {' '}is a {formData.subtitle || '...'}
              {formData.subtitle && !formData.subtitle.endsWith('.') && '.'}
            </span>
          </h3>
        </div>
      )}

      {/* Display Name */}
      <div>
        <label htmlFor="portfolio_display_name" className="mb-1 block text-xs md:text-sm font-bold text-gray-700">
          Portfolio Title (Your Name) *
        </label>
        <input
          id="portfolio_display_name"
          type="text"
          value={formData.display_name}
          onChange={(e) => setFormData((prev) => ({ ...prev, display_name: e.target.value }))}
          placeholder="Enter your full name"
          className="w-full rounded-lg md:rounded-xl border-2 border-purple-200 bg-white px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base text-gray-800 font-medium focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
          required
          aria-required="true"
        />
      </div>

      {/* Subtitle */}
      <div>
        <label htmlFor="portfolio_subtitle" className="mb-1 block text-xs md:text-sm font-bold text-gray-700">
          Subtitle *
        </label>
        <p className="mb-1 text-[10px] md:text-xs text-gray-500">
          Your portfolio will display: &quot;{formData.display_name || 'Your Name'} is a [subtitle]&quot;
        </p>
        <input
          id="portfolio_subtitle"
          type="text"
          value={formData.subtitle}
          onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
          placeholder="Senior Product Manager"
          className="w-full rounded-lg md:rounded-xl border-2 border-purple-200 bg-white px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base text-gray-800 font-medium focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
          required
          aria-required="true"
        />
      </div>

      {/* Slug */}
      <div>
        <label htmlFor="portfolio_slug" className="mb-1 block text-xs md:text-sm font-bold text-gray-700">
          Portfolio URL *
        </label>
        {/* Mobile: stacked layout, Desktop: inline */}
        <div className="flex flex-col md:flex-row md:items-center">
          <span className={`rounded-t-lg md:rounded-t-none md:rounded-l-xl border-2 md:border-r-0 px-3 py-2 md:py-2.5 text-xs md:text-sm font-medium whitespace-nowrap ${
            slugError || slugStatus === 'taken'
              ? 'border-red-300 bg-red-50 text-red-500'
              : 'border-purple-200 bg-purple-50 text-gray-500'
          }`}>
            <span className="md:hidden">.../p/</span>
            <span className="hidden md:inline">productcareerlyst.com/p/</span>
          </span>
          <input
            id="portfolio_slug"
            type="text"
            value={formData.slug}
            onChange={(e) => onSlugChange(e.target.value)}
            placeholder="yourname"
            className={`w-full rounded-b-lg md:rounded-b-none md:rounded-r-xl border-2 border-t-0 md:border-t-2 bg-white px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base text-gray-800 font-medium focus:outline-none focus:ring-2 ${
              slugError || slugStatus === 'taken'
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                : 'border-purple-200 focus:border-purple-500 focus:ring-purple-200'
            }`}
            required
            aria-required="true"
            aria-invalid={!!slugError || slugStatus === 'taken'}
            aria-describedby={slugError ? 'slug-error' : undefined}
          />
        </div>

        {/* Slug error message */}
        {slugError && (
          <div id="slug-error" className="mt-2 flex items-start gap-2 rounded-lg bg-red-50 p-2.5 md:p-3 border border-red-200">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" aria-hidden="true" />
            <p className="text-xs md:text-sm text-red-700 font-medium">{slugError}</p>
          </div>
        )}

        {/* Slug status (only show if no error) */}
        {!slugError && (
          <div className="mt-1.5 flex items-center gap-2 text-xs md:text-sm">
            {slugStatus === 'checking' && (
              <>
                <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin text-gray-400" />
                <span className="text-gray-500">Checking...</span>
              </>
            )}
            {slugStatus === 'available' && (
              <>
                <Check className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-500" />
                <span className="text-green-600 font-medium">Available!</span>
              </>
            )}
            {slugStatus === 'taken' && (
              <>
                <span className="text-red-500">✗</span>
                <span className="text-red-600 font-medium">Already taken</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-2">
        <TrackedButton
          type="submit"
          disabled={isSubmitting || !formData.display_name || !formData.slug || !formData.subtitle || slugStatus === 'taken' || !!slugError}
          buttonId="portfolio-module-submit-create-button"
          eventName="User Submitted Create Portfolio Form"
          eventProperties={{
            'Button Section': 'Portfolio Module Create Form',
            'Button Position': 'Bottom of Create Form',
            'Button Text': 'Create Portfolio',
            'Button Type': 'Primary Submit Button',
            'Button Context': 'Below portfolio form fields',
            'Page Section': 'Above the fold',
            'Display Name Length': formData.display_name.length,
            'Slug Length': formData.slug.length,
            'Subtitle Length': formData.subtitle.length,
            'Slug Status': slugStatus,
            'Has Slug Error': !!slugError,
          }}
          className="inline-flex items-center justify-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-bold text-sm md:text-base text-white transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Portfolio'
          )}
        </TrackedButton>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl border-2 border-purple-200 bg-white font-bold text-sm md:text-base text-gray-700 hover:bg-purple-50 transition-all duration-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

