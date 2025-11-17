"use client";

import { useState, useMemo } from "react";
import { sections, mockResumeScore } from "./mockData";
import type { ResumeVersion } from "@/lib/hooks/useResumeData";
import type { ResumeData } from "./mockData";

type Props = {
  versions: ResumeVersion[];
  selectedVersion: string;
  onVersionChange: (versionId: string) => void;
  selectedSection: string;
  onSectionChange: (sectionId: string) => void;
  viewMode: "edit" | "preview";
  onViewModeChange: (mode: "edit" | "preview") => void;
  onBack: () => void;
  resumeData?: ResumeData;
  onUpdateVersionName?: (versionId: string, newName: string) => Promise<void>;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  return date.toLocaleDateString('en-US', options);
};

export default function ResumeVersionSidebar({
  versions,
  selectedVersion,
  onVersionChange,
  selectedSection,
  onSectionChange,
  viewMode,
  onViewModeChange,
  onBack,
  resumeData,
  onUpdateVersionName,
}: Props) {
  const currentVersion = versions.find((v) => v.id === selectedVersion);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(currentVersion?.name || "");
  const [isSavingName, setIsSavingName] = useState(false);

  // Calculate dynamic counts from resume data
  const sectionsWithCounts = useMemo(() => {
    return sections.map((section) => {
      let itemCount: number | undefined = undefined;

      if (resumeData) {
        switch (section.id) {
          case "experience":
            itemCount = resumeData.experiences.length;
            break;
          case "education":
            itemCount = resumeData.education.length;
            break;
          // Add more sections here if needed in the future
        }
      }

      return {
        ...section,
        itemCount: itemCount && itemCount > 0 ? itemCount : undefined,
      };
    });
  }, [resumeData]);

  const handleStartEdit = () => {
    setEditedName(currentVersion?.name || "");
    setIsEditingName(true);
  };

  const handleCancelEdit = () => {
    setEditedName(currentVersion?.name || "");
    setIsEditingName(false);
  };

  const handleSaveName = async () => {
    if (!editedName.trim() || !onUpdateVersionName || !currentVersion) {
      return;
    }

    if (editedName.trim() === currentVersion.name) {
      setIsEditingName(false);
      return;
    }

    setIsSavingName(true);
    try {
      await onUpdateVersionName(selectedVersion, editedName.trim());
      setIsEditingName(false);
    } catch (error) {
      // Error toast already shown by the hook
      setEditedName(currentVersion.name);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Resume Name Header & View Mode Switcher */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg transition-all flex-shrink-0"
            aria-label="Back to resumes"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="flex-1 min-w-0 group">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleSaveName}
                  disabled={isSavingName}
                  className="flex-1 text-base font-bold text-gray-900 bg-white border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900 truncate flex-1">
                  {currentVersion?.name}
                </h2>
                {onUpdateVersionName && (
                  <button
                    onClick={handleStartEdit}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded transition-all"
                    aria-label="Edit resume name"
                    title="Edit resume name"
                  >
                    <svg
                      className="w-4 h-4 text-gray-500 hover:text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200">
          <button
            onClick={() => onViewModeChange("edit")}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              viewMode === "edit"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Edit
          </button>
          <button
            onClick={() => onViewModeChange("preview")}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              viewMode === "preview"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
          Sections
        </h3>
        <nav className="space-y-1.5">
          {sectionsWithCounts.map((section) => (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                selectedSection === section.id
                  ? "bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-700 font-semibold shadow-sm border border-blue-200"
                  : "text-gray-700 hover:bg-slate-50 font-medium border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{section.title}</span>
              </div>
              {section.itemCount && (
                <span className="text-xs font-bold text-gray-600 bg-white px-2 py-0.5 rounded-lg shadow-sm">
                  {section.itemCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Overall Score */}
      <div className="p-4 border-t border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl shadow-sm border-2 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
              Overall Score
            </span>
            <span className="text-2xl font-black bg-gradient-to-br from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {mockResumeScore.overall}
            </span>
          </div>
          <div className="w-full bg-white/50 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all"
              style={{ width: `${mockResumeScore.overall}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

