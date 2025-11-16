"use client";

type Props = {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
  onCancel?: () => void;
  isDeleting?: boolean;
};

export default function DeleteConfirmationModal({
  isOpen,
  title,
  message,
  onConfirm,
  onClose,
  onCancel,
  isDeleting = false,
}: Props) {
  const handleCancel = onCancel || onClose;
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border-4 border-red-200 overflow-hidden">
        <div className="bg-gradient-to-br from-red-100 to-orange-100 p-6 border-b-4 border-red-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl border-2 border-red-300 shadow-sm">
              <svg
                className="w-6 h-6 text-red-600"
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
            </div>
            <h2 className="text-2xl font-bold text-red-900">{title}</h2>
          </div>
        </div>

        <div className="p-8">
          <p className="text-gray-700 font-medium mb-8 leading-relaxed">
            {message}
          </p>

          <div className="flex gap-4">
            <button
              onClick={handleCancel}
              disabled={isDeleting}
              className="flex-1 px-6 py-3.5 bg-gradient-to-br from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 font-bold rounded-xl transition-all border-2 border-slate-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-6 py-3.5 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-xl transition-all border-2 border-red-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
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
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Deleting...
                </span>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
