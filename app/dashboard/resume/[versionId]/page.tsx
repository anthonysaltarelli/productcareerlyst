"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ResumeVersionSidebar from "@/app/components/resume/ResumeVersionSidebar";
import CustomizationSidebar from "@/app/components/resume/CustomizationSidebar";
import ResumeEditor from "@/app/components/resume/ResumeEditor";
import UnsavedChangesModal from "@/app/components/resume/UnsavedChangesModal";
import AddExperienceModal from "@/app/components/resume/AddExperienceModal";
import AddEducationModal from "@/app/components/resume/AddEducationModal";
import AcceleratePlanRequiredModal from "@/app/components/resume/AcceleratePlanRequiredModal";
import { defaultResumeStyles, ResumeStyles, ResumeData } from "@/app/components/resume/mockData";
import { createResumeDocument, downloadDocx } from "@/lib/utils/exportResume";
import { useResumeData } from "@/lib/hooks/useResumeData";
import { mapCompleteDBResumeToUI, mapDBStylesToUI, mapUIContactToDB, mapUIStylesToDB, mapDBExperienceToUI } from "@/lib/utils/resumeDataMapper";
import { trackEvent } from "@/lib/amplitude/client";
import { getBaseUserContext, getResumeContext, calculateResumeCompleteness, daysSince } from "@/lib/utils/resume-tracking";

// Deep equality check for resume data
const deepEqual = (obj1: any, obj2: any): boolean => {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
};

