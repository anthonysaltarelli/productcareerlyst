'use client';

import { useDroppable } from '@dnd-kit/core';
import { ApplicationStatus, JobApplicationWithCompany } from '@/lib/types/jobs';
import { KanbanCard } from './KanbanCard';

const statusConfig: Record<ApplicationStatus, { label: string; color: string; bgColor: string; borderColor: string }> = {
  wishlist: { label: 'Wishlist', color: 'text-gray-700', bgColor: 'bg-gray-50', borderColor: 'border-gray-300' },
  applied: { label: 'Applied', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-300' },
  screening: { label: 'Screening', color: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-300' },
  interviewing: { label: 'Interviewing', color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-300' },
  offer: { label: 'Offer', color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-300' },
  rejected: { label: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-300' },
  accepted: { label: 'Accepted', color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-300' },
  withdrawn: { label: 'Withdrawn', color: 'text-gray-700', bgColor: 'bg-gray-50', borderColor: 'border-gray-300' },
};

const statusBadgeBorderConfig: Record<ApplicationStatus, string> = {
  wishlist: 'border-gray-400',
  applied: 'border-blue-400',
  screening: 'border-yellow-400',
  interviewing: 'border-purple-400',
  offer: 'border-green-400',
  rejected: 'border-red-400',
  accepted: 'border-emerald-400',
  withdrawn: 'border-gray-400',
};

interface KanbanColumnProps {
  status: ApplicationStatus;
  jobs: JobApplicationWithCompany[];
  onEdit: (job: JobApplicationWithCompany) => void;
}

export const KanbanColumn = ({ status, jobs, onEdit }: KanbanColumnProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id: status,
    data: {
      status,
      type: 'column',
    },
  });

  const config = statusConfig[status];

  return (
    <div className="flex-shrink-0 w-80">
      {/* Column Header */}
      <div className={`${config.bgColor} rounded-t-[1.5rem] p-5 border-2 ${config.borderColor}`}>
        <div className="flex items-center justify-between">
          <h3 className={`font-black text-lg ${config.color}`}>{config.label}</h3>
          <span className={`${config.color} text-sm font-black px-3 py-1 rounded-[0.75rem] bg-white/60 border-2 ${statusBadgeBorderConfig[status]}`}>
            {jobs.length}
          </span>
        </div>
      </div>

      {/* Cards Container - Droppable */}
      <div
        ref={setNodeRef}
        className={`
          space-y-4 p-4 rounded-b-[1.5rem] min-h-[500px] border-x-2 border-b-2 
          ${config.borderColor}
          transition-all duration-200
          ${isOver 
            ? 'bg-gradient-to-br from-purple-100/80 to-pink-100/80 ring-4 ring-purple-400 ring-opacity-50 scale-[1.02]' 
            : 'bg-white/40'
          }
        `}
        aria-label={`${config.label} column with ${jobs.length} jobs`}
      >
        {/* Drop Indicator when dragging over */}
        {isOver && (
          <div className="flex items-center justify-center p-4 rounded-[1rem] border-2 border-dashed border-purple-400 bg-purple-100/50 mb-2">
            <span className="text-sm font-bold text-purple-600">
              Drop here to move to {config.label}
            </span>
          </div>
        )}
        
        {jobs.map((job) => (
          <KanbanCard
            key={job.id}
            job={job}
            onEdit={onEdit}
          />
        ))}

        {jobs.length === 0 && !isOver && (
          <div className="text-center py-8 text-gray-600 text-sm font-semibold">
            No jobs yet 🎯
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;

