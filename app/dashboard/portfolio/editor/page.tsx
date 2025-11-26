'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { arrayMove } from '@dnd-kit/sortable';
import { Loader2, Save, X, Trash2, Link2, AlertCircle } from 'lucide-react';
import { DesktopOnlyFallback } from '@/app/components/DesktopOnlyFallback';
import {
  Portfolio,
  PortfolioCategory,
  PortfolioPage,
  PortfolioCategoryWithPages,
  PortfolioAPIResponse,
  PortfolioWorkExperience,
} from '@/lib/types/portfolio';

// Import new components
import { PortfolioEditorSidebar, PortfolioSection } from '@/app/components/portfolio/PortfolioEditorSidebar';
import { ProfileSettingsSection } from '@/app/components/portfolio/ProfileSettingsSection';
import { AboutSection } from '@/app/components/portfolio/AboutSection';
import { ContentSection } from '@/app/components/portfolio/ContentSection';

// ============================================================================
// Types
// ============================================================================

interface PortfolioState {
  portfolio: Portfolio | null;
  categories: PortfolioCategoryWithPages[];
  isLoading: boolean;
  error: string | null;
}

type ActiveModal = 
  | { type: 'createCategory' }
  | { type: 'editCategory'; category: PortfolioCategory }
  | { type: 'createPage'; categoryId?: string }
  | { type: 'editPage'; page: PortfolioPage }
  | { type: 'deleteCategory'; category: PortfolioCategory }
  | { type: 'deletePage'; page: PortfolioPage }
  | null;

// ============================================================================
// Main Component
// ============================================================================