// Calculate change summary for tracking
const calculateChangeSummary = (
  originalData: ResumeData,
  currentData: ResumeData,
  originalStyles: ResumeStyles,
  currentStyles: ResumeStyles
): {
  sectionsChanged: string[];
  changeSummary: {
    'Contact Info Changed': boolean;
    'Summary Changed': boolean;
    'Experiences Added': number;
    'Experiences Updated': number;
    'Experiences Deleted': number;
    'Education Added': number;
    'Education Updated': number;
    'Education Deleted': number;
    'Skills Added': number;
    'Skills Removed': number;
    'Bullets Added': number;
    'Bullets Updated': number;
    'Bullets Deleted': number;
    'Styles Changed': boolean;
  };
} => {
  const sectionsChanged: string[] = [];
  const changeSummary = {
    'Contact Info Changed': false,
    'Summary Changed': false,
    'Experiences Added': 0,
    'Experiences Updated': 0,
    'Experiences Deleted': 0,
    'Education Added': 0,
    'Education Updated': 0,
    'Education Deleted': 0,
    'Skills Added': 0,
    'Skills Removed': 0,
    'Bullets Added': 0,
    'Bullets Updated': 0,
    'Bullets Deleted': 0,
    'Styles Changed': false,
  };

  // Check contact info
  if (!deepEqual(originalData.contactInfo, currentData.contactInfo)) {
    changeSummary['Contact Info Changed'] = true;
    sectionsChanged.push('contact');
  }

  // Check summary
  if (originalData.summary !== currentData.summary) {
    changeSummary['Summary Changed'] = true;
    sectionsChanged.push('summary');
  }

  // Check experiences
  const originalExpIds = new Set(originalData.experiences.map(e => e.id));
  const currentExpIds = new Set(currentData.experiences.map(e => e.id));
  
  changeSummary['Experiences Added'] = currentData.experiences.filter(e => !originalExpIds.has(e.id)).length;
  changeSummary['Experiences Deleted'] = originalData.experiences.filter(e => !currentExpIds.has(e.id)).length;
  
  // Count updated experiences
  currentData.experiences.forEach(currentExp => {
    if (originalExpIds.has(currentExp.id)) {
      const originalExp = originalData.experiences.find(e => e.id === currentExp.id);
      if (originalExp && (
        currentExp.title !== originalExp.title ||
        currentExp.company !== originalExp.company ||
        currentExp.location !== originalExp.location ||
        currentExp.startDate !== originalExp.startDate ||
        currentExp.endDate !== originalExp.endDate
      )) {
        changeSummary['Experiences Updated']++;
      }
    }
  });

  if (changeSummary['Experiences Added'] > 0 || changeSummary['Experiences Updated'] > 0 || changeSummary['Experiences Deleted'] > 0) {
    sectionsChanged.push('experience');
  }

  // Check bullets
  const originalBulletIds = new Set(
    originalData.experiences.flatMap(exp => exp.bullets.map(b => b.id))
  );
  const currentBulletIds = new Set(
    currentData.experiences.flatMap(exp => exp.bullets.map(b => b.id))
  );

  changeSummary['Bullets Added'] = currentData.experiences.reduce(
    (sum, exp) => sum + exp.bullets.filter(b => !originalBulletIds.has(b.id)).length,
    0
  );
  changeSummary['Bullets Deleted'] = originalData.experiences.reduce(
    (sum, exp) => sum + exp.bullets.filter(b => !currentBulletIds.has(b.id)).length,
    0
  );

  // Count updated bullets
  currentData.experiences.forEach(currentExp => {
    currentExp.bullets.forEach(currentBullet => {
      if (originalBulletIds.has(currentBullet.id)) {
        const originalExp = originalData.experiences.find(e => 
          e.bullets.some(b => b.id === currentBullet.id)
        );
        if (originalExp) {
          const originalBullet = originalExp.bullets.find(b => b.id === currentBullet.id);
          if (originalBullet && (
            originalBullet.content !== currentBullet.content ||
            originalBullet.isSelected !== currentBullet.isSelected
          )) {
            changeSummary['Bullets Updated']++;
          }
        }
      }
    });
  });

  // Check education
  const originalEduIds = new Set(originalData.education.map(e => e.id));
  const currentEduIds = new Set(currentData.education.map(e => e.id));

  changeSummary['Education Added'] = currentData.education.filter(e => !originalEduIds.has(e.id)).length;
  changeSummary['Education Deleted'] = originalData.education.filter(e => !currentEduIds.has(e.id)).length;

  // Count updated education
  currentData.education.forEach(currentEdu => {
    if (originalEduIds.has(currentEdu.id)) {
      const originalEdu = originalData.education.find(e => e.id === currentEdu.id);
      if (originalEdu && (
        currentEdu.school !== originalEdu.school ||
        currentEdu.degree !== originalEdu.degree ||
        currentEdu.field !== originalEdu.field ||
        currentEdu.location !== originalEdu.location ||
        currentEdu.startDate !== originalEdu.startDate ||
        currentEdu.endDate !== originalEdu.endDate ||
        currentEdu.gpa !== originalEdu.gpa
      )) {
        changeSummary['Education Updated']++;
      }
    }
  });

  if (changeSummary['Education Added'] > 0 || changeSummary['Education Updated'] > 0 || changeSummary['Education Deleted'] > 0) {
    sectionsChanged.push('education');
  }

  // Check skills
  const allOriginalSkills = [
    ...originalData.skills.technical,
    ...originalData.skills.product,
    ...originalData.skills.soft,
  ];
  const allCurrentSkills = [
    ...currentData.skills.technical,
    ...currentData.skills.product,
    ...currentData.skills.soft,
  ];

  changeSummary['Skills Added'] = allCurrentSkills.filter(s => !allOriginalSkills.includes(s)).length;
  changeSummary['Skills Removed'] = allOriginalSkills.filter(s => !allCurrentSkills.includes(s)).length;

  if (changeSummary['Skills Added'] > 0 || changeSummary['Skills Removed'] > 0) {
    sectionsChanged.push('skills');
  }

  // Check styles
  if (!deepEqual(originalStyles, currentStyles)) {
    changeSummary['Styles Changed'] = true;
    sectionsChanged.push('styles');
  }

  return { sectionsChanged, changeSummary };
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
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [usageInfo, setUsageInfo] = useState<{ count: number; remaining: number; limit: number; resetDate: string }>({
    count: 0,
    remaining: 30,
    limit: 30,
    resetDate: '',
  });
  const [userPlan, setUserPlan] = useState<'learn' | 'accelerate' | null>(null);
  const [showAccelerateModal, setShowAccelerateModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const pageViewTracked = useRef(false);
  const viewModeStartTime = useRef<number>(Date.now());

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
    optimizeBullet,
    optimizeBulletText,
    updateBulletContent,
    deleteBullet,
    analyzeResume,
    getResumeAnalysis,
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

  // Compute if there are unsaved changes (data OR styles)
  const hasUnsavedChanges = useMemo(() => {
    const dataChanged = !deepEqual(originalResumeData, currentResumeData);
    const stylesChanged = !deepEqual(originalResumeStyles, resumeStyles);
    return dataChanged || stylesChanged;
  }, [originalResumeData, currentResumeData, originalResumeStyles, resumeStyles]);

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

      // Load analysis data
      getResumeAnalysis(versionId).then((data) => {
        if (data) {
          setAnalysisData(data.analysis || null);
          setUsageInfo(data.usage || { count: 0, remaining: 30, limit: 30, resetDate: '' });
          setUserPlan(data.plan || null);
        }
      });
    }
  }, [versionId, fetchResumeData, getResumeAnalysis]);

  // Track page view
  useEffect(() => {
    if (isLoading || !versionId || !currentResume || pageViewTracked.current) return;

    const trackPageView = async () => {
      const userContext = await getBaseUserContext();
      const resumeContext = getResumeContext(currentResume?.version || null, currentResumeData);
      const completeness = calculateResumeCompleteness(currentResumeData);

      trackEvent('User Viewed Resume Editor', {
        'Page Route': `/dashboard/resume/${versionId}`,
        'Resume Version ID': versionId,
        'Resume Name': currentResume?.version.name || '',
        'Is Master Resume': currentResume?.version.is_master || false,
        'Resume Age': resumeContext.resumeAge,
        'Last Modified': currentResume?.version.updated_at || '',
        'View Mode': viewMode,
        'Selected Section': selectedSection,
        'User Plan': userContext.userPlan,
        'Has Unsaved Changes': hasUnsavedChanges,
        'Resume Completeness': {
          'Has Contact Info': completeness.hasContactInfo,
          'Has Summary': completeness.hasSummary,
          'Experience Count': completeness.experienceCount,
          'Education Count': completeness.educationCount,
          'Technical Skills Count': completeness.technicalSkillsCount,
          'Product Skills Count': completeness.productSkillsCount,
          'Soft Skills Count': completeness.softSkillsCount,
          'Total Bullets Count': completeness.totalBulletsCount,
          'Selected Bullets Count': completeness.selectedBulletsCount,
        },
        'Analysis Score': analysisData?.overallScore ?? null,
        'Analysis Usage Remaining': usageInfo.remaining,
        'Analysis Usage Limit': usageInfo.limit,
        'Is First Time Editor': false, // TODO: Track this properly
      });

      pageViewTracked.current = true;
      viewModeStartTime.current = Date.now();
    };

    trackPageView();
  }, [isLoading, versionId, currentResume, currentResumeData, viewMode, selectedSection, hasUnsavedChanges, analysisData, usageInfo]);

  // Handle analyze resume
  const handleAnalyzeResume = async () => {
    if (!versionId) return;

    const analysisStartTime = Date.now();
    const completeness = calculateResumeCompleteness(currentResumeData);
    const hasPreviousAnalysis = !!analysisData;
    const previousScore = analysisData?.overallScore ?? null;

    // Track start analysis event
    const userContext = await getBaseUserContext();
    trackEvent('User Started Resume Analysis', {
      'Resume Version ID': versionId,
      'User Plan': userContext.userPlan,
      'Usage Remaining': usageInfo.remaining,
      'Usage Limit': usageInfo.limit,
      'Has Previous Analysis': hasPreviousAnalysis,
      'Previous Analysis Score': previousScore,
      'Resume Completeness': completeness,
      'Total Experiences': completeness.experienceCount,
      'Total Education': completeness.educationCount,
      'Total Bullets': completeness.totalBulletsCount,
      'Total Selected Bullets': completeness.selectedBulletsCount,
    });

    // Check if user is on Accelerate plan
    if (userPlan !== 'accelerate') {
      setShowAccelerateModal(true);
      
      // Track modal shown
      trackEvent('User Saw Accelerate Plan Required Modal', {
        'Resume Version ID': versionId,
        'Trigger': 'analyze_resume',
        'User Plan': userContext.userPlan,
        'Usage Remaining': usageInfo.remaining,
      });
      return;
    }

    // Switch to analysis section immediately to show loading state
    setSelectedSection('analysis');
    setIsAnalyzing(true);
    setAnalysisLoading(true);
    setAnalysisError(null);

    try {
      const result = await analyzeResume(versionId);
      if (result) {
        const analysisDuration = Date.now() - analysisStartTime;
        
        setAnalysisData({
          overallScore: result.overallScore,
          categoryScores: result.categoryScores,
          keywordAnalysis: result.keywordAnalysis,
          atsCompatibility: result.atsCompatibility,
          atsExplanation: result.atsExplanation,
          recommendations: result.recommendations,
          categoryDescriptions: result.categoryDescriptions,
          createdAt: result.createdAt,
        });
        const newLimit = result.limit || 30;
        const newUsageInfo = {
          count: result.usageCount || 0,
          remaining: Math.max(0, newLimit - (result.usageCount || 0)),
          limit: newLimit,
          resetDate: '',
        };
        setUsageInfo(newUsageInfo);
        
        // Track analysis complete
        trackEvent('User Resume Analysis Complete', {
          'Resume Version ID': versionId,
          'Analysis Success': true,
          'Overall Score': result.overallScore,
          'Category Scores': result.categoryScores,
          'ATS Compatibility Score': result.atsCompatibility?.score || null,
          'Recommendations Count': result.recommendations?.length || 0,
          'Usage Remaining': newUsageInfo.remaining,
          'Usage Limit': newUsageInfo.limit,
          'User Plan': userContext.userPlan,
          'Analysis Duration': analysisDuration,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to analyze resume';
      
      // Track analysis error
      const errorType = message.includes('Accelerate') || message.includes('Subscription required')
        ? 'subscription_required'
        : message.includes('limit')
        ? 'limit_reached'
        : 'api_error';
      
      trackEvent('User Resume Analysis Error', {
        'Resume Version ID': versionId,
        'Error Type': errorType,
        'Error Message': message,
        'User Plan': userContext.userPlan,
        'Usage Remaining': usageInfo.remaining,
      });
      
      // Check if it's an Accelerate plan required error
      if (message.includes('Accelerate') || message.includes('Subscription required')) {
        setShowAccelerateModal(true);
      } else {
        setAnalysisError(message);
      }
    } finally {
      setIsAnalyzing(false);
      setAnalysisLoading(false);
    }
  };

  // Navigation blocking state
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<{
    type: 'section' | 'version' | 'viewMode' | 'back';
    target?: string;
  } | null>(null);

  // Save handler
  const handleSave = async () => {
    if (!versionId) {
      toast.error('No version selected');
      return;
    }

    const saveStartTime = Date.now();
    setIsSaving(true);
    
    // Calculate change summary before saving
    const { sectionsChanged, changeSummary } = calculateChangeSummary(
      originalResumeData,
      currentResumeData,
      originalResumeStyles,
      resumeStyles
    );

    try {
      console.log('Starting save...', { versionId, currentResumeData, originalResumeData });

      // Check what changed and save accordingly
      const dataChanged = !deepEqual(originalResumeData, currentResumeData);
      const stylesChanged = !deepEqual(originalResumeStyles, resumeStyles);

      console.log('Change detection:', { dataChanged, stylesChanged });
      console.log('Original experiences count:', originalResumeData.experiences.length);
      console.log('Current experiences count:', currentResumeData.experiences.length);
      if (dataChanged) {
        console.log('Experiences comparison:', {
          original: originalResumeData.experiences.map(e => ({ id: e.id, bullets: e.bullets.length })),
          current: currentResumeData.experiences.map(e => ({ id: e.id, bullets: e.bullets.length })),
        });
      }

      if (!dataChanged && !stylesChanged) {
        toast.info('No changes to save');
        setIsSaving(false);
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
          
          // Check if experiences were reordered by comparing their positions
          const originalOrder = originalResumeData.experiences.map(exp => exp.id);
          const currentOrder = currentResumeData.experiences.map(exp => exp.id);
          const orderChanged = JSON.stringify(originalOrder) !== JSON.stringify(currentOrder);
          
          if (orderChanged) {
            console.log('Experiences order changed, updating display_order');
            // Update display_order for all experiences based on their new position
            currentResumeData.experiences.forEach((currentExp, index) => {
              const originalExp = originalResumeData.experiences.find(exp => exp.id === currentExp.id);
              const originalIndex = originalResumeData.experiences.findIndex(exp => exp.id === currentExp.id);
              
              // Only update if the position actually changed
              if (originalIndex !== index) {
                console.log(`Updating experience ${currentExp.id} display_order from ${originalIndex} to ${index}`);
                savePromises.push(
                  updateExperience(currentExp.id, {
                    display_order: index,
                  } as any)
                );
              }
            });
          }
          
          // Build a map of original bullet locations (bulletId -> experienceId)
          const originalBulletLocations = new Map<string, string>();
          originalResumeData.experiences.forEach(exp => {
            exp.bullets.forEach(bullet => {
              originalBulletLocations.set(bullet.id, exp.id);
            });
          });

          // Check each experience for changes
          currentResumeData.experiences.forEach((currentExp, currentIndex) => {
            const originalExp = originalResumeData.experiences.find(exp => exp.id === currentExp.id);
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
                const updateData: any = {
                  title: currentExp.title,
                  company: currentExp.company,
                  location: currentExp.location,
                  start_date: currentExp.startDate,
                  end_date: currentExp.endDate,
                };
                
                // Also include display_order if order changed
                if (orderChanged) {
                  (updateData as any).display_order = currentIndex;
                }
                
                savePromises.push(updateExperience(currentExp.id, updateData));
              }

              // Check if bullets changed
              const bulletsChanged = !deepEqual(originalExp.bullets, currentExp.bullets);
              console.log(`Experience ${currentExp.id} bullets changed:`, bulletsChanged, {
                originalCount: originalExp.bullets.length,
                currentCount: currentExp.bullets.length,
              });
              
              if (bulletsChanged) {
                // Bullets changed for this experience
                console.log(`Processing bullets for experience ${currentExp.id}`);
                currentExp.bullets.forEach((bullet, bulletIndex) => {
                  const originalBullet = originalExp.bullets.find(b => b.id === bullet.id);
                  const originalBulletIndex = originalExp.bullets.findIndex(b => b.id === bullet.id);
                  const originalExperienceId = originalBulletLocations.get(bullet.id);
                  
                  // Check if bullet moved between experiences
                  const movedBetweenExperiences = originalExperienceId && originalExperienceId !== currentExp.id;
                  // Check if order changed (index is different)
                  const orderChanged = originalBulletIndex >= 0 && originalBulletIndex !== bulletIndex;
                  // Check if content or selection changed
                  const contentChanged = !originalBullet || 
                    originalBullet.content !== bullet.content || 
                    originalBullet.isSelected !== bullet.isSelected;
                  
                  const bulletChanged = !originalBullet || contentChanged || movedBetweenExperiences || orderChanged;
                  
                  console.log(`Bullet ${bullet.id} check:`, {
                    exists: !!originalBullet,
                    moved: movedBetweenExperiences,
                    orderChanged,
                    contentChanged,
                    changed: bulletChanged,
                    originalIndex: originalBulletIndex,
                    currentIndex: bulletIndex,
                    originalContent: originalBullet?.content?.substring(0, 50),
                    currentContent: bullet.content?.substring(0, 50),
                    originalSelected: originalBullet?.isSelected,
                    currentSelected: bullet.isSelected,
                  });
                  
                  // Always update if order changed, content changed, or bullet is new
                  if (bulletChanged || orderChanged) {
                    // Bullet changed - update selection, display order, and experience_id if moved
                    console.log(`Updating bullet ${bullet.id}:`, {
                      isSelected: bullet.isSelected,
                      displayOrder: bulletIndex,
                      movedBetweenExperiences,
                      orderChanged,
                      newExperienceId: currentExp.id
                    });
                    
                    const updateData: any = {
                      content: bullet.content,
                      is_selected: bullet.isSelected,
                      display_order: bulletIndex,
                    };
                    
                    // If bullet moved between experiences, update experience_id
                    if (movedBetweenExperiences) {
                      updateData.experience_id = currentExp.id;
                    }
                    
                    savePromises.push(updateBullet(bullet.id, updateData));
                  }
                });
              }
            } else {
              // New experience - save all bullets
              currentExp.bullets.forEach((bullet, bulletIndex) => {
                savePromises.push(
                  updateBullet(bullet.id, {
                    content: bullet.content,
                    is_selected: bullet.isSelected,
                    display_order: bulletIndex,
                    experience_id: currentExp.id,
                  })
                );
              });
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
        setIsSaving(false);
        return;
      }

      console.log(`Executing ${savePromises.length} save operations...`);
      await Promise.all(savePromises);

      // Update original data and styles to match current (create deep copy to avoid reference issues)
      setOriginalResumeData(JSON.parse(JSON.stringify(currentResumeData)));
      setOriginalResumeStyles(JSON.parse(JSON.stringify(resumeStyles)));

      // Track save event
      const userContext = await getBaseUserContext();
      const saveDuration = Date.now() - saveStartTime;
      
      // Get total save count (we'll need to track this separately or fetch from DB)
      // For now, we'll use a simple counter
      trackEvent('User Saved Resume', {
        'Resume Version ID': versionId,
        'Selected Section': selectedSection,
        'View Mode': viewMode,
        'Sections Changed': sectionsChanged,
        'Change Summary': changeSummary,
        'Save Duration': saveDuration,
        'User Plan': userContext.userPlan,
        'Total Save Count': 1, // TODO: Track this properly
        'Time Since Last Save': null, // TODO: Track this properly
      });

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
  const handleDiscard = async () => {
    // Track discard event before discarding
    const { sectionsChanged, changeSummary } = calculateChangeSummary(
      originalResumeData,
      currentResumeData,
      originalResumeStyles,
      resumeStyles
    );
    
    const userContext = await getBaseUserContext();
    
    trackEvent('User Discarded Resume Changes', {
      'Resume Version ID': versionId,
      'Selected Section': selectedSection,
      'View Mode': viewMode,
      'Sections Changed': sectionsChanged,
      'Change Summary': changeSummary,
      'User Plan': userContext.userPlan,
    });

    setCurrentResumeData(originalResumeData);
    setResumeStyles(originalResumeStyles);
    toast.info('Changes discarded');
  };

  // Add Experience handler - opens modal
  const handleAddExperience = async () => {
    // Track modal open
    const userContext = await getBaseUserContext();
    trackEvent('User Opened Add Experience Modal', {
      'Resume Version ID': versionId,
      'Selected Section': selectedSection,
      'Total Experience Count': currentResumeData.experiences.length,
      'User Plan': userContext.userPlan,
    });
    
    setShowAddExperienceModal(true);
  };

  // Confirm Add Experience - handles form submission
  const handleConfirmAddExperience = async (formData: {
    company: string;
    location: string;
    roles: Array<{ title: string; start_date: string; end_date: string }>;
    bulletMode: 'per_role' | 'per_experience';
  }) => {
    if (!versionId) return;

    setIsAddingExperience(true);
    try {
      if (editingExperience) {
        // Edit mode - update existing experience(s)
        const experience = currentResumeData.experiences.find(exp => exp.id === editingExperience.id);
        if (!experience) {
          toast.error('Experience not found');
          return;
        }

        // If it's a grouped experience, update all roles in the group
        if (experience.roleGroupId) {
          const groupExperiences = currentResumeData.experiences.filter(
            exp => exp.roleGroupId === experience.roleGroupId
          );
          
          // Update company and location for all experiences in group
          await Promise.all(
            groupExperiences.map(exp => 
              updateExperience(exp.id, {
                company: formData.company,
                location: formData.location,
              })
            )
          );

          // Update bullet mode on first experience
          if (groupExperiences.length > 0) {
            await updateExperience(groupExperiences[0].id, {
              bullet_mode: formData.bulletMode,
            });
          }

          // Update or create roles
          // For simplicity, we'll update existing roles and add new ones
          // Delete removed roles (if any)
          const existingRoleIds = groupExperiences.map(exp => exp.id);
          const newRoleCount = formData.roles.length;
          
          // Update existing roles
          for (let i = 0; i < Math.min(existingRoleIds.length, newRoleCount); i++) {
            await updateExperience(existingRoleIds[i], {
              title: formData.roles[i].title,
              start_date: formData.roles[i].start_date,
              end_date: formData.roles[i].end_date,
            });
          }

          // Add new roles if there are more
          if (newRoleCount > existingRoleIds.length) {
            const baseDisplayOrder = Math.max(...groupExperiences.map(e => 
              currentResumeData.experiences.findIndex(exp => exp.id === e.id)
            )) + 1;
            
            for (let i = existingRoleIds.length; i < newRoleCount; i++) {
              await createExperience(versionId, {
                title: formData.roles[i].title,
                company: formData.company,
                location: formData.location,
                start_date: formData.roles[i].start_date,
                end_date: formData.roles[i].end_date,
                display_order: baseDisplayOrder + (i - existingRoleIds.length),
                role_group_id: experience.roleGroupId,
              });
            }
          }

          // Delete removed roles (if any) - but keep at least one
          if (newRoleCount < existingRoleIds.length && newRoleCount > 0) {
            for (let i = newRoleCount; i < existingRoleIds.length; i++) {
              await deleteExperience(existingRoleIds[i]);
            }
          } else if (newRoleCount === 0) {
            toast.error('At least one role is required');
            return;
          }
        } else {
          // Single experience - update it
          if (formData.roles.length > 0) {
            await updateExperience(editingExperience.id, {
              title: formData.roles[0].title,
              company: formData.company,
              location: formData.location,
              start_date: formData.roles[0].start_date,
              end_date: formData.roles[0].end_date,
            });
          }
        }
        
        toast.success('Experience updated successfully');
      } else {
        // Add mode - create multiple experiences (one per role) with same role_group_id
        const groupId = crypto.randomUUID();
        const baseDisplayOrder = currentResumeData.experiences.length;

        // Optimistically create UI experiences
        const newUIExperiences = formData.roles.map((role, index) => ({
          id: `temp-${Date.now()}-${index}`, // Temporary ID
          title: role.title,
          company: formData.company,
          location: formData.location,
          startDate: role.start_date,
          endDate: role.end_date,
          roleGroupId: groupId,
          bulletMode: index === 0 ? formData.bulletMode : null,
          bullets: [],
        }));

        const updatedExperiences = [...currentResumeData.experiences, ...newUIExperiences];
        const updatedResumeData = {
          ...currentResumeData,
          experiences: updatedExperiences,
        };

        setCurrentResumeData(updatedResumeData);

        // Create all roles as separate experiences with the same role_group_id
        const createdExperiences = await Promise.all(
          formData.roles.map(async (role, index) => {
            return await createExperience(versionId, {
              title: role.title,
              company: formData.company,
              location: formData.location,
              start_date: role.start_date,
              end_date: role.end_date,
              display_order: baseDisplayOrder + index,
              role_group_id: groupId,
              bullet_mode: index === 0 ? formData.bulletMode : undefined,
            });
          })
        );

        // Replace temp IDs with real experience data
        const finalExperiences = updatedExperiences.map(exp => {
          const tempIndex = newUIExperiences.findIndex(e => e.id === exp.id);
          if (tempIndex >= 0) {
            const created = createdExperiences[tempIndex];
            return mapDBExperienceToUI({
              ...created,
              bullets: [], // API doesn't return bullets, they're empty on creation
            } as any);
          }
          return exp;
        });

        const finalResumeData = {
          ...updatedResumeData,
          experiences: finalExperiences,
        };

        setCurrentResumeData(finalResumeData);
        // Update originalResumeData to reflect the saved state, so subsequent edits are tracked (deep copy)
        setOriginalResumeData(JSON.parse(JSON.stringify(finalResumeData)));
        toast.success('Experience added successfully');
        
        // Track add experience event
        const userContext = await getBaseUserContext();
        trackEvent('User Added Experience', {
          'Resume Version ID': versionId,
          'Experience ID': createdExperiences[0]?.id || 'unknown',
          'Company Name': formData.company,
          'Location': formData.location,
          'Role Count': formData.roles.length,
          'Role Titles': formData.roles.map(r => r.title),
          'Bullet Mode': formData.bulletMode,
          'Is Grouped Experience': formData.roles.length > 1,
          'Total Experience Count': currentResumeData.experiences.length + formData.roles.length,
          'User Plan': userContext.userPlan,
          'Experience Position': currentResumeData.experiences.length,
        });
      }

      // For edit mode, refetch since it's complex with multiple operations
      if (editingExperience) {
        const refreshedData = await fetchResumeData(versionId);
        if (refreshedData) {
          const uiData = mapCompleteDBResumeToUI(refreshedData);
          setCurrentResumeData(uiData);
          setOriginalResumeData(uiData);
          
          // Track edit experience event
          const userContext = await getBaseUserContext();
          const updatedExperience = uiData.experiences.find(exp => exp.id === editingExperience.id);
          const originalExperience = originalResumeData.experiences.find(exp => exp.id === editingExperience.id);
          const fieldsChanged: string[] = [];
          if (originalExperience) {
            if (formData.company !== originalExperience.company) fieldsChanged.push('company');
            if (formData.location !== originalExperience.location) fieldsChanged.push('location');
            if (formData.roles.length !== (originalExperience.roleGroupId ? originalResumeData.experiences.filter(e => e.roleGroupId === originalExperience.roleGroupId).length : 1)) {
              fieldsChanged.push('roles');
            }
          }
          
          trackEvent('User Edited Experience', {
            'Resume Version ID': versionId,
            'Experience ID': editingExperience.id,
            'Company Name': formData.company,
            'Location': formData.location,
            'Role Count': formData.roles.length,
            'Role Titles': formData.roles.map(r => r.title),
            'Bullet Mode': formData.bulletMode,
            'Is Grouped Experience': !!(originalExperience?.roleGroupId),
            'Fields Changed': fieldsChanged,
            'User Plan': userContext.userPlan,
          });
        }
      }
      setShowAddExperienceModal(false);
      setEditingExperience(null);
    } catch (error) {
      console.error('Error saving experience:', error);
      toast.error('Failed to save experience');
    } finally {
      setIsAddingExperience(false);
    }
  };

  // Edit Experience handler
  const handleEditExperience = (experienceId: string) => {
    const experience = currentResumeData.experiences.find(exp => exp.id === experienceId);
    if (!experience) return;

    // Check if this experience is part of a group
    if (experience.roleGroupId) {
      // Get all experiences in this group
      const groupExperiences = currentResumeData.experiences.filter(
        exp => exp.roleGroupId === experience.roleGroupId
      );
      
      // Get bullet mode from first experience in group
      const bulletMode = groupExperiences[0]?.bulletMode || 'per_role';
      
      // Format roles for the modal
      const roles = groupExperiences.map(exp => ({
        title: exp.title,
        start_date: exp.startDate,
        end_date: exp.endDate,
      }));

      setEditingExperience({
        id: experienceId,
        data: {
          company: experience.company,
          location: experience.location,
          roles: roles,
          bulletMode: bulletMode,
        },
      });
    } else {
      // Single experience - format as single role
      setEditingExperience({
        id: experienceId,
        data: {
          company: experience.company,
          location: experience.location,
          roles: [{
            title: experience.title,
            start_date: experience.startDate,
            end_date: experience.endDate,
          }],
          bulletMode: 'per_role', // Single experiences default to per_role
        },
      });
    }
    setShowAddExperienceModal(true);
  };

  // Add Education handler - opens modal
  const handleAddEducation = async () => {
    // Track modal open
    const userContext = await getBaseUserContext();
    trackEvent('User Opened Add Education Modal', {
      'Resume Version ID': versionId,
      'Selected Section': selectedSection,
      'Total Education Count': currentResumeData.education.length,
      'User Plan': userContext.userPlan,
    });
    
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
        
        // Track edit education event
        const userContext = await getBaseUserContext();
        const education = currentResumeData.education.find(e => e.id === editingEducation.id);
        const fieldsChanged: string[] = [];
        if (education) {
          if (formData.school !== education.school) fieldsChanged.push('school');
          if (formData.degree !== education.degree) fieldsChanged.push('degree');
          if (formData.field !== education.field) fieldsChanged.push('field');
          if (formData.location !== education.location) fieldsChanged.push('location');
          if (formData.gpa !== education.gpa) fieldsChanged.push('gpa');
        }
        
        trackEvent('User Edited Education', {
          'Resume Version ID': versionId,
          'Education ID': editingEducation.id,
          'School Name': formData.school,
          'Degree': formData.degree,
          'Field': formData.field,
          'Has GPA': !!formData.gpa,
          'Fields Changed': fieldsChanged,
          'User Plan': userContext.userPlan,
        });
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
        
        // Track add education event
        const userContext = await getBaseUserContext();
        // Fetch data to get the new education ID
        const refreshedDataForTracking = await fetchResumeData(versionId);
        const newEducation = refreshedDataForTracking ? mapCompleteDBResumeToUI(refreshedDataForTracking).education.find(e => 
          e.school === formData.school && e.degree === formData.degree
        ) : null;
        
        trackEvent('User Added Education', {
          'Resume Version ID': versionId,
          'Education ID': newEducation?.id || 'unknown',
          'School Name': formData.school,
          'Degree': formData.degree,
          'Field': formData.field,
          'Has GPA': !!formData.gpa,
          'Achievement Count': 0,
          'Total Education Count': currentResumeData.education.length + 1,
          'User Plan': userContext.userPlan,
          'Education Position': currentResumeData.education.length,
        });
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
  const handleAddSkill = async (category: 'technical' | 'product' | 'soft', skillName: string) => {
    if (!versionId || !skillName || !skillName.trim()) {
      return;
    }

    try {
      // Optimistically update local state
      const updatedSkills = [...currentResumeData.skills[category], skillName.trim()];
      const updatedResumeData = {
        ...currentResumeData,
        skills: {
          ...currentResumeData.skills,
          [category]: updatedSkills,
        },
      };

      // Update UI immediately
      setCurrentResumeData(updatedResumeData);

      // Save to database
      await updateSkillsForCategory(versionId, category, updatedSkills);

      // Track add skill event
      const userContext = await getBaseUserContext();
      trackEvent('User Added Skill', {
        'Resume Version ID': versionId,
        'Skill Category': category,
        'Skill Name': skillName.trim(),
        'Total Skills In Category': updatedSkills.length,
        'User Plan': userContext.userPlan,
      });

      // Update originalResumeData to reflect the saved state, so subsequent edits are tracked (deep copy)
      setOriginalResumeData(JSON.parse(JSON.stringify(updatedResumeData)));
      toast.success('Skill added successfully');
    } catch (error) {
      // Revert on error
      setCurrentResumeData(originalResumeData);
      console.error('Error adding skill:', error);
      // Error toast is already shown by the hook
    }
  };

  // Optimize bullet handler
  const handleOptimizeBullet = async (bulletId: string): Promise<string[]> => {
    const experience = currentResumeData.experiences.find(exp => 
      exp.bullets.some(b => b.id === bulletId)
    );
    const bullet = experience?.bullets.find(b => b.id === bulletId);
    
    if (!experience || !bullet) {
      return [];
    }

    const originalContentLength = bullet.content.length;
    
    try {
      const optimizedVersions = await optimizeBullet(bulletId);
      
      // Track optimization success
      const userContext = await getBaseUserContext();
      trackEvent('User Optimized Bullet', {
        'Resume Version ID': versionId,
        'Experience ID': experience.id,
        'Bullet ID': bulletId,
        'Company Name': experience.company,
        'Role Title': experience.title,
        'Original Content Length': originalContentLength,
        'Optimization Success': optimizedVersions.length > 0,
        'Optimized Versions Count': optimizedVersions.length,
        'User Selected Version': false, // Will be tracked separately when user selects
        'User Plan': userContext.userPlan,
      });
      
      return optimizedVersions;
    } catch (error) {
      // Track optimization error
      const userContext = await getBaseUserContext();
      trackEvent('User Optimized Bullet', {
        'Resume Version ID': versionId,
        'Experience ID': experience.id,
        'Bullet ID': bulletId,
        'Company Name': experience.company,
        'Role Title': experience.title,
        'Original Content Length': originalContentLength,
        'Optimization Success': false,
        'Optimized Versions Count': 0,
        'User Plan': userContext.userPlan,
      });
      
      throw error;
    }
  };

  // Optimize bullet text handler (for new bullets)
  const handleOptimizeBulletText = async (bulletContent: string, company?: string, role?: string): Promise<string[]> => {
    const originalContentLength = bulletContent.length;
    
    try {
      const optimizedVersions = await optimizeBulletText(bulletContent, company, role);
      
      // Track optimization success
      const userContext = await getBaseUserContext();
      trackEvent('User Optimized New Bullet Text', {
        'Resume Version ID': versionId,
        'Experience ID': null,
        'Company Name': company || null,
        'Role Title': role || null,
        'Original Content Length': originalContentLength,
        'Optimization Success': optimizedVersions.length > 0,
        'Optimized Versions Count': optimizedVersions.length,
        'User Selected Version': false,
        'User Plan': userContext.userPlan,
      });
      
      return optimizedVersions;
    } catch (error) {
      // Track optimization error
      const userContext = await getBaseUserContext();
      trackEvent('User Optimized New Bullet Text', {
        'Resume Version ID': versionId,
        'Experience ID': null,
        'Company Name': company || null,
        'Role Title': role || null,
        'Original Content Length': originalContentLength,
        'Optimization Success': false,
        'Optimized Versions Count': 0,
        'User Plan': userContext.userPlan,
      });
      
      throw error;
    }
  };

  // Delete bullet handler
  const handleDeleteBullet = async (bulletId: string) => {
    if (!versionId) return;

    // Find bullet before deletion
    const experience = currentResumeData.experiences.find(exp => 
      exp.bullets.some(b => b.id === bulletId)
    );
    const bullet = experience?.bullets.find(b => b.id === bulletId);

    try {
      await deleteBullet(bulletId);
      
      // Track delete event
      if (experience && bullet) {
        const userContext = await getBaseUserContext();
        trackEvent('User Deleted Bullet', {
          'Resume Version ID': versionId,
          'Experience ID': experience.id,
          'Bullet ID': bulletId,
          'Company Name': experience.company,
          'Role Title': experience.title,
          'Total Bullets In Experience': experience.bullets.length - 1,
          'User Plan': userContext.userPlan,
        });
      }
      
      // Refresh resume data to get latest from DB
      const refreshedData = await fetchResumeData(versionId);
      if (refreshedData) {
        const uiData = mapCompleteDBResumeToUI(refreshedData);
        setCurrentResumeData(uiData);
        setOriginalResumeData(uiData);
      }
      toast.success('Bullet deleted successfully');
    } catch (error) {
      console.error('Error deleting bullet:', error);
      // Error toast is already shown by the hook
    }
  };

  // Add Bullet handler - inline addition
  const handleAddBullet = async (experienceId: string, content: string) => {
    if (!versionId) return;

    const experience = currentResumeData.experiences.find(
      exp => exp.id === experienceId
    );
    if (!experience) return;

    const displayOrder = experience.bullets.length;
    const newBullet = {
      id: `temp-${Date.now()}`, // Temporary ID, will be replaced
      content: content,
      isSelected: true,
      score: 0,
      tags: [],
      suggestions: [],
    };

    // Optimistically update UI
    const updatedExperiences = currentResumeData.experiences.map(exp => {
      if (exp.id === experienceId) {
        return {
          ...exp,
          bullets: [...exp.bullets, newBullet],
        };
      }
      return exp;
    });

    const updatedResumeData = {
      ...currentResumeData,
      experiences: updatedExperiences,
    };

    setCurrentResumeData(updatedResumeData);

    try {
      const createdBullet = await createBullet(experienceId, {
        content: content,
        is_selected: true,
        display_order: displayOrder,
      });

      // Track add bullet event
      const userContext = await getBaseUserContext();
      trackEvent('User Added Bullet', {
        'Resume Version ID': versionId,
        'Experience ID': experienceId,
        'Bullet ID': createdBullet.id,
        'Company Name': experience.company,
        'Role Title': experience.title,
        'Bullet Content Length': content.length,
        'Bullet Position': displayOrder,
        'Total Bullets In Experience': experience.bullets.length + 1,
        'Is Selected': true,
        'User Plan': userContext.userPlan,
      });

      // Update with real bullet data
      const finalExperiences = updatedExperiences.map(exp => {
        if (exp.id === experienceId) {
          return {
            ...exp,
            bullets: exp.bullets.map(b => 
              b.id === newBullet.id 
                ? {
                    id: createdBullet.id,
                    content: createdBullet.content,
                    isSelected: createdBullet.is_selected,
                    score: createdBullet.score || 0,
                    tags: createdBullet.tags || [],
                    suggestions: [],
                  }
                : b
            ),
          };
        }
        return exp;
      });

      const finalResumeData = {
        ...updatedResumeData,
        experiences: finalExperiences,
      };

      setCurrentResumeData(finalResumeData);
      // Update originalResumeData to reflect the saved state, so subsequent edits are tracked (deep copy)
      setOriginalResumeData(JSON.parse(JSON.stringify(finalResumeData)));
      toast.success('Bullet added successfully');
    } catch (error) {
      // Revert on error
      setCurrentResumeData(originalResumeData);
      console.error('Error adding bullet:', error);
      // Error toast is already shown by the hook
    }
  };

  // Delete Experience handler
  const handleDeleteExperience = async (experienceId: string) => {
    if (!versionId) return;

    const experience = currentResumeData.experiences.find(exp => exp.id === experienceId);
    if (!experience) return;

    // Optimistically remove from UI
    const updatedExperiences = currentResumeData.experiences.filter(
      exp => exp.id !== experienceId
    );
    const updatedResumeData = {
      ...currentResumeData,
      experiences: updatedExperiences,
    };

    setCurrentResumeData(updatedResumeData);

    try {
      await deleteExperience(experienceId);
      
      // Track delete event
      const userContext = await getBaseUserContext();
      const bulletCount = experience.bullets.length;
      const roleCount = experience.roleGroupId 
        ? currentResumeData.experiences.filter(e => e.roleGroupId === experience.roleGroupId).length
        : 1;
      
      trackEvent('User Deleted Experience', {
        'Resume Version ID': versionId,
        'Experience ID': experienceId,
        'Company Name': experience.company,
        'Role Count': roleCount,
        'Bullet Count': bulletCount,
        'Total Experience Count': updatedExperiences.length,
        'User Plan': userContext.userPlan,
      });
      
      // Update originalResumeData to reflect the saved state (deep copy)
      setOriginalResumeData(JSON.parse(JSON.stringify(updatedResumeData)));
      toast.success('Experience deleted successfully');
    } catch (error) {
      // Revert on error
      setCurrentResumeData(originalResumeData);
      console.error('Error deleting experience:', error);
      // Error toast is already shown by the hook
    }
  };

  // Delete Education handler
  const handleDeleteEducation = async (educationId: string) => {
    if (!versionId) return;

    const education = currentResumeData.education.find(e => e.id === educationId);
    if (!education) return;

    try {
      await deleteEducation(educationId);

      // Track delete event
      const userContext = await getBaseUserContext();
      const achievementCount = education.achievements.length;
      
      trackEvent('User Deleted Education', {
        'Resume Version ID': versionId,
        'Education ID': educationId,
        'School Name': education.school,
        'Achievement Count': achievementCount,
        'Total Education Count': currentResumeData.education.length - 1,
        'User Plan': userContext.userPlan,
      });

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

  // Group Experience handler - groups experiences at the same company
  const handleGroupExperience = async (experienceId: string) => {
    if (!versionId) return;

    const experience = currentResumeData.experiences.find(exp => exp.id === experienceId);
    if (!experience) return;

    // Find all experiences at the same company
    const sameCompanyExps = currentResumeData.experiences.filter(
      exp => exp.company === experience.company && exp.id !== experienceId
    );

    if (sameCompanyExps.length === 0) {
      toast.error('No other experiences at this company to group with');
      return;
    }

    // Generate a new group ID (UUID)
    const groupId = crypto.randomUUID();

    // Optimistically update UI
    const allExpsToGroup = [experience, ...sameCompanyExps];
    const updatedExperiences = currentResumeData.experiences.map(exp => {
      if (allExpsToGroup.some(e => e.id === exp.id)) {
        return { ...exp, roleGroupId: groupId };
      }
      return exp;
    });

    const updatedResumeData = {
      ...currentResumeData,
      experiences: updatedExperiences,
    };

    setCurrentResumeData(updatedResumeData);

    try {
      // Update all experiences at the same company to have the same role_group_id
      await Promise.all(
        allExpsToGroup.map(exp => 
          updateExperience(exp.id, { role_group_id: groupId })
        )
      );

      // Track group event
      const userContext = await getBaseUserContext();
      trackEvent('User Grouped Experiences', {
        'Resume Version ID': versionId,
        'Group ID': groupId,
        'Experience IDs': allExpsToGroup.map(e => e.id),
        'Company Name': experience.company,
        'Total Roles In Group': allExpsToGroup.length,
        'User Plan': userContext.userPlan,
      });

      // Update originalResumeData to reflect the saved state, so subsequent edits are tracked (deep copy)
      setOriginalResumeData(JSON.parse(JSON.stringify(updatedResumeData)));
      toast.success('Experiences grouped successfully');
    } catch (error) {
      // Revert on error
      setCurrentResumeData(originalResumeData);
      console.error('Error grouping experience:', error);
      toast.error('Failed to group experiences');
    }
  };

  // Ungroup Experience handler - removes experience from group
  const handleUngroupExperience = async (experienceId: string) => {
    if (!versionId) return;

    const experience = currentResumeData.experiences.find(exp => exp.id === experienceId);
    if (!experience) return;

    const previousGroupId = experience.roleGroupId;

    // Optimistically update UI
    const updatedExperiences = currentResumeData.experiences.map(exp => {
      if (exp.id === experienceId) {
        return { ...exp, roleGroupId: null };
      }
      return exp;
    });

    const updatedResumeData = {
      ...currentResumeData,
      experiences: updatedExperiences,
    };

    setCurrentResumeData(updatedResumeData);

    try {
      await updateExperience(experienceId, { role_group_id: null });
      
      // Track ungroup event
      const userContext = await getBaseUserContext();
      trackEvent('User Ungrouped Experience', {
        'Resume Version ID': versionId,
        'Experience ID': experienceId,
        'Previous Group ID': previousGroupId || null,
        'Company Name': experience.company,
        'User Plan': userContext.userPlan,
      });
      
      // Update originalResumeData to reflect the saved state, so subsequent edits are tracked (deep copy)
      setOriginalResumeData(JSON.parse(JSON.stringify(updatedResumeData)));
      toast.success('Experience ungrouped successfully');
    } catch (error) {
      // Revert on error
      setCurrentResumeData(originalResumeData);
      console.error('Error ungrouping experience:', error);
      toast.error('Failed to ungroup experience');
    }
  };

  // Update bullet mode for an experience group
  const handleUpdateBulletMode = async (groupId: string, bulletMode: 'per_role' | 'per_experience') => {
    if (!versionId) return;

    // Find all experiences in this group
    const groupExperiences = currentResumeData.experiences.filter(
      exp => exp.roleGroupId === groupId
    );
    
    if (groupExperiences.length === 0) return;

    const firstExp = groupExperiences[0];
    const previousBulletMode = firstExp.bulletMode || 'per_role';

    // Optimistically update UI - update all experiences in group with the bullet mode
    const updatedExperiences = currentResumeData.experiences.map(exp => {
      if (exp.roleGroupId === groupId) {
        return { ...exp, bulletMode };
      }
      return exp;
    });

    const updatedResumeData = {
      ...currentResumeData,
      experiences: updatedExperiences,
    };

    setCurrentResumeData(updatedResumeData);

    try {
      // Update the first experience (which stores the bullet_mode)
      await updateExperience(firstExp.id, { bullet_mode: bulletMode });
      
      // Track bullet mode change
      const userContext = await getBaseUserContext();
      trackEvent('User Changed Bullet Mode', {
        'Resume Version ID': versionId,
        'Group ID': groupId,
        'Previous Bullet Mode': previousBulletMode,
        'New Bullet Mode': bulletMode,
        'Company Name': firstExp.company,
        'Total Roles In Group': groupExperiences.length,
        'User Plan': userContext.userPlan,
      });
      
      // Update originalResumeData to reflect the saved state, so subsequent edits are tracked (deep copy)
      setOriginalResumeData(JSON.parse(JSON.stringify(updatedResumeData)));
      toast.success('Bullet mode updated successfully');
    } catch (error) {
      // Revert on error
      setCurrentResumeData(originalResumeData);
      console.error('Error updating bullet mode:', error);
      toast.error('Failed to update bullet mode');
    }
  };

  // Add role to existing experience
  const handleAddRoleToExperience = async (groupId: string, roleData: { title: string; start_date: string; end_date: string }) => {
    if (!versionId) return;

    // Find the first experience in the group to get company/location
    const groupExperiences = currentResumeData.experiences.filter(
      exp => exp.roleGroupId === groupId
    );
    
    if (groupExperiences.length === 0) {
      toast.error('Experience group not found');
      return;
    }

    const firstExp = groupExperiences[0];
    const baseDisplayOrder = Math.max(...groupExperiences.map(e => 
      currentResumeData.experiences.findIndex(exp => exp.id === e.id)
    )) + 1;

    // Optimistically create new role
    const newRole = {
      id: `temp-${Date.now()}`,
      title: roleData.title,
      company: firstExp.company,
      location: firstExp.location,
      startDate: roleData.start_date,
      endDate: roleData.end_date,
      roleGroupId: groupId,
      bulletMode: null, // New roles don't store bullet mode
      bullets: [],
    };

    const updatedExperiences = [...currentResumeData.experiences, newRole];
    const updatedResumeData = {
      ...currentResumeData,
      experiences: updatedExperiences,
    };

    setCurrentResumeData(updatedResumeData);

    try {
      // Create new role as separate experience with same role_group_id
      const createdExperience = await createExperience(versionId, {
        title: roleData.title,
        company: firstExp.company,
        location: firstExp.location,
        start_date: roleData.start_date,
        end_date: roleData.end_date,
        display_order: baseDisplayOrder,
        role_group_id: groupId,
      });

      // Track add role event
      const userContext = await getBaseUserContext();
      trackEvent('User Added Role to Experience Group', {
        'Resume Version ID': versionId,
        'Group ID': groupId,
        'New Experience ID': createdExperience.id,
        'Role Title': roleData.title,
        'Company Name': firstExp.company,
        'Total Roles In Group': groupExperiences.length + 1,
        'User Plan': userContext.userPlan,
      });

      // Replace temp ID with real experience
      const finalExperiences = updatedExperiences.map(exp => {
        if (exp.id === newRole.id) {
          return mapDBExperienceToUI({
            ...createdExperience,
            bullets: [],
          } as any);
        }
        return exp;
      });

      const finalResumeData = {
        ...updatedResumeData,
        experiences: finalExperiences,
      };

      setCurrentResumeData(finalResumeData);
      // Update originalResumeData to reflect the saved state, so subsequent edits are tracked (deep copy)
      setOriginalResumeData(JSON.parse(JSON.stringify(finalResumeData)));
      toast.success('Role added successfully');
    } catch (error) {
      // Revert on error
      setCurrentResumeData(originalResumeData);
      console.error('Error adding role:', error);
      toast.error('Failed to add role');
    }
  };

  // Update Version Name handler
  const handleUpdateVersionName = async (versionId: string, newName: string) => {
    const currentVersion = versions.find(v => v.id === versionId);
    const oldName = currentVersion?.name || 'Unknown';
    
    try {
      await updateVersion(versionId, { name: newName });
      
      // Track rename event
      const userContext = await getBaseUserContext();
      trackEvent('User Renamed Resume', {
        'Resume Version ID': versionId,
        'Old Resume Name': oldName,
        'New Resume Name': newName,
        'Is Master Resume': currentVersion?.is_master || false,
        'User Plan': userContext.userPlan,
      });
      
      toast.success('Resume name updated successfully');
    } catch (error) {
      console.error('Error updating resume name:', error);
      toast.error('Failed to update resume name');
      throw error; // Re-throw to let the component handle it
    }
  };

  // Navigation handlers with blocking
  const handleSectionChange = async (newSection: string) => {
    if (hasUnsavedChanges) {
      setPendingNavigation({ type: 'section', target: newSection });
      setShowUnsavedModal(true);
    } else {
      // Track section change
      const userContext = await getBaseUserContext();
      const sectionItemCount = newSection === 'experience' 
        ? currentResumeData.experiences.length 
        : newSection === 'education' 
        ? currentResumeData.education.length 
        : undefined;

      trackEvent('User Changed Resume Section', {
        'Resume Version ID': versionId,
        'Previous Section': selectedSection,
        'New Section': newSection,
        'View Mode': viewMode,
        'Has Unsaved Changes': false,
        'Section Item Count': sectionItemCount,
        'User Plan': userContext.userPlan,
      });

      // Track viewing analysis section
      if (newSection === 'analysis' && analysisData) {
        trackEvent('User Viewed Analysis Section', {
          'Resume Version ID': versionId,
          'Overall Score': analysisData.overallScore,
          'Category Scores': analysisData.categoryScores,
          'User Plan': userContext.userPlan,
          'Usage Remaining': usageInfo.remaining,
        });
      }

      setSelectedSection(newSection);
    }
  };

  const handleVersionChange = async (newVersionId: string) => {
    if (hasUnsavedChanges) {
      setPendingNavigation({ type: 'version', target: newVersionId });
      setShowUnsavedModal(true);
    } else {
      // Track version switch
      const userContext = await getBaseUserContext();
      const newVersion = versions.find(v => v.id === newVersionId);

      trackEvent('User Switched Resume Version', {
        'Previous Resume ID': versionId,
        'Previous Resume Name': currentResume?.version.name || 'Unknown',
        'New Resume ID': newVersionId,
        'New Resume Name': newVersion?.name || 'Unknown',
        'Has Unsaved Changes': false,
        'User Plan': userContext.userPlan,
      });

      router.push(`/dashboard/resume/${newVersionId}`);
    }
  };

  const handleViewModeChange = async (newMode: "edit" | "preview") => {
    if (hasUnsavedChanges) {
      setPendingNavigation({ type: 'viewMode', target: newMode });
      setShowUnsavedModal(true);
    } else {
      // Track view mode change
      const userContext = await getBaseUserContext();
      const timeInPreviousMode = (Date.now() - viewModeStartTime.current) / 1000;

      trackEvent('User Changed View Mode', {
        'Resume Version ID': versionId,
        'Previous View Mode': viewMode,
        'New View Mode': newMode,
        'Selected Section': selectedSection,
        'Has Unsaved Changes': false,
        'User Plan': userContext.userPlan,
        'Time In Previous Mode': timeInPreviousMode,
      });

      setViewMode(newMode);
      viewModeStartTime.current = Date.now();
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
    const { sectionsChanged } = calculateChangeSummary(
      originalResumeData,
      currentResumeData,
      originalResumeStyles,
      resumeStyles
    );
    
    await handleSave();
    
    // Track save and continue
    if (pendingNavigation) {
      const userContext = await getBaseUserContext();
      trackEvent('User Saved and Continued Navigation', {
        'Resume Version ID': versionId,
        'Navigation Type': pendingNavigation.type,
        'Navigation Target': pendingNavigation.target || null,
        'Sections Changed': sectionsChanged,
        'User Plan': userContext.userPlan,
      });
    }
    
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

  // Helper function to format date as "Month Year"
  const formatMonthYear = (date: Date = new Date()): string => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Handler to trigger professional PDF export
  const handleExportPDF = async () => {
    const exportStartTime = Date.now();
    setIsExportingPDF(true);
    
    const completeness = calculateResumeCompleteness(currentResumeData);
    const userContext = await getBaseUserContext();
    
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
      const exportDuration = Date.now() - exportStartTime;

      // Track export success
      trackEvent('User Exported Resume PDF', {
        'Resume Version ID': versionId,
        'Resume Name': currentResume?.version.name || 'Unknown',
        'Export Success': true,
        'Export Duration': exportDuration,
        'File Size': blob.size,
        'Selected Section': selectedSection,
        'View Mode': viewMode,
        'Resume Completeness': completeness,
        'User Plan': userContext.userPlan,
        'Total Exports': 1, // TODO: Track this properly
      });

      // Create download link with improved filename
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const resumeName = currentResumeData.contactInfo.name || 'Resume';
      link.download = `${resumeName} - ${formatMonthYear()}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      const exportDuration = Date.now() - exportStartTime;
      
      // Track export error
      trackEvent('User Exported Resume PDF', {
        'Resume Version ID': versionId,
        'Resume Name': currentResume?.version.name || 'Unknown',
        'Export Success': false,
        'Export Duration': exportDuration,
        'Selected Section': selectedSection,
        'View Mode': viewMode,
        'Resume Completeness': completeness,
        'User Plan': userContext.userPlan,
      });
      
      console.error('Error exporting PDF:', error);
      alert('Failed to export resume as PDF. Please try again.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Handler to export resume as DOCX
  const handleExportDocx = async () => {
    const exportStartTime = Date.now();
    setIsExportingDocx(true);
    
    const completeness = calculateResumeCompleteness(currentResumeData);
    const userContext = await getBaseUserContext();
    
    try {
      // Transform the resume data to match exportResume.ts types
      const transformedData = {
        ...currentResumeData,
        education: currentResumeData.education.map(edu => ({
          ...edu,
          achievements: edu.achievements?.map(a => a.achievement) || []
        }))
      };

      const document = createResumeDocument(transformedData);
      const resumeName = currentResumeData.contactInfo.name || 'Resume';
      const filename = `${resumeName} - ${formatMonthYear()}.docx`;
      await downloadDocx(document, filename);
      
      const exportDuration = Date.now() - exportStartTime;
      
      // Track export success (we can't get file size for DOCX easily, so we'll estimate or omit)
      trackEvent('User Exported Resume DOCX', {
        'Resume Version ID': versionId,
        'Resume Name': currentResume?.version.name || 'Unknown',
        'Export Success': true,
        'Export Duration': exportDuration,
        'Selected Section': selectedSection,
        'View Mode': viewMode,
        'Resume Completeness': completeness,
        'User Plan': userContext.userPlan,
        'Total Exports': 1, // TODO: Track this properly
      });
    } catch (error) {
      const exportDuration = Date.now() - exportStartTime;
      
      // Track export error
      trackEvent('User Exported Resume DOCX', {
        'Resume Version ID': versionId,
        'Resume Name': currentResume?.version.name || 'Unknown',
        'Export Success': false,
        'Export Duration': exportDuration,
        'Selected Section': selectedSection,
        'View Mode': viewMode,
        'Resume Completeness': completeness,
        'User Plan': userContext.userPlan,
      });
      
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
              onAnalyzeResume={handleAnalyzeResume}
              analysisScore={analysisData?.overallScore ?? null}
              usageCount={usageInfo.count}
              usageRemaining={usageInfo.remaining}
              usageLimit={usageInfo.limit}
              userPlan={userPlan}
              isAnalyzing={isAnalyzing}
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
              versions={versions.map(v => ({
                id: v.id,
                name: v.name,
                isMaster: v.is_master,
                lastModified: v.updated_at
              }))}
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
            onDisplayModeChange={(mode) => {
              setResumeStyles({ ...resumeStyles, experienceDisplayMode: mode });
            }}
            onGroupExperience={handleGroupExperience}
            onUngroupExperience={handleUngroupExperience}
            onUpdateBulletMode={handleUpdateBulletMode}
            onAddRoleToExperience={handleAddRoleToExperience}
            onOptimizeBullet={handleOptimizeBullet}
            onOptimizeBulletText={handleOptimizeBulletText}
            onDeleteBullet={handleDeleteBullet}
            analysisData={analysisData}
            analysisLoading={analysisLoading}
            analysisError={analysisError}
            onAnalyzeResume={handleAnalyzeResume}
            usageRemaining={usageInfo.remaining}
            usageLimit={usageInfo.limit}
            userPlan={userPlan}
            isAnalyzing={isAnalyzing}
          />
        </div>
      </div>

      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onSaveAndContinue={async () => {
          if (pendingNavigation) {
            const userContext = await getBaseUserContext();
            const { sectionsChanged } = calculateChangeSummary(
              originalResumeData,
              currentResumeData,
              originalResumeStyles,
              resumeStyles
            );
            
            trackEvent('User Saw Unsaved Changes Modal', {
              'Resume Version ID': versionId,
              'Navigation Type': pendingNavigation.type,
              'Navigation Target': pendingNavigation.target || null,
              'Sections Changed': sectionsChanged,
              'User Plan': userContext.userPlan,
            });
          }
          await handleSaveAndContinue();
        }}
        onDiscardAndContinue={async () => {
          if (pendingNavigation) {
            const userContext = await getBaseUserContext();
            const { sectionsChanged } = calculateChangeSummary(
              originalResumeData,
              currentResumeData,
              originalResumeStyles,
              resumeStyles
            );
            
            trackEvent('User Handled Unsaved Changes Modal', {
              'Resume Version ID': versionId,
              'Action': 'discard_and_continue',
              'Navigation Type': pendingNavigation.type,
              'Navigation Target': pendingNavigation.target || null,
              'User Plan': userContext.userPlan,
            });
          }
          handleDiscard();
          completePendingNavigation();
        }}
        onCancel={() => {
          if (pendingNavigation) {
            getBaseUserContext().then(userContext => {
              trackEvent('User Handled Unsaved Changes Modal', {
                'Resume Version ID': versionId,
                'Action': 'cancel',
                'Navigation Type': pendingNavigation.type,
                'Navigation Target': pendingNavigation.target || null,
                'User Plan': userContext.userPlan,
              });
            });
          }
          handleCancelNavigation();
        }}
      />

      {/* Accelerate Plan Required Modal */}
      <AcceleratePlanRequiredModal
        isOpen={showAccelerateModal}
        onClose={() => {
          const userContext = getBaseUserContext();
          userContext.then(ctx => {
            trackEvent('User Saw Accelerate Plan Required Modal', {
              'Resume Version ID': versionId,
              'Trigger': 'analyze_resume',
              'User Plan': ctx.userPlan,
              'Usage Remaining': usageInfo.remaining,
            });
          });
          setShowAccelerateModal(false);
        }}
      />

      {/* Add Experience Modal */}
      <AddExperienceModal
        isOpen={showAddExperienceModal}
        onConfirm={handleConfirmAddExperience}
        onCancel={async () => {
          const userContext = await getBaseUserContext();
          trackEvent('User Closed Add Experience Modal', {
            'Resume Version ID': versionId,
            'Modal Action': 'cancelled',
            'User Plan': userContext.userPlan,
          });
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
        onCancel={async () => {
          const userContext = await getBaseUserContext();
          trackEvent('User Closed Add Education Modal', {
            'Resume Version ID': versionId,
            'Modal Action': 'cancelled',
            'User Plan': userContext.userPlan,
          });
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
