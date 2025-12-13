import * as React from 'react';

interface OnboardingAbandoned15MinEmailProps {
  firstName?: string | null;
  baseUrl?: string;
  unsubscribeUrl?: string;
}

export const OnboardingAbandoned15MinEmail = ({
  firstName,
  baseUrl = 'https://productcareerlyst.com',
  unsubscribeUrl,
}: OnboardingAbandoned15MinEmailProps) => {
  const greeting = firstName ? `Hey ${firstName},` : 'Hey there,';

  return (
    <div
      style={{
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        lineHeight: '1.6',
        color: '#222222',
        maxWidth: '600px',
      }}
    >
      <p style={{ margin: '0 0 16px 0' }}>{greeting}</p>

      <p style={{ margin: '0 0 16px 0' }}>
        I saw you started setting up your Product Careerlyst account but didn't finish.
      </p>

      <p style={{ margin: '0 0 16px 0' }}>
        No worries - it happens! The setup only takes about 2 minutes, and once you're done,
        you'll get a personalized plan designed specifically for your career goals.
      </p>

      <p style={{ margin: '0 0 16px 0' }}>
        <a href={`${baseUrl}/onboarding`} style={{ color: '#1a73e8' }}>
          Finish setting up →
        </a>
      </p>

      <p style={{ margin: '0 0 16px 0' }}>
        If you ran into any issues or have questions, just reply to this email - I read every
        response and would be happy to help.
      </p>

      <p style={{ margin: '0 0 16px 0' }}>
        Best,<br />
        Anthony Saltarelli<br />
        Founder, Product Careerlyst
      </p>

      {unsubscribeUrl && (
        <p style={{ margin: '24px 0 0 0', fontSize: '12px', color: '#999999' }}>
          <a href={unsubscribeUrl} style={{ color: '#999999' }}>
            Unsubscribe from marketing emails
          </a>
        </p>
      )}
    </div>
  );
};
