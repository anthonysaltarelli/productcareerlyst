import * as React from 'react';

interface TrialWelcomeEmailV3Props {
  firstName?: string | null;
  userId: string;
  baseUrl?: string;
  unsubscribeUrl?: string;
}

export const TrialWelcomeEmailV3 = ({
  firstName,
  userId,
  baseUrl = 'https://productcareerlyst.com',
  unsubscribeUrl,
}: TrialWelcomeEmailV3Props) => {
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
              {/* Product Careerlyst Header - Clickable */}
              <tr>
                <td
                  style={{
                    background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                    backgroundColor: '#a855f7',
                    padding: '32px 24px',
                    textAlign: 'center',
                  }}
                >
                  <a
                    href={`${baseUrl}/dashboard`}
                    style={{
                      color: '#ffffff',
                      fontSize: '24px',
                      fontWeight: '800',
                      textDecoration: 'none',
                      display: 'inline-block',
                    }}
                  >
                    Product Careerlyst
                  </a>
                </td>
              </tr>

              {/* Content */}
              <tr>
                <td className="content-padding" style={{ padding: '32px 24px' }}>
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

                  {/* Welcome message */}
                  <p
                    style={{
                      color: '#374151',
                      fontSize: '16px',
                      lineHeight: '1.6',
                      margin: '0 0 24px 0',
                    }}
                  >
                    You've just started your <strong>Free 7-Day Trial of the Accelerate plan</strong>! 
                    Over the next 7 days, you have full access to everything in Accelerate—our unlimited plan designed for serious career growth.
                  </p>

                  {/* What's included section */}
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
                        margin: '0 0 16px 0',
                      }}
                    >
                      What You Have Access To
                    </h2>
                    <p
                      style={{
                        color: '#374151',
                        fontSize: '16px',
                        lineHeight: '1.6',
                        margin: '0 0 16px 0',
                      }}
                    >
                      With your Accelerate trial, you get:
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
                        <strong>120+ Course Lessons</strong> - Comprehensive video lessons across 7 courses
                      </li>
                      <li style={{ marginBottom: '12px' }}>
                        <strong>20+ PM Resources & Templates</strong> - PRDs, roadmaps, OKR frameworks, and more
                      </li>
                      <li style={{ marginBottom: '12px' }}>
                        <strong>Hosted Product Portfolio</strong> - Create your portfolio website at productcareerlyst.com/p/yourname
                      </li>
                      <li style={{ marginBottom: '12px' }}>
                        <strong>Unlimited AI Features</strong> - Resume optimizations, job tracking, company research, networking tools, and more—all unlimited
                      </li>
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '24px' }}>
                    <tr>
                      <td align="center">
                        <a
                          href={`${baseUrl}/dashboard`}
                          style={{
                            display: 'inline-block',
                            padding: '14px 28px',
                            backgroundColor: '#a855f7',
                            color: '#ffffff',
                            textDecoration: 'none',
                            borderRadius: '10px',
                            fontWeight: '700',
                            fontSize: '16px',
                          }}
                        >
                          Go to Dashboard →
                        </a>
                      </td>
                    </tr>
                  </table>

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

