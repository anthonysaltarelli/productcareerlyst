"use client";

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
  onDeleteExperience?: (experienceId: string, title: string) => void;
  onAddBullet?: (experienceId: string, content: string) => Promise<void>;
  onUpdateBulletMode?: (groupId: string, mode: 'per_role' | 'per_experience') => Promise<void>;
  onAddRole?: (groupId: string) => void; // Opens edit modal for the experience group
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
}: Props) {
  const sortedExps = [...experiences].sort((a, b) => {
    if (a.startDate && b.startDate) {
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    }
    return 0;
  });

  const allBullets = sortedExps.flatMap(exp => exp.bullets || []);
  const selectedBullets = allBullets.filter(b => b.isSelected);

  return (
    <div className="mb-6 bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-b-2 border-slate-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">{company}</h3>
            {location && <p className="text-sm font-semibold text-gray-600 mt-1">{location}</p>}
          </div>
        </div>

        {/* Roles List */}
        <div className="space-y-2">
          {sortedExps.map((experience) => {
            return (
              <div key={experience.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
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
            className="mt-3 w-full py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-blue-300 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Role
          </button>
        )}
      </div>

      {/* Bullets Section */}
      <div className="p-6">
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
                    <button
                      onClick={() => {
                        const content = prompt("Enter bullet content:");
                        if (content) onAddBullet(experience.id, content);
                      }}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      + Add Bullet
                    </button>
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
              <button
                onClick={() => {
                  const content = prompt("Enter bullet content:");
                  if (content) onAddBullet(sortedExps[0].id, content);
                }}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-semibold"
              >
                + Add Bullet
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

