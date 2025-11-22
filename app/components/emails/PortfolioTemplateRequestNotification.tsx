import * as React from 'react';

interface PortfolioTemplateRequestNotificationProps {
  userEmail: string;
  requestDate: string;
}

export const PortfolioTemplateRequestNotification = ({
  userEmail,
  requestDate,
}: PortfolioTemplateRequestNotificationProps) => {
  const formattedDate = new Date(requestDate).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ color: '#1f2937', fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
        New Product Portfolio Template Request 📋
      </h1>
      
      <div style={{ backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
        <p style={{ color: '#374151', fontSize: '16px', margin: '0 0 12px 0', lineHeight: '1.5' }}>
          A new product portfolio template request has been submitted.
        </p>
        
        <div style={{ marginTop: '16px' }}>
          <p style={{ color: '#1f2937', fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0' }}>
            User Email:
          </p>
          <p style={{ color: '#4b5563', fontSize: '14px', margin: '0 0 16px 0' }}>
            {userEmail}
          </p>
          
          <p style={{ color: '#1f2937', fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0' }}>
            Request Date & Time:
          </p>
          <p style={{ color: '#4b5563', fontSize: '14px', margin: '0' }}>
            {formattedDate}
          </p>
        </div>
      </div>
      
      <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '20px', lineHeight: '1.5' }}>
        Please process this request and send the portfolio template to the user within 24-48 hours.
      </p>
    </div>
  );
};

