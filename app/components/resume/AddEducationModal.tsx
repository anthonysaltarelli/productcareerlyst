"use client";

import { useState, useEffect } from "react";

type EducationFormData = {
  school: string;
  degree: string;
  field: string;
  location: string;
  start_date: string;
  end_date: string;
  gpa: string;
};

type Props = {
  isOpen: boolean;
  onConfirm: (data: EducationFormData) => void;
  onCancel: () => void;
  isAdding?: boolean;
  initialData?: EducationFormData | null;
  mode?: 'add' | 'edit';
};

const COMMON_DEGREES = [
  'Associate of Arts',
  'Associate of Science',
  'Associate of Applied Science',
  'Bachelor of Arts',
  'Bachelor of Science',
  'Bachelor of Business Administration',
  'Bachelor of Fine Arts',
  'Bachelor of Engineering',
  'Master of Arts',
  'Master of Science',
  'Master of Business Administration',
  'Master of Fine Arts',
  'Master of Engineering',
  'Master of Education',
  'Master of Public Health',
  'Master of Social Work',
  'Juris Doctor',
  'Doctor of Medicine',
  'Doctor of Philosophy',
  'Doctor of Education',
  'Doctor of Business Administration',
  'Other',
];

export default function AddEducationModal({
  isOpen,
  onConfirm,
  onCancel,
  isAdding = false,
  initialData = null,
  mode = 'add',
}: Props) {
  const [formData, setFormData] = useState<EducationFormData>({
    school: '',
    degree: '',
    field: '',
    location: '',
    start_date: '',
    end_date: '',
    gpa: '',
  });
  const [isCustomDegree, setIsCustomDegree] = useState(false);

  // Update form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      // Check if the degree is in the common list or custom
      const degreeIsCustom = initialData.degree && !COMMON_DEGREES.includes(initialData.degree);
      setIsCustomDegree(degreeIsCustom);
    } else {
      setFormData({
        school: '',
        degree: '',
        field: '',
        location: '',
        start_date: '',
        end_date: '',
        gpa: '',
      });
      setIsCustomDegree(false);
    }
  }, [initialData, isOpen]);

  const handleDegreeChange = (value: string) => {
    if (value === 'Other') {
      setIsCustomDegree(true);
      setFormData({ ...formData, degree: '' });
    } else {
      setIsCustomDegree(false);
      setFormData({ ...formData, degree: value });
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.school.trim() && formData.degree.trim()) {
      onConfirm(formData);
      // Reset form
      setFormData({
        school: '',
        degree: '',
        field: '',
        location: '',
        start_date: '',
        end_date: '',
        gpa: '',
      });
    }
  };

  const handleCancel = () => {
    // Reset form
    setFormData({
      school: '',
      degree: '',
      field: '',
      location: '',
      start_date: '',
      end_date: '',
      gpa: '',
    });
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border-4 border-purple-200 overflow-hidden">
        <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-6 border-b-4 border-purple-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl border-2 border-purple-300 shadow-sm">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-purple-900">
              {mode === 'edit' ? 'Edit Education' : 'Add Education'}
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="space-y-5">
            {/* School */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                School/Institution <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.school}
                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all bg-slate-50 focus:bg-white"
                placeholder="e.g., Stanford University"
                required
                autoFocus
              />
            </div>

            {/* Degree and Field */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Degree <span className="text-red-500">*</span>
                </label>
                {!isCustomDegree ? (
                  <select
                    value={formData.degree || ''}
                    onChange={(e) => handleDegreeChange(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all bg-slate-50 focus:bg-white"
                    required
                  >
                    <option value="">Select degree...</option>
                    {COMMON_DEGREES.map((degree) => (
                      <option key={degree} value={degree}>
                        {degree}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={formData.degree}
                      onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all bg-slate-50 focus:bg-white"
                      placeholder="Enter custom degree"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomDegree(false);
                        setFormData({ ...formData, degree: '' });
                      }}
                      className="text-xs text-purple-600 hover:text-purple-700 font-semibold"
                    >
                      ← Back to dropdown
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Field of Study
                </label>
                <input
                  type="text"
                  value={formData.field}
                  onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all bg-slate-50 focus:bg-white"
                  placeholder="e.g., Computer Science"
                />
              </div>
            </div>

            {/* Location and GPA */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all bg-slate-50 focus:bg-white"
                  placeholder="e.g., Palo Alto, CA"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  GPA (Optional)
                </label>
                <input
                  type="text"
                  value={formData.gpa}
                  onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all bg-slate-50 focus:bg-white"
                  placeholder="e.g., 3.9"
                />
              </div>
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
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all bg-slate-50 focus:bg-white"
                  placeholder="e.g., Sep 2016"
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
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all bg-slate-50 focus:bg-white"
                  placeholder="e.g., Jun 2020"
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
              disabled={isAdding || !formData.school.trim() || !formData.degree.trim()}
              className="flex-1 px-6 py-3.5 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all border-2 border-purple-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                mode === 'edit' ? 'Save Changes' : 'Add Education'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
