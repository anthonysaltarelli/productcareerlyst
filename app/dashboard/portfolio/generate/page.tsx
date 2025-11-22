"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Sparkles, Plus, MessageSquare, Trash2, Calendar, MapPin, DollarSign, Users, Briefcase, Heart, AlertCircle, Target, ThumbsUp, ThumbsDown, Star } from "lucide-react";
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
  rating?: {
    rating: 'up' | 'down';
    feedback?: string;
  } | null;
  is_favorited?: boolean;
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
  const [favorites, setFavorites] = useState<PortfolioIdea[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [ratings, setRatings] = useState<Record<string, { rating: 'up' | 'down'; feedback?: string }>>({});
  const [feedbackInputs, setFeedbackInputs] = useState<Record<string, string>>({});
  const [showFeedbackInput, setShowFeedbackInput] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const contentEndRef = useRef<HTMLDivElement>(null);

  // Fetch previous requests on mount
  useEffect(() => {
    fetchRequests();
    fetchFavorites();
  }, []);

  // Fetch ratings for ideas when requests are loaded
  useEffect(() => {
    if (requests.length > 0) {
      fetchRatings();
    }
  }, [requests]);

  // Scroll to bottom when new ideas are generated (only when isGenerating changes from true to false)
  const prevIsGenerating = useRef(false);
  useEffect(() => {
    if (prevIsGenerating.current && !isGenerating && selectedRequestId && contentEndRef.current) {
      // Only scroll when generation just finished
      setTimeout(() => {
        contentEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
    prevIsGenerating.current = isGenerating;
  }, [isGenerating, selectedRequestId]);

  const fetchRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const response = await fetch("/api/portfolio/requests");
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
        // Select the most recent request if available
        if (data.requests && data.requests.length > 0 && !showFavorites) {
          setSelectedRequestId(data.requests[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await fetch("/api/portfolio/favorites");
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.ideas || []);
        
        // Also fetch ratings for favorited ideas
        const favoriteIdeaIds = (data.ideas || []).map((idea: PortfolioIdea) => idea.id);
        if (favoriteIdeaIds.length > 0) {
          const ratingPromises = favoriteIdeaIds.map(async (ideaId: string) => {
            try {
              const ratingResponse = await fetch(`/api/portfolio/ideas/${ideaId}/rate`);
              if (ratingResponse.ok) {
                const ratingData = await ratingResponse.json();
                return { ideaId, rating: ratingData.rating };
              }
            } catch (error) {
              console.error(`Error fetching rating for favorite idea ${ideaId}:`, error);
            }
            return null;
          });

          const ratingResults = await Promise.all(ratingPromises);
          const newRatings = { ...ratings };
          
          ratingResults.forEach(result => {
            if (result && result.rating) {
              newRatings[result.ideaId] = {
                rating: result.rating.rating,
                feedback: result.rating.feedback || undefined,
              };
            }
          });

          setRatings(newRatings);
        }
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  };

  const fetchRatings = async () => {
    try {
      const allIdeaIds = requests.flatMap(req => req.ideas.map(idea => idea.id));
      if (allIdeaIds.length === 0) return;

      // Fetch ratings for all ideas
      const ratingPromises = allIdeaIds.map(async (ideaId) => {
        try {
          const response = await fetch(`/api/portfolio/ideas/${ideaId}/rate`);
          if (response.ok) {
            const data = await response.json();
            return { ideaId, rating: data.rating };
          }
        } catch (error) {
          console.error(`Error fetching rating for idea ${ideaId}:`, error);
        }
        return null;
      });

      const results = await Promise.all(ratingPromises);
      const ratingsMap: Record<string, { rating: 'up' | 'down'; feedback?: string }> = {};
      
      results.forEach(result => {
        if (result && result.rating) {
          ratingsMap[result.ideaId] = {
            rating: result.rating.rating,
            feedback: result.rating.feedback || undefined,
          };
        }
      });

      setRatings(ratingsMap);
    } catch (error) {
      console.error("Error fetching ratings:", error);
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
      
      // Refresh ratings after generating new ideas
      await fetchRatings();
      
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

  const handleRateIdea = async (ideaId: string, rating: 'up' | 'down', feedback?: string) => {
    try {
      const response = await fetch(`/api/portfolio/ideas/${ideaId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback }),
      });

      if (response.ok) {
        setRatings(prev => ({
          ...prev,
          [ideaId]: { rating, feedback: feedback || undefined },
        }));
        if (rating === 'up') {
          setShowFeedbackInput(prev => ({ ...prev, [ideaId]: false }));
          setFeedbackInputs(prev => ({ ...prev, [ideaId]: '' }));
        }
        toast.success(rating === 'up' ? 'Thanks for the feedback!' : 'Feedback submitted');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Error rating idea:', error);
      toast.error('Failed to submit rating');
    }
  };

  const handleRemoveRating = async (ideaId: string) => {
    try {
      const response = await fetch(`/api/portfolio/ideas/${ideaId}/rate`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRatings(prev => {
          const newRatings = { ...prev };
          delete newRatings[ideaId];
          return newRatings;
        });
        setShowFeedbackInput(prev => ({ ...prev, [ideaId]: false }));
        setFeedbackInputs(prev => ({ ...prev, [ideaId]: '' }));
      }
    } catch (error) {
      console.error('Error removing rating:', error);
    }
  };

  const handleToggleFavorite = async (ideaId: string, isFavorited: boolean) => {
    try {
      const response = await fetch(`/api/portfolio/ideas/${ideaId}/favorite`, {
        method: isFavorited ? 'DELETE' : 'POST',
      });

      if (response.ok) {
        // Update local state for requests
        setRequests(prev => prev.map(req => ({
          ...req,
          ideas: req.ideas.map(idea => 
            idea.id === ideaId ? { ...idea, is_favorited: !isFavorited } : idea
          ),
        })));

        // Update favorites list
        if (isFavorited) {
          setFavorites(prev => prev.filter(idea => idea.id !== ideaId));
        } else {
          // Add to favorites - we'll refresh the full list
          await fetchFavorites();
        }

        // If we're viewing favorites and removing, refresh the list
        if (showFavorites && isFavorited) {
          await fetchFavorites();
        }

        toast.success(isFavorited ? 'Removed from favorites' : 'Added to favorites');
      } else {
        toast.error('Failed to update favorite');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite');
    }
  };

  const selectedRequest = requests.find(r => r.id === selectedRequestId);
  const allIdeas = requests.flatMap(r => r.ideas);
  const displayedIdeas = showFavorites ? favorites : (selectedRequest?.ideas || []);

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
            Discover Ideas
          </button>
        </div>

        {/* Favorites Section */}
        <div className="px-4 py-2 border-b border-slate-200">
          <button
            onClick={() => {
              setShowFavorites(true);
              setSelectedRequestId(null);
            }}
            className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
              showFavorites
                ? "bg-purple-100 text-purple-900 border border-purple-200"
                : "text-gray-700 hover:bg-slate-100"
            }`}
          >
            <Star className={`w-4 h-4 ${showFavorites ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">Favorites</span>
            {favorites.length > 0 && (
              <span className="ml-auto text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">
                {favorites.length}
              </span>
            )}
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
                  onClick={() => {
                    setSelectedRequestId(request.id);
                    setShowFavorites(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 group cursor-pointer ${
                    selectedRequestId === request.id && !showFavorites
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
            {/* Discover Ideas - Show centered input (only when not viewing favorites) */}
            {!selectedRequestId && !showFavorites && (
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

            {/* Empty State for Favorites */}
            {showFavorites && favorites.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-full max-w-2xl text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-lg flex items-center justify-center mb-6 mx-auto">
                    <Star className="w-10 h-10 text-white fill-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-3">
                    No Favorited Ideas Yet
                  </h2>
                  <p className="text-lg text-gray-600 mb-8">
                    Start by generating some case study ideas, then click the star icon on any idea you want to save to your favorites.
                  </p>
                  <button
                    onClick={() => {
                      setShowFavorites(false);
                      setSelectedRequestId(null);
                      inputRef.current?.focus();
                    }}
                    className="px-6 py-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-sm mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    Discover Ideas
                  </button>
                </div>
              </div>
            )}

            {/* Display ideas */}
            {(selectedRequest || (showFavorites && favorites.length > 0)) && (
              <div className="mb-8">
                {/* Request Header */}
                {selectedRequest && !showFavorites && (
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
                )}

                {showFavorites && favorites.length > 0 && (
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                      Favorited Ideas
                    </h2>
                    <p className="text-sm text-gray-600">
                      {favorites.length} {favorites.length === 1 ? 'idea' : 'ideas'} saved
                    </p>
                  </div>
                )}

                {/* Ideas Stacked Vertically */}
                {(!showFavorites || favorites.length > 0) && (
                  <div className="space-y-6">
                    {displayedIdeas
                      .sort((a, b) => (a.idea_number || 0) - (b.idea_number || 0))
                      .map((idea) => {
                      const currentRating = ratings[idea.id];
                      const isFavorited = idea.is_favorited || favorites.some(f => f.id === idea.id);
                      return (
                      <div
                        key={idea.id}
                        className="p-6 rounded-xl bg-white shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 relative"
                      >
                        {/* Favorite Button - Top Right */}
                        <button
                          onClick={() => handleToggleFavorite(idea.id, isFavorited)}
                          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                          type="button"
                          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Star 
                            className={`w-5 h-5 ${
                              isFavorited 
                                ? 'text-yellow-500 fill-yellow-500' 
                                : 'text-gray-400 hover:text-yellow-500'
                            } transition-colors`} 
                          />
                        </button>

                        <div className="mb-4 pr-8">
                          <span className="inline-block px-3 py-1 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-semibold mb-3">
                            Idea {idea.idea_number || 'N/A'}
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
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-5 border border-green-200">
                              <h4 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                                  <Users className="w-4 h-4 text-white" />
                                </div>
                                User Segment
                              </h4>
                              <div className="space-y-3">
                                {/* Demographics - Short fields in grid */}
                                {(idea.user_segment.age || idea.user_segment.location || idea.user_segment.income) && (
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {idea.user_segment.age && idea.user_segment.age.trim() && (
                                      <div className="bg-white rounded-lg p-3 border border-green-100 hover:border-green-300 transition-colors">
                                        <div className="flex items-start gap-2">
                                          <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Age</p>
                                            <p className="text-sm text-gray-700 leading-relaxed">{idea.user_segment.age}</p>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    {idea.user_segment.location && idea.user_segment.location.trim() && (
                                      <div className="bg-white rounded-lg p-3 border border-green-100 hover:border-green-300 transition-colors">
                                        <div className="flex items-start gap-2">
                                          <div className="w-6 h-6 rounded-md bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <MapPin className="w-3.5 h-3.5 text-purple-600" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Location</p>
                                            <p className="text-sm text-gray-700 leading-relaxed">{idea.user_segment.location}</p>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    {idea.user_segment.income && idea.user_segment.income.trim() && (
                                      <div className="bg-white rounded-lg p-3 border border-green-100 hover:border-green-300 transition-colors">
                                        <div className="flex items-start gap-2">
                                          <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Income</p>
                                            <p className="text-sm text-gray-700 leading-relaxed">{idea.user_segment.income}</p>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Personas and Job Type - Medium fields in grid */}
                                {(idea.user_segment.personas || idea.user_segment.job_type) && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {idea.user_segment.personas && idea.user_segment.personas.trim() && (
                                      <div className="bg-white rounded-lg p-4 border border-green-100 hover:border-green-300 transition-colors">
                                        <div className="flex items-start gap-2">
                                          <div className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Users className="w-3.5 h-3.5 text-indigo-600" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Personas</p>
                                            <p className="text-sm text-gray-700 leading-relaxed">{idea.user_segment.personas}</p>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    {idea.user_segment.job_type && idea.user_segment.job_type.trim() && (
                                      <div className="bg-white rounded-lg p-4 border border-green-100 hover:border-green-300 transition-colors">
                                        <div className="flex items-start gap-2">
                                          <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Job Type</p>
                                            <p className="text-sm text-gray-700 leading-relaxed">{idea.user_segment.job_type}</p>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Interests - Long field, full width */}
                                {idea.user_segment.interests && idea.user_segment.interests.trim() && (
                                  <div className="bg-white rounded-lg p-4 border border-green-100 hover:border-green-300 transition-colors">
                                    <div className="flex items-start gap-3">
                                      <div className="w-7 h-7 rounded-md bg-pink-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Heart className="w-4 h-4 text-pink-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Interests</p>
                                        <p className="text-sm text-gray-700 leading-relaxed">{idea.user_segment.interests}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Pain Points - Very long field, full width */}
                                {idea.user_segment.pain_points && idea.user_segment.pain_points.trim() && (
                                  <div className="bg-white rounded-lg p-4 border border-red-100 hover:border-red-300 transition-colors bg-gradient-to-br from-red-50/30 to-white">
                                    <div className="flex items-start gap-3">
                                      <div className="w-7 h-7 rounded-md bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <AlertCircle className="w-4 h-4 text-red-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Pain Points</p>
                                        <p className="text-sm text-gray-700 leading-relaxed">{idea.user_segment.pain_points}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Motivations - Long field, full width */}
                                {idea.user_segment.motivations && idea.user_segment.motivations.trim() && (
                                  <div className="bg-white rounded-lg p-4 border border-green-100 hover:border-green-300 transition-colors">
                                    <div className="flex items-start gap-3">
                                      <div className="w-7 h-7 rounded-md bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Target className="w-4 h-4 text-green-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Motivations</p>
                                        <p className="text-sm text-gray-700 leading-relaxed">{idea.user_segment.motivations}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Rating Section */}
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-gray-700">Rate this idea:</span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    if (currentRating?.rating === 'up') {
                                      handleRemoveRating(idea.id);
                                    } else {
                                      handleRateIdea(idea.id, 'up');
                                    }
                                  }}
                                  className={`p-2 rounded-lg transition-colors ${
                                    currentRating?.rating === 'up'
                                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                      : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
                                  }`}
                                  type="button"
                                  aria-label="Thumbs up"
                                >
                                  <ThumbsUp className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (currentRating?.rating === 'down') {
                                      handleRemoveRating(idea.id);
                                      setShowFeedbackInput(prev => ({ ...prev, [idea.id]: false }));
                                    } else {
                                      setShowFeedbackInput(prev => ({ ...prev, [idea.id]: true }));
                                    }
                                  }}
                                  className={`p-2 rounded-lg transition-colors ${
                                    currentRating?.rating === 'down'
                                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                      : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
                                  }`}
                                  type="button"
                                  aria-label="Thumbs down"
                                >
                                  <ThumbsDown className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Feedback Input for Thumbs Down */}
                            {(showFeedbackInput[idea.id] || (currentRating?.rating === 'down' && currentRating.feedback)) && (
                              <div className="mt-3">
                                <textarea
                                  value={feedbackInputs[idea.id] ?? currentRating?.feedback ?? ''}
                                  onChange={(e) => setFeedbackInputs(prev => ({ ...prev, [idea.id]: e.target.value }))}
                                  placeholder="Please share your feedback..."
                                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none"
                                  rows={3}
                                />
                                <div className="flex items-center gap-2 mt-2">
                                  <button
                                    onClick={() => {
                                      const feedback = feedbackInputs[idea.id] ?? currentRating?.feedback ?? '';
                                      if (feedback.trim()) {
                                        handleRateIdea(idea.id, 'down', feedback.trim());
                                      } else {
                                        toast.error('Please provide feedback');
                                      }
                                    }}
                                    className="px-4 py-1.5 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                                    type="button"
                                  >
                                    {currentRating?.rating === 'down' && currentRating.feedback ? 'Update Feedback' : 'Submit Feedback'}
                                  </button>
                                  {currentRating?.rating === 'down' && (
                                    <button
                                      onClick={() => {
                                        setShowFeedbackInput(prev => ({ ...prev, [idea.id]: false }));
                                        handleRemoveRating(idea.id);
                                      }}
                                      className="px-4 py-1.5 text-sm bg-slate-200 text-gray-700 rounded-lg hover:bg-slate-300 transition-colors"
                                      type="button"
                                    >
                                      Remove Rating
                                    </button>
                                  )}
                                  {!currentRating && (
                                    <button
                                      onClick={() => {
                                        setShowFeedbackInput(prev => ({ ...prev, [idea.id]: false }));
                                      }}
                                      className="px-4 py-1.5 text-sm bg-slate-200 text-gray-700 rounded-lg hover:bg-slate-300 transition-colors"
                                      type="button"
                                    >
                                      Cancel
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                    })}
                  </div>
                )}

                {/* Generate More Button - Only show for selected request */}
                {selectedRequest && !showFavorites && (
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
                )}
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

