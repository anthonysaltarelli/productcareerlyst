"use client";

import { useState } from "react";
import ResumeLanding from "@/app/components/resume/ResumeLanding";
import ResumeVersionSidebar from "@/app/components/resume/ResumeVersionSidebar";
import ResumeEditor from "@/app/components/resume/ResumeEditor";

export default function ResumePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState("master");
  const [selectedSection, setSelectedSection] = useState("experience");
  const [selectedBulletId, setSelectedBulletId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "split">("edit");

  const handleEditVersion = (versionId: string) => {
    setSelectedVersion(versionId);
    setIsEditing(true);
  };

  const handleBackToLanding = () => {
    setIsEditing(false);
    setSelectedBulletId(null);
  };

  if (!isEditing) {
    return <ResumeLanding onEditVersion={handleEditVersion} />;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Left Sidebar - Version & Section Navigation */}
      <div className="w-72 bg-white/80 backdrop-blur-sm border-r border-slate-200 flex-shrink-0 overflow-y-auto shadow-lg">
        <ResumeVersionSidebar
          selectedVersion={selectedVersion}
          onVersionChange={setSelectedVersion}
          selectedSection={selectedSection}
          onSectionChange={setSelectedSection}
        />
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
        />
      </div>
    </div>
  );
}

