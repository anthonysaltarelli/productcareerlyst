"use client";

import { useState } from "react";
import { Experience } from "./mockData";
import BulletEditor from "./BulletEditor";

type Props = {
  experience: Experience;
  selectedBulletId: string | null;
  onBulletSelect: (bulletId: string | null) => void;
  isFirst: boolean;
  onExperienceChange: (updatedExperience: Experience) => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onAddBullet?: (content: string) => Promise<void>;
  hideHeader?: boolean;
  hideBulletHeader?: boolean;
};

export default function ExperienceCard({
  experience,
  selectedBulletId,
  onBulletSelect,
  isFirst,
  onExperienceChange,
  onDelete,
  onEdit,
  onAddBullet,
  hideHeader = false,
  hideBulletHeader = false,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(isFirst);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isAddingBullet, setIsAddingBullet] = useState(false);
  const [newBulletContent, setNewBulletContent] = useState("");

  const bullets = experience.bullets;
  const selectedBullets = bullets.filter((b) => b.isSelected);

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Add a slight opacity to show it's being dragged
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (draggedIndex === null || draggedIndex === index) return;

    // Reorder the bullets array
    const newBullets = [...bullets];
    const draggedBullet = newBullets[draggedIndex];
    newBullets.splice(draggedIndex, 1);
    newBullets.splice(index, 0, draggedBullet);
    
    onExperienceChange({ ...experience, bullets: newBullets });
    setDraggedIndex(index);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    // Reset opacity
    const draggedElements = document.querySelectorAll('[draggable="true"]');
    draggedElements.forEach((el) => {
      if (el instanceof HTMLElement) {
        el.style.opacity = "1";
      }
    });
  };

  const handleToggleSelection = (bulletId: string) => (checked: boolean) => {
    const bulletIndex = bullets.findIndex((b) => b.id === bulletId);
    if (bulletIndex === -1) return;

    const newBullets = [...bullets];

    // Update the bullet's selection status
    newBullets[bulletIndex] = {
      ...newBullets[bulletIndex],
      isSelected: checked,
    };

    if (!checked) {
      // If unchecking, move it after the last checked bullet
      let lastCheckedIndex = -1;
      for (let i = 0; i < newBullets.length; i++) {
        if (i !== bulletIndex && newBullets[i].isSelected) {
          lastCheckedIndex = i;
        }
      }

      // Move it after the last checked bullet if there are any checked bullets
      if (lastCheckedIndex >= 0) {
        const [movedBullet] = newBullets.splice(bulletIndex, 1);
        // Adjust target index if we're moving from before the last checked bullet
        const targetIndex = bulletIndex < lastCheckedIndex ? lastCheckedIndex : lastCheckedIndex + 1;
        newBullets.splice(targetIndex, 0, movedBullet);
      }
    } else {
      // If checking, move it after the last checked bullet (which is now this one after update)
      // Find the last checked bullet's index (excluding the current bullet)
      let lastCheckedIndex = -1;
      for (let i = 0; i < newBullets.length; i++) {
        if (i !== bulletIndex && newBullets[i].isSelected) {
          lastCheckedIndex = i;
        }
      }

      // If there are other checked bullets, move after them
      // If no other checked bullets, move to the beginning
      const [movedBullet] = newBullets.splice(bulletIndex, 1);
      const targetIndex = lastCheckedIndex >= 0 ? (bulletIndex < lastCheckedIndex ? lastCheckedIndex : lastCheckedIndex + 1) : 0;
      newBullets.splice(targetIndex, 0, movedBullet);
    }

    onExperienceChange({ ...experience, bullets: newBullets });
  };

  const handleBulletContentChange = (bulletId: string) => (newContent: string) => {
    const bulletIndex = bullets.findIndex((b) => b.id === bulletId);
    if (bulletIndex === -1) return;

    const newBullets = [...bullets];
    newBullets[bulletIndex] = {
      ...newBullets[bulletIndex],
      content: newContent,
    };

    onExperienceChange({ ...experience, bullets: newBullets });
  };

  const handleAddBulletClick = () => {
    setIsAddingBullet(true);
  };

  const handleSaveBullet = async () => {
    if (!newBulletContent.trim() || !onAddBullet) return;

    try {
      await onAddBullet(newBulletContent.trim());
      setNewBulletContent("");
      setIsAddingBullet(false);
    } catch (error) {
      console.error("Error adding bullet:", error);
    }
  };

  const handleCancelAddBullet = () => {
    setNewBulletContent("");
    setIsAddingBullet(false);
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      {!hideHeader && (
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

              {/* Bullet Count Summary */}
              <div className="mt-4 flex items-center gap-4">
                <span className="text-xs font-semibold text-gray-600">
                  <span className="font-black text-gray-900">
                    {selectedBullets.length}
                  </span>{" "}
                  / {bullets.length} bullets selected
                </span>
                <div className="flex items-center gap-1.5">
                  {bullets.map((bullet) => (
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
      )}

      {/* Bullets */}
      {(isExpanded || hideHeader) && (
        <div className="p-5">
          {!hideBulletHeader && (
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-gray-700">Bullets</h4>
            {!isAddingBullet && (
              <button
                onClick={handleAddBulletClick}
                disabled={!onAddBullet}
                className="px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-all flex items-center gap-1.5 border border-transparent hover:border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                Add Bullet
              </button>
            )}
          </div>
          )}

          <div className="space-y-3">
            {/* Inline Add Bullet Form */}
            {isAddingBullet && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Bullet Point
                </label>
                <textarea
                  value={newBulletContent}
                  onChange={(e) => setNewBulletContent(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-green-200 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all bg-white resize-none text-sm"
                  placeholder="e.g., Led cross-functional team of 12 engineers to launch new feature, resulting in 25% increase in user engagement"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleSaveBullet}
                    disabled={!newBulletContent.trim()}
                    className="flex-1 px-4 py-2 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm font-bold rounded-lg transition-all border-2 border-green-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Bullet
                  </button>
                  <button
                    onClick={handleCancelAddBullet}
                    className="flex-1 px-4 py-2 bg-gradient-to-br from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 text-sm font-bold rounded-lg transition-all border-2 border-slate-300 shadow-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {bullets.map((bullet, index) => (
              <BulletEditor
                key={bullet.id}
                bullet={bullet}
                index={index}
                isSelected={selectedBulletId === bullet.id}
                onSelect={() => onBulletSelect(bullet.id)}
                onDragStart={handleDragStart(index)}
                onDragOver={handleDragOver(index)}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onToggleSelection={handleToggleSelection(bullet.id)}
                onContentChange={handleBulletContentChange(bullet.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

