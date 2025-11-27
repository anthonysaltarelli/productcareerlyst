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
                  <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/80 backdrop-blur-sm border-2 border-cyan-300 shadow-lg">
                    <span className="text-xs sm:text-sm font-bold text-cyan-700">
                      ✅ ATS-Optimized
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
                  eventName="User Clicked Try For Free Button"
                  buttonId="resume-landing-hero-cta"
                  eventProperties={{
                    'Button Section': 'Hero Section',
                    'Button Position': 'Center of Hero Card',
                    'Button Type': 'Primary CTA',
                    'Button Text': 'Try for free →',
                    'Button Context': 'Below headline and stats highlights',
                    'Page Section': 'Above the fold',
                  }}
                >
                  Try for free →
                </TrackedButton>
                <p className="text-center text-xs sm:text-sm text-gray-600 font-medium">
                  Cancel anytime • Full access during trial
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
              Your AI-Powered Resume Advantage
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 font-medium px-2">
              Stop guessing. Let AI help you craft resumes that actually convert.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6">

            {/* Feature 1: Job-Specific Customization */}
            <div className="p-5 sm:p-6 md:p-8 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_8px_0_0_rgba(147,51,234,0.3)] md:shadow-[0_12px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300">
              <div className="flex flex-col lg:flex-row items-start gap-4 sm:gap-6">
                <div className="flex w-14 h-14 sm:w-16 sm:h-16 rounded-[1.25rem] sm:rounded-[1.5rem] bg-gradient-to-br from-purple-400 to-pink-400 shadow-[0_6px_0_0_rgba(147,51,234,0.4)] border-2 border-purple-500 items-center justify-center flex-shrink-0">
                  <Target className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3 flex-wrap">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Job-Specific Resume Tailoring</h3>
                    <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold">
                      ✨ GAME-CHANGER
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-gray-700 font-medium mb-3 sm:mb-4">
                    Paste any job description and our AI instantly tailors your resume. It reorders your bullet points to prioritize what the employer cares about most, injects relevant keywords naturally, and suggests skills to add—all in seconds.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="p-3 sm:p-4 rounded-xl bg-white/60 border-2 border-purple-200">
                      <div className="flex items-center gap-2 mb-1 sm:mb-2">
                        <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                        <span className="text-sm font-bold text-gray-800">Smart Reordering</span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600">Puts your most relevant experience first</p>
                    </div>
                    <div className="p-3 sm:p-4 rounded-xl bg-white/60 border-2 border-purple-200">
                      <div className="flex items-center gap-2 mb-1 sm:mb-2">
                        <Search className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                        <span className="text-sm font-bold text-gray-800">Keyword Injection</span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600">Adds missing keywords naturally</p>
                    </div>
                    <div className="p-3 sm:p-4 rounded-xl bg-white/60 border-2 border-purple-200">
                      <div className="flex items-center gap-2 mb-1 sm:mb-2">
                        <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                        <span className="text-sm font-bold text-gray-800">Instant Results</span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600">Customize in seconds, not hours</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2: AI Resume Analysis */}
            <div className="p-5 sm:p-6 md:p-8 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-blue-200 to-cyan-200 shadow-[0_8px_0_0_rgba(37,99,235,0.3)] md:shadow-[0_12px_0_0_rgba(37,99,235,0.3)] border-2 border-blue-300">
              <div className="flex flex-col lg:flex-row items-start gap-4 sm:gap-6">
                <div className="flex w-14 h-14 sm:w-16 sm:h-16 rounded-[1.25rem] sm:rounded-[1.5rem] bg-gradient-to-br from-blue-400 to-cyan-400 shadow-[0_6px_0_0_rgba(37,99,235,0.4)] border-2 border-blue-500 items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">AI Resume Analysis & Scoring</h3>
                  <p className="text-sm sm:text-base text-gray-700 font-medium mb-3 sm:mb-4">
                    Get an instant, comprehensive score with actionable feedback. Our AI evaluates 5 key dimensions and gives you specific recommendations to improve.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="p-2 sm:p-3 rounded-xl bg-white/60 border-2 border-green-200 text-center">
                      <div className="text-lg sm:text-xl font-black text-green-600 mb-0.5 sm:mb-1">85%</div>
                      <p className="text-xs text-gray-600 font-medium">Action Verbs</p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-xl bg-white/60 border-2 border-blue-200 text-center">
                      <div className="text-lg sm:text-xl font-black text-blue-600 mb-0.5 sm:mb-1">72%</div>
                      <p className="text-xs text-gray-600 font-medium">Accomplishments</p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-xl bg-white/60 border-2 border-purple-200 text-center">
                      <div className="text-lg sm:text-xl font-black text-purple-600 mb-0.5 sm:mb-1">68%</div>
                      <p className="text-xs text-gray-600 font-medium">Quantification</p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-xl bg-white/60 border-2 border-orange-200 text-center">
                      <div className="text-lg sm:text-xl font-black text-orange-600 mb-0.5 sm:mb-1">90%</div>
                      <p className="text-xs text-gray-600 font-medium">Impact</p>
                    </div>
                    <div className="col-span-2 sm:col-span-1 p-2 sm:p-3 rounded-xl bg-white/60 border-2 border-yellow-200 text-center">
                      <div className="text-lg sm:text-xl font-black text-yellow-600 mb-0.5 sm:mb-1">82%</div>
                      <p className="text-xs text-gray-600 font-medium">Conciseness</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-200">
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
                    <span className="text-sm sm:text-base font-bold text-green-800">ATS Compatible: Good</span>
                    <span className="text-xs sm:text-sm text-green-700 ml-auto">Your resume will pass ATS filters</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3: AI Bullet Optimization */}
            <div className="p-5 sm:p-6 md:p-8 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-amber-200 to-orange-200 shadow-[0_8px_0_0_rgba(245,158,11,0.3)] md:shadow-[0_12px_0_0_rgba(245,158,11,0.3)] border-2 border-amber-300">
              <div className="flex flex-col lg:flex-row items-start gap-4 sm:gap-6">
                <div className="flex w-14 h-14 sm:w-16 sm:h-16 rounded-[1.25rem] sm:rounded-[1.5rem] bg-gradient-to-br from-amber-400 to-orange-400 shadow-[0_6px_0_0_rgba(245,158,11,0.4)] border-2 border-amber-500 items-center justify-center flex-shrink-0">
                  <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">AI Bullet Point Optimization</h3>
                  <p className="text-sm sm:text-base text-gray-700 font-medium mb-3 sm:mb-4">
                    Transform weak bullet points into compelling achievements. Our AI rewrites your experience using powerful action verbs and quantified results.
                  </p>
                  <div className="space-y-3">
                    <div className="p-3 sm:p-4 rounded-xl bg-red-100/80 border-2 border-red-200">
                      <div className="flex items-center gap-2 mb-1 sm:mb-2">
                        <span className="text-red-500 font-bold text-sm">BEFORE:</span>
                      </div>
                      <p className="text-sm sm:text-base text-gray-700 italic">"Worked on product roadmap and helped with feature launches"</p>
                    </div>
                    <div className="flex justify-center">
                      <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 transform rotate-90" />
                    </div>
                    <div className="p-3 sm:p-4 rounded-xl bg-green-100/80 border-2 border-green-200">
                      <div className="flex items-center gap-2 mb-1 sm:mb-2">
                        <span className="text-green-600 font-bold text-sm">AFTER:</span>
                      </div>
                      <p className="text-sm sm:text-base text-gray-700 italic">"Spearheaded product roadmap strategy for 3 key initiatives, driving 5 successful feature launches that increased user engagement by 40%"</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Two-column features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Feature 4: PDF Import */}
              <div className="p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] bg-gradient-to-br from-teal-200 to-emerald-200 shadow-[0_8px_0_0_rgba(20,184,166,0.3)] border-2 border-teal-300">
                <div className="flex items-start gap-4">
                  <div className="flex w-12 h-12 sm:w-14 sm:h-14 rounded-[1rem] sm:rounded-[1.25rem] bg-gradient-to-br from-teal-400 to-emerald-400 shadow-[0_4px_0_0_rgba(20,184,166,0.4)] border-2 border-teal-500 items-center justify-center flex-shrink-0">
                    <Upload className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">Smart Resume Import</h3>
                    <p className="text-sm sm:text-base text-gray-700 font-medium">
                      Upload your existing PDF or DOCX resume and our AI extracts everything—contact info, experiences, skills, and bullet points—automatically.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 5: Multiple Versions */}
              <div className="p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] bg-gradient-to-br from-indigo-200 to-violet-200 shadow-[0_8px_0_0_rgba(99,102,241,0.3)] border-2 border-indigo-300">
                <div className="flex items-start gap-4">
                  <div className="flex w-12 h-12 sm:w-14 sm:h-14 rounded-[1rem] sm:rounded-[1.25rem] bg-gradient-to-br from-indigo-400 to-violet-400 shadow-[0_4px_0_0_rgba(99,102,241,0.4)] border-2 border-indigo-500 items-center justify-center flex-shrink-0">
                    <Layers className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">Multiple Resume Versions</h3>
                    <p className="text-sm sm:text-base text-gray-700 font-medium">
                      Create different versions for different roles—one for startups, one for enterprise, one for each target company. Clone and customize in seconds.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 6: Keyword Analysis */}
              <div className="p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] bg-gradient-to-br from-rose-200 to-pink-200 shadow-[0_8px_0_0_rgba(244,63,94,0.3)] border-2 border-rose-300">
                <div className="flex items-start gap-4">
                  <div className="flex w-12 h-12 sm:w-14 sm:h-14 rounded-[1rem] sm:rounded-[1.25rem] bg-gradient-to-br from-rose-400 to-pink-400 shadow-[0_4px_0_0_rgba(244,63,94,0.4)] border-2 border-rose-500 items-center justify-center flex-shrink-0">
                    <Search className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">PM Keyword Analysis</h3>
                    <p className="text-sm sm:text-base text-gray-700 font-medium">
                      See which PM keywords you're using (roadmap, OKRs, A/B testing) and which critical ones you're missing. Beat ATS filters with the right terminology.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 7: PDF Export */}
              <div className="p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] bg-gradient-to-br from-sky-200 to-blue-200 shadow-[0_8px_0_0_rgba(14,165,233,0.3)] border-2 border-sky-300">
                <div className="flex items-start gap-4">
                  <div className="flex w-12 h-12 sm:w-14 sm:h-14 rounded-[1rem] sm:rounded-[1.25rem] bg-gradient-to-br from-sky-400 to-blue-400 shadow-[0_4px_0_0_rgba(14,165,233,0.4)] border-2 border-sky-500 items-center justify-center flex-shrink-0">
                    <FileDown className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">Professional PDF Export</h3>
                    <p className="text-sm sm:text-base text-gray-700 font-medium">
                      Export beautifully formatted PDFs ready for submission. ATS-friendly layouts that look great on screen and in print.
                    </p>
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
              eventName="User Clicked Try For Free Button"
              buttonId="resume-landing-mid-page-cta"
              eventProperties={{
                'Button Section': 'Mid-Page CTA Section',
                'Button Position': 'Center of CTA Card',
                'Button Type': 'Primary CTA',
                'Button Text': 'Try for free →',
                'Button Context': 'After features section',
                'Page Section': 'Below the fold',
              }}
            >
              Try for free →
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
              question="Is the Resume Editor included in the free trial?"
              answer="Yes! You get full access to the Resume Editor during your trial, including AI analysis, bullet optimization, and job-specific customization. You can cancel anytime if it's not right for you."
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
            eventName="User Clicked Try For Free Button"
            buttonId="resume-landing-final-cta"
            eventProperties={{
              'Button Section': 'Final CTA Section',
              'Button Position': 'Center of Final CTA Card',
              'Button Type': 'Final CTA',
              'Button Text': 'TRY FOR FREE →',
              'Button Context': 'After FAQ section, bottom of page',
              'Page Section': 'Below the fold',
            }}
          >
            TRY FOR FREE →
          </TrackedButton>
          <p className="text-sm sm:text-base text-gray-400 font-medium px-2">
            Cancel anytime • Full access during trial
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

