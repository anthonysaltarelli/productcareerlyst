'use client';

import { useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function NPSPage() {
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !userId.trim()) {
      setMessage({
        type: 'error',
        text: 'Please fill in all required fields',
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/nps/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          userId: userId.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      setMessage({
        type: 'success',
        text: 'Test email sent successfully!',
      });
      
      // Clear form after success
      setEmail('');
      setUserId('');
    } catch (error) {
      console.error('Error sending test email:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to send email',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-4 py-6 md:p-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">NPS Email</h1>
        <p className="text-gray-600">Send test NPS emails to users</p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                disabled={isLoading}
              />
            </div>

            {/* User ID Field */}
            <div>
              <label
                htmlFor="userId"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                User ID <span className="text-red-500">*</span>
              </label>
              <input
                id="userId"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="User UUID"
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-mono text-sm"
                disabled={isLoading}
              />
              <p className="mt-2 text-sm text-gray-500">
                The user ID will be used to link the rating to the user account
              </p>
            </div>

            {/* Message Display */}
            {message && (
              <div
                className={`p-4 rounded-lg border-2 flex items-center gap-3 ${
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !email.trim() || !userId.trim()}
              className={`
                w-full px-6 py-3 rounded-lg font-semibold text-white
                transition-all duration-200
                ${
                  isLoading || !email.trim() || !userId.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
                }
              `}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Sending...
                </span>
              ) : (
                'Send Test Email'
              )}
            </button>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-purple-900 mb-2">About NPS Emails</h3>
          <ul className="text-sm text-purple-800 space-y-1 list-disc list-inside">
            <li>Emails are sent from: Anthony from Product Careerlyst &lt;team@productcareerlyst.com&gt;</li>
            <li>Subject line: "Thank you + one quick question"</li>
            <li>Rating clicks will redirect to /feedback with source=email</li>
            <li>If the user has a first name in their profile, it will be personalized</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

