'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TrackedButton } from '@/app/components/TrackedButton';

interface EmailPreferences {
  id: string;
  user_id: string;
  email_address: string;
  marketing_emails_enabled: boolean;
  unsubscribed_at: string | null;
  unsubscribe_reason: string | null;
  email_topics: string[];
  convertkit_subscriber_id: string | null;
  convertkit_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

interface TokenData {
  userId: string;
  emailAddress: string;
  used: boolean;
}

export default function UnsubscribePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [emailTopics, setEmailTopics] = useState<string[]>([]);
  const [unsubscribeReason, setUnsubscribeReason] = useState('');

  // Available email topics
  const availableTopics = [
    { id: 'trial_sequence', label: 'Trial sequence emails' },
    { id: 'product_updates', label: 'Product updates' },
    { id: 'newsletter', label: 'Newsletter (Product Careerlyst Newsletter)' },
    { id: 'feature_announcements', label: 'Feature announcements' },
  ];

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const response = await fetch(`/api/email/unsubscribe/${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to load unsubscribe page');
          setLoading(false);
          return;
        }

        setTokenData(data.token);
        setPreferences(data.preferences);
        setEmailTopics(data.preferences?.email_topics || []);
        setLoading(false);
      } catch (err) {
        setError('Failed to load unsubscribe page');
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/email/unsubscribe/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: unsubscribeReason || null,
          email_topics: emailTopics,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to unsubscribe');
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setPreferences(data.preferences);
      setSubmitting(false);
    } catch (err) {
      setError('Failed to unsubscribe');
      setSubmitting(false);
    }
  };

  const handleResubscribe = async () => {
    if (!token) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/email/resubscribe/${token}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to resubscribe');
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setPreferences(data.preferences);
      setSubmitting(false);
    } catch (err) {
      setError('Failed to resubscribe');
      setSubmitting(false);
    }
  };

  const toggleTopic = (topicId: string) => {
    setEmailTopics((prev) => {
      if (prev.includes(topicId)) {
        return prev.filter((id) => id !== topicId);
      } else {
        return [...prev, topicId];
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-700 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !tokenData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-[2rem] p-8 shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200 text-center">
          <h1 className="text-2xl font-black text-gray-900 mb-4">Invalid Link</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <TrackedButton
            href="/"
            className="px-6 py-3 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-[1rem] font-semibold"
            eventName="User Clicked Home Button"
            buttonId="unsubscribe-error-home-button"
            eventProperties={{
              'Button Section': 'Error Page',
              'Button Position': 'Center',
              'Button Text': 'Go to Home',
              'Button Type': 'Primary CTA',
              'Button Context': 'After error message',
            }}
          >
            Go to Home
          </TrackedButton>
        </div>
      </div>
    );
  }

  const isUnsubscribed = preferences?.marketing_emails_enabled === false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-8 shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
          {success ? (
            <>
              <h1 className="text-3xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent mb-4">
                {isUnsubscribed ? 'Successfully Unsubscribed' : 'Successfully Resubscribed'}
              </h1>
              <p className="text-gray-700 mb-6">
                {isUnsubscribed
                  ? 'You have been unsubscribed from marketing emails. You will no longer receive promotional emails from Product Careerlyst.'
                  : 'You have been resubscribed to marketing emails. You will start receiving promotional emails from Product Careerlyst again.'}
              </p>
              {!isUnsubscribed && (
                <TrackedButton
                  onClick={handleUnsubscribe}
                  className="px-6 py-3 bg-gradient-to-br from-red-500 to-orange-500 text-white rounded-[1rem] font-semibold mb-4"
                  eventName="User Clicked Unsubscribe Button"
                  buttonId="unsubscribe-success-unsubscribe-button"
                  eventProperties={{
                    'Button Section': 'Success Page',
                    'Button Position': 'After success message',
                    'Button Text': 'Unsubscribe Again',
                    'Button Type': 'Secondary CTA',
                    'Button Context': 'After resubscribe success',
                  }}
                >
                  Unsubscribe Again
                </TrackedButton>
              )}
              {isUnsubscribed && (
                <TrackedButton
                  onClick={handleResubscribe}
                  className="px-6 py-3 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-[1rem] font-semibold mb-4"
                  eventName="User Clicked Resubscribe Button"
                  buttonId="unsubscribe-success-resubscribe-button"
                  eventProperties={{
                    'Button Section': 'Success Page',
                    'Button Position': 'After success message',
                    'Button Text': 'Resubscribe',
                    'Button Type': 'Primary CTA',
                    'Button Context': 'After unsubscribe success',
                  }}
                >
                  Resubscribe to Marketing Emails
                </TrackedButton>
              )}
            </>
          ) : (
            <>
              <h1 className="text-3xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent mb-4">
                Email Preferences
              </h1>
              <p className="text-gray-700 mb-6">
                Manage your email preferences for <strong>{tokenData?.emailAddress}</strong>
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-[1rem]">
                  <p className="text-red-700 font-semibold">{error}</p>
                </div>
              )}

              {/* Topic-Level Preferences */}
              <div className="mb-6">
                <h2 className="text-xl font-black text-gray-900 mb-4">Email Topics</h2>
                <p className="text-gray-600 text-sm mb-4">
                  Choose which types of emails you'd like to receive:
                </p>
                <div className="space-y-3">
                  {availableTopics.map((topic) => (
                    <label
                      key={topic.id}
                      className="flex items-center p-4 bg-gray-50 rounded-[1rem] cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={emailTopics.includes(topic.id)}
                        onChange={() => toggleTopic(topic.id)}
                        className="w-5 h-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500 mr-3"
                      />
                      <span className="text-gray-700 font-medium">{topic.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Unsubscribe Reason (Optional) */}
              <div className="mb-6">
                <label htmlFor="reason" className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason for unsubscribing (optional)
                </label>
                <textarea
                  id="reason"
                  value={unsubscribeReason}
                  onChange={(e) => setUnsubscribeReason(e.target.value)}
                  placeholder="Help us improve by sharing why you're unsubscribing..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-[1rem] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <TrackedButton
                  onClick={handleUnsubscribe}
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-br from-red-500 to-orange-500 text-white rounded-[1rem] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  eventName="User Clicked Unsubscribe Button"
                  buttonId="unsubscribe-page-unsubscribe-button"
                  eventProperties={{
                    'Button Section': 'Unsubscribe Page',
                    'Button Position': 'Bottom Actions',
                    'Button Text': 'Unsubscribe from Marketing Emails',
                    'Button Type': 'Primary CTA',
                    'Button Context': 'After topic preferences',
                  }}
                >
                  {submitting ? 'Processing...' : 'Unsubscribe from Marketing Emails'}
                </TrackedButton>
                {isUnsubscribed && (
                  <TrackedButton
                    onClick={handleResubscribe}
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-[1rem] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    eventName="User Clicked Resubscribe Button"
                    buttonId="unsubscribe-page-resubscribe-button"
                    eventProperties={{
                      'Button Section': 'Unsubscribe Page',
                      'Button Position': 'Bottom Actions',
                      'Button Text': 'Resubscribe',
                      'Button Type': 'Secondary CTA',
                      'Button Context': 'After topic preferences',
                    }}
                  >
                    {submitting ? 'Processing...' : 'Resubscribe'}
                  </TrackedButton>
                )}
              </div>
            </>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t-2 border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              <a
                href="https://productcareerlyst.com"
                className="text-purple-600 hover:text-purple-700 font-semibold"
              >
                Product Careerlyst
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

