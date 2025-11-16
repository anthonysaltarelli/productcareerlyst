"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ResumeVersionSidebar from "@/app/components/resume/ResumeVersionSidebar";
import CustomizationSidebar from "@/app/components/resume/CustomizationSidebar";
import ResumeEditor from "@/app/components/resume/ResumeEditor";
import UnsavedChangesModal from "@/app/components/resume/UnsavedChangesModal";
import AddExperienceModal from "@/app/components/resume/AddExperienceModal";
import AddEducationModal from "@/app/components/resume/AddEducationModal";
import { defaultResumeStyles, ResumeStyles, ResumeData } from "@/app/components/resume/mockData";
import { createResumeDocument, downloadDocx } from "@/lib/utils/exportResume";
import { useResumeData } from "@/lib/hooks/useResumeData";
import { mapCompleteDBResumeToUI, mapDBStylesToUI, mapUIContactToDB, mapUIStylesToDB } from "@/lib/utils/resumeDataMapper";

// Deep equality check for resume data
const deepEqual = (obj1: any, obj2: any): boolean => {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
};

type Props = {
  params: Promise<{ versionId: string }>;
};

export default function ResumeEditorPage({ params }: Props) {
  const router = useRouter();
  const [versionId, setVersionId] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState("experience");
  const [selectedBulletId, setSelectedBulletId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [resumeStyles, setResumeStyles] = useState<ResumeStyles>(defaultResumeStyles);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddExperienceModal, setShowAddExperienceModal] = useState(false);
  const [showAddEducationModal, setShowAddEducationModal] = useState(false);
  const [isAddingExperience, setIsAddingExperience] = useState(false);
  const [isAddingEducation, setIsAddingEducation] = useState(false);
  const [editingExperience, setEditingExperience] = useState<{ id: string; data: any } | null>(null);
  const [editingEducation, setEditingEducation] = useState<{ id: string; data: any } | null>(null);

  // Unwrap params
  useEffect(() => {
    params.then(({ versionId: id }) => {
      setVersionId(id);
    });
  }, [params]);

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
    createAchievement,
    deleteAchievement,
    updateSkillsForCategory,
    createExperience,
    createEducation,
    createBullet,
    deleteExperience,
    deleteEducation,
    updateVersion,
  } = useResumeData();

  // Initialize resume data with empty values (will be populated from DB)
  const initialResumeData: ResumeData = {
    contactInfo: {
      name: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      portfolio: '',
    },
    summary: '',
    experiences: [],
    education: [],
    skills: {
      technical: [],
      product: [],
      soft: [],
    },
  };

  const [originalResumeData, setOriginalResumeData] = useState<ResumeData>(initialResumeData);
  const [currentResumeData, setCurrentResumeData] = useState<ResumeData>(initialResumeData);
  const [originalResumeStyles, setOriginalResumeStyles] = useState<ResumeStyles>(defaultResumeStyles);

  // Load resume data when versionId is available
  useEffect(() => {
    if (versionId) {
      fetchResumeData(versionId).then((resume) => {
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
  }, [versionId, fetchResumeData]);

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
    if (!versionId) {
      toast.error('No version selected');
      return;
    }

    setIsSaving(true);
    try {
      console.log('Starting save...', { versionId, currentResumeData, originalResumeData });

      // Check what changed and save accordingly
      const dataChanged = !deepEqual(originalResumeData, currentResumeData);
      const stylesChanged = !deepEqual(originalResumeStyles, resumeStyles);

      console.log('Change detection:', { dataChanged, stylesChanged });

      if (!dataChanged && !stylesChanged) {
        toast.info('No changes to save');
        return;
      }

      const savePromises: Promise<any>[] = [];

      if (dataChanged) {
        // Save contact info if changed
        if (!deepEqual(originalResumeData.contactInfo, currentResumeData.contactInfo)) {
          console.log('Contact info changed:', currentResumeData.contactInfo);
          // Only save if required fields are filled in
          if (currentResumeData.contactInfo.name && currentResumeData.contactInfo.email) {
            savePromises.push(
              updateContactInfo(versionId, mapUIContactToDB(currentResumeData.contactInfo, versionId))
            );
          } else {
            console.log('Skipping contact info save - missing required fields');
          }
        }

        // Save summary if changed (allow empty summary)
        if (originalResumeData.summary !== currentResumeData.summary) {
          console.log('Summary changed:', currentResumeData.summary);
          // Only save if summary has content (API requires it)
          if (currentResumeData.summary && currentResumeData.summary.trim()) {
            savePromises.push(updateSummary(versionId, currentResumeData.summary));
          } else {
            console.log('Skipping summary save - empty content');
          }
        }

        // Save skills if changed
        if (!deepEqual(originalResumeData.skills, currentResumeData.skills)) {
          console.log('Skills changed:', currentResumeData.skills);
          savePromises.push(
            updateSkillsForCategory(versionId, 'technical', currentResumeData.skills.technical),
            updateSkillsForCategory(versionId, 'product', currentResumeData.skills.product),
            updateSkillsForCategory(versionId, 'soft', currentResumeData.skills.soft)
          );
        }

        // Save experience and bullet changes
        if (!deepEqual(originalResumeData.experiences, currentResumeData.experiences)) {
          console.log('Experiences/bullets changed');
          // Check each experience for changes
          currentResumeData.experiences.forEach((currentExp, expIndex) => {
            const originalExp = originalResumeData.experiences[expIndex];
            if (originalExp) {
              // Check if experience fields changed (title, company, location, dates)
              const expFieldsChanged =
                currentExp.title !== originalExp.title ||
                currentExp.company !== originalExp.company ||
                currentExp.location !== originalExp.location ||
                currentExp.startDate !== originalExp.startDate ||
                currentExp.endDate !== originalExp.endDate;

              if (expFieldsChanged) {
                console.log(`Updating experience ${currentExp.id}`);
                savePromises.push(
                  updateExperience(currentExp.id, {
                    title: currentExp.title,
                    company: currentExp.company,
                    location: currentExp.location,
                    start_date: currentExp.startDate,
                    end_date: currentExp.endDate,
                  })
                );
              }

              // Check if bullets changed
              if (!deepEqual(originalExp.bullets, currentExp.bullets)) {
                // Bullets changed for this experience
                currentExp.bullets.forEach((bullet, bulletIndex) => {
                  const originalBullet = originalExp.bullets.find(b => b.id === bullet.id);
                  if (!originalBullet || !deepEqual(originalBullet, bullet)) {
                    // Bullet changed - update selection and display order
                    console.log(`Updating bullet ${bullet.id}:`, {
                      isSelected: bullet.isSelected,
                      displayOrder: bulletIndex
                    });
                    savePromises.push(
                      updateBullet(bullet.id, {
                        content: bullet.content,
                        is_selected: bullet.isSelected,
                        display_order: bulletIndex,
                      })
                    );
                  }
                });
              }
            }
          });
        }

        // Save education changes
        if (!deepEqual(originalResumeData.education, currentResumeData.education)) {
          console.log('Education changed');
          currentResumeData.education.forEach((currentEdu, eduIndex) => {
            const originalEdu = originalResumeData.education[eduIndex];
            if (originalEdu) {
              // Check if education fields changed
              const eduFieldsChanged =
                currentEdu.school !== originalEdu.school ||
                currentEdu.degree !== originalEdu.degree ||
                currentEdu.field !== originalEdu.field ||
                currentEdu.location !== originalEdu.location ||
                currentEdu.startDate !== originalEdu.startDate ||
                currentEdu.endDate !== originalEdu.endDate ||
                currentEdu.gpa !== originalEdu.gpa;

              if (eduFieldsChanged) {
                console.log(`Updating education ${currentEdu.id}`);
                savePromises.push(
                  updateEducation(currentEdu.id, {
                    school: currentEdu.school,
                    degree: currentEdu.degree,
                    field: currentEdu.field,
                    location: currentEdu.location,
                    start_date: currentEdu.startDate,
                    end_date: currentEdu.endDate,
                    gpa: currentEdu.gpa,
                  })
                );
              }

              // Check if achievements changed
              if (!deepEqual(originalEdu.achievements, currentEdu.achievements)) {
                console.log(`Achievements changed for education ${currentEdu.id}`);

                // Track which achievements were added, updated, or deleted
                const originalAchIds = new Set(originalEdu.achievements.map(a => a.id));
                const currentAchIds = new Set(currentEdu.achievements.map(a => a.id));

                // Handle updated achievements
                currentEdu.achievements.forEach((ach, index) => {
                  if (originalAchIds.has(ach.id)) {
                    // Existing achievement - check if content or order changed
                    const originalAch = originalEdu.achievements.find(a => a.id === ach.id);
                    if (originalAch && (originalAch.achievement !== ach.achievement || originalAch.displayOrder !== index)) {
                      console.log(`Updating achievement ${ach.id}`);
                      savePromises.push(
                        updateAchievement(ach.id, ach.achievement, index)
                      );
                    }
                  } else {
                    // New achievement (temporary ID) - create it
                    console.log(`Creating achievement for education ${currentEdu.id}`);
                    savePromises.push(
                      createAchievement(currentEdu.id, ach.achievement, index)
                    );
                  }
                });

                // Handle deleted achievements
                originalEdu.achievements.forEach(ach => {
                  if (!currentAchIds.has(ach.id)) {
                    console.log(`Deleting achievement ${ach.id}`);
                    savePromises.push(
                      deleteAchievement(ach.id)
                    );
                  }
                });
              }
            }
          });
        }
      }

      if (stylesChanged) {
        console.log('Styles changed:', resumeStyles);
        savePromises.push(updateStyles(versionId, mapUIStylesToDB(resumeStyles, versionId)));
      }

      if (savePromises.length === 0) {
        toast.warning('Changes detected but nothing to save (missing required fields)');
        return;
      }

      console.log(`Executing ${savePromises.length} save operations...`);
      await Promise.all(savePromises);

      // Update original data and styles to match current
      setOriginalResumeData(currentResumeData);
      setOriginalResumeStyles(resumeStyles);

      console.log('Save completed successfully');
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

  // Add Experience handler - opens modal
  const handleAddExperience = async () => {
    setShowAddExperienceModal(true);
  };

  // Confirm Add Experience - handles form submission
  const handleConfirmAddExperience = async (formData: {
    title: string;
    company: string;
    location: string;
    start_date: string;
    end_date: string;
  }) => {
    if (!versionId) return;

    setIsAddingExperience(true);
    try {
      if (editingExperience) {
        // Edit mode - update existing experience
        await updateExperience(editingExperience.id, {
          title: formData.title,
          company: formData.company,
          location: formData.location,
          start_date: formData.start_date,
          end_date: formData.end_date,
        });
        toast.success('Experience updated successfully');
      } else {
        // Add mode - create new experience
        await createExperience(versionId, {
          title: formData.title,
          company: formData.company,
          location: formData.location,
          start_date: formData.start_date,
          end_date: formData.end_date,
          display_order: currentResumeData.experiences.length,
        });
        toast.success('Experience added successfully');
      }

      // Immediately refresh the resume data
      const refreshedData = await fetchResumeData(versionId);
      if (refreshedData) {
        const uiData = mapCompleteDBResumeToUI(refreshedData);
        setCurrentResumeData(uiData);
        setOriginalResumeData(uiData);
      }
      setShowAddExperienceModal(false);
      setEditingExperience(null);
    } catch (error) {
      console.error('Error saving experience:', error);
      // Error toast is already shown by the hook
    } finally {
      setIsAddingExperience(false);
    }
  };

  // Edit Experience handler
  const handleEditExperience = (experienceId: string) => {
    const experience = currentResumeData.experiences.find(exp => exp.id === experienceId);
    if (experience) {
      setEditingExperience({
        id: experienceId,
        data: {
          title: experience.title,
          company: experience.company,
          location: experience.location,
          start_date: experience.startDate,
          end_date: experience.endDate,
        },
      });
      setShowAddExperienceModal(true);
    }
  };

  // Add Education handler - opens modal
  const handleAddEducation = async () => {
    setShowAddEducationModal(true);
  };

  // Confirm Add Education - handles form submission
  const handleConfirmAddEducation = async (formData: {
    school: string;
    degree: string;
    field: string;
    location: string;
    start_date: string;
    end_date: string;
    gpa: string;
  }) => {
    if (!versionId) return;

    setIsAddingEducation(true);
    try {
      if (editingEducation) {
        // Edit mode - update existing education
        await updateEducation(editingEducation.id, {
          school: formData.school,
          degree: formData.degree,
          field: formData.field,
          location: formData.location,
          start_date: formData.start_date,
          end_date: formData.end_date,
          gpa: formData.gpa,
        });
        toast.success('Education updated successfully');
      } else {
        // Add mode - create new education
        await createEducation(versionId, {
          school: formData.school,
          degree: formData.degree,
          field: formData.field,
          location: formData.location,
          start_date: formData.start_date,
          end_date: formData.end_date,
          gpa: formData.gpa,
          display_order: currentResumeData.education.length,
        });
        toast.success('Education added successfully');
      }

      // Immediately refresh the resume data
      const refreshedData = await fetchResumeData(versionId);
      if (refreshedData) {
        const uiData = mapCompleteDBResumeToUI(refreshedData);
        setCurrentResumeData(uiData);
        setOriginalResumeData(uiData);
      }
      setShowAddEducationModal(false);
      setEditingEducation(null);
    } catch (error) {
      console.error('Error saving education:', error);
      // Error toast is already shown by the hook
    } finally {
      setIsAddingEducation(false);
    }
  };

  // Edit Education handler
  const handleEditEducation = (educationId: string) => {
    const education = currentResumeData.education.find(edu => edu.id === educationId);
    if (education) {
      setEditingEducation({
        id: educationId,
        data: {
          school: education.school,
          degree: education.degree,
          field: education.field,
          location: education.location,
          start_date: education.startDate,
          end_date: education.endDate,
          gpa: education.gpa,
        },
      });
      setShowAddEducationModal(true);
    }
  };

  // Add Skill handler
  const handleAddSkill = async (category: 'technical' | 'product' | 'soft') => {
    if (!versionId) return;

    // Prompt user for skill name
    const skillName = prompt(`Enter new ${category} skill:`);
    if (!skillName || !skillName.trim()) {
      return;
    }

    try {
      // Add the skill to the current category
      const updatedSkills = [...currentResumeData.skills[category], skillName.trim()];
      await updateSkillsForCategory(versionId, category, updatedSkills);

      // Immediately refresh the resume data
      const refreshedData = await fetchResumeData(versionId);
      if (refreshedData) {
        const uiData = mapCompleteDBResumeToUI(refreshedData);
        setCurrentResumeData(uiData);
        setOriginalResumeData(uiData);
      }
      toast.success('Skill added successfully');
    } catch (error) {
      console.error('Error adding skill:', error);
      // Error toast is already shown by the hook
    }
  };

  // Add Bullet handler - inline addition
  const handleAddBullet = async (experienceId: string, content: string) => {
    if (!versionId) return;

    try {
      // Get current experience to determine display order
      const experience = currentResumeData.experiences.find(
        exp => exp.id === experienceId
      );
      const displayOrder = experience ? experience.bullets.length : 0;

      await createBullet(experienceId, {
        content: content,
        is_selected: true, // Auto-select new bullets so they appear in preview
        display_order: displayOrder,
      });

      // Immediately refresh the resume data
      const refreshedData = await fetchResumeData(versionId);
      if (refreshedData) {
        const uiData = mapCompleteDBResumeToUI(refreshedData);
        setCurrentResumeData(uiData);
        setOriginalResumeData(uiData);
      }
      toast.success('Bullet added successfully');
    } catch (error) {
      console.error('Error adding bullet:', error);
      // Error toast is already shown by the hook
    }
  };

  // Delete Experience handler
  const handleDeleteExperience = async (experienceId: string) => {
    if (!versionId) return;

    try {
      await deleteExperience(experienceId);

      // Immediately refresh the resume data
      const refreshedData = await fetchResumeData(versionId);
      if (refreshedData) {
        const uiData = mapCompleteDBResumeToUI(refreshedData);
        setCurrentResumeData(uiData);
        setOriginalResumeData(uiData);
      }
      toast.success('Experience deleted successfully');
    } catch (error) {
      console.error('Error deleting experience:', error);
      // Error toast is already shown by the hook
    }
  };

  // Delete Education handler
  const handleDeleteEducation = async (educationId: string) => {
    if (!versionId) return;

    try {
      await deleteEducation(educationId);

      // Immediately refresh the resume data
      const refreshedData = await fetchResumeData(versionId);
      if (refreshedData) {
        const uiData = mapCompleteDBResumeToUI(refreshedData);
        setCurrentResumeData(uiData);
        setOriginalResumeData(uiData);
      }
      toast.success('Education deleted successfully');
    } catch (error) {
      console.error('Error deleting education:', error);
      // Error toast is already shown by the hook
    }
  };

  // Update Version Name handler
  const handleUpdateVersionName = async (versionId: string, newName: string) => {
    try {
      await updateVersion(versionId, { name: newName });
      toast.success('Resume name updated successfully');
    } catch (error) {
      console.error('Error updating resume name:', error);
      toast.error('Failed to update resume name');
      throw error; // Re-throw to let the component handle it
    }
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

  const handleVersionChange = (newVersionId: string) => {
    if (hasUnsavedChanges) {
      setPendingNavigation({ type: 'version', target: newVersionId });
      setShowUnsavedModal(true);
    } else {
      router.push(`/dashboard/resume/${newVersionId}`);
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
      router.push('/dashboard/resume');
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
        router.push(`/dashboard/resume/${pendingNavigation.target}`);
        break;
      case 'viewMode':
        setViewMode(pendingNavigation.target as "edit" | "preview");
        break;
      case 'back':
        router.push('/dashboard/resume');
        break;
    }

    setPendingNavigation(null);
    setShowUnsavedModal(false);
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
      link.download = `${versionId}_Resume_${new Date().toISOString().split('T')[0]}.pdf`;
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
    setIsExportingDocx(true);
    try {
      const resumeData = currentResumeData;

      const document = createResumeDocument(resumeData);
      const filename = `${versionId}_Resume_${new Date().toISOString().split('T')[0]}.docx`;
      await downloadDocx(document, filename);
    } catch (error) {
      console.error("Error exporting DOCX:", error);
      alert("Failed to export resume as DOCX. Please try again.");
    } finally {
      setIsExportingDocx(false);
    }
  };

  // Show loading state while fetching resume data
  if (isLoading || !versionId) {
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
              versions={versions}
              selectedVersion={versionId}
              onVersionChange={handleVersionChange}
              selectedSection={selectedSection}
              onSectionChange={handleSectionChange}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              onBack={handleBackToLanding}
              resumeData={currentResumeData}
              onUpdateVersionName={handleUpdateVersionName}
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
              selectedVersion={versionId}
              versions={versions}
              isExportingPDF={isExportingPDF}
              isExportingDocx={isExportingDocx}
            />
          )}
        </div>

        {/* Center Panel - Editor & Preview */}
        <div className="flex-1 overflow-y-auto">
          <ResumeEditor
            selectedVersion={versionId}
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
            onAddExperience={handleAddExperience}
            onAddEducation={handleAddEducation}
            onAddSkill={handleAddSkill}
            onAddBullet={handleAddBullet}
            onDeleteExperience={handleDeleteExperience}
            onDeleteEducation={handleDeleteEducation}
            onEditExperience={handleEditExperience}
            onEditEducation={handleEditEducation}
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

      {/* Add Experience Modal */}
      <AddExperienceModal
        isOpen={showAddExperienceModal}
        onConfirm={handleConfirmAddExperience}
        onCancel={() => {
          setShowAddExperienceModal(false);
          setEditingExperience(null);
        }}
        isAdding={isAddingExperience}
        mode={editingExperience ? 'edit' : 'add'}
        initialData={editingExperience?.data || null}
      />

      {/* Add Education Modal */}
      <AddEducationModal
        isOpen={showAddEducationModal}
        onConfirm={handleConfirmAddEducation}
        onCancel={() => {
          setShowAddEducationModal(false);
          setEditingEducation(null);
        }}
        isAdding={isAddingEducation}
        mode={editingEducation ? 'edit' : 'add'}
        initialData={editingEducation?.data || null}
      />
    </>
  );
}
