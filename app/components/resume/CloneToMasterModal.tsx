'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { ResumeVersion } from '@/lib/hooks/useResumeData';

type CloneToMasterModalProps = {
  isOpen: boolean;
  onClose: () => void;
  sourceMaster: ResumeVersion | null | undefined;
  onClone: (sourceVersionId: string, newName: string) => Promise<void>;
};

export default function CloneToMasterModal({
  isOpen,
  onClose,
  sourceMaster,
  onClone,
}: CloneToMasterModalProps) {
  const [resumeName, setResumeName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sourceMaster || !resumeName.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      await onClone(sourceMaster.id, resumeName.trim());

      // Reset form and close
      setResumeName('');
      onClose();
    } catch (error) {
      console.error('Error cloning resume:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setResumeName('');
      onClose();
    }
  };

  if (!isOpen || !sourceMaster) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Clone to New Master Resume
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Show source master name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cloning From
            </label>
            <div className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs font-bold bg-gradient-to-br from-blue-400 to-cyan-400 text-white rounded-md">
                  MASTER
                </span>
                <span className="font-medium text-gray-800">
                  {sourceMaster.name}
                </span>
              </div>
            </div>
          </div>

          {/* New Master Resume Name */}
          <div>
            <label htmlFor="resume-name" className="block text-sm font-medium text-gray-700 mb-2">
              New Master Resume Name
            </label>
            <input
              id="resume-name"
              type="text"
              value={resumeName}
              onChange={(e) => setResumeName(e.target.value)}
              placeholder="e.g., Platform PM Master"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={isLoading}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="w-[35%] px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !resumeName.trim()}
              className="w-[65%] px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create Master Resume'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
