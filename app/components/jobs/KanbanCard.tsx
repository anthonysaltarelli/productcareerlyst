'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { JobApplicationWithCompany, PriorityLevel } from '@/lib/types/jobs';

const priorityConfig: Record<PriorityLevel, { label: string; color: string; bgColor: string; borderColor: string }> = {
  high: { label: 'High', color: 'text-red-600', bgColor: 'bg-red-100', borderColor: 'border-red-400' },
  medium: { label: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-400' },
  low: { label: 'Low', color: 'text-gray-600', bgColor: 'bg-gray-100', borderColor: 'border-gray-400' },
};

interface KanbanCardProps {
  job: JobApplicationWithCompany;
  onEdit: (job: JobApplicationWithCompany) => void;
  isDragOverlay?: boolean;
}

const handleFormatSalary = (job: JobApplicationWithCompany): string => {
  if (!job.salary_min || !job.salary_max) return 'Not specified';
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: job.salary_currency || 'USD',
    minimumFractionDigits: 0,
  });
  return `${formatter.format(job.salary_min)} - ${formatter.format(job.salary_max)}`;
};

const handleFormatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const handleCalculateDaysAgo = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
};

export const KanbanCard = ({ job, onEdit, isDragOverlay = false }: KanbanCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: job.id,
    data: {
      job,
      type: 'job-card',
    },
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onEdit(job);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white rounded-[1.5rem] p-5 border-2 border-gray-300 
        shadow-[0_6px_0_0_rgba(0,0,0,0.1)] 
        transition-all duration-200 
        group
        ${isDragging && !isDragOverlay ? 'opacity-50' : ''}
        ${isDragOverlay ? 'shadow-[0_12px_24px_rgba(0,0,0,0.2)] rotate-3 scale-105 cursor-grabbing' : 'cursor-grab hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(0,0,0,0.1)]'}
      `}
      {...listeners}
      {...attributes}
      tabIndex={0}
      aria-label={`Drag ${job.title} at ${job.company?.name || 'Unknown Company'}`}
    >
      {/* Company & Title */}
      <Link href={`/dashboard/jobs/${job.id}`} onClick={(e) => isDragging && e.preventDefault()}>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-1">
              {job.title}
            </h4>
            <p className="text-sm text-gray-700 font-semibold mt-0.5">{job.company?.name || 'Unknown Company'}</p>
          </div>
          {job.priority && (
            <span className={`text-xs font-black px-3 py-1 rounded-[0.75rem] border-2 ${priorityConfig[job.priority].bgColor} ${priorityConfig[job.priority].color} ${priorityConfig[job.priority].borderColor}`}>
              {priorityConfig[job.priority].label}
            </span>
          )}
        </div>

        {/* Location & Work Mode */}
        {(job.location || job.work_mode) && (
          <div className="flex items-center gap-2 text-xs text-gray-700 font-medium mb-3">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {job.location && <span className="line-clamp-1">{job.location}</span>}
            {job.location && job.work_mode && <span className="text-gray-400">•</span>}
            {job.work_mode && <span className="capitalize">{job.work_mode}</span>}
          </div>
        )}

        {/* Salary */}
        {(job.salary_min && job.salary_max) && (
          <div className="text-sm font-bold text-gray-800 mb-3">
            {handleFormatSalary(job)}
          </div>
        )}

        {/* Applied Date */}
        {job.applied_date && (
          <div className="text-xs text-gray-600 font-medium flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Applied {handleFormatDate(job.applied_date)} • {handleCalculateDaysAgo(job.applied_date)}
          </div>
        )}

        {/* Deadline Warning */}
        {job.deadline && new Date(job.deadline) > new Date() && (
          <div className="mt-3 pt-3 border-t-2 border-gray-200">
            <div className="text-xs text-orange-600 font-bold flex items-center gap-1 bg-orange-100 px-3 py-2 rounded-[0.75rem] border-2 border-orange-300">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Deadline: {handleFormatDate(job.deadline)}
            </div>
          </div>
        )}
      </Link>
      
      {/* Edit Button */}
      <button
        onClick={handleEditClick}
        onPointerDown={(e) => e.stopPropagation()}
        className="mt-3 w-full px-4 py-2 rounded-[1rem] bg-purple-100 text-purple-700 font-bold hover:bg-purple-200 transition-colors text-sm"
        aria-label={`Edit ${job.title} application`}
        tabIndex={0}
      >
        Edit Application
      </button>
    </div>
  );
};

export default KanbanCard;

