"use client";

import { useEffect } from "react";

type Props = {
  isOpen: boolean;
  onSaveAndContinue: () => void;
  onDiscardAndContinue: () => void;
  onCancel: () => void;
};

export default function UnsavedChangesModal({
  isOpen,
  onSaveAndContinue,
  onDiscardAndContinue,
  onCancel,
}: Props) {
  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl border-2 border-slate-200 p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
        {/* Icon */}
        <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-2xl border-2 border-orange-200 mx-auto mb-5">
          <svg
            className="w-8 h-8 text-orange-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Content */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
          Unsaved Changes
        </h2>
        <p className="text-gray-600 text-center mb-8 font-medium">
          You have unsaved changes that will be lost if you continue. What would
          you like to do?
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onSaveAndContinue}
            className="w-full px-5 py-3 text-sm font-bold rounded-xl transition-all bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-sm"
          >
            Save and Continue
          </button>
          <button
            onClick={onDiscardAndContinue}
            className="w-full px-5 py-3 text-sm font-bold rounded-xl transition-all border-2 text-red-700 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300"
          >
            Discard Changes
          </button>
          <button
            onClick={onCancel}
            className="w-full px-5 py-3 text-sm font-bold rounded-xl transition-all border-2 text-gray-700 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

