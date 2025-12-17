'use client';

import { useState } from 'react';
import { FileText, X, Loader2 } from 'lucide-react';

interface NoDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAndProceed: (description: string) => Promise<void>;
  companyName?: string;
  jobTitle?: string;
}

export function NoDescriptionModal({
  isOpen,
  onClose,
  onSaveAndProceed,
  companyName,
  jobTitle,
}: NoDescriptionModalProps) {
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const roleText = jobTitle && companyName
    ? `the ${jobTitle} role at ${companyName}`
    : 'this role';

  const handleSaveAndProceed = async () => {
    if (!description.trim()) {
      setError('Please enter a job description');
      return;
    }

    if (description.trim().length < 50) {
      setError('Please enter a more detailed job description (at least 50 characters)');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSaveAndProceed(description.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save job description');
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setDescription('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="p-6 pb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 border-2 border-orange-200">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
            <h2 className="text-xl font-black text-gray-800">Add Job Description</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-4">
          <p className="text-gray-600 font-medium leading-relaxed mb-4">
            To generate relevant interview questions for {roleText}, paste the job description below.
          </p>

          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Paste the full job description here..."
            disabled={isSaving}
            className="w-full h-48 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none resize-none text-gray-800 placeholder-gray-400 disabled:opacity-50 disabled:bg-gray-50"
          />

          {error && (
            <p className="mt-2 text-sm text-red-600 font-medium">{error}</p>
          )}

          <p className="mt-2 text-xs text-gray-400">
            The job description helps us generate tailored interview questions specific to this role.
          </p>
        </div>

        {/* Actions */}
        <div className="p-6 pt-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAndProceed}
            disabled={isSaving || !description.trim()}
            className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-purple-600 font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save & Start Interview'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
