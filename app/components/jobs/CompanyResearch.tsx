'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ResearchType, CompanyResearch as CompanyResearchType } from '@/lib/types/jobs';

interface CompanyResearchProps {
  companyId: string;
  companyName: string;
}

const RESEARCH_VECTORS: Array<{ type: ResearchType; label: string; icon: string }> = [
  { type: 'mission', label: 'Mission', icon: '🎯' },
  { type: 'values', label: 'Values', icon: '💎' },
  { type: 'origin_story', label: 'Origin Story', icon: '📖' },
  { type: 'product', label: 'Product', icon: '📦' },
  { type: 'user_types', label: 'User Types', icon: '👥' },
  { type: 'competition', label: 'Competition', icon: '🏆' },
  { type: 'risks', label: 'Risks', icon: '⚠️' },
  { type: 'recent_launches', label: 'Recent Launches', icon: '🚀' },
  { type: 'strategy', label: 'Strategy', icon: '🎯' },
  { type: 'funding', label: 'Funding', icon: '💰' },
  { type: 'partnerships', label: 'Partnerships', icon: '🤝' },
  { type: 'customer_feedback', label: 'Customer Feedback', icon: '💬' },
  { type: 'business_model', label: 'Business Model', icon: '📊' },
];

export const CompanyResearch = ({ companyId, companyName }: CompanyResearchProps) => {
  const [research, setResearch] = useState<Record<string, CompanyResearchType & { is_valid: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedVector, setSelectedVector] = useState<ResearchType | null>(null);
  const [loadingVectors, setLoadingVectors] = useState<Set<ResearchType>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [expandedSources, setExpandedSources] = useState<Set<ResearchType>>(new Set());
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch research without setting loading state (for polling)
  const fetchResearchSilent = async () => {
    try {
      const response = await fetch(`/api/jobs/companies/${companyId}/research`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch research');
      }

      const data = await response.json();
      setResearch(data.research || {});
      return data.research || {};
    } catch (error) {
      console.error('Error fetching research:', error);
      return {};
    }
  };

  const fetchResearch = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/companies/${companyId}/research`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch research');
      }

      const data = await response.json();
      setResearch(data.research || {});
    } catch (error) {
      console.error('Error fetching research:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAllResearch = async () => {
    try {
      console.log('=== generateAllResearch START ===');
      console.log('Company ID:', companyId);
      console.log('Company Name:', companyName);
      
      if (!companyId) {
        const errorMsg = 'Company ID is missing';
        console.error(errorMsg);
        setError(errorMsg);
        return;
      }
      
      setGenerating(true);
      setError(null);
      
      const url = `/api/jobs/companies/${companyId}/research`;
      console.log('Fetching URL:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        let errorData;
        try {
          const text = await response.text();
          console.log('Error response text:', text);
          errorData = JSON.parse(text);
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        const errorMessage = errorData.error || `Failed to start research generation (${response.status})`;
        console.error('Error message:', errorMessage);
        console.error('Error details:', errorData);
        setError(errorMessage);
        setGenerating(false);
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log('Success response:', responseData);

      // Clear any existing polling interval
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }

      // Start polling for updates (silent updates, no loading state)
      pollIntervalRef.current = setInterval(async () => {
        const updatedResearch = await fetchResearchSilent();
        
        // Check if all vectors are loaded (only count valid research)
        const allLoaded = RESEARCH_VECTORS.every((vector) => {
          const researchItem = updatedResearch[vector.type];
          return researchItem !== undefined && researchItem.is_valid;
        });

        if (allLoaded) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setGenerating(false);
          // Auto-select first vector when all research is complete (only valid research)
          if (!selectedVector) {
            const firstVector = RESEARCH_VECTORS.find((v) => {
              const researchItem = updatedResearch[v.type];
              return researchItem && researchItem.is_valid;
            });
            if (firstVector) {
              setSelectedVector(firstVector.type);
            }
          }
        }
      }, 3000); // Poll every 3 seconds

      // Stop polling after 10 minutes
      setTimeout(() => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setGenerating(false);
      }, 10 * 60 * 1000);
    } catch (error) {
      console.error('=== generateAllResearch ERROR ===');
      console.error('Error type:', error?.constructor?.name);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Full error:', error);
      setGenerating(false);
      setError(error instanceof Error ? error.message : 'Failed to start research generation');
    } finally {
      console.log('=== generateAllResearch END ===');
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const generateSingleResearch = async (researchType: ResearchType) => {
    let pollInterval: NodeJS.Timeout | null = null;
    
    try {
      setLoadingVectors((prev) => new Set(prev).add(researchType));
      
      const response = await fetch(`/api/jobs/companies/${companyId}/research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ research_type: researchType }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate research');
      }

      const data = await response.json();
      
      // Update research state immediately if available
      if (data.research) {
        setResearch((prev) => ({
          ...prev,
          [researchType]: data.research,
        }));
        setLoadingVectors((prev) => {
          const next = new Set(prev);
          next.delete(researchType);
          return next;
        });
      } else {
        // If async, poll for updates
        pollInterval = setInterval(async () => {
          const updatedResearch = await fetchResearchSilent();
          if (updatedResearch[researchType]) {
            if (pollInterval) {
              clearInterval(pollInterval);
            }
            setLoadingVectors((prev) => {
              const next = new Set(prev);
              next.delete(researchType);
              return next;
            });
          }
        }, 2000);

        // Stop polling after 5 minutes
        setTimeout(() => {
          if (pollInterval) {
            clearInterval(pollInterval);
          }
          setLoadingVectors((prev) => {
            const next = new Set(prev);
            next.delete(researchType);
            return next;
          });
        }, 5 * 60 * 1000);
      }
    } catch (error) {
      console.error('Error generating research:', error);
      setLoadingVectors((prev) => {
        const next = new Set(prev);
        next.delete(researchType);
        return next;
      });
    }
  };

  // Filter out stale research - treat it as if it doesn't exist
  const validResearch = useMemo(() => {
    return Object.fromEntries(
      Object.entries(research).filter(([_, r]) => r.is_valid)
    );
  }, [research]);

  useEffect(() => {
    if (companyId) {
      fetchResearch();
    }
  }, [companyId]);

  // Auto-select first available vector (only valid research)
  useEffect(() => {
    if (!selectedVector && Object.keys(validResearch).length > 0) {
      const firstVector = RESEARCH_VECTORS.find((v) => validResearch[v.type]);
      if (firstVector) {
        setSelectedVector(firstVector.type);
      }
    }
  }, [validResearch, selectedVector]);

  const getVectorStatus = (type: ResearchType) => {
    const vectorResearch = research[type];
    
    if (loadingVectors.has(type)) {
      return { status: 'loading', label: 'Loading...', color: 'blue' };
    }
    
    // Treat stale research as missing (user will need to regenerate all)
    if (!vectorResearch || !vectorResearch.is_valid) {
      return { status: 'missing', label: 'Not generated', color: 'gray' };
    }
    
    return { status: 'ready', label: 'Ready', color: 'green' };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysAgo === 0) return 'Today';
    if (daysAgo === 1) return '1 day ago';
    return `${daysAgo} days ago`;
  };

  const selectedResearch = selectedVector && validResearch[selectedVector] 
    ? validResearch[selectedVector] 
    : null;

  // Calculate progress (only count valid research)
  const completedCount = RESEARCH_VECTORS.filter((v) => validResearch[v.type]).length;
  const totalCount = RESEARCH_VECTORS.length;
  const progressPercentage = (completedCount / totalCount) * 100;

  // Initial loading state
  if (loading) {
    return (
      <div className="p-8 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl mb-4">
          <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <p className="text-gray-600 font-semibold">Loading research...</p>
      </div>
    );
  }

  // Research generation loading state (show when generating and no valid research yet)
  if (generating && Object.keys(validResearch).length === 0) {
    return (
      <div className="p-12 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl mb-6">
            <svg className="animate-spin h-10 w-10 text-purple-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2">Generating Research</h3>
          <p className="text-gray-600 font-medium">
            Researching {companyName} across all {totalCount} research vectors...
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-700">Progress</span>
            <span className="text-sm font-bold text-purple-600">{completedCount} / {totalCount}</span>
          </div>
          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Vector Status List */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {RESEARCH_VECTORS.map((vector) => {
            const hasResearch = !!validResearch[vector.type];
            return (
              <div
                key={vector.type}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                  hasResearch
                    ? 'bg-green-50 border-green-300'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex-shrink-0">
                  {hasResearch ? (
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="animate-spin w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                </div>
                <span className="text-xl">{vector.icon}</span>
                <span className={`font-bold text-sm flex-1 ${hasResearch ? 'text-green-700' : 'text-gray-700'}`}>
                  {vector.label}
                </span>
                {hasResearch && (
                  <span className="text-xs text-green-600 font-semibold">Complete</span>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-sm text-gray-500 mt-6 text-center">
          This may take a few minutes.
        </p>
      </div>
    );
  }

  // Empty state (no valid research and not generating)
  if (Object.keys(validResearch).length === 0 && !generating) {
    return (
      <div className="p-12 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300 text-center">
        <div className="text-6xl mb-6">🔍</div>
        <h3 className="text-2xl font-black text-gray-900 mb-4">No Research Available</h3>
        <p className="text-gray-600 font-medium mb-8 max-w-md mx-auto">
          Generate comprehensive research for {companyName} across all {totalCount} research vectors to get insights on mission, values, competition, and more.
        </p>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-xl text-red-700 font-bold max-w-md mx-auto">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}
        
        <button
          onClick={() => {
            setError(null);
            generateAllResearch();
          }}
          disabled={generating}
          className="px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-purple-600 to-pink-600 shadow-[0_6px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-700 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200 flex items-center gap-3 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating Research...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate All Research
            </>
          )}
        </button>
        {generating && (
          <p className="text-sm text-gray-500 mt-4">
            This may take a few minutes.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in-scale">
      {/* Sidebar */}
      <div className="lg:col-span-1">
        <div className="p-6 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300 sticky top-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-gray-900">Research Vectors</h3>
            {generating && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-blue-600">{completedCount}/{totalCount}</span>
              </div>
            )}
          </div>
          {/* Generate Missing Vectors Button */}
          {!generating && completedCount < totalCount && completedCount > 0 && (
            <button
              onClick={generateAllResearch}
              className="w-full mb-4 px-4 py-2 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 text-white font-bold text-sm shadow-[0_4px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-700 hover:translate-y-1 hover:shadow-[0_2px_0_0_rgba(147,51,234,0.6)] transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Generate Missing ({totalCount - completedCount})
            </button>
          )}
          {generating && (
            <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-700">Generating...</span>
                <span className="text-xs font-bold text-blue-600">{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}
          <nav className="space-y-2 max-h-[600px] overflow-y-auto">
            {RESEARCH_VECTORS.map((vector) => {
              const status = getVectorStatus(vector.type);
              const isSelected = selectedVector === vector.type;
              const isLoading = loadingVectors.has(vector.type);
              const hasResearch = !!validResearch[vector.type];
              const isGenerating = generating && !hasResearch;
              const isMissing = !hasResearch && !isLoading && !isGenerating;
              
              const handleRetryClick = (e: React.MouseEvent) => {
                e.stopPropagation(); // Prevent selecting the vector
                generateSingleResearch(vector.type);
              };
              
              return (
                <div
                  key={vector.type}
                  className={`group relative w-full rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'bg-purple-100 border-purple-400'
                      : hasResearch
                      ? 'border-gray-200 hover:bg-gray-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <button
                    onClick={() => {
                      // Allow selecting any vector (even missing ones) so user can see retry option
                      if (!isLoading && !isGenerating) {
                        setSelectedVector(vector.type);
                      }
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                      isSelected
                        ? 'text-purple-700'
                        : hasResearch
                        ? 'text-gray-700'
                        : 'text-gray-500'
                    } ${isLoading || isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    disabled={isLoading || isGenerating}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{vector.icon}</span>
                        <span className="font-bold text-sm">{vector.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isLoading && (
                          <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        )}
                        {isGenerating && (
                          <svg className="animate-spin h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        )}
                        {isMissing && (
                          <button
                            onClick={handleRetryClick}
                            className="p-1.5 rounded-lg hover:bg-purple-200 text-purple-600 hover:text-purple-700 transition-colors"
                            title={`Generate ${vector.label} research`}
                            aria-label={`Generate ${vector.label} research`}
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:col-span-3">
        {selectedResearch ? (
          <div className="p-8 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-gray-900">
                {RESEARCH_VECTORS.find((v) => v.type === selectedVector)?.label}
              </h2>
            </div>

            {/* Content */}
            <div className="text-gray-700 font-medium leading-relaxed mb-8">
              {selectedResearch.perplexity_response.choices?.[0]?.message?.content ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Suppress horizontal rules
                    hr: () => null,
                    // Headings
                    h1: ({ children }) => (
                      <h1 className="text-3xl font-black text-gray-900 mt-8 mb-4 first:mt-0">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-2xl font-black text-gray-900 mt-6 mb-3 first:mt-0">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xl font-black text-gray-900 mt-5 mb-2 first:mt-0">
                        {children}
                      </h3>
                    ),
                    // Paragraphs - reduced spacing
                    p: ({ children }) => (
                      <p className="mb-3 last:mb-0 leading-relaxed">
                        {children}
                      </p>
                    ),
                    // Lists
                    ul: ({ children }) => (
                      <ul className="mb-3 ml-6 list-disc space-y-1 last:mb-0 [&_ul]:ml-6 [&_ul]:mt-1 [&_ol]:ml-6 [&_ol]:mt-1">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-3 ml-6 list-decimal space-y-1 last:mb-0 [&_ul]:ml-6 [&_ul]:mt-1 [&_ol]:ml-6 [&_ol]:mt-1">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="leading-relaxed">
                        {children}
                      </li>
                    ),
                    // Strong and emphasis
                    strong: ({ children }) => (
                      <strong className="font-black text-gray-900">
                        {children}
                      </strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic">
                        {children}
                      </em>
                    ),
                    // Links (for citations)
                    a: ({ href, children }) => {
                      // Check if it's a citation link (starts with #source-)
                      if (href?.startsWith('#')) {
                        return <>{children}</>;
                      }
                      return (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-700 hover:underline font-semibold"
                        >
                          {children}
                        </a>
                      );
                    },
                    // Tables
                    table: ({ children }) => (
                      <div className="my-4 overflow-x-auto">
                        <table className="min-w-full border-collapse border-2 border-gray-300">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="bg-gray-100">
                        {children}
                      </thead>
                    ),
                    tbody: ({ children }) => (
                      <tbody>
                        {children}
                      </tbody>
                    ),
                    tr: ({ children }) => (
                      <tr className="border-b border-gray-200 hover:bg-gray-50">
                        {children}
                      </tr>
                    ),
                    th: ({ children }) => (
                      <th className="px-4 py-2 text-left font-black text-gray-900 border-2 border-gray-300">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-4 py-2 text-gray-700 border border-gray-200">
                        {children}
                      </td>
                    ),
                  }}
                >
                  {(() => {
                    // Pre-process content to replace citations with markdown links
                    const content = selectedResearch.perplexity_response.choices?.[0]?.message?.content || '';
                    const sources = selectedResearch.perplexity_response.search_results || [];
                    
                    // Replace citation patterns [1], [2], etc. with markdown links
                    return content.replace(/\[(\d+)\]/g, (match: string, citationNum: string) => {
                      const sourceIndex = parseInt(citationNum, 10) - 1;
                      if (sourceIndex >= 0 && sourceIndex < sources.length && sources[sourceIndex]?.url) {
                        const sourceUrl = sources[sourceIndex].url;
                        return `[${match}](${sourceUrl})`;
                      }
                      return match;
                    });
                  })()}
                </ReactMarkdown>
              ) : (
                <p>No content available</p>
              )}
            </div>

            {/* Sources */}
            {selectedResearch.perplexity_response.search_results && selectedResearch.perplexity_response.search_results.length > 0 && (
              <div className="mt-8 pt-8 border-t-2 border-gray-200">
                <h3 className="text-xl font-black text-gray-900 mb-4">
                  Sources ({selectedResearch.perplexity_response.search_results.length})
                </h3>
                <div className="space-y-3">
                  {(() => {
                    const fullSources = selectedResearch.perplexity_response.search_results || [];
                    const isExpanded = expandedSources.has(selectedVector!);
                    const sourcesToShow = isExpanded 
                      ? fullSources 
                      : fullSources.slice(0, 5);
                    const remainingCount = fullSources.length - 5;
                    
                    return (
                      <>
                        {sourcesToShow.map((source: any, index: number) => {
                          // Get the actual index in the full sources array
                          const actualSourceIndex = fullSources.findIndex((s: any) => s === source);
                          
                          return (
                          <div 
                            key={actualSourceIndex >= 0 ? actualSourceIndex : index} 
                            className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors"
                          >
                            <h4 className="font-bold text-sm text-gray-900 mb-1">{source.title}</h4>
                            <p className="text-xs text-gray-500 mb-2">
                              {source.date && `Published: ${source.date}`}
                              {source.last_updated && ` | Last updated: ${source.last_updated}`}
                            </p>
                            {source.snippet && (
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{source.snippet}</p>
                            )}
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-purple-600 font-semibold text-sm"
                            >
                              View Source →
                            </a>
                          </div>
                          );
                        })}
                        {remainingCount > 0 && (
                          <button
                            onClick={() => {
                              setExpandedSources((prev) => {
                                const next = new Set(prev);
                                if (isExpanded) {
                                  next.delete(selectedVector!);
                                } else {
                                  next.add(selectedVector!);
                                }
                                return next;
                              });
                            }}
                            className="w-full mt-2 px-4 py-2 text-sm font-bold text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg border-2 border-purple-200 hover:border-purple-300 transition-colors"
                          >
                            {isExpanded ? 'Show less' : `Show ${remainingCount} more sources`}
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        ) : selectedVector ? (
          <div className="p-8 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300 text-center">
            <div className="text-6xl mb-4">
              {RESEARCH_VECTORS.find((v) => v.type === selectedVector)?.icon}
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">
              {RESEARCH_VECTORS.find((v) => v.type === selectedVector)?.label} Research Not Available
            </h3>
            <p className="text-gray-600 font-medium mb-6">
              This research vector hasn't been generated yet. Click the button below to generate it now.
            </p>
            <button
              onClick={() => generateSingleResearch(selectedVector)}
              disabled={loadingVectors.has(selectedVector)}
              className="px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-purple-600 to-pink-600 shadow-[0_6px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-700 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200 flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingVectors.has(selectedVector) ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Generate {RESEARCH_VECTORS.find((v) => v.type === selectedVector)?.label} Research
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="p-8 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300 text-center">
            <p className="text-gray-600 font-semibold">Select a research vector to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};

