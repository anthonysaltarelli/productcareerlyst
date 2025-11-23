// Job Application Types - Updated for Database Schema

// ============================================================================
// ENUMS (matching database enums)
// ============================================================================

export type ApplicationStatus = 
  | 'wishlist' 
  | 'applied' 
  | 'screening' 
  | 'interviewing' 
  | 'offer' 
  | 'rejected' 
  | 'accepted' 
  | 'withdrawn';

export type PriorityLevel = 'low' | 'medium' | 'high';

export type WorkMode = 'remote' | 'hybrid' | 'onsite';

export type InterviewType = 
  | 'recruiter_screen' 
  | 'phone_screen' 
  | 'technical' 
  | 'behavioral' 
  | 'system_design' 
  | 'onsite' 
  | 'final' 
  | 'other';

export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled';

export type InterviewOutcome = 'passed' | 'failed' | 'pending';

export type ContactRelationship = 
  | 'recruiter' 
  | 'hiring_manager' 
  | 'team_member' 
  | 'referral' 
  | 'peer' 
  | 'executive' 
  | 'other';

export type InteractionType = 
  | 'email' 
  | 'linkedin' 
  | 'phone' 
  | 'coffee' 
  | 'video_call' 
  | 'other';

export type InterviewerRole = 
  | 'interviewer' 
  | 'panel_member' 
  | 'observer';

export type CompanyIndustry = 
  | 'technology' 
  | 'finance' 
  | 'healthcare' 
  | 'retail' 
  | 'consulting' 
  | 'education' 
  | 'manufacturing' 
  | 'media' 
  | 'other';

export type CompanySize = 
  | '1-50' 
  | '51-200' 
  | '201-500' 
  | '501-1000' 
  | '1001-5000' 
  | '5000+';

export type CurrencyCode = 
  | 'USD' 
  | 'EUR' 
  | 'GBP' 
  | 'CAD' 
  | 'AUD' 
  | 'JPY' 
  | 'INR';

// ============================================================================
// SHARED TABLES (cross-user)
// ============================================================================

export interface Company {
  id: string;
  name: string;
  website?: string;
  linkedin_url?: string;
  industry?: CompanyIndustry;
  size?: CompanySize;
  headquarters_city?: string;
  headquarters_state?: string;
  headquarters_country?: string;
  description?: string;
  founded_year?: number;
  is_approved: boolean;
  created_by_user_id?: string;
  created_at: string;
  updated_at: string;
}

export type ResearchType = 
  | 'mission'
  | 'values'
  | 'origin_story'
  | 'product'
  | 'user_types'
  | 'competition'
  | 'risks'
  | 'recent_launches'
  | 'strategy'
  | 'funding'
  | 'partnerships'
  | 'customer_feedback'
  | 'business_model';

