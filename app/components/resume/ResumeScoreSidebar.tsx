"use client";

import { mockResumeScore } from "./mockData";

export default function ResumeScoreSidebar() {
  return (
    <div className="flex flex-col h-full bg-white/80 backdrop-blur-sm">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-lg font-bold text-gray-900">Resume Quality</h2>
        <p className="text-sm text-gray-600 mt-1">Your current score</p>
      </div>

      {/* Resume Score */}
      <div className="flex-1 p-6 space-y-6">
        {/* Overall Score */}
        <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-sm border-2 border-blue-200">
          <div className="text-center mb-4">
            <div className="text-6xl font-black bg-gradient-to-br from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {mockResumeScore.overall}
            </div>
            <div className="text-sm font-bold text-gray-600 uppercase tracking-wide mt-1">
              Overall Score
            </div>
          </div>
          <div className="w-full bg-white/50 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all"
              style={{ width: `${mockResumeScore.overall}%` }}
            />
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Score Breakdown
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Action Verbs</span>
              <span className="text-sm font-bold text-gray-900">{mockResumeScore.actionVerbs}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full"
                style={{ width: `${mockResumeScore.actionVerbs}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Accomplishments</span>
              <span className="text-sm font-bold text-gray-900">{mockResumeScore.accomplishments}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-400 to-cyan-500 h-2 rounded-full"
                style={{ width: `${mockResumeScore.accomplishments}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Quantification</span>
              <span className="text-sm font-bold text-gray-900">{mockResumeScore.quantification}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-400 to-pink-500 h-2 rounded-full"
                style={{ width: `${mockResumeScore.quantification}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Impact</span>
              <span className="text-sm font-bold text-gray-900">{mockResumeScore.impact}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full"
                style={{ width: `${mockResumeScore.impact}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Conciseness</span>
              <span className="text-sm font-bold text-gray-900">{mockResumeScore.conciseness}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full"
                style={{ width: `${mockResumeScore.conciseness}%` }}
              />
            </div>
          </div>
        </div>

        {/* ATS Compatibility */}
        <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">ATS Compatible</span>
            <span className="text-sm font-bold bg-gradient-to-br from-green-100 to-emerald-100 text-green-700 px-3 py-1.5 rounded-lg border border-green-200">
              {mockResumeScore.atsCompatibility}
            </span>
          </div>
        </div>

        {/* Page Count */}
        <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Page Count</span>
            <span className="text-sm font-bold text-gray-900">
              {mockResumeScore.pageCount} page
            </span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="p-6 border-t border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100">
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
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Improve Score
        </button>
      </div>
    </div>
  );
}

