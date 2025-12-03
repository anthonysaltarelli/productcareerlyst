import * as React from 'react';

interface ContactNotificationProps {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
  submissionDate: string;
  userId?: string | null;
  isAuthenticated: boolean;
}

export const ContactNotification = ({
  firstName,
  lastName,
  email,
  message,
  submissionDate,
  userId,
  isAuthenticated,
}: ContactNotificationProps) => {
  const formattedDate = new Date(submissionDate).toLocaleString('en-US', {
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
        New Contact Form Submission 📧
      </h1>
      
      <div style={{ backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
        <p style={{ color: '#374151', fontSize: '16px', margin: '0 0 12px 0', lineHeight: '1.5' }}>
          A new contact form submission has been received.
        </p>
        
        <div style={{ marginTop: '16px' }}>
          <p style={{ color: '#1f2937', fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0' }}>
            Name:
          </p>
          <p style={{ color: '#4b5563', fontSize: '14px', margin: '0 0 16px 0' }}>
            {firstName} {lastName}
          </p>
          
          <p style={{ color: '#1f2937', fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0' }}>
            Email:
          </p>
          <p style={{ color: '#4b5563', fontSize: '14px', margin: '0 0 16px 0' }}>
            {email}
          </p>
          
          {isAuthenticated && userId && (
            <>
              <p style={{ color: '#1f2937', fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0' }}>
                User ID:
              </p>
              <p style={{ color: '#4b5563', fontSize: '14px', margin: '0 0 16px 0' }}>
                {userId}
              </p>
              <p style={{ color: '#6b7280', fontSize: '12px', margin: '0 0 16px 0', fontStyle: 'italic' }}>
                This user is authenticated in the system.
              </p>
            </>
          )}
          
          <p style={{ color: '#1f2937', fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0' }}>
            Submission Date & Time:
          </p>
          <p style={{ color: '#4b5563', fontSize: '14px', margin: '0' }}>
            {formattedDate}
          </p>
        </div>
      </div>
      
      <div style={{ backgroundColor: '#fef3c7', padding: '16px', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid #f59e0b' }}>
        <p style={{ color: '#1f2937', fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>
          Message:
        </p>
        <p style={{ color: '#4b5563', fontSize: '14px', margin: '0', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
          {message}
        </p>
      </div>
      
      <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '20px', lineHeight: '1.5' }}>
        Please respond to this inquiry in a timely manner.
      </p>
    </div>
  );
};

