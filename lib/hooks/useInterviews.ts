import { useState, useEffect } from 'react';
import { InterviewWithRelations } from '@/lib/types/jobs';

export const useInterviews = (applicationId?: string, status?: string) => {
  const [interviews, setInterviews] = useState<InterviewWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (applicationId) {
        params.append('application_id', applicationId);
      }
      
      if (status) {
        params.append('status', status);
      }

      const url = `/api/jobs/interviews${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch interviews');
      }
      
      const data = await response.json();
      setInterviews(data.interviews || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [applicationId, status]);

  return { interviews, loading, error, refetch: fetchInterviews };
};

export const useInterview = (id: string) => {
  const [interview, setInterview] = useState<InterviewWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInterview = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/interviews/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch interview');
      }
      
      const data = await response.json();
      setInterview(data.interview);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setInterview(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchInterview();
    }
  }, [id]);

  return { interview, loading, error, refetch: fetchInterview };
};

export const createInterview = async (data: any) => {
  const response = await fetch('/api/jobs/interviews', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create interview');
  }

  return response.json();
};

export const updateInterview = async (id: string, data: any) => {
  const response = await fetch(`/api/jobs/interviews/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update interview');
  }

  return response.json();
};

export const deleteInterview = async (id: string) => {
  const response = await fetch(`/api/jobs/interviews/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete interview');
  }

  return response.json();
};

