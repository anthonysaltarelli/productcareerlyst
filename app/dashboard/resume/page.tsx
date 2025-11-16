"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ResumeLanding from "@/app/components/resume/ResumeLanding";
import { useResumeData } from "@/lib/hooks/useResumeData";

export default function ResumePage() {
  const router = useRouter();

  // Use the resume data hook
  const {
    versions,
    isLoading,
    createVersion,
    cloneVersion,
    deleteVersion,
  } = useResumeData();

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

      // Navigate to the new version
      router.push(`/dashboard/resume/${version.id}`);
    } catch (error) {
      console.error('Error creating master resume:', error);
      // Error already handled by the hook with toast
    }
  };

  const handleCloneFromMaster = async (sourceVersionId: string, newName: string, applicationId?: string, isMaster?: boolean) => {
    try {
      const version = await cloneVersion(sourceVersionId, newName, applicationId, isMaster || false);

      // Navigate to the new version
      router.push(`/dashboard/resume/${version.id}`);
    } catch (error) {
      console.error('Error cloning resume:', error);
      // Error already handled by the hook with toast
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    try {
      await deleteVersion(versionId);
      // Success toast is shown by the hook
    } catch (error) {
      console.error('Error deleting resume:', error);
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
    />
  );
}
