import * as React from 'react';

interface OTPEmailProps {
  firstName?: string | null;
  otpCode: string;
  baseUrl?: string;
  expiresInMinutes?: number;
}

export const OTPEmail = ({
  firstName,
  otpCode,
  baseUrl = 'https://productcareerlyst.com',
  expiresInMinutes = 10,
}: OTPEmailProps) => {
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
          .otp-code {
            font-size: 32px !important;
            padding: 20px !important;
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
              {/* Header with gradient background */}
              <tr>
                <td
                  style={{
                    background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                    backgroundColor: '#a855f7',
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
                    Your Verification Code
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

                  {/* Instructions */}
                  <p
                    style={{
                      color: '#374151',
                      fontSize: '16px',
                      lineHeight: '1.6',
                      margin: '0 0 24px 0',
                    }}
                  >
                    Use the verification code below to complete your sign-in:
                  </p>

                  {/* OTP Code Display */}
                  <div
                    style={{
                      backgroundColor: '#f3f4f6',
                      padding: '24px',
                      borderRadius: '12px',
                      margin: '0 0 24px 0',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      className="otp-code"
                      style={{
                        color: '#a855f7',
                        fontSize: '40px',
                        fontWeight: '800',
                        letterSpacing: '8px',
                        fontFamily: 'monospace',
                        padding: '16px',
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        display: 'inline-block',
                      }}
                    >
                      {otpCode}
                    </div>
                  </div>

                  {/* Expiration notice */}
                  <p
                    style={{
                      color: '#6b7280',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      margin: '0 0 24px 0',
                      textAlign: 'center',
                    }}
                  >
                    This code will expire in {expiresInMinutes} minutes.
                  </p>

                  {/* Security notice */}
                  <div
                    style={{
                      backgroundColor: '#fef3e7',
                      padding: '16px',
                      borderRadius: '8px',
                      margin: '0 0 24px 0',
                    }}
                  >
                    <p
                      style={{
                        color: '#92400e',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        margin: '0',
                      }}
                    >
                      <strong>Security Notice:</strong> If you didn't request this code, 
                      please ignore this email or contact support if you have concerns.
                    </p>
                  </div>

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
    </>
  );
};



