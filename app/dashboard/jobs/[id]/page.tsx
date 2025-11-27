'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useJobApplication, updateJobApplication } from '@/lib/hooks/useJobApplications';
import { useInterviews, createInterview, updateInterview, deleteInterview } from '@/lib/hooks/useInterviews';
import { useContacts, createContact, updateContact, deleteContact } from '@/lib/hooks/useContacts';
import { ApplicationStatus, InterviewType, InterviewStatus, ContactRelationship, ContactWithInteractions } from '@/lib/types/jobs';
import { EditJobModal } from '@/app/components/jobs/EditJobModal';
import { WizaAutomatedFlow } from '@/app/components/jobs/WizaAutomatedFlow';
import { WizaRequestHistory } from '@/app/components/jobs/WizaRequestHistory';
import { CompanyResearch } from '@/app/components/jobs/CompanyResearch';
import PremiumFeatureGateModal from '@/app/components/resume/PremiumFeatureGateModal';
import DeleteConfirmationModal from '@/app/components/resume/DeleteConfirmationModal';
import DocumentsTab from '@/app/components/jobs/DocumentsTab';
import { getUserPlanClient } from '@/lib/utils/resume-tracking';

const statusConfig: Record<ApplicationStatus, { label: string; color: string; bgColor: string }> = {
  wishlist: { label: 'Wishlist', color: 'text-gray-700', bgColor: 'bg-gray-50' },
  applied: { label: 'Applied', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  screening: { label: 'Screening', color: 'text-cyan-700', bgColor: 'bg-cyan-50' },
  interviewing: { label: 'Interviewing', color: 'text-purple-700', bgColor: 'bg-purple-50' },
  offer: { label: 'Offer', color: 'text-green-700', bgColor: 'bg-green-50' },
  rejected: { label: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-50' },
  accepted: { label: 'Accepted', color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  withdrawn: { label: 'Withdrawn', color: 'text-gray-700', bgColor: 'bg-gray-50' },
};

const formatInterviewType = (type?: InterviewType): string => {
  if (!type) return '';
  const typeMap: Record<InterviewType, string> = {
    'recruiter_screen': 'Recruiter Screen',
    'hiring_manager_screen': 'Hiring Manager Screen',
    'product_sense': 'Product Sense',
    'product_analytics_execution': 'Product Analytics / Execution',
    'system_design': 'System Design',
    'technical': 'Technical',
    'product_strategy': 'Product Strategy',
    'estimation': 'Estimation',
    'executive': 'Executive',
    'cross_functional': 'Cross Functional',
  };
  return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const jobId = params.id as string;

  const { application, loading, error, refetch } = useJobApplication(jobId);
  const { interviews, refetch: refetchInterviews } = useInterviews(jobId);
  const { contacts, refetch: refetchContacts } = useContacts(undefined, jobId);

  // Status history state
  const [statusHistory, setStatusHistory] = useState<Array<{
    id: string;
    old_status: ApplicationStatus | null;
    new_status: ApplicationStatus;
    changed_at: string;
  }>>([]);

  // Initialize activeTab from query params, default to 'overview'
  const tabFromQuery = searchParams.get('tab') as 'overview' | 'interviews' | 'contacts' | 'documents' | 'research' | null;
  const [activeTab, setActiveTab] = useState<'overview' | 'interviews' | 'contacts' | 'documents' | 'research'>(
    (tabFromQuery && ['overview', 'interviews', 'contacts', 'documents', 'research'].includes(tabFromQuery)) 
      ? tabFromQuery 
      : 'overview'
  );
  const [userPlan, setUserPlan] = useState<'learn' | 'accelerate' | null>(null);
  const [showPremiumGate, setShowPremiumGate] = useState(false);

  // Load user plan on mount
  useEffect(() => {
    getUserPlanClient().then(setUserPlan);
  }, []);

  // Check access when research tab is activated
  useEffect(() => {
    if (activeTab === 'research') {
      const checkAccess = async () => {
        const plan = userPlan || await getUserPlanClient();
        setUserPlan(plan);
        if (plan !== 'accelerate') {
          setShowPremiumGate(true);
        }
      };
      checkAccess();
    }
  }, [activeTab, userPlan]);

  // Update activeTab when query param changes (e.g., browser back/forward)
  useEffect(() => {
    const tabFromQuery = searchParams.get('tab') as 'overview' | 'interviews' | 'contacts' | 'documents' | 'research' | null;
    if (tabFromQuery && ['overview', 'interviews', 'contacts', 'documents', 'research'].includes(tabFromQuery)) {
      setActiveTab(tabFromQuery);
    } else if (!tabFromQuery) {
      setActiveTab('overview');
    }
  }, [searchParams]);

  // Function to update tab and query param
  const handleTabChange = (tab: 'overview' | 'interviews' | 'contacts' | 'documents' | 'research') => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };
  const [showAddInterview, setShowAddInterview] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showWizaAutomated, setShowWizaAutomated] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isWizaButtonDisabled, setIsWizaButtonDisabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [wizaHistoryRefreshTrigger, setWizaHistoryRefreshTrigger] = useState(0);
  const [wizaRequests, setWizaRequests] = useState<any[]>([]);
  const [isLoadingWizaRequests, setIsLoadingWizaRequests] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [editingContact, setEditingContact] = useState<{ id: string; name: string } | null>(null);
  const [deletingContact, setDeletingContact] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingContact, setIsDeletingContact] = useState(false);

  // Interview form state
  const [interviewForm, setInterviewForm] = useState({
    title: '',
    type: 'recruiter_screen' as InterviewType,
    status: 'scheduled' as InterviewStatus,
    scheduled_for: '',
    duration_minutes: '',
    meeting_link: '',
    location: '',
    prep_notes: '',
  });

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    title: '',
    email: '',
    linkedin_url: '',
    phone: '',
    relationship: 'team_member' as ContactRelationship,
    notes: '',
  });

  // Fetch Wiza requests to check if user has already imported or has one in progress
  useEffect(() => {
    const fetchWizaRequests = async () => {
      if (!application?.id) return;
      
      setIsLoadingWizaRequests(true);
      try {
        const response = await fetch(
          `/api/jobs/wiza/requests?application_id=${encodeURIComponent(application.id)}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setWizaRequests(data.requests || []);
        }
      } catch (err) {
        console.error('Error fetching Wiza requests:', err);
      } finally {
        setIsLoadingWizaRequests(false);
      }
    };

    fetchWizaRequests();
  }, [application?.id, wizaHistoryRefreshTrigger]);

  // Initialize notes value when application loads
  useEffect(() => {
    if (application && !isEditingNotes) {
      setNotesValue(application.notes || '');
    }
  }, [application?.notes, isEditingNotes]);

  // Fetch status history for the application
  useEffect(() => {
    const fetchStatusHistory = async () => {
      if (!jobId) return;
      
      try {
        const response = await fetch(`/api/jobs/applications/${jobId}/status-history`);
        if (response.ok) {
          const data = await response.json();
          setStatusHistory(data.history || []);
        }
      } catch (err) {
        console.error('Error fetching status history:', err);
      }
    };

    fetchStatusHistory();
  }, [jobId, application?.status]); // Refetch when status changes

  // Check if user has completed or has a request in progress
  const hasCompletedOrInProgressRequest = wizaRequests.some(
    (request) => request.status === 'completed' || request.status === 'processing'
  );

  if (loading) {
    return (
      <div className="min-h-screen p-8 md:p-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold">Loading application...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen p-8 md:p-12 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Application Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'This application does not exist or you do not have permission to view it.'}</p>
          <Link href="/dashboard/jobs" className="px-8 py-3 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_6px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200 inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  const handleFormatSalary = (): string => {
    if (!application.salary_min || !application.salary_max) return 'Not specified';
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: application.salary_currency || 'USD',
      minimumFractionDigits: 0,
    });
    return `${formatter.format(application.salary_min)} - ${formatter.format(application.salary_max)}`;
  };

  const handleFormatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleFormatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
    });
  };

  const handleAddInterview = async () => {
    if (!interviewForm.title.trim()) {
      setSubmitError('Please enter an interview title');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await createInterview({
        application_id: jobId,
        title: interviewForm.title,
        type: interviewForm.type,
        status: interviewForm.status,
        scheduled_for: interviewForm.scheduled_for || undefined,
        duration_minutes: interviewForm.duration_minutes ? parseInt(interviewForm.duration_minutes) : undefined,
        meeting_link: interviewForm.meeting_link || undefined,
        location: interviewForm.location || undefined,
        prep_notes: interviewForm.prep_notes || undefined,
      });

      await refetchInterviews();
      setShowAddInterview(false);
      handleTabChange('interviews');
      
      // Reset form
      setInterviewForm({
        title: '',
        type: 'recruiter_screen',
        status: 'scheduled',
        scheduled_for: '',
        duration_minutes: '',
        meeting_link: '',
        location: '',
        prep_notes: '',
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to add interview');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddContact = async () => {
    if (!contactForm.name.trim()) {
      setSubmitError('Please enter a contact name');
      return;
    }

    if (!contactForm.title.trim()) {
      setSubmitError('Please enter a contact title');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await createContact({
        company_id: application.company_id,
        application_id: jobId,
        name: contactForm.name,
        title: contactForm.title,
        email: contactForm.email || undefined,
        linkedin_url: contactForm.linkedin_url || undefined,
        phone: contactForm.phone || undefined,
        relationship: contactForm.relationship,
        notes: contactForm.notes || undefined,
      });

      await refetchContacts();
      setShowAddContact(false);
      handleTabChange('contacts');
      
      // Reset form
      setContactForm({
        name: '',
        title: '',
        email: '',
        linkedin_url: '',
        phone: '',
        relationship: 'team_member',
        notes: '',
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to add contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditContact = (contact: ContactWithInteractions) => {
    setEditingContact({ id: contact.id, name: contact.name });
    setContactForm({
      name: contact.name,
      title: contact.title || '',
      email: contact.email || '',
      linkedin_url: contact.linkedin_url || '',
      phone: contact.phone || '',
      relationship: contact.relationship || 'team_member',
      notes: contact.notes || '',
    });
    setShowAddContact(true);
  };

  const handleUpdateContact = async () => {
    if (!editingContact) return;

    if (!contactForm.name.trim()) {
      setSubmitError('Please enter a contact name');
      return;
    }

    if (!contactForm.title.trim()) {
      setSubmitError('Please enter a contact title');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await updateContact(editingContact.id, {
        name: contactForm.name,
        title: contactForm.title,
        email: contactForm.email || undefined,
        linkedin_url: contactForm.linkedin_url || undefined,
        phone: contactForm.phone || undefined,
        relationship: contactForm.relationship,
        notes: contactForm.notes || undefined,
      });

      await refetchContacts();
      setShowAddContact(false);
      setEditingContact(null);
      
      // Reset form
      setContactForm({
        name: '',
        title: '',
        email: '',
        linkedin_url: '',
        phone: '',
        relationship: 'team_member',
        notes: '',
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to update contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContact = async () => {
    if (!deletingContact) return;

    setIsDeletingContact(true);
    try {
      await deleteContact(deletingContact.id);
      await refetchContacts();
      setDeletingContact(null);
    } catch (err) {
      console.error('Failed to delete contact:', err);
      alert('Failed to delete contact. Please try again.');
    } finally {
      setIsDeletingContact(false);
    }
  };

  const handleStartEditingNotes = () => {
    setNotesValue(application?.notes || '');
    setIsEditingNotes(true);
  };

  const handleCancelEditingNotes = () => {
    setNotesValue(application?.notes || '');
    setIsEditingNotes(false);
  };

  const handleSaveNotes = async () => {
    if (!application) return;

    setIsSavingNotes(true);
    try {
      await updateJobApplication(application.id, {
        notes: notesValue || undefined,
      });
      await refetch();
      setIsEditingNotes(false);
    } catch (err) {
      console.error('Failed to save notes:', err);
      // Show error to user
      alert('Failed to save notes. Please try again.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'interviews', label: 'Interviews', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', count: interviews.length },
    { id: 'contacts', label: 'Contacts', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', count: contacts.length },
    { id: 'documents', label: 'Documents', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z M12 3v6a2 2 0 002 2h6' },
    { id: 'research', label: 'Research', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  ];

  return (
    <div className="min-h-screen p-8 md:p-12">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/dashboard/jobs"
          className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-purple-600 font-bold mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Jobs
        </Link>

        <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_20px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-3">
                <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent">
                  {application.title}
                </h1>
              </div>
              <div className="flex items-center gap-4 text-gray-700 font-semibold text-lg flex-wrap">
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {application.company?.name || 'Unknown Company'}
                </span>
                {application.location && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {application.location}
                    </span>
                  </>
                )}
                <span className="text-gray-400">•</span>
                <span className={`px-4 py-2 rounded-[1rem] text-sm font-black border-2 ${statusConfig[application.status].bgColor} ${statusConfig[application.status].color} ${application.status === 'wishlist' || application.status === 'withdrawn' ? 'border-gray-400' : application.status === 'applied' ? 'border-blue-400' : application.status === 'interviewing' ? 'border-purple-400' : application.status === 'offer' || application.status === 'accepted' ? 'border-green-400' : 'border-red-400'}`}>
                  {statusConfig[application.status].label}
                </span>
                {application.work_mode && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="capitalize">{application.work_mode}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowEditModal(true)}
                className="px-6 py-3 rounded-[1.5rem] bg-white border-2 border-purple-300 text-gray-700 font-black hover:bg-white/80 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit
              </button>
              {application.job_url && (
                <a
                  href={application.job_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-blue-500 to-cyan-500 shadow-[0_6px_0_0_rgba(37,99,235,0.6)] border-2 border-blue-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(37,99,235,0.6)] font-black text-white transition-all duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View Posting
                </a>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-8 flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`px-6 py-3.5 font-black text-sm transition-all rounded-[1.5rem] flex items-center gap-2 border-2 ${
                  activeTab === tab.id
                    ? 'bg-white shadow-[0_4px_0_0_rgba(147,51,234,0.4)] border-purple-400 text-purple-700'
                    : 'bg-white/60 border-purple-200 text-gray-700 hover:bg-white/80'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`ml-1 px-2.5 py-1 rounded-[0.75rem] text-xs font-black border-2 ${
                    activeTab === tab.id ? 'bg-purple-100 text-purple-700 border-purple-400' : 'bg-gray-100 text-gray-700 border-gray-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-3 gap-6">
            {/* Main Column */}
            <div className="col-span-2 space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-6 rounded-[2rem] bg-gradient-to-br from-green-200 to-emerald-200 shadow-[0_8px_0_0_rgba(22,163,74,0.3)] border-2 border-green-300 text-center">
                  <p className="text-sm font-bold text-gray-700 mb-1">Salary Range</p>
                  <p className="text-lg font-black text-green-600">{handleFormatSalary()}</p>
                </div>
                <div className="p-6 rounded-[2rem] bg-gradient-to-br from-blue-200 to-cyan-200 shadow-[0_8px_0_0_rgba(37,99,235,0.3)] border-2 border-blue-300 text-center">
                  <p className="text-sm font-bold text-gray-700 mb-1">Applied Date</p>
                  <p className="text-lg font-black text-blue-600">
                    {application.applied_date ? handleFormatDate(application.applied_date) : 'Not yet'}
                  </p>
                </div>
                <div className="p-6 rounded-[2rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_8px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300 text-center">
                  <p className="text-sm font-bold text-gray-700 mb-1">Interviews</p>
                  <p className="text-3xl font-black text-purple-600">{interviews.length}</p>
                </div>
              </div>

              {/* Job Description */}
              <div className="p-8 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300">
                <h3 className="text-2xl font-black text-gray-900 mb-4">Job Description</h3>
                {application.description ? (
                  <p className="text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">{application.description}</p>
                ) : (
                  <p className="text-gray-500 font-semibold italic">No description available</p>
                )}
              </div>

              {/* Notes */}
              <div className="p-8 rounded-[2rem] bg-gradient-to-br from-yellow-200 to-orange-200 shadow-[0_8px_0_0_rgba(234,88,12,0.3)] border-2 border-orange-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-black text-gray-900">My Notes 📝</h3>
                  {!isEditingNotes && (
                    <button
                      onClick={handleStartEditingNotes}
                      className="px-4 py-2 rounded-[1rem] bg-white border-2 border-orange-400 text-gray-700 font-black hover:bg-orange-50 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Edit
                    </button>
                  )}
                </div>
                {isEditingNotes ? (
                  <div className="space-y-4">
                    <textarea
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      placeholder="Add your notes here..."
                      rows={8}
                      dir="ltr"
                      className="w-full px-4 py-3 border-2 border-orange-400 rounded-[1rem] focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-semibold text-gray-800 resize-none outline-none"
                      style={{ direction: 'ltr' }}
                    />
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleSaveNotes}
                        disabled={isSavingNotes}
                        className="px-6 py-3 rounded-[1rem] bg-gradient-to-br from-green-500 to-emerald-500 shadow-[0_4px_0_0_rgba(22,163,74,0.6)] border-2 border-green-600 hover:translate-y-1 hover:shadow-[0_2px_0_0_rgba(22,163,74,0.6)] font-black text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 flex items-center gap-2"
                      >
                        {isSavingNotes ? (
                          <>
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Save
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleCancelEditingNotes}
                        disabled={isSavingNotes}
                        className="px-6 py-3 rounded-[1rem] bg-white border-2 border-gray-300 text-gray-700 font-black hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={handleStartEditingNotes}
                    className="text-gray-800 font-semibold leading-relaxed whitespace-pre-wrap min-h-[100px] cursor-text hover:bg-orange-50/50 rounded px-2 py-2 transition-colors"
                    dir="ltr"
                    style={{ direction: 'ltr' }}
                  >
                    {application.notes || (
                      <span className="text-gray-500 italic">Click to add notes...</span>
                    )}
                  </div>
                )}
              </div>

              {/* Activity Timeline */}
              <div className="p-8 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300">
                <h3 className="text-2xl font-black text-gray-900 mb-6">Activity Timeline ⏱️</h3>
                <div className="space-y-5">
                  {/* Combine status history and interviews, sorted by date (newest first) */}
                  {(() => {
                    const statusLabels: Record<ApplicationStatus, { label: string; icon: string; color: string; bgColor: string }> = {
                      wishlist: { label: 'Added to Wishlist', icon: '⭐', color: 'bg-gray-400', bgColor: 'bg-gray-50' },
                      applied: { label: 'Application Submitted', icon: '📤', color: 'bg-blue-500', bgColor: 'bg-blue-50' },
                      screening: { label: 'Moved to Screening', icon: '🔍', color: 'bg-cyan-500', bgColor: 'bg-cyan-50' },
                      interviewing: { label: 'Started Interviewing', icon: '🎯', color: 'bg-purple-500', bgColor: 'bg-purple-50' },
                      offer: { label: 'Received Offer! 🎉', icon: '🎉', color: 'bg-green-500', bgColor: 'bg-green-50' },
                      rejected: { label: 'Application Rejected', icon: '❌', color: 'bg-red-500', bgColor: 'bg-red-50' },
                      accepted: { label: 'Accepted Offer! 🎊', icon: '🎊', color: 'bg-emerald-500', bgColor: 'bg-emerald-50' },
                      withdrawn: { label: 'Application Withdrawn', icon: '↩️', color: 'bg-gray-500', bgColor: 'bg-gray-50' },
                    };

                    // Create timeline items from status history
                    const timelineItems: Array<{
                      id: string;
                      type: 'status' | 'interview';
                      date: string;
                      title: string;
                      subtitle?: string;
                      color: string;
                      icon?: string;
                      isFirst?: boolean;
                    }> = statusHistory.map((item, index) => ({
                      id: item.id,
                      type: 'status' as const,
                      date: item.changed_at,
                      title: item.old_status === null 
                        ? 'Application Created' 
                        : statusLabels[item.new_status]?.label || `Status: ${item.new_status}`,
                      subtitle: item.old_status !== null 
                        ? `From ${statusConfig[item.old_status]?.label || item.old_status}` 
                        : undefined,
                      color: item.old_status === null 
                        ? 'bg-gray-400' 
                        : statusLabels[item.new_status]?.color || 'bg-gray-400',
                      icon: item.old_status === null 
                        ? '📝' 
                        : statusLabels[item.new_status]?.icon,
                      isFirst: index === statusHistory.length - 1,
                    }));

                    // Add interviews to timeline
                    interviews.forEach((interview) => {
                      if (interview.scheduled_for) {
                        timelineItems.push({
                          id: interview.id,
                          type: 'interview',
                          date: interview.scheduled_for,
                          title: interview.title,
                          subtitle: interview.status === 'completed' ? 'Completed' : interview.status === 'scheduled' ? 'Scheduled' : 'Cancelled',
                          color: interview.status === 'completed' ? 'bg-green-500' : interview.status === 'scheduled' ? 'bg-purple-500' : 'bg-gray-400',
                          icon: '📅',
                        });
                      }
                    });

                    // Sort by date (newest first)
                    timelineItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                    return timelineItems.length > 0 ? (
                      timelineItems.map((item) => (
                        <div key={item.id} className="flex gap-4">
                          <div className={`flex-shrink-0 w-3 h-3 rounded-full ${item.color} shadow-[0_2px_0_0_rgba(0,0,0,0.2)] mt-1.5`}></div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {item.icon && <span className="text-sm">{item.icon}</span>}
                              <span className="font-bold text-gray-900">{item.title}</span>
                            </div>
                            {item.subtitle && (
                              <div className="text-xs text-gray-500 font-semibold">{item.subtitle}</div>
                            )}
                            <div className="text-sm text-gray-700 font-semibold">
                              {item.type === 'interview' 
                                ? handleFormatDateTime(item.date) 
                                : handleFormatDate(item.date)}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      // Fallback if no status history yet
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-3 h-3 rounded-full bg-gray-400 shadow-[0_2px_0_0_rgba(0,0,0,0.2)] mt-1.5"></div>
                        <div>
                          <div className="font-bold text-gray-900">📝 Application Created</div>
                          <div className="text-sm text-gray-700 font-semibold">{handleFormatDate(application.created_at)}</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="p-6 rounded-[2rem] bg-gradient-to-br from-blue-200 to-cyan-200 shadow-[0_8px_0_0_rgba(37,99,235,0.3)] border-2 border-blue-300">
                <h3 className="text-xl font-black text-gray-900 mb-4">Quick Actions ⚡</h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => handleTabChange('interviews')}
                    className="w-full px-5 py-3.5 rounded-[1.5rem] bg-white shadow-[0_4px_0_0_rgba(0,0,0,0.1)] border-2 border-blue-300 text-gray-700 font-black hover:translate-y-1 hover:shadow-[0_2px_0_0_rgba(0,0,0,0.1)] transition-all text-left flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Add Interview
                  </button>
                  <button 
                    onClick={() => handleTabChange('contacts')}
                    className="w-full px-5 py-3.5 rounded-[1.5rem] bg-white shadow-[0_4px_0_0_rgba(0,0,0,0.1)] border-2 border-blue-300 text-gray-700 font-black hover:translate-y-1 hover:shadow-[0_2px_0_0_rgba(0,0,0,0.1)] transition-all text-left flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Add Contact
                  </button>
                </div>
              </div>

              {/* Contacts Summary */}
              {contacts.length > 0 && (
                <div className="p-6 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300">
                  <h3 className="text-xl font-black text-gray-900 mb-4">Key Contacts 👥</h3>
                  <div className="space-y-4">
                    {contacts.slice(0, 3).map((contact) => (
                      <div key={contact.id} className="flex items-center gap-3 p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-[1rem] border-2 border-purple-200">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-[0_4px_0_0_rgba(147,51,234,0.4)] flex items-center justify-center text-white font-black text-lg">
                          {contact.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-900 truncate">{contact.name}</div>
                          <div className="text-sm text-gray-700 font-semibold truncate">{contact.title}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => handleTabChange('contacts')}
                    className="w-full mt-4 px-4 py-2.5 rounded-[1rem] bg-purple-100 border-2 border-purple-300 text-purple-700 font-black hover:bg-purple-200 transition-colors"
                  >
                    View All Contacts →
                  </button>
                </div>
              )}

              {/* Upcoming Interviews */}
              {interviews.filter(int => int.status === 'scheduled').length > 0 && (
                <div className="p-6 rounded-[2rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_8px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300">
                  <h3 className="text-xl font-black text-gray-900 mb-4">Upcoming Interviews 📅</h3>
                  <div className="space-y-3">
                    {interviews
                      .filter(int => int.status === 'scheduled')
                      .map((interview) => (
                        <div key={interview.id} className="p-4 bg-white rounded-[1.5rem] shadow-[0_4px_0_0_rgba(0,0,0,0.1)] border-2 border-purple-300">
                          <div className="font-black text-gray-900">{interview.title}</div>
                          <div className="text-sm text-gray-700 font-semibold mt-1">
                            {interview.scheduled_for ? handleFormatDateTime(interview.scheduled_for) : 'TBD'}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Interviews Tab */}
        {activeTab === 'interviews' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent">Interviews 📅</h2>
                <p className="text-gray-700 font-semibold mt-2">Track your interview rounds and preparation</p>
              </div>
              <button
                onClick={() => setShowAddInterview(true)}
                className="px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-green-500 to-emerald-500 shadow-[0_6px_0_0_rgba(22,163,74,0.6)] border-2 border-green-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(22,163,74,0.6)] font-black text-white transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Interview
              </button>
            </div>

            <div className="space-y-4">
              {interviews.length === 0 ? (
                <div className="p-16 rounded-[2.5rem] bg-gradient-to-br from-gray-100 to-gray-200 shadow-[0_12px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300 text-center">
                  <svg className="w-20 h-20 mx-auto text-gray-500 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-2xl font-black text-gray-900 mb-3">No interviews yet</h3>
                  <p className="text-gray-700 font-semibold mb-6">Add your first interview to start tracking your progress</p>
                  <button
                    onClick={() => setShowAddInterview(true)}
                    className="px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-green-500 to-emerald-500 shadow-[0_6px_0_0_rgba(22,163,74,0.6)] border-2 border-green-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(22,163,74,0.6)] font-black text-white transition-all duration-200 inline-flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Interview
                  </button>
                </div>
              ) : (
                interviews.map((interview) => (
                  <Link
                    key={interview.id}
                    href={`/dashboard/jobs/${jobId}/interviews/${interview.id}`}
                    className="block p-6 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300 hover:border-purple-400 hover:shadow-[0_10px_0_0_rgba(147,51,234,0.3)] transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-black text-gray-900">{interview.title}</h3>
                          <span className={`px-4 py-1.5 rounded-[1rem] text-xs font-black border-2 ${
                            interview.status === 'scheduled' 
                              ? 'bg-purple-100 text-purple-700 border-purple-400'
                              : interview.status === 'completed'
                              ? 'bg-green-100 text-green-700 border-green-400'
                              : 'bg-gray-100 text-gray-700 border-gray-400'
                          }`}>
                            {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                          </span>
                          {interview.type && (
                            <span className="px-4 py-1.5 rounded-[1rem] text-xs font-black bg-blue-100 text-blue-700 border-2 border-blue-400">
                              {formatInterviewType(interview.type)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-700 font-semibold mb-4">
                          {interview.scheduled_for && (
                            <span className="flex items-center gap-1.5">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {handleFormatDateTime(interview.scheduled_for)}
                            </span>
                          )}
                          {interview.duration_minutes && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span>{interview.duration_minutes} minutes</span>
                            </>
                          )}
                          {interview.location && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="flex items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                {interview.location}
                              </span>
                            </>
                          )}
                        </div>

                        {interview.prep_notes && (
                          <div className="mb-4 p-4 rounded-[1.5rem] bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-orange-200">
                            <div className="text-sm font-black text-gray-900 mb-2">Prep Notes:</div>
                            <p className="text-gray-700 font-semibold text-sm whitespace-pre-wrap line-clamp-2">{interview.prep_notes}</p>
                          </div>
                        )}

                        {interview.meeting_link && (
                          <div className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-bold">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Join Meeting
                          </div>
                        )}

                        <div className="mt-4 text-purple-600 font-bold text-sm flex items-center gap-2">
                          View Details
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}

        {/* Contacts Tab */}
        {activeTab === 'contacts' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent">Contacts & Networking 👥</h2>
                <p className="text-gray-700 font-semibold mt-2">Manage your professional connections for this opportunity</p>
              </div>
              <div className="flex items-center gap-3">
                {!hasCompletedOrInProgressRequest && !showWizaAutomated && (
                  <button
                    onClick={async () => {
                      if (isWizaButtonDisabled) return;
                      
                      // Check if user has Accelerate plan
                      const plan = userPlan || await getUserPlanClient();
                      setUserPlan(plan);
                      
                      if (plan !== 'accelerate') {
                        setShowPremiumGate(true);
                        return;
                      }
                      
                      setIsWizaButtonDisabled(true);
                      setShowWizaAutomated(true);
                      // Re-enable after a short delay to prevent rapid clicks
                      setTimeout(() => setIsWizaButtonDisabled(false), 2000);
                    }}
                    disabled={isWizaButtonDisabled || isLoadingWizaRequests}
                    className="px-6 py-4 rounded-[1.5rem] bg-gradient-to-br from-blue-500 to-purple-500 shadow-[0_6px_0_0_rgba(59,130,246,0.6)] border-2 border-blue-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(59,130,246,0.6)] font-black text-white transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Find Contacts Automatically
                  </button>
                )}
                <button
                  onClick={() => setShowAddContact(true)}
                  className="px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-green-500 to-emerald-500 shadow-[0_6px_0_0_rgba(22,163,74,0.6)] border-2 border-green-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(22,163,74,0.6)] font-black text-white transition-all duration-200 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Contact
                </button>
              </div>
            </div>

            {/* Show automated flow if active */}
            {showWizaAutomated && application && (
              <div className="mb-8" key={`wiza-automated-${application.id}`}>
                <WizaAutomatedFlow
                  companyName={application.company?.name || 'Unknown Company'}
                  companyId={application.company_id}
                  companyLinkedinUrl={typeof application.company?.linkedin_url === 'string' 
                    ? application.company.linkedin_url 
                    : undefined}
                  applicationId={application.id}
                  onImportComplete={() => {
                    refetchContacts();
                    // Trigger history refresh after a short delay to ensure DB is updated
                    // This will also trigger the useEffect to refresh Wiza requests
                    setTimeout(() => {
                      setWizaHistoryRefreshTrigger(prev => prev + 1);
                    }, 1000);
                  }}
                  onComplete={() => {
                    // Hide the automated flow after completion animation
                    setShowWizaAutomated(false);
                    setIsWizaButtonDisabled(false);
                  }}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contacts.length === 0 ? (
                <div className="md:col-span-2 p-16 rounded-[2.5rem] bg-gradient-to-br from-gray-100 to-gray-200 shadow-[0_12px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300 text-center">
                  <svg className="w-20 h-20 mx-auto text-gray-500 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="text-2xl font-black text-gray-900 mb-3">No contacts yet</h3>
                  <p className="text-gray-700 font-semibold mb-6">Start building your network for this opportunity</p>
                  <button
                    onClick={() => setShowAddContact(true)}
                    className="px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-green-500 to-emerald-500 shadow-[0_6px_0_0_rgba(22,163,74,0.6)] border-2 border-green-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(22,163,74,0.6)] font-black text-white transition-all duration-200 inline-flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Contact
                  </button>
                </div>
              ) : (
                contacts.map((contact) => (
                  <div key={contact.id} className="p-5 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300 hover:border-purple-400 hover:shadow-[0_10px_0_0_rgba(147,51,234,0.3)] transition-all">
                    {/* Header with Avatar, Name, Title, and Relationship Tag */}
                    <div className="flex items-start gap-4 mb-3">
                      {/* Avatar */}
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-[0_4px_0_0_rgba(147,51,234,0.4)] flex items-center justify-center text-white font-black text-xl flex-shrink-0">
                        {contact.name.split(' ').map(n => n[0]).join('')}
                      </div>

                      {/* Name, Title, and Relationship */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-black text-gray-900 truncate">{contact.name}</h3>
                            {contact.title && (
                              <p className="text-gray-700 font-semibold text-sm mt-1 truncate">{contact.title}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {contact.relationship && (
                              <span className="px-3 py-1.5 bg-blue-100 text-blue-700 border-2 border-blue-400 rounded-[0.75rem] text-xs font-black capitalize whitespace-nowrap">
                                {contact.relationship.replace('_', ' ')}
                              </span>
                            )}
                            {/* Edit and Delete Buttons */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleEditContact(contact)}
                                className="p-2 rounded-[0.75rem] bg-purple-50 border-2 border-purple-200 text-purple-700 hover:bg-purple-100 transition-colors"
                                aria-label="Edit contact"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setDeletingContact({ id: contact.id, name: contact.name })}
                                className="p-2 rounded-[0.75rem] bg-red-50 border-2 border-red-200 text-red-700 hover:bg-red-100 transition-colors"
                                aria-label="Delete contact"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div className="flex items-center gap-4 flex-wrap text-sm font-semibold">
                          {contact.email && (
                            <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-gray-700 hover:text-blue-600 transition-colors">
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span className="truncate">Email</span>
                            </a>
                          )}
                          {contact.linkedin_url && (
                            <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-gray-600 hover:text-blue-600 transition-colors">
                              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                              </svg>
                              <span className="truncate">LinkedIn</span>
                            </a>
                          )}
                          {contact.phone && (
                            <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 text-gray-600 hover:text-blue-600 transition-colors">
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <span className="truncate">Phone</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Last Contact */}
                    {contact.last_contact_date && (
                      <div className="text-sm text-gray-600 mb-2 pt-2 border-t border-gray-200">
                        Last contact: {handleFormatDate(contact.last_contact_date)}
                      </div>
                    )}

                    {/* Interactions */}
                    {contact.interactions && contact.interactions.length > 0 && (
                      <div className="pt-2 border-t border-gray-200">
                        <div className="text-sm font-bold text-gray-700 mb-2">Recent Interactions ({contact.interactions.length})</div>
                        <div className="space-y-2">
                          {contact.interactions.slice(0, 2).map((interaction) => (
                            <div key={interaction.id} className="flex items-start gap-3 text-sm p-3 bg-gray-50 rounded-[1rem]">
                              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                {interaction.type === 'email' && (
                                  <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                )}
                                {interaction.type === 'linkedin' && (
                                  <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                                  </svg>
                                )}
                                {interaction.type === 'phone' && (
                                  <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-gray-900 font-bold">{interaction.summary}</div>
                                <div className="text-xs text-gray-500">{handleFormatDate(interaction.date)}</div>
                                {interaction.notes && (
                                  <div className="text-gray-600 mt-1">{interaction.notes}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Always show Wiza Request History if application exists - moved below contacts */}
            {application && (
              <div className="mt-8">
                <WizaRequestHistory 
                  applicationId={application.id}
                  refreshTrigger={wizaHistoryRefreshTrigger}
                  onImportComplete={() => {
                    refetchContacts();
                    // Trigger history refresh after a short delay to ensure DB is updated
                    setTimeout(() => {
                      setWizaHistoryRefreshTrigger(prev => prev + 1);
                    }, 1000);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && application && (
          <DocumentsTab
            applicationId={application.id}
            jobTitle={application.title}
            companyName={application.company?.name || 'Unknown Company'}
          />
        )}

        {/* Research Tab */}
        {activeTab === 'research' && application?.company_id && (
          <>
            {userPlan === 'accelerate' ? (
          <CompanyResearch
            companyId={application.company_id}
            companyName={application.company?.name || 'Unknown Company'}
          />
            ) : (
              <div className="bg-white rounded-2xl border-2 border-slate-200 p-12 shadow-sm">
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="max-w-md w-full text-center">
                    <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl border-2 border-purple-200 mx-auto mb-6">
                      <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-4">
                      Accelerate Plan Required
                    </h2>
                    <p className="text-gray-700 font-semibold mb-2 text-lg">
                      Company research is available exclusively for Accelerate plan subscribers.
                    </p>
                    <p className="text-gray-600 mb-8">
                      Upgrade your plan to unlock access to comprehensive company research and accelerate your job search.
                    </p>
                    <button
                      onClick={() => setShowPremiumGate(true)}
                      className="inline-block w-full px-6 py-4 text-base font-bold rounded-xl transition-all bg-gradient-to-br from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl text-center"
                    >
                      View Plans & Pricing
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Interview Modal */}
      {showAddInterview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-[2.5rem] bg-white shadow-[0_20px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300 max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent">Add Interview 📅</h2>
              <button
                onClick={() => {
                  setShowAddInterview(false);
                  setSubmitError(null);
                }}
                className="text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-[1rem]"
                disabled={isSubmitting}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {submitError && (
              <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-[1rem] text-red-700 font-bold">
                {submitError}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Interview Title *</label>
                <input
                  type="text"
                  value={interviewForm.title}
                  onChange={(e) => setInterviewForm({ ...interviewForm, title: e.target.value })}
                  placeholder="e.g., Technical Phone Screen"
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Interview Type *</label>
                  <select 
                    value={interviewForm.type}
                    onChange={(e) => setInterviewForm({ ...interviewForm, type: e.target.value as InterviewType })}
                    className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-bold"
                  >
                    <option value="recruiter_screen">Recruiter Screen</option>
                    <option value="hiring_manager_screen">Hiring Manager Screen</option>
                    <option value="product_sense">Product Sense</option>
                    <option value="product_analytics_execution">Product Analytics / Execution</option>
                    <option value="system_design">System Design</option>
                    <option value="technical">Technical</option>
                    <option value="product_strategy">Product Strategy</option>
                    <option value="estimation">Estimation</option>
                    <option value="executive">Executive</option>
                    <option value="cross_functional">Cross Functional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                  <select 
                    value={interviewForm.status}
                    onChange={(e) => setInterviewForm({ ...interviewForm, status: e.target.value as InterviewStatus })}
                    className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-bold"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={interviewForm.scheduled_for}
                    onChange={(e) => {
                      // Round to nearest 15 minutes
                      if (e.target.value) {
                        const date = new Date(e.target.value);
                        const minutes = date.getMinutes();
                        const roundedMinutes = Math.round(minutes / 15) * 15;
                        date.setMinutes(roundedMinutes);
                        date.setSeconds(0);
                        date.setMilliseconds(0);
                        // Format back to datetime-local format (YYYY-MM-DDTHH:mm)
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const hours = String(date.getHours()).padStart(2, '0');
                        const mins = String(date.getMinutes()).padStart(2, '0');
                        const formatted = `${year}-${month}-${day}T${hours}:${mins}`;
                        setInterviewForm({ ...interviewForm, scheduled_for: formatted });
                      } else {
                        setInterviewForm({ ...interviewForm, scheduled_for: e.target.value });
                      }
                    }}
                    step="900"
                    className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    value={interviewForm.duration_minutes}
                    onChange={(e) => setInterviewForm({ ...interviewForm, duration_minutes: e.target.value })}
                    placeholder="60"
                    className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Meeting Link</label>
                <input
                  type="url"
                  value={interviewForm.meeting_link}
                  onChange={(e) => setInterviewForm({ ...interviewForm, meeting_link: e.target.value })}
                  placeholder="https://meet.google.com/abc-defg-hij"
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Location (if onsite)</label>
                <input
                  type="text"
                  value={interviewForm.location}
                  onChange={(e) => setInterviewForm({ ...interviewForm, location: e.target.value })}
                  placeholder="123 Main St, San Francisco, CA"
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Prep Notes</label>
                <textarea
                  rows={4}
                  value={interviewForm.prep_notes}
                  onChange={(e) => setInterviewForm({ ...interviewForm, prep_notes: e.target.value })}
                  placeholder="Topics to prepare, questions to ask, etc."
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-8">
              <button
                onClick={() => {
                  setShowAddInterview(false);
                  setSubmitError(null);
                }}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3.5 rounded-[1.5rem] border-2 border-gray-300 bg-white text-gray-700 font-black hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddInterview}
                disabled={isSubmitting || !interviewForm.title}
                className="flex-1 px-6 py-3.5 rounded-[1.5rem] bg-gradient-to-br from-green-500 to-emerald-500 shadow-[0_6px_0_0_rgba(22,163,74,0.6)] border-2 border-green-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(22,163,74,0.6)] font-black text-white transition-all duration-200 disabled:opacity-50 disabled:translate-y-0"
              >
                {isSubmitting ? 'Adding...' : 'Add Interview'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-[2.5rem] bg-white shadow-[0_20px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300 max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent">
                {editingContact ? 'Edit Contact 👥' : 'Add Contact 👥'}
              </h2>
              <button
                onClick={() => {
                  setShowAddContact(false);
                  setEditingContact(null);
                  setSubmitError(null);
                  // Reset form
                  setContactForm({
                    name: '',
                    title: '',
                    email: '',
                    linkedin_url: '',
                    phone: '',
                    relationship: 'team_member',
                    notes: '',
                  });
                }}
                className="text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-[1rem]"
                disabled={isSubmitting}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {submitError && (
              <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-[1rem] text-red-700 font-bold">
                {submitError}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="Jane Smith"
                    className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    value={contactForm.title}
                    onChange={(e) => setContactForm({ ...contactForm, title: e.target.value })}
                    placeholder="Senior Product Manager"
                    className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Relationship *</label>
                <select 
                  value={contactForm.relationship}
                  onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value as ContactRelationship })}
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-bold"
                >
                  <option value="recruiter">Recruiter</option>
                  <option value="hiring_manager">Hiring Manager</option>
                  <option value="team_member">Team Member</option>
                  <option value="referral">Referral</option>
                  <option value="peer">Peer</option>
                  <option value="executive">Executive</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="jane.smith@company.com"
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">LinkedIn URL</label>
                <input
                  type="url"
                  value={contactForm.linkedin_url}
                  onChange={(e) => setContactForm({ ...contactForm, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/janesmith"
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Notes</label>
                <textarea
                  rows={4}
                  value={contactForm.notes}
                  onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                  placeholder="How you know them, key points from conversations, etc."
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-8">
              <button
                onClick={() => {
                  setShowAddContact(false);
                  setEditingContact(null);
                  setSubmitError(null);
                  // Reset form
                  setContactForm({
                    name: '',
                    title: '',
                    email: '',
                    linkedin_url: '',
                    phone: '',
                    relationship: 'team_member',
                    notes: '',
                  });
                }}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3.5 rounded-[1.5rem] border-2 border-gray-300 bg-white text-gray-700 font-black hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={editingContact ? handleUpdateContact : handleAddContact}
                disabled={isSubmitting || !contactForm.name || !contactForm.title}
                className="flex-1 px-6 py-3.5 rounded-[1.5rem] bg-gradient-to-br from-green-500 to-emerald-500 shadow-[0_6px_0_0_rgba(22,163,74,0.6)] border-2 border-green-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(22,163,74,0.6)] font-black text-white transition-all duration-200 disabled:opacity-50 disabled:translate-y-0"
              >
                {isSubmitting 
                  ? (editingContact ? 'Updating...' : 'Adding...') 
                  : (editingContact ? 'Update Contact' : 'Add Contact')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Contact Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deletingContact}
        title="Delete Contact?"
        message={`Are you sure you want to delete ${deletingContact?.name}? This action cannot be undone.`}
        onConfirm={handleDeleteContact}
        onClose={() => setDeletingContact(null)}
        isDeleting={isDeletingContact}
      />

      {/* Edit Modal */}
      <EditJobModal
        isOpen={showEditModal}
        application={application}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => {
          refetch();
          setShowEditModal(false);
        }}
      />

      {/* Premium Feature Gate Modal */}
      <PremiumFeatureGateModal
        isOpen={showPremiumGate}
        onClose={() => setShowPremiumGate(false)}
        featureName={activeTab === 'research' ? 'Company Research' : 'Find Contacts Automatically'}
        featureDescription={
          activeTab === 'research' 
            ? 'Company research is available exclusively for Accelerate plan subscribers.'
            : 'Find Contacts Automatically is available exclusively for Accelerate plan subscribers.'
        }
        currentPlan={userPlan}
        requiresAccelerate={true}
      />
    </div>
  );
}
