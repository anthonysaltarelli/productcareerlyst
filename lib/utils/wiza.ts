/**
 * Wiza API Utility Functions
 * 
 * Handles communication with Wiza API for finding and importing contacts
 */

const WIZA_API_BASE = 'https://wiza.co/api';
const WIZA_API_KEY = process.env.WIZA_API_KEY;

if (!WIZA_API_KEY) {
  console.warn('WIZA_API_KEY is not set in environment variables');
}

export interface WizaProspectListRequest {
  list: {
    name: string;
    max_profiles?: number;
    enrichment_level?: 'partial' | 'full';
    email_options?: {
      accept_work?: boolean;
      accept_personal?: boolean;
      accept_generic?: boolean;
    };
  };
  filters: {
    job_title?: Array<{ v: string; s: string }>;
    job_company?: Array<{ v: string; s: string }>;
    profile_url?: Array<{ v: string; s: string }>;
    [key: string]: any; // Allow other filter types
  };
}

export interface WizaProspectListResponse {
  id: string;
  name: string;
  status: string;
  created_at: string;
  [key: string]: any;
}

export interface WizaContact {
  id?: string; // Wiza API doesn't always return this
  first_name?: string;
  last_name?: string;
  full_name?: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  linkedin_url?: string;
  linkedin_profile_url?: string;
  email_status?: 'valid' | 'risky';
  location?: string;
  [key: string]: any;
}

export interface WizaIndividualRevealRequest {
  individual_reveal: {
    full_name?: string;
    company?: string;
    profile_url?: string;
  };
  enrichment_level?: 'partial' | 'full';
  email_options?: {
    accept_work?: boolean;
    accept_personal?: boolean;
  };
}

export interface WizaIndividualRevealResponse {
  id: string;
  status: string;
  [key: string]: any;
}

/**
 * Make a request to Wiza API
 */
const wizaRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  if (!WIZA_API_KEY) {
    throw new Error('WIZA_API_KEY is not configured');
  }

  const url = `${WIZA_API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${WIZA_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Wiza API error: ${response.status} - ${errorText}`);
  }

  return response;
};

/**
 * Create a prospect list in Wiza
 */
export const createWizaProspectList = async (
  request: WizaProspectListRequest
): Promise<WizaProspectListResponse> => {
  const response = await wizaRequest('/prospects/create_prospect_list', {
    method: 'POST',
    body: JSON.stringify(request),
  });

  return response.json();
};

/**
 * Get contacts from a Wiza list
 */
export const getWizaListContacts = async (
  listId: string,
  segment: 'people' | 'companies' = 'people'
): Promise<{ contacts: WizaContact[] }> => {
  try {
    const response = await wizaRequest(
      `/lists/${listId}/contacts?segment=${segment}`
    );

    const data = await response.json();
    
    // Handle nested response structure
    if (data.data && Array.isArray(data.data)) {
      return { contacts: data.data };
    }
    if (data.contacts && Array.isArray(data.contacts)) {
      return { contacts: data.contacts };
    }
    if (Array.isArray(data)) {
      return { contacts: data };
    }
    
    return { contacts: [] };
  } catch (error) {
    // Handle "No contacts" error gracefully
    if (error instanceof Error && error.message.includes('400') && error.message.includes('No contacts')) {
      return { contacts: [] };
    }
    throw error;
  }
};

/**
 * Create an individual reveal in Wiza
 */
export const createWizaIndividualReveal = async (
  request: WizaIndividualRevealRequest
): Promise<WizaIndividualRevealResponse> => {
  const response = await wizaRequest('/individual_reveals', {
    method: 'POST',
    body: JSON.stringify(request),
  });

  return response.json();
};

/**
 * Get individual reveal status and data
 */
export const getWizaIndividualReveal = async (
  revealId: string
): Promise<WizaContact> => {
  const response = await wizaRequest(`/individual_reveals/${revealId}`);

  return response.json();
};

/**
 * Get list status
 */
export const getWizaListStatus = async (
  listId: string
): Promise<WizaProspectListResponse> => {
  const response = await wizaRequest(`/lists/${listId}`);
  const list = await response.json();
  
  // Handle nested response structure
  return list.data || list;
};

