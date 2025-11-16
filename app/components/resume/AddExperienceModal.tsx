"use client";

import { useState, useEffect } from "react";

type Role = {
  title: string;
  start_date: string;
  end_date: string;
};

type ExperienceFormData = {
  company: string;
  location: string;
  roles: Role[];
  bulletMode: 'per_role' | 'per_experience';
};

type Props = {
  isOpen: boolean;
  onConfirm: (data: ExperienceFormData) => void;
  onCancel: () => void;
  isAdding?: boolean;
  initialData?: {
    company: string;
    location: string;
    roles: Array<{ title: string; start_date: string; end_date: string }>;
    bulletMode?: 'per_role' | 'per_experience';
  } | null;
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
    company: '',
    location: '',
    roles: [{ title: '', start_date: '', end_date: '' }],
    bulletMode: 'per_role',
  });

  // Update form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setFormData({
        company: initialData.company || '',
        location: initialData.location || '',
        roles: (initialData.roles && Array.isArray(initialData.roles) && initialData.roles.length > 0)
          ? initialData.roles 
          : [{ title: '', start_date: '', end_date: '' }],
        bulletMode: initialData.bulletMode || 'per_role',
      });
    } else {
      setFormData({
        company: '',
        location: '',
        roles: [{ title: '', start_date: '', end_date: '' }],
        bulletMode: 'per_role',
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleAddRole = () => {
    setFormData({
      ...formData,
      roles: [...formData.roles, { title: '', start_date: '', end_date: '' }],
    });
  };

  const handleRemoveRole = (index: number) => {
    if (formData.roles.length > 1) {
      setFormData({
        ...formData,
        roles: formData.roles.filter((_, i) => i !== index),
      });
    } else {
      // Prevent removing the last role
      alert('At least one role is required');
    }
  };

  const handleRoleChange = (index: number, field: keyof Role, value: string) => {
    const newRoles = [...formData.roles];
    newRoles[index] = { ...newRoles[index], [field]: value };
    setFormData({ ...formData, roles: newRoles });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.company.trim() && formData.roles.every(r => r.title.trim())) {
      onConfirm(formData);
      // Reset form
      setFormData({
        company: '',
        location: '',
        roles: [{ title: '', start_date: '', end_date: '' }],
        bulletMode: 'per_role',
      });
    }
  };

  const handleCancel = () => {
    // Reset form
    setFormData({
      company: '',
      location: '',
      roles: [{ title: '', start_date: '', end_date: '' }],
      bulletMode: 'per_role',
    });
    onCancel();
  };

  const isValid = formData.company.trim() && formData.roles.every(r => r.title.trim());

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border-4 border-blue-200 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-br from-blue-100 to-cyan-100 p-6 border-b-4 border-blue-200 flex-shrink-0">
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

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto flex-1">
          <div className="space-y-6">
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
                autoFocus
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

            {/* Roles Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Roles <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddRole}
                  className="px-3 py-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-blue-300 transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Role
                </button>
              </div>
              <div className="space-y-4">
                {formData.roles.map((role, index) => (
                  <div key={index} className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-600">Role {index + 1}</span>
                      {formData.roles.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRole(index)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                          title="Remove role"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                          Job Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={role.title}
                          onChange={(e) => handleRoleChange(index, 'title', e.target.value)}
                          className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-white"
                          placeholder="e.g., Senior Product Manager"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            Start Date
                          </label>
                          <input
                            type="text"
                            value={role.start_date}
                            onChange={(e) => handleRoleChange(index, 'start_date', e.target.value)}
                            className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-white"
                            placeholder="e.g., Jan 2020"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            End Date
                          </label>
                          <input
                            type="text"
                            value={role.end_date}
                            onChange={(e) => handleRoleChange(index, 'end_date', e.target.value)}
                            className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-white"
                            placeholder="e.g., Present"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bullet Mode Toggle - Only show when multiple roles */}
            {formData.roles.length > 1 && (
              <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Bullet Organization
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="radio"
                      name="bulletMode"
                      value="per_role"
                      checked={formData.bulletMode === 'per_role'}
                      onChange={(e) => setFormData({ ...formData, bulletMode: 'per_role' })}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">Per Role</div>
                      <div className="text-xs text-gray-600">Each role has its own bullets</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="radio"
                      name="bulletMode"
                      value="per_experience"
                      checked={formData.bulletMode === 'per_experience'}
                      onChange={(e) => setFormData({ ...formData, bulletMode: 'per_experience' })}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">Per Experience</div>
                      <div className="text-xs text-gray-600">All roles share the same bullets</div>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 mt-8 flex-shrink-0">
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
              disabled={isAdding || !isValid}
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
                  {mode === 'edit' ? 'Saving...' : 'Adding...'}
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
