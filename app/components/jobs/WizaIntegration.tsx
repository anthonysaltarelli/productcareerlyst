'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface WizaContact {
  id?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  linkedin?: string;
  linkedin_profile_url?: string;
  email_status?: 'valid' | 'risky';
}

interface WizaIntegrationProps {
  companyName: string;
  companyId: string;
  companyLinkedinUrl?: string;
  applicationId?: string;
  onImportComplete: () => void;
}

type Step = 'idle' | 'creating' | 'created' | 'fetching' | 'fetched' | 'importing' | 'imported' | 'error';

export const WizaIntegration = ({
  companyName,
  companyId,
  companyLinkedinUrl,
  applicationId,
  onImportComplete,
}: WizaIntegrationProps) => {
  const [step, setStep] = useState<Step>('idle');
  const [listId, setListId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<WizaContact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  
  // Get List step state
  const [getListId, setGetListId] = useState<string>('');
  const [listData, setListData] = useState<any>(null);
  const [isGettingList, setIsGettingList] = useState(false);
  
  // Fetch Contacts step state - allow manual list ID entry
  const [fetchListId, setFetchListId] = useState<string>('');

  const handleCreateList = async () => {
    setStep('creating');
    setError(null);

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
      setStep('created');
      toast.success('Prospect list created successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setStep('error');
      toast.error('Failed to create list', {
        description: errorMessage,
      });
    }
  };

  const handleFetchContacts = async () => {
    // Use manually entered list ID if provided, otherwise use the list ID from Step 1
    const listIdToUse = fetchListId.trim() || listId;
    
    if (!listIdToUse) {
      setError('Please enter a list ID or create a list first');
      return;
    }

    setStep('fetching');
    setError(null);

    try {
      const response = await fetch(
        `/api/jobs/wiza/list-contacts?list_id=${encodeURIComponent(listIdToUse)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch contacts');
      }

      const data = await response.json();
      
      if (data.status === 'no_contacts') {
        setContacts([]);
        setStep('fetched');
        toast.info('No contacts found');
        return;
      }

      const fetchedContacts = data.contacts || [];
      setContacts(fetchedContacts);
      setStep('fetched');
      
      // Update listId if we used a manually entered one
      if (fetchListId.trim() && !listId) {
        setListId(fetchListId.trim());
      }
      
      if (fetchedContacts.length === 0) {
        toast.info('No contacts found in the list');
      } else {
        toast.success(`Found ${fetchedContacts.length} contact${fetchedContacts.length !== 1 ? 's' : ''}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setStep('error');
      toast.error('Failed to fetch contacts', {
        description: errorMessage,
      });
    }
  };

  const handleToggleContact = (contactIndex: number) => {
    const newSelected = new Set(selectedContacts);
    const contactId = String(contactIndex);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedContacts.size === contacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(contacts.map((_, index) => String(index))));
    }
  };

  const handleImport = async () => {
    if (!listId || selectedContacts.size === 0) {
      setError('Please select at least one contact to import');
      return;
    }

    setStep('importing');
    setError(null);

    try {
      // Convert selected indices to contact identifiers (email or index string)
      const contactIds = Array.from(selectedContacts).map(indexStr => {
        const index = parseInt(indexStr);
        const contact = contacts[index];
        // Use email if available, otherwise use index as fallback
        return contact?.email || `contact-${index}`;
      });
      
      const response = await fetch('/api/jobs/wiza/import-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          list_id: listId,
          company_id: companyId,
          application_id: applicationId,
          contact_ids: contactIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import contacts');
      }

      const importData = await response.json();
      setStep('imported');
      toast.success(`Successfully imported ${importData.imported || selectedContacts.size} contact${selectedContacts.size !== 1 ? 's' : ''}`);
      
      // Reset and refresh
      setTimeout(() => {
        onImportComplete();
        setStep('idle');
        setListId(null);
        setContacts([]);
        setSelectedContacts(new Set());
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setStep('error');
      toast.error('Failed to import contacts', {
        description: errorMessage,
      });
    }
  };

  const handleReset = () => {
    setStep('idle');
    setListId(null);
    setContacts([]);
    setSelectedContacts(new Set());
    setError(null);
    setFetchListId('');
  };

  const handleGetList = async () => {
    if (!getListId.trim()) {
      setError('Please enter a list ID');
      return;
    }

    setIsGettingList(true);
    setError(null);
    setListData(null);

    try {
      const response = await fetch(
        `/api/jobs/wiza/get-list?list_id=${encodeURIComponent(getListId.trim())}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get list');
      }

      const data = await response.json();
      setListData(data.list || data);
      toast.success('List retrieved successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error('Failed to get list', {
        description: errorMessage,
      });
    } finally {
      setIsGettingList(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-black text-gray-900 mb-2">Wiza Integration</h3>
        <p className="text-gray-700 font-semibold text-sm mb-4">
          Step-by-step process to find and import contacts from {companyName}
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-300 rounded-[1rem] text-red-700 font-bold text-sm">
          {error}
        </div>
      )}

      {/* Get List Step - Utility for checking any list */}
      <div className="p-6 rounded-[2rem] bg-gradient-to-br from-yellow-50 to-orange-50 shadow-[0_8px_0_0_rgba(234,88,12,0.3)] border-2 border-orange-300">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-lg font-black text-gray-900">Get List Status</h4>
            <p className="text-sm text-gray-600 font-semibold mt-1">
              Enter any list ID to check its status and details
            </p>
          </div>
          {listData ? (
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : isGettingList ? (
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-orange-300 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3 mb-4">
          <input
            type="text"
            value={getListId}
            onChange={(e) => setGetListId(e.target.value)}
            placeholder="Enter list ID (e.g., 12345)"
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleGetList();
              }
            }}
          />
          <button
            onClick={handleGetList}
            disabled={isGettingList || !getListId.trim()}
            className="px-6 py-3 rounded-[1rem] bg-gradient-to-br from-orange-500 to-red-500 shadow-[0_4px_0_0_rgba(234,88,12,0.4)] border-2 border-orange-600 hover:translate-y-1 hover:shadow-[0_2px_0_0_rgba(234,88,12,0.4)] font-black text-white transition-all duration-200 disabled:opacity-50 disabled:translate-y-0"
          >
            {isGettingList ? 'Getting...' : 'Get List'}
          </button>
        </div>

        {listData && (
          <div className="mt-4 p-4 bg-white border-2 border-orange-200 rounded-[1rem]">
            <h5 className="text-sm font-black text-gray-900 mb-3">List Details:</h5>
            <pre className="text-xs font-medium text-gray-700 overflow-x-auto whitespace-pre-wrap bg-gray-50 p-3 rounded-[0.75rem] border border-gray-200">
              {JSON.stringify(listData, null, 2)}
            </pre>
            <button
              onClick={() => {
                setListData(null);
                setGetListId('');
              }}
              className="mt-3 px-4 py-2 rounded-[0.75rem] bg-gray-100 border-2 border-gray-300 text-gray-700 font-black hover:bg-gray-200 transition-colors text-sm"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Step 1: Create List */}
      <div className="p-6 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-lg font-black text-gray-900">Step 1: Create Prospect List</h4>
            <p className="text-sm text-gray-600 font-semibold mt-1">
              Create a list in Wiza to search for contacts
            </p>
          </div>
          {step === 'created' || step === 'fetching' || step === 'fetched' || step === 'importing' || step === 'imported' ? (
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : step === 'creating' ? (
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-white font-black text-sm">1</span>
            </div>
          )}
        </div>
        {listId && (
          <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-[1rem]">
            <p className="text-sm font-bold text-blue-900">List ID: {listId}</p>
          </div>
        )}
        <button
          onClick={handleCreateList}
          disabled={step === 'creating' || step === 'created' || step === 'fetching' || step === 'fetched' || step === 'importing' || step === 'imported'}
          className="w-full px-6 py-3 rounded-[1rem] bg-gradient-to-br from-blue-500 to-purple-500 shadow-[0_4px_0_0_rgba(59,130,246,0.4)] border-2 border-blue-600 hover:translate-y-1 hover:shadow-[0_2px_0_0_rgba(59,130,246,0.4)] font-black text-white transition-all duration-200 disabled:opacity-50 disabled:translate-y-0"
        >
          {step === 'creating' ? 'Creating...' : step === 'created' || step === 'fetching' || step === 'fetched' || step === 'importing' || step === 'imported' ? 'Created ✓' : 'Create Prospect List'}
        </button>
      </div>

      {/* Step 2: Fetch Contacts */}
      <div className="p-6 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-lg font-black text-gray-900">Step 2: Fetch Contacts</h4>
            <p className="text-sm text-gray-600 font-semibold mt-1">
              Retrieve contacts from the prospect list (use list from Step 1 or enter any list ID)
            </p>
          </div>
          {step === 'fetched' || step === 'importing' || step === 'imported' ? (
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : step === 'fetching' ? (
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-white font-black text-sm">2</span>
            </div>
          )}
        </div>
        
        {listId && (
          <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-[1rem]">
            <p className="text-sm font-bold text-blue-900">List ID from Step 1: {listId}</p>
          </div>
        )}
        
        <div className="mb-4">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Or enter a different list ID:
          </label>
          <input
            type="text"
            value={fetchListId}
            onChange={(e) => setFetchListId(e.target.value)}
            placeholder="Enter list ID (e.g., 12345)"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleFetchContacts();
              }
            }}
          />
        </div>
        
        {contacts.length > 0 && (
          <div className="mb-4 p-3 bg-green-50 border-2 border-green-200 rounded-[1rem]">
            <p className="text-sm font-bold text-green-900">Found {contacts.length} contact{contacts.length !== 1 ? 's' : ''}</p>
          </div>
        )}
        
        <button
          onClick={handleFetchContacts}
          disabled={(!listId && !fetchListId.trim()) || step === 'fetching' || step === 'creating' || step === 'error'}
          className="w-full px-6 py-3 rounded-[1rem] bg-gradient-to-br from-blue-500 to-purple-500 shadow-[0_4px_0_0_rgba(59,130,246,0.4)] border-2 border-blue-600 hover:translate-y-1 hover:shadow-[0_2px_0_0_rgba(59,130,246,0.4)] font-black text-white transition-all duration-200 disabled:opacity-50 disabled:translate-y-0"
        >
          {step === 'fetching' ? 'Fetching...' : step === 'fetched' || step === 'importing' || step === 'imported' ? 'Fetched ✓' : 'Fetch Contacts'}
        </button>
      </div>

      {/* Step 3: Display and Select Contacts */}
      {contacts.length > 0 && (
        <div className="p-6 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-black text-gray-900">Step 3: Select Contacts</h4>
              <p className="text-sm text-gray-600 font-semibold mt-1">
                Choose which contacts to import
              </p>
            </div>
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 rounded-[0.75rem] bg-gray-100 border-2 border-gray-300 text-gray-700 font-black hover:bg-gray-200 transition-colors text-sm"
            >
              {selectedContacts.size === contacts.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2 border-2 border-gray-200 rounded-[1rem] p-4 mb-4">
            {contacts.map((contact, index) => {
              const fullName = contact.full_name || 
                `${contact.first_name || ''} ${contact.last_name || ''}`.trim() ||
                'Unknown';
              const isSelected = selectedContacts.has(String(index));

              return (
                <div
                  key={index}
                  onClick={() => handleToggleContact(index)}
                  className={`p-4 rounded-[1rem] border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-purple-50 border-purple-400 shadow-[0_2px_0_0_rgba(147,51,234,0.2)]'
                      : 'bg-white border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleContact(index)}
                      className="mt-1 w-5 h-5 rounded border-2 border-gray-300 text-purple-600 focus:ring-purple-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-gray-900">{fullName}</div>
                      {contact.title && (
                        <div className="text-sm text-gray-700 font-semibold mt-1">
                          {contact.title}
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                        {contact.email && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {contact.email}
                          </span>
                        )}
                        {(contact.linkedin_url || contact.linkedin || contact.linkedin_profile_url) && (
                          <a
                            href={contact.linkedin_profile_url || contact.linkedin_url || contact.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                            </svg>
                            LinkedIn
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
            <div className="text-sm text-gray-700 font-semibold">
              {selectedContacts.size} of {contacts.length} selected
            </div>
            <button
              onClick={handleImport}
              disabled={step === 'importing' || step === 'imported' || selectedContacts.size === 0}
              className="px-6 py-3 rounded-[1rem] bg-gradient-to-br from-green-500 to-emerald-500 shadow-[0_4px_0_0_rgba(22,163,74,0.4)] border-2 border-green-600 hover:translate-y-1 hover:shadow-[0_2px_0_0_rgba(22,163,74,0.4)] font-black text-white transition-all duration-200 disabled:opacity-50 disabled:translate-y-0"
            >
              {step === 'importing' ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Importing...
                </span>
              ) : step === 'imported' ? (
                'Imported ✓'
              ) : (
                `Import ${selectedContacts.size} Contact${selectedContacts.size !== 1 ? 's' : ''}`
              )}
            </button>
          </div>
        </div>
      )}

      {/* Reset Button */}
      {(step === 'imported' || step === 'error') && (
        <button
          onClick={handleReset}
          className="w-full px-6 py-3 rounded-[1rem] border-2 border-gray-300 bg-white text-gray-700 font-black hover:bg-gray-50 transition-colors"
        >
          Start Over
        </button>
      )}
    </div>
  );
};

