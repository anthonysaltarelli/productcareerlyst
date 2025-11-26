'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  ChevronUp,
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
  Linkedin,
  Twitter,
  Github,
  Camera,
  Mail,
  Youtube,
} from 'lucide-react';

// Custom Substack icon (lucide-react doesn't have one)
const SubstackIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" />
  </svg>
);
import { MobileDashboardHeader } from '@/app/components/MobileDashboardHeader';
import { DesktopOnlyFallback } from '@/app/components/DesktopOnlyFallback';
import ProfileImageUploadModal from '@/app/components/ProfileImageUploadModal';
import PremiumFeatureGateModal from '@/app/components/resume/PremiumFeatureGateModal';
import { getUserPlanClient } from '@/lib/utils/resume-tracking';
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
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragType, setActiveDragType] = useState<'category' | 'page' | null>(null);
  const [userPlan, setUserPlan] = useState<'learn' | 'accelerate' | null>(null);
  const [isPlanLoading, setIsPlanLoading] = useState(true);

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

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  // Reorder categories with auto-save
  const handleReorderCategories = useCallback(async (newCategories: PortfolioCategoryWithPages[]) => {
    // Update local state immediately for responsive UI
    setState((prev) => ({ ...prev, categories: newCategories }));

    // Save to API
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
      // Refetch to restore correct order on error
      fetchPortfolio();
    }
  }, [fetchPortfolio]);

  // Reorder pages within a category or move between categories
  const handleReorderPages = useCallback(async (
    categoryId: string,
    newPages: PortfolioPage[],
    targetCategoryId?: string
  ) => {
    // Update local state immediately
    setState((prev) => {
      const newCategories = prev.categories.map((cat) => {
        if (cat.id === categoryId) {
          return { ...cat, pages: newPages };
        }
        return cat;
      });
      return { ...prev, categories: newCategories };
    });

    // Save to API
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

  // DnD handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const id = active.id as string;
    
    // Determine if dragging a category or page
    if (state.categories.some((c) => c.id === id)) {
      setActiveDragType('category');
    } else {
      setActiveDragType('page');
    }
    setActiveDragId(id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    setActiveDragType(null);

    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Handle category reordering
    if (activeDragType === 'category') {
      const oldIndex = state.categories.findIndex((c) => c.id === activeId);
      const newIndex = state.categories.findIndex((c) => c.id === overId);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newCategories = arrayMove(state.categories, oldIndex, newIndex);
        handleReorderCategories(newCategories);
      }
    }
    
    // Handle page reordering within same category
    if (activeDragType === 'page') {
      // Find which category contains the active page
      let sourceCategory: PortfolioCategoryWithPages | undefined;
      let targetCategory: PortfolioCategoryWithPages | undefined;
      
      for (const cat of state.categories) {
        if (cat.pages.some((p) => p.id === activeId)) {
          sourceCategory = cat;
        }
        if (cat.pages.some((p) => p.id === overId) || cat.id === overId) {
          targetCategory = cat;
        }
      }

      if (sourceCategory && targetCategory) {
        if (sourceCategory.id === targetCategory.id) {
          // Reorder within same category
          const oldIndex = sourceCategory.pages.findIndex((p) => p.id === activeId);
          const newIndex = sourceCategory.pages.findIndex((p) => p.id === overId);
          
          if (oldIndex !== -1 && newIndex !== -1) {
            const newPages = arrayMove(sourceCategory.pages, oldIndex, newIndex);
            handleReorderPages(sourceCategory.id, newPages);
          }
        } else {
          // Move to different category
          const activePage = sourceCategory.pages.find((p) => p.id === activeId);
          if (activePage) {
            // Remove from source
            const newSourcePages = sourceCategory.pages.filter((p) => p.id !== activeId);
            
            // Add to target
            const targetIndex = targetCategory.pages.findIndex((p) => p.id === overId);
            const newTargetPages = [...targetCategory.pages];
            const insertIndex = targetIndex !== -1 ? targetIndex : newTargetPages.length;
            newTargetPages.splice(insertIndex, 0, { ...activePage, category_id: targetCategory.id });

            // Update both categories
            setState((prev) => ({
              ...prev,
              categories: prev.categories.map((cat) => {
                if (cat.id === sourceCategory!.id) {
                  return { ...cat, pages: newSourcePages };
                }
                if (cat.id === targetCategory!.id) {
                  return { ...cat, pages: newTargetPages };
                }
                return cat;
              }),
            }));

            // Save to API
            fetch('/api/portfolio/pages', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                pages: [
                  ...newSourcePages.map((p, i) => ({ id: p.id, display_order: i })),
                  ...newTargetPages.map((p, i) => ({ 
                    id: p.id, 
                    display_order: i,
                    category_id: targetCategory!.id === 'uncategorized' ? null : targetCategory!.id,
                  })),
                ],
              }),
            }).catch(() => {
              toast.error('Failed to move page');
              fetchPortfolio();
            });
          }
        }
      }
    }
  };

  // Loading state
  if (state.isLoading || isPlanLoading) {
    return (
      <>
        {/* Mobile fallback - shown only on mobile */}
        <DesktopOnlyFallback 
          featureName="Portfolio Editor"
          description="The Portfolio Editor requires a larger screen to create and edit your portfolio effectively. Please access this feature from a desktop or laptop computer."
          pageTitle="Portfolio Editor"
        />
        
        {/* Desktop loading state - hidden on mobile */}
        <div className="hidden md:flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      </>
    );
  }

  // No portfolio - show setup screen
  if (!state.portfolio) {
    return (
      <>
        {/* Mobile fallback - shown only on mobile */}
        <DesktopOnlyFallback 
          featureName="Portfolio Editor"
          description="The Portfolio Editor requires a larger screen to create and edit your portfolio effectively. Please access this feature from a desktop or laptop computer."
          pageTitle="Portfolio Editor"
        />
        
        {/* Desktop content - hidden on mobile */}
        <div className="hidden md:block">
          <SetupPortfolioScreen onComplete={fetchPortfolio} userPlan={userPlan} />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Mobile fallback - shown only on mobile */}
      <DesktopOnlyFallback 
        featureName="Portfolio Editor"
        description="The Portfolio Editor requires a larger screen to create and edit your portfolio effectively. Please access this feature from a desktop or laptop computer."
        pageTitle="Portfolio Editor"
      />
      
      {/* Desktop content - hidden on mobile */}
      <div className="hidden md:block min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Inline Profile Editor - Mimics Public Portfolio Header */}
        <InlineProfileEditor
          portfolio={state.portfolio}
          onUpdate={fetchPortfolio}
          isPublished={state.portfolio.is_published}
          onPublishToggle={handlePublishToggle}
          onOpenUrlSettings={() => setActiveModal({ type: 'settings' })}
        />

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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
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
                <SortableContext
                  items={state.categories.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {state.categories.map((category, index) => (
                    <SortableCategoryCard
                      key={category.id}
                      category={category}
                      index={index}
                      totalCategories={state.categories.length}
                      isExpanded={expandedCategories.has(category.id)}
                      onToggle={() => toggleCategory(category.id)}
                      onEdit={() => setActiveModal({ type: 'editCategory', category })}
                      onDelete={() => setActiveModal({ type: 'deleteCategory', category })}
                      onAddPage={() => setActiveModal({ type: 'createPage', categoryId: category.id })}
                      onEditPage={(page) => setActiveModal({ type: 'editPage', page })}
                      onDeletePage={(page) => setActiveModal({ type: 'deletePage', page })}
                      onPageClick={(page) => router.push(`/dashboard/portfolio/editor/${page.id}`)}
                      onMoveUp={() => handleMoveCategoryUp(category.id)}
                      onMoveDown={() => handleMoveCategoryDown(category.id)}
                      onMovePageUp={(pageId) => handleMovePageUp(category.id, pageId)}
                      onMovePageDown={(pageId) => handleMovePageDown(category.id, pageId)}
                    />
                  ))}
                </SortableContext>
              )}
            </div>
          </DndContext>
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

