'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Plus,
  Settings,
  Globe,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  FolderPlus,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Save,
  X,
  Check,
} from 'lucide-react';
import { MobileDashboardHeader } from '@/app/components/MobileDashboardHeader';
import {
  Portfolio,
  PortfolioCategory,
  PortfolioPage,
  PortfolioCategoryWithPages,
  PortfolioAPIResponse,
} from '@/lib/types/portfolio';

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
  | { type: 'settings' }
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

  // Loading state
  if (state.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // No portfolio - show setup screen
  if (!state.portfolio) {
    return (
      <>
        <MobileDashboardHeader title="Portfolio Editor" />
        <SetupPortfolioScreen onComplete={fetchPortfolio} />
      </>
    );
  }

  return (
    <>
      <MobileDashboardHeader title="Portfolio Editor" />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-16 md:pt-0">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-4 py-4 md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-2xl shadow-lg">
                  🎨
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">
                    {state.portfolio.display_name}
                  </h1>
                  <p className="text-sm text-gray-500">
                    productcareerlyst.com/p/{state.portfolio.slug}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Publish Toggle */}
                <button
                  onClick={handlePublishToggle}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    state.portfolio.is_published
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  type="button"
                  aria-label={state.portfolio.is_published ? 'Unpublish portfolio' : 'Publish portfolio'}
                >
                  {state.portfolio.is_published ? (
                    <>
                      <Eye className="h-4 w-4" />
                      <span className="hidden md:inline">Published</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4" />
                      <span className="hidden md:inline">Draft</span>
                    </>
                  )}
                </button>

                {/* View Live */}
                {state.portfolio.is_published && (
                  <a
                    href={`/p/${state.portfolio.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg bg-purple-100 px-4 py-2 text-sm font-medium text-purple-700 transition-all hover:bg-purple-200"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="hidden md:inline">View Live</span>
                  </a>
                )}

                {/* Settings */}
                <button
                  onClick={() => setActiveModal({ type: 'settings' })}
                  className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-200"
                  type="button"
                  aria-label="Portfolio settings"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden md:inline">Settings</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
          {/* Quick Stats */}
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              label="Categories"
              value={state.categories.filter((c) => c.id !== 'uncategorized').length}
              icon={<FolderPlus className="h-5 w-5" />}
            />
            <StatCard
              label="Pages"
              value={state.categories.reduce((acc, c) => acc + c.pages.length, 0)}
              icon={<FileText className="h-5 w-5" />}
            />
            <StatCard
              label="Published"
              value={state.categories.reduce(
                (acc, c) => acc + c.pages.filter((p) => p.is_published).length,
                0
              )}
              icon={<Globe className="h-5 w-5" />}
            />
            <StatCard
              label="Drafts"
              value={state.categories.reduce(
                (acc, c) => acc + c.pages.filter((p) => !p.is_published).length,
                0
              )}
              icon={<Pencil className="h-5 w-5" />}
            />
          </div>

          {/* Actions Bar */}
          <div className="mb-6 flex flex-wrap gap-3">
            <button
              onClick={() => setActiveModal({ type: 'createCategory' })}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 transition-all hover:bg-gray-50 hover:shadow"
              type="button"
            >
              <FolderPlus className="h-4 w-4" />
              New Category
            </button>
            <button
              onClick={() => setActiveModal({ type: 'createPage' })}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-purple-600 hover:to-pink-600 hover:shadow"
              type="button"
            >
              <Plus className="h-4 w-4" />
              New Page
            </button>
          </div>

          {/* Categories & Pages */}
          <div className="space-y-4">
            {state.categories.length === 0 ? (
              <EmptyState
                title="No categories yet"
                description="Create your first category to organize your portfolio pages"
                action={
                  <button
                    onClick={() => setActiveModal({ type: 'createCategory' })}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white shadow-sm transition-all hover:from-purple-600 hover:to-pink-600"
                    type="button"
                  >
                    <FolderPlus className="h-5 w-5" />
                    Create Category
                  </button>
                }
              />
            ) : (
              state.categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  isExpanded={expandedCategories.has(category.id)}
                  onToggle={() => toggleCategory(category.id)}
                  onEdit={() => setActiveModal({ type: 'editCategory', category })}
                  onDelete={() => setActiveModal({ type: 'deleteCategory', category })}
                  onAddPage={() => setActiveModal({ type: 'createPage', categoryId: category.id })}
                  onEditPage={(page) => setActiveModal({ type: 'editPage', page })}
                  onDeletePage={(page) => setActiveModal({ type: 'deletePage', page })}
                  onPageClick={(page) => router.push(`/dashboard/portfolio/editor/${page.id}`)}
                />
              ))
            )}
          </div>
        </div>

        {/* Modals */}
        {activeModal?.type === 'settings' && (
          <SettingsModal
            portfolio={state.portfolio}
            onClose={() => setActiveModal(null)}
            onUpdate={fetchPortfolio}
          />
        )}
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
      </div>
    </>
  );
}

// ============================================================================
// Sub Components
// ============================================================================

const StatCard = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) => (
  <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  </div>
);

const EmptyState = ({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-3xl">
      📁
    </div>
    <h3 className="mb-2 text-lg font-semibold text-gray-800">{title}</h3>
    <p className="mb-6 max-w-md text-gray-500">{description}</p>
    {action}
  </div>
);

const CategoryCard = ({
  category,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onAddPage,
  onEditPage,
  onDeletePage,
  onPageClick,
}: {
  category: PortfolioCategoryWithPages;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddPage: () => void;
  onEditPage: (page: PortfolioPage) => void;
  onDeletePage: (page: PortfolioPage) => void;
  onPageClick: (page: PortfolioPage) => void;
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const isUncategorized = category.id === 'uncategorized';

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
      {/* Category Header */}
      <div
        className="flex cursor-pointer items-center justify-between p-4 hover:bg-gray-50"
        onClick={onToggle}
        onKeyDown={(e) => e.key === 'Enter' && onToggle()}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            type="button"
            aria-label={isExpanded ? 'Collapse category' : 'Expand category'}
          >
            {isExpanded ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
          <GripVertical className="h-4 w-4 text-gray-300" />
          <div>
            <h3 className="font-semibold text-gray-800">{category.name}</h3>
            <p className="text-sm text-gray-500">
              {category.pages.length} {category.pages.length === 1 ? 'page' : 'pages'}
            </p>
          </div>
        </div>

        {!isUncategorized && (
          <div className="relative flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddPage();
              }}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              type="button"
              aria-label="Add page to category"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              type="button"
              aria-label="Category options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                  onKeyDown={(e) => e.key === 'Escape' && setShowMenu(false)}
                  role="button"
                  tabIndex={-1}
                  aria-label="Close menu"
                />
                <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg bg-white py-1 shadow-lg ring-1 ring-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    type="button"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Pages List */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          {category.pages.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500">No pages in this category</p>
              {!isUncategorized && (
                <button
                  onClick={onAddPage}
                  className="mt-2 text-sm font-medium text-purple-600 hover:text-purple-700"
                  type="button"
                >
                  + Add a page
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {category.pages.map((page) => (
                <PageRow
                  key={page.id}
                  page={page}
                  onClick={() => onPageClick(page)}
                  onEdit={() => onEditPage(page)}
                  onDelete={() => onDeletePage(page)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const PageRow = ({
  page,
  onClick,
  onEdit,
  onDelete,
}: {
  page: PortfolioPage;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className="flex cursor-pointer items-center gap-4 p-4 pl-14 hover:bg-gray-50"
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      role="button"
      tabIndex={0}
    >
      <GripVertical className="h-4 w-4 flex-shrink-0 text-gray-300" />

      {/* Cover Image or Placeholder */}
      <div className="flex h-12 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
        {page.cover_image_url ? (
          <img
            src={page.cover_image_url}
            alt={page.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <ImageIcon className="h-5 w-5 text-gray-400" />
        )}
      </div>

      {/* Page Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="truncate font-medium text-gray-800">{page.title}</h4>
          {page.is_featured && (
            <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-700">
              Featured
            </span>
          )}
        </div>
        <p className="truncate text-sm text-gray-500">
          {page.description || 'No description'}
        </p>
      </div>

      {/* Status */}
      <div className="flex-shrink-0">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            page.is_published
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {page.is_published ? 'Published' : 'Draft'}
        </span>
      </div>

      {/* Tags */}
      <div className="hidden flex-shrink-0 gap-1 md:flex">
        {page.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700"
          >
            {tag}
          </span>
        ))}
        {page.tags.length > 2 && (
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            +{page.tags.length - 2}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="relative flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          type="button"
          aria-label="Page options"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
              }}
              onKeyDown={(e) => e.key === 'Escape' && setShowMenu(false)}
              role="button"
              tabIndex={-1}
              aria-label="Close menu"
            />
            <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg bg-white py-1 shadow-lg ring-1 ring-gray-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                  setShowMenu(false);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                type="button"
              >
                <Pencil className="h-4 w-4" />
                Edit Details
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                  setShowMenu(false);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                type="button"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Setup Portfolio Screen
// ============================================================================

const SetupPortfolioScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [formData, setFormData] = useState({
    display_name: '',
    slug: '',
    subtitle: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

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
    checkSlug(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.display_name || !formData.slug || slugStatus === 'taken') return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/portfolio/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create portfolio');
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-4xl shadow-lg">
            🎨
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-800">Create Your Portfolio</h1>
          <p className="text-gray-600">
            Set up your portfolio to showcase your product case studies
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl bg-white p-8 shadow-xl">
          {/* Display Name */}
          <div>
            <label htmlFor="display_name" className="mb-2 block text-sm font-medium text-gray-700">
              Display Name *
            </label>
            <input
              id="display_name"
              type="text"
              value={formData.display_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, display_name: e.target.value }))}
              placeholder="Your Name"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug" className="mb-2 block text-sm font-medium text-gray-700">
              Portfolio URL *
            </label>
            <div className="flex items-center">
              <span className="rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                productcareerlyst.com/p/
              </span>
              <input
                id="slug"
                type="text"
                value={formData.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="yourname"
                className="w-full rounded-r-lg border border-gray-300 px-4 py-3 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                required
              />
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              {slugStatus === 'checking' && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  <span className="text-gray-500">Checking availability...</span>
                </>
              )}
              {slugStatus === 'available' && (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">Available!</span>
                </>
              )}
              {slugStatus === 'taken' && (
                <>
                  <X className="h-4 w-4 text-red-500" />
                  <span className="text-red-600">Already taken</span>
                </>
              )}
            </div>
          </div>

          {/* Subtitle */}
          <div>
            <label htmlFor="subtitle" className="mb-2 block text-sm font-medium text-gray-700">
              Subtitle <span className="text-gray-400">(optional)</span>
            </label>
            <input
              id="subtitle"
              type="text"
              value={formData.subtitle}
              onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
              placeholder="e.g., Senior Product Manager at Google"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || !formData.display_name || !formData.slug || slugStatus === 'taken'}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white shadow-sm transition-all hover:from-purple-600 hover:to-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Create Portfolio
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// Modals
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

const SettingsModal = ({
  portfolio,
  onClose,
  onUpdate,
}: {
  portfolio: Portfolio;
  onClose: () => void;
  onUpdate: () => void;
}) => {
  const [formData, setFormData] = useState({
    display_name: portfolio.display_name,
    slug: portfolio.slug,
    subtitle: portfolio.subtitle || '',
    bio: portfolio.bio || '',
    profile_image_url: portfolio.profile_image_url || '',
    social_links: portfolio.social_links || {},
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/portfolio/manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update');
      }

      toast.success('Settings saved!');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalWrapper title="Portfolio Settings" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="settings_display_name" className="mb-1 block text-sm font-medium text-gray-700">
            Display Name
          </label>
          <input
            id="settings_display_name"
            type="text"
            value={formData.display_name}
            onChange={(e) => setFormData((prev) => ({ ...prev, display_name: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
            required
          />
        </div>

        <div>
          <label htmlFor="settings_slug" className="mb-1 block text-sm font-medium text-gray-700">
            URL Slug
          </label>
          <div className="flex items-center">
            <span className="rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500">
              /p/
            </span>
            <input
              id="settings_slug"
              type="text"
              value={formData.slug}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
                }))
              }
              className="w-full rounded-r-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="settings_subtitle" className="mb-1 block text-sm font-medium text-gray-700">
            Subtitle
          </label>
          <input
            id="settings_subtitle"
            type="text"
            value={formData.subtitle}
            onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
            placeholder="e.g., Senior PM at Google"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
          />
        </div>

        <div>
          <label htmlFor="settings_bio" className="mb-1 block text-sm font-medium text-gray-700">
            Bio
          </label>
          <textarea
            id="settings_bio"
            value={formData.bio}
            onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
            placeholder="Tell visitors about yourself..."
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
          />
        </div>

        <div>
          <label htmlFor="settings_profile_image" className="mb-1 block text-sm font-medium text-gray-700">
            Profile Image URL
          </label>
          <input
            id="settings_profile_image"
            type="url"
            value={formData.profile_image_url}
            onChange={(e) => setFormData((prev) => ({ ...prev, profile_image_url: e.target.value }))}
            placeholder="https://..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Social Links
          </label>
          <div className="space-y-2">
            {['linkedin', 'twitter', 'github', 'website'].map((platform) => (
              <div key={platform} className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-gray-400" />
                <input
                  type="url"
                  value={(formData.social_links as Record<string, string>)[platform] || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      social_links: { ...prev.social_links, [platform]: e.target.value },
                    }))
                  }
                  placeholder={platform.charAt(0).toUpperCase() + platform.slice(1)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>
            ))}
          </div>
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
            disabled={isSubmitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 px-4 py-2 font-medium text-white hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

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
    description: page?.description || '',
    category_id: page?.category_id || defaultCategoryId || '',
    cover_image_url: page?.cover_image_url || '',
    tags: page?.tags?.join(', ') || '',
    is_featured: page?.is_featured || false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSubmitting(true);

    try {
      const url = page ? `/api/portfolio/pages/${page.id}` : '/api/portfolio/pages';
      const tags = formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const response = await fetch(url, {
        method: page ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          category_id: formData.category_id || null,
          cover_image_url: formData.cover_image_url.trim() || null,
          tags,
          is_featured: formData.is_featured,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save');
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
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., E-commerce Checkout Redesign"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
            required
            autoFocus
          />
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
          <label htmlFor="page_cover" className="mb-1 block text-sm font-medium text-gray-700">
            Cover Image URL
          </label>
          <input
            id="page_cover"
            type="url"
            value={formData.cover_image_url}
            onChange={(e) => setFormData((prev) => ({ ...prev, cover_image_url: e.target.value }))}
            placeholder="https://..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
          />
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

        <div className="flex items-center gap-2">
          <input
            id="page_featured"
            type="checkbox"
            checked={formData.is_featured}
            onChange={(e) => setFormData((prev) => ({ ...prev, is_featured: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          <label htmlFor="page_featured" className="text-sm font-medium text-gray-700">
            Featured page (shown prominently on homepage)
          </label>
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
