"use client";

import { useState, useEffect } from "react";
import { Bullet } from "./mockData";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { trackEvent } from "@/lib/amplitude/client";
import { getUserPlanClient } from "@/lib/utils/resume-tracking";

type Props = {
  bullet: Bullet;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onToggleSelection: (checked: boolean) => void;
  onContentChange?: (newContent: string) => void;
  onOptimize?: (bulletId: string) => Promise<string[]>;
  onDelete?: (bulletId: string) => Promise<void>;
  resumeVersionId?: string;
  experienceId?: string;
  companyName?: string;
  roleTitle?: string;
};

export default function BulletEditor({ 
  bullet, 
  index, 
  isSelected, 
  onSelect,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onToggleSelection,
  onContentChange,
  onOptimize,
  onDelete,
  resumeVersionId,
  experienceId,
  companyName,
  roleTitle,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(bullet.content);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedVersions, setOptimizedVersions] = useState<string[] | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync local content state when bullet prop changes
  useEffect(() => {
    if (!isEditing) {
      setContent(bullet.content);
    }
  }, [bullet.content, isEditing]);

  // Clear optimized versions when content changes
  useEffect(() => {
    if (content !== bullet.content) {
      setOptimizedVersions(null);
    }
  }, [content, bullet.content]);

  const handleSave = () => {
    if (onContentChange && content !== bullet.content) {
      onContentChange(content);
    }
    setIsEditing(false);
    setOptimizedVersions(null);
  };

  const handleOptimize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onOptimize || !bullet.id) return;

    setIsOptimizing(true);
    setOptimizedVersions(null);
    try {
      const versions = await onOptimize(bullet.id);
      setOptimizedVersions(versions);
    } catch (error) {
      console.error('Error optimizing bullet:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleUseVersion = async (version: string) => {
    setContent(version);
    setIsEditing(true);
    setOptimizedVersions(null);
    
    // Track user selected optimized version
    if (resumeVersionId && bullet.id) {
      const userPlan = await getUserPlanClient();
      trackEvent('User Optimized Bullet', {
        'Resume Version ID': resumeVersionId,
        'Experience ID': experienceId || null,
        'Bullet ID': bullet.id,
        'Company Name': companyName || null,
        'Role Title': roleTitle || null,
        'Original Content Length': bullet.content.length,
        'Optimization Success': true,
        'Optimized Versions Count': optimizedVersions?.length || 0,
        'User Selected Version': true,
        'User Plan': userPlan,
      });
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!onDelete || !bullet.id) return;
    
    setIsDeleting(true);
    try {
      await onDelete(bullet.id);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting bullet:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };


  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`group border-2 rounded-xl transition-all ${
        isSelected
          ? "border-blue-400 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-md"
          : "border-slate-200 bg-white hover:border-slate-300 shadow-sm"
      }`}
      onClick={onSelect}
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* Compact Left Controls - Horizontal Layout */}
          <div className="flex items-center gap-2">
            <button 
              className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 p-0.5 rounded transition-all"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
              </svg>
            </button>
            <input
              type="checkbox"
              checked={bullet.isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onToggleSelection(e.target.checked);
              }}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Bullet Content */}
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all resize-none bg-slate-50 focus:bg-white"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    className="px-3 py-1.5 text-xs font-bold bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setContent(bullet.content);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-slate-100 rounded-lg transition-all border border-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                {/* Action Buttons - Top right corner, half in/half out, shown on hover */}
                <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1.5 transition-opacity z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(true);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold text-gray-600 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 shadow-md transition-all"
                    title="Edit"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleOptimize}
                    disabled={isOptimizing}
                    className="px-2.5 py-1 text-xs font-semibold bg-gradient-to-br from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 rounded-lg shadow-md transition-all disabled:cursor-not-allowed flex items-center gap-1"
                    title="AI Optimize"
                  >
                    {isOptimizing ? (
                      <>
                        <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Optimizing...
                      </>
                    ) : (
                      'AI Optimize'
                    )}
                  </button>
                  <button
                    onClick={handleDeleteClick}
                    className="p-1.5 text-gray-400 bg-white hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 shadow-md transition-all"
                    title="Delete"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>

                <p className="text-sm text-gray-900 leading-relaxed">
                  {content}
                </p>

                {/* Tags - Always visible */}
                {bullet.tags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    {bullet.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded border border-slate-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Customization Badge */}
            {bullet.customizedFrom && (
              <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Customized</span>
              </div>
            )}

            {/* Optimized Versions */}
            {optimizedVersions && optimizedVersions.length > 0 && (
              <div className="mt-4 space-y-3 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-gray-700">AI Optimized Versions:</h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOptimizedVersions(null);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-all"
                    title="Discard suggested versions"
                  >
                    Discard Suggested Versions
                  </button>
                </div>
                {optimizedVersions.map((version, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200"
                  >
                    <p className="text-sm text-gray-900 leading-relaxed mb-2">{version}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUseVersion(version);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-br from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 rounded-lg transition-all"
                    >
                      Edit this version
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Bullet"
        message="Are you sure you want to delete this bullet point? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}