// Sortable Category Card wrapper
const SortableCategoryCard = ({
  category,
  index,
  totalCategories,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onAddPage,
  onEditPage,
  onDeletePage,
  onPageClick,
  onMoveUp,
  onMoveDown,
  onMovePageUp,
  onMovePageDown,
}: {
  category: PortfolioCategoryWithPages;
  index: number;
  totalCategories: number;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddPage: () => void;
  onEditPage: (page: PortfolioPage) => void;
  onDeletePage: (page: PortfolioPage) => void;
  onPageClick: (page: PortfolioPage) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMovePageUp: (pageId: string) => void;
  onMovePageDown: (pageId: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <CategoryCard
        category={category}
        index={index}
        totalCategories={totalCategories}
        isExpanded={isExpanded}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
        onAddPage={onAddPage}
        onEditPage={onEditPage}
        onDeletePage={onDeletePage}
        onPageClick={onPageClick}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onMovePageUp={onMovePageUp}
        onMovePageDown={onMovePageDown}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
};

const CategoryCard = ({
  category,
  index,
  totalCategories,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onAddPage,
  onEditPage,
  onDeletePage,
  onPageClick,
  onMoveUp,
  onMoveDown,
  onMovePageUp,
  onMovePageDown,
  dragHandleProps,
}: {
  category: PortfolioCategoryWithPages;
  index: number;
  totalCategories: number;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddPage: () => void;
  onEditPage: (page: PortfolioPage) => void;
  onDeletePage: (page: PortfolioPage) => void;
  onPageClick: (page: PortfolioPage) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMovePageUp: (pageId: string) => void;
  onMovePageDown: (pageId: string) => void;
  dragHandleProps?: Record<string, unknown>;
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const isUncategorized = category.id === 'uncategorized';
  const canMoveUp = index > 0;
  const canMoveDown = index < totalCategories - 1;

  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
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
          
          {/* Drag Handle */}
          <button
            {...dragHandleProps}
            className="cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
            type="button"
            aria-label="Drag to reorder category"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          {/* Arrow buttons for reordering */}
          <div className="flex flex-col">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              disabled={!canMoveUp}
              className={`rounded p-0.5 ${canMoveUp ? 'text-gray-400 hover:bg-gray-100 hover:text-gray-600' : 'cursor-not-allowed text-gray-200'}`}
              type="button"
              aria-label="Move category up"
            >
              <ChevronUp className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              disabled={!canMoveDown}
              className={`rounded p-0.5 ${canMoveDown ? 'text-gray-400 hover:bg-gray-100 hover:text-gray-600' : 'cursor-not-allowed text-gray-200'}`}
              type="button"
              aria-label="Move category down"
            >
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>

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
            <SortableContext
              items={category.pages.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="divide-y divide-gray-100">
                {category.pages.map((page, pageIndex) => (
                  <SortablePageRow
                    key={page.id}
                    page={page}
                    index={pageIndex}
                    totalPages={category.pages.length}
                    onClick={() => onPageClick(page)}
                    onEdit={() => onEditPage(page)}
                    onDelete={() => onDeletePage(page)}
                    onMoveUp={() => onMovePageUp(page.id)}
                    onMoveDown={() => onMovePageDown(page.id)}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      )}
    </div>
  );
};

// Sortable Page Row wrapper
const SortablePageRow = ({
  page,
  index,
  totalPages,
  onClick,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  page: PortfolioPage;
  index: number;
  totalPages: number;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <PageRow
        page={page}
        index={index}
        totalPages={totalPages}
        onClick={onClick}
        onEdit={onEdit}
        onDelete={onDelete}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
};

const PageRow = ({
  page,
  index,
  totalPages,
  onClick,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  dragHandleProps,
}: {
  page: PortfolioPage;
  index: number;
  totalPages: number;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  dragHandleProps?: Record<string, unknown>;
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const canMoveUp = index > 0;
  const canMoveDown = index < totalPages - 1;

  return (
    <div
      className="flex cursor-pointer items-center gap-4 p-4 pl-10 hover:bg-gray-50"
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      role="button"
      tabIndex={0}
    >
      {/* Drag Handle */}
      <button
        {...dragHandleProps}
        className="cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
        type="button"
        aria-label="Drag to reorder page"
      >
        <GripVertical className="h-4 w-4 flex-shrink-0" />
      </button>

      {/* Arrow buttons for reordering */}
      <div className="flex flex-col">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveUp();
          }}
          disabled={!canMoveUp}
          className={`rounded p-0.5 ${canMoveUp ? 'text-gray-400 hover:bg-gray-100 hover:text-gray-600' : 'cursor-not-allowed text-gray-200'}`}
          type="button"
          aria-label="Move page up"
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown();
          }}
          disabled={!canMoveDown}
          className={`rounded p-0.5 ${canMoveDown ? 'text-gray-400 hover:bg-gray-100 hover:text-gray-600' : 'cursor-not-allowed text-gray-200'}`}
          type="button"
          aria-label="Move page down"
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>

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
// Inline Profile Editor (Preview-Style)
// ============================================================================

interface InlineProfileEditorProps {
  portfolio: Portfolio;
  onUpdate: () => void;
  isPublished: boolean;
  onPublishToggle: () => void;
  onOpenUrlSettings: () => void;
}

const InlineProfileEditor = ({
  portfolio,
  onUpdate,
  isPublished,
  onPublishToggle,
  onOpenUrlSettings,
}: InlineProfileEditorProps) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    display_name: portfolio.display_name,
    subtitle: portfolio.subtitle || '',
    bio: portfolio.bio || '',
    profile_image_url: portfolio.profile_image_url || '',
    social_links: portfolio.social_links || {},
  });
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Update local state when portfolio changes
  useEffect(() => {
    setFormData({
      display_name: portfolio.display_name,
      subtitle: portfolio.subtitle || '',
      bio: portfolio.bio || '',
      profile_image_url: portfolio.profile_image_url || '',
      social_links: portfolio.social_links || {},
    });
  }, [portfolio]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingField && inputRef.current) {
      inputRef.current.focus();
      if ('select' in inputRef.current) {
        inputRef.current.select();
      }
    }
  }, [editingField]);

  const handleSave = async (field: string, value: string | Record<string, string | undefined>) => {
    // Validate subtitle is not empty
    if (field === 'subtitle' && (!value || (typeof value === 'string' && !value.trim()))) {
      toast.error('Subtitle is required. Your portfolio displays as "[Name] is a [subtitle]"');
      // Don't close editing field so user can fix it
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/portfolio/manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update');
      }

      toast.success('Saved!');
      onUpdate();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save');
      // Revert on error
      setFormData((prev) => ({
        ...prev,
        [field]: portfolio[field as keyof Portfolio] || '',
      }));
    } finally {
      setIsSaving(false);
      setEditingField(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: string, value: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave(field, value);
    } else if (e.key === 'Escape') {
      setEditingField(null);
      setFormData((prev) => ({
        ...prev,
        [field]: portfolio[field as keyof Portfolio] || '',
      }));
    }
  };

  const handleSocialLinkSave = async (platform: string, value: string) => {
    const newSocialLinks = { ...formData.social_links, [platform]: value };
    setFormData((prev) => ({ ...prev, social_links: newSocialLinks }));
    await handleSave('social_links', newSocialLinks);
  };

  const socialLinks = formData.social_links as Record<string, string>;

  return (
    <div className="border-b border-gray-100 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto max-w-5xl px-6 py-8 md:py-10">
        {/* Top Actions Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onOpenUrlSettings}
            className="group flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-gray-500 transition-all hover:bg-purple-50 hover:text-purple-600"
            type="button"
            aria-label="Edit portfolio URL"
          >
            <Globe className="h-4 w-4" />
            <span className="group-hover:underline">productcareerlyst.com/p/{portfolio.slug}</span>
            <Pencil className="h-3 w-3 text-gray-400 transition-colors group-hover:text-purple-600" />
          </button>
          
          <div className="flex items-center gap-3">
            {/* Publish Toggle */}
            <button
              onClick={onPublishToggle}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                isPublished
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              type="button"
              aria-label={isPublished ? 'Unpublish portfolio' : 'Publish portfolio'}
            >
              {isPublished ? (
                <>
                  <Eye className="h-4 w-4" />
                  <span>Published</span>
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4" />
                  <span>Draft</span>
                </>
              )}
            </button>

            {/* Preview (always visible) */}
            <a
              href={`/p/${portfolio.slug}?preview=true`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg bg-amber-100 px-4 py-2 text-sm font-medium text-amber-700 transition-all hover:bg-amber-200"
            >
              <Eye className="h-4 w-4" />
              <span>Preview</span>
            </a>

            {/* View Live (only when published) */}
            {isPublished && (
              <a
                href={`/p/${portfolio.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-purple-100 px-4 py-2 text-sm font-medium text-purple-700 transition-all hover:bg-purple-200"
              >
                <ExternalLink className="h-4 w-4" />
                <span>View Live</span>
              </a>
            )}
          </div>
        </div>

        {/* Profile Preview Section - Mimics Public Portfolio */}
        <div className="flex flex-col items-center text-center md:flex-row md:items-start md:text-left">
          {/* Profile Image - Editable */}
          <div className="group relative mb-6 md:mb-0 md:mr-8">
            {formData.profile_image_url ? (
              <img
                src={formData.profile_image_url}
                alt={formData.display_name}
                className="h-28 w-28 rounded-full object-cover shadow-lg ring-4 ring-white"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-4xl font-bold text-white shadow-lg ring-4 ring-white">
                {formData.display_name.charAt(0).toUpperCase()}
              </div>
            )}
            {/* Edit Overlay */}
            <button
              onClick={() => setEditingField('profile_image_url')}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
              type="button"
              aria-label="Change profile image"
            >
              <Camera className="h-6 w-6 text-white" />
            </button>
          </div>

          {/* Info Section */}
          <div className="flex-1 space-y-3">
            {/* Name + Subtitle Display with "is a" pattern */}
            {editingField === 'display_name' || editingField === 'subtitle' ? (
              <div className="space-y-3">
                {/* Display Name Input */}
                {editingField === 'display_name' ? (
                  <input
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, display_name: e.target.value }))}
                    onBlur={() => handleSave('display_name', formData.display_name)}
                    onKeyDown={(e) => handleKeyDown(e, 'display_name', formData.display_name)}
                    className="w-full rounded-lg border-2 border-purple-400 bg-white px-3 py-2 text-3xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-200 md:text-4xl"
                    placeholder="Your Name"
                  />
                ) : (
                  <button
                    onClick={() => setEditingField('display_name')}
                    className="group/name flex w-full items-center justify-center gap-2 text-left md:justify-start"
                    type="button"
                  >
                    <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
                      {formData.display_name || 'Add your name'}
                    </h1>
                    <Pencil className="h-4 w-4 text-gray-300 opacity-0 transition-opacity group-hover/name:opacity-100" />
                  </button>
                )}
                
                {/* Subtitle Input */}
                {editingField === 'subtitle' ? (
                  <div>
                    <p className="mb-2 text-xs text-gray-500">
                      Your portfolio will display: &quot;{formData.display_name} is a [subtitle]&quot;
                    </p>
                    <input
                      ref={inputRef as React.RefObject<HTMLInputElement>}
                      type="text"
                      value={formData.subtitle}
                      onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
                      onBlur={() => handleSave('subtitle', formData.subtitle)}
                      onKeyDown={(e) => handleKeyDown(e, 'subtitle', formData.subtitle)}
                      className="w-full rounded-lg border-2 border-purple-400 bg-white px-3 py-2 text-lg text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-200"
                      placeholder="Senior Product Manager in New York City"
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingField('subtitle')}
                    className="group/subtitle flex w-full items-center justify-center gap-2 text-left md:justify-start"
                    type="button"
                  >
                    <p className="text-lg text-gray-600">
                      is a {formData.subtitle ? `${formData.subtitle.charAt(0).toLowerCase()}${formData.subtitle.slice(1)}` : '...'}
                      {formData.subtitle && !formData.subtitle.endsWith('.') && '.'}
                    </p>
                    <Pencil className="h-3 w-3 text-gray-300 opacity-0 transition-opacity group-hover/subtitle:opacity-100" />
                  </button>
                )}
              </div>
            ) : (
              /* Combined Display View - shows "[Name] is a [subtitle]" pattern */
              <div className="space-y-1">
                <h1 className="text-3xl leading-tight text-gray-900 md:text-4xl">
                  <button
                    onClick={() => setEditingField('display_name')}
                    className="group/name inline"
                    type="button"
                  >
                    <span className="font-bold">{formData.display_name || 'Add your name'}</span>
                    <Pencil className="ml-2 inline h-4 w-4 text-gray-300 opacity-0 transition-opacity group-hover/name:opacity-100" />
                  </button>
                  <button
                    onClick={() => setEditingField('subtitle')}
                    className="group/subtitle inline"
                    type="button"
                  >
                    <span className="font-normal">
                      {' '}is a {formData.subtitle ? `${formData.subtitle.charAt(0).toLowerCase()}${formData.subtitle.slice(1)}` : '...'}
                      {formData.subtitle && !formData.subtitle.endsWith('.') && '.'}
                    </span>
                    <Pencil className="ml-2 inline h-3 w-3 text-gray-300 opacity-0 transition-opacity group-hover/subtitle:opacity-100" />
                  </button>
                </h1>
                {!formData.subtitle && (
                  <p className="text-sm text-amber-600">
                    ⚠️ Subtitle is required. Click to add one.
                  </p>
                )}
              </div>
            )}

            {/* Bio - Editable */}
            {editingField === 'bio' ? (
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                value={formData.bio}
                onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                onBlur={() => handleSave('bio', formData.bio)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setEditingField(null);
                    setFormData((prev) => ({ ...prev, bio: portfolio.bio || '' }));
                  }
                }}
                className="w-full rounded-lg border-2 border-purple-400 bg-white px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-200"
                rows={8}
                placeholder="Tell visitors about yourself... (Press Enter for new lines)"
              />
            ) : (
              <button
                onClick={() => setEditingField('bio')}
                className="group/bio flex w-full items-start justify-center gap-2 text-left md:justify-start"
                type="button"
              >
                <div className={`max-w-2xl ${formData.bio ? 'text-gray-600' : 'text-gray-400 italic'}`}>
                  {formData.bio ? (
                    <>
                      <p className="line-clamp-2 whitespace-pre-wrap">{formData.bio}</p>
                      {formData.bio.split('\n').length > 2 || formData.bio.length > 200 ? (
                        <span className="mt-1 inline-block text-sm text-purple-500 hover:text-purple-600">
                          Click to see more...
                        </span>
                      ) : null}
                    </>
                  ) : (
                    'Add a bio...'
                  )}
                </div>
                <Pencil className="mt-1 h-3 w-3 flex-shrink-0 text-gray-300 opacity-0 transition-opacity group-hover/bio:opacity-100" />
              </button>
            )}

            {/* Social Links - Inline Editable */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2 md:justify-start">
              <SocialLinkEditor
                platform="linkedin"
                icon={<Linkedin className="h-5 w-5" />}
                value={socialLinks.linkedin || ''}
                onSave={(value) => handleSocialLinkSave('linkedin', value)}
                placeholder="LinkedIn URL"
              />
              <SocialLinkEditor
                platform="twitter"
                icon={<Twitter className="h-5 w-5" />}
                value={socialLinks.twitter || ''}
                onSave={(value) => handleSocialLinkSave('twitter', value)}
                placeholder="Twitter URL"
              />
              <SocialLinkEditor
                platform="github"
                icon={<Github className="h-5 w-5" />}
                value={socialLinks.github || ''}
                onSave={(value) => handleSocialLinkSave('github', value)}
                placeholder="GitHub URL"
              />
              <SocialLinkEditor
                platform="youtube"
                icon={<Youtube className="h-5 w-5" />}
                value={socialLinks.youtube || ''}
                onSave={(value) => handleSocialLinkSave('youtube', value)}
                placeholder="YouTube URL"
              />
              <SocialLinkEditor
                platform="substack"
                icon={<SubstackIcon className="h-5 w-5" />}
                value={socialLinks.substack || ''}
                onSave={(value) => handleSocialLinkSave('substack', value)}
                placeholder="Substack URL"
              />
              <SocialLinkEditor
                platform="website"
                icon={<Globe className="h-5 w-5" />}
                value={socialLinks.website || ''}
                onSave={(value) => handleSocialLinkSave('website', value)}
                placeholder="Website URL"
              />
              <SocialLinkEditor
                platform="email"
                icon={<Mail className="h-5 w-5" />}
                value={socialLinks.email || ''}
                onSave={(value) => handleSocialLinkSave('email', value)}
                placeholder="Email address"
              />
            </div>
          </div>
        </div>

        {/* Profile Image Upload Modal */}
        {editingField === 'profile_image_url' && (
          <ProfileImageUploadModal
            currentUrl={formData.profile_image_url}
            onSave={(url) => {
              setFormData((prev) => ({ ...prev, profile_image_url: url }));
              handleSave('profile_image_url', url);
              setEditingField(null);
            }}
            onClose={() => setEditingField(null)}
          />
        )}

        {isSaving && (
          <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm text-white shadow-lg">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </div>
        )}
      </div>
    </div>
  );
};

// Social Link Editor Component
const SocialLinkEditor = ({
  platform,
  icon,
  value,
  onSave,
  placeholder,
}: {
  platform: string;
  icon: React.ReactNode;
  value: string;
  onSave: (value: string) => void;
  placeholder: string;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (inputValue !== value) {
      onSave(inputValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setInputValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-purple-600">{icon}</span>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="w-48 rounded-lg border-2 border-purple-400 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
          placeholder={placeholder}
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
        value
          ? 'bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-600'
          : 'border-2 border-dashed border-gray-300 text-gray-400 hover:border-purple-400 hover:text-purple-500'
      }`}
      type="button"
      aria-label={`${value ? 'Edit' : 'Add'} ${platform}`}
      title={value ? `Edit ${platform}: ${value}` : `Add ${platform}`}
    >
      {icon}
    </button>
  );
};

// ============================================================================
// Setup Portfolio Screen
// ============================================================================

const SetupPortfolioScreen = ({ onComplete, userPlan }: { onComplete: () => void; userPlan: 'learn' | 'accelerate' | null }) => {
  const [formData, setFormData] = useState({
    display_name: '',
    slug: '',
    subtitle: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [showPremiumGate, setShowPremiumGate] = useState(false);

  // Load user profile to pre-fill form
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const data = await response.json();
          const firstName = data.first_name || '';
          const lastName = data.last_name || '';
          
          if (firstName || lastName) {
            const fullName = [firstName, lastName].filter(Boolean).join(' ');
            const suggestedSlug = fullName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9-_]/g, '');
            
            setFormData({
              display_name: fullName,
              slug: suggestedSlug,
              subtitle: '',
            });
            
            // Check if the suggested slug is available
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

    loadUserProfile();
  }, []);

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
    if (!formData.display_name || !formData.slug || !formData.subtitle || slugStatus === 'taken') return;

    // Check if user has Accelerate plan
    if (userPlan !== 'accelerate') {
      setShowPremiumGate(true);
      return;
    }

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

  if (isLoadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-500" />
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-4xl shadow-lg">
            🎨
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-800">Create a Product Portfolio</h1>
          <p className="text-gray-600">
            Stand out in the competitive market with a professional portfolio showcasing your experience and case studies.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl bg-white p-8 shadow-xl">
          {/* Live Preview */}
          {(formData.display_name || formData.subtitle) && (
            <div className="rounded-xl bg-gradient-to-br from-slate-50 to-purple-50 p-6 text-center">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">Preview</p>
              <h2 className="text-2xl leading-tight text-gray-900">
                <span className="font-bold">{formData.display_name || 'Your Name'}</span>
                <span className="font-normal">
                  {' '}is a {formData.subtitle ? `${formData.subtitle.charAt(0).toLowerCase()}${formData.subtitle.slice(1)}` : '...'}
                  {formData.subtitle && !formData.subtitle.endsWith('.') && '.'}
                </span>
              </h2>
            </div>
          )}

          {/* Display Name */}
          <div>
            <label htmlFor="display_name" className="mb-1 block text-sm font-medium text-gray-700">
              Portfolio Title (Your Name) *
            </label>
            <p className="mb-2 text-xs text-gray-500">This will be displayed as the main title of your portfolio</p>
            <input
              id="display_name"
              type="text"
              value={formData.display_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, display_name: e.target.value }))}
              placeholder="Enter your full name"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              required
            />
          </div>

          {/* Subtitle */}
          <div>
            <label htmlFor="subtitle" className="mb-1 block text-sm font-medium text-gray-700">
              Subtitle *
            </label>
            <p className="mb-2 text-xs text-gray-500">
              Your portfolio will display: &quot;{formData.display_name || 'Your Name'} is a [subtitle]&quot;
            </p>
            <input
              id="subtitle"
              type="text"
              value={formData.subtitle}
              onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
              placeholder="Senior Product Manager in New York City"
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

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || !formData.display_name || !formData.slug || !formData.subtitle || slugStatus === 'taken'}
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
                Start Editing Portfolio
              </>
            )}
          </button>
        </form>
      </div>

      {/* Premium Feature Gate Modal */}
      <PremiumFeatureGateModal
        isOpen={showPremiumGate}
        onClose={() => setShowPremiumGate(false)}
        featureName="Product Portfolio"
        featureDescription="Create a professional product portfolio to showcase your experience and case studies. This feature is available exclusively for Accelerate plan subscribers."
        currentPlan={userPlan}
        requiresAccelerate={true}
      />
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
  const [slug, setSlug] = useState(portfolio.slug);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'same'>('same');

  const checkSlug = async (newSlug: string) => {
    if (!newSlug) {
      setSlugStatus('idle');
      return;
    }
    
    if (newSlug === portfolio.slug) {
      setSlugStatus('same');
      return;
    }

    setSlugStatus('checking');
    try {
      const response = await fetch(`/api/portfolio/manage/check-slug?slug=${newSlug}`);
      const data = await response.json();
      setSlugStatus(data.available ? 'available' : 'taken');
    } catch {
      setSlugStatus('idle');
    }
  };

  const handleSlugChange = (value: string) => {
    const formatted = value.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    setSlug(formatted);
    checkSlug(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || slugStatus === 'taken') return;
    
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/portfolio/manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update');
      }

      toast.success('URL updated!');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update URL');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalWrapper title="Portfolio URL" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="settings_slug" className="mb-1 block text-sm font-medium text-gray-700">
            Portfolio URL
          </label>
          <div className="flex items-center">
            <span className="rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500">
              productcareerlyst.com/p/
            </span>
            <input
              id="settings_slug"
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              className="w-full rounded-r-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
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
            {slugStatus === 'same' && (
              <span className="text-gray-500">Current URL</span>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            This is the unique URL for your portfolio. Changing it will update all links.
          </p>
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
            disabled={isSubmitting || slugStatus === 'taken' || slugStatus === 'same'}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 px-4 py-2 font-medium text-white hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Update URL
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
