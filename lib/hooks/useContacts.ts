import { useState, useEffect } from 'react';
import { ContactWithInteractions } from '@/lib/types/jobs';

export const useContacts = (companyId?: string, applicationId?: string) => {
  const [contacts, setContacts] = useState<ContactWithInteractions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (companyId) {
        params.append('company_id', companyId);
      }
      
      if (applicationId) {
        params.append('application_id', applicationId);
      }

      const url = `/api/jobs/contacts${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch contacts');
      }
      
      const data = await response.json();
      setContacts(data.contacts || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [companyId, applicationId]);

  return { contacts, loading, error, refetch: fetchContacts };
};

export const useContact = (id: string) => {
  const [contact, setContact] = useState<ContactWithInteractions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContact = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/contacts/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch contact');
      }
      
      const data = await response.json();
      setContact(data.contact);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setContact(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchContact();
    }
  }, [id]);

  return { contact, loading, error, refetch: fetchContact };
};

export const createContact = async (data: any) => {
  const response = await fetch('/api/jobs/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create contact');
  }

  return response.json();
};

export const updateContact = async (id: string, data: any) => {
  const response = await fetch(`/api/jobs/contacts/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update contact');
  }

  return response.json();
};

export const deleteContact = async (id: string) => {
  const response = await fetch(`/api/jobs/contacts/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete contact');
  }

  return response.json();
};

