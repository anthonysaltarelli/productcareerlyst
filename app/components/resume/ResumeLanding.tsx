"use client";

import { mockResumeScore } from "./mockData";
import type { ResumeVersion } from "@/lib/hooks/useResumeData";

type Props = {
  versions: ResumeVersion[];
  onEditVersion: (versionId: string) => void;
  onCreateVersion?: () => void;
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

export default function ResumeLanding({ versions, onEditVersion, onCreateVersion }: Props) {
  return (
    <div className="p-8 md:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-blue-200 to-cyan-200 shadow-[0_20px_0_0_rgba(37,99,235,0.3)] border-2 border-blue-300">
            <div className="inline-block px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-bold mb-4">
              📄 RESUME BUILDER
            </div>
            <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-br from-blue-700 to-cyan-600 bg-clip-text text-transparent mb-4 leading-tight">
              Craft Your Perfect Resume 🎯
            </h1>
            <p className="text-xl text-gray-700 font-semibold">
              Create multiple versions for different jobs. Stand out, get hired.
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="p-6 rounded-[2rem] bg-gradient-to-br from-green-200 to-emerald-200 shadow-[0_10px_0_0_rgba(22,163,74,0.3)] border-2 border-green-300 text-center">
            <p className="text-4xl font-black text-green-600 mb-2">{mockResumeScore.overall}</p>
            <p className="text-sm font-bold text-gray-700">Resume Score</p>
          </div>

          <div className="p-6 rounded-[2rem] bg-gradient-to-br from-blue-200 to-cyan-200 shadow-[0_10px_0_0_rgba(37,99,235,0.3)] border-2 border-blue-300 text-center">
            <p className="text-4xl font-black text-blue-600 mb-2">{versions.length}</p>
            <p className="text-sm font-bold text-gray-700">Resume Versions</p>
          </div>

          <div className="p-6 rounded-[2rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_10px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300 text-center">
            <p className="text-4xl font-black text-purple-600 mb-2">Good</p>
            <p className="text-sm font-bold text-gray-700">ATS Compatible</p>
          </div>

          <div className="p-6 rounded-[2rem] bg-gradient-to-br from-orange-200 to-yellow-200 shadow-[0_10px_0_0_rgba(234,88,12,0.3)] border-2 border-orange-300 text-center">
            <p className="text-4xl font-black text-orange-600 mb-2">1</p>
            <p className="text-sm font-bold text-gray-700">Page Count</p>
          </div>
        </div>

        {/* Resume Versions */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-black text-gray-800">📄 Your Resumes</h2>
          {onCreateVersion && (
            <button 
              onClick={onCreateVersion}
              className="px-8 py-3 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_6px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200"
            >
              + Create New Version
            </button>
          )}
        </div>

        {/* Resume Cards Grid */}
        {versions.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-slate-200 to-slate-300 rounded-[2rem] border-2 border-slate-400 mb-6">
              <svg className="w-12 h-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-gray-800 mb-2">No Resumes Yet</h3>
            <p className="text-gray-600 font-medium mb-6">Create your first resume to get started!</p>
            {onCreateVersion && (
              <button 
                onClick={onCreateVersion}
                className="px-8 py-3 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_6px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200"
              >
                + Create First Resume
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {versions.map((version) => (
            <div
              key={version.id}
              className="rounded-[2rem] bg-gradient-to-br from-slate-100 to-slate-200 shadow-[0_10px_0_0_rgba(51,65,85,0.3)] border-2 border-slate-300 overflow-hidden hover:translate-y-1 hover:shadow-[0_6px_0_0_rgba(51,65,85,0.3)] transition-all duration-200"
            >
              {/* Card Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-black text-gray-800">
                        {version.name}
                      </h3>
                      {version.is_master && (
                        <span className="px-3 py-1 text-xs font-bold bg-gradient-to-br from-blue-400 to-cyan-400 text-white rounded-[0.75rem] border-2 border-blue-500">
                          MASTER
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 font-medium">
                      Modified: {formatDate(version.updated_at)}
                    </p>
                  </div>
                </div>

                {/* Score Only */}
                <div className="mb-4">
                  <div className="bg-white rounded-[1rem] p-4 border-2 border-slate-300">
                    <p className="text-xs text-gray-600 font-bold mb-1">Resume Score</p>
                    <p className="text-3xl font-black text-gray-800">
                      {mockResumeScore.overall}
                      <span className="text-lg text-gray-500 font-semibold">/100</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="p-4 bg-white/60 flex gap-2">
                <button
                  onClick={() => onEditVersion(version.id)}
                  className="flex-1 px-4 py-2 rounded-[1rem] bg-gradient-to-br from-blue-500 to-cyan-500 shadow-[0_4px_0_0_rgba(37,99,235,0.6)] border-2 border-blue-600 hover:translate-y-0.5 hover:shadow-[0_2px_0_0_rgba(37,99,235,0.6)] font-black text-white transition-all duration-200 text-sm"
                >
                  Edit →
                </button>
                <button className="px-4 py-2 rounded-[1rem] bg-white hover:bg-gray-50 text-gray-700 font-bold border-2 border-slate-300 shadow-[0_4px_0_0_rgba(51,65,85,0.3)] hover:translate-y-0.5 hover:shadow-[0_2px_0_0_rgba(51,65,85,0.3)] transition-all duration-200 text-sm">
                  PDF
                </button>
              </div>
            </div>
          ))}
          </div>
        )}

        {/* Help Section */}
        <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-slate-700 to-slate-900 shadow-[0_20px_0_0_rgba(15,23,42,0.4)] border-2 border-slate-800">
          <h3 className="text-2xl font-black text-white mb-4">🎯 Getting Started</h3>
          <p className="text-gray-300 font-medium text-lg mb-6">
            Your Master Resume contains all your experiences and bullets. Create job-specific
            versions by selecting which bullets to include and customizing them for each
            application.
          </p>
          <div className="flex gap-4">
            <button className="px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_6px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200">
              📺 Watch Tutorial
            </button>
            <button className="px-6 py-3 rounded-[1.5rem] bg-white/10 border-2 border-slate-600 hover:bg-white/20 font-bold text-white transition-all duration-200">
              📚 View Documentation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

