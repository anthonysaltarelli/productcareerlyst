import * as React from 'react';

interface TrialDay4PortfolioEmailProps {
  firstName?: string | null;
  userId: string;
  baseUrl?: string;
  unsubscribeUrl?: string;
}

export const TrialDay4PortfolioEmail = ({
  firstName,
  userId,
  baseUrl = 'https://productcareerlyst.com',
  unsubscribeUrl,
}: TrialDay4PortfolioEmailProps) => {
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
                    Your resume tells what you did. A portfolio <strong>differentiates you</strong> by showcasing your thought process, design skills, strategic thinking, and the impact you've made through real case studies.
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
                      Everything You Get with Our Portfolio Tools
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
                        <strong>Unsplash Integration</strong> - Search millions of professional photos directly from your editor and add them with one click
                      </li>
                      <li style={{ marginBottom: '12px' }}>
                        <strong>AI Writing Assistant</strong> - Type "/" to access AI commands: continue writing, improve your text, create summaries, or transform into bullet points
                      </li>
                      <li style={{ marginBottom: '12px' }}>
                        <strong>Categories & Organization</strong> - Create unlimited custom categories, drag-and-drop to reorder, and feature your top case studies
                      </li>
                      <li style={{ marginBottom: '12px' }}>
                        <strong>Notion-Like Editor</strong> - Rich formatting options, drag-and-drop images, callout boxes, and highlights—write like you're in Notion
                      </li>
                      <li style={{ marginBottom: '12px' }}>
                        <strong>Custom URLs & Publishing</strong> - Get a personalized URL (productcareerlyst.com/p/yourname), custom slugs for each case study, and one-click publish/unpublish
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
                        href={`${baseUrl}/portfolio`}
                        style={{
                          color: '#a855f7',
                          textDecoration: 'underline',
                        }}
                      >
                        Learn more about all our portfolio features →
                      </a>
                      {' • '}
                      <a
                        href="https://productcareerlyst.com/p/anthonysaltarelli"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#a855f7',
                          textDecoration: 'underline',
                        }}
                      >
                        View example portfolio →
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
                    With your Accelerate trial, you have full access to our portfolio editor. Start with one case study— 
                    you'll see how it transforms how hiring managers see you.
                  </p>

                  {/* CTA Button */}
                  <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '24px' }}>
                    <tr>
                      <td align="center">
                        <a
                          href={`${baseUrl}/dashboard/portfolio`}
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
                          Create Your Portfolio →
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

