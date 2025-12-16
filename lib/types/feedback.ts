// Product Feedback Types

export type FeedbackCategory = 'bug' | 'enhancement' | 'new_idea';

export type FeedbackStatus = 'evaluating' | 'in_progress' | 'shipped' | 'archived' | null;

export type VoteType = 'upvote' | 'downvote';

export type RelatedFeature =
  | 'pm_courses'
  | 'resume_editor'
  | 'job_center'
  | 'product_portfolio'
  | 'pm_resources'
  | 'ai_interview_prep'
  | 'other';

export interface FeedbackItem {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: FeedbackStatus;
  category: FeedbackCategory;
  related_feature: RelatedFeature;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  vote_count: number;
  upvote_count: number;
  downvote_count: number;
  user_vote_type: VoteType | null;
  comment_count: number;
  author: {
    first_name: string | null;
    last_name: string | null;
  };
  is_own_request: boolean;
}

export interface FeedbackComment {
  id: string;
  feature_request_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author: {
    first_name: string | null;
    last_name: string | null;
  };
  is_own_comment: boolean;
}

// Configuration for category badges
export const CATEGORY_CONFIG: Record<
  FeedbackCategory,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  bug: {
    label: 'Bug',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
  },
  enhancement: {
    label: 'Enhancement',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
  },
  new_idea: {
    label: 'New Idea',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
  },
};

// Configuration for feature tags
export const FEATURE_CONFIG: Record<
  RelatedFeature,
  { label: string; color: string; bgColor: string }
> = {
  pm_courses: {
    label: 'PM Courses',
    bgColor: 'bg-indigo-100',
    color: 'text-indigo-700',
  },
  resume_editor: {
    label: 'Resume Editor',
    bgColor: 'bg-orange-100',
    color: 'text-orange-700',
  },
  job_center: {
    label: 'Job Center',
    bgColor: 'bg-cyan-100',
    color: 'text-cyan-700',
  },
  product_portfolio: {
    label: 'Product Portfolio',
    bgColor: 'bg-emerald-100',
    color: 'text-emerald-700',
  },
  pm_resources: {
    label: 'PM Resources',
    bgColor: 'bg-yellow-100',
    color: 'text-yellow-700',
  },
  ai_interview_prep: {
    label: 'AI Interview Prep',
    bgColor: 'bg-purple-100',
    color: 'text-purple-700',
  },
  other: {
    label: 'Other',
    bgColor: 'bg-gray-100',
    color: 'text-gray-700',
  },
};

// Configuration for status columns
export const STATUS_CONFIG: Record<
  NonNullable<FeedbackStatus>,
  { label: string; color: string; dotColor: string; borderColor: string }
> = {
  evaluating: {
    label: 'Evaluating',
    color: 'bg-yellow-100 text-yellow-700',
    dotColor: 'bg-yellow-400',
    borderColor: 'border-yellow-200',
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-blue-100 text-blue-700',
    dotColor: 'bg-blue-500',
    borderColor: 'border-blue-200',
  },
  shipped: {
    label: 'Shipped',
    color: 'bg-green-100 text-green-700',
    dotColor: 'bg-green-500',
    borderColor: 'border-green-200',
  },
  archived: {
    label: 'Archived',
    color: 'bg-gray-100 text-gray-500',
    dotColor: 'bg-gray-400',
    borderColor: 'border-gray-200',
  },
};

// Feature options for select dropdown
export const FEATURE_OPTIONS: { value: RelatedFeature; label: string }[] = [
  { value: 'pm_courses', label: 'PM Courses' },
  { value: 'resume_editor', label: 'Resume Editor' },
  { value: 'job_center', label: 'Job Center' },
  { value: 'product_portfolio', label: 'Product Portfolio' },
  { value: 'pm_resources', label: 'PM Resources' },
  { value: 'ai_interview_prep', label: 'AI Interview Prep' },
  { value: 'other', label: 'Other' },
];

// Category options for buttons
export const CATEGORY_OPTIONS: { value: FeedbackCategory; label: string }[] = [
  { value: 'bug', label: 'Bug' },
  { value: 'enhancement', label: 'Enhancement' },
  { value: 'new_idea', label: 'New Idea' },
];

// Status column order for Kanban
export const STATUS_COLUMN_ORDER: (FeedbackStatus | 'evaluating')[] = [
  'evaluating',
  'in_progress',
  'shipped',
  'archived',
];

// Helper to get display status (null shows as 'evaluating')
export function getDisplayStatus(status: FeedbackStatus): NonNullable<FeedbackStatus> {
  return status ?? 'evaluating';
}
