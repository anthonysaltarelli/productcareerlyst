"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import ResumeLanding from "@/app/components/resume/ResumeLanding";
import { useResumeData } from "@/lib/hooks/useResumeData";
import { trackEvent } from "@/lib/amplitude/client";
import { getBaseUserContext, daysSince } from "@/lib/utils/resume-tracking";

export default function ResumePage() {
  const router = useRouter();

  // Use the resume data hook
  const {
    versions,
    isLoading,
    createVersion,
    cloneVersion,
    deleteVersion,
    importResumeVersion,
  } = useResumeData();

  // Track page view
  useEffect(() => {
    if (isLoading) return;

    const trackPageView = async () => {
      const userContext = await getBaseUserContext();
      const masterResumeCount = versions.filter(v => v.is_master).length;
      const applicationResumeCount = versions.filter(v => !v.is_master).length;
      const totalResumeCount = versions.length;
      
      // Get most recent resume
      const mostRecentResume = versions.length > 0 
        ? versions.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]
        : null;

      // Calculate days since first resume
      const firstResume = versions.length > 0
        ? versions.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]
        : null;
      const daysSinceFirstResume = firstResume ? daysSince(firstResume.created_at) : null;

      // Calculate days since last edit
      const daysSinceLastEdit = mostRecentResume ? daysSince(mostRecentResume.updated_at) : null;

      trackEvent('User Viewed Resume Landing Page', {
        'Page Route': '/dashboard/resume',
        'Total Resume Count': totalResumeCount,
        'Master Resume Count': masterResumeCount,
        'Application Resume Count': applicationResumeCount,
        'Has Resumes': totalResumeCount > 0,
        'User Plan': userContext.userPlan,
        'Days Since First Resume': daysSinceFirstResume,
        'Days Since Last Resume Edit': daysSinceLastEdit,
        'Most Recent Resume ID': mostRecentResume?.id || null,
        'Most Recent Resume Name': mostRecentResume?.name || null,
      });
    };

    trackPageView();
  }, [isLoading, versions]);

  const handleEditVersion = (versionId: string) => {
    router.push(`/dashboard/resume/${versionId}`);
  };

  const handleCreateMaster = async () => {
    try {
      const masterCount = versions.filter(v => v.is_master).length;
      const versionName = masterCount === 0 ? 'Master Resume' : `Master Resume ${masterCount + 1}`;
      const versionSlug = masterCount === 0 ? 'master' : `master-${masterCount + 1}`;

      // Create master resume
      const version = await createVersion(versionName, versionSlug, true);

      // Track event
      const userContext = await getBaseUserContext();
      trackEvent('User Created Resume', {
        'Resume Version ID': version.id,
        'Resume Name': version.name,
        'Is Master Resume': true,
        'Creation Method': 'from_scratch',
        'User Plan': userContext.userPlan,
        'Total Resume Count': versions.length + 1,
        'Has Existing Resumes': versions.length > 0,
      });

      // Navigate to the new version
      router.push(`/dashboard/resume/${version.id}`);
    } catch (error) {
      console.error('Error creating master resume:', error);
      // Error already handled by the hook with toast
    }
  };

  const handleCloneFromMaster = async (sourceVersionId: string, newName: string, applicationId?: string, isMaster?: boolean) => {
    try {
      const sourceVersion = versions.find(v => v.id === sourceVersionId);
      const version = await cloneVersion(sourceVersionId, newName, applicationId, isMaster || false);

      // Track event
      const userContext = await getBaseUserContext();
      trackEvent('User Cloned Resume', {
        'Source Resume ID': sourceVersionId,
        'Source Resume Name': sourceVersion?.name || 'Unknown',
        'New Resume ID': version.id,
        'New Resume Name': version.name,
        'Is Master Resume': isMaster || false,
        'Source Is Master Resume': sourceVersion?.is_master || false,
        'Application ID': applicationId || null,
        'User Plan': userContext.userPlan,
        'Total Resume Count': versions.length + 1,
      });

      // Navigate to the new version
      router.push(`/dashboard/resume/${version.id}`);
    } catch (error) {
      console.error('Error cloning resume:', error);
      // Error already handled by the hook with toast
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    try {
      const versionToDelete = versions.find(v => v.id === versionId);
      if (!versionToDelete) return;

      // Track before deletion
      const userContext = await getBaseUserContext();
      const resumeAge = daysSince(versionToDelete.created_at);
      
      // Check if resume has analysis (we'll need to fetch this or pass it)
      trackEvent('User Deleted Resume', {
        'Resume Version ID': versionId,
        'Resume Name': versionToDelete.name,
        'Is Master Resume': versionToDelete.is_master,
        'Resume Age': resumeAge,
        'Total Resume Count': versions.length - 1,
        'User Plan': userContext.userPlan,
        'Had Analysis': false, // TODO: Fetch actual analysis status if needed
      });

      await deleteVersion(versionId);
      // Success toast is shown by the hook
    } catch (error) {
      console.error('Error deleting resume:', error);
      // Error already handled by the hook with toast
    }
  };

  const handleImportMaster = async (file: File, versionName: string, isMaster: boolean) => {
    try {
      const fileType = file.type === 'application/pdf' ? 'pdf' : file.type.includes('wordprocessingml') ? 'docx' : 'unknown';
      const fileSize = file.size;

      const version = await importResumeVersion(file, versionName, isMaster);
      
      // Track event with extracted sections
      if (version?.id) {
        const userContext = await getBaseUserContext();
        
        // Extract section information from the version object
        // The version object from the API has the structure with nested arrays
        const contactInfo = Array.isArray(version.contactInfo) ? version.contactInfo[0] : version.contactInfo;
        const summary = Array.isArray(version.summary) ? version.summary[0] : version.summary;
        const experiences = version.experiences || [];
        const education = version.education || [];
        const skills = version.skills || [];
        
        // Calculate extracted sections
        const hasContactInfo = !!(contactInfo && (contactInfo.full_name || contactInfo.email));
        const hasSummary = !!(summary && summary.content && summary.content.trim().length > 0);
        const experienceCount = Array.isArray(experiences) ? experiences.length : 0;
        const educationCount = Array.isArray(education) ? education.length : 0;
        const skillsCount = Array.isArray(skills) ? skills.length : 0;
        
        trackEvent('User Imported Resume', {
          'Resume Version ID': version.id,
          'Resume Name': version.name,
          'Is Master Resume': isMaster,
          'File Type': fileType,
          'File Size': fileSize,
          'Import Success': true,
          'Extracted Sections': {
            'Has Contact Info': hasContactInfo,
            'Has Summary': hasSummary,
            'Experience Count': experienceCount,
            'Education Count': educationCount,
            'Skills Count': skillsCount,
          },
          'User Plan': userContext.userPlan,
        });

        // Navigate to the new version
        router.push(`/dashboard/resume/${version.id}`);
      }
    } catch (error) {
      // Track error with detailed information
      const userContext = await getBaseUserContext();
      
      // Categorize error type
      let errorType: string = 'unknown';
      let errorMessages: string[] = [];
      
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('file size') || errorMessage.includes('size exceeds')) {
          errorType = 'file_validation';
        } else if (errorMessage.includes('file type') || errorMessage.includes('unsupported')) {
          errorType = 'file_validation';
        } else if (errorMessage.includes('openai') || errorMessage.includes('processing') || errorMessage.includes('timeout')) {
          errorType = 'openai_processing';
        } else if (errorMessage.includes('database') || errorMessage.includes('insert') || errorMessage.includes('failed to insert')) {
          errorType = 'database_error';
        } else if (errorMessage.includes('unauthorized') || errorMessage.includes('auth')) {
          errorType = 'authentication_error';
        } else {
          errorType = 'unknown';
        }
        errorMessages = [error.message];
      } else {
        errorMessages = ['Unknown error'];
      }
      
      trackEvent('User Imported Resume', {
        'Resume Name': versionName,
        'Is Master Resume': isMaster,
        'File Type': file.type === 'application/pdf' ? 'pdf' : file.type.includes('wordprocessingml') ? 'docx' : 'unknown',
        'File Size': file.size,
        'Import Success': false,
        'Import Errors': errorMessages,
        'Error Type': errorType,
        'User Plan': userContext.userPlan,
      });

      console.error('Error importing resume:', error);
      // Error already handled by the hook with toast
    }
  };

  return (
    <ResumeLanding
      versions={versions}
      onEditVersion={handleEditVersion}
      onCreateMaster={handleCreateMaster}
      onCloneFromMaster={handleCloneFromMaster}
      onDeleteVersion={handleDeleteVersion}
      onImportMaster={handleImportMaster}
    />
  );
}