export default function PortfolioEditorPage() {
  const router = useRouter();
  const [state, setState] = useState<PortfolioState>({
    portfolio: null,
    categories: [],
    isLoading: true,
    error: null,
  });
  const [selectedSection, setSelectedSection] = useState<PortfolioSection>('profile');
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

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
      
      // Expand all categories by default
      if (data.categories) {
        setExpandedCategories(new Set(data.categories.map((c) => c.id)));
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load portfolio',
      }));
    }
  }, []);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  // Redirect to main portfolio page if no portfolio exists (creation happens there)
  useEffect(() => {
    if (!state.isLoading && !state.portfolio) {
      router.replace('/dashboard/portfolio');
    }
  }, [state.isLoading, state.portfolio, router]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handlePublishToggle = async () => {
    if (!state.portfolio) return;

    try {
      const response = await fetch('/api/portfolio/manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !state.portfolio.is_published }),
      });

      if (!response.ok) throw new Error('Failed to update');

      setState((prev) => ({
        ...prev,
        portfolio: prev.portfolio
          ? { ...prev.portfolio, is_published: !prev.portfolio.is_published }
          : null,
      }));

      toast.success(
        state.portfolio.is_published
          ? 'Portfolio unpublished'
          : 'Portfolio published!'
      );
    } catch (error) {
      console.error('Error toggling publish:', error);
      toast.error('Failed to update publish status');
    }
  };

  // Update work experience
  const handleUpdateWorkExperience = useCallback(async (workExperience: PortfolioWorkExperience[]) => {
    try {
      const response = await fetch('/api/portfolio/manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ work_experience: workExperience }),
      });

      if (!response.ok) throw new Error('Failed to update');

      setState((prev) => ({
        ...prev,
        portfolio: prev.portfolio
          ? { ...prev.portfolio, work_experience: workExperience }
          : null,
      }));
    } catch (error) {
      console.error('Error updating work experience:', error);
      throw error;
    }
  }, []);

  // Toggle work experience visibility
  const handleToggleWorkExperienceVisibility = useCallback(async (show: boolean) => {
    try {
      const response = await fetch('/api/portfolio/manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ show_work_experience: show }),
      });

      if (!response.ok) throw new Error('Failed to update');

      setState((prev) => ({
        ...prev,
        portfolio: prev.portfolio
          ? { ...prev.portfolio, show_work_experience: show }
          : null,
      }));
    } catch (error) {
      console.error('Error toggling work experience visibility:', error);
      throw error;
    }
  }, []);

  // Reorder categories with auto-save
  const handleReorderCategories = useCallback(async (newCategories: PortfolioCategoryWithPages[]) => {
    setState((prev) => ({ ...prev, categories: newCategories }));

    try {
      const response = await fetch('/api/portfolio/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: newCategories.map((cat, index) => ({
            id: cat.id,
            display_order: index,
          })),
        }),
      });

      if (!response.ok) throw new Error('Failed to reorder');
    } catch (error) {
      console.error('Error reordering categories:', error);
      toast.error('Failed to save order');
      fetchPortfolio();
    }
  }, [fetchPortfolio]);

  // Reorder pages within a category
  const handleReorderPages = useCallback(async (
    categoryId: string,
    newPages: PortfolioPage[],
    targetCategoryId?: string
  ) => {
    setState((prev) => {
      const newCategories = prev.categories.map((cat) => {
        if (cat.id === categoryId) {
          return { ...cat, pages: newPages };
        }
        return cat;
      });
      return { ...prev, categories: newCategories };
    });

    try {
      const response = await fetch('/api/portfolio/pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pages: newPages.map((page, index) => ({
            id: page.id,
            display_order: index,
            ...(targetCategoryId !== undefined && { category_id: targetCategoryId || null }),
          })),
        }),
      });

      if (!response.ok) throw new Error('Failed to reorder');
    } catch (error) {
      console.error('Error reordering pages:', error);
      toast.error('Failed to save order');
      fetchPortfolio();
    }
  }, [fetchPortfolio]);

  // Move category up/down
  const handleMoveCategoryUp = useCallback((categoryId: string) => {
    const index = state.categories.findIndex((c) => c.id === categoryId);
    if (index <= 0) return;
    const newCategories = arrayMove(state.categories, index, index - 1);
    handleReorderCategories(newCategories);
  }, [state.categories, handleReorderCategories]);

  const handleMoveCategoryDown = useCallback((categoryId: string) => {
    const index = state.categories.findIndex((c) => c.id === categoryId);
    if (index === -1 || index >= state.categories.length - 1) return;
    const newCategories = arrayMove(state.categories, index, index + 1);
    handleReorderCategories(newCategories);
  }, [state.categories, handleReorderCategories]);

  // Move page up/down within category
  const handleMovePageUp = useCallback((categoryId: string, pageId: string) => {
    const category = state.categories.find((c) => c.id === categoryId);
    if (!category) return;
    const pageIndex = category.pages.findIndex((p) => p.id === pageId);
    if (pageIndex <= 0) return;
    const newPages = arrayMove(category.pages, pageIndex, pageIndex - 1);
    handleReorderPages(categoryId, newPages);
  }, [state.categories, handleReorderPages]);

  const handleMovePageDown = useCallback((categoryId: string, pageId: string) => {
    const category = state.categories.find((c) => c.id === categoryId);
    if (!category) return;
    const pageIndex = category.pages.findIndex((p) => p.id === pageId);
    if (pageIndex === -1 || pageIndex >= category.pages.length - 1) return;
    const newPages = arrayMove(category.pages, pageIndex, pageIndex + 1);
    handleReorderPages(categoryId, newPages);
  }, [state.categories, handleReorderPages]);

  // Loading state
  if (state.isLoading) {
    return (
      <>
        <DesktopOnlyFallback 
          featureName="Portfolio Editor"
          description="The Portfolio Editor requires a larger screen to create and edit your portfolio effectively. Please access this feature from a desktop or laptop computer."
          pageTitle="Portfolio Editor"
        />
        
        <div className="hidden md:flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      </>
    );
  }

  // No portfolio - show loading while redirecting to main portfolio page
  if (!state.portfolio) {
    return (
      <>
        <DesktopOnlyFallback 
          featureName="Portfolio Editor"
          description="The Portfolio Editor requires a larger screen to create and edit your portfolio effectively. Please access this feature from a desktop or laptop computer."
          pageTitle="Portfolio Editor"
        />
        
        <div className="hidden md:flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      </>
    );
  }

  // Calculate counts for sidebar
  const categoriesCount = state.categories.filter((c) => c.id !== 'uncategorized').length;
  const pagesCount = state.categories.reduce((acc, c) => acc + c.pages.length, 0);

  return (
    <>
      <DesktopOnlyFallback 
        featureName="Portfolio Editor"
        description="The Portfolio Editor requires a larger screen to create and edit your portfolio effectively. Please access this feature from a desktop or laptop computer."
        pageTitle="Portfolio Editor"
      />
      
      {/* Desktop Two-Panel Layout */}
      <div className="hidden md:flex h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Left Sidebar */}
        <div className="w-72 flex-shrink-0 overflow-y-auto border-r border-slate-200 bg-white/80 shadow-lg backdrop-blur-sm">
          <PortfolioEditorSidebar
            selectedSection={selectedSection}
            onSectionChange={setSelectedSection}
            onBack={() => router.push('/dashboard/portfolio')}
            portfolioSlug={state.portfolio.slug}
            portfolioName={state.portfolio.display_name}
            isPublished={state.portfolio.is_published}
            onPublishToggle={handlePublishToggle}
            categoriesCount={categoriesCount}
            pagesCount={pagesCount}
          />
        </div>

        {/* Right Content Area */}
        <div className="flex-1 overflow-y-auto">
          {selectedSection === 'profile' && (
            <ProfileSettingsSection
              portfolio={state.portfolio}
              pages={state.categories.flatMap((c) => c.pages)}
              onUpdate={fetchPortfolio}
            />
          )}

          {selectedSection === 'about' && (
            <AboutSection
              portfolio={state.portfolio}
              onUpdate={fetchPortfolio}
              onUpdateWorkExperience={handleUpdateWorkExperience}
              onToggleWorkExperienceVisibility={handleToggleWorkExperienceVisibility}
            />
          )}

          {selectedSection === 'content' && (
            <ContentSection
              categories={state.categories}
              expandedCategories={expandedCategories}
              onToggleCategory={toggleCategory}
              onCreateCategory={() => setActiveModal({ type: 'createCategory' })}
              onEditCategory={(category) => setActiveModal({ type: 'editCategory', category })}
              onDeleteCategory={(category) => setActiveModal({ type: 'deleteCategory', category })}
              onCreatePage={(categoryId) => setActiveModal({ type: 'createPage', categoryId })}
              onEditPage={(page) => setActiveModal({ type: 'editPage', page })}
              onDeletePage={(page) => setActiveModal({ type: 'deletePage', page })}
              onPageClick={(page) => router.push(`/dashboard/portfolio/editor/${page.id}`)}
              onReorderCategories={handleReorderCategories}
              onReorderPages={handleReorderPages}
              onMoveCategoryUp={handleMoveCategoryUp}
              onMoveCategoryDown={handleMoveCategoryDown}
              onMovePageUp={handleMovePageUp}
              onMovePageDown={handleMovePageDown}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {activeModal?.type === 'createCategory' && (
        <CategoryModal
          onClose={() => setActiveModal(null)}
          onSuccess={fetchPortfolio}
        />
      )}
      {activeModal?.type === 'editCategory' && (
        <CategoryModal
          category={activeModal.category}
          onClose={() => setActiveModal(null)}
          onSuccess={fetchPortfolio}
        />
      )}
      {activeModal?.type === 'createPage' && (
        <PageModal
          categories={state.categories.filter((c) => c.id !== 'uncategorized')}
          defaultCategoryId={activeModal.categoryId}
          onClose={() => setActiveModal(null)}
          onSuccess={fetchPortfolio}
        />
      )}
      {activeModal?.type === 'editPage' && (
        <PageModal
          page={activeModal.page}
          categories={state.categories.filter((c) => c.id !== 'uncategorized')}
          onClose={() => setActiveModal(null)}
          onSuccess={fetchPortfolio}
        />
      )}
      {activeModal?.type === 'deleteCategory' && (
        <DeleteConfirmModal
          title="Delete Category"
          message={`Are you sure you want to delete "${activeModal.category.name}"? Pages in this category will become uncategorized.`}
          onClose={() => setActiveModal(null)}
          onConfirm={async () => {
            try {
              const response = await fetch(
                `/api/portfolio/categories/${activeModal.category.id}`,
                { method: 'DELETE' }
              );
              if (!response.ok) throw new Error('Failed to delete');
              toast.success('Category deleted');
              setActiveModal(null);
              fetchPortfolio();
            } catch (error) {
              console.error('Error deleting category:', error);
              toast.error('Failed to delete category');
            }
          }}
        />
      )}
      {activeModal?.type === 'deletePage' && (
        <DeleteConfirmModal
          title="Delete Page"
          message={`Are you sure you want to delete "${activeModal.page.title}"? This action cannot be undone.`}
          onClose={() => setActiveModal(null)}
          onConfirm={async () => {
            try {
              const response = await fetch(
                `/api/portfolio/pages/${activeModal.page.id}`,
                { method: 'DELETE' }
              );
              if (!response.ok) throw new Error('Failed to delete');
              toast.success('Page deleted');
              setActiveModal(null);
              fetchPortfolio();
            } catch (error) {
              console.error('Error deleting page:', error);
              toast.error('Failed to delete page');
            }
          }}
        />
      )}
    </>
  );
}

// ============================================================================
// Modal Components
// ============================================================================

const ModalWrapper = ({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div
      className="fixed inset-0"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      role="button"
      tabIndex={-1}
      aria-label="Close modal"
    />
    <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          type="button"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const CategoryModal = ({
  category,
  onClose,
  onSuccess,
}: {
  category?: PortfolioCategory;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);

    try {
      const url = category
        ? `/api/portfolio/categories/${category.id}`
        : '/api/portfolio/categories';

      const response = await fetch(url, {
        method: category ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save');
      }

      toast.success(category ? 'Category updated!' : 'Category created!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalWrapper title={category ? 'Edit Category' : 'New Category'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="category_name" className="mb-1 block text-sm font-medium text-gray-700">
            Name *
          </label>
          <input
            id="category_name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Case Studies"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
            required
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="category_description" className="mb-1 block text-sm font-medium text-gray-700">
            Description <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            id="category_description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this category"
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 px-4 py-2 font-medium text-white hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {category ? 'Save' : 'Create'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

/**
 * Generate a URL-friendly slug from a title
 */
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .slice(0, 100); // Limit length
};

const PageModal = ({
  page,
  categories,
  defaultCategoryId,
  onClose,
  onSuccess,
}: {
  page?: PortfolioPage;
  categories: PortfolioCategory[];
  defaultCategoryId?: string;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [formData, setFormData] = useState({
    title: page?.title || '',
    slug: page?.slug || '',
    description: page?.description || '',
    category_id: page?.category_id || defaultCategoryId || '',
    cover_image_url: page?.cover_image_url || '',
    tags: page?.tags?.join(', ') || '',
    is_featured: page?.is_featured || false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(!!page?.slug); // If editing, slug was already set

  // Auto-generate slug from title when title changes (only if user hasn't manually edited slug)
  const handleTitleChange = (newTitle: string) => {
    setFormData((prev) => {
      const updates: typeof prev = { ...prev, title: newTitle };
      // Only auto-generate slug if user hasn't manually edited it
      if (!slugTouched) {
        updates.slug = generateSlug(newTitle);
      }
      return updates;
    });
    // Clear any existing slug error when title changes
    if (slugError) setSlugError(null);
  };

  const handleSlugChange = (newSlug: string) => {
    // Format the slug as user types
    const formattedSlug = newSlug
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    
    setFormData((prev) => ({ ...prev, slug: formattedSlug }));
    setSlugTouched(true);
    // Clear error when user edits the slug
    if (slugError) setSlugError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    // Clear previous errors
    setSlugError(null);
    setIsSubmitting(true);

    try {
      const url = page ? `/api/portfolio/pages/${page.id}` : '/api/portfolio/pages';
      const tags = formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      // Use generated slug if none provided
      const slugToSubmit = formData.slug.trim() || generateSlug(formData.title);

      const response = await fetch(url, {
        method: page ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          slug: slugToSubmit,
          description: formData.description.trim() || null,
          category_id: formData.category_id || null,
          cover_image_url: formData.cover_image_url.trim() || null,
          tags,
          is_featured: formData.is_featured,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle duplicate slug error specifically
        if (response.status === 409 || errorData.error?.includes('slug already exists')) {
          setSlugError('A page with this URL slug already exists. Please choose a different slug.');
          return;
        }
        
        throw new Error(errorData.error || 'Failed to save');
      }

      toast.success(page ? 'Page updated!' : 'Page created!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving page:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save page');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Computed preview slug
  const previewSlug = formData.slug || generateSlug(formData.title) || 'your-page-slug';

  return (
    <ModalWrapper title={page ? 'Edit Page' : 'New Page'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="page_title" className="mb-1 block text-sm font-medium text-gray-700">
            Title *
          </label>
          <input
            id="page_title"
            type="text"
            value={formData.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g., E-commerce Checkout Redesign"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
            required
            autoFocus
          />
        </div>

        {/* Slug field with URL preview */}
        <div>
          <label htmlFor="page_slug" className="mb-1 block text-sm font-medium text-gray-700">
            URL Slug
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Link2 className="h-4 w-4 text-gray-400" aria-hidden="true" />
            </div>
            <input
              id="page_slug"
              type="text"
              value={formData.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder={generateSlug(formData.title) || 'your-page-slug'}
              className={`w-full rounded-lg border px-3 py-2 pl-10 focus:outline-none focus:ring-2 ${
                slugError
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:border-purple-500 focus:ring-purple-200'
              }`}
              aria-invalid={!!slugError}
              aria-describedby={slugError ? 'slug-error' : 'slug-preview'}
            />
          </div>
          
          {/* Inline error message */}
          {slugError && (
            <div id="slug-error" className="mt-2 flex items-start gap-2 rounded-md bg-red-50 p-2">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" aria-hidden="true" />
              <p className="text-sm text-red-700">{slugError}</p>
            </div>
          )}
          
          {/* URL preview */}
          {!slugError && (
            <p id="slug-preview" className="mt-1.5 text-xs text-gray-500">
              Preview: <span className="font-mono text-gray-600">/p/{previewSlug}</span>
            </p>
          )}
        </div>

        <div>
          <label htmlFor="page_description" className="mb-1 block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="page_description"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description shown in previews"
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
          />
        </div>

        <div>
          <label htmlFor="page_category" className="mb-1 block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            id="page_category"
            value={formData.category_id}
            onChange={(e) => setFormData((prev) => ({ ...prev, category_id: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
          >
            <option value="">No category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="page_tags" className="mb-1 block text-sm font-medium text-gray-700">
            Tags <span className="text-gray-400">(comma-separated)</span>
          </label>
          <input
            id="page_tags"
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
            placeholder="e.g., E-commerce, UX Design, Mobile"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !formData.title.trim()}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 px-4 py-2 font-medium text-white hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {page ? 'Save' : 'Create'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

const DeleteConfirmModal = ({
  title,
  message,
  onClose,
  onConfirm,
}: {
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    await onConfirm();
    setIsDeleting(false);
  };

  return (
    <ModalWrapper title={title} onClose={onClose}>
      <p className="mb-6 text-gray-600">{message}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isDeleting}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Delete
        </button>
      </div>
    </ModalWrapper>
  );
};
