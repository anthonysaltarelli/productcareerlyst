import * as React from 'react';

interface TrialDay21DiscountEmailProps {
  firstName?: string | null;
  userId: string;
  baseUrl?: string;
  unsubscribeUrl?: string;
}

export const TrialDay21DiscountEmail = ({
  firstName,
  userId,
  baseUrl = 'https://productcareerlyst.com',
  unsubscribeUrl,
}: TrialDay21DiscountEmailProps) => {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,';

  return (
    <>
      <style>{`
        @media only screen and (max-width: 600px) {
          .email-container {
            width: 100% !important;
            padding: 20px !important;
          }
          .content-padding {
            padding: 24px 16px !important;
          }
        }
      `}</style>
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
              className="email-container"
              style={{
                maxWidth: '600px',
                width: '100%',
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <tr>
                <td
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    backgroundColor: '#10b981',
                    padding: '32px 24px',
                    textAlign: 'center',
                  }}
                >
                  <h1
                    style={{
                      color: '#ffffff',
                      fontSize: '28px',
                      fontWeight: '800',
                      margin: '0',
                      lineHeight: '1.3',
                    }}
                  >
                    Special Offer: 25% Off Your First Month
                  </h1>
                </td>
              </tr>

              {/* Content */}
              <tr>
                <td className="content-padding" style={{ padding: '32px 24px' }}>
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

                  <p
                    style={{
                      color: '#374151',
                      fontSize: '16px',
                      lineHeight: '1.6',
                      margin: '0 0 24px 0',
                    }}
                  >
                    We'd love to help you continue your career journey. As a special offer, we're giving you 
                    <strong> 25% off</strong> your first month of Accelerate—everything you need to make real progress.
                  </p>

                  <div
                    style={{
                      backgroundColor: '#d1fae5',
                      padding: '20px',
                      borderRadius: '12px',
                      margin: '0 0 24px 0',
                      border: '2px solid #10b981',
                      textAlign: 'center',
                    }}
                  >
                    <p
                      style={{
                        color: '#065f46',
                        fontSize: '24px',
                        fontWeight: '800',
                        margin: '0 0 8px 0',
                      }}
                    >
                      25% OFF
                    </p>
                    <p
                      style={{
                        color: '#047857',
                        fontSize: '16px',
                        margin: '0',
                      }}
                    >
                      Your first month of Premium
                    </p>
                  </div>

                  <div
                    style={{
                      backgroundColor: '#f3f4f6',
                      padding: '20px',
                      borderRadius: '12px',
                      margin: '0 0 24px 0',
                    }}
                  >
                    <h2
                      style={{
                        color: '#1f2937',
                        fontSize: '20px',
                        fontWeight: '700',
                        margin: '0 0 12px 0',
                      }}
                    >
                      What This Unlocks
                    </h2>
                    <p
                      style={{
                        color: '#374151',
                        fontSize: '16px',
                        lineHeight: '1.6',
                        margin: '0 0 16px 0',
                      }}
                    >
                      With Accelerate, you get unlimited access to everything that helps you move forward:
                    </p>
                    <ul
                      style={{
                        color: '#374151',
                        fontSize: '16px',
                        lineHeight: '1.8',
                        margin: '0',
                        paddingLeft: '20px',
                      }}
                    >
                      <li style={{ marginBottom: '12px' }}>
                        All courses and lessons—build skills that matter
                      </li>
                      <li style={{ marginBottom: '12px' }}>
                        Unlimited resume analysis and job tracking
                      </li>
                      <li style={{ marginBottom: '12px' }}>
                        Portfolio builder to showcase your impact
                      </li>
                      <li style={{ marginBottom: '12px' }}>
                        Networking tools to build relationships
                      </li>
                    </ul>
                  </div>

                  <p
                    style={{
                      color: '#374151',
                      fontSize: '16px',
                      lineHeight: '1.6',
                      margin: '0 0 24px 0',
                    }}
                  >
                    This offer is available for a limited time. Don't let your career progress wait—upgrade now and keep moving forward.
                  </p>

                  {/* CTA Button */}
                  <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '24px' }}>
                    <tr>
                      <td align="center">
                        <a
                          href={`${baseUrl}/pricing`}
                          style={{
                            display: 'inline-block',
                            padding: '14px 28px',
                            backgroundColor: '#10b981',
                            color: '#ffffff',
                            textDecoration: 'none',
                            borderRadius: '10px',
                            fontWeight: '700',
                            fontSize: '16px',
                          }}
                        >
                          Claim 25% Off →
                        </a>
                      </td>
                    </tr>
                  </table>

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
                    <br />
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>
                      Founder, Product Careerlyst
                    </span>
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
                      margin: '0 0 8px 0',
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
                  {unsubscribeUrl && (
                    <p
                      style={{
                        color: '#9ca3af',
                        fontSize: '12px',
                        margin: '8px 0 0 0',
                      }}
                    >
                      <a
                        href={unsubscribeUrl}
                        style={{
                          color: '#9ca3af',
                          textDecoration: 'underline',
                        }}
                      >
                        Unsubscribe from marketing emails
                      </a>
                    </p>
                  )}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </>
  );
};

