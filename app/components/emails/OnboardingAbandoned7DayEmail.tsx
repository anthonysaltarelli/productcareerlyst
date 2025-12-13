import * as React from 'react';

interface OnboardingAbandoned7DayEmailProps {
  firstName?: string | null;
  baseUrl?: string;
  unsubscribeUrl?: string;
}

export const OnboardingAbandoned7DayEmail = ({
  firstName,
  baseUrl = 'https://productcareerlyst.com',
  unsubscribeUrl,
}: OnboardingAbandoned7DayEmailProps) => {
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
        Your Product Careerlyst account is incomplete, and I clean up inactive accounts after 7
        days.
      </p>

      <p style={{ margin: '0 0 16px 0' }}>
        If you still want access the PM career tools that have helped hundreds of product managers
        land their dream roles, now's the time to finish setting up.
      </p>

      <p style={{ margin: '0 0 16px 0' }}>
        <a href={`${baseUrl}/onboarding`} style={{ color: '#1a73e8' }}>
          Finish setup now →
        </a>
      </p>

      <p style={{ margin: '0 0 16px 0' }}>
        If landing a product management offer isn't your focus anymore, no worries - just ignore
        this email and your account will be removed.
      </p>

      <p style={{ margin: '0 0 16px 0' }}>
        But if you're serious about your PM career, I'd strongly encourage you to finish setting up.
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
