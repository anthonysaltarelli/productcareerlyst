"use client";

import { useState, useEffect } from "react";
import { Bullet } from "./mockData";

type Props = {
  bullet: Bullet;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onToggleSelection: (checked: boolean) => void;
  onContentChange?: (newContent: string) => void;
};

export default function BulletEditor({ 
  bullet, 
  index, 
  isSelected, 
  onSelect,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onToggleSelection,
  onContentChange,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(bullet.content);

  // Sync local content state when bullet prop changes
  useEffect(() => {
    if (!isEditing) {
      setContent(bullet.content);
    }
  }, [bullet.content, isEditing]);

  const handleSave = () => {
    if (onContentChange && content !== bullet.content) {
      onContentChange(content);
    }
    setIsEditing(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-700 bg-green-100 border-green-200";
    if (score >= 70) return "text-yellow-700 bg-yellow-100 border-yellow-200";
    return "text-red-700 bg-red-100 border-red-200";
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`border-2 rounded-xl transition-all ${
        isSelected
          ? "border-blue-400 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-md"
          : "border-slate-200 bg-white hover:border-slate-300 shadow-sm"
      }`}
      onClick={onSelect}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Compact Left Controls - Vertical Layout */}
          <div className="flex flex-col items-center gap-1 pt-0.5">
            <input
              type="checkbox"
              checked={bullet.isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onToggleSelection(e.target.checked);
              }}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <button 
              className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 p-0.5 rounded transition-all"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
              </svg>
            </button>
            <span className="text-xs font-bold text-gray-400">
              #{index + 1}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Bullet Content */}
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all resize-none bg-slate-50 focus:bg-white"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    className="px-3 py-1.5 text-xs font-bold bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setContent(bullet.content);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-slate-100 rounded-lg transition-all border border-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                {/* Score Badge - Absolute positioned top right */}
                <div
                  className={`absolute top-0 right-0 px-2 py-0.5 rounded-lg text-xs font-bold border ${getScoreColor(
                    bullet.score
                  )}`}
                >
                  {bullet.score}/100
                </div>
                
                <p className="text-sm text-gray-900 leading-relaxed mb-4 pr-16">
                  {content}
                </p>

                {/* Footer Row - Tags and Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Tags */}
                  {bullet.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded border border-slate-200"
                    >
                      {tag}
                    </span>
                  ))}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(true);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-slate-100 rounded transition-all"
                      title="Edit"
                    >
                      Edit
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect();
                      }}
                      className="px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-all"
                      title="Optimize"
                    >
                      Optimize
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect();
                      }}
                      className="px-2.5 py-1 text-xs font-semibold bg-purple-100 text-purple-700 hover:bg-purple-200 rounded transition-all"
                      title="Analyze"
                    >
                      Analyze
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                      title="Delete"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Customization Badge */}
            {bullet.customizedFrom && (
              <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Customized</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

