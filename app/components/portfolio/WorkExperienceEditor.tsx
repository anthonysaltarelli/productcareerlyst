'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Briefcase,
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Download,
  Pencil,
  X,
  Check,
  Loader2,
  FileText,
  Link2,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
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
import { PortfolioWorkExperience } from '@/lib/types/portfolio';

// ============================================================================
// Types
// ============================================================================

interface ResumeVersion {
  id: string;
  name: string;
  is_master: boolean;
  experience_count: number;
  created_at: string;
  updated_at: string;
}

interface WorkExperienceEditorProps {
  workExperience: PortfolioWorkExperience[];
  onUpdate: (workExperience: PortfolioWorkExperience[]) => Promise<void>;
  isCollapsed?: boolean;
  showWorkExperience: boolean;
  onToggleVisibility: (show: boolean) => Promise<void>;
}

// ============================================================================
// Main Component
// ============================================================================

export const WorkExperienceEditor = ({
  workExperience,
  onUpdate,
  isCollapsed = false,
  showWorkExperience,
  onToggleVisibility,
}: WorkExperienceEditorProps) => {
  const [experiences, setExperiences] = useState<PortfolioWorkExperience[]>(workExperience);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!isCollapsed);
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);

  const handleToggleVisibility = async () => {
    setIsTogglingVisibility(true);
    try {
      await onToggleVisibility(!showWorkExperience);
      toast.success(showWorkExperience ? 'Work experience hidden from portfolio' : 'Work experience visible on portfolio');
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast.error('Failed to update visibility');
    } finally {
      setIsTogglingVisibility(false);
    }
  };

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

  // Sync with prop changes
  useEffect(() => {
    setExperiences(workExperience);
  }, [workExperience]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await onUpdate(experiences);
      setHasUnsavedChanges(false);
      toast.success('Work experience saved!');
    } catch (error) {
      console.error('Error saving work experience:', error);
      toast.error('Failed to save work experience');
    } finally {
      setIsSaving(false);
    }
  }, [experiences, onUpdate]);

  const handleAddExperience = (exp: PortfolioWorkExperience) => {
    const newExperiences = [
      ...experiences,
      { ...exp, display_order: experiences.length },
    ];
    setExperiences(newExperiences);
    setHasUnsavedChanges(true);
    setShowAddForm(false);
  };

  const handleUpdateExperience = (index: number, updated: PortfolioWorkExperience) => {
    const newExperiences = [...experiences];
    newExperiences[index] = updated;
    setExperiences(newExperiences);
    setHasUnsavedChanges(true);
  };

  const handleDeleteExperience = (index: number) => {
    const newExperiences = experiences
      .filter((_, i) => i !== index)
      .map((exp, i) => ({ ...exp, display_order: i }));
    setExperiences(newExperiences);
    setHasUnsavedChanges(true);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newExperiences = arrayMove(experiences, index, index - 1).map((exp, i) => ({
      ...exp,
      display_order: i,
    }));
    setExperiences(newExperiences);
    setHasUnsavedChanges(true);
  };

  const handleMoveDown = (index: number) => {
    if (index >= experiences.length - 1) return;
    const newExperiences = arrayMove(experiences, index, index + 1).map((exp, i) => ({
      ...exp,
      display_order: i,
    }));
    setExperiences(newExperiences);
    setHasUnsavedChanges(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = experiences.findIndex((_, i) => `exp-${i}` === active.id);
    const newIndex = experiences.findIndex((_, i) => `exp-${i}` === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newExperiences = arrayMove(experiences, oldIndex, newIndex).map((exp, i) => ({
        ...exp,
        display_order: i,
      }));
      setExperiences(newExperiences);
      setHasUnsavedChanges(true);
    }
  };

  const handleImportComplete = (imported: PortfolioWorkExperience[]) => {
    setExperiences(imported);
    setHasUnsavedChanges(true);
    setShowImportModal(false);
    toast.success(`Imported ${imported.length} work experiences`);
  };

  const currentExperiences = experiences.filter((exp) => exp.is_current);
  const previousExperiences = experiences.filter((exp) => !exp.is_current);

  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-50"
        type="button"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Work Experience</h3>
            <p className="text-sm text-gray-500">
              {experiences.length === 0
                ? 'Add your career history'
                : `${experiences.length} position${experiences.length === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              Unsaved
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-4">
          {/* Visibility Toggle */}
          <div className="mb-4 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="flex items-center gap-2">
              {showWorkExperience ? (
                <Eye className="h-4 w-4 text-green-600" />
              ) : (
                <EyeOff className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm font-medium text-gray-700">
                {showWorkExperience ? 'Visible on portfolio' : 'Hidden from portfolio'}
              </span>
            </div>
            <button
              onClick={handleToggleVisibility}
              disabled={isTogglingVisibility}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                showWorkExperience ? 'bg-green-500' : 'bg-gray-300'
              }`}
              type="button"
              role="switch"
              aria-checked={showWorkExperience}
              aria-label="Toggle work experience visibility"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  showWorkExperience ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              type="button"
            >
              <Download className="h-4 w-4" />
              Import from Resume
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              type="button"
            >
              <Plus className="h-4 w-4" />
              Add Manually
            </button>
          </div>

          {/* Experience List */}
          {experiences.length === 0 ? (
            <EmptyState onImport={() => setShowImportModal(true)} onAdd={() => setShowAddForm(true)} />
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="space-y-6">
                {/* Current Section */}
                {currentExperiences.length > 0 && (
                  <div>
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Now
                    </h4>
                    <SortableContext
                      items={experiences.map((_, i) => `exp-${i}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {experiences.map((exp, index) =>
                          exp.is_current ? (
                            <SortableExperienceRow
                              key={`exp-${index}`}
                              id={`exp-${index}`}
                              experience={exp}
                              index={index}
                              totalCount={experiences.length}
                              onUpdate={(updated) => handleUpdateExperience(index, updated)}
                              onDelete={() => handleDeleteExperience(index)}
                              onMoveUp={() => handleMoveUp(index)}
                              onMoveDown={() => handleMoveDown(index)}
                            />
                          ) : null
                        )}
                      </div>
                    </SortableContext>
                  </div>
                )}

                {/* Previous Section */}
                {previousExperiences.length > 0 && (
                  <div>
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Previously
                    </h4>
                    <SortableContext
                      items={experiences.map((_, i) => `exp-${i}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {experiences.map((exp, index) =>
                          !exp.is_current ? (
                            <SortableExperienceRow
                              key={`exp-${index}`}
                              id={`exp-${index}`}
                              experience={exp}
                              index={index}
                              totalCount={experiences.length}
                              onUpdate={(updated) => handleUpdateExperience(index, updated)}
                              onDelete={() => handleDeleteExperience(index)}
                              onMoveUp={() => handleMoveUp(index)}
                              onMoveDown={() => handleMoveDown(index)}
                            />
                          ) : null
                        )}
                      </div>
                    </SortableContext>
                  </div>
                )}
              </div>
            </DndContext>
          )}

          {/* Save Button */}
          {hasUnsavedChanges && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                type="button"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Form Modal */}
      {showAddForm && (
        <AddExperienceModal
          onAdd={handleAddExperience}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportModal
          onImport={handleImportComplete}
          onClose={() => setShowImportModal(false)}
        />
      )}
    </div>
  );
};

// ============================================================================
// Sub Components
// ============================================================================

const EmptyState = ({
  onImport,
  onAdd,
}: {
  onImport: () => void;
  onAdd: () => void;
}) => (
  <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
      <Briefcase className="h-6 w-6 text-gray-400" />
    </div>
    <h4 className="mb-2 font-medium text-gray-700">No work experience yet</h4>
    <p className="mb-4 text-sm text-gray-500">
      Add your career history to showcase on your portfolio
    </p>
    <div className="flex flex-wrap justify-center gap-2">
      <button
        onClick={onImport}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        type="button"
      >
        <Download className="h-4 w-4" />
        Import from Resume
      </button>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        type="button"
      >
        <Plus className="h-4 w-4" />
        Add Manually
      </button>
    </div>
  </div>
);

// Sortable Experience Row
const SortableExperienceRow = ({
  id,
  experience,
  index,
  totalCount,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  id: string;
  experience: PortfolioWorkExperience;
  index: number;
  totalCount: number;
  onUpdate: (updated: PortfolioWorkExperience) => void;
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
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ExperienceRow
        experience={experience}
        index={index}
        totalCount={totalCount}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
};

const ExperienceRow = ({
  experience,
  index,
  totalCount,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  dragHandleProps,
}: {
  experience: PortfolioWorkExperience;
  index: number;
  totalCount: number;
  onUpdate: (updated: PortfolioWorkExperience) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  dragHandleProps?: Record<string, unknown>;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(experience);

  const canMoveUp = index > 0;
  const canMoveDown = index < totalCount - 1;

  const handleSaveEdit = () => {
    if (!editData.company.trim() || !editData.title.trim()) {
      toast.error('Company and title are required');
      return;
    }
    onUpdate(editData);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditData(experience);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Company</label>
            <input
              type="text"
              value={editData.company}
              onChange={(e) => setEditData({ ...editData, company: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Company name"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              <span className="flex items-center gap-1">
                <Link2 className="h-3 w-3" />
                Company URL (optional)
              </span>
            </label>
            <input
              type="url"
              value={editData.company_url || ''}
              onChange={(e) => setEditData({ ...editData, company_url: e.target.value || undefined })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="https://company.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Title</label>
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Job title"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editData.is_current}
                onChange={(e) => setEditData({ ...editData, is_current: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">This is my current position</span>
            </label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              type="button"
            >
              <Check className="h-3.5 w-3.5" />
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              type="button"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:bg-gray-50">
      {/* Drag Handle */}
      <button
        {...dragHandleProps}
        className="cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing"
        type="button"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Move Arrows */}
      <div className="flex flex-col">
        <button
          onClick={onMoveUp}
          disabled={!canMoveUp}
          className={`rounded p-0.5 ${
            canMoveUp ? 'text-gray-400 hover:bg-gray-100 hover:text-gray-600' : 'cursor-not-allowed text-gray-200'
          }`}
          type="button"
          aria-label="Move up"
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={!canMoveDown}
          className={`rounded p-0.5 ${
            canMoveDown ? 'text-gray-400 hover:bg-gray-100 hover:text-gray-600' : 'cursor-not-allowed text-gray-200'
          }`}
          type="button"
          aria-label="Move down"
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-800">{experience.company}</span>
          {experience.company_url && (
            <Link2 className="h-3.5 w-3.5 text-blue-500" />
          )}
          {experience.is_current && (
            <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
              Current
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500">{experience.title}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-1">
        <button
          onClick={() => setIsEditing(true)}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          type="button"
          aria-label="Edit experience"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
          type="button"
          aria-label="Delete experience"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Add Experience Modal
const AddExperienceModal = ({
  onAdd,
  onClose,
}: {
  onAdd: (exp: PortfolioWorkExperience) => void;
  onClose: () => void;
}) => {
  const [formData, setFormData] = useState({
    company: '',
    company_url: '',
    title: '',
    is_current: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company.trim() || !formData.title.trim()) {
      toast.error('Company and title are required');
      return;
    }
    onAdd({
      company: formData.company.trim(),
      company_url: formData.company_url.trim() || undefined,
      title: formData.title.trim(),
      is_current: formData.is_current,
      display_order: 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="fixed inset-0"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="button"
        tabIndex={-1}
        aria-label="Close modal"
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Add Work Experience</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            type="button"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="company" className="mb-1 block text-sm font-medium text-gray-700">
              Company *
            </label>
            <input
              id="company"
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="e.g., Google"
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="company_url" className="mb-1 block text-sm font-medium text-gray-700">
              <span className="flex items-center gap-1">
                <Link2 className="h-3.5 w-3.5" />
                Company URL (optional)
              </span>
            </label>
            <input
              id="company_url"
              type="url"
              value={formData.company_url}
              onChange={(e) => setFormData({ ...formData, company_url: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="https://company.com"
            />
          </div>

          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="e.g., Senior Product Manager"
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={formData.is_current}
                onChange={(e) => setFormData({ ...formData, is_current: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">This is my current position</span>
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
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Import Modal
const ImportModal = ({
  onImport,
  onClose,
}: {
  onImport: (experiences: PortfolioWorkExperience[]) => void;
  onClose: () => void;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available resume versions
  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const response = await fetch('/api/portfolio/work-experience/import');
        if (!response.ok) {
          throw new Error('Failed to fetch resume versions');
        }
        const data = await response.json();
        setVersions(data.versions || []);
        // Auto-select master resume if available
        const masterVersion = data.versions?.find((v: ResumeVersion) => v.is_master);
        if (masterVersion) {
          setSelectedVersionId(masterVersion.id);
        }
      } catch (err) {
        console.error('Error fetching versions:', err);
        setError('Failed to load resume versions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVersions();
  }, []);

  const handleImport = async () => {
    if (!selectedVersionId) {
      toast.error('Please select a resume to import from');
      return;
    }

    setIsImporting(true);
    try {
      const response = await fetch(
        `/api/portfolio/work-experience/import?versionId=${selectedVersionId}`
      );
      if (!response.ok) {
        throw new Error('Failed to import work experience');
      }
      const data = await response.json();
      onImport(data.workExperience || []);
    } catch (err) {
      console.error('Error importing:', err);
      toast.error('Failed to import work experience');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="fixed inset-0"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="button"
        tabIndex={-1}
        aria-label="Close modal"
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Import from Resume</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            type="button"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="mt-4 text-gray-500">Loading your resumes...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : versions.length === 0 ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mb-2 font-medium text-gray-700">No Resumes Found</h3>
            <p className="mb-4 text-sm text-gray-500">
              Create a resume first to import your work experience.
            </p>
            <button
              onClick={onClose}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              type="button"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-600">
              Select a resume to import work experience from. This will replace any existing work
              experience in your portfolio.
            </p>

            <div className="-m-1 mb-6 max-h-64 space-y-2 overflow-y-auto p-1">
              {versions.map((version) => (
                <button
                  key={version.id}
                  onClick={() => setSelectedVersionId(version.id)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    selectedVersionId === version.id
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  type="button"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      selectedVersionId === version.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{version.name}</span>
                      {version.is_master && (
                        <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-700">
                          Master
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {version.experience_count} work experience{version.experience_count === 1 ? '' : 's'}
                    </p>
                  </div>
                  {selectedVersionId === version.id && (
                    <Check className="h-5 w-5 text-blue-500" />
                  )}
                </button>
              ))}
            </div>

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
                onClick={handleImport}
                disabled={isImporting || !selectedVersionId}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Import
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WorkExperienceEditor;

