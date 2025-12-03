'use client'

import { TrackedLink } from '@/app/components/TrackedLink'

export const ContactUsSection = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">
          Contact Us
        </h2>
        <p className="text-gray-700 font-medium mb-6">
          Have a question or need help? We're here for you!
        </p>
      </div>

      <div className="p-6 rounded-[1.5rem] bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-200">
        <p className="text-gray-700 font-medium mb-4">
          Reach out to us through our contact form and we'll get back to you as soon as possible.
        </p>
        <TrackedLink
          href="/contact"
          className="inline-block px-6 py-3 rounded-[1rem] bg-gradient-to-br from-purple-600 to-pink-600 text-white font-black hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-[0_4px_0_0_rgba(147,51,234,0.5)] hover:translate-y-1 hover:shadow-[0_2px_0_0_rgba(147,51,234,0.5)]"
          eventName="User Clicked Contact Us Link"
          linkId="settings-contact-us-link"
          eventProperties={{
            'Link Section': 'Settings Page',
            'Link Position': 'Contact Us Tab',
            'Link Type': 'Page Link',
            'Link Text': 'Go to Contact Page',
            'Page Route': '/dashboard/settings',
          }}
        >
          Go to Contact Page →
        </TrackedLink>
      </div>
    </div>
  )
}

