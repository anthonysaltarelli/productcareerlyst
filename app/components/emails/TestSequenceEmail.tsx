import * as React from 'react';

interface TestSequenceEmailProps {
  stepOrder: number;
  flowName?: string;
  firstName?: string;
  baseUrl?: string;
  unsubscribeUrl?: string;
}

export const TestSequenceEmail = ({
  stepOrder,
  flowName = 'test_sequence',
  firstName = 'Test User',
  baseUrl = 'https://productcareerlyst.com',
  unsubscribeUrl,
}: TestSequenceEmailProps) => {
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
          backgroundColor: '#f6f9fc',
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
              {/* Header with gradient background */}
              <tr>
                <td
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                    backgroundColor: '#8b5cf6',
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
                    Test Sequence - Step {stepOrder}
                  </h1>
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

                  {/* Main message */}
                  <p
                    style={{
                      color: '#374151',
                      fontSize: '16px',
                      lineHeight: '1.6',
                      margin: '0 0 24px 0',
                    }}
                  >
                    This is <strong>Step {stepOrder}</strong> of the <strong>{flowName}</strong> email sequence.
                  </p>

                  {/* Debug Information Box */}
                  <div
                    style={{
                      backgroundColor: '#f3f4f6',
                      padding: '20px',
                      borderRadius: '12px',
                      margin: '0 0 24px 0',
                      border: '2px solid #e5e7eb',
                    }}
                  >
                    <h2
                      style={{
                        color: '#1f2937',
                        fontSize: '18px',
                        fontWeight: '700',
                        margin: '0 0 16px 0',
                      }}
                    >
                      Debug Information
                    </h2>
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        padding: '16px',
                        borderRadius: '8px',
                        fontFamily: 'monospace',
                        fontSize: '14px',
                        lineHeight: '1.8',
                        color: '#374151',
                      }}
                    >
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Flow Name:</strong> {flowName}
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Step Order:</strong> {stepOrder}
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Email Type:</strong> Test Sequence
                      </div>
                    </div>
                  </div>

                  {/* Info message */}
                  <p
                    style={{
                      color: '#374151',
                      fontSize: '16px',
                      lineHeight: '1.6',
                      margin: '0 0 24px 0',
                    }}
                  >
                    This email was sent as part of a test sequence to verify the email flow system is working correctly.
                  </p>

                  <p
                    style={{
                      color: '#10b981',
                      fontSize: '16px',
                      lineHeight: '1.6',
                      margin: '0 0 24px 0',
                      fontWeight: '600',
                    }}
                  >
                    ✓ If you received this email, the scheduling system is functioning properly!
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
                    <span style={{ fontWeight: '600' }}>The Product Careerlyst Team</span>
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
                        color: '#8b5cf6',
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

export default TestSequenceEmail;

