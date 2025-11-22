"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Sparkles, Plus, MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type PortfolioIdea = {
  id: string;
  idea_number: number;
  company_name: string;
  problem_description: string;
  hypothesis: string;
  user_segment: {
    age?: string;
    location?: string;
    income?: string;
    interests?: string;
    pain_points?: string;
    motivations?: string;
    personas?: string;
    job_type?: string;
  };
};

type PortfolioRequest = {
  id: string;
  input_text: string;
  created_at: string;
  ideas: PortfolioIdea[];
};

export default function GenerateIdeasPage() {
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [requests, setRequests] = useState<PortfolioRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const contentEndRef = useRef<HTMLDivElement>(null);

  // Fetch previous requests on mount
  useEffect(() => {
    fetchRequests();
  }, []);

  // Scroll to bottom when new ideas are generated
  useEffect(() => {
    if (selectedRequestId && contentEndRef.current) {
      contentEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedRequestId, requests]);

  const fetchRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const response = await fetch("/api/portfolio/requests");
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
        // Select the most recent request if available
        if (data.requests && data.requests.length > 0) {
          setSelectedRequestId(data.requests[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const handleGenerateIdeas = async (previousIdeas?: PortfolioIdea[], inputTextOverride?: string, existingRequestId?: string) => {
    const textToUse = inputTextOverride || inputText;
    if (!textToUse.trim()) {
      toast.error("Please enter an industry or company name");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/portfolio/generate-ideas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          inputText: textToUse.trim(),
          previousIdeas: previousIdeas?.map(idea => ({
            company_name: idea.company_name,
            problem_description: idea.problem_description,
          })),
          requestId: existingRequestId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate ideas");
      }

      const data = await response.json();
      
      if (existingRequestId) {
        // Update existing request in place
        setRequests(prev => prev.map(req => 
          req.id === existingRequestId ? data.request : req
        ));
        // Keep the same request selected
        setSelectedRequestId(existingRequestId);
      } else {
        // Add new request to the list and select it
        setRequests(prev => [data.request, ...prev]);
        setSelectedRequestId(data.request.id);
        setInputText("");
      }
      
      toast.success(previousIdeas ? "More ideas generated successfully!" : "Case study ideas generated successfully!");
    } catch (error) {
      console.error("Error generating ideas:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate ideas");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNewChat = () => {
    setInputText("");
    setSelectedRequestId(null);
    inputRef.current?.focus();
  };

  const handleDeleteRequest = async (requestId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement delete API endpoint
    toast.info("Delete functionality coming soon");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleGenerateIdeas();
    }
  };

  const selectedRequest = requests.find(r => r.id === selectedRequestId);
  const allIdeas = requests.flatMap(r => r.ideas);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Left Sidebar - Previous Requests */}
      <aside className="w-72 bg-white/80 backdrop-blur-sm border-r border-slate-200 flex flex-col flex-shrink-0 overflow-y-auto shadow-lg">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex-shrink-0">
          <Link
            href="/dashboard/portfolio"
            className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors mb-3 block flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Portfolio
          </Link>
          <button
            onClick={handleNewChat}
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Request
          </button>
        </div>

        {/* Requests List */}
        <div className="flex-1 overflow-y-auto p-2">
          {isLoadingRequests ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No previous requests</p>
            </div>
          ) : (
            <div className="space-y-1">
              {requests.map((request) => (
                <div
                  key={request.id}
                  onClick={() => setSelectedRequestId(request.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 group cursor-pointer ${
                    selectedRequestId === request.id
                      ? "bg-purple-100 text-purple-900 border border-purple-200"
                      : "text-gray-700 hover:bg-slate-100 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate mb-1">
                        {request.input_text}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(request.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRequest(request.id, e);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-200 rounded"
                      type="button"
                    >
                      <Trash2 className="w-3 h-3 text-gray-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Right Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto w-full px-8 py-8 pb-24">
            {/* New Request - Show centered input */}
            {!selectedRequestId && (
              <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-full max-w-2xl">
                  <div className="mb-6 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg flex items-center justify-center mb-6 mx-auto">
                      <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-3">
                      Generate Case Study Ideas
                    </h2>
                    <p className="text-lg text-gray-600 mb-8">
                      Enter an industry or company name below to generate 3 unique case study ideas with specific problems, hypotheses, and user segments.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div>
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter an industry or company name (e.g., fintech, Airbnb, healthcare, Spotify...)"
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 font-medium text-gray-800 bg-white"
                        disabled={isGenerating}
                      />
                      <p className="text-xs text-gray-500 mt-1.5 ml-1">
                        Press Cmd/Ctrl + Enter to generate
                      </p>
                    </div>
                    <button
                      onClick={() => handleGenerateIdeas()}
                      disabled={isGenerating || !inputText.trim()}
                      className="w-full px-6 py-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Generate
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Display selected request's ideas */}
            {selectedRequest && (
              <div className="mb-8">
                {/* Request Header */}
                <div className="mb-4">
                  <div className="inline-block px-4 py-2 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 border border-purple-200 mb-2">
                    <p className="text-sm font-semibold text-gray-700">
                      "{selectedRequest.input_text}"
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(selectedRequest.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {/* Ideas Stacked Vertically */}
                <div className="space-y-6">
                  {selectedRequest.ideas
                    .sort((a, b) => a.idea_number - b.idea_number)
                    .map((idea) => (
                      <div
                        key={idea.id}
                        className="p-6 rounded-xl bg-white shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200"
                      >
                        <div className="mb-4">
                          <span className="inline-block px-3 py-1 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-semibold mb-3">
                            Idea {idea.idea_number}
                          </span>
                          <h3 className="text-2xl font-bold text-gray-800 mb-2">
                            {idea.company_name}
                          </h3>
                        </div>

                        <div className="space-y-4">
                          <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-red-500"></span>
                              Problem
                            </h4>
                            <p className="text-sm text-gray-600 leading-relaxed">{idea.problem_description}</p>
                          </div>

                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                              Hypothesis
                            </h4>
                            <p className="text-sm text-gray-600 italic leading-relaxed">{idea.hypothesis}</p>
                          </div>

                          {Object.values(idea.user_segment).some(v => v && v.trim()) && (
                            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                User Segment
                              </h4>
                              <div className="space-y-2 text-sm text-gray-600">
                                {idea.user_segment.age && idea.user_segment.age.trim() && (
                                  <div>
                                    <span className="font-semibold text-gray-700">Age:</span> {idea.user_segment.age}
                                  </div>
                                )}
                                {idea.user_segment.location && idea.user_segment.location.trim() && (
                                  <div>
                                    <span className="font-semibold text-gray-700">Location:</span> {idea.user_segment.location}
                                  </div>
                                )}
                                {idea.user_segment.income && idea.user_segment.income.trim() && (
                                  <div>
                                    <span className="font-semibold text-gray-700">Income:</span> {idea.user_segment.income}
                                  </div>
                                )}
                                {idea.user_segment.personas && idea.user_segment.personas.trim() && (
                                  <div>
                                    <span className="font-semibold text-gray-700">Personas:</span> {idea.user_segment.personas}
                                  </div>
                                )}
                                {idea.user_segment.job_type && idea.user_segment.job_type.trim() && (
                                  <div>
                                    <span className="font-semibold text-gray-700">Job Type:</span> {idea.user_segment.job_type}
                                  </div>
                                )}
                                {idea.user_segment.interests && idea.user_segment.interests.trim() && (
                                  <div>
                                    <span className="font-semibold text-gray-700">Interests:</span> {idea.user_segment.interests}
                                  </div>
                                )}
                                {idea.user_segment.pain_points && idea.user_segment.pain_points.trim() && (
                                  <div>
                                    <span className="font-semibold text-gray-700">Pain Points:</span> {idea.user_segment.pain_points}
                                  </div>
                                )}
                                {idea.user_segment.motivations && idea.user_segment.motivations.trim() && (
                                  <div>
                                    <span className="font-semibold text-gray-700">Motivations:</span> {idea.user_segment.motivations}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>

                {/* Generate More Button */}
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => {
                      handleGenerateIdeas(selectedRequest.ideas, selectedRequest.input_text, selectedRequest.id);
                    }}
                    disabled={isGenerating}
                    className="px-6 py-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate More Ideas
                  </button>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isGenerating && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-4" />
                <p className="text-gray-600 font-medium">Generating case study ideas...</p>
              </div>
            )}

            <div ref={contentEndRef} />
          </div>
        </div>
      </main>
    </div>
  );
}

