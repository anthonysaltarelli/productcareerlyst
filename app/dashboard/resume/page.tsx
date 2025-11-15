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

  // Handler to trigger professional PDF export
  const handleExportPDF = async () => {
    try {
      // Prepare resume data for API
      const resumeData = {
        contactInfo: mockContactInfo,
        summary: mockSummary,
        experiences: mockExperiences,
        education: mockEducation,
        skills: mockSkills,
        styles: resumeStyles,
      };

      // Call the PDF generation API
      const response = await fetch('/api/resume/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resumeData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Get the PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedVersion}_Resume_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export resume as PDF. Please try again.');
    }
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
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onBack={handleBackToLanding}
          />
        ) : (
          <CustomizationSidebar
            styles={resumeStyles}
            onStyleChange={setResumeStyles}
            onExportPDF={handleExportPDF}
            onExportDocx={handleExportDocx}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onBack={handleBackToLanding}
            selectedVersion={selectedVersion}
          />
        )}
      </div>

      {/* Center Panel - Editor & Preview */}
      <div className="flex-1 overflow-y-auto">
        <ResumeEditor
          selectedVersion={selectedVersion}
          selectedSection={selectedSection}
          viewMode={viewMode}
          selectedBulletId={selectedBulletId}
          onBulletSelect={setSelectedBulletId}
          resumeStyles={resumeStyles}
        />
      </div>
    </div>
  );
}

