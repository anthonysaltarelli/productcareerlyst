'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface WizaRequest {
  id: string;
  wiza_list_id: string | null;
  search_name: string;
  search_type: string;
  status: string;
  wiza_status: string | null;
  contacts_found: number;
  contacts_imported: number;
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
}

export const WizaRequestHistory = ({
  applicationId,
  currentRequestId,
  refreshTrigger,
}: WizaRequestHistoryProps) => {
  const [allRequests, setAllRequests] = useState<WizaRequest[]>([]);
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
      <h3 className="text-xl font-black text-gray-900 mb-4">Wiza Request History</h3>
      <div className="space-y-3">
        {allRequests.map((request) => {
          const isCurrent = request.id === currentRequestId;
          return (
            <div
              key={request.id}
              className={`p-4 rounded-[1.5rem] border-2 ${
                isCurrent
                  ? 'bg-blue-50 border-blue-400 shadow-[0_4px_0_0_rgba(59,130,246,0.2)]'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-3 py-1 rounded-[0.75rem] text-xs font-black border-2 ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                    {isCurrent && (
                      <span className="px-3 py-1 rounded-[0.75rem] text-xs font-black bg-blue-100 text-blue-700 border-2 border-blue-400">
                        Current
                      </span>
                    )}
                    {request.wiza_status && (
                      <span className="text-xs text-gray-600 font-semibold">
                        Wiza: {request.wiza_status}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    Search: {request.search_name}
                  </div>
                  {request.wiza_list_id && (
                    <div className="text-xs text-gray-600 font-medium mt-1">
                      List ID: {request.wiza_list_id}
                    </div>
                  )}
                </div>
                <div className="text-right text-xs text-gray-600 font-medium">
                  {formatDate(request.created_at)}
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-3 text-sm flex-wrap">
                {request.contacts_found > 0 && (
                  <span className="font-semibold text-gray-700">
                    Found: {request.contacts_found}
                  </span>
                )}
                {request.contacts_imported > 0 && (
                  <span className="font-semibold text-green-700">
                    Imported: {request.contacts_imported}
                  </span>
                )}
                {request.stats_valid_count !== undefined && request.stats_valid_count > 0 && (
                  <span className="font-semibold text-green-600">
                    Valid: {request.stats_valid_count}
                  </span>
                )}
                {request.stats_risky_count !== undefined && request.stats_risky_count > 0 && (
                  <span className="font-semibold text-yellow-600">
                    Risky: {request.stats_risky_count}
                  </span>
                )}
                {request.stats_unfound_count !== undefined && request.stats_unfound_count > 0 && (
                  <span className="font-semibold text-gray-500">
                    Unfound: {request.stats_unfound_count}
                  </span>
                )}
                {request.completed_at && (
                  <span className="text-gray-500">
                    Completed: {formatDate(request.completed_at)}
                  </span>
                )}
              </div>
              
              {request.error_message && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-[0.75rem] text-xs text-red-700 font-medium">
                  {request.error_message}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

