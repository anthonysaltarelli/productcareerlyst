"use client";

import { useState, useRef } from "react";
import { ResumeData, Experience, Education, Achievement, ResumeStyles } from "./mockData";
import ExperienceCard from "./ExperienceCard";
import ExperienceGroup from "./ExperienceGroup";
import EducationCard from "./EducationCard";
import ResumePreview from "./ResumePreview";
import ResumeEditorHeader from "./ResumeEditorHeader";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import BulletEditor from "./BulletEditor";

type Props = {
  selectedVersion: string;
  selectedSection: string;
  viewMode: "edit" | "preview";
  selectedBulletId: string | null;
  onBulletSelect: (bulletId: string | null) => void;
  resumeStyles: ResumeStyles;
  resumeData: ResumeData;
  onResumeDataChange: (data: ResumeData | ((prevData: ResumeData) => ResumeData)) => void;
  hasUnsavedChanges: boolean;
  onSave: () => void;
  onDiscard: () => void;
  isSaving: boolean;
  onAddExperience?: () => Promise<void>;
  onAddEducation?: () => Promise<void>;
  onAddSkill?: (category: 'technical' | 'product' | 'soft', skillName: string) => Promise<void>;
  onAddBullet?: (experienceId: string, content: string) => Promise<void>;
  onDeleteExperience?: (experienceId: string) => Promise<void>;
  onDeleteEducation?: (educationId: string) => Promise<void>;
  onEditExperience?: (experienceId: string) => void;
  onEditEducation?: (educationId: string) => void;
  onDisplayModeChange?: (mode: 'by_role' | 'grouped') => void;
  onGroupExperience?: (experienceId: string) => Promise<void>;
  onUngroupExperience?: (experienceId: string) => Promise<void>;
  onUpdateBulletMode?: (groupId: string, mode: 'per_role' | 'per_experience') => Promise<void>;
  onAddRoleToExperience?: (groupId: string, roleData: { title: string; start_date: string; end_date: string }) => Promise<void>;
  onOptimizeBullet?: (bulletId: string) => Promise<string[]>;
  onDeleteBullet?: (bulletId: string) => Promise<void>;
};

