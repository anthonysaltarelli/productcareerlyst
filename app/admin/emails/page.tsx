'use client';

import { useEffect, useState } from 'react';
import { Mail, FileText, Eye, CheckCircle, XCircle, RefreshCw, Send, Calendar, X, Filter, Play, Square } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string | null;
  text_content: string | null;
  version: number;
  is_active: boolean;
  metadata: {
    component_path?: string;
    component_props?: Record<string, any>;
    email_type?: 'transactional' | 'marketing';
    unsubscribe_url_placeholder?: string;
  };
  created_at: string;
  updated_at: string;
}

interface ScheduledEmail {
  id: string;
  user_id: string | null;
  email_address: string;
  flow_id: string | null;
  flow_step_id: string | null;
  template_id: string;
  template_version: number;
  template_snapshot: Record<string, any>;
  resend_email_id: string | null;
  resend_scheduled_id: string | null;
  status: 'pending' | 'scheduled' | 'sent' | 'cancelled' | 'failed' | 'suppressed';
  scheduled_at: string;
  sent_at: string | null;
  cancelled_at: string | null;
  suppression_reason: 'bounced' | 'complained' | 'unsubscribed' | null;
  is_test: boolean;
  flow_trigger_id: string | null;
  triggered_at: string | null;
  retry_count: number;
  last_retry_at: string | null;
  idempotency_key: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

type Tab = 'templates' | 'schedule' | 'scheduled' | 'flows' | 'flow-testing';

interface EmailFlow {
  id: string;
  name: string;
  description: string | null;
  trigger_event: string;
  cancel_events: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface EmailFlowStep {
  id: string;
  flow_id: string;
  step_order: number;
  time_offset_minutes: number;
  template_id: string;
  template_version: number;
  subject_override: string | null;
  email_type: 'transactional' | 'marketing';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export default function AdminEmailsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('templates');
  
  // Templates state
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  
  // Scheduling state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedScheduleUserId, setSelectedScheduleUserId] = useState<string>('');
  const [testEmailAddress, setTestEmailAddress] = useState<string>('anthsalt+test@gmail.com');
  const [scheduledMinutes, setScheduledMinutes] = useState<number>(2);
  const [schedulingLoading, setSchedulingLoading] = useState(false);
  const [scheduleMessage, setScheduleMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Scheduled emails state
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [scheduledEmailsLoading, setScheduledEmailsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isTestFilter, setIsTestFilter] = useState<boolean | null>(null);
  
  // Preview state
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // Flow state
  const [flows, setFlows] = useState<EmailFlow[]>([]);
  const [flowsLoading, setFlowsLoading] = useState(false);
  const [flowDetailsMap, setFlowDetailsMap] = useState<Record<string, { flow: EmailFlow; steps: EmailFlowStep[] }>>({});
  const [flowDetailsLoading, setFlowDetailsLoading] = useState<Record<string, boolean>>({});
  const [flowStats, setFlowStats] = useState<Record<string, {
    flowId: string;
    totalEmails: number;
    pending: number;
    scheduled: number;
    sent: number;
    cancelled: number;
    failed: number;
    activeInstances: number;
    uniqueUsers: number;
    testEmails: number;
    productionEmails: number;
  }>>({});
  const [flowStatsLoading, setFlowStatsLoading] = useState(false);
  
  // Flow testing state
  const [selectedFlowId, setSelectedFlowId] = useState<string>('');
  const [selectedFlow, setSelectedFlow] = useState<EmailFlow | null>(null);
  const [flowSteps, setFlowSteps] = useState<EmailFlowStep[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [flowTestEmail, setFlowTestEmail] = useState<string>('anthsalt+test-sequence@gmail.com');
  const [flowTriggerLoading, setFlowTriggerLoading] = useState(false);
  const [flowCancelLoading, setFlowCancelLoading] = useState(false);
  const [flowMessage, setFlowMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [lastTriggeredFlowInstance, setLastTriggeredFlowInstance] = useState<{
    flowTriggerId: string;
    flowId: string;
    emailAddress: string;
    count: number;
  } | null>(null);
  
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'templates') {
      fetchTemplates();
    } else if (activeTab === 'scheduled') {
      fetchScheduledEmails();
    } else if (activeTab === 'schedule' || activeTab === 'flow-testing') {
      fetchUsers();
      if (activeTab === 'flows' || activeTab === 'flow-testing') {
        fetchFlows();
      }
    } else if (activeTab === 'flows') {
      fetchFlows();
    }
  }, [activeTab, statusFilter, isTestFilter]);

  useEffect(() => {
    if (selectedFlowId && activeTab === 'flow-testing') {
      fetchFlowDetails(selectedFlowId);
    }
  }, [selectedFlowId, activeTab]);

  const fetchTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const response = await fetch('/api/email/templates');
      
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();
      setTemplates(data.templates || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Failed to load templates');
    } finally {
      setTemplatesLoading(false);
    }
  };

