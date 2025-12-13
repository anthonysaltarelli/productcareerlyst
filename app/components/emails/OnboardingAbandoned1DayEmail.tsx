import * as React from 'react';

interface OnboardingAbandoned1DayEmailProps {
  firstName?: string | null;
  baseUrl?: string;
  unsubscribeUrl?: string;
}

export const OnboardingAbandoned1DayEmail = ({
  firstName,
  baseUrl = 'https://productcareerlyst.com',
  unsubscribeUrl,
}: OnboardingAbandoned1DayEmailProps) => {
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
        I noticed you still haven't finished setting up your Product Careerlyst account yet.
      </p>

      <p style={{ margin: '0 0 12px 0' }}>
        I get it - life gets busy. But I wanted to let you know what you're missing out on:
      </p>

      <ul style={{ margin: '0 0 16px 0', paddingLeft: '20px' }}>
        <li style={{ marginBottom: '4px' }}>A personalized career plan based on your goals</li>
        <li style={{ marginBottom: '4px' }}>
          Powerful tools to get referrals, ace interviews, and land offers
        </li>
        <li style={{ marginBottom: '4px' }}>
          Dozens of comprehensive video lessons to help you implement a targeted career strategy
        </li>
        <li>And much more...</li>
      </ul>

      <p style={{ margin: '0 0 16px 0' }}>It takes less than 2 minutes to complete setup.</p>

      <p style={{ margin: '0 0 16px 0' }}>
        <a href={`${baseUrl}/onboarding`} style={{ color: '#1a73e8' }}>
          Complete your setup →
        </a>
      </p>

      <p style={{ margin: '0 0 16px 0' }}>
        Questions? Reply directly to this email - I'm happy to help.
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
