"use client";

import { useState } from "react";
import { Experience } from "./mockData";
import BulletEditor from "./BulletEditor";

type Props = {
  experience: Experience;
  selectedBulletId: string | null;
  onBulletSelect: (bulletId: string | null) => void;
  isFirst: boolean;
};

export default function ExperienceCard({
  experience,
  selectedBulletId,
  onBulletSelect,
  isFirst,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(isFirst);
  const [showAllBullets, setShowAllBullets] = useState(false);

  const selectedBullets = experience.bullets.filter((b) => b.isSelected);
  const unselectedBullets = experience.bullets.filter((b) => !b.isSelected);

  const bulletsToShow = showAllBullets
    ? experience.bullets
    : [...selectedBullets, ...unselectedBullets.slice(0, 1)];

  const hiddenCount = experience.bullets.length - bulletsToShow.length;

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

            {/* Experience Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {experience.title}
                  </h3>
                  <p className="text-sm font-semibold text-gray-600 mt-1.5">
                    {experience.company} | {experience.location}
                  </p>
                  <p className="text-sm font-medium text-gray-500 mt-1">
                    {experience.startDate} - {experience.endDate}
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

                  {/* More Options */}
                  <div className="relative">
                    <button className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200">
                      <svg
                        className="w-5 h-5 text-gray-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bullet Count Summary */}
              <div className="mt-4 flex items-center gap-4">
                <span className="text-xs font-semibold text-gray-600">
                  <span className="font-black text-gray-900">
                    {selectedBullets.length}
                  </span>{" "}
                  / {experience.bullets.length} bullets selected
                </span>
                <div className="flex items-center gap-1.5">
                  {experience.bullets.map((bullet) => (
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

      {/* Bullets */}
      {isExpanded && (
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-base font-bold text-gray-800">Bullets</h4>
            <button className="px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-all flex items-center gap-2 border border-transparent hover:border-blue-200">
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
              Add Bullet
            </button>
          </div>

          <div className="space-y-4">
            {bulletsToShow.map((bullet, index) => (
              <BulletEditor
                key={bullet.id}
                bullet={bullet}
                index={index}
                isSelected={selectedBulletId === bullet.id}
                onSelect={() => onBulletSelect(bullet.id)}
              />
            ))}
          </div>

          {hiddenCount > 0 && (
            <button
              onClick={() => setShowAllBullets(!showAllBullets)}
              className="w-full mt-4 py-3 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-all border-2 border-dashed border-slate-300 hover:border-blue-300"
            >
              {showAllBullets
                ? "Show Less"
                : `Show ${hiddenCount} More Bullet${hiddenCount !== 1 ? "s" : ""}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

