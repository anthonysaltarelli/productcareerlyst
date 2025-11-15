"use client";

import { useState } from "react";
import ResumeLanding from "@/app/components/resume/ResumeLanding";
import ResumeVersionSidebar from "@/app/components/resume/ResumeVersionSidebar";
import ResumeScoreSidebar from "@/app/components/resume/ResumeScoreSidebar";
import CustomizationSidebar from "@/app/components/resume/CustomizationSidebar";
import ResumeEditor from "@/app/components/resume/ResumeEditor";
import { defaultResumeStyles, ResumeStyles, mockExperiences, mockContactInfo, mockSummary, mockEducation, mockSkills } from "@/app/components/resume/mockData";
import { createResumeDocument, downloadDocx } from "@/lib/utils/exportResume";

export default function ResumePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState("master");
  const [selectedSection, setSelectedSection] = useState("experience");
  const [selectedBulletId, setSelectedBulletId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [resumeStyles, setResumeStyles] = useState<ResumeStyles>(defaultResumeStyles);

  const handleEditVersion = (versionId: string) => {
    setSelectedVersion(versionId);
    setIsEditing(true);
  };

  const handleBackToLanding = () => {
    setIsEditing(false);
    setSelectedBulletId(null);
  };

  // Handler to trigger print/PDF export
  const handleExportPDF = () => {
    // FUTURE ENHANCEMENT: Replace with server-side Puppeteer/Playwright rendering
    // for production-quality PDFs with better font embedding and layout control
    // API endpoint: POST /api/resume/export-pdf with resume data
    window.print();
  };

  // Handler to export resume as DOCX
  const handleExportDocx = async () => {
    // FUTURE ENHANCEMENT: Add more sophisticated DOCX formatting
    // FUTURE ENHANCEMENT: Support custom templates
    // FUTURE ENHANCEMENT: Add Google Docs integration for direct upload
    try {
      const resumeData = {
        contactInfo: mockContactInfo,
        summary: mockSummary,
        experiences: mockExperiences,
        education: mockEducation,
        skills: mockSkills,
      };

      const document = createResumeDocument(resumeData);
      const filename = `${selectedVersion}_Resume_${new Date().toISOString().split('T')[0]}.docx`;
      await downloadDocx(document, filename);
    } catch (error) {
      console.error("Error exporting DOCX:", error);
      alert("Failed to export resume as DOCX. Please try again.");
    }
  };

  if (!isEditing) {
    return <ResumeLanding onEditVersion={handleEditVersion} />;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Left Sidebar - Conditional based on view mode */}
      <div className="w-72 bg-white/80 backdrop-blur-sm border-r border-slate-200 flex-shrink-0 overflow-y-auto shadow-lg">
        {viewMode === "edit" ? (
          <ResumeVersionSidebar
            selectedVersion={selectedVersion}
            onVersionChange={setSelectedVersion}
            selectedSection={selectedSection}
            onSectionChange={setSelectedSection}
          />
        ) : (
          <CustomizationSidebar
            styles={resumeStyles}
            onStyleChange={setResumeStyles}
            onExportPDF={handleExportPDF}
            onExportDocx={handleExportDocx}
          />
        )}
      </div>

      {/* Center Panel - Editor & Preview */}
      <div className="flex-1 overflow-y-auto">
        <ResumeEditor
          selectedVersion={selectedVersion}
          selectedSection={selectedSection}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedBulletId={selectedBulletId}
          onBulletSelect={setSelectedBulletId}
          onBack={handleBackToLanding}
          resumeStyles={resumeStyles}
          onStyleChange={setResumeStyles}
          onExportPDF={handleExportPDF}
          onExportDocx={handleExportDocx}
        />
      </div>
    </div>
  );
}

