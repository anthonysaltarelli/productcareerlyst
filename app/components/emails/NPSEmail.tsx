import * as React from 'react';

interface NPSEmailProps {
  firstName?: string | null;
  userId: string;
  baseUrl?: string;
}

export const NPSEmail = ({
  firstName,
  userId,
  baseUrl = 'https://productcareerlyst.com',
}: NPSEmailProps) => {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,';
  const feedbackUrl = `${baseUrl}/feedback?user_id=${userId}&source=email`;

  return (
    <table
      width="100%"
      cellPadding="0"
      cellSpacing="0"
      style={{
        fontFamily: 'system-ui, -apple-system, Arial, sans-serif',
        backgroundColor: '#fef3e7',
        margin: '0',
        padding: '0',
      }}
    >
      <tr>
        <td align="center" style={{ padding: '20px 0' }}>
          <table
            width="600"
            cellPadding="0"
            cellSpacing="0"
            style={{
              maxWidth: '600px',
              width: '100%',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              overflow: 'hidden',
            }}
          >
            {/* Header with gradient background */}
            <tr>
              <td
                bgcolor="#a855f7"
                style={{
                  background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                  backgroundColor: '#a855f7', // Fallback for clients that don't support gradients
                  padding: '32px 24px',
                  textAlign: 'center',
                }}
              >
                <h1
                  style={{
                    color: '#ffffff',
                    fontSize: '24px',
                    fontWeight: '800',
                    margin: '0',
                    lineHeight: '1.3',
                  }}
                >
                  Thank you + one quick question
                </h1>
              </td>
            </tr>

            {/* Content */}
            <tr>
              <td style={{ padding: '32px 24px' }}>
                {/* Greeting */}
                <p
                  style={{
                    color: '#1f2937',
                    fontSize: '16px',
                    lineHeight: '1.6',
                    margin: '0 0 20px 0',
                  }}
                >
                  {greeting}
                </p>

                {/* Thank you message */}
                <p
                  style={{
                    color: '#374151',
                    fontSize: '16px',
                    lineHeight: '1.6',
                    margin: '0 0 24px 0',
                  }}
                >
                  Thank you for signing up for a Product Careerlyst account. We're excited to help you grow in your product career.
                </p>

                {/* Question */}
                <p
                  style={{
                    color: '#1f2937',
                    fontSize: '18px',
                    fontWeight: '700',
                    margin: '0 0 20px 0',
                  }}
                >
                  Quick question: How likely are you to recommend us to a friend?
                </p>

                {/* Labels */}
                <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '12px' }}>
                  <tr>
                    <td width="50%" style={{ padding: '0 4px' }}>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: '700',
                          color: '#374151',
                        }}
                      >
                        Not likely
                      </span>
                    </td>
                    <td width="50%" align="right" style={{ padding: '0 4px' }}>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: '700',
                          color: '#374151',
                        }}
                      >
                        Very likely
                      </span>
                    </td>
                  </tr>
                </table>

                {/* Rating buttons - using table for email compatibility */}
                <table
                  width="100%"
                  cellPadding="4"
                  cellSpacing="4"
                  style={{ marginBottom: '20px' }}
                >
                  <tr>
                    {Array.from({ length: 11 }, (_, i) => (
                      <td
                        key={i}
                        align="center"
                        style={{
                          width: `${100 / 11}%`,
                          padding: '4px',
                        }}
                      >
                        <a
                          href={`${feedbackUrl}&rating=${i}`}
                          style={{
                            display: 'block',
                            textAlign: 'center',
                            padding: '10px 4px',
                            backgroundColor: '#ffffff',
                            border: '2px solid #d1d5db',
                            borderRadius: '10px',
                            textDecoration: 'none',
                            color: '#374151',
                            fontSize: '14px',
                            fontWeight: '800',
                          }}
                        >
                          {i}
                        </a>
                      </td>
                    ))}
                  </tr>
                </table>

                {/* Call to action text */}
                <p
                  style={{
                    color: '#6b7280',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    margin: '0 0 24px 0',
                    textAlign: 'center',
                  }}
                >
                  One click and you're done. Your feedback helps us serve you better.
                </p>

                {/* Signature */}
                <p
                  style={{
                    color: '#1f2937',
                    fontSize: '16px',
                    lineHeight: '1.6',
                    margin: '24px 0 0 0',
                  }}
                >
                  Thanks,
                  <br />
                  <span style={{ fontWeight: '600' }}>Anthony</span>
                </p>
              </td>
            </tr>
          </table>

          {/* Footer */}
          <table width="600" cellPadding="0" cellSpacing="0" style={{ maxWidth: '600px', width: '100%' }}>
            <tr>
              <td align="center" style={{ padding: '20px', textAlign: 'center' }}>
                <p
                  style={{
                    color: '#9ca3af',
                    fontSize: '12px',
                    margin: '0',
                    lineHeight: '1.5',
                  }}
                >
                  Product Careerlyst
                  <br />
                  <a
                    href={baseUrl}
                    style={{
                      color: '#a855f7',
                      textDecoration: 'none',
                    }}
                  >
                    {baseUrl.replace('https://', '')}
                  </a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  );
};
