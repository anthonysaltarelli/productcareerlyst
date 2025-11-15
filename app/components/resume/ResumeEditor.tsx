"use client";

import { mockExperiences, mockContactInfo, mockSummary, mockEducation, mockSkills, defaultResumeStyles, ResumeStyles } from "./mockData";
import ExperienceCard from "./ExperienceCard";
import ResumePreview from "./ResumePreview";
import { useState } from "react";
import { createResumeDocument, downloadDocx } from "@/lib/utils/exportResume";

type Props = {
  selectedVersion: string;
  selectedSection: string;
  viewMode: "edit" | "preview";
  selectedBulletId: string | null;
  onBulletSelect: (bulletId: string | null) => void;
  resumeStyles: ResumeStyles;
};

export default function ResumeEditor({
  selectedVersion,
  selectedSection,
  viewMode,
  selectedBulletId,
  onBulletSelect,
  resumeStyles,
}: Props) {

  const renderSectionContent = () => {
    switch (selectedSection) {
      case "contact":
        return (
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Contact Information
            </h2>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  defaultValue={mockContactInfo.name}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-slate-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  defaultValue={mockContactInfo.email}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-slate-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  defaultValue={mockContactInfo.phone}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-slate-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  defaultValue={mockContactInfo.location}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-slate-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  LinkedIn
                </label>
                <input
                  type="text"
                  defaultValue={mockContactInfo.linkedin}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-slate-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Portfolio/Website
                </label>
                <input
                  type="text"
                  defaultValue={mockContactInfo.portfolio}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-slate-50 focus:bg-white"
                />
              </div>
            </div>
          </div>
        );

      case "summary":
        return (
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Professional Summary
            </h2>
            <textarea
              defaultValue={mockSummary}
              rows={6}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all resize-none bg-slate-50 focus:bg-white"
              placeholder="Write a compelling professional summary..."
            />
            <div className="mt-5 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">
                {mockSummary.length} characters
              </span>
              <button className="px-5 py-2.5 text-sm font-bold bg-gradient-to-br from-purple-100 to-pink-100 text-purple-700 hover:from-purple-200 hover:to-pink-200 rounded-xl transition-all border border-purple-200">
                ✨ AI Optimize
              </button>
            </div>
          </div>
        );

      case "experience":
        const selectedCount = mockExperiences.reduce(
          (acc, exp) => acc + exp.bullets.filter((b) => b.isSelected).length,
          0
        );
        const totalCount = mockExperiences.reduce(
          (acc, exp) => acc + exp.bullets.length,
          0
        );

        return (
          <div className="space-y-5">
            <div className="bg-gradient-to-br from-blue-100 to-cyan-100 border-2 border-blue-200 rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl border-2 border-blue-300 shadow-sm">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-900">
                    {selectedCount} of {totalCount} bullets selected
                  </p>
                  <p className="text-xs font-medium text-blue-700">
                    Customize which bullets appear in this version
                  </p>
                </div>
              </div>
            </div>

            {mockExperiences.map((experience, index) => (
              <ExperienceCard
                key={experience.id}
                experience={experience}
                selectedBulletId={selectedBulletId}
                onBulletSelect={onBulletSelect}
                isFirst={index === 0}
              />
            ))}

            <button className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-all flex items-center justify-center gap-2 font-semibold">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Experience
            </button>
          </div>
        );

      case "education":
        return (
          <div className="space-y-5">
            {mockEducation.map((edu, index) => (
              <div
                key={edu.id}
                className="bg-white rounded-2xl border-2 border-slate-200 p-8 shadow-sm"
              >
                <div className="flex items-start justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    Education Entry #{index + 1}
                  </h3>
                  <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-200">
                    <svg
                      className="w-5 h-5"
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
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-5 mb-5">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      School/Institution
                    </label>
                    <input
                      type="text"
                      defaultValue={edu.school}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Degree
                    </label>
                    <input
                      type="text"
                      defaultValue={edu.degree}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Field of Study
                    </label>
                    <input
                      type="text"
                      defaultValue={edu.field}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      defaultValue={edu.location}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      GPA (Optional)
                    </label>
                    <input
                      type="text"
                      defaultValue={edu.gpa}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="text"
                      defaultValue={edu.startDate}
                      placeholder="e.g., Sep 2013"
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="text"
                      defaultValue={edu.endDate}
                      placeholder="e.g., Jun 2015 or Present"
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Achievements/Honors
                  </label>
                  <div className="space-y-3">
                    {edu.achievements.map((achievement, achIndex) => (
                      <div key={achIndex} className="flex items-center gap-3">
                        <span className="text-gray-400 font-bold">•</span>
                        <input
                          type="text"
                          defaultValue={achievement}
                          className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-slate-50 focus:bg-white"
                        />
                        <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-bold mt-2">
                      + Add Achievement
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-all flex items-center justify-center gap-2 font-semibold">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Education
            </button>
          </div>
        );

      case "skills":
        return (
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Skills</h2>

            {/* Technical Skills */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-base font-bold text-gray-800">
                  Technical Skills
                </label>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-bold px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-all">
                  + Add Skill
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {mockSkills.technical.map((skill, index) => (
                  <div
                    key={index}
                    className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-100 to-cyan-100 border-2 border-blue-200 text-blue-700 rounded-xl hover:from-blue-200 hover:to-cyan-200 transition-all shadow-sm"
                  >
                    <span className="text-sm font-semibold">{skill}</span>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-800">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Skills */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-base font-bold text-gray-800">
                  Product Management Skills
                </label>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-bold px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-all">
                  + Add Skill
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {mockSkills.product.map((skill, index) => (
                  <div
                    key={index}
                    className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-200 text-purple-700 rounded-xl hover:from-purple-200 hover:to-pink-200 transition-all shadow-sm"
                  >
                    <span className="text-sm font-semibold">{skill}</span>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-600 hover:text-purple-800">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Soft Skills */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-base font-bold text-gray-800">
                  Soft Skills
                </label>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-bold px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-all">
                  + Add Skill
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {mockSkills.soft.map((skill, index) => (
                  <div
                    key={index}
                    className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-green-100 to-emerald-100 border-2 border-green-200 text-green-700 rounded-xl hover:from-green-200 hover:to-emerald-200 transition-all shadow-sm"
                  >
                    <span className="text-sm font-semibold">{skill}</span>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity text-green-600 hover:text-green-800">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Custom Category */}
            <button className="w-full mt-8 py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-all flex items-center justify-center gap-2 font-semibold">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Custom Skill Category
            </button>
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-16 text-center shadow-sm">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl mb-6 border-2 border-slate-300">
              <svg
                className="w-10 h-10 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Section Coming Soon
            </h3>
            <p className="text-gray-600 font-medium">
              This section is under development. Select another section to edit.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Content Area - Conditional rendering based on view mode */}
      <div className="flex-1 overflow-hidden">
        {viewMode === "edit" && (
          <div className="h-full overflow-y-auto p-8">
            <div className="max-w-5xl mx-auto">{renderSectionContent()}</div>
          </div>
        )}

        {viewMode === "preview" && (
          <div className="h-full overflow-y-auto bg-slate-100 p-8">
            <div className="flex justify-center">
              <ResumePreview styles={resumeStyles} />
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

