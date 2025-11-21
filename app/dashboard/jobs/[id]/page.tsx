'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useJobApplication } from '@/lib/hooks/useJobApplications';
import { useInterviews, createInterview, updateInterview, deleteInterview } from '@/lib/hooks/useInterviews';
import { useContacts, createContact, updateContact, deleteContact } from '@/lib/hooks/useContacts';
import { ApplicationStatus, InterviewType, InterviewStatus, ContactRelationship } from '@/lib/types/jobs';
import { EditJobModal } from '@/app/components/jobs/EditJobModal';
import { WizaIntegration } from '@/app/components/jobs/WizaIntegration';

const statusConfig: Record<ApplicationStatus, { label: string; color: string; bgColor: string }> = {
  wishlist: { label: 'Wishlist', color: 'text-gray-700', bgColor: 'bg-gray-50' },
  applied: { label: 'Applied', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  screening: { label: 'Screening', color: 'text-yellow-700', bgColor: 'bg-yellow-50' },
  interviewing: { label: 'Interviewing', color: 'text-purple-700', bgColor: 'bg-purple-50' },
  offer: { label: 'Offer', color: 'text-green-700', bgColor: 'bg-green-50' },
  rejected: { label: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-50' },
  accepted: { label: 'Accepted', color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  withdrawn: { label: 'Withdrawn', color: 'text-gray-700', bgColor: 'bg-gray-50' },
};

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const { application, loading, error, refetch } = useJobApplication(jobId);
  const { interviews, refetch: refetchInterviews } = useInterviews(jobId);
  const { contacts, refetch: refetchContacts } = useContacts(undefined, jobId);

  const [activeTab, setActiveTab] = useState<'overview' | 'interviews' | 'contacts' | 'research' | 'documents'>('overview');
  const [showAddInterview, setShowAddInterview] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showWizaIntegration, setShowWizaIntegration] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Interview form state
  const [interviewForm, setInterviewForm] = useState({
    title: '',
    type: 'phone_screen' as InterviewType,
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
      setActiveTab('interviews');
      
      // Reset form
      setInterviewForm({
        title: '',
        type: 'phone_screen',
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
      setActiveTab('contacts');
      
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'interviews', label: 'Interviews', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', count: interviews.length },
    { id: 'contacts', label: 'Contacts', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', count: contacts.length },
    { id: 'research', label: 'Research', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'documents', label: 'Documents', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
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
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent">
                  {application.title}
                </h1>
                <span className={`px-4 py-2 rounded-[1rem] text-sm font-black border-2 ${statusConfig[application.status].bgColor} ${statusConfig[application.status].color} ${application.status === 'wishlist' || application.status === 'withdrawn' ? 'border-gray-400' : application.status === 'applied' ? 'border-blue-400' : application.status === 'screening' ? 'border-yellow-400' : application.status === 'interviewing' ? 'border-purple-400' : application.status === 'offer' || application.status === 'accepted' ? 'border-green-400' : 'border-red-400'}`}>
                  {statusConfig[application.status].label}
                </span>
              </div>
              <div className="flex items-center gap-4 text-gray-700 font-semibold text-lg">
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
                onClick={() => setActiveTab(tab.id as any)}
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
                </div>
                {application.notes ? (
                  <p className="text-gray-800 font-semibold leading-relaxed whitespace-pre-wrap">{application.notes}</p>
                ) : (
                  <p className="text-gray-600 font-bold italic">No notes yet</p>
                )}
              </div>

              {/* Activity Timeline */}
              <div className="p-8 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300">
                <h3 className="text-2xl font-black text-gray-900 mb-6">Activity Timeline ⏱️</h3>
                <div className="space-y-5">
                  {application.applied_date && (
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-3 h-3 rounded-full bg-blue-500 shadow-[0_2px_0_0_rgba(37,99,235,0.4)] mt-1.5"></div>
                      <div>
                        <div className="font-bold text-gray-900">Application Submitted</div>
                        <div className="text-sm text-gray-700 font-semibold">{handleFormatDate(application.applied_date)}</div>
                      </div>
                    </div>
                  )}
                  {interviews.map((interview) => (
                    <div key={interview.id} className="flex gap-4">
                      <div className="flex-shrink-0 w-3 h-3 rounded-full bg-purple-500 shadow-[0_2px_0_0_rgba(147,51,234,0.4)] mt-1.5"></div>
                      <div>
                        <div className="font-bold text-gray-900">{interview.title}</div>
                        <div className="text-sm text-gray-700 font-semibold">
                          {interview.scheduled_for ? handleFormatDateTime(interview.scheduled_for) : 'Date TBD'}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-3 h-3 rounded-full bg-gray-400 shadow-[0_2px_0_0_rgba(0,0,0,0.2)] mt-1.5"></div>
                    <div>
                      <div className="font-bold text-gray-900">Application Created</div>
                      <div className="text-sm text-gray-700 font-semibold">{handleFormatDate(application.created_at)}</div>
                    </div>
                  </div>
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
                    onClick={() => setShowAddInterview(true)}
                    className="w-full px-5 py-3.5 rounded-[1.5rem] bg-white shadow-[0_4px_0_0_rgba(0,0,0,0.1)] border-2 border-blue-300 text-gray-700 font-black hover:translate-y-1 hover:shadow-[0_2px_0_0_rgba(0,0,0,0.1)] transition-all text-left flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Schedule Interview
                  </button>
                  <button 
                    onClick={() => setShowAddContact(true)}
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
                    onClick={() => setActiveTab('contacts')}
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
                  <div key={interview.id} className="p-6 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300 hover:border-purple-400 hover:shadow-[0_10px_0_0_rgba(147,51,234,0.3)] transition-all">
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
                            <span className="px-4 py-1.5 rounded-[1rem] text-xs font-black bg-blue-100 text-blue-700 border-2 border-blue-400 capitalize">
                              {interview.type.replace('_', ' ')}
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
                            <p className="text-gray-700 font-semibold text-sm whitespace-pre-wrap">{interview.prep_notes}</p>
                          </div>
                        )}

                        {interview.feedback && (
                          <div className="mb-4 p-4 rounded-[1.5rem] bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                            <div className="text-sm font-black text-gray-900 mb-2">Feedback:</div>
                            <p className="text-gray-700 font-semibold text-sm whitespace-pre-wrap">{interview.feedback}</p>
                          </div>
                        )}

                        {interview.meeting_link && (
                          <a
                            href={interview.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-bold"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Join Meeting
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
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
                <button
                  onClick={() => setShowWizaIntegration(true)}
                  className="px-6 py-4 rounded-[1.5rem] bg-gradient-to-br from-blue-500 to-purple-500 shadow-[0_6px_0_0_rgba(59,130,246,0.6)] border-2 border-blue-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(59,130,246,0.6)] font-black text-white transition-all duration-200 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Find from Wiza
                </button>
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

            <div className="grid gap-4">
              {contacts.length === 0 ? (
                <div className="p-16 rounded-[2.5rem] bg-gradient-to-br from-gray-100 to-gray-200 shadow-[0_12px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300 text-center">
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
                  <div key={contact.id} className="p-6 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300 hover:border-purple-400 hover:shadow-[0_10px_0_0_rgba(147,51,234,0.3)] transition-all">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-[0_4px_0_0_rgba(147,51,234,0.4)] flex items-center justify-center text-white font-black text-xl flex-shrink-0">
                        {contact.name.split(' ').map(n => n[0]).join('')}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-black text-gray-900">{contact.name}</h3>
                            <p className="text-gray-700 font-semibold">{contact.title}</p>
                            {contact.relationship && (
                              <span className="inline-block mt-2 px-3 py-1.5 bg-blue-100 text-blue-700 border-2 border-blue-400 rounded-[0.75rem] text-xs font-black capitalize">
                                {contact.relationship.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div className="flex items-center gap-4 mb-4 text-sm font-semibold">
                          {contact.email && (
                            <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-gray-700 hover:text-blue-600 transition-colors">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              Email
                            </a>
                          )}
                          {contact.linkedin_url && (
                            <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-gray-600 hover:text-blue-600 transition-colors">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                              </svg>
                              LinkedIn
                            </a>
                          )}
                          {contact.phone && (
                            <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 text-gray-600 hover:text-blue-600 transition-colors">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              Phone
                            </a>
                          )}
                        </div>

                        {/* Last Contact */}
                        {contact.last_contact_date && (
                          <div className="text-sm text-gray-600 mb-4">
                            Last contact: {handleFormatDate(contact.last_contact_date)}
                          </div>
                        )}

                        {/* Notes */}
                        {contact.notes && (
                          <p className="text-sm text-gray-700 mb-4 p-3 bg-gray-50 rounded-[1rem] whitespace-pre-wrap">{contact.notes}</p>
                        )}

                        {/* Interactions */}
                        {contact.interactions && contact.interactions.length > 0 && (
                          <div>
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
                                  <div className="flex-1">
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
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Research Tab */}
        {activeTab === 'research' && (
          <div className="p-16 rounded-[2.5rem] bg-gradient-to-br from-gray-100 to-gray-200 shadow-[0_12px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300 text-center">
            <svg className="w-20 h-20 mx-auto text-gray-500 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-2xl font-black text-gray-900 mb-3">Research Coming Soon</h3>
            <p className="text-gray-700 font-semibold mb-6">Company research and preparation materials will be available here</p>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="p-16 rounded-[2.5rem] bg-gradient-to-br from-gray-100 to-gray-200 shadow-[0_12px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300 text-center">
            <svg className="w-20 h-20 mx-auto text-gray-500 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <h3 className="text-2xl font-black text-gray-900 mb-3">Documents Coming Soon</h3>
            <p className="text-gray-700 font-semibold mb-6">Upload and manage your resumes, cover letters, and other materials here</p>
          </div>
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
                    <option value="phone_screen">Phone Screen</option>
                    <option value="technical">Technical</option>
                    <option value="behavioral">Behavioral</option>
                    <option value="system_design">System Design</option>
                    <option value="onsite">Onsite</option>
                    <option value="final">Final Round</option>
                    <option value="other">Other</option>
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
                    onChange={(e) => setInterviewForm({ ...interviewForm, scheduled_for: e.target.value })}
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

      {/* Add Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-[2.5rem] bg-white shadow-[0_20px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300 max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent">Add Contact 👥</h2>
              <button
                onClick={() => {
                  setShowAddContact(false);
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
                  setSubmitError(null);
                }}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3.5 rounded-[1.5rem] border-2 border-gray-300 bg-white text-gray-700 font-black hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddContact}
                disabled={isSubmitting || !contactForm.name || !contactForm.title}
                className="flex-1 px-6 py-3.5 rounded-[1.5rem] bg-gradient-to-br from-green-500 to-emerald-500 shadow-[0_6px_0_0_rgba(22,163,74,0.6)] border-2 border-green-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(22,163,74,0.6)] font-black text-white transition-all duration-200 disabled:opacity-50 disabled:translate-y-0"
              >
                {isSubmitting ? 'Adding...' : 'Add Contact'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wiza Integration Popover */}
      {showWizaIntegration && application && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-[2.5rem] bg-white shadow-[0_20px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300 max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent">Wiza Integration 🔍</h2>
              <button
                onClick={() => setShowWizaIntegration(false)}
                className="text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-[1rem]"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <WizaIntegration
              companyName={application.company?.name || 'Unknown Company'}
              companyId={application.company_id}
              companyLinkedinUrl={typeof application.company?.linkedin_url === 'string' 
                ? application.company.linkedin_url 
                : undefined}
              applicationId={application.id}
              onImportComplete={() => {
                setShowWizaIntegration(false);
                refetchContacts();
              }}
            />
          </div>
        </div>
      )}

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
    </div>
  );
}
