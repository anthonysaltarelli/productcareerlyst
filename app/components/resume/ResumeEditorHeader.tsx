"use client";

type Props = {
  hasUnsavedChanges: boolean;
  onSave: () => void;
  onDiscard: () => void;
  isSaving?: boolean;
};

export default function ResumeEditorHeader({
  hasUnsavedChanges,
  onSave,
  onDiscard,
  isSaving = false,
}: Props) {
  return (
    <div className="sticky top-0 z-10 bg-gradient-to-r from-white to-blue-50 border-b-2 border-slate-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-8 py-4 flex items-center justify-between">
        {/* Status Indicator */}
        <div className="flex items-center gap-3">
          {hasUnsavedChanges ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-orange-700">
                  Unsaved changes
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-sm font-semibold text-green-700">
                  All changes saved
                </span>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onDiscard}
            disabled={!hasUnsavedChanges || isSaving}
            className="px-4 py-2 text-sm font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed border-2 text-red-700 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 disabled:hover:bg-red-50 disabled:hover:border-red-200"
          >
            Discard Changes
          </button>
          <button
            onClick={onSave}
            disabled={!hasUnsavedChanges || isSaving}
            className="px-5 py-2 text-sm font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-sm disabled:from-slate-300 disabled:to-slate-400"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Saving...
              </span>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

