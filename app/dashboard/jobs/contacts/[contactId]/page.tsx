'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useContact, updateContact } from '@/lib/hooks/useContacts';
import { ContactRelationship } from '@/lib/types/jobs';

interface ScheduledCall {
  id: string;
  contact_id: string;
  scheduled_for: string;
  duration_minutes: number;
  call_type: 'phone' | 'video_call' | 'coffee' | 'in_person' | 'other';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  meeting_link?: string;
  location?: string;
  notes?: string;
  outcome_notes?: string;
  completed_at?: string;
  created_at: string;
}

type OutreachType = 'email' | 'linkedin' | 'twitter' | 'cold_call' | 'referral_request' | 'follow_up' | 'other';

interface Outreach {
  id: string;
  contact_id: string;
  outreach_type: OutreachType;
  subject?: string;
  message_summary?: string;
  sent_at: string;
  response_received: boolean;
  response_at?: string;
  response_notes?: string;
  created_at: string;
}

const formatRelationship = (relationship?: ContactRelationship): string => {
  if (!relationship) return '';
  const map: Record<ContactRelationship, string> = {
    'recruiter': 'Recruiter',
    'hiring_manager': 'Hiring Manager',
    'team_member': 'Team Member',
    'referral': 'Referral',
    'peer': 'Peer',
    'executive': 'Executive',
    'other': 'Other',
  };
  return map[relationship] || relationship;
};

const formatCallType = (callType: string): string => {
  const map: Record<string, string> = {
    'phone': 'Phone Call',
    'video_call': 'Video Call',
    'coffee': 'Coffee Chat',
    'in_person': 'In Person',
    'other': 'Other',
  };
  return map[callType] || callType;
};

const formatOutreachType = (outreachType: OutreachType): string => {
  const map: Record<OutreachType, string> = {
    'email': 'Email',
    'linkedin': 'LinkedIn Message',
    'twitter': 'Twitter/X DM',
    'cold_call': 'Cold Call',
    'referral_request': 'Referral Request',
    'follow_up': 'Follow-up',
    'other': 'Other',
  };
  return map[outreachType] || outreachType;
};

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

