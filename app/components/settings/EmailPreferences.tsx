'use client';

import { useState, useEffect } from 'react';
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

interface EmailPreferencesProps {
  stats: any;
  subscription: any;
  userCreatedAt?: string | null;
  featureFlags: any;
}

export const EmailPreferences = ({
  stats,
  subscription,
  userCreatedAt,
  featureFlags,
}: EmailPreferencesProps) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [marketingEnabled, setMarketingEnabled] = useState(true);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch('/api/email/preferences');
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to load email preferences');
          setLoading(false);
          return;
        }

        setPreferences(data.preferences);
        setMarketingEnabled(data.preferences?.marketing_emails_enabled ?? true);
        setLoading(false);
      } catch (err) {
        setError('Failed to load email preferences');
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/email/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          marketing_emails_enabled: marketingEnabled,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update preferences');
        setSaving(false);
        return;
      }

      setSuccess(true);
      setPreferences(data.preferences);
      setSaving(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to update preferences');
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-700 font-semibold">Loading email preferences...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-900 mb-2">Email Notifications</h2>
        <p className="text-gray-600 text-sm">
          Manage your email preferences and notification settings
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-[1rem]">
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-[1rem]">
          <p className="text-green-700 font-semibold">Preferences updated successfully!</p>
        </div>
      )}

      {/* Global Marketing Toggle */}
      <div className="mb-8">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-[1rem]">
          <div>
            <h3 className="text-lg font-black text-gray-900 mb-1">Marketing Emails</h3>
            <p className="text-sm text-gray-600">
              Receive promotional emails, product updates, and newsletters
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={marketingEnabled}
              onChange={(e) => setMarketingEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-br peer-checked:from-purple-500 peer-checked:to-pink-500"></div>
          </label>
        </div>
        {preferences?.unsubscribed_at && (
          <p className="mt-2 text-sm text-gray-600">
            You unsubscribed on {new Date(preferences.unsubscribed_at).toLocaleDateString()}
          </p>
        )}
      </div>


      {/* Save Button */}
      <div className="flex justify-end">
        <TrackedButton
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-[1rem] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          eventName="User Clicked Save Email Preferences Button"
          buttonId="settings-email-preferences-save-button"
          eventProperties={{
            'Button Section': 'Email Preferences',
            'Button Position': 'Bottom Right',
            'Button Text': 'Save Preferences',
            'Button Type': 'Primary CTA',
            'Button Context': 'After preferences form',
          }}
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </TrackedButton>
      </div>
    </div>
  );
};

