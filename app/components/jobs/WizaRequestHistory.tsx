'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface WizaRequest {
  id: string;
  wiza_list_id: string | null;
  search_name: string;
  search_type: string;
  status: string;
  wiza_status: string | null;
  contacts_found: number;
  contacts_imported: number;
  company_id: string;
  application_id: string | null;
  company?: {
    name: string;
  };
  stats_people_count?: number;
  stats_valid_count?: number;
  stats_risky_count?: number;
  stats_unfound_count?: number;
  stats_duplicate_count?: number;
  stats_emails_count?: number;
  stats_phones_count?: number;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  started_at: string;
}

interface WizaRequestHistoryProps {
  applicationId: string;
  currentRequestId?: string | null;
  refreshTrigger?: number; // Trigger refresh when this changes
  onImportComplete?: () => void; // Callback when contacts are imported
}

export const WizaRequestHistory = ({
  applicationId,
  currentRequestId,
  refreshTrigger,
  onImportComplete,
}: WizaRequestHistoryProps) => {
  const [allRequests, setAllRequests] = useState<WizaRequest[]>([]);
  const [checkingStatus, setCheckingStatus] = useState<Set<string>>(new Set());
  const fetchingRequestsRef = useRef<boolean>(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const capitalizeStatus = (status: string): string => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getStatusColor = (requestStatus: string) => {
    const statusLower = requestStatus.toLowerCase();
    if (statusLower === 'completed') return 'bg-green-100 text-green-700 border-green-400';
    if (statusLower === 'processing') return 'bg-blue-100 text-blue-700 border-blue-400';
    if (statusLower === 'no_contacts') return 'bg-yellow-100 text-yellow-700 border-yellow-400';
    if (statusLower === 'failed') return 'bg-red-100 text-red-700 border-red-400';
    return 'bg-gray-100 text-gray-700 border-gray-400';
  };

  const fetchAllRequests = useCallback(async () => {
    if (!applicationId) {
      console.log('[WizaRequestHistory] No applicationId, skipping fetch');
      return;
    }
    
    // Prevent duplicate concurrent fetches
    if (fetchingRequestsRef.current) {
      console.log('[WizaRequestHistory] Already fetching requests, skipping duplicate call');
      return;
    }

    fetchingRequestsRef.current = true;
    console.log('[WizaRequestHistory] Fetching requests for application_id:', applicationId);
    
    // Safety timeout to reset ref if fetch takes too long
    const timeoutId = setTimeout(() => {
      console.warn('[WizaRequestHistory] Fetch timeout, resetting ref');
      fetchingRequestsRef.current = false;
    }, 10000); // 10 second timeout
    
    try {
      const response = await fetch(
        `/api/jobs/wiza/requests?application_id=${encodeURIComponent(applicationId)}`
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const requests = data.requests || [];
        
        console.log('[WizaRequestHistory] Received requests:', requests.length);
        
        // Deduplicate by ID to prevent duplicate rows
        const uniqueRequests = requests.reduce((acc: WizaRequest[], request: WizaRequest) => {
          if (!acc.find(r => r.id === request.id)) {
            acc.push(request);
          }
          return acc;
        }, []);
        
        console.log('[WizaRequestHistory] Unique requests after deduplication:', uniqueRequests.length);
        setAllRequests(uniqueRequests);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[WizaRequestHistory] Failed to fetch requests:', response.status, errorData);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('[WizaRequestHistory] Error fetching requests:', err);
    } finally {
      fetchingRequestsRef.current = false;
    }
  }, [applicationId]);

  const handleCheckStatus = useCallback(async (request: WizaRequest) => {
    if (!request.wiza_list_id || !request.company_id) {
      console.error('[WizaRequestHistory] Cannot check status: missing wiza_list_id or company_id');
      return;
    }

    if (checkingStatus.has(request.id)) {
      return; // Already checking
    }

    setCheckingStatus(prev => new Set(prev).add(request.id));

    try {
      // Check list status
      const statusResponse = await fetch(
        `/api/jobs/wiza/get-list?list_id=${encodeURIComponent(request.wiza_list_id)}`
      );

      if (!statusResponse.ok) {
        const errorData = await statusResponse.json();
        throw new Error(errorData.error || 'Failed to check status');
      }

      const statusData = await statusResponse.json();
      const listData = statusData.list || statusData;
      
      // Extract status from various possible locations
      const wizaStatus = (listData as any).data?.status || 
                        listData.status || 
                        listData.wiza_status || 
                        (listData as any).state ||
                        'unknown';
      
      const statusLower = String(wizaStatus).toLowerCase().trim();
      const isComplete = statusLower === 'finished' || 
                        statusLower === 'completed' || 
                        statusLower === 'ready' ||
                        statusLower === 'done';

      if (isComplete) {
        // Check if contacts are available
        try {
          const contactsResponse = await fetch(
            `/api/jobs/wiza/list-contacts?list_id=${encodeURIComponent(request.wiza_list_id)}`
          );

          if (contactsResponse.ok) {
            const contactsData = await contactsResponse.json();
            const contacts = contactsData.contacts || [];
            
            if (contacts.length > 0) {
              // Import contacts automatically
              const importResponse = await fetch('/api/jobs/wiza/import-contacts', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  list_id: request.wiza_list_id,
                  company_id: request.company_id,
                  application_id: request.application_id || applicationId,
                }),
              });

              if (importResponse.ok) {
                const importData = await importResponse.json();
                const importedCount = importData.imported || contacts.length;
                
                // Refresh the requests list
                await fetchAllRequests();
                
                // Show success message
                toast.success(`Successfully imported ${importedCount} contact${importedCount !== 1 ? 's' : ''}!`);
                
                // Call the import complete callback if provided
                if (onImportComplete) {
                  onImportComplete();
                }
              } else {
                const errorData = await importResponse.json();
                throw new Error(errorData.error || 'Failed to import contacts');
              }
            } else {
              // No contacts found, just refresh
              await fetchAllRequests();
              toast.info('Search completed but no contacts were found.');
            }
          } else {
            // If list-contacts fails, just refresh to update status
            await fetchAllRequests();
          }
        } catch (err) {
          console.error('[WizaRequestHistory] Error fetching/importing contacts:', err);
          // Still refresh to update status
          await fetchAllRequests();
        }
      } else {
        // Not complete yet, just refresh to show updated status
        await fetchAllRequests();
        toast.info('Search is still in progress. This usually takes 2-5 minutes.');
      }
    } catch (err) {
      console.error('[WizaRequestHistory] Error checking status:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to check status';
      toast.error('Error checking status', {
        description: errorMessage,
      });
    } finally {
      setCheckingStatus(prev => {
        const next = new Set(prev);
        next.delete(request.id);
        return next;
      });
    }
  }, [applicationId, fetchAllRequests, onImportComplete, checkingStatus]);

  // Fetch requests when applicationId or refreshTrigger changes
  useEffect(() => {
    console.log('[WizaRequestHistory] Component mounted/applicationId changed, applicationId:', applicationId);
    if (applicationId) {
      fetchAllRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId, refreshTrigger]);

  if (allRequests.length === 0) {
    return null;
  }

  return (
    <div className="p-6 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300">
      <h3 className="text-xl font-black text-gray-900 mb-4">Contact Search History</h3>
      <div className="space-y-3">
        {allRequests.map((request) => {
          const isCurrent = request.id === currentRequestId;
          return (
            <div
              key={request.id}
              className={`p-5 rounded-[1.5rem] border-2 ${
                isCurrent
                  ? 'bg-blue-50 border-blue-400 shadow-[0_4px_0_0_rgba(59,130,246,0.2)]'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="mb-3">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-base font-black text-gray-900">
                    Contact Discovery for {request.company?.name || request.search_name}
                  </h4>
                  <div className="flex items-center gap-2">
                    {isCurrent && (
                      <span className="px-3 py-1 rounded-[0.75rem] text-xs font-black bg-blue-100 text-blue-700 border-2 border-blue-400">
                        Current
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-[0.75rem] text-xs font-black border-2 ${getStatusColor(request.status)}`}>
                      {capitalizeStatus(request.status)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-700">
                <div className="font-medium">
                  Started Search on {formatDate(request.started_at || request.created_at)}
                </div>
                {request.completed_at && (
                  <div className="font-medium">
                    Completed on {formatDate(request.completed_at)}
                  </div>
                )}
                {request.contacts_found > 0 && (
                  <div className="font-semibold text-gray-900">
                    {request.contacts_found} contact{request.contacts_found !== 1 ? 's' : ''} found at {request.company?.name || request.search_name}
                  </div>
                )}
              </div>
              
              {request.error_message && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-[0.75rem] text-xs text-red-700 font-medium">
                  {request.error_message}
                </div>
              )}
              
              {/* Show Check Status button for processing requests */}
              {request.status === 'processing' && request.wiza_list_id && (
                <div className="mt-3">
                  <button
                    onClick={() => handleCheckStatus(request)}
                    disabled={checkingStatus.has(request.id)}
                    className="px-4 py-2 rounded-[0.75rem] bg-gradient-to-br from-blue-500 to-purple-500 shadow-[0_2px_0_0_rgba(59,130,246,0.4)] border-2 border-blue-600 hover:translate-y-0.5 hover:shadow-[0_1px_0_0_rgba(59,130,246,0.4)] font-black text-white text-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center gap-2"
                  >
                    {checkingStatus.has(request.id) ? (
                      <>
                        <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Checking...
                      </>
                    ) : (
                      'Check Status'
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

