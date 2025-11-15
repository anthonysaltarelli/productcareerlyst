"use client";

import { useState } from "react";
import { resumeVersions, sections, mockResumeScore } from "./mockData";

type Props = {
  selectedVersion: string;
  onVersionChange: (versionId: string) => void;
  selectedSection: string;
  onSectionChange: (sectionId: string) => void;
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
  selectedVersion,
  onVersionChange,
  selectedSection,
  onSectionChange,
}: Props) {
  const [isVersionDropdownOpen, setIsVersionDropdownOpen] = useState(false);

  const currentVersion = resumeVersions.find((v) => v.id === selectedVersion);

  return (
    <div className="flex flex-col h-full">
      {/* Version Switcher */}
      <div className="p-6 border-b border-slate-200">
        <div className="relative">
          <button
            onClick={() => setIsVersionDropdownOpen(!isVersionDropdownOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-br from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 rounded-xl transition-all shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">
                {currentVersion?.name}
              </span>
              {currentVersion?.isMaster && (
                <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-br from-blue-400 to-cyan-400 text-white rounded-lg border border-blue-500">
                  Master
                </span>
              )}
            </div>
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${
                isVersionDropdownOpen ? "rotate-180" : ""
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

          {/* Dropdown */}
          {isVersionDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-xl z-10 overflow-hidden">
              <div className="py-2">
                {resumeVersions.map((version) => (
                  <button
                    key={version.id}
                    onClick={() => {
                      onVersionChange(version.id);
                      setIsVersionDropdownOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gradient-to-br hover:from-blue-50 hover:to-cyan-50 transition-all flex items-center justify-between"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900">
                        {version.name}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        Modified {formatDate(version.lastModified)}
                      </span>
                    </div>
                    {version.id === selectedVersion && (
                      <svg
                        className="w-4 h-4 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-200 p-2 bg-slate-50">
                <button className="w-full px-4 py-2 text-sm font-bold bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-lg transition-all hover:shadow-md flex items-center gap-2 justify-center">
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  New Version
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex-1 overflow-y-auto p-6">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
          Sections
        </h3>
        <nav className="space-y-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                selectedSection === section.id
                  ? "bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-700 font-semibold shadow-sm border border-blue-200"
                  : "text-gray-700 hover:bg-slate-50 font-medium border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{section.title}</span>
              </div>
              {section.itemCount && (
                <span className="text-xs font-bold text-gray-600 bg-white px-2 py-1 rounded-lg shadow-sm">
                  {section.itemCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <button className="w-full mt-4 px-4 py-3 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all flex items-center gap-2 justify-center border-2 border-dashed border-slate-300 hover:border-slate-400">
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Custom Section
        </button>
      </div>

      {/* Quick Stats */}
      <div className="p-6 border-t border-slate-200 space-y-4 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Resume Score</span>
            <span className="text-lg font-black text-gray-900">
              {mockResumeScore.overall}/100
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-400 to-emerald-500 h-2.5 rounded-full transition-all"
              style={{ width: `${mockResumeScore.overall}%` }}
            />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">ATS Compatible</span>
          <span className="text-sm font-bold bg-gradient-to-br from-green-100 to-emerald-100 text-green-700 px-3 py-1 rounded-lg border border-green-200">
            {mockResumeScore.atsCompatibility}
          </span>
        </div>

        <button className="w-full px-4 py-3 bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
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
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Export PDF
        </button>

        <button className="w-full px-4 py-3 bg-white hover:bg-slate-50 text-gray-700 font-semibold rounded-xl transition-all border border-slate-200 shadow-sm hover:shadow flex items-center justify-center gap-2">
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
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Settings
        </button>
      </div>
    </div>
  );
}

