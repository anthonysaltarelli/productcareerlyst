'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
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
  FolderPlus,
  FileText,
  Globe,
  Pencil,
  GripVertical,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  MoreHorizontal,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import {
  PortfolioCategory,
  PortfolioPage,
  PortfolioCategoryWithPages,
} from '@/lib/types/portfolio';

// ============================================================================
// Types
// ============================================================================

interface ContentSectionProps {
  categories: PortfolioCategoryWithPages[];
  expandedCategories: Set<string>;
  onToggleCategory: (categoryId: string) => void;
  onCreateCategory: () => void;
  onEditCategory: (category: PortfolioCategory) => void;
  onDeleteCategory: (category: PortfolioCategory) => void;
  onCreatePage: (categoryId?: string) => void;
  onEditPage: (page: PortfolioPage) => void;
  onDeletePage: (page: PortfolioPage) => void;
  onPageClick: (page: PortfolioPage) => void;
  onReorderCategories: (categories: PortfolioCategoryWithPages[]) => void;
  onReorderPages: (categoryId: string, pages: PortfolioPage[], targetCategoryId?: string) => void;
  onMoveCategoryUp: (categoryId: string) => void;
  onMoveCategoryDown: (categoryId: string) => void;
  onMovePageUp: (categoryId: string, pageId: string) => void;
  onMovePageDown: (categoryId: string, pageId: string) => void;
}

// ============================================================================
// Main Component
// ============================================================================

export const ContentSection = ({
  categories,
  expandedCategories,
  onToggleCategory,
  onCreateCategory,
  onEditCategory,
  onDeleteCategory,
  onCreatePage,
  onEditPage,
  onDeletePage,
  onPageClick,
  onReorderCategories,
  onReorderPages,
  onMoveCategoryUp,
  onMoveCategoryDown,
  onMovePageUp,
  onMovePageDown,
}: ContentSectionProps) => {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragType, setActiveDragType] = useState<'category' | 'page' | null>(null);

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

  // Calculate stats
  const totalCategories = categories.filter((c) => c.id !== 'uncategorized').length;
  const totalPages = categories.reduce((acc, c) => acc + c.pages.length, 0);
  const publishedPages = categories.reduce(
    (acc, c) => acc + c.pages.filter((p) => p.is_published).length,
    0
  );
  const draftPages = totalPages - publishedPages;

  // DnD handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const id = active.id as string;
    
    if (categories.some((c) => c.id === id)) {
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
      const oldIndex = categories.findIndex((c) => c.id === activeId);
      const newIndex = categories.findIndex((c) => c.id === overId);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newCategories = arrayMove(categories, oldIndex, newIndex);
        onReorderCategories(newCategories);
      }
    }
    
    // Handle page reordering
    if (activeDragType === 'page') {
      let sourceCategory: PortfolioCategoryWithPages | undefined;
      let targetCategory: PortfolioCategoryWithPages | undefined;
      
      for (const cat of categories) {
        if (cat.pages.some((p) => p.id === activeId)) {
          sourceCategory = cat;
        }
        if (cat.pages.some((p) => p.id === overId) || cat.id === overId) {
          targetCategory = cat;
        }
      }

      if (sourceCategory && targetCategory && sourceCategory.id === targetCategory.id) {
        const oldIndex = sourceCategory.pages.findIndex((p) => p.id === activeId);
        const newIndex = sourceCategory.pages.findIndex((p) => p.id === overId);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          const newPages = arrayMove(sourceCategory.pages, oldIndex, newIndex);
          onReorderPages(sourceCategory.id, newPages);
        }
      }
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 md:p-8">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Content</h2>
        <p className="mt-1 text-gray-500">Manage your case studies, categories, and pages</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Categories"
          value={totalCategories}
          icon={<FolderPlus className="h-5 w-5" />}
        />
        <StatCard
          label="Pages"
          value={totalPages}
          icon={<FileText className="h-5 w-5" />}
        />
        <StatCard
          label="Published"
          value={publishedPages}
          icon={<Globe className="h-5 w-5" />}
        />
        <StatCard
          label="Drafts"
          value={draftPages}
          icon={<Pencil className="h-5 w-5" />}
        />
      </div>

      {/* Actions Bar */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onCreateCategory}
          className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 transition-all hover:bg-gray-50 hover:shadow"
          type="button"
        >
          <FolderPlus className="h-4 w-4" />
          New Category
        </button>
        <button
          onClick={() => onCreatePage()}
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
          {categories.length === 0 ? (
            <EmptyState onCreateCategory={onCreateCategory} />
          ) : (
            <SortableContext
              items={categories.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {categories.map((category, index) => (
                <SortableCategoryCard
                  key={category.id}
                  category={category}
                  index={index}
                  totalCategories={categories.length}
                  isExpanded={expandedCategories.has(category.id)}
                  onToggle={() => onToggleCategory(category.id)}
                  onEdit={() => onEditCategory(category)}
                  onDelete={() => onDeleteCategory(category)}
                  onAddPage={() => onCreatePage(category.id)}
                  onEditPage={onEditPage}
                  onDeletePage={onDeletePage}
                  onPageClick={onPageClick}
                  onMoveUp={() => onMoveCategoryUp(category.id)}
                  onMoveDown={() => onMoveCategoryDown(category.id)}
                  onMovePageUp={(pageId) => onMovePageUp(category.id, pageId)}
                  onMovePageDown={(pageId) => onMovePageDown(category.id, pageId)}
                />
              ))}
            </SortableContext>
          )}
        </div>
      </DndContext>
    </div>
  );
};

// ============================================================================
// Stat Card Component
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

// ============================================================================
// Empty State Component
// ============================================================================

const EmptyState = ({ onCreateCategory }: { onCreateCategory: () => void }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-3xl">
      📁
    </div>
    <h3 className="mb-2 text-lg font-semibold text-gray-800">No categories yet</h3>
    <p className="mb-6 max-w-md text-gray-500">
      Create your first category to organize your portfolio pages
    </p>
    <button
      onClick={onCreateCategory}
      className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white shadow-sm transition-all hover:from-purple-600 hover:to-pink-600"
      type="button"
    >
      <FolderPlus className="h-5 w-5" />
      Create Category
    </button>
  </div>
);

// ============================================================================
// Sortable Category Card
// ============================================================================

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

// ============================================================================
// Category Card Component
// ============================================================================

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

// ============================================================================
// Sortable Page Row
// ============================================================================

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

// ============================================================================
// Page Row Component
// ============================================================================

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

export default ContentSection;





