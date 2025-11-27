'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { ApplicationStatus, JobApplicationWithCompany } from '@/lib/types/jobs';
import { updateJobApplication } from '@/lib/hooks/useJobApplications';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';

const columnOrder: ApplicationStatus[] = ['wishlist', 'applied', 'interviewing', 'offer', 'rejected'];

interface KanbanBoardProps {
  applications: JobApplicationWithCompany[];
  onEdit: (job: JobApplicationWithCompany) => void;
  onRefetch: () => void;
}

export const KanbanBoard = ({ applications, onEdit }: KanbanBoardProps) => {
  const [activeJob, setActiveJob] = useState<JobApplicationWithCompany | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [optimisticApplications, setOptimisticApplications] = useState<JobApplicationWithCompany[]>(applications);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const isUpdatingRef = useRef(false);

  // Sync optimistic state with parent applications when they change externally
  // (e.g., new job added, job edited via modal)
  useEffect(() => {
    // Don't sync while we're in the middle of a drag update
    if (!isUpdatingRef.current) {
      setOptimisticApplications(applications);
    }
  }, [applications]);

  // Configure sensors with activation constraints
  // This ensures we don't start dragging on small movements (like clicking the edit button)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance before activating
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const job = active.data.current?.job as JobApplicationWithCompany;
    if (job) {
      setActiveJob(job);
      setUpdateError(null); // Clear any previous errors
    }
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveJob(null);

    if (!over) return;

    const jobId = active.id as string;
    const newStatus = over.id as ApplicationStatus;

    // Find the job being dragged
    const draggedJob = optimisticApplications.find((app) => app.id === jobId);
    if (!draggedJob) return;

    // If dropped in the same column, do nothing
    if (draggedJob.status === newStatus) return;

    // Optimistically update the UI
    setIsUpdating(jobId);
    isUpdatingRef.current = true;
    setOptimisticApplications((prev) =>
      prev.map((app) =>
        app.id === jobId ? { ...app, status: newStatus } : app
      )
    );

    try {
      // Update the status in the backend
      await updateJobApplication(jobId, { status: newStatus });
      
      // No refetch needed - optimistic update already shows correct state
      // The parent will sync on next external change (add/edit job)
    } catch (error) {
      console.error('Failed to update job status:', error);
      
      // Revert optimistic update on error
      setOptimisticApplications((prev) =>
        prev.map((app) =>
          app.id === jobId ? { ...app, status: draggedJob.status } : app
        )
      );
      
      setUpdateError(
        `Failed to update "${draggedJob.title}" status. Please try again.`
      );
      
      // Auto-dismiss error after 5 seconds
      setTimeout(() => setUpdateError(null), 5000);
    } finally {
      setIsUpdating(null);
      isUpdatingRef.current = false;
    }
  }, [optimisticApplications]);

  const handleDragCancel = useCallback(() => {
    setActiveJob(null);
  }, []);

  return (
    <div className="hidden md:block relative">
      {/* Error Toast */}
      {updateError && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-red-100 border-2 border-red-400 text-red-700 px-6 py-4 rounded-[1.5rem] shadow-[0_8px_0_0_rgba(220,38,38,0.3)] flex items-center gap-3 max-w-md">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-bold text-sm">{updateError}</span>
            <button
              onClick={() => setUpdateError(null)}
              className="ml-2 text-red-700 hover:text-red-900 font-black"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Update Loading Indicator */}
      {isUpdating && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 fade-in duration-300">
          <div className="bg-purple-100 border-2 border-purple-400 text-purple-700 px-6 py-3 rounded-[1.5rem] shadow-[0_6px_0_0_rgba(147,51,234,0.3)] flex items-center gap-3">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
            <span className="font-bold text-sm">Updating status...</span>
          </div>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="overflow-x-auto">
          <div className="flex gap-6 min-w-max pb-8">
            {columnOrder.map((status) => {
              const jobsInColumn = optimisticApplications.filter((app) => app.status === status);

              return (
                <KanbanColumn
                  key={status}
                  status={status}
                  jobs={jobsInColumn}
                  onEdit={onEdit}
                />
              );
            })}
          </div>
        </div>

        {/* Drag Overlay - Follows the cursor while dragging */}
        <DragOverlay dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}>
          {activeJob ? (
            <div className="w-80">
              <KanbanCard
                job={activeJob}
                onEdit={onEdit}
                isDragOverlay
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default KanbanBoard;

