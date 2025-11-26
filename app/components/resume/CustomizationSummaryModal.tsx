'use client';

import { X, Check, ArrowRight, Sparkles, Tag, MoveVertical, Pencil } from 'lucide-react';

type CustomizationSummary = {
  overallDescription?: string;
  keyChanges?: string[];
  keywordsInjected?: string[];
  bulletsReordered: number;
  bulletsOptimized: number;
  skillsAdded: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onViewResume: () => void;
  summary: CustomizationSummary;
  resumeName: string;
  jobTitle: string;
  companyName: string;
};

const CustomizationSummaryModal = ({
  isOpen,
  onClose,
  onViewResume,
  summary,
  resumeName,
  jobTitle,
  companyName,
}: Props) => {
  if (!isOpen) return null;

  const totalChanges = summary.bulletsReordered + summary.bulletsOptimized + summary.skillsAdded;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customization-summary-title"
    >
      <div className="rounded-[2.5rem] bg-white shadow-[0_20px_0_0_rgba(34,197,94,0.3)] border-2 border-green-400 max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-[1.25rem] bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-[0_4px_0_0_rgba(34,197,94,0.4)]">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 
                id="customization-summary-title"
                className="text-2xl font-black text-gray-900"
              >
                Resume Customized! 🎉
              </h2>
              <p className="text-gray-600 font-semibold">
                Tailored for {jobTitle} at {companyName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-[1rem]"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Overall Description */}
        <div className="p-5 rounded-[1.5rem] bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 mb-6">
          <p className="text-gray-800 font-semibold leading-relaxed">
            {summary.overallDescription}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-[1.25rem] bg-gradient-to-br from-blue-100 to-cyan-100 border-2 border-blue-300 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <MoveVertical className="w-4 h-4 text-blue-600" />
              <span className="text-2xl font-black text-blue-700">{summary.bulletsReordered}</span>
            </div>
            <p className="text-xs font-bold text-blue-600">Bullets Reordered</p>
          </div>
          <div className="p-4 rounded-[1.25rem] bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-300 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Pencil className="w-4 h-4 text-purple-600" />
              <span className="text-2xl font-black text-purple-700">{summary.bulletsOptimized}</span>
            </div>
            <p className="text-xs font-bold text-purple-600">Bullets Optimized</p>
          </div>
          <div className="p-4 rounded-[1.25rem] bg-gradient-to-br from-orange-100 to-yellow-100 border-2 border-orange-300 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Tag className="w-4 h-4 text-orange-600" />
              <span className="text-2xl font-black text-orange-700">{summary.skillsAdded}</span>
            </div>
            <p className="text-xs font-bold text-orange-600">Skills Added</p>
          </div>
        </div>

        {/* Key Changes */}
        {summary.keyChanges && summary.keyChanges.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-black text-gray-900 mb-3 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              Key Changes Made
            </h3>
            <ul className="space-y-2">
              {summary.keyChanges.map((change, index) => (
                <li 
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-[1rem] bg-gray-50 border-2 border-gray-200"
                >
                  <span className="w-6 h-6 flex-shrink-0 rounded-full bg-green-100 text-green-700 font-black text-xs flex items-center justify-center border border-green-300">
                    {index + 1}
                  </span>
                  <span className="text-gray-700 font-medium">{change}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Keywords Injected */}
        {summary.keywordsInjected && summary.keywordsInjected.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-black text-gray-900 mb-3 flex items-center gap-2">
              <Tag className="w-5 h-5 text-blue-600" />
              Keywords Added
            </h3>
            <div className="flex flex-wrap gap-2">
              {summary.keywordsInjected.map((keyword, index) => (
                <span 
                  key={index}
                  className="px-3 py-1.5 rounded-[0.75rem] bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-700 font-bold text-sm border-2 border-blue-300"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Resume Name */}
        <div className="p-4 rounded-[1.25rem] bg-gray-100 border-2 border-gray-300 mb-6">
          <p className="text-sm text-gray-600 font-semibold mb-1">New Resume Version</p>
          <p className="text-lg font-black text-gray-900">{resumeName}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3.5 rounded-[1.5rem] border-2 border-gray-300 bg-white text-gray-700 font-black hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={onViewResume}
            className="flex-1 px-6 py-3.5 rounded-[1.5rem] bg-gradient-to-br from-green-500 to-emerald-500 shadow-[0_6px_0_0_rgba(34,197,94,0.6)] border-2 border-green-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(34,197,94,0.6)] font-black text-white transition-all duration-200 flex items-center justify-center gap-2"
          >
            View Resume
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomizationSummaryModal;

