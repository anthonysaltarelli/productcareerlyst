"use client";

import { useState, useRef, useEffect } from "react";
import { Experience } from "./mockData";
import BulletEditor from "./BulletEditor";
import PremiumFeatureGateModal from "./PremiumFeatureGateModal";
import { getUserPlanClient } from "@/lib/utils/resume-tracking";

type Props = {
  groupId: string;
  experiences: Experience[];
  company: string;
  location: string;
  bulletMode: 'per_role' | 'per_experience';
  selectedBulletId: string | null;
  onBulletSelect: (bulletId: string | null) => void;
  onExperienceChange: (experienceId: string) => (updatedExperience: Experience) => void;
  onEditExperience?: (experienceId: string) => void;
  onDeleteExperience?: (experienceId: string, title: string, ids?: string[]) => void;
  onAddBullet?: (experienceId: string, content: string) => Promise<void>;
  onUpdateBulletMode?: (groupId: string, mode: 'per_role' | 'per_experience') => Promise<void>;
  onAddRole?: (groupId: string) => void; // Opens edit modal for the experience group
  onOptimizeBullet?: (bulletId: string) => Promise<string[]>;
  onOptimizeBulletText?: (bulletContent: string, company?: string, role?: string) => Promise<string[]>;
  onDeleteBullet?: (bulletId: string) => Promise<void>;
  isFirst?: boolean;
  resumeVersionId?: string;
};

