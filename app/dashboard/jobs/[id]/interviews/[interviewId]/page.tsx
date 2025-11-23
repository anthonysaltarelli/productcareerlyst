'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useInterview } from '@/lib/hooks/useInterviews';
import { useContacts } from '@/lib/hooks/useContacts';
import { InterviewType, InterviewStatus, InterviewOutcome, InterviewerRole, ContactRelationship } from '@/lib/types/jobs';
import { getUserPlanClient } from '@/lib/utils/resume-tracking';
import PremiumFeatureGateModal from '@/app/components/resume/PremiumFeatureGateModal';

export default function InterviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.interviewId as string;
  const jobId = params.id as string;

  const { interview, loading, error, refetch } = useInterview(interviewId);
  const { contacts, refetch: refetchContacts } = useContacts(undefined, jobId);
  
  const [userPlan, setUserPlan] = useState<'learn' | 'accelerate' | null>(null);
  const [showPremiumGate, setShowPremiumGate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; body: string; htmlBody: string } | null>(null);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    type: 'phone_screen' as InterviewType,
    status: 'scheduled' as InterviewStatus,
    scheduled_for: '',
    duration_minutes: '',
    meeting_link: '',
    location: '',
    prep_notes: '',
    feedback: '',
    outcome: undefined as InterviewOutcome | undefined,
  });

  // Add interviewer state
  const [showAddInterviewer, setShowAddInterviewer] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState('');
  const [selectedRole, setSelectedRole] = useState<InterviewerRole>('interviewer');
  const [createNewContact, setCreateNewContact] = useState(false);
  const [newContactForm, setNewContactForm] = useState({
    name: '',
    title: '',
    email: '',
    linkedin_url: '',
    phone: '',
    relationship: 'team_member' as ContactRelationship,
  });

  // Add question state
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingAnswer, setEditingAnswer] = useState('');
  const [editingQuestionText, setEditingQuestionText] = useState('');
  const [editingMode, setEditingMode] = useState<'question' | 'answer' | null>(null);

  // Load user plan on mount
  useEffect(() => {
    getUserPlanClient().then(setUserPlan);
  }, []);

  // Initialize edit form when interview loads
  useEffect(() => {
    if (interview) {
      setEditForm({
        title: interview.title || '',
        type: interview.type || 'phone_screen',
        status: interview.status || 'scheduled',
        scheduled_for: interview.scheduled_for ? new Date(interview.scheduled_for).toISOString().slice(0, 16) : '',
        duration_minutes: interview.duration_minutes?.toString() || '',
        meeting_link: interview.meeting_link || '',
        location: interview.location || '',
        prep_notes: interview.prep_notes || '',
        feedback: interview.feedback || '',
        outcome: interview.outcome,
      });

      // Load saved thank you email if it exists
      if (interview.thank_you_email_subject && interview.thank_you_email_body) {
        const htmlBody = interview.thank_you_email_body
          .split('\n\n')
          .map((paragraph: string) => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
          .join('');
        
        setGeneratedEmail({
          subject: interview.thank_you_email_subject,
          body: interview.thank_you_email_body,
          htmlBody: htmlBody,
        });
      }
    }
  }, [interview]);

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

  const handleUpdateInterview = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`/api/jobs/interviews/${interviewId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editForm.title,
          type: editForm.type,
          status: editForm.status,
          scheduled_for: editForm.scheduled_for || undefined,
          duration_minutes: editForm.duration_minutes ? parseInt(editForm.duration_minutes) : undefined,
          meeting_link: editForm.meeting_link || undefined,
          location: editForm.location || undefined,
          prep_notes: editForm.prep_notes || undefined,
          feedback: editForm.feedback || undefined,
          outcome: editForm.outcome,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update interview');
      }

      await refetch();
      setIsEditing(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to update interview');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddInterviewer = async () => {
    if (createNewContact) {
      // Create new contact first, then add as interviewer
      if (!newContactForm.name.trim()) {
        setSubmitError('Please enter a contact name');
        return;
      }

      if (!interview.application?.company_id) {
        setSubmitError('Company information not available');
        return;
      }

      setIsSubmitting(true);
      setSubmitError(null);

      try {
        // Create the contact
        const contactResponse = await fetch('/api/jobs/contacts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            company_id: interview.application.company_id,
            application_id: jobId,
            name: newContactForm.name.trim(),
            title: newContactForm.title.trim() || undefined,
            email: newContactForm.email.trim() || undefined,
            linkedin_url: newContactForm.linkedin_url.trim() || undefined,
            phone: newContactForm.phone.trim() || undefined,
            relationship: newContactForm.relationship,
          }),
        });

        if (!contactResponse.ok) {
          const error = await contactResponse.json();
          throw new Error(error.error || 'Failed to create contact');
        }

        const contactData = await contactResponse.json();
        const newContactId = contactData.contact.id;

        // Add as interviewer
        const interviewerResponse = await fetch(`/api/jobs/interviews/${interviewId}/interviewers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contact_id: newContactId,
            role: selectedRole,
          }),
        });

        if (!interviewerResponse.ok) {
          const error = await interviewerResponse.json();
          throw new Error(error.error || 'Failed to add interviewer');
        }

        await refetch();
        await refetchContacts();
        setShowAddInterviewer(false);
        setSelectedContactId('');
        setSelectedRole('interviewer');
        setCreateNewContact(false);
        setNewContactForm({
          name: '',
          title: '',
          email: '',
          linkedin_url: '',
          phone: '',
          relationship: 'team_member',
        });
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Failed to add interviewer');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Use existing contact
      if (!selectedContactId) {
        setSubmitError('Please select a contact');
        return;
      }

      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const response = await fetch(`/api/jobs/interviews/${interviewId}/interviewers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contact_id: selectedContactId,
            role: selectedRole,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to add interviewer');
        }

        await refetch();
        await refetchContacts();
        setShowAddInterviewer(false);
        setSelectedContactId('');
        setSelectedRole('interviewer');
        setCreateNewContact(false);
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Failed to add interviewer');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleRemoveInterviewer = async (interviewerId: string) => {
    if (!confirm('Are you sure you want to remove this interviewer?')) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`/api/jobs/interviews/${interviewId}/interviewers?interviewer_id=${interviewerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove interviewer');
      }

      await refetch();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to remove interviewer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateQuestions = async () => {
    // Check plan
    const plan = userPlan || await getUserPlanClient();
    setUserPlan(plan);
    
    if (plan !== 'accelerate') {
      setShowPremiumGate(true);
      return;
    }

    setIsGeneratingQuestions(true);
    setSubmitError(null);

    try {
      const response = await fetch(`/api/jobs/interviews/${interviewId}/generate-questions`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.requiresAccelerate) {
          setShowPremiumGate(true);
          return;
        }
        throw new Error(error.error || 'Failed to generate questions');
      }

      await refetch();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to generate questions');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.trim()) {
      setSubmitError('Please enter a question');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`/api/jobs/interviews/${interviewId}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: newQuestion.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add question');
      }

      await refetch();
      setShowAddQuestion(false);
      setNewQuestion('');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to add question');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateQuestionAnswer = async (questionId: string, answer: string) => {
    try {
      const response = await fetch(`/api/jobs/interviews/${interviewId}/questions/${questionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answer: answer.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update answer');
      }

      await refetch();
      setEditingQuestionId(null);
      setEditingAnswer('');
      setEditingMode(null);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to update answer');
    }
  };

  const handleUpdateQuestion = async (questionId: string, questionText: string) => {
    if (!questionText.trim()) {
      setSubmitError('Question cannot be empty');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`/api/jobs/interviews/${interviewId}/questions/${questionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: questionText.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update question');
      }

      await refetch();
      setEditingQuestionId(null);
      setEditingQuestionText('');
      setEditingMode(null);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to update question');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`/api/jobs/interviews/${interviewId}/questions/${questionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete question');
      }

      await refetch();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to delete question');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateEmail = async () => {
    setIsGeneratingEmail(true);
    setSubmitError(null);

    try {
      const response = await fetch(`/api/jobs/interviews/${interviewId}/generate-email`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate email');
      }

      const data = await response.json();
      
      // Convert body to HTML for display
      const htmlBody = data.body
        .split('\n\n')
        .map((paragraph: string) => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
        .join('');
      
      setGeneratedEmail({
        subject: data.subject,
        body: data.body,
        htmlBody: htmlBody,
      });

      // Refetch interview to get the saved email fields
      await refetch();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to generate email');
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 md:p-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold">Loading interview...</p>
        </div>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="min-h-screen p-8 md:p-12 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Interview Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'This interview does not exist or you do not have permission to view it.'}</p>
          <Link href={`/dashboard/jobs/${jobId}?tab=interviews`} className="px-8 py-3 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_6px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200 inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Interviews
          </Link>
        </div>
      </div>
    );
  }

  const interviewers = interview.interview_interviewers || [];
  const questions = interview.questions || [];
  const companyName = interview.application?.company?.name || 'Unknown Company';

  return (
    <div className="min-h-screen p-8 md:p-12">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href={`/dashboard/jobs/${jobId}?tab=interviews`}
          className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-purple-600 font-bold mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Interviews
        </Link>

        <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_20px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-5 py-3.5 border-2 border-purple-400 rounded-[1rem] bg-white text-2xl font-black text-gray-900"
                    placeholder="Interview Title"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={editForm.type}
                      onChange={(e) => setEditForm({ ...editForm, type: e.target.value as InterviewType })}
                      className="px-5 py-3.5 border-2 border-purple-400 rounded-[1rem] bg-white font-bold"
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
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as InterviewStatus })}
                      className="px-5 py-3.5 border-2 border-purple-400 rounded-[1rem] bg-white font-bold"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent mb-3">
                    {interview.title}
                  </h1>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-4 py-2 rounded-[1rem] text-sm font-black border-2 ${
                      interview.status === 'scheduled' 
                        ? 'bg-purple-100 text-purple-700 border-purple-400'
                        : interview.status === 'completed'
                        ? 'bg-green-100 text-green-700 border-green-400'
                        : 'bg-gray-100 text-gray-700 border-gray-400'
                    }`}>
                      {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                    </span>
                    {interview.type && (
                      <span className="px-4 py-2 rounded-[1rem] text-sm font-black bg-blue-100 text-blue-700 border-2 border-blue-400 capitalize">
                        {interview.type.replace('_', ' ')}
                      </span>
                    )}
                    {interview.scheduled_for && (
                      <span className="text-gray-700 font-semibold">
                        {handleFormatDateTime(interview.scheduled_for)}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => {
                if (isEditing) {
                  handleUpdateInterview();
                } else {
                  setIsEditing(true);
                }
              }}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-[1.5rem] bg-white border-2 border-purple-300 text-gray-700 font-black hover:bg-white/80 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isEditing ? "M5 13l4 4L19 7" : "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"} />
              </svg>
              {isEditing ? 'Save' : 'Edit'}
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
          {/* Interview Details */}
          {isEditing ? (
            <div className="p-8 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300 space-y-4">
              <h2 className="text-2xl font-black text-gray-900 mb-4">Interview Details</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={editForm.scheduled_for}
                    onChange={(e) => setEditForm({ ...editForm, scheduled_for: e.target.value })}
                    className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    value={editForm.duration_minutes}
                    onChange={(e) => setEditForm({ ...editForm, duration_minutes: e.target.value })}
                    className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Meeting Link</label>
                <input
                  type="url"
                  value={editForm.meeting_link}
                  onChange={(e) => setEditForm({ ...editForm, meeting_link: e.target.value })}
                  placeholder="https://meet.google.com/abc-defg-hij"
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  placeholder="123 Main St, San Francisco, CA"
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Prep Notes</label>
                <textarea
                  rows={4}
                  value={editForm.prep_notes}
                  onChange={(e) => setEditForm({ ...editForm, prep_notes: e.target.value })}
                  placeholder="Topics to prepare, questions to ask, etc."
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Feedback</label>
                <textarea
                  rows={4}
                  value={editForm.feedback}
                  onChange={(e) => setEditForm({ ...editForm, feedback: e.target.value })}
                  placeholder="Post-interview feedback and reflections"
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Outcome</label>
                <select
                  value={editForm.outcome || ''}
                  onChange={(e) => setEditForm({ ...editForm, outcome: e.target.value as InterviewOutcome || undefined })}
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-bold"
                >
                  <option value="">Pending</option>
                  <option value="passed">Passed</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setSubmitError(null);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3.5 rounded-[1.5rem] border-2 border-gray-300 bg-white text-gray-700 font-black hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateInterview}
                  disabled={isSubmitting || !editForm.title}
                  className="flex-1 px-6 py-3.5 rounded-[1.5rem] bg-gradient-to-br from-green-500 to-emerald-500 shadow-[0_6px_0_0_rgba(22,163,74,0.6)] border-2 border-green-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(22,163,74,0.6)] font-black text-white transition-all duration-200 disabled:opacity-50 disabled:translate-y-0"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300">
              <h2 className="text-2xl font-black text-gray-900 mb-4">Interview Details</h2>
              
              <div className="space-y-4">
                {interview.scheduled_for && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-700 font-semibold">Date & Time:</span>
                    <span className="text-gray-900 font-bold">{handleFormatDateTime(interview.scheduled_for)}</span>
                  </div>
                )}
                {interview.duration_minutes && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-700 font-semibold">Duration:</span>
                    <span className="text-gray-900 font-bold">{interview.duration_minutes} minutes</span>
                  </div>
                )}
                {interview.location && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-700 font-semibold">Location:</span>
                    <span className="text-gray-900 font-bold">{interview.location}</span>
                  </div>
                )}
                {interview.meeting_link && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-700 font-semibold">Meeting Link:</span>
                    <a
                      href={interview.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 font-bold"
                    >
                      Join Meeting
                    </a>
                  </div>
                )}
                {interview.prep_notes && (
                  <div>
                    <span className="text-gray-700 font-semibold block mb-2">Prep Notes:</span>
                    <p className="text-gray-900 font-medium whitespace-pre-wrap">{interview.prep_notes}</p>
                  </div>
                )}
                {interview.feedback && (
                  <div>
                    <span className="text-gray-700 font-semibold block mb-2">Feedback:</span>
                    <p className="text-gray-900 font-medium whitespace-pre-wrap">{interview.feedback}</p>
                  </div>
                )}
                {interview.outcome && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-700 font-semibold">Outcome:</span>
                    <span className={`px-4 py-2 rounded-[1rem] text-sm font-black border-2 ${
                      interview.outcome === 'passed'
                        ? 'bg-green-100 text-green-700 border-green-400'
                        : interview.outcome === 'failed'
                        ? 'bg-red-100 text-red-700 border-red-400'
                        : 'bg-gray-100 text-gray-700 border-gray-400'
                    }`}>
                      {interview.outcome.charAt(0).toUpperCase() + interview.outcome.slice(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Questions Section */}
          <div className="p-8 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-900">Questions to Ask</h2>
              <div className="flex items-center gap-3">
                {userPlan === 'accelerate' && (
                  <button
                    onClick={handleGenerateQuestions}
                    disabled={isGeneratingQuestions}
                    className="px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-blue-500 to-purple-500 shadow-[0_6px_0_0_rgba(59,130,246,0.6)] border-2 border-blue-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(59,130,246,0.6)] font-black text-white transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:translate-y-0"
                  >
                    {isGeneratingQuestions ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Generate Questions
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={() => setShowAddQuestion(true)}
                  className="px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-green-500 to-emerald-500 shadow-[0_6px_0_0_rgba(22,163,74,0.6)] border-2 border-green-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(22,163,74,0.6)] font-black text-white transition-all duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Question
                </button>
              </div>
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 font-semibold mb-4">No questions yet</p>
                {userPlan !== 'accelerate' && (
                  <p className="text-sm text-gray-500 mb-4">Upgrade to Accelerate to generate AI-powered questions</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q: any) => (
                  <div key={q.id} className="p-6 rounded-[1.5rem] bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-orange-200">
                    {/* Question Section */}
                    {editingQuestionId === q.id && editingMode === 'question' ? (
                      <div className="mb-4 space-y-3">
                        <textarea
                          value={editingQuestionText}
                          onChange={(e) => setEditingQuestionText(e.target.value)}
                          placeholder="Enter your question..."
                          rows={3}
                          className="w-full px-4 py-2 border-2 border-orange-300 rounded-[1rem] focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium resize-none"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateQuestion(q.id, editingQuestionText)}
                            disabled={isSubmitting || !editingQuestionText.trim()}
                            className="px-4 py-2 rounded-[1rem] bg-green-500 text-white font-bold hover:bg-green-600 transition-colors disabled:opacity-50"
                          >
                            {isSubmitting ? 'Saving...' : 'Save Question'}
                          </button>
                          <button
                            onClick={() => {
                              setEditingQuestionId(null);
                              setEditingQuestionText('');
                              setEditingMode(null);
                            }}
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-[1rem] bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between mb-3">
                        <p className="text-gray-900 font-bold flex-1">{q.question}</p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingQuestionId(q.id);
                              setEditingQuestionText(q.question);
                              setEditingMode('question');
                            }}
                            className="text-blue-600 hover:text-blue-700 p-1"
                            title="Edit question"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="text-red-600 hover:text-red-700 p-1"
                            title="Delete question"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Answer Section */}
                    {editingQuestionId === q.id && editingMode === 'answer' ? (
                      <div className="space-y-3">
                        <textarea
                          value={editingAnswer}
                          onChange={(e) => setEditingAnswer(e.target.value)}
                          placeholder="Enter the answer you received..."
                          rows={3}
                          className="w-full px-4 py-2 border-2 border-orange-300 rounded-[1rem] focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium resize-none"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateQuestionAnswer(q.id, editingAnswer)}
                            className="px-4 py-2 rounded-[1rem] bg-green-500 text-white font-bold hover:bg-green-600 transition-colors"
                          >
                            Save Answer
                          </button>
                          <button
                            onClick={() => {
                              setEditingQuestionId(null);
                              setEditingAnswer('');
                              setEditingMode(null);
                            }}
                            className="px-4 py-2 rounded-[1rem] bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {q.answer ? (
                          <div>
                            <p className="text-gray-700 font-semibold mb-2">Answer:</p>
                            <p className="text-gray-900 font-medium whitespace-pre-wrap">{q.answer}</p>
                            <button
                              onClick={() => {
                                setEditingQuestionId(q.id);
                                setEditingAnswer(q.answer || '');
                                setEditingMode('answer');
                              }}
                              className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-bold"
                            >
                              Edit Answer
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingQuestionId(q.id);
                              setEditingAnswer('');
                              setEditingMode('answer');
                            }}
                            className="w-full px-4 py-2 rounded-[1rem] bg-orange-100 border-2 border-orange-300 text-orange-700 font-bold hover:bg-orange-200 transition-colors text-left"
                          >
                            + Add Answer
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Generate Email Button */}
            {questions.some((q: any) => q.answer && q.answer.trim().length > 0) && (
              <div className="mt-6 pt-6 border-t border-gray-300">
                {!generatedEmail ? (
                  <button
                    onClick={handleGenerateEmail}
                    disabled={isGeneratingEmail}
                    className="w-full px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_6px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:translate-y-0"
                  >
                    {isGeneratingEmail ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Generating Email...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Generate Thank You Email
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleGenerateEmail}
                    disabled={isGeneratingEmail}
                    className="w-full px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-blue-500 to-cyan-500 shadow-[0_6px_0_0_rgba(37,99,235,0.6)] border-2 border-blue-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(37,99,235,0.6)] font-black text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:translate-y-0"
                  >
                    {isGeneratingEmail ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Regenerating Email...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Regenerate Email
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Generated Email Display */}
            {generatedEmail && (
              <div className="mt-6 p-6 rounded-[1.5rem] bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-black text-gray-900">Thank You Email</h3>
                  {interview.thank_you_email_subject && interview.thank_you_email_body && (
                    <span className="px-3 py-1 rounded-[0.75rem] text-xs font-black bg-green-100 text-green-700 border-2 border-green-400">
                      Saved
                    </span>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Subject:</label>
                  <input
                    type="text"
                    value={generatedEmail.subject}
                    readOnly
                    className="w-full px-4 py-2 border-2 border-purple-300 rounded-[1rem] bg-white font-medium"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Body:</label>
                  <textarea
                    value={generatedEmail.body}
                    readOnly
                    rows={8}
                    className="w-full px-4 py-2 border-2 border-purple-300 rounded-[1rem] bg-white font-medium resize-none"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`);
                      alert('Email copied to clipboard!');
                    }}
                    className="flex-1 px-4 py-2 rounded-[1rem] bg-purple-500 text-white font-bold hover:bg-purple-600 transition-colors"
                  >
                    Copy to Clipboard
                  </button>
                  <a
                    href={`mailto:${interviewers[0]?.contact?.email || ''}?subject=${encodeURIComponent(generatedEmail.subject)}&body=${encodeURIComponent(generatedEmail.body)}`}
                    className="flex-1 px-4 py-2 rounded-[1rem] bg-green-500 text-white font-bold hover:bg-green-600 transition-colors text-center"
                  >
                    Open in Email Client
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Interviewers Section */}
          <div className="p-6 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black text-gray-900">Interviewers</h3>
              <button
                onClick={() => setShowAddInterviewer(true)}
                className="px-4 py-2 rounded-[1rem] bg-gradient-to-br from-green-500 to-emerald-500 shadow-[0_4px_0_0_rgba(22,163,74,0.6)] border-2 border-green-600 hover:translate-y-1 hover:shadow-[0_2px_0_0_rgba(22,163,74,0.6)] font-black text-white transition-all duration-200 text-sm"
              >
                + Add
              </button>
            </div>

            {interviewers.length === 0 ? (
              <p className="text-gray-600 font-semibold text-sm">No interviewers added yet</p>
            ) : (
              <div className="space-y-3">
                {interviewers.map((ii: any) => {
                  const contact = ii.contact;
                  if (!contact) return null;
                  
                  return (
                    <div key={ii.id} className="p-4 rounded-[1.5rem] bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-bold text-gray-900">{contact.name}</div>
                          {contact.title && (
                            <div className="text-sm text-gray-700 font-semibold">{contact.title}</div>
                          )}
                          {ii.role && (
                            <div className="text-xs text-gray-600 font-semibold mt-1 capitalize">
                              {ii.role.replace('_', ' ')}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveInterviewer(ii.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                          title="Remove interviewer"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Company Info */}
          <div className="p-6 rounded-[2rem] bg-gradient-to-br from-blue-200 to-cyan-200 shadow-[0_8px_0_0_rgba(37,99,235,0.3)] border-2 border-blue-300">
            <h3 className="text-xl font-black text-gray-900 mb-2">Company</h3>
            <p className="text-gray-900 font-bold">{companyName}</p>
            {interview.application?.title && (
              <p className="text-gray-700 font-semibold text-sm mt-1">{interview.application.title}</p>
            )}
          </div>
        </div>
      </div>

      {/* Add Interviewer Modal */}
      {showAddInterviewer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-[2.5rem] bg-white shadow-[0_20px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300 max-w-md w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent">Add Interviewer</h2>
              <button
                onClick={() => {
                  setShowAddInterviewer(false);
                  setSelectedContactId('');
                  setSelectedRole('interviewer');
                  setCreateNewContact(false);
                  setNewContactForm({
                    name: '',
                    title: '',
                    email: '',
                    linkedin_url: '',
                    phone: '',
                    relationship: 'team_member',
                  });
                }}
                className="text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-[1rem]"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Toggle between existing and new contact */}
            <div className="flex items-center gap-2 mb-6 p-1 rounded-[1rem] bg-gray-100 border-2 border-gray-200">
              <button
                onClick={() => {
                  setCreateNewContact(false);
                  setSelectedContactId('');
                }}
                className={`flex-1 px-4 py-2 rounded-[0.75rem] font-black text-sm transition-colors ${
                  !createNewContact
                    ? 'bg-white shadow-[0_2px_0_0_rgba(0,0,0,0.1)] border-2 border-purple-300 text-purple-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Select Existing
              </button>
              <button
                onClick={() => {
                  setCreateNewContact(true);
                  setSelectedContactId('');
                }}
                className={`flex-1 px-4 py-2 rounded-[0.75rem] font-black text-sm transition-colors ${
                  createNewContact
                    ? 'bg-white shadow-[0_2px_0_0_rgba(0,0,0,0.1)] border-2 border-purple-300 text-purple-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Create New
              </button>
            </div>

            <div className="space-y-4">
              {!createNewContact ? (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Contact *</label>
                    <select
                      value={selectedContactId}
                      onChange={(e) => setSelectedContactId(e.target.value)}
                      className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-bold"
                    >
                      <option value="">Select a contact...</option>
                      {contacts
                        .filter(c => !interviewers.some((ii: any) => ii.contact?.id === c.id))
                        .map(contact => (
                          <option key={contact.id} value={contact.id}>
                            {contact.name}{contact.title ? ` - ${contact.title}` : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={newContactForm.name}
                      onChange={(e) => setNewContactForm({ ...newContactForm, name: e.target.value })}
                      placeholder="Jane Smith"
                      className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={newContactForm.title}
                      onChange={(e) => setNewContactForm({ ...newContactForm, title: e.target.value })}
                      placeholder="Senior Product Manager"
                      className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={newContactForm.email}
                      onChange={(e) => setNewContactForm({ ...newContactForm, email: e.target.value })}
                      placeholder="jane.smith@company.com"
                      className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">LinkedIn URL</label>
                    <input
                      type="url"
                      value={newContactForm.linkedin_url}
                      onChange={(e) => setNewContactForm({ ...newContactForm, linkedin_url: e.target.value })}
                      placeholder="https://linkedin.com/in/janesmith"
                      className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={newContactForm.phone}
                      onChange={(e) => setNewContactForm({ ...newContactForm, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Relationship</label>
                    <select
                      value={newContactForm.relationship}
                      onChange={(e) => setNewContactForm({ ...newContactForm, relationship: e.target.value as ContactRelationship })}
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
                </>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as InterviewerRole)}
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-bold"
                >
                  <option value="interviewer">Interviewer</option>
                  <option value="panel_member">Panel Member</option>
                  <option value="observer">Observer</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-8">
              <button
                onClick={() => {
                  setShowAddInterviewer(false);
                  setSelectedContactId('');
                  setSelectedRole('interviewer');
                  setCreateNewContact(false);
                  setNewContactForm({
                    name: '',
                    title: '',
                    email: '',
                    linkedin_url: '',
                    phone: '',
                    relationship: 'team_member',
                  });
                }}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3.5 rounded-[1.5rem] border-2 border-gray-300 bg-white text-gray-700 font-black hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddInterviewer}
                disabled={isSubmitting || (!createNewContact && !selectedContactId) || (createNewContact && !newContactForm.name.trim())}
                className="flex-1 px-6 py-3.5 rounded-[1.5rem] bg-gradient-to-br from-green-500 to-emerald-500 shadow-[0_6px_0_0_rgba(22,163,74,0.6)] border-2 border-green-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(22,163,74,0.6)] font-black text-white transition-all duration-200 disabled:opacity-50 disabled:translate-y-0"
              >
                {isSubmitting ? 'Adding...' : 'Add Interviewer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {showAddQuestion && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-[2.5rem] bg-white shadow-[0_20px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300 max-w-md w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent">Add Question</h2>
              <button
                onClick={() => {
                  setShowAddQuestion(false);
                  setNewQuestion('');
                }}
                className="text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-[1rem]"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Question *</label>
                <textarea
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="What would you like to ask during the interview?"
                  rows={4}
                  className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-8">
              <button
                onClick={() => {
                  setShowAddQuestion(false);
                  setNewQuestion('');
                }}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3.5 rounded-[1.5rem] border-2 border-gray-300 bg-white text-gray-700 font-black hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddQuestion}
                disabled={isSubmitting || !newQuestion.trim()}
                className="flex-1 px-6 py-3.5 rounded-[1.5rem] bg-gradient-to-br from-green-500 to-emerald-500 shadow-[0_6px_0_0_rgba(22,163,74,0.6)] border-2 border-green-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(22,163,74,0.6)] font-black text-white transition-all duration-200 disabled:opacity-50 disabled:translate-y-0"
              >
                {isSubmitting ? 'Adding...' : 'Add Question'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Feature Gate Modal */}
      <PremiumFeatureGateModal
        isOpen={showPremiumGate}
        onClose={() => setShowPremiumGate(false)}
        featureName="AI-Powered Interview Questions"
        featureDescription="Generate personalized interview questions using AI. This feature is available exclusively for Accelerate plan subscribers."
        currentPlan={userPlan}
        requiresAccelerate={true}
      />
    </div>
  );
}

