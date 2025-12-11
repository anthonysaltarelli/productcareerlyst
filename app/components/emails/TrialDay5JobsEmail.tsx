import * as React from 'react';

interface TrialDay5JobsEmailProps {
  firstName?: string | null;
  userId: string;
  baseUrl?: string;
  unsubscribeUrl?: string;
}

export const TrialDay5JobsEmail = ({
  firstName,
  userId,
  baseUrl = 'https://productcareerlyst.com',
  unsubscribeUrl,
}: TrialDay5JobsEmailProps) => {
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
                    Stop drowning in spreadsheets. With your Accelerate trial, you have access to a complete job search command center that handles the busywork so you can focus on landing offers.
                  </p>

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
                      Everything You Get with Job Center
                    </h2>
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
                        <strong>Instant Job Import</strong> - Paste any job posting URL and our AI extracts the title, company, description, and requirements automatically
                      </li>
                      <li style={{ marginBottom: '12px' }}>
                        <strong>Verified Contact Discovery</strong> - Find verified email addresses and LinkedIn profiles for PMs at your target companies
                      </li>
                      <li style={{ marginBottom: '12px' }}>
                        <strong>AI Company Research</strong> - One-click research across 13 dimensions: mission, values, competition, funding, recent launches, strategy, and more
                      </li>
                      <li style={{ marginBottom: '12px' }}>
                        <strong>AI Interview Prep</strong> - Generate tailored questions for each interview based on company, role, and interview type
                      </li>
                      <li style={{ marginBottom: '12px' }}>
                        <strong>Personalized Thank You Notes</strong> - AI generates follow-up emails that reference specific conversation points from your interviews
                      </li>
                      <li style={{ marginBottom: '12px' }}>
                        <strong>Kanban Organization</strong> - Visual tracking with drag-and-drop between stages—finally get out of spreadsheet hell
                      </li>
                    </ul>
                    <p
                      style={{
                        color: '#374151',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        margin: '16px 0 0 0',
                        fontStyle: 'italic',
                      }}
                    >
                      <a
                        href={`${baseUrl}/job-center`}
                        style={{
                          color: '#a855f7',
                          textDecoration: 'underline',
                        }}
                      >
                        Learn more about all our job center features →
                      </a>
                    </p>
                  </div>

                  <p
                    style={{
                      color: '#374151',
                      fontSize: '16px',
                      lineHeight: '1.6',
                      margin: '0 0 24px 0',
                    }}
                  >
                    Add your first job application today. It takes 60 seconds to import from a URL, and you'll immediately see how this transforms your job search from chaos to command center.
                  </p>

                  {/* CTA Button */}
                  <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '24px' }}>
                    <tr>
                      <td align="center">
                        <a
                          href={`${baseUrl}/dashboard/jobs`}
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
                          Track Your Jobs →
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

