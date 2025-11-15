// Job Application Types

export type ApplicationStatus = 
  | 'wishlist' 
  | 'applied' 
  | 'screening' 
  | 'interviewing' 
  | 'offer' 
  | 'rejected' 
  | 'accepted' 
  | 'withdrawn';

export type InterviewType = 
  | 'recruiter_screen' 
  | 'phone_screen' 
  | 'technical' 
  | 'behavioral' 
  | 'system_design' 
  | 'onsite' 
  | 'final' 
  | 'other';

export type ContactRelationship = 
  | 'recruiter' 
  | 'hiring_manager' 
  | 'team_member' 
  | 'referral' 
  | 'peer' 
  | 'executive' 
  | 'other';

export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled';

export interface JobApplication {
  id: string;
  title: string;
  company: string;
  location: string;
  workMode: 'remote' | 'hybrid' | 'onsite';
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  jobUrl?: string;
  companyWebsite?: string;
  description?: string;
  status: ApplicationStatus;
  priority: 'low' | 'medium' | 'high';
  appliedDate?: string;
  deadline?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Interview {
  id: string;
  applicationId: string;
  title: string;
  type: InterviewType;
  status: InterviewStatus;
  scheduledFor?: string;
  duration?: number; // minutes
  location?: string;
  meetingLink?: string;
  interviewers?: string[];
  notes?: string;
  prepNotes?: string;
  feedback?: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  applicationId: string;
  name: string;
  title: string;
  email?: string;
  linkedinUrl?: string;
  phone?: string;
  relationship: ContactRelationship;
  lastContactDate?: string;
  notes?: string;
  interactions: ContactInteraction[];
  createdAt: string;
}

export interface ContactInteraction {
  id: string;
  date: string;
  type: 'email' | 'linkedin' | 'phone' | 'coffee' | 'other';
  summary: string;
  notes?: string;
}

export interface CompanyResearch {
  id: string;
  applicationId: string;
  overview?: string;
  culture?: string;
  products?: string[];
  techStack?: string[];
  recentNews?: Array<{
    title: string;
    url: string;
    date: string;
  }>;
  interviewTips?: string;
  notes?: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  applicationId: string;
  name: string;
  type: 'resume' | 'cover_letter' | 'portfolio' | 'other';
  url?: string;
  notes?: string;
  createdAt: string;
}

