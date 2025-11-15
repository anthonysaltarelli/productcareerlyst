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
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {/* Drag Handle */}
            <button className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
              </svg>
            </button>

            {/* Experience Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {experience.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {experience.company} | {experience.location}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {experience.startDate} - {experience.endDate}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
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
                    <button className="p-1 hover:bg-gray-100 rounded transition-colors">
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
              <div className="mt-3 flex items-center gap-4">
                <span className="text-xs text-gray-600">
                  <span className="font-semibold text-gray-900">
                    {selectedBullets.length}
                  </span>{" "}
                  / {experience.bullets.length} bullets selected
                </span>
                <div className="flex items-center gap-1">
                  {experience.bullets.map((bullet) => (
                    <div
                      key={bullet.id}
                      className={`w-2 h-2 rounded-full ${
                        bullet.isSelected ? "bg-blue-500" : "bg-gray-300"
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
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-700">Bullets</h4>
            <button className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1">
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

          <div className="space-y-3">
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
              className="w-full mt-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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

