import { useState, useEffect } from 'react';
import { Company, CompanyWithResearch } from '@/lib/types/jobs';

export const useCompanies = (search?: string, approved?: boolean) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (search) {
        params.append('search', search);
      }
      
      if (approved !== undefined) {
        params.append('approved', approved.toString());
      }

      const url = `/api/jobs/companies${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch companies');
      }
      
      const data = await response.json();
      setCompanies(data.companies || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [search, approved]);

  return { companies, loading, error, refetch: fetchCompanies };
};

export const useCompany = (id: string) => {
  const [company, setCompany] = useState<CompanyWithResearch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/companies/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch company');
      }
      
      const data = await response.json();
      setCompany(data.company);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setCompany(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCompany();
    }
  }, [id]);

  return { company, loading, error, refetch: fetchCompany };
};

export const createCompany = async (data: any) => {
  const response = await fetch('/api/jobs/companies', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create company');
  }

  return response.json();
};

export const updateCompany = async (id: string, data: any) => {
  const response = await fetch(`/api/jobs/companies/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update company');
  }

  return response.json();
};

