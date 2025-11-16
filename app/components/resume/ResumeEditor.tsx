"use client";

import { useState } from "react";
import { ResumeData, Experience, Education, Achievement, ResumeStyles } from "./mockData";
import ExperienceCard from "./ExperienceCard";
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
  onResumeDataChange: (data: ResumeData) => void;
  hasUnsavedChanges: boolean;
  onSave: () => void;
  onDiscard: () => void;
  isSaving: boolean;
  onAddExperience?: () => Promise<void>;
  onAddEducation?: () => Promise<void>;
  onAddSkill?: (category: 'technical' | 'product' | 'soft') => Promise<void>;
  onAddBullet?: (experienceId: string, content: string) => Promise<void>;
  onDeleteExperience?: (experienceId: string) => Promise<void>;
  onDeleteEducation?: (educationId: string) => Promise<void>;
  onEditExperience?: (experienceId: string) => void;
  onEditEducation?: (educationId: string) => void;
  onDisplayModeChange?: (mode: 'by_role' | 'grouped') => void;
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
}: Props) {
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'experience' | 'education' | null;
    id: string | null;
    title: string;
  }>({
    isOpen: false,
    type: null,
    id: null,
    title: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

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
    const newExperiences = [...resumeData.experiences];
    newExperiences[index] = updatedExperience;
    onResumeDataChange({
      ...resumeData,
      experiences: newExperiences,
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

  const handleDeleteClick = (type: 'experience' | 'education', id: string, title: string) => {
    setDeleteModal({
      isOpen: true,
      type,
      id,
      title,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.id || !deleteModal.type) return;

    setIsDeleting(true);
    try {
      if (deleteModal.type === 'experience' && onDeleteExperience) {
        await onDeleteExperience(deleteModal.id);
      } else if (deleteModal.type === 'education' && onDeleteEducation) {
        await onDeleteEducation(deleteModal.id);
      }
      setDeleteModal({ isOpen: false, type: null, id: null, title: '' });
    } catch (error) {
      console.error('Error deleting:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModal({ isOpen: false, type: null, id: null, title: '' });
  };

  // Group experiences by roleGroupId
  const groupExperiencesByRole = (experiences: Experience[]) => {
    const groups: Map<string | null, Experience[]> = new Map();
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

  const handleDisplayModeToggle = () => {
    const newMode = resumeStyles.experienceDisplayMode === 'by_role' ? 'grouped' : 'by_role';
    // This will need to be handled by the parent component to update styles
    // For now, we'll just update the local state
    onResumeDataChange({
      ...resumeData,
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
        const selectedCount = resumeData.experiences.reduce(
          (acc, exp) => acc + exp.bullets.filter((b) => b.isSelected).length,
          0
        );
        const totalCount = resumeData.experiences.reduce(
          (acc, exp) => acc + exp.bullets.length,
          0
        );

        return (
          <div className="space-y-5">
            <div className="bg-gradient-to-br from-blue-100 to-cyan-100 border-2 border-blue-200 rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl border-2 border-blue-300 shadow-sm">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-900">
                    {selectedCount} of {totalCount} bullets selected
                  </p>
                  <p className="text-xs font-medium text-blue-700">
                    Customize which bullets appear in this version
                  </p>
                </div>
              </div>
            </div>

            {/* Display Mode Toggle */}
            {resumeData.experiences.some(exp => exp.roleGroupId) && (
              <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Experience Display Mode</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {resumeStyles.experienceDisplayMode === 'by_role' 
                        ? 'Bullets shown within each role' 
                        : 'Titles stacked, then all bullets below'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newMode = resumeStyles.experienceDisplayMode === 'by_role' ? 'grouped' : 'by_role';
                      onDisplayModeChange?.(newMode);
                    }}
                    className="px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-blue-200 transition-all"
                  >
                    Switch to {resumeStyles.experienceDisplayMode === 'by_role' ? 'Grouped' : 'By Role'}
                  </button>
                </div>
              </div>
            )}

            {/* Render Experiences - Grouped or Individual */}
            {(() => {
              const { groups, standalone } = groupExperiencesByRole(resumeData.experiences);
              const displayMode = resumeStyles.experienceDisplayMode || 'by_role';
              let renderIndex = 0;

              return (
                <>
                  {/* Render grouped experiences */}
                  {Array.from(groups.entries()).map(([groupId, groupExps]) => {
                    const company = groupExps[0].company;
                    const location = groupExps[0].location;
                    const allBullets = groupExps.flatMap(exp => exp.bullets || []);
                    const selectedBullets = allBullets.filter(b => b.isSelected);

                    if (displayMode === 'by_role') {
                      // Mode 1: Bullets within each role
                      return (
                        <div key={groupId} className="mb-4">
                          <div className="bg-blue-50 border-2 border-blue-200 rounded-t-xl p-4">
                            <h3 className="text-lg font-bold text-gray-900">{company}</h3>
                            {location && <p className="text-sm text-gray-600 mt-1">{location}</p>}
                          </div>
                          <div className="bg-white border-x-2 border-b-2 border-blue-200 rounded-b-xl divide-y divide-slate-200">
                            {groupExps.map((experience) => {
                              const expIndex = resumeData.experiences.findIndex(e => e.id === experience.id);
                              return (
                                <div key={experience.id} className="p-4">
                                  <div className="mb-3 pb-3 border-b border-slate-200">
                                    <h4 className="text-base font-semibold text-gray-800">{experience.title}</h4>
                                    <p className="text-sm text-gray-600 mt-1">
                                      {experience.startDate} - {experience.endDate}
                                    </p>
                                  </div>
                                  <ExperienceCard
                                    experience={experience}
                                    selectedBulletId={selectedBulletId}
                                    onBulletSelect={onBulletSelect}
                                    isFirst={renderIndex++ === 0}
                                    onExperienceChange={handleExperienceChange(expIndex)}
                                    onEdit={() => onEditExperience?.(experience.id)}
                                    onDelete={() => handleDeleteClick('experience', experience.id, `${experience.title} at ${experience.company}`)}
                                    onAddBullet={onAddBullet ? (content) => onAddBullet(experience.id, content) : undefined}
                                    hideHeader={true}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    } else {
                      // Mode 2: Titles stacked, then all bullets below
                      const sortedExps = [...groupExps].sort((a, b) => {
                        // Sort by start date if available
                        if (a.startDate && b.startDate) {
                          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
                        }
                        return 0;
                      });

                      return (
                        <div key={groupId} className="mb-4 bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
                          <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 border-b-2 border-slate-200">
                            <h3 className="text-lg font-bold text-gray-900">{company}</h3>
                            {location && <p className="text-sm font-semibold text-gray-600 mt-1">{location}</p>}
                            <div className="mt-4 space-y-2">
                              {sortedExps.map((experience) => {
                                const expIndex = resumeData.experiences.findIndex(e => e.id === experience.id);
                                return (
                                  <div key={experience.id} className="flex items-center justify-between">
                                    <div>
                                      <h4 className="text-base font-semibold text-gray-800">{experience.title}</h4>
                                      <p className="text-sm text-gray-600 mt-0.5">
                                        {experience.startDate} - {experience.endDate}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => onEditExperience?.(experience.id)}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => handleDeleteClick('experience', experience.id, `${experience.title} at ${experience.company}`)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <div className="p-5">
                            <h4 className="text-sm font-bold text-gray-700 mb-4">Bullets</h4>
                            <div className="space-y-4">
                              {sortedExps.map((experience) => {
                                const expIndex = resumeData.experiences.findIndex(e => e.id === experience.id);
                                return (
                                  <div key={experience.id} className="mb-4 last:mb-0">
                                    <div className="text-xs font-semibold text-gray-500 mb-3 px-2 pb-2 border-b border-slate-200">
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
                                            onDragStart={() => {}}
                                            onDragOver={() => {}}
                                            onDrop={() => {}}
                                            onDragEnd={() => {}}
                                            onToggleSelection={(checked) => {
                                              const newBullets = [...(experience.bullets || [])];
                                              const bulletIdx = newBullets.findIndex(b => b.id === bullet.id);
                                              if (bulletIdx >= 0) {
                                                newBullets[bulletIdx] = { ...newBullets[bulletIdx], isSelected: checked };
                                                handleExperienceChange(expIndex)({ ...experience, bullets: newBullets });
                                              }
                                            }}
                                          />
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-gray-400 ml-4 italic">No bullets for this role</p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}

                  {/* Render standalone experiences */}
                  {standalone.map((experience, index) => {
                    const expIndex = resumeData.experiences.findIndex(e => e.id === experience.id);
                    return (
                      <ExperienceCard
                        key={experience.id}
                        experience={experience}
                        selectedBulletId={selectedBulletId}
                        onBulletSelect={onBulletSelect}
                        isFirst={renderIndex++ === 0 && groups.size === 0}
                        onExperienceChange={handleExperienceChange(expIndex)}
                        onEdit={() => onEditExperience?.(experience.id)}
                        onDelete={() => handleDeleteClick('experience', experience.id, `${experience.title} at ${experience.company}`)}
                        onAddBullet={onAddBullet ? (content) => onAddBullet(experience.id, content) : undefined}
                      />
                    );
                  })}
                </>
              );
            })()}

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
                <button
                  onClick={() => onAddSkill?.('technical')}
                  disabled={!onAddSkill}
                  className="text-sm text-blue-600 hover:text-blue-700 font-bold px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Add Skill
                </button>
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
              </div>
            </div>

            {/* Product Skills */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-base font-bold text-gray-800">
                  Product Management Skills
                </label>
                <button
                  onClick={() => onAddSkill?.('product')}
                  disabled={!onAddSkill}
                  className="text-sm text-blue-600 hover:text-blue-700 font-bold px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Add Skill
                </button>
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
              </div>
            </div>

            {/* Soft Skills */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-base font-bold text-gray-800">
                  Soft Skills
                </label>
                <button
                  onClick={() => onAddSkill?.('soft')}
                  disabled={!onAddSkill}
                  className="text-sm text-blue-600 hover:text-blue-700 font-bold px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Add Skill
                </button>
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