// Get current local datetime in format required by datetime-local input (YYYY-MM-DDTHH:MM)
const getLocalDateTimeString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.contactId as string;

  const { contact, loading, error, refetch } = useContact(contactId);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Edit contact state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    title: '',
    email: '',
    phone: '',
    linkedin_url: '',
    relationship: 'other' as ContactRelationship,
  });

  // Notes editing state
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');

  // Scheduled calls state
  const [scheduledCalls, setScheduledCalls] = useState<ScheduledCall[]>([]);
  const [loadingCalls, setLoadingCalls] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    scheduled_for: '',
    duration_minutes: '30',
    call_type: 'video_call' as ScheduledCall['call_type'],
    meeting_link: '',
    location: '',
    notes: '',
  });

  // Outreach state
  const [outreachRecords, setOutreachRecords] = useState<Outreach[]>([]);
  const [loadingOutreach, setLoadingOutreach] = useState(true);
  const [showOutreachModal, setShowOutreachModal] = useState(false);
  const [outreachForm, setOutreachForm] = useState({
    outreach_type: 'email' as OutreachType,
    subject: '',
    message_summary: '',
    sent_at: getLocalDateTimeString(), // Default to current local time
  });

  // Initialize edit form when contact loads
  useEffect(() => {
    if (contact) {
      setEditForm({
        name: contact.name || '',
        title: contact.title || '',
        email: contact.email || '',
        phone: contact.phone || '',
        linkedin_url: contact.linkedin_url || '',
        relationship: contact.relationship || 'other',
      });
      setNotesValue(contact.notes || '');
    }
  }, [contact]);

  // Fetch scheduled calls
  useEffect(() => {
    if (contactId) {
      fetchScheduledCalls();
    }
  }, [contactId]);

  // Fetch outreach records
  useEffect(() => {
    if (contactId) {
      fetchOutreachRecords();
    }
  }, [contactId]);

  const fetchScheduledCalls = async () => {
    try {
      setLoadingCalls(true);
      const response = await fetch(`/api/jobs/contacts/${contactId}/scheduled-calls`);
      if (response.ok) {
        const data = await response.json();
        setScheduledCalls(data.calls || []);
      }
    } catch (err) {
      console.error('Error fetching scheduled calls:', err);
    } finally {
      setLoadingCalls(false);
    }
  };

  const fetchOutreachRecords = async () => {
    try {
      setLoadingOutreach(true);
      const response = await fetch(`/api/jobs/contacts/${contactId}/outreach`);
      if (response.ok) {
        const data = await response.json();
        setOutreachRecords(data.outreach || []);
      }
    } catch (err) {
      console.error('Error fetching outreach records:', err);
    } finally {
      setLoadingOutreach(false);
    }
  };

  const handleUpdateContact = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await updateContact(contactId, editForm);
      await refetch();
      setShowEditModal(false);
      setSuccessMessage('Contact updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to update contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await updateContact(contactId, { notes: notesValue });
      await refetch();
      setIsEditingNotes(false);
      setSuccessMessage('Notes saved successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save notes');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScheduleCall = async () => {
    if (!scheduleForm.scheduled_for) {
      setSubmitError('Please select a date and time');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`/api/jobs/contacts/${contactId}/scheduled-calls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduled_for: scheduleForm.scheduled_for,
          duration_minutes: parseInt(scheduleForm.duration_minutes) || 30,
          call_type: scheduleForm.call_type,
          meeting_link: scheduleForm.meeting_link || undefined,
          location: scheduleForm.location || undefined,
          notes: scheduleForm.notes || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to schedule call');
      }

      await fetchScheduledCalls();
      setShowScheduleModal(false);
      setScheduleForm({
        scheduled_for: '',
        duration_minutes: '30',
        call_type: 'video_call',
        meeting_link: '',
        location: '',
        notes: '',
      });
      setSuccessMessage('Call scheduled successfully! This counts toward your weekly networking goal.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to schedule call');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkCallComplete = async (callId: string) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`/api/jobs/contacts/${contactId}/scheduled-calls/${callId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          completed_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update call');
      }

      await fetchScheduledCalls();
      setSuccessMessage('Call marked as completed');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to update call');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelCall = async (callId: string) => {
    if (!confirm('Are you sure you want to cancel this call?')) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`/api/jobs/contacts/${contactId}/scheduled-calls/${callId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel call');
      }

      await fetchScheduledCalls();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to cancel call');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogOutreach = async () => {
    if (!outreachForm.outreach_type) {
      setSubmitError('Please select an outreach type');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`/api/jobs/contacts/${contactId}/outreach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outreach_type: outreachForm.outreach_type,
          subject: outreachForm.subject || undefined,
          message_summary: outreachForm.message_summary || undefined,
          sent_at: outreachForm.sent_at ? new Date(outreachForm.sent_at).toISOString() : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to log outreach');
      }

      await fetchOutreachRecords();
      await refetch(); // Refresh contact to get updated outreach_count
      setShowOutreachModal(false);
      setOutreachForm({
        outreach_type: 'email',
        subject: '',
        message_summary: '',
        sent_at: getLocalDateTimeString(),
      });
      setSuccessMessage('Outreach logged successfully! This counts toward your weekly goal.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to log outreach');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkResponseReceived = async (outreachId: string) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`/api/jobs/contacts/${contactId}/outreach/${outreachId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response_received: true,
          response_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update outreach');
      }

      await fetchOutreachRecords();
      await refetch();
      setSuccessMessage('Response marked as received');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to update outreach');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOutreach = async (outreachId: string) => {
    if (!confirm('Are you sure you want to delete this outreach record?')) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`/api/jobs/contacts/${contactId}/outreach/${outreachId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete outreach');
      }

      await fetchOutreachRecords();
      await refetch();
      setSuccessMessage('Outreach deleted');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to delete outreach');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 md:p-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold">Loading contact...</p>
        </div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="min-h-screen p-8 md:p-12 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Contact Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'This contact does not exist or you do not have permission to view it.'}</p>
          <Link
            href="/dashboard/jobs?tab=contacts"
            className="px-8 py-3 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_6px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200 inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Contacts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 md:p-12">
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 px-6 py-3 bg-green-100 border-2 border-green-400 rounded-[1rem] text-green-700 font-bold shadow-lg">
          {successMessage}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <Link
          href={contact.application_id ? `/dashboard/jobs/${contact.application_id}?tab=contacts` : '/dashboard/jobs?tab=contacts'}
          className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-purple-600 font-bold mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Contacts
        </Link>

        <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-blue-200 to-cyan-200 shadow-[0_20px_0_0_rgba(37,99,235,0.3)] border-2 border-blue-300">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-br from-blue-700 to-cyan-600 bg-clip-text text-transparent mb-3">
                {contact.name}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                {contact.title && (
                  <span className="text-gray-700 font-semibold text-lg">{contact.title}</span>
                )}
                {contact.relationship && (
                  <span className="px-4 py-2 rounded-[1rem] text-sm font-black bg-blue-100 text-blue-700 border-2 border-blue-400">
                    {formatRelationship(contact.relationship)}
                  </span>
                )}
              </div>
              {contact.company?.name && (
                <p className="mt-3 text-gray-700 font-semibold">
                  at <span className="font-bold text-gray-900">{contact.company.name}</span>
                </p>
              )}
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              className="px-6 py-3 rounded-[1.5rem] bg-white border-2 border-blue-300 text-gray-700 font-black hover:bg-white/80 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit
            </button>
          </div>
        </div>
      </div>

      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-[1rem] text-red-700 font-bold">
          {submitError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Details */}
          <div className="p-8 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300">
            <h2 className="text-2xl font-black text-gray-900 mb-6">Contact Information</h2>

            <div className="space-y-4">
              {contact.email && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Email</p>
                    <a href={`mailto:${contact.email}`} className="text-blue-600 hover:text-blue-700 font-bold">
                      {contact.email}
                    </a>
                  </div>
                </div>
              )}

              {contact.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Phone</p>
                    <a href={`tel:${contact.phone}`} className="text-gray-900 font-bold">
                      {contact.phone}
                    </a>
                  </div>
                </div>
              )}

              {contact.linkedin_url && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">LinkedIn</p>
                    <a
                      href={contact.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 font-bold"
                    >
                      View Profile
                    </a>
                  </div>
                </div>
              )}

              {contact.last_contact_date && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Last Contact</p>
                    <p className="text-gray-900 font-bold">
                      {new Date(contact.last_contact_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              )}

              {!contact.email && !contact.phone && !contact.linkedin_url && (
                <p className="text-gray-500 italic">No contact information added yet.</p>
              )}
            </div>
          </div>

          {/* Scheduled Calls Section */}
          <div className="p-8 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-900">Networking Calls</h2>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-green-500 to-emerald-500 shadow-[0_6px_0_0_rgba(22,163,74,0.6)] border-2 border-green-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(22,163,74,0.6)] font-black text-white transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Schedule Call
              </button>
            </div>

            {loadingCalls ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              </div>
            ) : scheduledCalls.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <p className="text-gray-600 font-semibold mb-2">No calls scheduled yet</p>
                <p className="text-gray-500 text-sm">Schedule a networking call to track your progress</p>
              </div>
            ) : (
              <div className="space-y-4">
                {scheduledCalls.map((call) => (
                  <div
                    key={call.id}
                    className={`p-6 rounded-[1.5rem] border-2 ${
                      call.status === 'completed'
                        ? 'bg-green-50 border-green-200'
                        : call.status === 'cancelled'
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900">{formatCallType(call.call_type)}</span>
                          <span className={`px-3 py-1 rounded-[0.75rem] text-xs font-black ${
                            call.status === 'completed'
                              ? 'bg-green-100 text-green-700 border border-green-300'
                              : call.status === 'cancelled'
                              ? 'bg-gray-100 text-gray-600 border border-gray-300'
                              : call.status === 'no_show'
                              ? 'bg-red-100 text-red-700 border border-red-300'
                              : 'bg-purple-100 text-purple-700 border border-purple-300'
                          }`}>
                            {call.status.charAt(0).toUpperCase() + call.status.slice(1).replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-gray-700 font-semibold">{formatDateTime(call.scheduled_for)}</p>
                        {call.duration_minutes && (
                          <p className="text-gray-500 text-sm">{call.duration_minutes} minutes</p>
                        )}
                      </div>
                      {call.status === 'scheduled' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleMarkCallComplete(call.id)}
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-[1rem] bg-green-500 text-white font-bold text-sm hover:bg-green-600 transition-colors disabled:opacity-50"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleCancelCall(call.id)}
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-[1rem] bg-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-300 transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                    {call.meeting_link && (
                      <a
                        href={call.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Join Meeting
                      </a>
                    )}
                    {call.location && (
                      <p className="text-gray-600 text-sm mt-1">
                        <span className="font-semibold">Location:</span> {call.location}
                      </p>
                    )}
                    {call.notes && (
                      <p className="text-gray-600 text-sm mt-2">{call.notes}</p>
                    )}
                    {call.outcome_notes && (
                      <div className="mt-3 p-3 rounded-[1rem] bg-white/50">
                        <p className="text-sm font-semibold text-gray-700 mb-1">Outcome Notes:</p>
                        <p className="text-gray-600 text-sm">{call.outcome_notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outreach Section */}
          <div className="p-8 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-900">Outreach History</h2>
              <button
                onClick={() => setShowOutreachModal(true)}
                className="px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-orange-500 to-amber-500 shadow-[0_6px_0_0_rgba(234,88,12,0.6)] border-2 border-orange-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(234,88,12,0.6)] font-black text-white transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Log Outreach
              </button>
            </div>

            {loadingOutreach ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
              </div>
            ) : outreachRecords.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-600 font-semibold mb-2">No outreach logged yet</p>
                <p className="text-gray-500 text-sm">Log your emails and messages to track your outreach efforts</p>
              </div>
            ) : (
              <div className="space-y-4">
                {outreachRecords.map((outreach) => (
                  <div
                    key={outreach.id}
                    className={`p-6 rounded-[1.5rem] border-2 ${
                      outreach.response_received
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900">{formatOutreachType(outreach.outreach_type)}</span>
                          {outreach.response_received ? (
                            <span className="px-3 py-1 rounded-[0.75rem] text-xs font-black bg-green-100 text-green-700 border border-green-300">
                              Response Received
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-[0.75rem] text-xs font-black bg-orange-100 text-orange-700 border border-orange-300">
                              Awaiting Response
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 font-semibold text-sm">
                          {formatDateTime(outreach.sent_at)}
                        </p>
                        {outreach.subject && (
                          <p className="text-gray-800 font-semibold mt-2">
                            <span className="text-gray-500">Subject:</span> {outreach.subject}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!outreach.response_received && (
                          <button
                            onClick={() => handleMarkResponseReceived(outreach.id)}
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-[1rem] bg-green-500 text-white font-bold text-sm hover:bg-green-600 transition-colors disabled:opacity-50"
                          >
                            Got Response
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteOutreach(outreach.id)}
                          disabled={isSubmitting}
                          className="p-2 rounded-[0.75rem] bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 transition-colors disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {outreach.message_summary && (
                      <p className="text-gray-600 text-sm mt-2">{outreach.message_summary}</p>
                    )}
                    {outreach.response_received && outreach.response_at && (
                      <p className="text-green-700 text-sm mt-2 font-semibold">
                        Response received: {formatDateTime(outreach.response_at)}
                      </p>
                    )}
                    {outreach.response_notes && (
                      <div className="mt-3 p-3 rounded-[1rem] bg-white/50">
                        <p className="text-sm font-semibold text-gray-700 mb-1">Response Notes:</p>
                        <p className="text-gray-600 text-sm">{outreach.response_notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="p-8 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-black text-gray-900">Notes</h2>
              {!isEditingNotes && (
                <button
                  onClick={() => setIsEditingNotes(true)}
                  className="px-4 py-2 rounded-[1rem] bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition-colors"
                >
                  Edit Notes
                </button>
              )}
            </div>

            {isEditingNotes ? (
              <div className="space-y-4">
                <textarea
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  placeholder="Add notes about this contact..."
                  rows={6}
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium resize-none"
                />
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setIsEditingNotes(false);
                      setNotesValue(contact.notes || '');
                    }}
                    disabled={isSubmitting}
                    className="px-6 py-3 rounded-[1.5rem] border-2 border-gray-300 bg-white text-gray-700 font-black hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSubmitting}
                    className="px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-green-500 to-emerald-500 shadow-[0_6px_0_0_rgba(22,163,74,0.6)] border-2 border-green-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(22,163,74,0.6)] font-black text-white transition-all duration-200 disabled:opacity-50 disabled:translate-y-0"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {contact.notes ? (
                  <p className="text-gray-700 whitespace-pre-wrap">{contact.notes}</p>
                ) : (
                  <p className="text-gray-500 italic">No notes added yet. Click "Edit Notes" to add some.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Company Info */}
          {contact.company && (
            <div className="p-6 rounded-[2rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_8px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300">
              <h3 className="text-xl font-black text-gray-900 mb-2">Company</h3>
              <p className="text-gray-900 font-bold text-lg">{contact.company.name}</p>
              {contact.company.industry && (
                <p className="text-gray-700 font-semibold text-sm mt-1 capitalize">
                  {contact.company.industry.replace('_', ' ')}
                </p>
              )}
              {contact.company.website && (
                <a
                  href={contact.company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-800 font-bold text-sm mt-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Visit Website
                </a>
              )}
            </div>
          )}

          {/* Quick Stats */}
          <div className="p-6 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300">
            <h3 className="text-xl font-black text-gray-900 mb-4">Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-semibold">Calls Scheduled</span>
                <span className="font-black text-gray-900">{scheduledCalls.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-semibold">Calls Completed</span>
                <span className="font-black text-green-600">
                  {scheduledCalls.filter(c => c.status === 'completed').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-semibold">Outreach Sent</span>
                <span className="font-black text-orange-600">{outreachRecords.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-semibold">Responses</span>
                <span className="font-black text-green-600">
                  {outreachRecords.filter(o => o.response_received).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-semibold">Interactions</span>
                <span className="font-black text-gray-900">{contact.interactions?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* Outreach Status */}
          {contact.outreach_status && (
            <div className="p-6 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300">
              <h3 className="text-xl font-black text-gray-900 mb-3">Outreach Status</h3>
              <span className={`px-4 py-2 rounded-[1rem] text-sm font-black inline-block ${
                contact.outreach_status === 'replied'
                  ? 'bg-green-100 text-green-700 border-2 border-green-300'
                  : contact.outreach_status === 'contacted'
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                  : contact.outreach_status === 'no_response'
                  ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300'
                  : 'bg-gray-100 text-gray-700 border-2 border-gray-300'
              }`}>
                {contact.outreach_status.replace('_', ' ').charAt(0).toUpperCase() + contact.outreach_status.replace('_', ' ').slice(1)}
              </span>
              {(contact.outreach_count ?? 0) > 0 && (
                <p className="text-gray-600 text-sm mt-2">
                  Contacted {contact.outreach_count} time{(contact.outreach_count ?? 0) > 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Contact Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-[2.5rem] bg-white shadow-[0_20px_0_0_rgba(37,99,235,0.3)] border-2 border-blue-300 max-w-md w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black bg-gradient-to-br from-blue-700 to-cyan-600 bg-clip-text text-transparent">Edit Contact</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-[1rem]"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Jane Smith"
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Senior Product Manager"
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="jane.smith@company.com"
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">LinkedIn URL</label>
                <input
                  type="url"
                  value={editForm.linkedin_url}
                  onChange={(e) => setEditForm({ ...editForm, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/janesmith"
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Relationship</label>
                <select
                  value={editForm.relationship}
                  onChange={(e) => setEditForm({ ...editForm, relationship: e.target.value as ContactRelationship })}
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold"
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
            </div>

            <div className="flex items-center gap-3 mt-8">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3.5 rounded-[1.5rem] border-2 border-gray-300 bg-white text-gray-700 font-black hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateContact}
                disabled={isSubmitting || !editForm.name.trim()}
                className="flex-1 px-6 py-3.5 rounded-[1.5rem] bg-gradient-to-br from-green-500 to-emerald-500 shadow-[0_6px_0_0_rgba(22,163,74,0.6)] border-2 border-green-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(22,163,74,0.6)] font-black text-white transition-all duration-200 disabled:opacity-50 disabled:translate-y-0"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Call Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-[2.5rem] bg-white shadow-[0_20px_0_0_rgba(22,163,74,0.3)] border-2 border-green-300 max-w-md w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black bg-gradient-to-br from-green-700 to-emerald-600 bg-clip-text text-transparent">Schedule Call</h2>
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setScheduleForm({
                    scheduled_for: '',
                    duration_minutes: '30',
                    call_type: 'video_call',
                    meeting_link: '',
                    location: '',
                    notes: '',
                  });
                }}
                className="text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-[1rem]"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 p-4 rounded-[1rem] bg-green-50 border-2 border-green-200">
              <p className="text-green-700 font-semibold text-sm">
                Scheduling a networking call counts toward your weekly goal!
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Date & Time *</label>
                <input
                  type="datetime-local"
                  value={scheduleForm.scheduled_for}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_for: e.target.value })}
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-green-500 focus:border-green-500 font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Duration</label>
                  <select
                    value={scheduleForm.duration_minutes}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, duration_minutes: e.target.value })}
                    className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-green-500 focus:border-green-500 font-bold"
                  >
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">60 min</option>
                    <option value="90">90 min</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Type</label>
                  <select
                    value={scheduleForm.call_type}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, call_type: e.target.value as ScheduledCall['call_type'] })}
                    className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-green-500 focus:border-green-500 font-bold"
                  >
                    <option value="video_call">Video Call</option>
                    <option value="phone">Phone Call</option>
                    <option value="coffee">Coffee Chat</option>
                    <option value="in_person">In Person</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Meeting Link</label>
                <input
                  type="url"
                  value={scheduleForm.meeting_link}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, meeting_link: e.target.value })}
                  placeholder="https://meet.google.com/..."
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-green-500 focus:border-green-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={scheduleForm.location}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, location: e.target.value })}
                  placeholder="Coffee shop, office address, etc."
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-green-500 focus:border-green-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Notes</label>
                <textarea
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                  placeholder="Topics to discuss, questions to ask..."
                  rows={3}
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-green-500 focus:border-green-500 font-medium resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-8">
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setScheduleForm({
                    scheduled_for: '',
                    duration_minutes: '30',
                    call_type: 'video_call',
                    meeting_link: '',
                    location: '',
                    notes: '',
                  });
                }}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3.5 rounded-[1.5rem] border-2 border-gray-300 bg-white text-gray-700 font-black hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleCall}
                disabled={isSubmitting || !scheduleForm.scheduled_for}
                className="flex-1 px-6 py-3.5 rounded-[1.5rem] bg-gradient-to-br from-green-500 to-emerald-500 shadow-[0_6px_0_0_rgba(22,163,74,0.6)] border-2 border-green-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(22,163,74,0.6)] font-black text-white transition-all duration-200 disabled:opacity-50 disabled:translate-y-0"
              >
                {isSubmitting ? 'Scheduling...' : 'Schedule Call'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Outreach Modal */}
      {showOutreachModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-[2.5rem] bg-white shadow-[0_20px_0_0_rgba(234,88,12,0.3)] border-2 border-orange-300 max-w-md w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black bg-gradient-to-br from-orange-700 to-amber-600 bg-clip-text text-transparent">Log Outreach</h2>
              <button
                onClick={() => {
                  setShowOutreachModal(false);
                  setOutreachForm({
                    outreach_type: 'email',
                    subject: '',
                    message_summary: '',
                    sent_at: getLocalDateTimeString(),
                  });
                }}
                className="text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-[1rem]"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 p-4 rounded-[1rem] bg-orange-50 border-2 border-orange-200">
              <p className="text-orange-700 font-semibold text-sm">
                Logging outreach counts toward your weekly email goal!
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Outreach Type *</label>
                <select
                  value={outreachForm.outreach_type}
                  onChange={(e) => setOutreachForm({ ...outreachForm, outreach_type: e.target.value as OutreachType })}
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-bold"
                >
                  <option value="email">Email</option>
                  <option value="linkedin">LinkedIn Message</option>
                  <option value="twitter">Twitter/X DM</option>
                  <option value="cold_call">Cold Call</option>
                  <option value="referral_request">Referral Request</option>
                  <option value="follow_up">Follow-up</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Date & Time Sent</label>
                <input
                  type="datetime-local"
                  value={outreachForm.sent_at}
                  onChange={(e) => setOutreachForm({ ...outreachForm, sent_at: e.target.value })}
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Subject (optional)</label>
                <input
                  type="text"
                  value={outreachForm.subject}
                  onChange={(e) => setOutreachForm({ ...outreachForm, subject: e.target.value })}
                  placeholder="Email subject line or message topic"
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Summary (optional)</label>
                <textarea
                  value={outreachForm.message_summary}
                  onChange={(e) => setOutreachForm({ ...outreachForm, message_summary: e.target.value })}
                  placeholder="Brief summary of what you said..."
                  rows={3}
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-8">
              <button
                onClick={() => {
                  setShowOutreachModal(false);
                  setOutreachForm({
                    outreach_type: 'email',
                    subject: '',
                    message_summary: '',
                    sent_at: getLocalDateTimeString(),
                  });
                }}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3.5 rounded-[1.5rem] border-2 border-gray-300 bg-white text-gray-700 font-black hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLogOutreach}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3.5 rounded-[1.5rem] bg-gradient-to-br from-orange-500 to-amber-500 shadow-[0_6px_0_0_rgba(234,88,12,0.6)] border-2 border-orange-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(234,88,12,0.6)] font-black text-white transition-all duration-200 disabled:opacity-50 disabled:translate-y-0"
              >
                {isSubmitting ? 'Logging...' : 'Log Outreach'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
