import * as React from 'react';

interface TrialWelcomeEmailV2Props {
  firstName?: string | null;
  userId: string;
  baseUrl?: string;
  unsubscribeUrl?: string;
}

export const TrialWelcomeEmailV2 = ({
  firstName,
  userId,
  baseUrl = 'https://productcareerlyst.com',
  unsubscribeUrl,
}: TrialWelcomeEmailV2Props) => {
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
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
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

                  {/* Welcome message - Updated copy */}
                  <p
                    style={{
                      color: '#374151',
                      fontSize: '16px',
                      lineHeight: '1.6',
                      margin: '0 0 24px 0',
                    }}
                  >
                    We're thrilled you've started your 7-day free trial of Product Careerlyst! 
                    You now have full access to all our features to help you grow in your product career.
                  </p>

                  {/* New: Quick stats section */}
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
                        textAlign: 'center',
                      }}
                    >
                      What You Get Access To:
                    </h2>
                    <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '16px' }}>
                      <div style={{ textAlign: 'center', flex: '1', minWidth: '120px' }}>
                        <div style={{ fontSize: '28px', fontWeight: '800', color: '#a855f7', marginBottom: '4px' }}>
                          50+
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Courses</div>
                      </div>
                      <div style={{ textAlign: 'center', flex: '1', minWidth: '120px' }}>
                        <div style={{ fontSize: '28px', fontWeight: '800', color: '#a855f7', marginBottom: '4px' }}>
                          100+
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Resources</div>
                      </div>
                      <div style={{ textAlign: 'center', flex: '1', minWidth: '120px' }}>
                        <div style={{ fontSize: '28px', fontWeight: '800', color: '#a855f7', marginBottom: '4px' }}>
                          ∞
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Portfolio Tools</div>
                      </div>
                    </div>
                  </div>

                  {/* What's next section - Updated design */}
                  <div
                    style={{
                      backgroundColor: '#fef3e7',
                      padding: '20px',
                      borderRadius: '12px',
                      margin: '0 0 24px 0',
                      borderLeft: '4px solid #a855f7',
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
                      🎯 Your First Steps
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
                        <strong>Complete your profile</strong> - Get personalized recommendations
                      </li>
                      <li style={{ marginBottom: '12px' }}>
                        <strong>Explore our courses</strong> - Tailored for product managers at every level
                      </li>
                      <li style={{ marginBottom: '12px' }}>
                        <strong>Start building your portfolio</strong> - Showcase your work and achievements
                      </li>
                      <li style={{ marginBottom: '0' }}>
                        <strong>Join the community</strong> - Connect with other product professionals
                      </li>
                    </ul>
                  </div>

                  {/* CTA Button - Updated styling */}
                  <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '24px' }}>
                    <tr>
                      <td align="center">
                        <a
                          href={`${baseUrl}/dashboard`}
                          style={{
                            display: 'inline-block',
                            padding: '16px 32px',
                            background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                            backgroundColor: '#a855f7',
                            color: '#ffffff',
                            textDecoration: 'none',
                            borderRadius: '12px',
                            fontWeight: '700',
                            fontSize: '16px',
                            boxShadow: '0 4px 6px rgba(168, 85, 247, 0.3)',
                          }}
                        >
                          Start Your Journey →
                        </a>
                      </td>
                    </tr>
                  </table>

                  {/* New: Social proof section */}
                  <div
                    style={{
                      backgroundColor: '#f9fafb',
                      padding: '16px',
                      borderRadius: '8px',
                      margin: '0 0 24px 0',
                      textAlign: 'center',
                    }}
                  >
                    <p
                      style={{
                        color: '#6b7280',
                        fontSize: '14px',
                        margin: '0',
                        fontStyle: 'italic',
                      }}
                    >
                      "Product Careerlyst helped me land my dream PM role. The courses and portfolio tools are incredible!"
                    </p>
                    <p
                      style={{
                        color: '#9ca3af',
                        fontSize: '12px',
                        margin: '8px 0 0 0',
                      }}
                    >
                      — Sarah M., Senior Product Manager
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

