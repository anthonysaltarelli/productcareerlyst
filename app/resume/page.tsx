'use client';

import { PageTracking } from '@/app/components/PageTracking';
import { TrackedButton } from '@/app/components/TrackedButton';
import { TrackedLink } from '@/app/components/TrackedLink';
import {
  Sparkles,
  Target,
  FileText,
  BarChart3,
  Zap,
  Upload,
  RefreshCw,
  CheckCircle2,
  Brain,
  Search,
  TrendingUp,
  Award,
  FileDown,
  Layers,
  ArrowRight,
} from 'lucide-react';

const ResumeLandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100">
      <PageTracking pageName="Resume Landing Page" />

      <div className="max-w-7xl mx-auto px-4 py-6 sm:p-8 md:p-12 lg:p-16">

        {/* Hero Section */}
        <div className="flex justify-center mb-12 md:mb-20 relative">
          <div className="hidden md:block absolute -top-8 -left-8 w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 opacity-20 blur-2xl animate-pulse"></div>
          <div className="hidden md:block absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br from-cyan-400 to-blue-400 opacity-20 blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>

          <div className="w-full max-w-4xl relative z-10">
            <div className="p-5 sm:p-8 md:p-12 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[3rem] bg-gradient-to-br from-blue-200 to-cyan-200 shadow-[0_12px_0_0_rgba(37,99,235,0.3)] md:shadow-[0_20px_0_0_rgba(37,99,235,0.3)] border-2 border-blue-300 relative overflow-hidden">
              <div className="relative z-10">
                {/* Badges */}
                <div className="flex justify-center gap-3 mb-4 sm:mb-6 flex-wrap">
                  <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/80 backdrop-blur-sm border-2 border-blue-300 shadow-lg">
                    <span className="text-xs sm:text-sm font-bold text-blue-700">
                      🤖 AI-Powered
                    </span>
                  </div>
                  <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/80 backdrop-blur-sm border-2 border-purple-300 shadow-lg">
                    <span className="text-xs sm:text-sm font-bold text-purple-700">
                      ✨ Available on the Accelerate Plan
                    </span>
                  </div>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-br from-blue-700 to-cyan-600 bg-clip-text text-transparent mb-4 sm:mb-6 leading-tight text-center">
                  Build Resumes That Actually Get Interviews
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-gray-700 font-semibold mb-6 sm:mb-8 text-center max-w-3xl mx-auto">
                  Stop sending generic resumes into the void. Our AI helps you craft, optimize, and tailor your resume for every application—so you become the top candidate.
                </p>

                {/* Key stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div className="text-center p-3 sm:p-4 rounded-[1rem] sm:rounded-[1.5rem] bg-white/60 backdrop-blur-sm border-2 border-blue-200">
                    <div className="text-2xl sm:text-3xl font-black text-blue-700 mb-1">~5%</div>
                    <p className="text-xs sm:text-sm font-bold text-gray-700">of applications get interviews</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 rounded-[1rem] sm:rounded-[1.5rem] bg-white/60 backdrop-blur-sm border-2 border-cyan-200">
                    <div className="text-2xl sm:text-3xl font-black text-cyan-700 mb-1">7 sec</div>
                    <p className="text-xs sm:text-sm font-bold text-gray-700">average recruiter scan time</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 rounded-[1rem] sm:rounded-[1.5rem] bg-white/60 backdrop-blur-sm border-2 border-blue-200">
                    <div className="text-2xl sm:text-3xl font-black text-blue-700 mb-1">250+</div>
                    <p className="text-xs sm:text-sm font-bold text-gray-700">applicants per PM role</p>
                  </div>
                </div>

                <TrackedButton
                  href="/auth/sign-up"
                  className="block w-full px-6 py-4 sm:px-10 sm:py-6 rounded-[1.5rem] sm:rounded-[2rem] bg-gradient-to-br from-blue-500 to-cyan-500 shadow-[0_8px_0_0_rgba(37,99,235,0.6)] sm:shadow-[0_10px_0_0_rgba(37,99,235,0.6)] border-2 border-blue-600 hover:translate-y-1 hover:shadow-[0_4px_0_0_rgba(37,99,235,0.6)] sm:hover:shadow-[0_6px_0_0_rgba(37,99,235,0.6)] text-lg sm:text-xl font-black text-white transition-all duration-200 text-center mb-3 sm:mb-4"
                  eventName="User Clicked Get Started Button"
                  buttonId="resume-landing-hero-cta"
                  eventProperties={{
                    'Button Section': 'Hero Section',
                    'Button Position': 'Center of Hero Card',
                    'Button Type': 'Primary CTA',
                    'Button Text': 'Get Started →',
                    'Button Context': 'Below headline and stats highlights',
                    'Page Section': 'Above the fold',
                  }}
                >
                  Get Started →
                </TrackedButton>
                <p className="text-center text-xs sm:text-sm text-gray-600 font-medium">
                  Trusted by thousands of PMs
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* The Problem Section */}
        <div className="mb-12 md:mb-20">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-800 mb-3 md:mb-4">
              Why Your Resume Isn't Working
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 font-medium px-2">
              Here's the hard truth about why you're not landing interviews.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
            <div className="p-5 sm:p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-br from-red-200 to-orange-200 shadow-[0_8px_0_0_rgba(239,68,68,0.3)] md:shadow-[0_10px_0_0_rgba(239,68,68,0.3)] border-2 border-red-300">
              <div className="flex items-start gap-3 sm:gap-4">
                <span className="text-3xl sm:text-4xl flex-shrink-0">🎯</span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">
                    You Don't Look Like a Fit
                  </h3>
                  <p className="text-sm sm:text-base text-gray-700 font-medium">
                    Recruiters scan for relevance in seconds. If your experience doesn't clearly match what they're looking for, you're out—even if you'd be perfect for the role.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-br from-red-200 to-orange-200 shadow-[0_8px_0_0_rgba(239,68,68,0.3)] md:shadow-[0_10px_0_0_rgba(239,68,68,0.3)] border-2 border-red-300">
              <div className="flex items-start gap-3 sm:gap-4">
                <span className="text-3xl sm:text-4xl flex-shrink-0">📊</span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">
                    No Proof of Impact
                  </h3>
                  <p className="text-sm sm:text-base text-gray-700 font-medium">
                    "Responsible for..." and "Worked on..." tell recruiters nothing. Without quantified results and clear outcomes, your accomplishments look like a list of job duties.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-br from-red-200 to-orange-200 shadow-[0_8px_0_0_rgba(239,68,68,0.3)] md:shadow-[0_10px_0_0_rgba(239,68,68,0.3)] border-2 border-red-300">
              <div className="flex items-start gap-3 sm:gap-4">
                <span className="text-3xl sm:text-4xl flex-shrink-0">😵</span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">
                    Hard to Follow Format
                  </h3>
                  <p className="text-sm sm:text-base text-gray-700 font-medium">
                    Dense paragraphs, inconsistent structure, buried information. If recruiters can't quickly find what they need, they move on to the next candidate.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-br from-red-200 to-orange-200 shadow-[0_8px_0_0_rgba(239,68,68,0.3)] md:shadow-[0_10px_0_0_rgba(239,68,68,0.3)] border-2 border-red-300">
              <div className="flex items-start gap-3 sm:gap-4">
                <span className="text-3xl sm:text-4xl flex-shrink-0">📋</span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">
                    Generic for Every Role
                  </h3>
                  <p className="text-sm sm:text-base text-gray-700 font-medium">
                    The same resume for every job? That's how you get passed over. Top candidates tailor their resume to highlight the most relevant experience for each opportunity.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-slate-700 to-slate-900 shadow-[0_10px_0_0_rgba(15,23,42,0.4)] md:shadow-[0_15px_0_0_rgba(15,23,42,0.4)] border-2 border-slate-800 text-center">
            <p className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight">
              The result? Qualified PMs send{' '}
              <span className="text-red-400">100+ applications</span>{' '}
              and still struggle to land interviews.
            </p>
          </div>
        </div>

        {/* The Solution Section */}
        <div className="mb-12 md:mb-20">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-800 mb-3 md:mb-4 px-2">
              Everything You Need to Stand Out
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 font-medium px-2">
              Powerful AI tools that make your resume impossible to ignore.
            </p>
          </div>

          <div className="space-y-8 md:space-y-12">

            {/* Feature 1: Resume Import */}
            <div className="rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-teal-100 to-emerald-100 border-2 border-teal-200 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 md:p-10">
                <div className="flex flex-col justify-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500 text-white text-xs font-bold mb-4 w-fit">
                    <Upload className="w-3.5 h-3.5" />
                    INSTANT IMPORT
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-gray-800 mb-3">
                    Your Resume, Formatted Perfectly in 60 Seconds
                  </h3>
                  <p className="text-base sm:text-lg text-gray-700 font-medium mb-6">
                    Drop your existing PDF or Word resume. Our AI extracts everything automatically—contact info, work history, skills, education—and professionally formats it.
                  </p>
                  <div className="flex items-center gap-3 text-sm font-bold text-teal-700">
                    <CheckCircle2 className="w-5 h-5" />
                    PDF & DOCX supported
                  </div>
                </div>
                {/* Mock Upload UI */}
                <div className="bg-white rounded-2xl border-2 border-teal-200 p-6 shadow-lg">
                  <div className="border-2 border-dashed border-teal-300 rounded-xl p-8 text-center bg-teal-50/50">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-400 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-lg font-bold text-gray-800 mb-2">Drop your resume here</p>
                    <p className="text-sm text-gray-600 mb-4">or click to browse</p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 text-white text-sm font-bold">
                      <FileText className="w-4 h-4" />
                      Select File
                    </div>
                  </div>
                  <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-green-800">Extracted successfully!</p>
                        <p className="text-xs text-green-700">3 jobs • 12 bullets • 8 skills</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2: AI Bullet Optimization - 3 Options */}
            <div className="rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-amber-100 to-orange-100 border-2 border-amber-200 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 md:p-10">
                <div className="flex flex-col justify-center order-2 lg:order-1">
                  {/* Mock Optimization UI */}
                  <div className="bg-white rounded-2xl border-2 border-amber-200 p-5 shadow-lg">
                    <div className="p-3 rounded-xl bg-gray-100 border border-gray-200 mb-4">
                      <p className="text-sm text-gray-600 font-medium">"Worked on product roadmap and helped with feature launches"</p>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-gray-700">AI Optimized Versions:</span>
                    </div>
                    <div className="space-y-2">
                      <div className="p-3 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 cursor-pointer hover:border-purple-400 transition-all">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-purple-600">Option 1</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold">IMPACT-FOCUSED</span>
                        </div>
                        <p className="text-sm text-gray-700">"Spearheaded product roadmap strategy, driving 5 feature launches that increased engagement by 40%"</p>
                      </div>
                      <div className="p-3 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 cursor-pointer hover:border-purple-400 transition-all">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-purple-600">Option 2</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">METRIC-FOCUSED</span>
                        </div>
                        <p className="text-sm text-gray-700">"Led roadmap planning for 3 product lines, shipping 12 features with 98% on-time delivery rate"</p>
                      </div>
                      <div className="p-3 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 cursor-pointer hover:border-purple-400 transition-all">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-purple-600">Option 3</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold">ACTION-FOCUSED</span>
                        </div>
                        <p className="text-sm text-gray-700">"Orchestrated cross-functional launch of 5 features, coordinating 4 teams to deliver $2M in new revenue"</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-center order-1 lg:order-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500 text-white text-xs font-bold mb-4 w-fit">
                    <Sparkles className="w-3.5 h-3.5" />
                    3 OPTIONS PER BULLET
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-gray-800 mb-3">
                    Transform Any Bullet with AI
                  </h3>
                  <p className="text-base sm:text-lg text-gray-700 font-medium mb-6">
                    Click any bullet point and get 3 AI-optimized versions instantly. Each takes a different approach—impact-focused, metric-focused, or action-focused. Pick the one that fits, or edit further.
                  </p>
                  <div className="flex items-center gap-3 text-sm font-bold text-amber-700">
                    <Zap className="w-5 h-5" />
                    Results in under 30 seconds
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3: Full Analysis */}
            <div className="rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-blue-100 to-cyan-100 border-2 border-blue-200 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 md:p-10">
                <div className="flex flex-col justify-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500 text-white text-xs font-bold mb-4 w-fit">
                    <BarChart3 className="w-3.5 h-3.5" />
                    COMPREHENSIVE ANALYSIS
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-gray-800 mb-3">
                    Know Exactly Where You Stand
                  </h3>
                  <p className="text-base sm:text-lg text-gray-700 font-medium mb-6">
                    Get a complete breakdown of your resume's strengths and weaknesses. Our AI evaluates action verbs, accomplishments, quantification, impact, and conciseness—then tells you exactly how to improve.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm font-bold text-blue-700">
                      <CheckCircle2 className="w-5 h-5" />
                      5-7 prioritized recommendations
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-blue-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Keyword analysis (present & missing)
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-blue-700">
                      <CheckCircle2 className="w-5 h-5" />
                      ATS compatibility check
                    </div>
                  </div>
                </div>
                {/* Mock Analysis UI */}
                <div className="bg-white rounded-2xl border-2 border-blue-200 p-5 shadow-lg">
                  {/* Overall Score */}
                  <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-200">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <span className="text-3xl font-black text-white">78</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-600">Overall Score</p>
                      <p className="text-lg font-black text-gray-800">Good — Room to improve</p>
                    </div>
                  </div>
                  {/* Category Scores */}
                  <div className="grid grid-cols-5 gap-2 mb-5">
                    <div className="text-center p-2 rounded-lg bg-green-50 border border-green-200">
                      <div className="text-lg font-black text-green-600">85%</div>
                      <p className="text-[10px] text-gray-600 font-medium">Verbs</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="text-lg font-black text-blue-600">72%</div>
                      <p className="text-[10px] text-gray-600 font-medium">Accomplish.</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-orange-50 border border-orange-200">
                      <div className="text-lg font-black text-orange-600">58%</div>
                      <p className="text-[10px] text-gray-600 font-medium">Numbers</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-purple-50 border border-purple-200">
                      <div className="text-lg font-black text-purple-600">82%</div>
                      <p className="text-[10px] text-gray-600 font-medium">Impact</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-yellow-50 border border-yellow-200">
                      <div className="text-lg font-black text-yellow-600">90%</div>
                      <p className="text-[10px] text-gray-600 font-medium">Concise</p>
                    </div>
                  </div>
                  {/* Sample Recommendations */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Top Recommendations</p>
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-200 text-red-700">HIGH</span>
                        <span className="text-sm font-bold text-gray-800">Add metrics to bullet points</span>
                      </div>
                      <p className="text-xs text-gray-600">Only 40% of your bullets include numbers. Add revenue, users, or percentages.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-200 text-orange-700">MED</span>
                        <span className="text-sm font-bold text-gray-800">Missing key PM keywords</span>
                      </div>
                      <p className="text-xs text-gray-600">Add: "roadmap", "A/B testing", "stakeholder management"</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 4: Job-Specific Customization */}
            <div className="rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-200 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 md:p-10">
                <div className="flex flex-col justify-center order-2 lg:order-1">
                  {/* Mock Comparison UI - Word-level diff */}
                  <div className="bg-white rounded-2xl border-2 border-purple-200 p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-bold text-gray-700">Bullet Comparison</span>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" />
                          Reordered
                        </span>
                        <span className="px-2 py-1 rounded-lg bg-purple-100 text-purple-700 text-xs font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Optimized
                        </span>
                      </div>
                    </div>
                    
                    {/* Word-level diff example */}
                    <div className="space-y-4">
                      {/* Original */}
                      <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                        <p className="text-[10px] font-bold text-gray-500 mb-2 flex items-center gap-1">
                          <span className="w-4 h-4 rounded bg-gray-300 flex items-center justify-center text-gray-600">#3</span>
                          ORIGINAL
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          Led <span className="bg-red-200 text-red-800 rounded px-0.5">cross-functional</span> teams to launch 3 features, increasing <span className="bg-red-200 text-red-800 rounded px-0.5">monthly active users</span> by 25%
                        </p>
                      </div>
                      
                      {/* Arrow */}
                      <div className="flex justify-center">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <ArrowRight className="w-4 h-4 text-purple-600 rotate-90" />
                        </div>
                      </div>
                      
                      {/* Optimized */}
                      <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                        <p className="text-[10px] font-bold text-green-600 mb-2 flex items-center gap-2">
                          <span className="w-4 h-4 rounded bg-green-500 flex items-center justify-center text-white font-bold">#1</span>
                          TAILORED
                          <span className="text-[9px] text-green-600 bg-green-100 px-1.5 py-0.5 rounded">↑ Moved to top</span>
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          Led <span className="bg-green-200 text-green-800 rounded px-0.5">agile</span> teams to launch 3 features, increasing <span className="bg-green-200 text-green-800 rounded px-0.5">user engagement</span> by 25%
                        </p>
                      </div>
                    </div>
                    
                    {/* Keywords Added */}
                    <div className="mt-4 p-3 rounded-xl bg-purple-50 border border-purple-200">
                      <p className="text-[10px] font-bold text-purple-600 mb-2">KEYWORDS ADDED TO YOUR RESUME</p>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-green-200 text-green-800 text-[10px] font-bold">+data-driven</span>
                        <span className="px-2 py-0.5 rounded-full bg-green-200 text-green-800 text-[10px] font-bold">+roadmap</span>
                        <span className="px-2 py-0.5 rounded-full bg-green-200 text-green-800 text-[10px] font-bold">+stakeholders</span>
                        <span className="px-2 py-0.5 rounded-full bg-green-200 text-green-800 text-[10px] font-bold">+user research</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-center order-1 lg:order-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500 text-white text-xs font-bold mb-4 w-fit">
                    <Target className="w-3.5 h-3.5" />
                    JOB-SPECIFIC TAILORING
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-gray-800 mb-3">
                    One Click to a Custom Resume
                  </h3>
                  <p className="text-base sm:text-lg text-gray-700 font-medium mb-6">
                    Paste any job description and watch the magic happen. Our AI reorders your bullets to prioritize what the employer wants, injects missing keywords naturally, and shows you exactly what changed.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm font-bold text-purple-700">
                      <RefreshCw className="w-5 h-5" />
                      Smart bullet reordering
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-purple-700">
                      <Search className="w-5 h-5" />
                      Natural keyword injection
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-purple-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Side-by-side comparison
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 5: Export Options */}
            <div className="rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-slate-100 to-gray-100 border-2 border-slate-200 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 md:p-10">
                <div className="flex flex-col justify-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-600 text-white text-xs font-bold mb-4 w-fit">
                    <FileDown className="w-3.5 h-3.5" />
                    EXPORT ANYWHERE
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-gray-800 mb-3">
                    Download and Apply Instantly
                  </h3>
                  <p className="text-base sm:text-lg text-gray-700 font-medium mb-6">
                    Export as a beautifully formatted PDF and submit directly to job applications. Or download as DOCX if you want to continue editing in Word or Google Docs.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                      <CheckCircle2 className="w-5 h-5" />
                      ATS-friendly formatting
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Clean, professional layouts
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Export unlimited versions
                    </div>
                  </div>
                </div>
                {/* Export Format Cards */}
                <div className="flex flex-col gap-4 justify-center">
                  {/* PDF Card */}
                  <div className="bg-white rounded-2xl border-2 border-red-200 p-5 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                        <FileText className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-gray-800 text-lg">PDF Format</h4>
                        <p className="text-sm text-gray-600">Ready for instant submission on any job application</p>
                      </div>
                      <button className="px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold flex items-center gap-2 hover:bg-red-600 transition-colors">
                        <FileDown className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                  
                  {/* DOCX Card */}
                  <div className="bg-white rounded-2xl border-2 border-blue-200 p-5 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                        <FileText className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-gray-800 text-lg">DOCX Format</h4>
                        <p className="text-sm text-gray-600">Continue editing in Word or Google Docs</p>
                      </div>
                      <button className="px-4 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-bold flex items-center gap-2 hover:bg-blue-600 transition-colors">
                        <FileDown className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Becoming Top Candidate Section */}
        <div className="mb-12 md:mb-20">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-800 mb-3 md:mb-4">
              Become the Top Candidate
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 font-medium px-2">
              Here's what separates candidates who get interviews from those who don't.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Without Our Tools */}
            <div className="p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] bg-gradient-to-br from-slate-100 to-slate-200 shadow-[0_10px_0_0_rgba(0,0,0,0.1)] md:shadow-[0_12px_0_0_rgba(0,0,0,0.1)] border-2 border-slate-300">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-400 flex items-center justify-center">
                  <span className="text-xl sm:text-2xl">😐</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-800">Average Candidate</h3>
              </div>
              <ul className="space-y-3 sm:space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-red-500 text-lg font-bold flex-shrink-0">✗</span>
                  <span className="text-sm sm:text-base text-gray-700 font-medium">Sends same generic resume to every job</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 text-lg font-bold flex-shrink-0">✗</span>
                  <span className="text-sm sm:text-base text-gray-700 font-medium">Doesn't look like a fit at first glance</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 text-lg font-bold flex-shrink-0">✗</span>
                  <span className="text-sm sm:text-base text-gray-700 font-medium">Lists responsibilities instead of impact</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 text-lg font-bold flex-shrink-0">✗</span>
                  <span className="text-sm sm:text-base text-gray-700 font-medium">Hard to skim with poor formatting</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 text-lg font-bold flex-shrink-0">✗</span>
                  <span className="text-sm sm:text-base text-gray-700 font-medium">Most relevant experience buried at the bottom</span>
                </li>
              </ul>
            </div>

            {/* With Our Tools */}
            <div className="p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] bg-gradient-to-br from-green-200 to-emerald-200 shadow-[0_10px_0_0_rgba(22,163,74,0.3)] md:shadow-[0_12px_0_0_rgba(22,163,74,0.3)] border-2 border-green-300">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-xl sm:text-2xl">🏆</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-800">Top Candidate</h3>
              </div>
              <ul className="space-y-3 sm:space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 text-lg font-bold flex-shrink-0">✓</span>
                  <span className="text-sm sm:text-base text-gray-700 font-medium">Tailors resume to each specific job description</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 text-lg font-bold flex-shrink-0">✓</span>
                  <span className="text-sm sm:text-base text-gray-700 font-medium">Immediately looks like a great fit for the role</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 text-lg font-bold flex-shrink-0">✓</span>
                  <span className="text-sm sm:text-base text-gray-700 font-medium">Quantified achievements that prove impact</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 text-lg font-bold flex-shrink-0">✓</span>
                  <span className="text-sm sm:text-base text-gray-700 font-medium">Clean, scannable format that's easy to follow</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 text-lg font-bold flex-shrink-0">✓</span>
                  <span className="text-sm sm:text-base text-gray-700 font-medium">Most relevant experience prioritized at the top</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Mid-page CTA */}
        <div className="mb-12 md:mb-20">
          <div className="p-5 sm:p-8 md:p-12 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[3rem] bg-gradient-to-br from-blue-500 to-cyan-500 shadow-[0_10px_0_0_rgba(37,99,235,0.5)] md:shadow-[0_15px_0_0_rgba(37,99,235,0.5)] border-2 border-blue-600 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-4">
              Ready to Start Landing Interviews?
            </h2>
            <p className="text-base sm:text-lg text-blue-100 font-medium mb-6 max-w-2xl mx-auto">
              Join thousands of PMs who've transformed their job search with AI-powered resume optimization.
            </p>
            <TrackedButton
              href="/auth/sign-up"
              className="inline-block px-8 py-4 sm:px-12 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] bg-white shadow-[0_6px_0_0_rgba(0,0,0,0.2)] border-2 border-gray-200 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(0,0,0,0.2)] text-lg sm:text-xl font-black text-blue-600 transition-all duration-200"
              eventName="User Clicked Get Started Button"
              buttonId="resume-landing-mid-page-cta"
              eventProperties={{
                'Button Section': 'Mid-Page CTA Section',
                'Button Position': 'Center of CTA Card',
                'Button Type': 'Primary CTA',
                'Button Text': 'Get Started →',
                'Button Context': 'After features section',
                'Page Section': 'Below the fold',
              }}
            >
              Get Started →
            </TrackedButton>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mb-12 md:mb-20">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-800 mb-3 md:mb-4">
              How It Works
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 font-medium px-2">
              From upload to optimized resume in minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 shadow-[0_6px_0_0_rgba(37,99,235,0.4)] border-2 border-blue-500 flex items-center justify-center mb-4 sm:mb-6">
                <span className="text-2xl sm:text-3xl font-black text-white">1</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Upload or Build</h3>
              <p className="text-sm sm:text-base text-gray-600 font-medium">
                Import your existing resume or start fresh. Our AI extracts all your information automatically.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 shadow-[0_6px_0_0_rgba(147,51,234,0.4)] border-2 border-purple-500 flex items-center justify-center mb-4 sm:mb-6">
                <span className="text-2xl sm:text-3xl font-black text-white">2</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Analyze & Optimize</h3>
              <p className="text-sm sm:text-base text-gray-600 font-medium">
                Get your resume score, identify weak spots, and use AI to rewrite bullets with powerful results.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-400 shadow-[0_6px_0_0_rgba(16,185,129,0.4)] border-2 border-emerald-500 flex items-center justify-center mb-4 sm:mb-6">
                <span className="text-2xl sm:text-3xl font-black text-white">3</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Tailor & Apply</h3>
              <p className="text-sm sm:text-base text-gray-600 font-medium">
                Paste any job description to instantly customize your resume. Export to PDF and apply with confidence.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-12 md:mb-20">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-800 mb-3 md:mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <FAQItem
              question="How is this different from other resume builders?"
              answer="Most resume builders just help you format text. We use AI to actually improve your content—rewriting weak bullets, tailoring your resume to specific jobs, and scoring your resume on the factors that matter to recruiters and ATS systems."
            />

            <FAQItem
              question="Will the AI make up experience I don't have?"
              answer="Never. Our AI only optimizes the experience you already have. It rewrites your bullets using stronger language and better structure, but never fabricates achievements or adds experience you don't have. We believe in honest, authentic representation."
            />

            <FAQItem
              question="How does job-specific tailoring work?"
              answer="Paste any job description and our AI analyzes what the employer is looking for. It then reorders your bullet points to prioritize the most relevant experience, naturally injects missing keywords, and suggests skills to add—all while preserving the truth of your experience."
            />

            <FAQItem
              question="Is the Resume Editor included in the Accelerate plan?"
              answer="Yes! The Resume Editor is included in the Accelerate plan, giving you full access to AI analysis, bullet optimization, and job-specific customization."
            />

            <FAQItem
              question="Will my resume pass ATS systems?"
              answer="Our AI specifically analyzes ATS compatibility and gives you a rating (Good, Fair, or Poor) with specific recommendations. We focus on clean formatting, proper keyword usage, and standard sections that ATS systems expect."
            />

            <FAQItem
              question="Can I create multiple versions of my resume?"
              answer="Absolutely! Create as many versions as you need—one for each type of role you're targeting. Clone any version in one click to quickly create variations for different companies or job descriptions."
            />
          </div>
        </div>

        {/* Final CTA */}
        <div className="p-5 sm:p-8 md:p-12 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[3rem] bg-gradient-to-br from-slate-800 to-slate-900 shadow-[0_12px_0_0_rgba(15,23,42,0.5)] md:shadow-[0_20px_0_0_rgba(15,23,42,0.5)] border-2 border-slate-700 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 sm:mb-6">
            Stop Sending Resumes Into the Void
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 font-medium mb-6 sm:mb-8 max-w-3xl mx-auto px-2">
            Every application without an optimized resume is a wasted opportunity. Let AI help you stand out, pass ATS filters, and land the interviews you deserve.
          </p>
          <TrackedButton
            href="/auth/sign-up"
            className="inline-block px-8 py-4 sm:px-10 sm:py-5 md:px-14 md:py-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 shadow-[0_6px_0_0_rgba(37,99,235,0.7)] sm:shadow-[0_8px_0_0_rgba(37,99,235,0.7)] md:shadow-[0_10px_0_0_rgba(37,99,235,0.7)] border-2 border-blue-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(37,99,235,0.7)] sm:hover:shadow-[0_4px_0_0_rgba(37,99,235,0.7)] md:hover:shadow-[0_6px_0_0_rgba(37,99,235,0.7)] text-base sm:text-lg md:text-xl font-black text-white transition-all duration-200 mb-4 sm:mb-6"
            eventName="User Clicked Get Started Button"
            buttonId="resume-landing-final-cta"
            eventProperties={{
              'Button Section': 'Final CTA Section',
              'Button Position': 'Center of Final CTA Card',
              'Button Type': 'Final CTA',
              'Button Text': 'GET STARTED →',
              'Button Context': 'After FAQ section, bottom of page',
              'Page Section': 'Below the fold',
            }}
          >
            GET STARTED →
          </TrackedButton>
          <p className="text-sm sm:text-base text-gray-400 font-medium px-2">
            Trusted by thousands of PMs
          </p>
        </div>
      </div>
    </div>
  );
};

// FAQ Item Component
interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem = ({ question, answer }: FAQItemProps) => (
  <div className="p-4 sm:p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-white shadow-[0_6px_0_0_rgba(0,0,0,0.1)] md:shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
    <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-1.5 sm:mb-2">
      {question}
    </h3>
    <p className="text-sm sm:text-base text-gray-700 font-medium">
      {answer}
    </p>
  </div>
);

export default ResumeLandingPage;

