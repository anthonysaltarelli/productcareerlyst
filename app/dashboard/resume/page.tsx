"use client";

import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import ResumeLanding from "@/app/components/resume/ResumeLanding";
import ResumeVersionSidebar from "@/app/components/resume/ResumeVersionSidebar";
import ResumeScoreSidebar from "@/app/components/resume/ResumeScoreSidebar";
import CustomizationSidebar from "@/app/components/resume/CustomizationSidebar";
import ResumeEditor from "@/app/components/resume/ResumeEditor";
import UnsavedChangesModal from "@/app/components/resume/UnsavedChangesModal";
import { defaultResumeStyles, ResumeStyles, ResumeData, mockExperiences, mockContactInfo, mockSummary, mockEducation, mockSkills } from "@/app/components/resume/mockData";
import { createResumeDocument, downloadDocx } from "@/lib/utils/exportResume";
import { useResumeData } from "@/lib/hooks/useResumeData";
import { mapCompleteDBResumeToUI, mapDBStylesToUI, mapUIContactToDB, mapUIStylesToDB } from "@/lib/utils/resumeDataMapper";

// Deep equality check for resume data
const deepEqual = (obj1: any, obj2: any): boolean => {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
};

export default function ResumePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState("experience");
  const [selectedBulletId, setSelectedBulletId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [resumeStyles, setResumeStyles] = useState<ResumeStyles>(defaultResumeStyles);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Use the resume data hook
  const {
    versions,
    currentResume,
    isLoading,
    fetchResumeData,
    updateContactInfo,
    updateSummary,
    updateStyles,
    updateExperience,
    updateBullet,
    updateEducation,
    updateAchievement,
    updateSkillsForCategory,
  } = useResumeData();

  // Initialize resume data from mock data (fallback)
  const initialResumeData: ResumeData = {
    contactInfo: mockContactInfo,
    summary: mockSummary,
    experiences: mockExperiences,
    education: mockEducation,
    skills: mockSkills,
  };

  const [originalResumeData, setOriginalResumeData] = useState<ResumeData>(initialResumeData);
  const [currentResumeData, setCurrentResumeData] = useState<ResumeData>(initialResumeData);
  const [originalResumeStyles, setOriginalResumeStyles] = useState<ResumeStyles>(defaultResumeStyles);

  // Load resume data when version changes
  useEffect(() => {
    if (selectedVersion && isEditing) {
      fetchResumeData(selectedVersion).then((resume) => {
        if (resume) {
          const uiData = mapCompleteDBResumeToUI(resume);
          const uiStyles = mapDBStylesToUI(resume.styles);
          
          setCurrentResumeData(uiData);
          setOriginalResumeData(uiData);
          setResumeStyles(uiStyles);
          setOriginalResumeStyles(uiStyles);
        }
      });
    }
  }, [selectedVersion, isEditing, fetchResumeData]);

  // Set default version when versions load
  useEffect(() => {
    if (versions.length > 0 && !selectedVersion) {
      // Find master version or use first version
      const masterVersion = versions.find(v => v.is_master);
      const defaultVersion = masterVersion || versions[0];
      setSelectedVersion(defaultVersion.id);
    }
  }, [versions, selectedVersion]);

  // Navigation blocking state
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<{
    type: 'section' | 'version' | 'viewMode' | 'back';
    target?: string;
  } | null>(null);

  // Compute if there are unsaved changes (data OR styles)
  const hasUnsavedChanges = useMemo(() => {
    const dataChanged = !deepEqual(originalResumeData, currentResumeData);
    const stylesChanged = !deepEqual(originalResumeStyles, resumeStyles);
    return dataChanged || stylesChanged;
  }, [originalResumeData, currentResumeData, originalResumeStyles, resumeStyles]);

  // Save handler
  const handleSave = async () => {
    if (!selectedVersion) {
      toast.error('No version selected');
      return;
    }

    setIsSaving(true);
    try {
      // Check what changed and save accordingly
      const dataChanged = !deepEqual(originalResumeData, currentResumeData);
      const stylesChanged = !deepEqual(originalResumeStyles, resumeStyles);

      if (dataChanged) {
        // Save contact info if changed
        if (!deepEqual(originalResumeData.contactInfo, currentResumeData.contactInfo)) {
          await updateContactInfo(selectedVersion, mapUIContactToDB(currentResumeData.contactInfo, selectedVersion));
        }

        // Save summary if changed
        if (originalResumeData.summary !== currentResumeData.summary) {
          await updateSummary(selectedVersion, currentResumeData.summary);
        }

        // Save experiences if changed
        // Note: For full implementation, we'd need to track individual experience/bullet changes
        // For now, we'll rely on individual field updates from the UI

        // Save education if changed
        // Note: Similar to experiences, individual updates handled by UI

        // Save skills if changed
        if (!deepEqual(originalResumeData.skills, currentResumeData.skills)) {
          await Promise.all([
            updateSkillsForCategory(selectedVersion, 'technical', currentResumeData.skills.technical),
            updateSkillsForCategory(selectedVersion, 'product', currentResumeData.skills.product),
            updateSkillsForCategory(selectedVersion, 'soft', currentResumeData.skills.soft),
          ]);
        }
      }

      if (stylesChanged) {
        await updateStyles(selectedVersion, mapUIStylesToDB(resumeStyles, selectedVersion));
      }
      
      // Update original data and styles to match current
      setOriginalResumeData(currentResumeData);
      setOriginalResumeStyles(resumeStyles);
      
      toast.success('Resume saved successfully!');
    } catch (error) {
      console.error('Error saving resume:', error);
      toast.error('Failed to save resume. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Discard handler
  const handleDiscard = () => {
    setCurrentResumeData(originalResumeData);
    setResumeStyles(originalResumeStyles);
    toast.info('Changes discarded');
  };

  // Navigation handlers with blocking
  const handleSectionChange = (newSection: string) => {
    if (hasUnsavedChanges) {
      setPendingNavigation({ type: 'section', target: newSection });
      setShowUnsavedModal(true);
    } else {
      setSelectedSection(newSection);
    }
  };

  const handleVersionChange = (newVersion: string) => {
    if (hasUnsavedChanges) {
      setPendingNavigation({ type: 'version', target: newVersion });
      setShowUnsavedModal(true);
    } else {
      setSelectedVersion(newVersion);
      // Data will be loaded by useEffect
    }
  };

  const handleViewModeChange = (newMode: "edit" | "preview") => {
    if (hasUnsavedChanges) {
      setPendingNavigation({ type: 'viewMode', target: newMode });
      setShowUnsavedModal(true);
    } else {
      setViewMode(newMode);
    }
  };

  const handleBackToLanding = () => {
    if (hasUnsavedChanges) {
      setPendingNavigation({ type: 'back' });
      setShowUnsavedModal(true);
    } else {
      setIsEditing(false);
      setSelectedBulletId(null);
    }
  };

  // Modal handlers
  const handleSaveAndContinue = async () => {
    await handleSave();
    completePendingNavigation();
  };

  const handleDiscardAndContinue = () => {
    handleDiscard();
    completePendingNavigation();
  };

  const handleCancelNavigation = () => {
    setPendingNavigation(null);
    setShowUnsavedModal(false);
  };

  const completePendingNavigation = () => {
    if (!pendingNavigation) return;

    switch (pendingNavigation.type) {
      case 'section':
        setSelectedSection(pendingNavigation.target!);
        break;
      case 'version':
        setSelectedVersion(pendingNavigation.target!);
        break;
      case 'viewMode':
        setViewMode(pendingNavigation.target as "edit" | "preview");
        break;
      case 'back':
        setIsEditing(false);
        setSelectedBulletId(null);
        break;
    }

    setPendingNavigation(null);
    setShowUnsavedModal(false);
  };

  const handleEditVersion = (versionId: string) => {
    setSelectedVersion(versionId);
    setIsEditing(true);
  };

  // Handler to trigger professional PDF export
  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      // Prepare resume data for API
      const resumeData = {
        ...currentResumeData,
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
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Handler to export resume as DOCX
  const handleExportDocx = async () => {
    // FUTURE ENHANCEMENT: Add more sophisticated DOCX formatting
    // FUTURE ENHANCEMENT: Support custom templates
    // FUTURE ENHANCEMENT: Add Google Docs integration for direct upload
    setIsExportingDocx(true);
    try {
      const resumeData = currentResumeData;

      const document = createResumeDocument(resumeData);
      const filename = `${selectedVersion}_Resume_${new Date().toISOString().split('T')[0]}.docx`;
      await downloadDocx(document, filename);
    } catch (error) {
      console.error("Error exporting DOCX:", error);
      alert("Failed to export resume as DOCX. Please try again.");
    } finally {
      setIsExportingDocx(false);
    }
  };

  if (!isEditing) {
    return <ResumeLanding versions={versions} onEditVersion={handleEditVersion} />;
  }

  // Show loading state while fetching resume data
  if (isLoading || !selectedVersion) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-lg font-semibold text-gray-700">Loading resume...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Left Sidebar - Conditional based on view mode */}
        <div className="w-72 bg-white/80 backdrop-blur-sm border-r border-slate-200 flex-shrink-0 overflow-y-auto shadow-lg">
          {viewMode === "edit" ? (
            <ResumeVersionSidebar
              selectedVersion={selectedVersion}
              onVersionChange={handleVersionChange}
              selectedSection={selectedSection}
              onSectionChange={handleSectionChange}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              onBack={handleBackToLanding}
            />
          ) : (
            <CustomizationSidebar
              styles={resumeStyles}
              onStyleChange={setResumeStyles}
              onExportPDF={handleExportPDF}
              onExportDocx={handleExportDocx}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              onBack={handleBackToLanding}
              selectedVersion={selectedVersion}
              isExportingPDF={isExportingPDF}
              isExportingDocx={isExportingDocx}
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
            resumeData={currentResumeData}
            onResumeDataChange={setCurrentResumeData}
            hasUnsavedChanges={hasUnsavedChanges}
            onSave={handleSave}
            onDiscard={handleDiscard}
            isSaving={isSaving}
          />
        </div>
      </div>

      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onSaveAndContinue={handleSaveAndContinue}
        onDiscardAndContinue={handleDiscardAndContinue}
        onCancel={handleCancelNavigation}
      />
    </>
  );
}