export interface CompanyResearch {
  id: string;
  company_id: string;
  research_type: ResearchType;
  perplexity_response: {
    content?: string;
    sources?: string[];
    search_results?: Array<{
      title: string;
      url: string;
      date?: string;
      snippet?: string;
    }>;
    citations?: string[];
    [key: string]: any; // Allow for other Perplexity response fields
  };
  generated_at: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// USER-PRIVATE TABLES
// ============================================================================

export interface JobApplication {
  id: string;
  user_id: string;
  company_id: string;
  title: string;
  location?: string;
  work_mode?: WorkMode;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: CurrencyCode;
  job_url?: string;
  description?: string;
  status: ApplicationStatus;
  priority: PriorityLevel;
  applied_date?: string; // ISO date string
  deadline?: string; // ISO date string
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Interview {
  id: string;
  user_id: string;
  application_id: string;
  title: string;
  type?: InterviewType;
  status: InterviewStatus;
  scheduled_for?: string;
  duration_minutes?: number;
  location?: string;
  meeting_link?: string;
  prep_notes?: string;
  feedback?: string;
  outcome?: InterviewOutcome;
  thank_you_email_subject?: string;
  thank_you_email_body?: string;
  created_at: string;
  updated_at: string;
}

export interface InterviewQuestion {
  id: string;
  user_id: string;
  interview_id: string;
  question: string;
  answer?: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  user_id: string;
  company_id: string;
  application_id?: string;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  relationship?: ContactRelationship;
  last_contact_date?: string; // ISO date string
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InterviewInterviewer {
  id: string;
  interview_id: string;
  contact_id: string;
  role?: InterviewerRole;
  created_at: string;
}

export interface ContactInteraction {
  id: string;
  user_id: string;
  contact_id: string;
  date: string; // ISO date string
  type?: InteractionType;
  summary: string;
  notes?: string;
  created_at: string;
}

// ============================================================================
// EXTENDED TYPES WITH RELATIONS
// ============================================================================

export interface JobApplicationWithCompany extends JobApplication {
  company?: Company;
}

export interface InterviewWithRelations extends Interview {
  application?: JobApplicationWithCompany;
  interview_interviewers?: Array<{
    id: string;
    role?: InterviewerRole;
    contact?: Contact;
  }>;
  questions?: InterviewQuestion[];
}

export interface ContactWithInteractions extends Contact {
  company?: Company;
  interactions?: ContactInteraction[];
}

export interface CompanyWithResearch extends Company {
  research?: CompanyResearch;
}

// ============================================================================
// FORM/INPUT TYPES
// ============================================================================

export interface CreateCompanyInput {
  name: string;
  website?: string;
  linkedin_url?: string;
  industry?: CompanyIndustry;
  size?: CompanySize;
  headquarters_city?: string;
  headquarters_state?: string;
  headquarters_country?: string;
  description?: string;
  founded_year?: number;
}

export interface CreateJobApplicationInput {
  company_id: string;
  title: string;
  location?: string;
  work_mode?: WorkMode;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: CurrencyCode;
  job_url?: string;
  description?: string;
  status?: ApplicationStatus;
  priority?: PriorityLevel;
  applied_date?: string;
  deadline?: string;
  notes?: string;
}

export interface CreateInterviewInput {
  application_id: string;
  title: string;
  type?: InterviewType;
  status?: InterviewStatus;
  scheduled_for?: string;
  duration_minutes?: number;
  location?: string;
  meeting_link?: string;
  prep_notes?: string;
}

export interface CreateContactInput {
  company_id: string;
  application_id?: string;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  relationship?: ContactRelationship;
  notes?: string;
}

export interface CreateInterviewQuestionInput {
  interview_id: string;
  question: string;
  answer?: string;
}

export interface CreateContactInteractionInput {
  contact_id: string;
  date: string;
  type?: InteractionType;
  summary: string;
  notes?: string;
}

// ============================================================================
// LEGACY TYPES (for backward compatibility with existing mock data)
// ============================================================================

/** @deprecated Use JobApplication instead */
export interface LegacyJobApplication {
  id: string;
  title: string;
  company: string;
  location: string;
  workMode: WorkMode;
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  jobUrl?: string;
  companyWebsite?: string;
  description?: string;
  status: ApplicationStatus;
  priority: PriorityLevel;
  appliedDate?: string;
  deadline?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/** @deprecated Use Interview instead */
export interface LegacyInterview {
  id: string;
  applicationId: string;
  title: string;
  type?: InterviewType;
  status: InterviewStatus;
  scheduledFor?: string;
  duration?: number;
  location?: string;
  meetingLink?: string;
  interviewers?: string[];
  prepNotes?: string;
  feedback?: string;
  outcome?: InterviewOutcome;
  createdAt: string;
  updatedAt?: string;
}

/** @deprecated Use Contact instead */
export interface LegacyContact {
  id: string;
  applicationId?: string;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  relationship?: ContactRelationship;
  lastContactDate?: string;
  notes?: string;
  interactions?: Array<{
    id: string;
    date: string;
    type?: InteractionType;
    summary: string;
    notes?: string;
  }>;
  createdAt: string;
}