export default function ExperienceGroup({
  groupId,
  experiences,
  company,
  location,
  bulletMode,
  selectedBulletId,
  onBulletSelect,
  onExperienceChange,
  onEditExperience,
  onDeleteExperience,
  onAddBullet,
  onUpdateBulletMode,
  onAddRole,
  onOptimizeBullet,
  onOptimizeBulletText,
  onDeleteBullet,
  isFirst = false,
  resumeVersionId,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(isFirst);
  const [addingBulletForExperienceId, setAddingBulletForExperienceId] = useState<string | null>(null);
  const [newBulletContent, setNewBulletContent] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedVersions, setOptimizedVersions] = useState<string[] | null>(null);
  const [showPremiumGate, setShowPremiumGate] = useState(false);
  const [userPlan, setUserPlan] = useState<'learn' | 'accelerate' | null>(null);
  
  // Drag and drop state
  const [draggedBulletId, setDraggedBulletId] = useState<string | null>(null);
  const [draggedExperienceId, setDraggedExperienceId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [lastTargetKey, setLastTargetKey] = useState<string | null>(null);
  
  // Use ref to track if bullet has been moved to prevent duplicates during rapid drag events
  const movedBulletRef = useRef<{ bulletId: string; targetExperienceId: string } | null>(null);
  
  const sortedExps = [...experiences].sort((a, b) => {
    if (a.startDate && b.startDate) {
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    }
    return 0;
  });

  // Deduplicate bullets by ID to prevent duplicate keys during drag operations
  // When a bullet is being moved, it might temporarily exist in both source and target experiences
  const allBulletsMap = new Map<string, typeof sortedExps[0]['bullets'][0]>();
  // Process experiences in reverse order so that if a bullet appears in multiple experiences,
  // we keep the one from the later experience (which is likely the target during a drag)
  sortedExps.slice().reverse().forEach(exp => {
    (exp.bullets || []).forEach(bullet => {
      // Always update to ensure we get the bullet from the most recent experience
      allBulletsMap.set(bullet.id, bullet);
    });
  });
  const allBullets = Array.from(allBulletsMap.values());
  const selectedBullets = allBullets.filter(b => b.isSelected);

  // Load user plan on mount
  useEffect(() => {
    getUserPlanClient().then(setUserPlan);
  }, []);

  const handleAddBulletClick = (experienceId: string) => {
    setAddingBulletForExperienceId(experienceId);
    setNewBulletContent("");
  };

  const handleSaveBullet = async () => {
    if (!newBulletContent.trim() || !addingBulletForExperienceId || !onAddBullet) return;

    try {
      await onAddBullet(addingBulletForExperienceId, newBulletContent.trim());
      setNewBulletContent("");
      setAddingBulletForExperienceId(null);
      setOptimizedVersions(null);
    } catch (error) {
      console.error("Error adding bullet:", error);
    }
  };

  const handleCancelAddBullet = () => {
    setNewBulletContent("");
    setAddingBulletForExperienceId(null);
    setOptimizedVersions(null);
  };

  const handleOptimizeBulletText = async () => {
    if (!newBulletContent.trim() || !onOptimizeBulletText) return;

    // Check if user has Accelerate plan
    const plan = userPlan || await getUserPlanClient();
    setUserPlan(plan);
    
    if (plan !== 'accelerate') {
      setShowPremiumGate(true);
      return;
    }

    setIsOptimizing(true);
    setOptimizedVersions(null);

    try {
      // Get company and role from the experience
      const experience = sortedExps.find(exp => exp.id === addingBulletForExperienceId);
      const versions = await onOptimizeBulletText(
        newBulletContent.trim(),
        experience?.company || company,
        experience?.title
      );
      setOptimizedVersions(versions);
    } catch (error) {
      console.error("Error optimizing bullet:", error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleEditVersion = (versionIndex: number) => {
    if (!optimizedVersions) return;
    const version = optimizedVersions[versionIndex];
    setNewBulletContent(version);
    setOptimizedVersions(null);
  };

  const handleDiscardVersions = () => {
    setOptimizedVersions(null);
  };

  const handleSaveVersionAsBullet = async (versionIndex: number) => {
    if (!addingBulletForExperienceId || !onAddBullet || !optimizedVersions) return;
    
    const version = optimizedVersions[versionIndex];
    if (!version.trim()) return;

    try {
      await onAddBullet(addingBulletForExperienceId, version.trim());
      setNewBulletContent("");
      setAddingBulletForExperienceId(null);
      setOptimizedVersions(null);
    } catch (error) {
      console.error("Error adding bullet:", error);
    }
  };

  const handleBulletContentChange = (bulletId: string, experienceId: string) => (newContent: string) => {
    const experience = sortedExps.find(exp => exp.id === experienceId);
    if (!experience) return;

    const newBullets = [...(experience.bullets || [])];
    const bulletIdx = newBullets.findIndex(b => b.id === bulletId);
    if (bulletIdx >= 0) {
      newBullets[bulletIdx] = { ...newBullets[bulletIdx], content: newContent };
      onExperienceChange(experienceId)({ ...experience, bullets: newBullets });
    }
  };

  // Drag and drop handlers for per_role mode
  const handleDragStart = (bulletId: string, experienceId: string, index: number) => (e: React.DragEvent) => {
    setDraggedBulletId(bulletId);
    setDraggedExperienceId(experienceId);
    setDraggedIndex(index);
    setLastTargetKey(null);
    movedBulletRef.current = null; // Reset moved tracking
    e.dataTransfer.effectAllowed = "move";
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  const handleDragOver = (targetBulletId: string, targetExperienceId: string, targetIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (!draggedBulletId || !draggedExperienceId || draggedIndex === null) return;
    if (draggedBulletId === targetBulletId) return;

    // Create a unique key for this target position to prevent duplicate operations
    const targetKey = `${targetExperienceId}-${targetIndex}`;
    if (lastTargetKey === targetKey) return; // Already processed this position

    // Check if we've already moved this bullet to this target experience
    if (movedBulletRef.current && 
        movedBulletRef.current.bulletId === draggedBulletId && 
        movedBulletRef.current.targetExperienceId === targetExperienceId) {
      return; // Already moved to this target
    }

    const sourceExperience = experiences.find(exp => exp.id === draggedExperienceId);
    const targetExperience = experiences.find(exp => exp.id === targetExperienceId);
    
    if (!sourceExperience || !targetExperience) return;

    // Check if bullet is already in the target experience (prevent duplication)
    const bulletAlreadyInTarget = (targetExperience.bullets || []).some(b => b.id === draggedBulletId);
    if (bulletAlreadyInTarget && draggedExperienceId !== targetExperienceId) {
      // Bullet is already in target, don't move it again
      // Update tracking to reflect current state
      setDraggedExperienceId(targetExperienceId);
      const existingIndex = (targetExperience.bullets || []).findIndex(b => b.id === draggedBulletId);
      if (existingIndex >= 0) {
        setDraggedIndex(existingIndex);
      }
      movedBulletRef.current = { bulletId: draggedBulletId, targetExperienceId };
      setLastTargetKey(targetKey);
      return;
    }

    const sourceBullets = [...(sourceExperience.bullets || [])];
    const targetBullets = [...(targetExperience.bullets || [])];
    
    // Check if bullet is still in source - if not, it's already been moved
    const draggedBullet = sourceBullets.find(b => b.id === draggedBulletId);
    const bulletInTarget = targetBullets.find(b => b.id === draggedBulletId);
    
    // If bullet is in target but not in source, it's already been moved
    if (bulletInTarget && !draggedBullet) {
      // Bullet is already in target, just update the index tracking
      setDraggedExperienceId(targetExperienceId);
      const newIndex = targetBullets.indexOf(bulletInTarget);
      setDraggedIndex(newIndex);
      setLastTargetKey(targetKey);
      movedBulletRef.current = { bulletId: draggedBulletId, targetExperienceId };
      return;
    }
    
    // If bullet is not in source, don't try to move it
    if (!draggedBullet) {
      return;
    }

    if (draggedExperienceId === targetExperienceId) {
      // Reordering within the same experience
      if (draggedIndex === targetIndex) return;
      
      sourceBullets.splice(draggedIndex, 1);
      sourceBullets.splice(targetIndex, 0, draggedBullet);
      
      onExperienceChange(sourceExperience.id)({ ...sourceExperience, bullets: sourceBullets });
      setDraggedIndex(targetIndex);
      setLastTargetKey(targetKey);
    } else if (bulletMode === 'per_role') {
      // Moving between different experiences (only allowed in per_role mode)
      // Make sure bullet is not already in target
      if (!targetBullets.some(b => b.id === draggedBulletId)) {
        // Remove from source FIRST
        sourceBullets.splice(draggedIndex, 1);
        // Add to target
        targetBullets.splice(targetIndex, 0, draggedBullet);
        
        // Update tracking IMMEDIATELY before state updates
        // This ensures subsequent dragOver calls know the bullet has moved
        setDraggedExperienceId(targetExperienceId);
        setDraggedIndex(targetIndex);
        setLastTargetKey(targetKey);
        movedBulletRef.current = { bulletId: draggedBulletId, targetExperienceId };
        
        // Update both experiences - the functional update pattern in handleExperienceChange
        // ensures each update sees the result of previous updates
        // Call them synchronously so React can batch them properly
        onExperienceChange(sourceExperience.id)({ ...sourceExperience, bullets: sourceBullets });
        onExperienceChange(targetExperience.id)({ ...targetExperience, bullets: targetBullets });
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnd = () => {
    setDraggedBulletId(null);
    setDraggedExperienceId(null);
    setDraggedIndex(null);
    setLastTargetKey(null);
    movedBulletRef.current = null; // Reset moved tracking
    // Reset opacity
    const draggedElements = document.querySelectorAll('[draggable="true"]');
    draggedElements.forEach((el) => {
      if (el instanceof HTMLElement) {
        el.style.opacity = "1";
      }
    });
  };

  // Drag and drop handlers for per_experience mode
  const handleDragStartPerExperience = (bulletId: string, index: number) => (e: React.DragEvent) => {
    setDraggedBulletId(bulletId);
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  const handleDragOverPerExperience = (targetBulletId: string, targetIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (!draggedBulletId || draggedIndex === null) return;
    if (draggedBulletId === targetBulletId) return;
    if (draggedIndex === targetIndex) return;

    // Find which experience the dragged bullet belongs to
    const sourceExperience = experiences.find(exp => 
      exp.bullets && exp.bullets.some(b => b.id === draggedBulletId)
    );
    
    if (!sourceExperience) return;

    // Get all bullets from all experiences in the group
    const allBullets = sortedExps.flatMap(exp => exp.bullets || []);
    const newAllBullets = [...allBullets];
    
    const draggedBullet = newAllBullets.find(b => b.id === draggedBulletId);
    if (!draggedBullet) return;

    // Reorder within the combined list
    newAllBullets.splice(draggedIndex, 1);
    newAllBullets.splice(targetIndex, 0, draggedBullet);

    // Redistribute bullets back to experiences (maintain the same experience for each bullet)
    const bulletToExperience = new Map<string, string>();
    sortedExps.forEach(exp => {
      (exp.bullets || []).forEach(bullet => {
        bulletToExperience.set(bullet.id, exp.id);
      });
    });

    // Update each experience with its bullets in the new order
    sortedExps.forEach(exp => {
      const expBullets = newAllBullets.filter(b => bulletToExperience.get(b.id) === exp.id);
      // Always update to ensure order is correct
      const currentBullets = exp.bullets || [];
      const bulletsChanged = expBullets.length !== currentBullets.length || 
        expBullets.some((b, idx) => !currentBullets[idx] || currentBullets[idx].id !== b.id);
      if (bulletsChanged) {
        onExperienceChange(exp.id)({ ...exp, bullets: expBullets });
      }
    });

    setDraggedIndex(targetIndex);
  };

  return (
    <div className="mb-6 bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 border-b-2 border-slate-200">
        <div className="flex items-start gap-4">
          {/* Drag Handle */}
          <button className="mt-1 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 p-1 hover:bg-white rounded-lg transition-all flex-shrink-0">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
            </svg>
          </button>

          {/* Experience Info */}
          <div className="flex-1 min-w-0">
            <div className="truncate">
              <span className="text-lg font-bold text-gray-900">{company}</span>
              {location && (
                <>
                  <span className="text-gray-400 mx-2">•</span>
                  <span className="text-sm font-semibold text-gray-600">{location}</span>
                </>
              )}
            </div>

            {/* Roles - Display below company name, one per line */}
            {sortedExps.length > 0 && (
              <div className="mt-2 space-y-1">
                {sortedExps.map((exp) => (
                  <div key={exp.id} className="text-sm font-medium text-gray-700">
                    <span>{exp.title}</span>
                    {exp.startDate && exp.endDate && (
                      <span className="text-gray-500 ml-2">
                        {exp.startDate} - {exp.endDate}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200"
                  >
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Edit Button - Edit first experience in group */}
                  <button
                    onClick={() => onEditExperience?.(sortedExps[0].id)}
                    disabled={!onEditExperience}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Edit experience"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>

                  {/* Delete Button - Delete all experiences in the group */}
                  <button
                    onClick={() => {
                      // Delete all experiences in the group
                      const allIds = sortedExps.map(exp => exp.id);
                      onDeleteExperience?.(sortedExps[0].id, `${company} (${sortedExps.length} role${sortedExps.length !== 1 ? 's' : ''})`, allIds);
                    }}
                    disabled={!onDeleteExperience}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete experience group"
                  >
                    <svg
                      className="w-5 h-5"
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
        </div>

      </div>

      {/* Details */}
      {isExpanded && (
        <div className="p-5">
          {/* Bullets Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-gray-700">
                Bullets ({selectedBullets.length} of {allBullets.length} selected)
              </h4>
            </div>

            {/* Bullet Mode Toggle - Per Experience (only show when multiple roles) */}
            {experiences.length > 1 && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-800">Bullet Organization:</span>
                      <span className="text-sm font-bold text-blue-700">
                        {bulletMode === 'per_role' ? 'Per Role' : 'Per Experience'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {bulletMode === 'per_role' 
                        ? 'Each role displays its own bullets separately' 
                        : 'All roles share the same bullets together'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newMode = bulletMode === 'per_role' ? 'per_experience' : 'per_role';
                      onUpdateBulletMode?.(groupId, newMode);
                    }}
                    className="ml-4 px-4 py-2 text-sm font-semibold text-blue-700 hover:text-blue-800 hover:bg-blue-100 rounded-lg border-2 border-blue-300 bg-white transition-all shadow-sm"
                  >
                    Switch to {bulletMode === 'per_role' ? 'Per Experience' : 'Per Role'}
                  </button>
                </div>
              </div>
            )}

            {bulletMode === 'per_role' ? (
              // Per Role: Show bullets grouped by role
              <div className="space-y-4">
                {sortedExps.map((experience) => {
                  return (
                    <div key={experience.id} className="border-l-4 border-blue-300 pl-4">
                      <div className="text-xs font-semibold text-gray-500 mb-3">
                        {experience.title}:
                      </div>
                      {experience.bullets && experience.bullets.length > 0 ? (
                        <div className="space-y-2">
                          {experience.bullets.map((bullet, bulletIndex) => (
                            <BulletEditor
                              key={bullet.id}
                              bullet={bullet}
                              index={bulletIndex}
                              isSelected={selectedBulletId === bullet.id}
                              onSelect={() => onBulletSelect(bullet.id)}
                              resumeVersionId={resumeVersionId}
                              experienceId={experience.id}
                              companyName={company}
                              roleTitle={experience.title}
                              onDragStart={handleDragStart(bullet.id, experience.id, bulletIndex)}
                              onDragOver={handleDragOver(bullet.id, experience.id, bulletIndex)}
                              onDrop={handleDrop}
                              onDragEnd={handleDragEnd}
                              onToggleSelection={(checked) => {
                                const newBullets = [...(experience.bullets || [])];
                                const bulletIdx = newBullets.findIndex(b => b.id === bullet.id);
                                if (bulletIdx >= 0) {
                                  newBullets[bulletIdx] = { ...newBullets[bulletIdx], isSelected: checked };
                                  onExperienceChange(experience.id)({ ...experience, bullets: newBullets });
                                }
                              }}
                              onContentChange={handleBulletContentChange(bullet.id, experience.id)}
                              onOptimize={onOptimizeBullet}
                              onDelete={onDeleteBullet}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No bullets for this role</p>
                      )}
                      {onAddBullet && (
                        <>
                          {addingBulletForExperienceId === experience.id ? (
                            <div className="mt-3 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4">
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                New Bullet Point
                              </label>
                              <textarea
                                value={newBulletContent}
                                onChange={(e) => setNewBulletContent(e.target.value)}
                                className="w-full px-3 py-2 border-2 border-green-200 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all bg-white resize-none text-sm"
                                placeholder="e.g., Led cross-functional team of 12 engineers to launch new feature, resulting in 25% increase in user engagement"
                                rows={3}
                                autoFocus
                              />
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={handleOptimizeBulletText}
                                  disabled={!newBulletContent.trim() || isOptimizing}
                                  className="flex-[0.4] py-2 text-sm font-semibold bg-gradient-to-br from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 rounded-lg transition-all disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-1"
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
                                  onClick={handleSaveBullet}
                                  disabled={!newBulletContent.trim()}
                                  className="flex-[0.4] py-2 text-sm font-semibold bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all border-2 border-green-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={handleCancelAddBullet}
                                  className="flex-[0.2] py-2 text-sm font-semibold text-gray-700 hover:bg-slate-100 rounded-lg transition-all border border-slate-200"
                                >
                                  Cancel
                                </button>
                              </div>
                              {/* Optimized Versions */}
                              {optimizedVersions && optimizedVersions.length > 0 && (
                                <div className="mt-4 space-y-3 pt-4 border-t border-green-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-xs font-bold text-gray-700">AI Optimized Versions:</h4>
                                    <button
                                      onClick={handleDiscardVersions}
                                      className="px-2.5 py-1 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-all"
                                      title="Discard suggested versions"
                                    >
                                      Discard
                                    </button>
                                  </div>
                                  {optimizedVersions.map((version, idx) => (
                                    <div
                                      key={idx}
                                      className="p-3 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200"
                                    >
                                      <p className="text-sm text-gray-900 leading-relaxed mb-2">{version}</p>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => handleEditVersion(idx)}
                                          className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-br from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 rounded-lg transition-all"
                                        >
                                          Edit this version
                                        </button>
                                        <button
                                          onClick={() => handleSaveVersionAsBullet(idx)}
                                          className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-br from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 rounded-lg transition-all"
                                        >
                                          Save bullet
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddBulletClick(experience.id)}
                              className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-semibold"
                            >
                              + Add Bullet
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              // Per Experience: Show all bullets together
              <div className="space-y-2">
                {allBullets.length > 0 ? (
                  allBullets.map((bullet, bulletIndex) => {
                    // Find which experience this bullet belongs to
                    const experience = sortedExps.find(exp => 
                      exp.bullets && exp.bullets.some(b => b.id === bullet.id)
                    );
                    
                    // Skip if experience not found (shouldn't happen, but TypeScript safety)
                    if (!experience) {
                      return null;
                    }
                    
                    return (
                      <BulletEditor
                        key={bullet.id}
                        bullet={bullet}
                        index={bulletIndex}
                        isSelected={selectedBulletId === bullet.id}
                        onSelect={() => onBulletSelect(bullet.id)}
                        resumeVersionId={resumeVersionId}
                        experienceId={experience.id}
                        companyName={company}
                        roleTitle={experience.title}
                        onDragStart={handleDragStartPerExperience(bullet.id, bulletIndex)}
                        onDragOver={handleDragOverPerExperience(bullet.id, bulletIndex)}
                        onDrop={handleDrop}
                        onDragEnd={handleDragEnd}
                        onToggleSelection={(checked) => {
                          if (experience) {
                            const newBullets = [...(experience.bullets || [])];
                            const bulletIdx = newBullets.findIndex(b => b.id === bullet.id);
                            if (bulletIdx >= 0) {
                              newBullets[bulletIdx] = { ...newBullets[bulletIdx], isSelected: checked };
                              onExperienceChange(experience.id)({ ...experience, bullets: newBullets });
                            }
                          }
                        }}
                        onContentChange={experience ? handleBulletContentChange(bullet.id, experience.id) : undefined}
                        onOptimize={onOptimizeBullet}
                        onDelete={onDeleteBullet}
                      />
                    );
                  })
                ) : (
                  <p className="text-xs text-gray-400 italic">No bullets yet</p>
                )}
                {onAddBullet && sortedExps.length > 0 && (
                  <>
                    {addingBulletForExperienceId === sortedExps[0].id ? (
                      <div className="mt-3 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          New Bullet Point
                        </label>
                        <textarea
                          value={newBulletContent}
                          onChange={(e) => setNewBulletContent(e.target.value)}
                          className="w-full px-3 py-2 border-2 border-green-200 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all bg-white resize-none text-sm"
                          placeholder="e.g., Led cross-functional team of 12 engineers to launch new feature, resulting in 25% increase in user engagement"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={handleOptimizeBulletText}
                            disabled={!newBulletContent.trim() || isOptimizing}
                            className="flex-[0.4] py-2 text-sm font-semibold bg-gradient-to-br from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 rounded-lg transition-all disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-1"
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
                            onClick={handleSaveBullet}
                            disabled={!newBulletContent.trim()}
                            className="flex-[0.4] py-2 text-sm font-semibold bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all border-2 border-green-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelAddBullet}
                            className="flex-[0.2] py-2 text-sm font-semibold text-gray-700 hover:bg-slate-100 rounded-lg transition-all border border-slate-200"
                          >
                            Cancel
                          </button>
                        </div>
                        {/* Optimized Versions */}
                        {optimizedVersions && optimizedVersions.length > 0 && (
                          <div className="mt-4 space-y-3 pt-4 border-t border-green-200">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-xs font-bold text-gray-700">AI Optimized Versions:</h4>
                              <button
                                onClick={handleDiscardVersions}
                                className="px-2.5 py-1 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-all"
                                title="Discard suggested versions"
                              >
                                Discard
                              </button>
                            </div>
                            {optimizedVersions.map((version, idx) => (
                              <div
                                key={idx}
                                className="p-3 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200"
                              >
                                <p className="text-sm text-gray-900 leading-relaxed mb-2">{version}</p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEditVersion(idx)}
                                    className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-br from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 rounded-lg transition-all"
                                  >
                                    Edit this version
                                  </button>
                                  <button
                                    onClick={() => handleSaveVersionAsBullet(idx)}
                                    className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-br from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 rounded-lg transition-all"
                                  >
                                    Save bullet
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddBulletClick(sortedExps[0].id)}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        + Add Bullet
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Premium Feature Gate Modal */}
      <PremiumFeatureGateModal
        isOpen={showPremiumGate}
        onClose={() => setShowPremiumGate(false)}
        featureName="AI Bullet Optimization"
        featureDescription="AI bullet optimization is available exclusively for Accelerate plan subscribers."
        currentPlan={userPlan}
        requiresAccelerate={true}
      />
    </div>
  );
}

