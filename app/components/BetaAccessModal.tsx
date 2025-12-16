'use client';

import { X, FlaskConical, Mail } from 'lucide-react';

interface BetaAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

export function BetaAccessModal({
  isOpen,
  onClose,
  featureName = 'AI Mock Interview'
}: BetaAccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-purple-600 to-pink-500 px-6 py-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
            <FlaskConical className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">
            Beta Feature
          </h2>
          <p className="text-purple-100 font-medium">
            {featureName} is currently in beta testing
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 text-center mb-6 leading-relaxed">
            We&apos;re testing this feature with a small group of users to make sure it&apos;s perfect before launching to everyone.
          </p>

          <div className="bg-purple-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-700 text-center">
              <strong className="text-purple-700">Interested in early access?</strong>
              <br />
              Reach out to us and we&apos;ll add you to the beta!
            </p>
          </div>

          <a
            href="mailto:team@productcareerlyst.com?subject=AI%20Mock%20Interview%20Beta%20Access%20Request&body=Hi%20team%2C%0A%0AI'd%20love%20to%20get%20early%20access%20to%20the%20AI%20Mock%20Interview%20feature.%0A%0AThanks!"
            className="flex items-center justify-center gap-2 w-full px-6 py-4 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-lg hover:opacity-90 transition-opacity"
          >
            <Mail className="w-5 h-5" />
            Email team@productcareerlyst.com
          </a>

          <button
            onClick={onClose}
            className="w-full mt-3 px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
          >
            Maybe Later
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
