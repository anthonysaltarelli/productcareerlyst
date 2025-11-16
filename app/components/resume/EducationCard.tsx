"use client";

import { useState } from "react";
import { Education, Achievement } from "./mockData";

const COMMON_DEGREES = [
  'Associate of Arts',
  'Associate of Science',
  'Associate of Applied Science',
  'Bachelor of Arts',
  'Bachelor of Science',
  'Bachelor of Business Administration',
  'Bachelor of Fine Arts',
  'Bachelor of Engineering',
  'Master of Arts',
  'Master of Science',
  'Master of Business Administration',
  'Master of Fine Arts',
  'Master of Engineering',
  'Master of Education',
  'Master of Public Health',
  'Master of Social Work',
  'Juris Doctor',
  'Doctor of Medicine',
  'Doctor of Philosophy',
  'Doctor of Education',
  'Doctor of Business Administration',
  'Other',
];

type Props = {
  education: Education;
  isFirst: boolean;
  onEducationChange: (field: keyof Education, value: string | Achievement[]) => void;
  onDelete?: () => void;
  onEdit?: () => void;
};

export default function EducationCard({
  education,
  isFirst,
  onEducationChange,
  onDelete,
  onEdit,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(isFirst);
  const [isAddingAchievement, setIsAddingAchievement] = useState(false);
  const [newAchievementText, setNewAchievementText] = useState("");
  const [isCustomDegree, setIsCustomDegree] = useState(() => {
    return education.degree && !COMMON_DEGREES.includes(education.degree);
  });

  const handleDegreeChange = (value: string) => {
    if (value === 'Other') {
      setIsCustomDegree(true);
      onEducationChange("degree", '');
    } else {
      setIsCustomDegree(false);
      onEducationChange("degree", value);
    }
  };

  const handleAddAchievementClick = () => {
    setIsAddingAchievement(true);
  };

  const handleSaveAchievement = () => {
    if (!newAchievementText.trim()) return;

    // Generate a temporary ID for the new achievement
    const newAchievement: Achievement = {
      id: `temp-${Date.now()}-${Math.random()}`,
      achievement: newAchievementText.trim(),
      displayOrder: education.achievements.length,
    };

    const newAchievements = [...education.achievements, newAchievement];
    onEducationChange("achievements", newAchievements);

    setNewAchievementText("");
    setIsAddingAchievement(false);
  };

  const handleCancelAddAchievement = () => {
    setNewAchievementText("");
    setIsAddingAchievement(false);
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
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

            {/* Education Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {education.school || 'New Education'}
                  </h3>
                  <p className="text-sm font-semibold text-gray-600 mt-1.5">
                    {education.degree}{education.field && ` - ${education.field}`}
                    {education.gpa && ` • GPA: ${education.gpa}`}
                  </p>
                  <p className="text-sm font-medium text-gray-500 mt-1">
                    {education.location && `${education.location} • `}
                    {education.startDate} - {education.endDate}
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

                  {/* Edit Button */}
                  <button
                    onClick={onEdit}
                    disabled={!onEdit}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
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

                  {/* Delete Button */}
                  <button
                    onClick={onDelete}
                    disabled={!onDelete}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
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

              {/* Achievement Count Summary */}
              {education.achievements && education.achievements.length > 0 && (
                <div className="mt-4 flex items-center gap-4">
                  <span className="text-xs font-semibold text-gray-600">
                    <span className="font-black text-gray-900">
                      {education.achievements.length}
                    </span>{" "}
                    achievement{education.achievements.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      {isExpanded && (
        <div className="p-5">
          <div className="grid grid-cols-2 gap-5 mb-5">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                School/Institution
              </label>
              <input
                type="text"
                value={education.school}
                onChange={(e) => onEducationChange("school", e.target.value)}
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Degree
              </label>
              {!isCustomDegree ? (
                <select
                  value={education.degree || ''}
                  onChange={(e) => handleDegreeChange(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all bg-white"
                >
                  <option value="">Select degree...</option>
                  {COMMON_DEGREES.map((degree) => (
                    <option key={degree} value={degree}>
                      {degree}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={education.degree}
                    onChange={(e) => onEducationChange("degree", e.target.value)}
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all"
                    placeholder="Enter custom degree"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomDegree(false);
                      onEducationChange("degree", '');
                    }}
                    className="text-xs text-purple-600 hover:text-purple-700 font-semibold"
                  >
                    ← Back to dropdown
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Field of Study
              </label>
              <input
                type="text"
                value={education.field}
                onChange={(e) => onEducationChange("field", e.target.value)}
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={education.location}
                onChange={(e) => onEducationChange("location", e.target.value)}
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                GPA (Optional)
              </label>
              <input
                type="text"
                value={education.gpa}
                onChange={(e) => onEducationChange("gpa", e.target.value)}
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="text"
                value={education.startDate}
                onChange={(e) => onEducationChange("startDate", e.target.value)}
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="text"
                value={education.endDate}
                onChange={(e) => onEducationChange("endDate", e.target.value)}
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all"
              />
            </div>
          </div>

          {/* Achievements Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-700">
                Achievements
              </label>
              {!isAddingAchievement && (
                <button
                  onClick={handleAddAchievementClick}
                  className="text-xs font-bold text-purple-600 hover:text-purple-700 px-3 py-1.5 hover:bg-purple-50 rounded-lg transition-all flex items-center gap-1.5"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Achievement
                </button>
              )}
            </div>
            <div className="space-y-3">
              {/* Inline Add Achievement Form */}
              {isAddingAchievement && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    New Achievement
                  </label>
                  <textarea
                    value={newAchievementText}
                    onChange={(e) => setNewAchievementText(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all bg-white resize-none text-sm"
                    placeholder="e.g., Dean's List all quarters"
                    rows={2}
                    autoFocus
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleSaveAchievement}
                      disabled={!newAchievementText.trim()}
                      className="flex-1 px-4 py-2 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-sm font-bold rounded-lg transition-all border-2 border-purple-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save Achievement
                    </button>
                    <button
                      onClick={handleCancelAddAchievement}
                      className="flex-1 px-4 py-2 bg-gradient-to-br from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 text-sm font-bold rounded-lg transition-all border-2 border-slate-300 shadow-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Existing Achievements */}
              {education.achievements && education.achievements.length > 0 ? (
                education.achievements.map((achievement, idx) => (
                  <div key={achievement.id} className="flex items-start gap-2">
                    <span className="text-slate-400 mt-1.5">•</span>
                    <input
                      type="text"
                      value={achievement.achievement}
                      onChange={(e) => {
                        const newAchievements = [...education.achievements];
                        newAchievements[idx] = {
                          ...achievement,
                          achievement: e.target.value,
                        };
                        onEducationChange("achievements", newAchievements);
                      }}
                      className="flex-1 px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all text-sm"
                    />
                    <button
                      onClick={() => {
                        const newAchievements = education.achievements.filter((_, i) => i !== idx);
                        onEducationChange("achievements", newAchievements);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))
              ) : !isAddingAchievement ? (
                <p className="text-sm text-gray-400 italic">No achievements added yet</p>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
