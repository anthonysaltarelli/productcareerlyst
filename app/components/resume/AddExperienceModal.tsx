"use client";

import { useState, useEffect } from "react";

type ExperienceFormData = {
  title: string;
  company: string;
  location: string;
  start_date: string;
  end_date: string;
};

type Props = {
  isOpen: boolean;
  onConfirm: (data: ExperienceFormData) => void;
  onCancel: () => void;
  isAdding?: boolean;
  initialData?: ExperienceFormData | null;
  mode?: 'add' | 'edit';
};

export default function AddExperienceModal({
  isOpen,
  onConfirm,
  onCancel,
  isAdding = false,
  initialData = null,
  mode = 'add',
}: Props) {
  const [formData, setFormData] = useState<ExperienceFormData>({
    title: '',
    company: '',
    location: '',
    start_date: '',
    end_date: '',
  });

  // Update form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        title: '',
        company: '',
        location: '',
        start_date: '',
        end_date: '',
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim() && formData.company.trim()) {
      onConfirm(formData);
      // Reset form
      setFormData({
        title: '',
        company: '',
        location: '',
        start_date: '',
        end_date: '',
      });
    }
  };

  const handleCancel = () => {
    // Reset form
    setFormData({
      title: '',
      company: '',
      location: '',
      start_date: '',
      end_date: '',
    });
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border-4 border-blue-200 overflow-hidden">
        <div className="bg-gradient-to-br from-blue-100 to-cyan-100 p-6 border-b-4 border-blue-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl border-2 border-blue-300 shadow-sm">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-blue-900">
              {mode === 'edit' ? 'Edit Experience' : 'Add Experience'}
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="space-y-5">
            {/* Job Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-slate-50 focus:bg-white"
                placeholder="e.g., Senior Product Manager"
                required
                autoFocus
              />
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Company <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-slate-50 focus:bg-white"
                placeholder="e.g., Google"
                required
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-slate-50 focus:bg-white"
                placeholder="e.g., San Francisco, CA"
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="text"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-slate-50 focus:bg-white"
                  placeholder="e.g., Jan 2020"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="text"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-slate-50 focus:bg-white"
                  placeholder="e.g., Present"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isAdding}
              className="flex-1 px-6 py-3.5 bg-gradient-to-br from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 font-bold rounded-xl transition-all border-2 border-slate-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAdding || !formData.title.trim() || !formData.company.trim()}
              className="flex-1 px-6 py-3.5 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl transition-all border-2 border-blue-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAdding ? (
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
                  Adding...
                </span>
              ) : (
                mode === 'edit' ? 'Save Changes' : 'Add Experience'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
