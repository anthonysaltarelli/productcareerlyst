'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { mockJobApplications, mockInterviews, mockContacts, mockCompanyResearch } from '@/lib/mock-data/jobs';
import { ApplicationStatus } from '@/lib/types/jobs';

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
  const jobId = params.id as string;

  const job = mockJobApplications.find(app => app.id === jobId);
  const [interviews, setInterviews] = useState(mockInterviews.filter(int => int.applicationId === jobId));
  const [contacts, setContacts] = useState(mockContacts.filter(cont => cont.applicationId === jobId));
  const research = mockCompanyResearch[jobId];

  const [activeTab, setActiveTab] = useState<'overview' | 'interviews' | 'contacts' | 'research' | 'documents'>('overview');
  const [showAddInterview, setShowAddInterview] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', description: '' });

  // Interview form state
  const [interviewForm, setInterviewForm] = useState({
    title: '',
    type: 'recruiter_screen' as const,
    status: 'scheduled' as const,
    scheduledFor: '',
    duration: '',
    meetingLink: '',
    location: '',
    prepNotes: '',
  });

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    title: '',
    email: '',
    linkedinUrl: '',
    phone: '',
    relationship: 'team_member' as const,
    notes: '',
  });

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h2>
          <Link href="/dashboard/jobs" className="text-blue-600 hover:text-blue-700">
            ← Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  const handleFormatSalary = (): string => {
    if (!job.salaryRange) return 'Not specified';
    const { min, max, currency } = job.salaryRange;
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    });
    return `${formatter.format(min)} - ${formatter.format(max)}`;
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

  const handleAddInterview = () => {
    if (!interviewForm.title.trim()) {
      alert('Please enter an interview title');
      return;
    }

    const newInterview = {
      id: `int-${Date.now()}`,
      applicationId: jobId,
      title: interviewForm.title,
      type: interviewForm.type,
      status: interviewForm.status,
      scheduledFor: interviewForm.scheduledFor || undefined,
      duration: interviewForm.duration ? parseInt(interviewForm.duration) : undefined,
      meetingLink: interviewForm.meetingLink || undefined,
      location: interviewForm.location || undefined,
      prepNotes: interviewForm.prepNotes || undefined,
      createdAt: new Date().toISOString(),
    };

    setInterviews([newInterview, ...interviews]);
    setShowAddInterview(false);
    setActiveTab('interviews');
    
    // Show success toast
    setSuccessMessage({ title: 'Interview Added!', description: 'Your interview has been successfully added.' });
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
    
    // Reset form
    setInterviewForm({
      title: '',
      type: 'recruiter_screen',
      status: 'scheduled',
      scheduledFor: '',
      duration: '',
      meetingLink: '',
      location: '',
      prepNotes: '',
    });
  };

  const handleInterviewFormChange = (field: string, value: string) => {
    setInterviewForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddContact = () => {
    if (!contactForm.name.trim()) {
      alert('Please enter a contact name');
      return;
    }

    if (!contactForm.title.trim()) {
      alert('Please enter a contact title');
      return;
    }

    const newContact = {
      id: `cont-${Date.now()}`,
      applicationId: jobId,
      name: contactForm.name,
      title: contactForm.title,
      email: contactForm.email || undefined,
      linkedinUrl: contactForm.linkedinUrl || undefined,
      phone: contactForm.phone || undefined,
      relationship: contactForm.relationship,
      notes: contactForm.notes || undefined,
      interactions: [],
      createdAt: new Date().toISOString(),
    };

    setContacts([newContact, ...contacts]);
    setShowAddContact(false);
    setActiveTab('contacts');
    
    // Show success toast
    setSuccessMessage({ title: 'Contact Added!', description: 'Your contact has been successfully added.' });
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
    
    // Reset form
    setContactForm({
      name: '',
      title: '',
      email: '',
      linkedinUrl: '',
      phone: '',
      relationship: 'team_member',
      notes: '',
    });
  };

  const handleContactFormChange = (field: string, value: string) => {
    setContactForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'interviews', label: 'Interviews', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', count: interviews.length },
    { id: 'contacts', label: 'Contacts', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', count: contacts.length },
    { id: 'research', label: 'Research', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'documents', label: 'Documents', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-8 py-6">
          <Link 
            href="/dashboard/jobs"
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-4 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Jobs
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig[job.status].bgColor} ${statusConfig[job.status].color}`}>
                  {statusConfig[job.status].label}
                </span>
              </div>
              <div className="flex items-center gap-4 text-gray-600">
                <span className="flex items-center gap-2 text-lg font-medium">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {job.company}
                </span>
                <span className="text-gray-400">•</span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {job.location}
                </span>
                <span className="text-gray-400">•</span>
                <span className="capitalize">{job.workMode}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View Posting
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 font-medium text-sm transition-all relative flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
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
      <div className="px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-3 gap-6">
            {/* Main Column */}
            <div className="col-span-2 space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Salary Range</div>
                  <div className="text-xl font-bold text-gray-900">{handleFormatSalary()}</div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Applied Date</div>
                  <div className="text-xl font-bold text-gray-900">
                    {job.appliedDate ? handleFormatDate(job.appliedDate) : 'Not yet'}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Interviews</div>
                  <div className="text-xl font-bold text-gray-900">{interviews.length}</div>
                </div>
              </div>

              {/* Job Description */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h3>
                {job.description ? (
                  <p className="text-gray-700 leading-relaxed">{job.description}</p>
                ) : (
                  <p className="text-gray-400 italic">No description available</p>
                )}
              </div>

              {/* Notes */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">My Notes</h3>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Edit
                  </button>
                </div>
                {job.notes ? (
                  <p className="text-gray-700 leading-relaxed">{job.notes}</p>
                ) : (
                  <p className="text-gray-400 italic">No notes yet</p>
                )}
              </div>

              {/* Activity Timeline */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h3>
                <div className="space-y-4">
                  {job.appliedDate && (
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                      <div>
                        <div className="font-medium text-gray-900">Application Submitted</div>
                        <div className="text-sm text-gray-600">{handleFormatDate(job.appliedDate)}</div>
                      </div>
                    </div>
                  )}
                  {interviews.map((interview) => (
                    <div key={interview.id} className="flex gap-4">
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
                      <div>
                        <div className="font-medium text-gray-900">{interview.title}</div>
                        <div className="text-sm text-gray-600">
                          {interview.scheduledFor ? handleFormatDateTime(interview.scheduledFor) : 'Date TBD'}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-gray-300 mt-2"></div>
                    <div>
                      <div className="font-medium text-gray-900">Application Created</div>
                      <div className="text-sm text-gray-600">{handleFormatDate(job.createdAt)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => setShowAddInterview(true)}
                    className="w-full px-4 py-2.5 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-left flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Schedule Interview
                  </button>
                  <button 
                    onClick={() => setShowAddContact(true)}
                    className="w-full px-4 py-2.5 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-left flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Add Contact
                  </button>
                  <button className="w-full px-4 py-2.5 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-left flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Research Company
                  </button>
                </div>
              </div>

              {/* Contacts Summary */}
              {contacts.length > 0 && (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Contacts</h3>
                  <div className="space-y-3">
                    {contacts.slice(0, 3).map((contact) => (
                      <div key={contact.id} className="flex items-center gap-3 pb-3 border-b border-gray-100 last:border-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                          {contact.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{contact.name}</div>
                          <div className="text-sm text-gray-600 truncate">{contact.title}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => setActiveTab('contacts')}
                    className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View All Contacts →
                  </button>
                </div>
              )}

              {/* Upcoming Interviews */}
              {interviews.filter(int => int.status === 'scheduled').length > 0 && (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Interviews</h3>
                  <div className="space-y-4">
                    {interviews
                      .filter(int => int.status === 'scheduled')
                      .map((interview) => (
                        <div key={interview.id} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="font-medium text-gray-900">{interview.title}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {interview.scheduledFor ? handleFormatDateTime(interview.scheduledFor) : 'TBD'}
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
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Interviews</h2>
                <p className="text-gray-600 mt-1">Track your interview rounds and preparation</p>
              </div>
              <button
                onClick={() => setShowAddInterview(true)}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Interview
              </button>
            </div>

            <div className="space-y-4">
              {interviews.length === 0 ? (
                <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No interviews yet</h3>
                  <p className="text-gray-600 mb-6">Add your first interview to start tracking your progress</p>
                  <button
                    onClick={() => setShowAddInterview(true)}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Interview
                  </button>
                </div>
              ) : (
                interviews.map((interview) => (
                  <div key={interview.id} className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{interview.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            interview.status === 'scheduled' 
                              ? 'bg-purple-100 text-purple-700'
                              : interview.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                            {interview.type.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                          {interview.scheduledFor && (
                            <span className="flex items-center gap-1.5">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {handleFormatDateTime(interview.scheduledFor)}
                            </span>
                          )}
                          {interview.duration && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span>{interview.duration} minutes</span>
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

                        {interview.interviewers && interview.interviewers.length > 0 && (
                          <div className="mb-4">
                            <div className="text-sm font-medium text-gray-700 mb-2">Interviewers:</div>
                            <div className="flex flex-wrap gap-2">
                              {interview.interviewers.map((interviewer, idx) => (
                                <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                                  {interviewer}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {interview.prepNotes && (
                          <div className="mb-4">
                            <div className="text-sm font-medium text-gray-700 mb-2">Prep Notes:</div>
                            <p className="text-gray-600 text-sm">{interview.prepNotes}</p>
                          </div>
                        )}

                        {interview.feedback && (
                          <div className="mb-4">
                            <div className="text-sm font-medium text-gray-700 mb-2">Feedback:</div>
                            <p className="text-gray-600 text-sm">{interview.feedback}</p>
                          </div>
                        )}

                        {interview.meetingLink && (
                          <a
                            href={interview.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Join Meeting
                          </a>
                        )}
                      </div>

                      <button className="px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
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
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Contacts & Networking</h2>
                <p className="text-gray-600 mt-1">Manage your professional connections for this opportunity</p>
              </div>
              <button
                onClick={() => setShowAddContact(true)}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Contact
              </button>
            </div>

            <div className="grid gap-4">
              {contacts.length === 0 ? (
                <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No contacts yet</h3>
                  <p className="text-gray-600 mb-6">Start building your network for this opportunity</p>
                  <button
                    onClick={() => setShowAddContact(true)}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Contact
                  </button>
                </div>
              ) : (
                contacts.map((contact) => (
                  <div key={contact.id} className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 transition-colors">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                        {contact.name.split(' ').map(n => n[0]).join('')}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{contact.name}</h3>
                            <p className="text-gray-600">{contact.title}</p>
                            <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium capitalize">
                              {contact.relationship.replace('_', ' ')}
                            </span>
                          </div>
                          <button className="px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                        </div>

                        {/* Contact Info */}
                        <div className="flex items-center gap-4 mb-4 text-sm">
                          {contact.email && (
                            <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-gray-600 hover:text-blue-600 transition-colors">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              Email
                            </a>
                          )}
                          {contact.linkedinUrl && (
                            <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-gray-600 hover:text-blue-600 transition-colors">
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
                        {contact.lastContactDate && (
                          <div className="text-sm text-gray-600 mb-4">
                            Last contact: {handleFormatDate(contact.lastContactDate)}
                          </div>
                        )}

                        {/* Notes */}
                        {contact.notes && (
                          <p className="text-sm text-gray-700 mb-4 p-3 bg-gray-50 rounded-lg">{contact.notes}</p>
                        )}

                        {/* Interactions */}
                        {contact.interactions.length > 0 && (
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-2">Recent Interactions ({contact.interactions.length})</div>
                            <div className="space-y-2">
                              {contact.interactions.slice(0, 2).map((interaction) => (
                                <div key={interaction.id} className="flex items-start gap-3 text-sm">
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
                                    {interaction.type === 'coffee' && (
                                      <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                      </svg>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-gray-900 font-medium">{interaction.summary}</div>
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

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                            Log Interaction
                          </button>
                          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                            Send Message
                          </button>
                        </div>
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
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Company Research</h2>
                <p className="text-gray-600 mt-1">Prepare for your interviews with comprehensive insights</p>
              </div>
              <button className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-500/30 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Research with Perplexity
              </button>
            </div>

            {research ? (
              <div className="space-y-6">
                {/* Company Overview */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Overview</h3>
                  <p className="text-gray-700 leading-relaxed">{research.overview}</p>
                </div>

                {/* Culture */}
                {research.culture && (
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Culture & Values</h3>
                    <p className="text-gray-700 leading-relaxed">{research.culture}</p>
                  </div>
                )}

                {/* Products & Tech Stack */}
                <div className="grid grid-cols-2 gap-6">
                  {research.products && research.products.length > 0 && (
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Products</h3>
                      <div className="flex flex-wrap gap-2">
                        {research.products.map((product, idx) => (
                          <span key={idx} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                            {product}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {research.techStack && research.techStack.length > 0 && (
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Tech Stack</h3>
                      <div className="flex flex-wrap gap-2">
                        {research.techStack.map((tech, idx) => (
                          <span key={idx} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Recent News */}
                {research.recentNews && research.recentNews.length > 0 && (
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent News</h3>
                    <div className="space-y-3">
                      {research.recentNews.map((news, idx) => (
                        <a
                          key={idx}
                          href={news.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="font-medium text-gray-900 hover:text-blue-600 mb-1">{news.title}</div>
                          <div className="text-sm text-gray-600">{handleFormatDate(news.date)}</div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interview Tips */}
                {research.interviewTips && (
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Interview Tips</h3>
                        <p className="text-gray-700 leading-relaxed">{research.interviewTips}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Personal Notes */}
                {research.notes && (
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">My Notes</h3>
                    <p className="text-gray-700 leading-relaxed">{research.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No research yet</h3>
                <p className="text-gray-600 mb-6">Start researching {job.company} to prepare for your interviews</p>
                <button className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-500/30 inline-flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Research with Perplexity
                </button>
              </div>
            )}
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Documents & Materials</h2>
                <p className="text-gray-600 mt-1">Manage resumes, cover letters, and other application materials</p>
              </div>
              <button className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Upload Document
              </button>
            </div>

            <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents yet</h3>
              <p className="text-gray-600 mb-6">Upload your resume, cover letter, and other materials</p>
              <button className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Upload Document
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Interview Modal */}
      {showAddInterview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add Interview</h2>
              <button
                onClick={() => setShowAddInterview(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interview Title *</label>
                <input
                  type="text"
                  value={interviewForm.title}
                  onChange={(e) => handleInterviewFormChange('title', e.target.value)}
                  placeholder="e.g., Technical Phone Screen"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Interview Type *</label>
                  <select 
                    value={interviewForm.type}
                    onChange={(e) => handleInterviewFormChange('type', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select 
                    value={interviewForm.status}
                    onChange={(e) => handleInterviewFormChange('status', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={interviewForm.scheduledFor}
                    onChange={(e) => handleInterviewFormChange('scheduledFor', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    value={interviewForm.duration}
                    onChange={(e) => handleInterviewFormChange('duration', e.target.value)}
                    placeholder="60"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Link</label>
                <input
                  type="url"
                  value={interviewForm.meetingLink}
                  onChange={(e) => handleInterviewFormChange('meetingLink', e.target.value)}
                  placeholder="https://meet.google.com/abc-defg-hij"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location (if onsite)</label>
                <input
                  type="text"
                  value={interviewForm.location}
                  onChange={(e) => handleInterviewFormChange('location', e.target.value)}
                  placeholder="123 Main St, San Francisco, CA"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prep Notes</label>
                <textarea
                  rows={4}
                  value={interviewForm.prepNotes}
                  onChange={(e) => handleInterviewFormChange('prepNotes', e.target.value)}
                  placeholder="Topics to prepare, questions to ask, etc."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-8">
              <button
                onClick={() => setShowAddInterview(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddInterview}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30"
              >
                Add Interview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add Contact</h2>
              <button
                onClick={() => setShowAddContact(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={contactForm.name}
                    onChange={(e) => handleContactFormChange('name', e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    value={contactForm.title}
                    onChange={(e) => handleContactFormChange('title', e.target.value)}
                    placeholder="Senior Product Manager"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Relationship *</label>
                <select 
                  value={contactForm.relationship}
                  onChange={(e) => handleContactFormChange('relationship', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => handleContactFormChange('email', e.target.value)}
                  placeholder="jane.smith@company.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn URL</label>
                <input
                  type="url"
                  value={contactForm.linkedinUrl}
                  onChange={(e) => handleContactFormChange('linkedinUrl', e.target.value)}
                  placeholder="https://linkedin.com/in/janesmith"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={contactForm.phone}
                  onChange={(e) => handleContactFormChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  rows={4}
                  value={contactForm.notes}
                  onChange={(e) => handleContactFormChange('notes', e.target.value)}
                  placeholder="How you know them, key points from conversations, etc."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-8">
              <button
                onClick={() => setShowAddContact(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddContact}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30"
              >
                Add Contact
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-8 right-8 z-50 animate-[slideIn_0.3s_ease-out]">
          <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3">
            <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="font-semibold">{successMessage.title}</div>
              <div className="text-sm text-green-100">{successMessage.description}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

