'use client';

import { useState, useEffect } from 'react';
import { ResearchType, CompanyResearch } from '@/lib/types/jobs';

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
  const [research, setResearch] = useState<Record<string, CompanyResearch & { is_valid: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedVector, setSelectedVector] = useState<ResearchType | null>(null);
  const [loadingVectors, setLoadingVectors] = useState<Set<ResearchType>>(new Set());
  const [error, setError] = useState<string | null>(null);

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
        body: JSON.stringify({}), // Explicitly send empty body
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
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log('Success response:', responseData);

      // Start polling for updates
      const pollInterval = setInterval(async () => {
        await fetchResearch();
        
        // Check if all vectors are loaded
        const currentResearch = await fetch(`/api/jobs/companies/${companyId}/research`).then(r => r.json());
        const allLoaded = RESEARCH_VECTORS.every((vector) => {
          return currentResearch.research?.[vector.type] !== undefined;
        });

        if (allLoaded) {
          clearInterval(pollInterval);
          setGenerating(false);
          await fetchResearch(); // Final refresh
        }
      }, 5000); // Poll every 5 seconds

      // Stop polling after 10 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        setGenerating(false);
        fetchResearch(); // Final refresh
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

  const generateSingleResearch = async (researchType: ResearchType) => {
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
      
      // Update research state
      if (data.research) {
        setResearch((prev) => ({
          ...prev,
          [researchType]: data.research,
        }));
      }

      // Refresh all research to get latest
      await fetchResearch();
    } catch (error) {
      console.error('Error generating research:', error);
    } finally {
      setLoadingVectors((prev) => {
        const next = new Set(prev);
        next.delete(researchType);
        return next;
      });
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchResearch();
    }
  }, [companyId]);

  // Auto-select first available vector
  useEffect(() => {
    if (!selectedVector && Object.keys(research).length > 0) {
      const firstVector = RESEARCH_VECTORS.find((v) => research[v.type]);
      if (firstVector) {
        setSelectedVector(firstVector.type);
      }
    }
  }, [research, selectedVector]);

  const getVectorStatus = (type: ResearchType) => {
    const vectorResearch = research[type];
    
    if (loadingVectors.has(type)) {
      return { status: 'loading', label: 'Loading...', color: 'blue' };
    }
    
    if (!vectorResearch) {
      return { status: 'missing', label: 'Not generated', color: 'gray' };
    }
    
    if (!vectorResearch.is_valid) {
      return { status: 'stale', label: 'Stale (>7 days)', color: 'yellow' };
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

  const selectedResearch = selectedVector ? research[selectedVector] : null;

  // Empty state
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

  if (Object.keys(research).length === 0 && !generating) {
    return (
      <div className="p-12 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300 text-center">
        <div className="text-6xl mb-6">🔍</div>
        <h3 className="text-2xl font-black text-gray-900 mb-4">No Research Available</h3>
        <p className="text-gray-600 font-medium mb-8 max-w-md mx-auto">
          Generate comprehensive research for {companyName} across all 13 research vectors to get insights on mission, values, competition, and more.
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
            This may take a few minutes. Research will continue even if you navigate away.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar */}
      <div className="lg:col-span-1">
        <div className="p-6 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300 sticky top-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-gray-900">Research Vectors</h3>
            {generating && (
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            )}
          </div>
          <nav className="space-y-2 max-h-[600px] overflow-y-auto">
            {RESEARCH_VECTORS.map((vector) => {
              const status = getVectorStatus(vector.type);
              const isSelected = selectedVector === vector.type;
              const isLoading = loadingVectors.has(vector.type);
              
              return (
                <button
                  key={vector.type}
                  onClick={() => setSelectedVector(vector.type)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'bg-purple-100 border-purple-400 text-purple-700'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  } ${isLoading ? 'opacity-50' : ''}`}
                  disabled={isLoading}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{vector.icon}</span>
                      <span className="font-bold text-sm">{vector.label}</span>
                    </div>
                    {isLoading && (
                      <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                  </div>
                  {research[vector.type] && (
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDate(research[vector.type].generated_at)}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:col-span-3">
        {selectedResearch ? (
          <div className="p-8 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">
                  {RESEARCH_VECTORS.find((v) => v.type === selectedVector)?.label}
                </h2>
                <p className="text-sm text-gray-500">
                  Generated {formatDate(selectedResearch.generated_at)}
                  {!selectedResearch.is_valid && (
                    <span className="ml-2 text-yellow-600 font-bold">(Stale - Refresh recommended)</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => generateSingleResearch(selectedVector!)}
                disabled={loadingVectors.has(selectedVector!)}
                className="px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {loadingVectors.has(selectedVector!) ? 'Refreshing...' : '↻ Refresh'}
              </button>
            </div>

            {/* Content */}
            <div className="prose prose-lg max-w-none text-gray-700 font-medium leading-relaxed mb-8">
              {selectedResearch.perplexity_response.choices?.[0]?.message?.content ? (
                <div className="whitespace-pre-wrap">
                  {selectedResearch.perplexity_response.choices[0].message.content.split('\n').map((paragraph: string, index: number) => {
                    // Simple markdown parsing
                    let processed = paragraph;
                    processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
                    
                    // Check if it's a heading
                    if (paragraph.startsWith('### ')) {
                      return <h3 key={index} className="text-xl font-black text-gray-900 mt-8 mb-4" dangerouslySetInnerHTML={{ __html: processed.replace('### ', '') }} />;
                    }
                    if (paragraph.startsWith('## ')) {
                      return <h2 key={index} className="text-2xl font-black text-gray-900 mt-8 mb-4" dangerouslySetInnerHTML={{ __html: processed.replace('## ', '') }} />;
                    }
                    if (paragraph.startsWith('# ')) {
                      return <h1 key={index} className="text-3xl font-black text-gray-900 mt-8 mb-4" dangerouslySetInnerHTML={{ __html: processed.replace('# ', '') }} />;
                    }
                    
                    if (paragraph.trim() === '') {
                      return <br key={index} />;
                    }
                    
                    return <p key={index} className="mb-4" dangerouslySetInnerHTML={{ __html: processed }} />;
                  })}
                </div>
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
                  {selectedResearch.perplexity_response.search_results.slice(0, 5).map((source: any, index: number) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors">
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
                  ))}
                  {selectedResearch.perplexity_response.search_results.length > 5 && (
                    <p className="text-sm text-gray-500 mt-2">
                      + {selectedResearch.perplexity_response.search_results.length - 5} more sources
                    </p>
                  )}
                </div>
              </div>
            )}
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

