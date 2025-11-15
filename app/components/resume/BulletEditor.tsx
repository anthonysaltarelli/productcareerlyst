"use client";

import { useState } from "react";
import { Bullet } from "./mockData";

type Props = {
  bullet: Bullet;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
};

export default function BulletEditor({ bullet, index, isSelected, onSelect }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(bullet.content);

  const handleSave = () => {
    setIsEditing(false);
    // In real implementation, this would save to state/database
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-700 bg-gradient-to-br from-green-100 to-emerald-100 border-green-200";
    if (score >= 70) return "text-yellow-700 bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-200";
    return "text-red-700 bg-gradient-to-br from-red-100 to-pink-100 border-red-200";
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 85) return "bg-gradient-to-r from-green-400 to-emerald-500";
    if (score >= 70) return "bg-gradient-to-r from-yellow-400 to-orange-500";
    return "bg-gradient-to-r from-red-400 to-pink-500";
  };

  return (
    <div
      className={`border-2 rounded-xl transition-all ${
        isSelected
          ? "border-blue-400 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-md"
          : "border-slate-200 bg-white hover:border-slate-300 shadow-sm"
      }`}
      onClick={onSelect}
    >
      <div className="p-4">
        {/* Top Row - Checkbox, Drag Handle, Number */}
        <div className="flex items-start gap-4">
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={bullet.isSelected}
            onChange={(e) => {
              e.stopPropagation();
              // Toggle selection
            }}
            className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
          />

          {/* Drag Handle */}
          <button className="mt-1 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg transition-all">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
            </svg>
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Bullet Number */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <span className="text-xs font-black text-gray-500 bg-slate-100 px-2 py-1 rounded-lg">
                #{index + 1}
              </span>

              {/* Score Badge */}
              <div className="flex items-center gap-2">
                <div
                  className={`px-3 py-1 rounded-xl text-xs font-bold border-2 ${getScoreColor(
                    bullet.score
                  )}`}
                >
                  💡 {bullet.score}/100
                </div>
              </div>
            </div>

            {/* Bullet Content */}
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 text-sm border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all resize-none bg-slate-50 focus:bg-white"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 text-sm font-bold bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setContent(bullet.content);
                    }}
                    className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-100 rounded-xl transition-all border border-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-900 leading-relaxed mb-4 font-medium">
                  {bullet.content}
                </p>

                {/* Score Bar */}
                <div className="mb-4">
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${getScoreBarColor(
                        bullet.score
                      )}`}
                      style={{ width: `${bullet.score}%` }}
                    />
                  </div>
                </div>

                {/* Tags */}
                {bullet.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {bullet.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 text-xs font-semibold bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 rounded-lg border border-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(true);
                    }}
                    className="px-3 py-2 text-xs font-bold text-gray-700 hover:bg-slate-100 rounded-lg transition-all flex items-center gap-1.5 border border-transparent hover:border-slate-200"
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
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect();
                    }}
                    className="px-3 py-2 text-xs font-bold bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-700 hover:from-blue-200 hover:to-cyan-200 rounded-lg transition-all flex items-center gap-1.5 border border-blue-200"
                  >
                    ✨ Optimize
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect();
                    }}
                    className="px-3 py-2 text-xs font-bold bg-gradient-to-br from-purple-100 to-pink-100 text-purple-700 hover:from-purple-200 hover:to-pink-200 rounded-lg transition-all flex items-center gap-1.5 border border-purple-200"
                  >
                    🎯 Analyze
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="ml-auto p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-200"
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Customization Badge */}
            {bullet.customizedFrom && (
              <div className="mt-3 flex items-center gap-2 text-xs font-bold bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-700 px-3 py-2 rounded-lg border border-blue-200">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Customized for this version</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

