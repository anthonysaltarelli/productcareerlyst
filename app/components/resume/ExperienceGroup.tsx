"use client";

import { useState } from "react";
import { Experience } from "./mockData";
import BulletEditor from "./BulletEditor";

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
  isFirst?: boolean;
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
  isFirst = false,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(isFirst);
  const [addingBulletForExperienceId, setAddingBulletForExperienceId] = useState<string | null>(null);
  const [newBulletContent, setNewBulletContent] = useState("");
  
  const sortedExps = [...experiences].sort((a, b) => {
    if (a.startDate && b.startDate) {
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    }
    return 0;
  });

  const allBullets = sortedExps.flatMap(exp => exp.bullets || []);
  const selectedBullets = allBullets.filter(b => b.isSelected);

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
    } catch (error) {
      console.error("Error adding bullet:", error);
    }
  };

  const handleCancelAddBullet = () => {
    setNewBulletContent("");
    setAddingBulletForExperienceId(null);
  };

  return (
    <div className="mb-6 bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 border-b-2 border-slate-200">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            {/* Drag Handle */}
            <button className="mt-1 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 p-1 hover:bg-white rounded-lg transition-all">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
              </svg>
            </button>

            {/* Experience Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{company}</h3>
                  {location && <p className="text-sm font-semibold text-gray-600 mt-1.5">{location}</p>}
                  <p className="text-sm font-medium text-gray-500 mt-1">
                    {sortedExps.length} role{sortedExps.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2">
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

              {/* Bullet Count Summary */}
              <div className="mt-4 flex items-center gap-4">
                <span className="text-xs font-semibold text-gray-600">
                  <span className="font-black text-gray-900">
                    {selectedBullets.length}
                  </span>{" "}
                  / {allBullets.length} bullets selected
                </span>
                <div className="flex items-center gap-1.5">
                  {allBullets.map((bullet) => (
                    <div
                      key={bullet.id}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        bullet.isSelected ? "bg-blue-500 shadow-sm" : "bg-slate-300"
                      }`}
                      title={bullet.isSelected ? "Selected" : "Not selected"}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Details */}
      {isExpanded && (
        <div className="p-5">
          {/* Roles List */}
          <div className="space-y-2 mb-5">
            {sortedExps.map((experience) => {
              return (
                <div key={experience.id} className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-slate-200">
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-gray-800">{experience.title}</h4>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {experience.startDate} - {experience.endDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEditExperience?.(experience.id)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Edit role"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDeleteExperience?.(experience.id, `${experience.title} at ${company}`)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete role"
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

          {/* Add Role Button */}
          {onAddRole && (
            <button
              onClick={() => onAddRole(groupId)}
              className="mb-5 w-full py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border-2 border-blue-300 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Role
            </button>
          )}

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
                              onDragStart={() => {}}
                              onDragOver={() => {}}
                              onDrop={() => {}}
                              onDragEnd={() => {}}
                              onToggleSelection={(checked) => {
                                const newBullets = [...(experience.bullets || [])];
                                const bulletIdx = newBullets.findIndex(b => b.id === bullet.id);
                                if (bulletIdx >= 0) {
                                  newBullets[bulletIdx] = { ...newBullets[bulletIdx], isSelected: checked };
                                  onExperienceChange(experience.id)({ ...experience, bullets: newBullets });
                                }
                              }}
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
                                  onClick={handleSaveBullet}
                                  disabled={!newBulletContent.trim()}
                                  className="flex-1 px-4 py-2 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm font-bold rounded-lg transition-all border-2 border-green-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Save Bullet
                                </button>
                                <button
                                  onClick={handleCancelAddBullet}
                                  className="flex-1 px-4 py-2 bg-gradient-to-br from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 text-sm font-bold rounded-lg transition-all border-2 border-slate-300 shadow-sm"
                                >
                                  Cancel
                                </button>
                              </div>
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
                    
                    return (
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
                          if (experience) {
                            const newBullets = [...(experience.bullets || [])];
                            const bulletIdx = newBullets.findIndex(b => b.id === bullet.id);
                            if (bulletIdx >= 0) {
                              newBullets[bulletIdx] = { ...newBullets[bulletIdx], isSelected: checked };
                              onExperienceChange(experience.id)({ ...experience, bullets: newBullets });
                            }
                          }
                        }}
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
                            onClick={handleSaveBullet}
                            disabled={!newBulletContent.trim()}
                            className="flex-1 px-4 py-2 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm font-bold rounded-lg transition-all border-2 border-green-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Save Bullet
                          </button>
                          <button
                            onClick={handleCancelAddBullet}
                            className="flex-1 px-4 py-2 bg-gradient-to-br from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 text-sm font-bold rounded-lg transition-all border-2 border-slate-300 shadow-sm"
                          >
                            Cancel
                          </button>
                        </div>
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
    </div>
  );
}