export default function ResumeEditor({
  selectedVersion,
  selectedSection,
  viewMode,
  selectedBulletId,
  onBulletSelect,
  resumeStyles,
  resumeData,
  onResumeDataChange,
  hasUnsavedChanges,
  onSave,
  onDiscard,
  isSaving,
  onAddExperience,
  onAddEducation,
  onAddSkill,
  onAddBullet,
  onDeleteExperience,
  onDeleteEducation,
  onEditExperience,
  onEditEducation,
  onDisplayModeChange,
  onGroupExperience,
  onUngroupExperience,
  onUpdateBulletMode,
  onAddRoleToExperience,
  onOptimizeBullet,
  onDeleteBullet,
}: Props) {
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'experience' | 'education' | null;
    id: string | null;
    ids?: string[]; // For deleting multiple experiences in a group
    title: string;
  }>({
    isOpen: false,
    type: null,
    id: null,
    ids: undefined,
    title: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [addingSkillCategory, setAddingSkillCategory] = useState<'technical' | 'product' | 'soft' | null>(null);
  const [skillInputValue, setSkillInputValue] = useState('');
  const skillButtonRef = useRef(false);
  
  // Drag and drop state for reordering experiences
  const [draggedExperienceId, setDraggedExperienceId] = useState<string | null>(null);
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleContactChange = (field: keyof ResumeData['contactInfo'], value: string) => {
    onResumeDataChange({
      ...resumeData,
      contactInfo: {
        ...resumeData.contactInfo,
        [field]: value,
      },
    });
  };

  const handleSummaryChange = (value: string) => {
    onResumeDataChange({
      ...resumeData,
      summary: value,
    });
  };

  const handleExperienceChange = (index: number) => (updatedExperience: Experience) => {
    // Use functional update to ensure we're working with the latest state
    onResumeDataChange((prevData) => {
      const newExperiences = [...prevData.experiences];
      // Find the experience by ID to handle cases where index might be stale
      const expIndex = newExperiences.findIndex(e => e.id === updatedExperience.id);
      if (expIndex >= 0) {
        newExperiences[expIndex] = updatedExperience;
      } else if (index >= 0 && index < newExperiences.length) {
        // Fallback to index if ID lookup fails
        newExperiences[index] = updatedExperience;
      }
      return {
        ...prevData,
        experiences: newExperiences,
      };
    });
  };

  const handleEducationChange = (index: number, field: keyof Education, value: string | Achievement[]) => {
    const newEducation = [...resumeData.education];
    newEducation[index] = {
      ...newEducation[index],
      [field]: value,
    };
    onResumeDataChange({
      ...resumeData,
      education: newEducation,
    });
  };

  const handleSkillsChange = (category: keyof ResumeData['skills'], skills: string[]) => {
    onResumeDataChange({
      ...resumeData,
      skills: {
        ...resumeData.skills,
        [category]: skills,
      },
    });
  };

  const handleDeleteClick = (type: 'experience' | 'education', id: string, title: string, ids?: string[]) => {
    setDeleteModal({
      isOpen: true,
      type,
      id,
      ids,
      title,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.id || !deleteModal.type) return;

    setIsDeleting(true);
    try {
      if (deleteModal.type === 'experience' && onDeleteExperience) {
        // If we have multiple IDs (group deletion), delete all of them
        if (deleteModal.ids && deleteModal.ids.length > 0) {
          await Promise.all(deleteModal.ids.map(id => onDeleteExperience(id)));
        } else {
          await onDeleteExperience(deleteModal.id);
        }
      } else if (deleteModal.type === 'education' && onDeleteEducation) {
        await onDeleteEducation(deleteModal.id);
      }
      setDeleteModal({ isOpen: false, type: null, id: null, ids: undefined, title: '' });
    } catch (error) {
      console.error('Error deleting:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModal({ isOpen: false, type: null, id: null, ids: undefined, title: '' });
  };

  const handleStartAddingSkill = (category: 'technical' | 'product' | 'soft') => {
    setAddingSkillCategory(category);
    setSkillInputValue('');
  };

  const handleCancelAddingSkill = () => {
    if (skillButtonRef.current) {
      return;
    }
    setAddingSkillCategory(null);
    setSkillInputValue('');
  };

  const handleCancelSkillClick = () => {
    skillButtonRef.current = true;
    handleCancelAddingSkill();
    setTimeout(() => {
      skillButtonRef.current = false;
    }, 0);
  };

  const handleSubmitSkill = async () => {
    if (!addingSkillCategory || !skillInputValue.trim() || !onAddSkill) {
      return;
    }

    skillButtonRef.current = true;
    try {
      await onAddSkill(addingSkillCategory, skillInputValue.trim());
      setAddingSkillCategory(null);
      setSkillInputValue('');
    } catch (error) {
      console.error('Error adding skill:', error);
    } finally {
      setTimeout(() => {
        skillButtonRef.current = false;
      }, 0);
    }
  };

  const handleSkillInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmitSkill();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelAddingSkill();
    }
  };

  // Group experiences by roleGroupId
  const groupExperiencesByRole = (experiences: Experience[]) => {
    const groups: Map<string, Experience[]> = new Map();
    const standalone: Experience[] = [];

    experiences.forEach(exp => {
      if (exp.roleGroupId) {
        if (!groups.has(exp.roleGroupId)) {
          groups.set(exp.roleGroupId, []);
        }
        groups.get(exp.roleGroupId)!.push(exp);
      } else {
        standalone.push(exp);
      }
    });

    return { groups, standalone };
  };

  // Get bullet mode for a group (stored on first experience)
  const getBulletModeForGroup = (groupExps: Experience[]): 'per_role' | 'per_experience' => {
    const firstExp = groupExps[0];
    return firstExp.bulletMode || 'per_role';
  };

  // Create a flat list of experience items (groups and standalone) for drag-and-drop
  const getExperienceItems = () => {
    const { groups, standalone } = groupExperiencesByRole(resumeData.experiences);
    const items: Array<{ type: 'group' | 'standalone'; id: string; experience?: Experience; groupId?: string; experiences?: Experience[] }> = [];
    
    // Add grouped experiences
    Array.from(groups.entries()).forEach(([groupId, groupExps]) => {
      items.push({ type: 'group', id: groupId, groupId, experiences: groupExps });
    });
    
    // Add standalone experiences
    standalone.forEach(exp => {
      items.push({ type: 'standalone', id: exp.id, experience: exp });
    });
    
    return items;
  };

  // Handle drag start for experience reordering
  const handleExperienceDragStart = (experienceId: string | null, groupId: string | null, index: number) => (e: React.DragEvent) => {
    // Don't start drag if clicking on a button or interactive element
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button')) {
      e.preventDefault();
      return;
    }
    
    setDraggedExperienceId(experienceId);
    setDraggedGroupId(groupId);
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  // Handle drag over for experience reordering
  const handleExperienceDragOver = (targetIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    
    const items = getExperienceItems();
    const newItems = [...items];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);
    
    // Rebuild experiences array with new order
    const newExperiences: Experience[] = [];
    newItems.forEach(item => {
      if (item.type === 'group' && item.experiences) {
        newExperiences.push(...item.experiences);
      } else if (item.type === 'standalone' && item.experience) {
        newExperiences.push(item.experience);
      }
    });
    
    // Update resume data with new order
    onResumeDataChange({
      ...resumeData,
      experiences: newExperiences,
    });
    
    setDraggedIndex(targetIndex);
  };

  // Handle drop for experience reordering
  const handleExperienceDrop = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle drag end for experience reordering
  const handleExperienceDragEnd = () => {
    setDraggedExperienceId(null);
    setDraggedGroupId(null);
    setDraggedIndex(null);
    const draggedElements = document.querySelectorAll('[data-draggable-experience="true"]');
    draggedElements.forEach((el) => {
      if (el instanceof HTMLElement) {
        el.style.opacity = "1";
      }
    });
  };

  const renderSectionContent = () => {
    switch (selectedSection) {
      case "contact":
        return (
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Contact Information
            </h2>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={resumeData.contactInfo.name}
                  onChange={(e) => handleContactChange('name', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-slate-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={resumeData.contactInfo.email}
                  onChange={(e) => handleContactChange('email', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-slate-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={resumeData.contactInfo.phone}
                  onChange={(e) => handleContactChange('phone', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-slate-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={resumeData.contactInfo.location}
                  onChange={(e) => handleContactChange('location', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-slate-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  LinkedIn
                </label>
                <input
                  type="text"
                  value={resumeData.contactInfo.linkedin}
                  onChange={(e) => handleContactChange('linkedin', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-slate-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Portfolio/Website
                </label>
                <input
                  type="text"
                  value={resumeData.contactInfo.portfolio}
                  onChange={(e) => handleContactChange('portfolio', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-slate-50 focus:bg-white"
                />
              </div>
            </div>
          </div>
        );

      case "summary":
        return (
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Professional Summary
            </h2>
            <textarea
              value={resumeData.summary}
              onChange={(e) => handleSummaryChange(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all resize-none bg-slate-50 focus:bg-white"
              placeholder="Write a compelling professional summary..."
            />
            <div className="mt-5 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">
                {resumeData.summary.length} characters
              </span>
              <button className="px-5 py-2.5 text-sm font-bold bg-gradient-to-br from-purple-100 to-pink-100 text-purple-700 hover:from-purple-200 hover:to-pink-200 rounded-xl transition-all border border-purple-200">
                ✨ AI Optimize
              </button>
            </div>
          </div>
        );

      case "experience":
        const { groups, standalone } = groupExperiencesByRole(resumeData.experiences);
        const experienceItems = getExperienceItems();

        return (
          <div className="space-y-5">
            {/* Render experiences with drag-and-drop support */}
            {experienceItems.map((item, itemIndex) => {
              if (item.type === 'group' && item.groupId && item.experiences) {
                const groupId = item.groupId;
                const groupExps = item.experiences;
                const company = groupExps[0].company;
                const location = groupExps[0].location;
                const bulletMode = getBulletModeForGroup(groupExps);
                const isFirstGroup = itemIndex === 0;

                return (
                  <div
                    key={groupId}
                    data-draggable-experience="true"
                    draggable
                    onDragStart={handleExperienceDragStart(null, groupId, itemIndex)}
                    onDragOver={handleExperienceDragOver(itemIndex)}
                    onDrop={handleExperienceDrop}
                    onDragEnd={handleExperienceDragEnd}
                    className="cursor-move transition-opacity"
                  >
                    <ExperienceGroup
                      groupId={groupId}
                      experiences={groupExps}
                      company={company}
                      location={location}
                      bulletMode={bulletMode}
                      selectedBulletId={selectedBulletId}
                      onBulletSelect={onBulletSelect}
                      onExperienceChange={(experienceId) => {
                        const expIndex = resumeData.experiences.findIndex(e => e.id === experienceId);
                        return handleExperienceChange(expIndex);
                      }}
                      onEditExperience={onEditExperience}
                      onDeleteExperience={(id, title, ids) => handleDeleteClick('experience', id, title, ids)}
                      onAddBullet={onAddBullet}
                      onUpdateBulletMode={onUpdateBulletMode}
                      onAddRole={(groupId) => {
                        // Find the first experience in the group and open edit modal
                        const groupExps = resumeData.experiences.filter(exp => exp.roleGroupId === groupId);
                        if (groupExps.length > 0) {
                          // Open edit modal for the first experience in the group
                          onEditExperience?.(groupExps[0].id);
                        }
                      }}
                      onOptimizeBullet={onOptimizeBullet}
                      onDeleteBullet={onDeleteBullet}
                      isFirst={isFirstGroup}
                    />
                  </div>
                );
              } else if (item.type === 'standalone' && item.experience) {
                const experience = item.experience;
                const expIndex = resumeData.experiences.findIndex(e => e.id === experience.id);
                return (
                  <div
                    key={experience.id}
                    data-draggable-experience="true"
                    draggable
                    onDragStart={handleExperienceDragStart(experience.id, null, itemIndex)}
                    onDragOver={handleExperienceDragOver(itemIndex)}
                    onDrop={handleExperienceDrop}
                    onDragEnd={handleExperienceDragEnd}
                    className="cursor-move transition-opacity"
                  >
                    <ExperienceCard
                      experience={experience}
                      selectedBulletId={selectedBulletId}
                      onBulletSelect={onBulletSelect}
                      isFirst={expIndex === 0}
                      onExperienceChange={handleExperienceChange(expIndex)}
                      onEdit={() => onEditExperience?.(experience.id)}
                      onDelete={() => handleDeleteClick('experience', experience.id, `${experience.title} at ${experience.company}`)}
                      onAddBullet={onAddBullet ? (content) => onAddBullet(experience.id, content) : undefined}
                    />
                  </div>
                );
              }
              return null;
            })}

            <button
              onClick={onAddExperience}
              disabled={!onAddExperience}
              className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-all flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Experience
            </button>
          </div>
        );

      case "education":
        return (
          <div className="space-y-5">
            {resumeData.education.map((edu, index) => (
              <EducationCard
                key={edu.id}
                education={edu}
                isFirst={index === 0}
                onEducationChange={(field, value) => handleEducationChange(index, field, value)}
                onEdit={() => onEditEducation?.(edu.id)}
                onDelete={() => handleDeleteClick('education', edu.id, edu.school || `Education #${index + 1}`)}
              />
            ))}

            <button
              onClick={onAddEducation}
              disabled={!onAddEducation}
              className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-all flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Education
            </button>
          </div>
        );

      case "skills":
        return (
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Skills</h2>

            {/* Technical Skills */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-base font-bold text-gray-800">
                  Technical Skills
                </label>
                {addingSkillCategory !== 'technical' && (
                  <button
                    onClick={() => handleStartAddingSkill('technical')}
                    disabled={!onAddSkill}
                    className="text-sm text-blue-600 hover:text-blue-700 font-bold px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    + Add Skill
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {resumeData.skills.technical.map((skill, skillIndex) => (
                  <div
                    key={skillIndex}
                    className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-100 to-cyan-100 border-2 border-blue-200 text-blue-700 rounded-xl hover:from-blue-200 hover:to-cyan-200 transition-all shadow-sm"
                  >
                    <span className="text-sm font-semibold">{skill}</span>
                    <button 
                      onClick={() => {
                        const newSkills = resumeData.skills.technical.filter((_, i) => i !== skillIndex);
                        handleSkillsChange('technical', newSkills);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-800"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
                {addingSkillCategory === 'technical' && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-blue-300 rounded-xl shadow-sm">
                    <input
                      type="text"
                      value={skillInputValue}
                      onChange={(e) => setSkillInputValue(e.target.value)}
                      onKeyDown={handleSkillInputKeyDown}
                      onBlur={handleCancelAddingSkill}
                      placeholder="Enter skill name..."
                      autoFocus
                      className="text-sm font-semibold text-gray-900 outline-none flex-1 min-w-[150px]"
                    />
                    <button
                      onClick={handleSubmitSkill}
                      onMouseDown={(e) => e.preventDefault()}
                      disabled={!skillInputValue.trim()}
                      className="text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={handleCancelSkillClick}
                      onMouseDown={(e) => e.preventDefault()}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Product Skills */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-base font-bold text-gray-800">
                  Product Management Skills
                </label>
                {addingSkillCategory !== 'product' && (
                  <button
                    onClick={() => handleStartAddingSkill('product')}
                    disabled={!onAddSkill}
                    className="text-sm text-blue-600 hover:text-blue-700 font-bold px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    + Add Skill
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {resumeData.skills.product.map((skill, skillIndex) => (
                  <div
                    key={skillIndex}
                    className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-200 text-purple-700 rounded-xl hover:from-purple-200 hover:to-pink-200 transition-all shadow-sm"
                  >
                    <span className="text-sm font-semibold">{skill}</span>
                    <button 
                      onClick={() => {
                        const newSkills = resumeData.skills.product.filter((_, i) => i !== skillIndex);
                        handleSkillsChange('product', newSkills);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-600 hover:text-purple-800"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
                {addingSkillCategory === 'product' && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-purple-300 rounded-xl shadow-sm">
                    <input
                      type="text"
                      value={skillInputValue}
                      onChange={(e) => setSkillInputValue(e.target.value)}
                      onKeyDown={handleSkillInputKeyDown}
                      onBlur={handleCancelAddingSkill}
                      placeholder="Enter skill name..."
                      autoFocus
                      className="text-sm font-semibold text-gray-900 outline-none flex-1 min-w-[150px]"
                    />
                    <button
                      onClick={handleSubmitSkill}
                      onMouseDown={(e) => e.preventDefault()}
                      disabled={!skillInputValue.trim()}
                      className="text-purple-600 hover:text-purple-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={handleCancelSkillClick}
                      onMouseDown={(e) => e.preventDefault()}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Soft Skills */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-base font-bold text-gray-800">
                  Soft Skills
                </label>
                {addingSkillCategory !== 'soft' && (
                  <button
                    onClick={() => handleStartAddingSkill('soft')}
                    disabled={!onAddSkill}
                    className="text-sm text-blue-600 hover:text-blue-700 font-bold px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    + Add Skill
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {resumeData.skills.soft.map((skill, skillIndex) => (
                  <div
                    key={skillIndex}
                    className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-green-100 to-emerald-100 border-2 border-green-200 text-green-700 rounded-xl hover:from-green-200 hover:to-emerald-200 transition-all shadow-sm"
                  >
                    <span className="text-sm font-semibold">{skill}</span>
                    <button 
                      onClick={() => {
                        const newSkills = resumeData.skills.soft.filter((_, i) => i !== skillIndex);
                        handleSkillsChange('soft', newSkills);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-green-600 hover:text-green-800"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
                {addingSkillCategory === 'soft' && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-green-300 rounded-xl shadow-sm">
                    <input
                      type="text"
                      value={skillInputValue}
                      onChange={(e) => setSkillInputValue(e.target.value)}
                      onKeyDown={handleSkillInputKeyDown}
                      onBlur={handleCancelAddingSkill}
                      placeholder="Enter skill name..."
                      autoFocus
                      className="text-sm font-semibold text-gray-900 outline-none flex-1 min-w-[150px]"
                    />
                    <button
                      onClick={handleSubmitSkill}
                      onMouseDown={(e) => e.preventDefault()}
                      disabled={!skillInputValue.trim()}
                      className="text-green-600 hover:text-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={handleCancelSkillClick}
                      onMouseDown={(e) => e.preventDefault()}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Add Custom Category */}
            <button className="w-full mt-8 py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-all flex items-center justify-center gap-2 font-semibold">
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Custom Skill Category
            </button>
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-16 text-center shadow-sm">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl mb-6 border-2 border-slate-300">
              <svg
                className="w-10 h-10 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Section Coming Soon
            </h3>
            <p className="text-gray-600 font-medium">
              This section is under development. Select another section to edit.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Header - Always visible in both edit and preview modes */}
      <ResumeEditorHeader
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={onSave}
        onDiscard={onDiscard}
        isSaving={isSaving}
      />

      {/* Content Area - Conditional rendering based on view mode */}
      <div className="flex-1 overflow-hidden">
        {viewMode === "edit" && (
          <div className="h-full overflow-y-auto p-8">
            <div className="max-w-5xl mx-auto">{renderSectionContent()}</div>
          </div>
        )}

        {viewMode === "preview" && (
          <div className="h-full overflow-y-auto bg-slate-100 p-8">
            <div className="flex justify-center">
              <ResumePreview styles={resumeStyles} resumeData={resumeData} />
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        title={`Delete ${deleteModal.type === 'experience' ? 'Experience' : 'Education'}?`}
        message={`Are you sure you want to delete "${deleteModal.title}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}

