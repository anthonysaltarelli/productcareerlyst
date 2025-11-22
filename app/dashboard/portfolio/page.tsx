"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

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

export default function ProductPortfolioPage() {
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<PortfolioRequest | null>(null);
  const [previousRequests, setPreviousRequests] = useState<PortfolioRequest[]>([]);

  const handleGenerateIdeas = async () => {
    if (!inputText.trim()) {
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
        body: JSON.stringify({ inputText: inputText.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate ideas");
      }

      const data = await response.json();
      setCurrentRequest(data.request);
      setInputText("");
      toast.success("Case study ideas generated successfully!");
    } catch (error) {
      console.error("Error generating ideas:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate ideas");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleGenerateIdeas();
    }
  };

  return (
    <div className="p-8 md:p-12">
      {/* Page Header */}
      <div className="mb-8">
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_15px_0_0_rgba(168,85,247,0.3)] border-2 border-purple-300">
          <span className="text-5xl mb-4 block">🎨</span>
          <h1 className="text-4xl md:text-5xl font-black text-gray-800 mb-3">
            Product Portfolio
          </h1>
          <p className="text-xl text-gray-700 font-semibold">
            Build standout case studies to showcase your product management skills
          </p>
        </div>
      </div>

      {/* Learning Section */}
      <div className="mb-8">
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-200 to-cyan-200 shadow-[0_12px_0_0_rgba(59,130,246,0.3)] border-2 border-blue-300">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-blue-400 to-cyan-400 shadow-[0_6px_0_0_rgba(59,130,246,0.4)] border-2 border-blue-500 flex items-center justify-center flex-shrink-0">
              <span className="text-3xl">📚</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Learn About Product Portfolios
              </h2>
              <p className="text-gray-700 font-medium mb-4">
                Master the art of creating compelling product portfolio case studies. Learn about the Discover, Define, Develop, and Deliver framework, and how to structure your case studies to stand out in the competitive PM job market.
              </p>
              <Link
                href="/dashboard/courses/launch-product-portfolio"
                className="inline-block px-6 py-3 rounded-[1.5rem] bg-white/80 hover:bg-white border-2 border-blue-300 font-black text-gray-800 transition-all duration-200"
              >
                Start Course →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* AI Case Study Idea Generator */}
      <div className="mb-8">
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-orange-200 to-yellow-200 shadow-[0_12px_0_0_rgba(249,115,22,0.3)] border-2 border-orange-300">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-orange-400 to-yellow-400 shadow-[0_6px_0_0_rgba(249,115,22,0.4)] border-2 border-orange-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                AI Case Study Idea Generator
              </h2>
              <p className="text-gray-700 font-medium mb-4">
                Enter an industry or company name, and we'll generate 3 unique case study ideas with specific problems, hypotheses, and user segments to help you build your portfolio.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="input-text" className="block text-sm font-bold text-gray-700 mb-2">
                Industry or Company Name
              </label>
              <textarea
                id="input-text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., fintech, Airbnb, healthcare, Spotify..."
                className="w-full px-4 py-3 rounded-[1.5rem] border-2 border-orange-300 focus:border-orange-500 focus:outline-none resize-none font-medium text-gray-800 bg-white"
                rows={3}
                disabled={isGenerating}
              />
              <p className="text-xs text-gray-600 mt-2">
                Press Cmd/Ctrl + Enter to generate ideas
              </p>
            </div>

            <button
              onClick={handleGenerateIdeas}
              disabled={isGenerating || !inputText.trim()}
              className="w-full px-6 py-4 rounded-[1.5rem] bg-gradient-to-br from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 border-2 border-orange-600 font-black text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Ideas...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Case Study Ideas
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Generated Ideas Display */}
      {currentRequest && currentRequest.ideas && currentRequest.ideas.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-gray-800">
              Generated Ideas for: "{currentRequest.input_text}"
            </h2>
            <button
              onClick={() => setCurrentRequest(null)}
              className="px-4 py-2 rounded-[1rem] bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition-all duration-200"
            >
              Clear
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {currentRequest.ideas
              .sort((a, b) => a.idea_number - b.idea_number)
              .map((idea) => (
                <div
                  key={idea.id}
                  className="p-6 rounded-[2rem] bg-gradient-to-br from-purple-100 to-pink-100 shadow-[0_8px_0_0_rgba(168,85,247,0.2)] border-2 border-purple-200"
                >
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 rounded-full bg-purple-500 text-white text-sm font-black mb-3">
                      Idea {idea.idea_number}
                    </span>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {idea.company_name}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-gray-700 mb-1">Problem</h4>
                      <p className="text-sm text-gray-600">{idea.problem_description}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-gray-700 mb-1">Hypothesis</h4>
                      <p className="text-sm text-gray-600 italic">{idea.hypothesis}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-gray-700 mb-2">User Segment</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        {idea.user_segment.age && idea.user_segment.age.trim() && (
                          <p><span className="font-semibold">Age:</span> {idea.user_segment.age}</p>
                        )}
                        {idea.user_segment.location && idea.user_segment.location.trim() && (
                          <p><span className="font-semibold">Location:</span> {idea.user_segment.location}</p>
                        )}
                        {idea.user_segment.income && idea.user_segment.income.trim() && (
                          <p><span className="font-semibold">Income:</span> {idea.user_segment.income}</p>
                        )}
                        {idea.user_segment.personas && idea.user_segment.personas.trim() && (
                          <p><span className="font-semibold">Personas:</span> {idea.user_segment.personas}</p>
                        )}
                        {idea.user_segment.job_type && idea.user_segment.job_type.trim() && (
                          <p><span className="font-semibold">Job Type:</span> {idea.user_segment.job_type}</p>
                        )}
                        {idea.user_segment.interests && idea.user_segment.interests.trim() && (
                          <p><span className="font-semibold">Interests:</span> {idea.user_segment.interests}</p>
                        )}
                        {idea.user_segment.pain_points && idea.user_segment.pain_points.trim() && (
                          <p><span className="font-semibold">Pain Points:</span> {idea.user_segment.pain_points}</p>
                        )}
                        {idea.user_segment.motivations && idea.user_segment.motivations.trim() && (
                          <p><span className="font-semibold">Motivations:</span> {idea.user_segment.motivations}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
