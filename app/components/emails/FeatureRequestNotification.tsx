import * as React from 'react';

interface FeatureRequestNotificationProps {
  firstName: string;
  lastName: string;
  userEmail: string;
  title: string;
  description: string;
  requestDate: string;
}

export const FeatureRequestNotification = ({
  firstName,
  lastName,
  userEmail,
  title,
  description,
  requestDate,
}: FeatureRequestNotificationProps) => {
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
        New Feature Request Submitted 💡
      </h1>
      
      <div style={{ backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
        <p style={{ color: '#374151', fontSize: '16px', margin: '0 0 12px 0', lineHeight: '1.5' }}>
          A new feature request has been submitted by a user.
        </p>
        
        <div style={{ marginTop: '16px' }}>
          <p style={{ color: '#1f2937', fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0' }}>
            User:
          </p>
          <p style={{ color: '#4b5563', fontSize: '14px', margin: '0 0 16px 0' }}>
            {firstName} {lastName} ({userEmail})
          </p>
          
          <p style={{ color: '#1f2937', fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0' }}>
            Request Date & Time:
          </p>
          <p style={{ color: '#4b5563', fontSize: '14px', margin: '0 0 16px 0' }}>
            {formattedDate}
          </p>
        </div>
      </div>
      
      <div style={{ backgroundColor: '#fef3c7', padding: '16px', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid #f59e0b' }}>
        <p style={{ color: '#1f2937', fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>
          Feature Request Title:
        </p>
        <p style={{ color: '#374151', fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px 0' }}>
          {title}
        </p>
        
        <p style={{ color: '#1f2937', fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>
          Description:
        </p>
        <p style={{ color: '#4b5563', fontSize: '14px', margin: '0', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
          {description}
        </p>
      </div>
      
      <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '20px', lineHeight: '1.5' }}>
        You can view and manage this feature request in the dashboard.
      </p>
    </div>
  );
};

