'use client';

import { useState, useEffect, Fragment } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Mail, ChevronDown, ChevronUp } from 'lucide-react';

interface User {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  firstName: string | null;
  lastName: string | null;
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
}

interface EmailHistory {
  id: string;
  user_id: string;
  email: string;
  resend_email_id: string | null;
  status: string;
  error_message: string | null;
  sent_at: string;
  created_at: string;
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Never';
  
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
    timeZoneName: 'short',
  };
  
  return date.toLocaleString('en-US', options);
};

export default function NPSPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [emailHistory, setEmailHistory] = useState<Record<string, EmailHistory[]>>({});
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/nps/users');
        
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        setUsers(data.users || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const fetchEmailHistory = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/nps/email-history?userId=${userId}`);
    
      if (!response.ok) {
        throw new Error('Failed to fetch email history');
      }

      const data = await response.json();
      setEmailHistory((prev) => ({
        ...prev,
        [userId]: data.emailHistory || [],
      }));
    } catch (err) {
      console.error('Error fetching email history:', err);
    }
  };

  const handleSendEmail = async (user: User) => {
    if (!user.email || !user.id) {
      setMessage({
        type: 'error',
        text: 'User email or ID is missing',
      });
      return;
    }

    setIsSending(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/nps/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email.trim(),
          userId: user.id.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      setMessage({
        type: 'success',
        text: `NPS email sent successfully to ${user.email}`,
      });
      
      // Refresh email history for this user
      await fetchEmailHistory(user.id);
      
      // Clear message after 5 seconds
      setTimeout(() => {
        setMessage(null);
      }, 5000);
    } catch (error) {
      console.error('Error sending NPS email:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to send email',
      });
    } finally {
      setIsSending(false);
    }
  };

  const toggleUserExpanded = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
      // Fetch email history when expanding
      if (!emailHistory[userId]) {
        fetchEmailHistory(userId);
      }
    }
    setExpandedUsers(newExpanded);
  };

  if (loading) {
    return (
      <div className="px-4 py-6 md:p-12">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-6 md:p-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800 font-semibold">Error</p>
          <p className="text-red-600 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 md:p-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">NPS Email Management</h1>
        <p className="text-gray-600">Send NPS emails to users and track send history</p>
            </div>

            {/* Message Display */}
            {message && (
              <div
          className={`mb-6 p-4 rounded-lg border-2 flex items-center gap-3 ${
                  message.type === 'success'
                    ? 'bg-green-50 border-green-300 text-green-800'
                    : 'bg-red-50 border-red-300 text-red-800'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                )}
                <p className="font-semibold">{message.text}</p>
              </div>
            )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">All Users</h2>
          <p className="text-sm text-gray-600 mt-1">
            Showing {users.length} users
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  First Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Signed In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isExpanded = expandedUsers.has(user.id);
                  const history = emailHistory[user.id] || [];
                  
                  return (
                    <Fragment key={user.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.firstName || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.lastName || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.subscriptionPlan === 'accelerate' 
                              ? 'bg-purple-100 text-purple-800'
                              : user.subscriptionPlan === 'learn'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {user.subscriptionPlan || 'None'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.subscriptionStatus === 'active'
                              ? 'bg-green-100 text-green-800'
                              : user.subscriptionStatus === 'trialing'
                              ? 'bg-yellow-100 text-yellow-800'
                              : user.subscriptionStatus === 'canceled'
                              ? 'bg-red-100 text-red-800'
                              : user.subscriptionStatus
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {user.subscriptionStatus || 'None'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(user.lastSignInAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
            <button
                              onClick={() => handleSendEmail(user)}
                              disabled={isSending}
                              className="px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-xs font-medium flex items-center gap-1"
            >
                              {isSending ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                  Sending...
                                </>
                              ) : (
                                <>
                                  <Mail className="w-3 h-3" />
                                  Send Email
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => toggleUserExpanded(user.id)}
                              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-xs font-medium flex items-center gap-1"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="w-3 h-3" />
                                  Hide History
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3 h-3" />
                                  Show History
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="px-6 py-4 bg-gray-50">
                            <div className="space-y-2">
                              <h3 className="font-semibold text-gray-900 text-sm mb-2">
                                Email Send History ({history.length})
                              </h3>
                              {history.length === 0 ? (
                                <p className="text-sm text-gray-500">No emails sent yet</p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                          Sent At
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                          Status
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                          Resend ID
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                          Error
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {history.map((email) => (
                                        <tr key={email.id}>
                                          <td className="px-4 py-2 text-sm text-gray-900">
                                            {formatDate(email.sent_at)}
                                          </td>
                                          <td className="px-4 py-2 text-sm">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                              email.status === 'sent'
                                                ? 'bg-green-100 text-green-800'
                                                : email.status === 'failed'
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                              {email.status}
                                            </span>
                                          </td>
                                          <td className="px-4 py-2 text-sm text-gray-900 font-mono">
                                            {email.resend_email_id || '-'}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-gray-900">
                                            {email.error_message ? (
                                              <span className="text-red-600 text-xs">
                                                {email.error_message}
                </span>
              ) : (
                                              '-'
              )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-purple-900 mb-2">About NPS Emails</h3>
          <ul className="text-sm text-purple-800 space-y-1 list-disc list-inside">
            <li>Emails are sent from: Anthony from Product Careerlyst &lt;team@productcareerlyst.com&gt;</li>
            <li>Subject line: "Thank you + one quick question"</li>
            <li>Rating clicks will redirect to /feedback with source=email</li>
            <li>If the user has a first name in their profile, it will be personalized</li>
          <li>All email sends are logged in the database with delivery status</li>
          </ul>
      </div>
    </div>
  );
}
