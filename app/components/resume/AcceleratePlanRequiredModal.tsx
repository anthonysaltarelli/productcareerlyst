"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Rocket } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AcceleratePlanRequiredModal({
  isOpen,
  onClose,
}: Props) {
  const router = useRouter();

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
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
  }, [isOpen, onClose]);

  const handleViewPlans = () => {
    router.push("/dashboard/billing/plans");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl border-2 border-slate-200 p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
        {/* Icon */}
        <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl border-2 border-purple-200 mx-auto mb-5">
          <Rocket className="w-8 h-8 text-purple-600" />
        </div>

        {/* Content */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
          Accelerate Plan Required
        </h2>
        <p className="text-gray-600 text-center mb-8 font-medium">
          Resume analysis is available exclusively for Accelerate plan subscribers. Upgrade to unlock this powerful feature and get 30 analyses per month.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleViewPlans}
            className="w-full px-5 py-3 text-sm font-bold rounded-xl transition-all bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-sm"
          >
            View Plans
          </button>
          <button
            onClick={onClose}
            className="w-full px-5 py-3 text-sm font-bold rounded-xl transition-all border-2 text-gray-700 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

