import { useState, useEffect } from 'react';
import { JobApplicationWithCompany } from '@/lib/types/jobs';

export const useJobApplications = (status?: string) => {
  const [applications, setApplications] = useState<JobApplicationWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const url = status 
        ? `/api/jobs/applications?status=${status}`
        : '/api/jobs/applications';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }
      
      const data = await response.json();
      setApplications(data.applications || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [status]);

  return { applications, loading, error, refetch: fetchApplications };
};

export const useJobApplication = (id: string) => {
  const [application, setApplication] = useState<JobApplicationWithCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/applications/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch application');
      }
      
      const data = await response.json();
      setApplication(data.application);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setApplication(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchApplication();
    }
  }, [id]);

  return { application, loading, error, refetch: fetchApplication };
};

export const createJobApplication = async (data: any) => {
  const response = await fetch('/api/jobs/applications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create application');
  }

  return response.json();
};

export const updateJobApplication = async (id: string, data: any) => {
  const response = await fetch(`/api/jobs/applications/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update application');
  }

  return response.json();
};

export const deleteJobApplication = async (id: string) => {
  const response = await fetch(`/api/jobs/applications/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete application');
  }

  return response.json();
};

