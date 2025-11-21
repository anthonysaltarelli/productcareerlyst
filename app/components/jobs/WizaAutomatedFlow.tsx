'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface WizaAutomatedFlowProps {
  companyName: string;
  companyId: string;
  companyLinkedinUrl?: string;
  applicationId?: string;
  onImportComplete: () => void;
}

type FlowStatus = 'idle' | 'creating' | 'polling' | 'fetching' | 'importing' | 'success' | 'no_contacts' | 'timeout' | 'error';

const POLL_INTERVAL_MS = 5000; // 5 seconds
const MAX_POLL_ATTEMPTS = 60; // 5 minutes total

export const WizaAutomatedFlow = ({
  companyName,
  companyId,
  companyLinkedinUrl,
  applicationId,
  onImportComplete,
}: WizaAutomatedFlowProps) => {
  const [status, setStatus] = useState<FlowStatus>('idle');
  const [listId, setListId] = useState<string | null>(null);
  const [currentListStatus, setCurrentListStatus] = useState<string>('');
  const [contactsFound, setContactsFound] = useState<number>(0);
  const [contactsImported, setContactsImported] = useState<number>(0);
  const [pollAttempts, setPollAttempts] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Set mounted flag on mount and cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    console.log('[WizaAutomatedFlow] Component mounted, isMountedRef set to true');
    
    return () => {
      console.log('[WizaAutomatedFlow] Component unmounting, cleaning up polling');
      isMountedRef.current = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);

  const getStatusMessage = useCallback((wizaStatus: string, attempt: number): string => {
    const statusLower = wizaStatus.toLowerCase();
    
    // Log status for debugging
    console.log('[WizaAutomatedFlow] Status:', wizaStatus, 'Attempt:', attempt);
    
    // Map actual Wiza status values to friendly messages
    // These will be updated based on actual API responses from logging
    if (statusLower.includes('queued') || statusLower === 'queued') {
      const messages = [
        'Getting in line...',
        'Preparing your search...',
        'Almost ready!',
        'Setting things up...',
      ];
      return messages[attempt % messages.length];
    }
    
    if (statusLower.includes('process') || statusLower === 'processing') {
      const messages = [
        'Searching for contacts...',
        'Scouring the web...',
        'Finding product managers...',
        'Looking for the perfect matches...',
      ];
      return messages[attempt % messages.length];
    }
    
    if (statusLower.includes('finish') || statusLower === 'finished' || statusLower === 'completed' || statusLower === 'ready') {
      return 'Search complete! Ready to import contacts.';
    }
    
    if (statusLower.includes('fail') || statusLower.includes('error')) {
      return `Status: ${wizaStatus}`;
    }
    
    // Default: show the actual status
    return `Status: ${wizaStatus}`;
  }, []);

  const handleCreateList = useCallback(async () => {
    setStatus('creating');
    setErrorMessage(null);
    setPollAttempts(0);

    try {
      const response = await fetch('/api/jobs/wiza/create-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: companyId,
          company_name: companyName,
          company_linkedin_url: companyLinkedinUrl,
          application_id: applicationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create prospect list');
      }

      const data = await response.json();
      const newListId = data.list_id || data.id;
      
      if (!newListId) {
        throw new Error('Failed to get list ID from Wiza');
      }
      
      setListId(String(newListId));
      setStatus('polling');
      setPollAttempts(0);
      
      // Start polling immediately
      startPolling(String(newListId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setErrorMessage(errorMessage);
      setStatus('error');
      toast.error('Failed to create list', {
        description: errorMessage,
      });
    }
  }, [companyId, companyName, companyLinkedinUrl, applicationId]);

  const checkListStatus = useCallback(async (listIdToCheck: string): Promise<{ status: string; isComplete: boolean }> => {
    try {
      console.log(`[WizaAutomatedFlow] Fetching status for list: ${listIdToCheck}`);
      const response = await fetch(
        `/api/jobs/wiza/get-list?list_id=${encodeURIComponent(listIdToCheck)}`
      );

      console.log(`[WizaAutomatedFlow] Status response status: ${response.status}, ok: ${response.ok}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[WizaAutomatedFlow] Status check failed:', errorData);
        throw new Error(errorData.error || 'Failed to get list status');
      }

      const data = await response.json();
      console.log('[WizaAutomatedFlow] Raw API response:', JSON.stringify(data, null, 2));
      
      const listData = data.list || data;
      
      // Log the actual status structure
      console.log('[WizaAutomatedFlow] List status response:', JSON.stringify(listData, null, 2));
      console.log('[WizaAutomatedFlow] listData.status:', listData.status);
      console.log('[WizaAutomatedFlow] listData.data?.status:', (listData as any).data?.status);
      console.log('[WizaAutomatedFlow] listData keys:', Object.keys(listData));
      
      // Based on the API logs, status is at data.status
      // Try to extract status from various possible locations
      const wizaStatus = (listData as any).data?.status || 
                        listData.status || 
                        listData.wiza_status || 
                        (listData as any).state ||
                        'unknown';
      
      console.log('[WizaAutomatedFlow] Extracted status:', wizaStatus);
      setCurrentListStatus(wizaStatus);
      
      // Check if status indicates completion
      // Based on API logs, status can be "queued", "processing", "finished", etc.
      const statusLower = String(wizaStatus).toLowerCase().trim();
      const isComplete = statusLower === 'finished' || 
                        statusLower === 'completed' || 
                        statusLower === 'ready' ||
                        statusLower === 'done';
      
      console.log(`[WizaAutomatedFlow] Status check: "${statusLower}" -> isComplete: ${isComplete}`);
      
      return { status: wizaStatus, isComplete };
    } catch (err) {
      console.error('[WizaAutomatedFlow] Error checking status:', err);
      console.error('[WizaAutomatedFlow] Error stack:', err instanceof Error ? err.stack : 'No stack');
      throw err;
    }
  }, []);

  const fetchAndImportContacts = useCallback(async (listIdToUse: string) => {
    setStatus('fetching');
    
    try {
      // Fetch contacts
      const contactsResponse = await fetch(
        `/api/jobs/wiza/list-contacts?list_id=${encodeURIComponent(listIdToUse)}`
      );

      if (!contactsResponse.ok) {
        const errorData = await contactsResponse.json();
        throw new Error(errorData.error || 'Failed to fetch contacts');
      }

      const contactsData = await contactsResponse.json();
      
      if (contactsData.status === 'no_contacts') {
        setContactsFound(0);
        setStatus('no_contacts');
        return;
      }

      const contacts = contactsData.contacts || [];
      setContactsFound(contacts.length);
      
      if (contacts.length === 0) {
        setStatus('no_contacts');
        return;
      }

      // Auto-import all contacts
      setStatus('importing');
      
      const importResponse = await fetch('/api/jobs/wiza/import-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          list_id: listIdToUse,
          company_id: companyId,
          application_id: applicationId,
          // Don't pass contact_ids to import all
        }),
      });

      if (!importResponse.ok) {
        const errorData = await importResponse.json();
        throw new Error(errorData.error || 'Failed to import contacts');
      }

      const importData = await importResponse.json();
      const importedCount = importData.imported || contacts.length;
      
      setContactsImported(importedCount);
      setStatus('success');
      
      toast.success(`Successfully imported ${importedCount} contact${importedCount !== 1 ? 's' : ''}!`);
      
      // Call completion callback
      onImportComplete();
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        if (isMountedRef.current) {
          setStatus('idle');
        }
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setErrorMessage(errorMessage);
      setStatus('error');
      toast.error('Failed to fetch or import contacts', {
        description: errorMessage,
      });
    }
  }, [companyId, applicationId, onImportComplete]);

  const startPolling = useCallback((listIdToPoll: string) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    let attempts = 0;
    let isPolling = true;

    const poll = async () => {
      console.log(`[WizaAutomatedFlow] Poll function called, isPolling: ${isPolling}`);
      
      if (!isPolling) {
        console.log('[WizaAutomatedFlow] Poll stopped - polling disabled');
        return;
      }

      attempts++;
      setPollAttempts(attempts);
      
      console.log(`[WizaAutomatedFlow] Polling attempt ${attempts}/${MAX_POLL_ATTEMPTS}`);

      if (attempts > MAX_POLL_ATTEMPTS) {
        // Timeout
        console.log('[WizaAutomatedFlow] Polling timeout reached');
        isPolling = false;
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setStatus('timeout');
        return;
      }

      try {
        console.log(`[WizaAutomatedFlow] Calling checkListStatus for list: ${listIdToPoll}`);
        const { status: wizaStatus, isComplete } = await checkListStatus(listIdToPoll);
        
        console.log(`[WizaAutomatedFlow] Status check result: status="${wizaStatus}", isComplete=${isComplete}`);
        
        if (isComplete) {
          console.log('[WizaAutomatedFlow] List is complete, stopping polling and fetching contacts');
          isPolling = false;
          // Stop polling
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          
          // Fetch and import contacts
          await fetchAndImportContacts(listIdToPoll);
        } else {
          console.log(`[WizaAutomatedFlow] List not complete yet (${wizaStatus}), continuing to poll...`);
        }
        // Otherwise, continue polling
      } catch (err) {
        console.error('[WizaAutomatedFlow] Polling error:', err);
        console.error('[WizaAutomatedFlow] Error details:', err instanceof Error ? err.message : String(err));
        // Continue polling on error (might be temporary)
        if (attempts >= MAX_POLL_ATTEMPTS) {
          isPolling = false;
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setStatus('timeout');
        }
      }
    };

    // Start polling immediately, then every interval
    console.log('[WizaAutomatedFlow] Starting polling for list:', listIdToPoll);
    
    // Call poll immediately
    poll().catch(err => {
      console.error('[WizaAutomatedFlow] Initial poll failed:', err);
    });
    
    // Set up interval
    pollIntervalRef.current = setInterval(() => {
      poll().catch(err => {
        console.error('[WizaAutomatedFlow] Interval poll failed:', err);
      });
    }, POLL_INTERVAL_MS);
    
    console.log('[WizaAutomatedFlow] Polling interval set up:', pollIntervalRef.current);
  }, [checkListStatus, fetchAndImportContacts]);

  const handleCheckStatus = useCallback(async () => {
    if (!listId) return;

    setStatus('polling');
    setErrorMessage(null);

    try {
      const { status: wizaStatus, isComplete } = await checkListStatus(listId);
      
      if (isComplete) {
        await fetchAndImportContacts(listId);
      } else {
        // Not complete yet, show current status
        setStatus('polling');
        toast.info(`List status: ${wizaStatus}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setErrorMessage(errorMessage);
      setStatus('error');
      toast.error('Failed to check status', {
        description: errorMessage,
      });
    }
  }, [listId, checkListStatus, fetchAndImportContacts]);

  // Auto-start on mount
  useEffect(() => {
    isMountedRef.current = true;
    console.log('[WizaAutomatedFlow] Auto-start effect, isMountedRef set to true, status:', status);
    if (status === 'idle') {
      handleCreateList();
    }
  }, []); // Only run once on mount

  return (
    <div className="p-8 rounded-[2rem] bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-300">
      {status === 'creating' && (
        <div className="text-center">
          <div className="mb-6">
            <svg className="animate-spin h-16 w-16 mx-auto text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2">Creating Prospect List</h3>
          <p className="text-gray-700 font-semibold">Setting up your search for {companyName}...</p>
        </div>
      )}

      {status === 'polling' && (
        <div className="text-center">
          <div className="mb-6">
            <svg className="animate-spin h-16 w-16 mx-auto text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2">Searching for Contacts</h3>
          <p className="text-gray-700 font-semibold mb-2">
            {currentListStatus ? getStatusMessage(currentListStatus, pollAttempts) : 'Searching...'}
          </p>
          <p className="text-sm text-gray-600 font-medium">
            Attempt {pollAttempts} of {MAX_POLL_ATTEMPTS} ({Math.round((pollAttempts / MAX_POLL_ATTEMPTS) * 100)}%)
          </p>
          {listId && (
            <p className="text-xs text-gray-500 font-medium mt-2">List ID: {listId}</p>
          )}
        </div>
      )}

      {status === 'fetching' && (
        <div className="text-center">
          <div className="mb-6">
            <svg className="animate-spin h-16 w-16 mx-auto text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2">Fetching Contacts</h3>
          <p className="text-gray-700 font-semibold">Retrieving contacts from Wiza...</p>
        </div>
      )}

      {status === 'importing' && (
        <div className="text-center">
          <div className="mb-6">
            <svg className="animate-spin h-16 w-16 mx-auto text-green-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2">Importing Contacts</h3>
          <p className="text-gray-700 font-semibold">Adding {contactsFound} contact{contactsFound !== 1 ? 's' : ''} to your database...</p>
        </div>
      )}

      {status === 'success' && (
        <div className="text-center">
          <div className="mb-6">
            <svg className="h-16 w-16 mx-auto text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2">Success!</h3>
          <p className="text-gray-700 font-semibold mb-4">
            Successfully imported {contactsImported} contact{contactsImported !== 1 ? 's' : ''}!
          </p>
          <p className="text-sm text-gray-600 font-medium">Contacts are now available in your contacts list.</p>
        </div>
      )}

      {status === 'no_contacts' && (
        <div className="text-center">
          <div className="mb-6">
            <svg className="h-16 w-16 mx-auto text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2">No Contacts Found</h3>
          <p className="text-gray-700 font-semibold mb-4">
            Wiza couldn't find any product management contacts for {companyName}.
          </p>
          <p className="text-sm text-gray-600 font-medium">Try using the manual flow to search with different parameters.</p>
        </div>
      )}

      {status === 'timeout' && (
        <div className="text-center">
          <div className="mb-6">
            <svg className="h-16 w-16 mx-auto text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2">Search Taking Longer Than Expected</h3>
          <p className="text-gray-700 font-semibold mb-4">
            The search has been running for 5 minutes. You can check the status manually.
          </p>
          {listId && (
            <p className="text-sm text-gray-600 font-medium mb-4">List ID: {listId}</p>
          )}
          <button
            onClick={handleCheckStatus}
            disabled={contactsImported > 0}
            className="px-6 py-3 rounded-[1rem] bg-gradient-to-br from-blue-500 to-purple-500 shadow-[0_4px_0_0_rgba(59,130,246,0.4)] border-2 border-blue-600 hover:translate-y-1 hover:shadow-[0_2px_0_0_rgba(59,130,246,0.4)] font-black text-white transition-all duration-200 disabled:opacity-50 disabled:translate-y-0"
          >
            {contactsImported > 0 ? 'Already Imported' : 'Check Status'}
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="text-center">
          <div className="mb-6">
            <svg className="h-16 w-16 mx-auto text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2">Error</h3>
          <p className="text-gray-700 font-semibold mb-4">{errorMessage || 'An error occurred'}</p>
          <button
            onClick={handleCreateList}
            className="px-6 py-3 rounded-[1rem] bg-gradient-to-br from-blue-500 to-purple-500 shadow-[0_4px_0_0_rgba(59,130,246,0.4)] border-2 border-blue-600 hover:translate-y-1 hover:shadow-[0_2px_0_0_rgba(59,130,246,0.4)] font-black text-white transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