  const fetchScheduledEmails = async () => {
    try {
      setScheduledEmailsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (isTestFilter !== null) {
        params.append('isTest', isTestFilter.toString());
      }
      params.append('limit', '100');

      const response = await fetch(`/api/email/scheduled?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch scheduled emails');
      }

      const data = await response.json();
      setScheduledEmails(data.scheduledEmails || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching scheduled emails:', err);
      setError('Failed to load scheduled emails');
    } finally {
      setScheduledEmailsLoading(false);
    }
  };

  const handlePreview = async (template: EmailTemplate) => {
    try {
      setPreviewLoading(true);
      setSelectedTemplate(template);
      
      const response = await fetch('/api/email/templates/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: template.id,
          variables: {
            firstName: 'John',
            userId: 'test-user-123',
            otpCode: '123456',
            expiresInMinutes: 10,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || 'Failed to preview template');
      }

      const data = await response.json();
      setPreviewHtml(data.html);
    } catch (err) {
      console.error('Error previewing template:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to preview template';
      setError(`Failed to preview template: ${errorMessage}`);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleScheduleEmail = async () => {
    if (!selectedTemplateId) {
      setScheduleMessage({ type: 'error', text: 'Please select a template' });
      return;
    }

    if (!testEmailAddress || !testEmailAddress.includes('@')) {
      setScheduleMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    try {
      setSchedulingLoading(true);
      setScheduleMessage(null);

      // Calculate scheduled time (X minutes from now)
      const scheduledAt = new Date(Date.now() + scheduledMinutes * 60 * 1000).toISOString();

      const response = await fetch('/api/email/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedScheduleUserId || undefined, // Include userId for unsubscribe link generation
          emailAddress: testEmailAddress,
          templateId: selectedTemplateId,
          scheduledAt,
          isTest: true,
          variables: {
            firstName: selectedScheduleUserId 
              ? users.find(u => u.id === selectedScheduleUserId)?.firstName || 'Test'
              : 'Test',
            userId: selectedScheduleUserId || 'test-user-123',
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || 'Failed to schedule email');
      }

      const data = await response.json();
      setScheduleMessage({
        type: 'success',
        text: `Email scheduled successfully! ID: ${data.scheduledEmail.id.substring(0, 8)}... Scheduled for ${new Date(scheduledAt).toLocaleString()}`,
      });

      // Reset form
      setSelectedTemplateId('');
      setSelectedScheduleUserId('');
      setTestEmailAddress('anthsalt+test@gmail.com');
      setScheduledMinutes(2);

      // Refresh scheduled emails if on that tab
      if (activeTab === 'scheduled') {
        setTimeout(() => fetchScheduledEmails(), 1000);
      }
    } catch (err) {
      console.error('Error scheduling email:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to schedule email';
      setScheduleMessage({ type: 'error', text: errorMessage });
    } finally {
      setSchedulingLoading(false);
    }
  };

  const fetchFlows = async () => {
    try {
      setFlowsLoading(true);
      const response = await fetch('/api/email/flows');
      
      if (!response.ok) {
        throw new Error('Failed to fetch flows');
      }

      const data = await response.json();
      setFlows(data.flows || []);
      setError(null);
      
      // If on flows tab, fetch details for all flows and stats
      if (activeTab === 'flows') {
        fetchAllFlowDetails(data.flows || []);
        fetchFlowStats();
      }
    } catch (err) {
      console.error('Error fetching flows:', err);
      setError('Failed to load flows');
    } finally {
      setFlowsLoading(false);
    }
  };

  const fetchFlowStats = async () => {
    try {
      setFlowStatsLoading(true);
      const response = await fetch('/api/email/flows/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch flow stats');
      }

      const data = await response.json();
      setFlowStats(data.flowStats || {});
    } catch (err) {
      console.error('Error fetching flow stats:', err);
      // Don't set error - stats are optional
    } finally {
      setFlowStatsLoading(false);
    }
  };

  const fetchAllFlowDetails = async (flowsToFetch: EmailFlow[]) => {
    const detailsMap: Record<string, { flow: EmailFlow; steps: EmailFlowStep[] }> = {};
    const loadingMap: Record<string, boolean> = {};
    
    // Set all as loading
    flowsToFetch.forEach(flow => {
      loadingMap[flow.id] = true;
    });
    setFlowDetailsLoading({ ...loadingMap });

    // Fetch details for each flow
    const promises = flowsToFetch.map(async (flow) => {
      try {
        const response = await fetch(`/api/email/flows/${flow.id}`);
        if (response.ok) {
          const data = await response.json();
          detailsMap[flow.id] = { flow: data.flow, steps: data.steps || [] };
        }
      } catch (err) {
        console.error(`Error fetching flow details for ${flow.id}:`, err);
      } finally {
        loadingMap[flow.id] = false;
      }
    });

    await Promise.all(promises);
    setFlowDetailsMap(detailsMap);
    setFlowDetailsLoading(loadingMap);
  };

  const fetchFlowDetails = async (flowId: string) => {
    try {
      const response = await fetch(`/api/email/flows/${flowId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch flow details');
      }

      const data = await response.json();
      setSelectedFlow(data.flow);
      setFlowSteps(data.steps || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching flow details:', err);
      setError('Failed to load flow details');
    }
  };

  const fetchUsers = async () => {
    try {
      // Include test accounts for email testing (needed for unsubscribe link testing)
      const response = await fetch('/api/admin/users?includeTestAccounts=true');
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      // Don't set error - users are optional for flow testing
    }
  };

  const handleTriggerFlow = async () => {
    if (!selectedFlowId) {
      setFlowMessage({ type: 'error', text: 'Please select a flow' });
      return;
    }

    if (!flowTestEmail || !flowTestEmail.includes('@')) {
      setFlowMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    try {
      setFlowTriggerLoading(true);
      setFlowMessage(null);

      const response = await fetch('/api/email/flows/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flowId: selectedFlowId,
          userId: selectedUserId || undefined,
          emailAddress: flowTestEmail,
          isTest: true,
          variables: {
            firstName: selectedUserId 
              ? users.find(u => u.id === selectedUserId)?.firstName || 'Test'
              : 'Test',
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || 'Failed to trigger flow');
      }

      const data = await response.json();
      
      console.log('[handleTriggerFlow] Response data:', data);
      console.log('[handleTriggerFlow] Scheduled emails count:', data.count);
      console.log('[handleTriggerFlow] Scheduled emails array:', data.scheduledEmails);
      
      // Store the flow trigger ID from the first scheduled email (if available)
      const flowTriggerId = data.scheduledEmails?.[0]?.flow_trigger_id || null;
      
      if (flowTriggerId) {
        setLastTriggeredFlowInstance({
          flowTriggerId,
          flowId: selectedFlowId,
          emailAddress: flowTestEmail,
          count: data.count || 0,
        });
      }
      
      setFlowMessage({
        type: 'success',
        text: `Flow triggered successfully! ${data.count || 0} emails scheduled. All emails will be sent to: ${flowTestEmail}`,
      });

      // Refresh scheduled emails if on that tab
      if (activeTab === 'scheduled') {
        setTimeout(() => fetchScheduledEmails(), 1000);
      }
      
      // Refresh flow stats if on flows tab
      if (activeTab === 'flows') {
        setTimeout(() => {
          fetchFlowStats();
          fetchFlows();
        }, 1000);
      }
    } catch (err) {
      console.error('Error triggering flow:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to trigger flow';
      setFlowMessage({ type: 'error', text: errorMessage });
    } finally {
      setFlowTriggerLoading(false);
    }
  };

  const handleCancelFlow = async (flowTriggerId?: string) => {
    // If flowTriggerId provided, use it (for canceling specific instance)
    // Otherwise, use the old method (userId + flowId)
    if (flowTriggerId) {
      if (!confirm(`Are you sure you want to cancel this flow instance? All remaining emails will be cancelled.`)) {
        return;
      }

      try {
        setFlowCancelLoading(true);
        setFlowMessage(null);

        const response = await fetch('/api/email/flows/cancel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            flowTriggerId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.details || errorData.error || 'Failed to cancel flow');
        }

        const data = await response.json();
        setFlowMessage({
          type: 'success',
          text: `Flow instance cancelled successfully! ${data.cancelledCount} emails cancelled.`,
        });

        // Clear the last triggered instance if it was cancelled
        if (lastTriggeredFlowInstance?.flowTriggerId === flowTriggerId) {
          setLastTriggeredFlowInstance(null);
        }

        // Refresh scheduled emails
        if (activeTab === 'scheduled') {
          setTimeout(() => fetchScheduledEmails(), 1000);
        }

        // Refresh flow stats
        if (activeTab === 'flows') {
          setTimeout(() => {
            fetchFlowStats();
            fetchFlows();
          }, 1000);
        }
      } catch (err) {
        console.error('Error cancelling flow:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to cancel flow';
        setFlowMessage({ type: 'error', text: errorMessage });
      } finally {
        setFlowCancelLoading(false);
      }
      return;
    }

    // Old method: cancel by userId + flowId
    if (!selectedFlowId) {
      setFlowMessage({ type: 'error', text: 'Please select a flow' });
      return;
    }

    if (!selectedUserId) {
      setFlowMessage({ type: 'error', text: 'Please select a user to cancel flow for' });
      return;
    }

    if (!confirm(`Are you sure you want to cancel all remaining emails in this flow for the selected user?`)) {
      return;
    }

    try {
      setFlowCancelLoading(true);
      setFlowMessage(null);

      const response = await fetch('/api/email/flows/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUserId,
          flowId: selectedFlowId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || 'Failed to cancel flow');
      }

      const data = await response.json();
      setFlowMessage({
        type: 'success',
        text: `Flow cancelled successfully! ${data.cancelledCount} emails cancelled.`,
      });

      // Refresh scheduled emails
      if (activeTab === 'scheduled') {
        setTimeout(() => fetchScheduledEmails(), 1000);
      }
    } catch (err) {
      console.error('Error cancelling flow:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel flow';
      setFlowMessage({ type: 'error', text: errorMessage });
    } finally {
      setFlowCancelLoading(false);
    }
  };

  const handleCancelEmail = async (scheduledEmailId: string) => {
    if (!confirm('Are you sure you want to cancel this email?')) {
      return;
    }

    try {
      const response = await fetch('/api/email/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduledEmailId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || 'Failed to cancel email');
      }

      // Refresh scheduled emails
      fetchScheduledEmails();
    } catch (err) {
      console.error('Error cancelling email:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel email';
      setError(errorMessage);
    }
  };

  // Group templates by name
  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.name]) {
      acc[template.name] = [];
    }
    acc[template.name].push(template);
    return acc;
  }, {} as Record<string, EmailTemplate[]>);

  // Sort versions within each group (newest first)
  Object.keys(groupedTemplates).forEach((name) => {
    groupedTemplates[name].sort((a, b) => b.version - a.version);
  });

  // Get active templates for dropdown
  const activeTemplates = templates.filter((t) => t.is_active);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="px-4 py-6 md:p-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Email System</h1>
        <p className="text-gray-600">Manage templates, schedule emails, and view scheduled emails</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Templates
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'schedule'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Send className="w-4 h-4 inline mr-2" />
            Schedule Test Email
          </button>
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'scheduled'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            Scheduled Emails
          </button>
          <button
            onClick={() => setActiveTab('flows')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'flows'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Flows
          </button>
          <button
            onClick={() => setActiveTab('flow-testing')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'flow-testing'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Play className="w-4 h-4 inline mr-2" />
            Flow Testing
          </button>
        </nav>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div>
          {templatesLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
              <span className="ml-3 text-gray-600">Loading templates...</span>
            </div>
          ) : templates.length === 0 ? (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center">
              <p className="text-yellow-800">No templates found. Create templates using the test script.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTemplates).map(([templateName, versions]) => {
                const activeVersion = versions.find((v) => v.is_active);
                
                return (
                  <div
                    key={templateName}
                    className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-sm"
                  >
                    {/* Template Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="w-6 h-6 text-purple-600" />
                          <h2 className="text-xl font-bold text-gray-900">{templateName}</h2>
                          {activeVersion && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                              Active v{activeVersion.version}
                            </span>
                          )}
                        </div>
                        {activeVersion && (
                          <p className="text-gray-600 text-sm">
                            Subject: <span className="font-semibold">{activeVersion.subject}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Template Metadata */}
                    {activeVersion && (
                      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="text-sm font-semibold text-gray-700 mb-2">Template Details</h3>
                          <dl className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <dt className="text-gray-600">Email Type:</dt>
                              <dd className="font-semibold">
                                {activeVersion.metadata?.email_type === 'marketing' ? (
                                  <span className="text-purple-600">Marketing</span>
                                ) : (
                                  <span className="text-blue-600">Transactional</span>
                                )}
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-600">Component:</dt>
                              <dd className="font-mono text-xs text-gray-800 truncate max-w-[200px]">
                                {activeVersion.metadata?.component_path || 'HTML Content'}
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-600">Created:</dt>
                              <dd className="text-gray-800">
                                {new Date(activeVersion.created_at).toLocaleDateString()}
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-600">Updated:</dt>
                              <dd className="text-gray-800">
                                {new Date(activeVersion.updated_at).toLocaleDateString()}
                              </dd>
                            </div>
                          </dl>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="text-sm font-semibold text-gray-700 mb-2">Version Info</h3>
                          <dl className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <dt className="text-gray-600">Total Versions:</dt>
                              <dd className="font-semibold text-gray-800">{versions.length}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-600">Latest Version:</dt>
                              <dd className="font-semibold text-gray-800">v{versions[0].version}</dd>
                            </div>
                            {activeVersion.metadata?.unsubscribe_url_placeholder && (
                              <div className="flex justify-between">
                                <dt className="text-gray-600">Unsubscribe:</dt>
                                <dd className="font-mono text-xs text-gray-800">
                                  {activeVersion.metadata.unsubscribe_url_placeholder}
                                </dd>
                              </div>
                            )}
                          </dl>
                        </div>
                      </div>
                    )}

                    {/* Version History */}
                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Version History</h3>
                      <div className="space-y-2">
                        {versions.map((version) => (
                          <div
                            key={version.id}
                            className={`flex items-center justify-between p-3 rounded-lg ${
                              version.is_active
                                ? 'bg-purple-50 border-2 border-purple-200'
                                : 'bg-gray-50 border border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {version.is_active ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <XCircle className="w-5 h-5 text-gray-400" />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-900">v{version.version}</span>
                                  {version.is_active && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded">
                                      Active
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">{version.subject}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-xs text-gray-500">
                                {new Date(version.created_at).toLocaleDateString()}
                              </div>
                              <button
                                onClick={() => handlePreview(version)}
                                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1.5 text-sm"
                                disabled={previewLoading}
                                title={`Preview v${version.version}`}
                              >
                                <Eye className="w-4 h-4" />
                                Preview
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Schedule Test Email Tab */}
      {activeTab === 'schedule' && (
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-sm max-w-2xl">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Schedule Test Email</h2>

          <div className="space-y-4">
            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template *
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Select a template...</option>
                {activeTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} v{template.version} - {template.subject}
                  </option>
                ))}
              </select>
            </div>

            {/* User Selection (for unsubscribe links) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User (Optional - Required for unsubscribe links)
              </label>
              <select
                value={selectedScheduleUserId}
                onChange={(e) => setSelectedScheduleUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">No user (no unsubscribe link)</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName || user.email} ({user.email})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Select a user to generate unsubscribe links for marketing emails. Leave empty for test emails without unsubscribe.
              </p>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Email Address *
              </label>
              <input
                type="email"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                placeholder="anthsalt+test@gmail.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Default test email format: anthsalt+[label]@gmail.com
              </p>
            </div>

            {/* Scheduled Minutes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule in (minutes) *
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={scheduledMinutes}
                onChange={(e) => setScheduledMinutes(parseInt(e.target.value, 10) || 2)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Email will be scheduled to send in {scheduledMinutes} minute(s) ({new Date(Date.now() + scheduledMinutes * 60 * 1000).toLocaleString()})
              </p>
            </div>

            {/* Message */}
            {scheduleMessage && (
              <div
                className={`p-4 rounded-lg ${
                  scheduleMessage.type === 'success'
                    ? 'bg-green-50 border-2 border-green-200 text-green-800'
                    : 'bg-red-50 border-2 border-red-200 text-red-800'
                }`}
              >
                {scheduleMessage.text}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleScheduleEmail}
              disabled={schedulingLoading || !selectedTemplateId}
              className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {schedulingLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Schedule Email
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Scheduled Emails Tab */}
      {activeTab === 'scheduled' && (
        <div>
          {/* Filters */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>
              <div>
                <label className="text-sm text-gray-600 mr-2">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="sent">Sent</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 mr-2">Type:</label>
                <select
                  value={isTestFilter === null ? 'all' : isTestFilter ? 'test' : 'production'}
                  onChange={(e) => {
                    if (e.target.value === 'all') setIsTestFilter(null);
                    else setIsTestFilter(e.target.value === 'test');
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All</option>
                  <option value="test">Test Only</option>
                  <option value="production">Production Only</option>
                </select>
              </div>
              <button
                onClick={fetchScheduledEmails}
                className="ml-auto px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Scheduled Emails Table */}
          {scheduledEmailsLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
              <span className="ml-3 text-gray-600">Loading scheduled emails...</span>
            </div>
          ) : scheduledEmails.length === 0 ? (
            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6 text-center">
              <p className="text-gray-600">No scheduled emails found.</p>
            </div>
          ) : (
            <div className="bg-white border-2 border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Template</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled At</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {scheduledEmails.map((email) => (
                      <tr key={email.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{email.email_address}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {email.template_snapshot?.name || 'Unknown'} v{email.template_version}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(email.scheduled_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(email.status)}`}>
                            {email.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {email.is_test ? (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                              Test
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                              Production
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {(email.status === 'pending' || email.status === 'scheduled') && (
                            <button
                              onClick={() => handleCancelEmail(email.id)}
                              className="px-3 py-1.5 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1.5 text-sm"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Flows Tab - Show all flows with structure */}
      {activeTab === 'flows' && (
        <div className="space-y-6">
          {/* Summary Section */}
          {!flowsLoading && flows.length > 0 && (
            <div className="bg-white border-2 border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Flow Overview</h3>
                <button
                  onClick={() => {
                    fetchFlows();
                    fetchFlowStats();
                  }}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
                  disabled={flowsLoading || flowStatsLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${(flowsLoading || flowStatsLoading) ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Flows:</span>
                  <span className="ml-2 font-semibold text-gray-900">{flows.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Active Flows:</span>
                  <span className="ml-2 font-semibold text-green-600">
                    {flows.filter(f => f.is_active).length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Active Instances:</span>
                  <span className="ml-2 font-semibold text-blue-600">
                    {Object.values(flowStats).reduce((sum, stat) => sum + stat.activeInstances, 0)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Total Scheduled:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {Object.values(flowStats).reduce((sum, stat) => sum + stat.totalEmails, 0)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {flowsLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
              <span className="ml-3 text-gray-600">Loading flows...</span>
            </div>
          ) : flows.length === 0 ? (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center">
              <p className="text-yellow-800">No flows found. Create flows using migrations.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {flows.map((flow) => {
                const details = flowDetailsMap[flow.id];
                const isLoading = flowDetailsLoading[flow.id];
                const steps = details?.steps || [];

                return (
                  <div
                    key={flow.id}
                    className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-sm"
                  >
                    {/* Flow Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="w-6 h-6 text-purple-600" />
                          <h2 className="text-2xl font-bold text-gray-900">{flow.name}</h2>
                          {flow.is_active ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded">
                              Inactive
                            </span>
                          )}
                          {flowStats[flow.id] && flowStats[flow.id].activeInstances > 0 && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                              {flowStats[flow.id].activeInstances} Active Instance{flowStats[flow.id].activeInstances !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        {flow.description && (
                          <p className="text-gray-600 mb-2">{flow.description}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Trigger Event:</span>
                            <span className="ml-2 font-semibold text-gray-900">{flow.trigger_event}</span>
                          </div>
                          {flow.cancel_events && flow.cancel_events.length > 0 && (
                            <div>
                              <span className="text-gray-600">Cancel Events:</span>
                              <span className="ml-2 font-semibold text-gray-900">
                                {flow.cancel_events.join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Flow Statistics */}
                    {flowStats[flow.id] && flowStats[flow.id].totalEmails > 0 && (
                      <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Flow Statistics</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="text-xs text-gray-600 mb-1">Total Emails</div>
                            <div className="text-lg font-bold text-gray-900">{flowStats[flow.id].totalEmails}</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="text-xs text-gray-600 mb-1">Pending</div>
                            <div className="text-lg font-bold text-yellow-600">{flowStats[flow.id].pending}</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="text-xs text-gray-600 mb-1">Scheduled</div>
                            <div className="text-lg font-bold text-blue-600">{flowStats[flow.id].scheduled}</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="text-xs text-gray-600 mb-1">Sent</div>
                            <div className="text-lg font-bold text-green-600">{flowStats[flow.id].sent}</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="text-xs text-gray-600 mb-1">Cancelled</div>
                            <div className="text-lg font-bold text-gray-600">{flowStats[flow.id].cancelled}</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="text-xs text-gray-600 mb-1">Failed</div>
                            <div className="text-lg font-bold text-red-600">{flowStats[flow.id].failed}</div>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Active Instances:</span>
                            <span className="ml-2 font-semibold text-gray-900">{flowStats[flow.id].activeInstances}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Unique Users:</span>
                            <span className="ml-2 font-semibold text-gray-900">{flowStats[flow.id].uniqueUsers}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Test Emails:</span>
                            <span className="ml-2 font-semibold text-yellow-700">{flowStats[flow.id].testEmails}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Production:</span>
                            <span className="ml-2 font-semibold text-blue-700">{flowStats[flow.id].productionEmails}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Flow Steps */}
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
                        <span className="ml-2 text-gray-600">Loading steps...</span>
                      </div>
                    ) : steps.length === 0 ? (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                        <p className="text-gray-600">No steps configured for this flow.</p>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Email Sequence ({steps.length} emails)
                        </h3>
                        <div className="space-y-4">
                          {steps.map((step, index) => {
                            // Calculate production timing (1440 minutes = 1 day)
                            const productionDays = step.time_offset_minutes / 1440;
                            const productionHours = step.time_offset_minutes / 60;
                            const isImmediate = step.time_offset_minutes === 0;
                            
                            return (
                              <div key={step.id}>
                                <div className="flex items-start gap-4">
                                  {/* Step Number */}
                                  <div className="flex-shrink-0 w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                                    {step.step_order}
                                  </div>
                                  
                                  {/* Step Content */}
                                  <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 mb-1">
                                          {step.subject_override || 'Email Step'}
                                        </h4>
                                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                            step.email_type === 'marketing'
                                              ? 'bg-pink-100 text-pink-800'
                                              : 'bg-blue-100 text-blue-800'
                                          }`}>
                                            {step.email_type}
                                          </span>
                                          <span className="text-gray-500">
                                            Template Version: {step.template_version}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Timing Information */}
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                        <div>
                                          <span className="text-gray-600 font-medium">Test Mode:</span>
                                          <div className="mt-1">
                                            {isImmediate ? (
                                              <span className="text-purple-600 font-semibold">Immediate (0 min)</span>
                                            ) : (
                                              <span className="text-purple-600 font-semibold">
                                                +{step.time_offset_minutes} minute{step.time_offset_minutes !== 1 ? 's' : ''}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <div>
                                          <span className="text-gray-600 font-medium">Production:</span>
                                          <div className="mt-1">
                                            {isImmediate ? (
                                              <span className="text-gray-900 font-semibold">Immediate</span>
                                            ) : productionDays >= 1 ? (
                                              <span className="text-gray-900 font-semibold">
                                                +{productionDays.toFixed(1)} day{productionDays !== 1 ? 's' : ''}
                                                <span className="text-gray-500 ml-1">
                                                  ({step.time_offset_minutes} min)
                                                </span>
                                              </span>
                                            ) : (
                                              <span className="text-gray-900 font-semibold">
                                                +{productionHours.toFixed(1)} hour{productionHours !== 1 ? 's' : ''}
                                                <span className="text-gray-500 ml-1">
                                                  ({step.time_offset_minutes} min)
                                                </span>
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Arrow between steps */}
                                {index < steps.length - 1 && (
                                  <div className="flex justify-center my-2">
                                    <div className="text-purple-600 text-2xl">↓</div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Flow Testing Tab */}
      {activeTab === 'flow-testing' && (
        <div className="space-y-6">
          {flowsLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
              <span className="ml-3 text-gray-600">Loading flows...</span>
            </div>
          ) : (
            <>
              {/* Flow Selection and Testing */}
              <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Test Email Flow</h2>

                <div className="space-y-4">
                  {/* Flow Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Flow *
                    </label>
                    <select
                      value={selectedFlowId}
                      onChange={(e) => {
                        setSelectedFlowId(e.target.value);
                        setFlowMessage(null);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">Select a flow...</option>
                      {flows.map((flow) => (
                        <option key={flow.id} value={flow.id}>
                          {flow.name} - {flow.description || flow.trigger_event}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Flow Details */}
                  {selectedFlow && flowSteps.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Flow Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Trigger Event:</span>
                          <span className="ml-2 font-semibold text-gray-900">{selectedFlow.trigger_event}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Steps:</span>
                          <span className="ml-2 font-semibold text-gray-900">{flowSteps.length} emails</span>
                        </div>
                        <div className="md:col-span-2">
                          <span className="text-gray-600">Time Offsets (Test Mode):</span>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {flowSteps.map((step) => (
                              <span
                                key={step.id}
                                className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded"
                              >
                                Step {step.step_order}: +{step.time_offset_minutes} min
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* User Selector (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      User (Optional - for context only)
                    </label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">No user selected</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.email} {user.firstName ? `(${user.firstName})` : ''}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      User selection is for context only. All emails will be sent to the test email address below.
                    </p>
                  </div>

                  {/* Test Email Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Test Email Address *
                    </label>
                    <input
                      type="email"
                      value={flowTestEmail}
                      onChange={(e) => setFlowTestEmail(e.target.value)}
                      placeholder="anthsalt+test-sequence@gmail.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      <strong>All emails in this flow will be sent to:</strong>{' '}
                      <span className="font-mono text-purple-600">{flowTestEmail}</span>
                    </p>
                  </div>

                  {/* Message */}
                  {flowMessage && (
                    <div
                      className={`p-4 rounded-lg ${
                        flowMessage.type === 'success'
                          ? 'bg-green-50 border-2 border-green-200 text-green-800'
                          : 'bg-red-50 border-2 border-red-200 text-red-800'
                      }`}
                    >
                      {flowMessage.text}
                    </div>
                  )}

                  {/* Last Triggered Flow Instance */}
                  {lastTriggeredFlowInstance && (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-sm font-semibold text-blue-900 mb-1">
                            Last Triggered Flow Instance
                          </h3>
                          <div className="text-xs text-blue-700 space-y-1">
                            <div>
                              <span className="font-medium">Email:</span>{' '}
                              <span className="font-mono">{lastTriggeredFlowInstance.emailAddress}</span>
                            </div>
                            <div>
                              <span className="font-medium">Emails Scheduled:</span>{' '}
                              {lastTriggeredFlowInstance.count}
                            </div>
                            <div className="text-xs text-blue-600 font-mono break-all">
                              Trigger ID: {lastTriggeredFlowInstance.flowTriggerId}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCancelFlow(lastTriggeredFlowInstance.flowTriggerId)}
                          disabled={flowCancelLoading}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {flowCancelLoading ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <Square className="w-4 h-4" />
                              Cancel This Instance
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={handleTriggerFlow}
                      disabled={flowTriggerLoading || !selectedFlowId || !flowTestEmail}
                      className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {flowTriggerLoading ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Triggering...
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5" />
                          Trigger Flow
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleCancelFlow()}
                      disabled={flowCancelLoading || !selectedFlowId || !selectedUserId}
                      className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {flowCancelLoading ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <Square className="w-5 h-5" />
                          Cancel Flow (by User)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Flow Steps Visualization */}
              {selectedFlow && flowSteps.length > 0 && (
                <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Flow Steps</h2>
                  <div className="space-y-3">
                    {flowSteps.map((step, index) => (
                      <div
                        key={step.id}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex-shrink-0 w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                          {step.step_order}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">
                              {step.subject_override || 'Email Step'}
                            </span>
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-semibold rounded">
                              +{step.time_offset_minutes} min
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                              step.email_type === 'marketing'
                                ? 'bg-pink-100 text-pink-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {step.email_type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Template Version: {step.template_version} | Step Order: {step.step_order}
                          </p>
                        </div>
                        {index < flowSteps.length - 1 && (
                          <div className="flex-shrink-0 text-purple-600">
                            ↓
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {selectedTemplate && previewHtml && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                Preview: {selectedTemplate.name} v{selectedTemplate.version}
              </h3>
              <button
                onClick={() => {
                  setSelectedTemplate(null);
                  setPreviewHtml(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <iframe
                srcDoc={previewHtml}
                className="w-full h-full border border-gray-200 rounded"
                style={{ minHeight: '500px' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
