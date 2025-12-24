'use client';

import { PageTracking } from '@/app/components/PageTracking';
import { TrackedButton } from '@/app/components/TrackedButton';
import {
  Video,
  Mic,
  MessageSquare,
  Target,
  TrendingUp,
  Award,
  CheckCircle2,
  Brain,
  Clock,
  Zap,
  BarChart3,
  Sparkles,
  Quote,
  Lightbulb,
  Users,
  ArrowRight,
  Play,
  RefreshCw,
} from 'lucide-react';

const InterviewPrepLandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100">
      <PageTracking pageName="Interview Prep Landing Page" />

      <div className="max-w-7xl mx-auto px-4 py-6 sm:p-8 md:p-12 lg:p-16">

        {/* Hero Section */}
        <div className="flex justify-center mb-12 md:mb-20 relative">
          <div className="hidden md:block absolute -top-8 -left-8 w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 opacity-20 blur-2xl animate-pulse"></div>
          <div className="hidden md:block absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 opacity-20 blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>

          <div className="w-full max-w-4xl relative z-10">
            <div className="p-5 sm:p-8 md:p-12 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[3rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_12px_0_0_rgba(147,51,234,0.3)] md:shadow-[0_20px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300 relative overflow-hidden">
              <div className="relative z-10">
                {/* Badges */}
                <div className="flex justify-center gap-3 mb-4 sm:mb-6 flex-wrap">
                  <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/80 backdrop-blur-sm border-2 border-purple-300 shadow-lg">
                    <span className="text-xs sm:text-sm font-bold text-purple-700">
                      🎥 AI-Powered Video Interviews
                    </span>
                  </div>
                  <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/80 backdrop-blur-sm border-2 border-pink-300 shadow-lg">
                    <span className="text-xs sm:text-sm font-bold text-pink-700">
                      ✨ Beta Access on Accelerate Plan
                    </span>
                  </div>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent mb-4 sm:mb-6 leading-tight text-center">
                  Ace Your PM Interviews with AI Mock Practice
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-gray-700 font-semibold mb-6 sm:mb-8 text-center max-w-3xl mx-auto">
                  Stop guessing if you're ready. Practice with our AI interviewer, get instant feedback on 12+ PM competencies, and walk into every interview with confidence.
                </p>

                {/* Key value props */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div className="text-center p-3 sm:p-4 rounded-[1rem] sm:rounded-[1.5rem] bg-white/60 backdrop-blur-sm border-2 border-purple-200">
                    <div className="text-2xl sm:text-3xl font-black text-purple-700 mb-1">30 min</div>
                    <p className="text-xs sm:text-sm font-bold text-gray-700">full mock interviews</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 rounded-[1rem] sm:rounded-[1.5rem] bg-white/60 backdrop-blur-sm border-2 border-pink-200">
                    <div className="text-2xl sm:text-3xl font-black text-pink-700 mb-1">12</div>
                    <p className="text-xs sm:text-sm font-bold text-gray-700">PM competencies evaluated</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 rounded-[1rem] sm:rounded-[1.5rem] bg-white/60 backdrop-blur-sm border-2 border-purple-200">
                    <div className="text-2xl sm:text-3xl font-black text-purple-700 mb-1">100+</div>
                    <p className="text-xs sm:text-sm font-bold text-gray-700">practice questions</p>
                  </div>
                </div>

                <TrackedButton
                  href="/auth/sign-up"
                  className="block w-full px-6 py-4 sm:px-10 sm:py-6 rounded-[1.5rem] sm:rounded-[2rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_8px_0_0_rgba(147,51,234,0.6)] sm:shadow-[0_10px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_4px_0_0_rgba(147,51,234,0.6)] sm:hover:shadow-[0_6px_0_0_rgba(147,51,234,0.6)] text-lg sm:text-xl font-black text-white transition-all duration-200 text-center mb-3 sm:mb-4"
                  eventName="User Clicked Try For Free Button"
                  buttonId="interview-prep-landing-hero-cta"
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
              </div>
            </div>
          </div>
        </div>

        {/* The Problem Section */}
        <div className="mb-12 md:mb-20">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-800 mb-3 md:mb-4">
              Why PM Interviews Are So Hard to Pass
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 font-medium px-2">
              Even great PMs fail interviews because they can't practice effectively.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
            <div className="p-5 sm:p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-br from-red-200 to-orange-200 shadow-[0_8px_0_0_rgba(239,68,68,0.3)] md:shadow-[0_10px_0_0_rgba(239,68,68,0.3)] border-2 border-red-300">
              <div className="flex items-start gap-3 sm:gap-4">
                <span className="text-3xl sm:text-4xl flex-shrink-0">🎯</span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">
                    You Can't Practice Alone
                  </h3>
                  <p className="text-sm sm:text-base text-gray-700 font-medium">
                    Practicing in your head or in front of a mirror doesn't work. Without someone asking follow-ups and challenging your answers, you never discover your weak spots.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-br from-red-200 to-orange-200 shadow-[0_8px_0_0_rgba(239,68,68,0.3)] md:shadow-[0_10px_0_0_rgba(239,68,68,0.3)] border-2 border-red-300">
              <div className="flex items-start gap-3 sm:gap-4">
                <span className="text-3xl sm:text-4xl flex-shrink-0">💡</span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">
                    No Honest Feedback
                  </h3>
                  <p className="text-sm sm:text-base text-gray-700 font-medium">
                    Friends are too nice. Colleagues are busy. Hiring managers don't give feedback. You're left guessing what went wrong with no way to improve.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-br from-red-200 to-orange-200 shadow-[0_8px_0_0_rgba(239,68,68,0.3)] md:shadow-[0_10px_0_0_rgba(239,68,68,0.3)] border-2 border-red-300">
              <div className="flex items-start gap-3 sm:gap-4">
                <span className="text-3xl sm:text-4xl flex-shrink-0">⏰</span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">
                    Paid Coaching Is Expensive
                  </h3>
                  <p className="text-sm sm:text-base text-gray-700 font-medium">
                    Interview coaches charge $150-300+ per hour. At that rate, most people can only afford a session or two—not enough to build real confidence.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-br from-red-200 to-orange-200 shadow-[0_8px_0_0_rgba(239,68,68,0.3)] md:shadow-[0_10px_0_0_rgba(239,68,68,0.3)] border-2 border-red-300">
              <div className="flex items-start gap-3 sm:gap-4">
                <span className="text-3xl sm:text-4xl flex-shrink-0">🎲</span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">
                    Every Interview Feels Like a Gamble
                  </h3>
                  <p className="text-sm sm:text-base text-gray-700 font-medium">
                    Without proper practice, you're using real interviews as practice. Each one is high-stakes—and failing means burning a bridge with that company.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-slate-700 to-slate-900 shadow-[0_10px_0_0_rgba(15,23,42,0.4)] md:shadow-[0_15px_0_0_rgba(15,23,42,0.4)] border-2 border-slate-800 text-center">
            <p className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight">
              The result? Talented PMs{' '}
              <span className="text-red-400">waste months</span>{' '}
              in interview loops, losing out on their dream roles.
            </p>
          </div>
        </div>

        {/* The Solution Section - Two Practice Modes */}
        <div className="mb-12 md:mb-20">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-800 mb-3 md:mb-4 px-2">
              Two Ways to Level Up Your Interview Skills
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 font-medium px-2">
              Whether you have 5 minutes or 30, practice on your schedule.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">

            {/* 30-Minute Full Interview */}
            <div className="p-6 sm:p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_10px_0_0_rgba(147,51,234,0.3)] md:shadow-[0_15px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500 text-white text-xs font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  30 MINUTES
                </div>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-gray-800 mb-3">
                Full Mock Interview
              </h3>
              <p className="text-base sm:text-lg text-gray-700 font-medium mb-6">
                Simulate a real behavioral interview experience. Our AI interviewer asks follow-up questions, challenges your answers, and evaluates you on 12 PM competencies—just like a real hiring manager would.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm font-bold text-purple-700">
                  <CheckCircle2 className="w-5 h-5" />
                  Realistic back-and-forth conversation
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-purple-700">
                  <CheckCircle2 className="w-5 h-5" />
                  12 competencies evaluated per session
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-purple-700">
                  <CheckCircle2 className="w-5 h-5" />
                  Detailed feedback using N+STAR+TL framework
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-purple-700">
                  <CheckCircle2 className="w-5 h-5" />
                  Full transcript to review your answers
                </div>
              </div>
            </div>

            {/* 5-Minute Quick Practice */}
            <div className="p-6 sm:p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-cyan-200 to-blue-200 shadow-[0_10px_0_0_rgba(6,182,212,0.3)] md:shadow-[0_15px_0_0_rgba(6,182,212,0.3)] border-2 border-cyan-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500 text-white text-xs font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  5 MINUTES
                </div>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-gray-800 mb-3">
                Quick Question Practice
              </h3>
              <p className="text-base sm:text-lg text-gray-700 font-medium mb-6">
                Short on time? Pick any question from our 100+ question bank and practice your answer. Perfect for drilling specific question types or warming up before a real interview.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm font-bold text-cyan-700">
                  <CheckCircle2 className="w-5 h-5" />
                  100+ curated PM interview questions
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-cyan-700">
                  <CheckCircle2 className="w-5 h-5" />
                  Filter by category (Behavioral, Product Sense, etc.)
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-cyan-700">
                  <CheckCircle2 className="w-5 h-5" />
                  4 key competencies evaluated per answer
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-cyan-700">
                  <CheckCircle2 className="w-5 h-5" />
                  Practice anytime, anywhere
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Live Demo Section - Mock Interview UI */}
        <div className="mb-12 md:mb-20">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-800 mb-3 md:mb-4">
              See It In Action
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 font-medium px-2">
              A realistic interview experience powered by AI
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-white shadow-[0_10px_0_0_rgba(0,0,0,0.1)] md:shadow-[0_15px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
            {/* Browser Chrome */}
            <div className="rounded-[1.5rem] overflow-hidden border-2 border-gray-200 mb-6">
              <div className="bg-gray-100 px-4 py-2 flex items-center gap-2 border-b border-gray-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white rounded-md px-3 py-1 text-sm text-gray-600 font-mono">
                    productcareerlyst.com/dashboard/interview/mock
                  </div>
                </div>
              </div>
              {/* Mock Interview Screenshot */}
              <div className="aspect-[16/9] bg-gradient-to-br from-slate-50 to-purple-50 relative">
                <img
                  src="/portfolio_example_photos/livemockexample.png"
                  alt="AI Mock Interview Interface"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <TrackedButton
                href="/auth/sign-up"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_6px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.6)] font-bold text-white transition-all duration-200"
                eventName="User Clicked Try Mock Interview Button"
                buttonId="interview-prep-landing-demo-cta"
                eventProperties={{
                  'Button Section': 'Demo Section',
                  'Button Position': 'Below demo screenshot',
                  'Button Type': 'Primary CTA',
                  'Button Text': 'Try a Mock Interview',
                  'Button Context': 'After viewing demo',
                }}
              >
                <Play className="w-5 h-5" />
                Try a Mock Interview
              </TrackedButton>
            </div>
          </div>
        </div>

        {/* Comprehensive Feedback Section */}
        <div className="mb-12 md:mb-20">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-800 mb-3 md:mb-4 px-2">
              Feedback That Actually Helps You Improve
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 font-medium px-2">
              Know exactly where you stand and how to get better.
            </p>
          </div>

          <div className="space-y-8 md:space-y-12">

            {/* Feature 1: AI Evaluation */}
            <div className="rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-violet-100 to-purple-100 border-2 border-violet-200 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 md:p-10">
                <div className="flex flex-col justify-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500 text-white text-xs font-bold mb-4 w-fit">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI-POWERED EVALUATION
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-gray-800 mb-3">
                    Get Scored on 12 PM Competencies
                  </h3>
                  <p className="text-base sm:text-lg text-gray-700 font-medium mb-6">
                    Our AI evaluates your answers using the same framework top companies use. Get a 1-4 score on each competency with detailed explanations and supporting quotes from your transcript.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm font-bold text-violet-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Communication, Leadership, Product Sense
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-violet-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Problem Solving, Strategic Thinking
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-violet-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Data Analysis, Stakeholder Management
                    </div>
                  </div>
                </div>
                {/* Mock Evaluation UI */}
                <div className="bg-white rounded-2xl border-2 border-violet-200 p-5 shadow-lg">
                  {/* Overall Verdict */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/80 text-xs font-semibold mb-1">OVERALL VERDICT</p>
                        <h4 className="text-2xl font-black text-white">Hire</h4>
                      </div>
                      <div className="p-3 rounded-xl bg-white/20">
                        <div className="text-center">
                          <p className="text-2xl font-black text-white">3.2</p>
                          <p className="text-xs text-white/80">/4</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Skills Preview */}
                  <div className="space-y-2 mb-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Skills Breakdown</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded-lg bg-green-50 border border-green-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-700">Communication</span>
                          <span className="text-xs font-bold text-green-600">3.5</span>
                        </div>
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-green-500" style={{ width: '87%' }}></div>
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-700">Leadership</span>
                          <span className="text-xs font-bold text-blue-600">3.0</span>
                        </div>
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-blue-500" style={{ width: '75%' }}></div>
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-green-50 border border-green-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-700">Product Sense</span>
                          <span className="text-xs font-bold text-green-600">3.5</span>
                        </div>
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-green-500" style={{ width: '87%' }}></div>
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-orange-50 border border-orange-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-700">Data Analysis</span>
                          <span className="text-xs font-bold text-orange-600">2.5</span>
                        </div>
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-orange-500" style={{ width: '62%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center text-xs text-gray-500 font-medium">
                    + 8 more competencies evaluated
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2: Transcript & Quotes */}
            <div className="rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-slate-100 to-gray-100 border-2 border-slate-200 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 md:p-10">
                <div className="flex flex-col justify-center order-2 lg:order-1">
                  {/* Mock Transcript UI */}
                  <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <MessageSquare className="w-5 h-5 text-slate-600" />
                      <span className="text-sm font-bold text-gray-700">Full Transcript</span>
                    </div>
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-start">
                        <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-gray-100 text-gray-800">
                          <p className="text-xs font-medium mb-1 text-gray-500">AI Interviewer</p>
                          <p className="text-sm leading-relaxed">Tell me about a time when you had to make a difficult product decision with incomplete data.</p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-purple-500 text-white">
                          <p className="text-xs font-medium mb-1 opacity-80">You</p>
                          <p className="text-sm leading-relaxed">At my previous company, we faced a situation where we needed to decide whether to pivot our mobile strategy...</p>
                        </div>
                      </div>
                    </div>
                    {/* Supporting Quote */}
                    <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                      <div className="flex items-center gap-1 text-xs font-semibold text-purple-600 mb-2">
                        <Quote className="w-3 h-3" />
                        Supporting Quote
                      </div>
                      <p className="text-sm text-gray-600 italic">
                        "I gathered stakeholder input, analyzed our limited user data, and made a recommendation to the leadership team..."
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-center order-1 lg:order-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-600 text-white text-xs font-bold mb-4 w-fit">
                    <MessageSquare className="w-3.5 h-3.5" />
                    FULL TRANSCRIPT
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-gray-800 mb-3">
                    Review Every Word You Said
                  </h3>
                  <p className="text-base sm:text-lg text-gray-700 font-medium mb-6">
                    Get a complete transcript of your interview to review. Our AI highlights the exact quotes that supported (or hurt) your scores—so you know exactly what worked and what didn't.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Full conversation captured word-for-word
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Supporting quotes linked to each score
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Identify patterns across multiple interviews
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3: Recommended Improvements */}
            <div className="rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-amber-100 to-orange-100 border-2 border-amber-200 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 md:p-10">
                <div className="flex flex-col justify-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500 text-white text-xs font-bold mb-4 w-fit">
                    <Lightbulb className="w-3.5 h-3.5" />
                    ACTIONABLE IMPROVEMENTS
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-gray-800 mb-3">
                    Know Exactly How to Improve
                  </h3>
                  <p className="text-base sm:text-lg text-gray-700 font-medium mb-6">
                    Don't just get a score—get a roadmap to getting better. Each evaluation includes specific, actionable recommendations you can apply to your next interview.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm font-bold text-amber-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Prioritized list of improvements
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-amber-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Specific examples from your answers
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-amber-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Framework suggestions (N+STAR+TL)
                    </div>
                  </div>
                </div>
                {/* Mock Improvements UI */}
                <div className="bg-white rounded-2xl border-2 border-amber-200 p-5 shadow-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-bold text-gray-700">Recommended Improvements</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center">1</span>
                      <div>
                        <p className="text-sm font-bold text-gray-800">Add more quantified metrics</p>
                        <p className="text-xs text-gray-600">Your answers would be stronger with specific numbers (revenue impact, user growth, etc.)</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center">2</span>
                      <div>
                        <p className="text-sm font-bold text-gray-800">Structure answers with N+STAR+TL</p>
                        <p className="text-xs text-gray-600">Some responses jumped between topics. Use Nugget, Situation, Task, Action, Result, Takeaways & Learnings.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center">3</span>
                      <div>
                        <p className="text-sm font-bold text-gray-800">Include more stakeholder examples</p>
                        <p className="text-xs text-gray-600">Highlight cross-functional collaboration and how you influenced without authority.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center">4</span>
                      <div>
                        <p className="text-sm font-bold text-gray-800">End with "Takeaways & Learnings"</p>
                        <p className="text-xs text-gray-600">Strong candidates reflect on what they learned and would do differently.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* The Practice Loop Section */}
        <div className="mb-12 md:mb-20">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-800 mb-3 md:mb-4">
              The Practice → Feedback → Improve Loop
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 font-medium px-2">
              Get better with every interview, not just hope for the best.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 shadow-[0_6px_0_0_rgba(147,51,234,0.4)] border-2 border-purple-500 flex items-center justify-center mb-4 sm:mb-6">
                <Video className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">1. Practice</h3>
              <p className="text-sm sm:text-base text-gray-600 font-medium">
                Start a mock interview or quick question practice. Our AI interviewer adapts to your answers in real-time.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-violet-400 to-purple-400 shadow-[0_6px_0_0_rgba(139,92,246,0.4)] border-2 border-violet-500 flex items-center justify-center mb-4 sm:mb-6">
                <BarChart3 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">2. Get Feedback</h3>
              <p className="text-sm sm:text-base text-gray-600 font-medium">
                Receive detailed scores, supporting quotes, and specific recommendations to improve your performance.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-400 shadow-[0_6px_0_0_rgba(16,185,129,0.4)] border-2 border-emerald-500 flex items-center justify-center mb-4 sm:mb-6">
                <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">3. Level Up</h3>
              <p className="text-sm sm:text-base text-gray-600 font-medium">
                Apply recommendations in your next practice. Track your progress as your scores improve over time.
              </p>
            </div>
          </div>

          {/* Loop Visualization */}
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-100 to-emerald-100 border-2 border-purple-200">
              <RefreshCw className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-bold text-gray-700">Repeat until you're interview-ready</span>
            </div>
          </div>
        </div>

        {/* Mid-page CTA */}
        <div className="mb-12 md:mb-20">
          <div className="p-5 sm:p-8 md:p-12 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[3rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_10px_0_0_rgba(147,51,234,0.5)] md:shadow-[0_15px_0_0_rgba(147,51,234,0.5)] border-2 border-purple-600 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-4">
              Ready to Start Passing Interviews?
            </h2>
            <p className="text-base sm:text-lg text-purple-100 font-medium mb-6 max-w-2xl mx-auto">
              Stop using real interviews as practice. Start every interview prepared, confident, and ready to impress.
            </p>
            <TrackedButton
              href="/auth/sign-up"
              className="inline-block px-8 py-4 sm:px-12 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] bg-white shadow-[0_6px_0_0_rgba(0,0,0,0.2)] border-2 border-gray-200 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(0,0,0,0.2)] text-lg sm:text-xl font-black text-purple-600 transition-all duration-200"
              eventName="User Clicked Try For Free Button"
              buttonId="interview-prep-landing-mid-page-cta"
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

        {/* Comparison Section */}
        <div className="mb-12 md:mb-20">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-800 mb-3 md:mb-4">
              The Difference Real Practice Makes
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 font-medium px-2">
              Prepared candidates get offers. Unprepared candidates get ghosted.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Without Practice */}
            <div className="p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] bg-gradient-to-br from-slate-100 to-slate-200 shadow-[0_10px_0_0_rgba(0,0,0,0.1)] md:shadow-[0_12px_0_0_rgba(0,0,0,0.1)] border-2 border-slate-300">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-400 flex items-center justify-center">
                  <span className="text-xl sm:text-2xl">😬</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-800">Without Practice</h3>
              </div>
              <ul className="space-y-3 sm:space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-red-500 text-lg font-bold flex-shrink-0">✗</span>
                  <span className="text-sm sm:text-base text-gray-700 font-medium">Rambling, unstructured answers</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 text-lg font-bold flex-shrink-0">✗</span>
                  <span className="text-sm sm:text-base text-gray-700 font-medium">Blanking on good examples</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 text-lg font-bold flex-shrink-0">✗</span>
                  <span className="text-sm sm:text-base text-gray-700 font-medium">No idea how you're being evaluated</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 text-lg font-bold flex-shrink-0">✗</span>
                  <span className="text-sm sm:text-base text-gray-700 font-medium">Nervous and underprepared</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 text-lg font-bold flex-shrink-0">✗</span>
                  <span className="text-sm sm:text-base text-gray-700 font-medium">Using real interviews as practice</span>
                </li>
              </ul>
            </div>

            {/* With AI Practice */}
            <div className="p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] bg-gradient-to-br from-green-200 to-emerald-200 shadow-[0_10px_0_0_rgba(22,163,74,0.3)] md:shadow-[0_12px_0_0_rgba(22,163,74,0.3)] border-2 border-green-300">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-xl sm:text-2xl">🎯</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-800">With AI Practice</h3>
              </div>
              <ul className="space-y-3 sm:space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 text-lg font-bold flex-shrink-0">✓</span>
                  <span className="text-sm sm:text-base text-gray-700 font-medium">Clear, structured N+STAR+TL responses</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 text-lg font-bold flex-shrink-0">✓</span>
                  <span className="text-sm sm:text-base text-gray-700 font-medium">Ready with impactful stories</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 text-lg font-bold flex-shrink-0">✓</span>
                  <span className="text-sm sm:text-base text-gray-700 font-medium">Know exactly what interviewers look for</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 text-lg font-bold flex-shrink-0">✓</span>
                  <span className="text-sm sm:text-base text-gray-700 font-medium">Confident and well-rehearsed</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 text-lg font-bold flex-shrink-0">✓</span>
                  <span className="text-sm sm:text-base text-gray-700 font-medium">Every real interview is your best performance</span>
                </li>
              </ul>
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
              question="How realistic is the AI interviewer?"
              answer="Very realistic! Our AI interviewer uses natural conversation, asks follow-up questions based on your answers, and can challenge vague responses - just like a real hiring manager. The video interface creates a professional interview environment that closely mirrors the real thing."
            />

            <FAQItem
              question="What types of questions does it cover?"
              answer="We cover all PM interview types: behavioral questions, product sense, product execution, technical, analytical, strategy, leadership, and more. Our question bank includes 100+ questions across 9 categories, regularly updated based on real interview data."
            />

            <FAQItem
              question="How is the N+STAR+TL framework used?"
              answer="N+STAR+TL stands for Nugget (your key point), Situation, Task, Action, Result, Takeaways & Learnings. Our AI evaluates whether your answers follow this structure we recommend and provides specific feedback on how to improve each component."
            />

            <FAQItem
              question="Can I practice specific question types?"
              answer="Yes! Use our Quick Question Practice mode to filter questions by category (Behavioral, Product Sense, etc.) and practice exactly the areas where you need the most work. Great for targeted improvement."
            />

            <FAQItem
              question="Is the AI Mock Interviewer available to all users?"
              answer="Right now, our AI Mock Interviewer is in Beta. If you're interested in testing out the feature and providing feedback to our team, please email us at team@productcareerlyst.com for access."
            />
          </div>
        </div>

        {/* Final CTA */}
        <div className="p-5 sm:p-8 md:p-12 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[3rem] bg-gradient-to-br from-slate-800 to-slate-900 shadow-[0_12px_0_0_rgba(15,23,42,0.5)] md:shadow-[0_20px_0_0_rgba(15,23,42,0.5)] border-2 border-slate-700 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 sm:mb-6">
            Your Dream PM Role Is One Interview Away
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 font-medium mb-6 sm:mb-8 max-w-3xl mx-auto px-2">
            Don't let poor interview performance cost you the opportunity you've worked so hard for. Start practicing today and walk into your next interview ready to impress.
          </p>
          <TrackedButton
            href="/auth/sign-up"
            className="inline-block px-8 py-4 sm:px-10 sm:py-5 md:px-14 md:py-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_6px_0_0_rgba(147,51,234,0.7)] sm:shadow-[0_8px_0_0_rgba(147,51,234,0.7)] md:shadow-[0_10px_0_0_rgba(147,51,234,0.7)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.7)] sm:hover:shadow-[0_4px_0_0_rgba(147,51,234,0.7)] md:hover:shadow-[0_6px_0_0_rgba(147,51,234,0.7)] text-base sm:text-lg md:text-xl font-black text-white transition-all duration-200 mb-4 sm:mb-6"
            eventName="User Clicked Try For Free Button"
            buttonId="interview-prep-landing-final-cta"
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

export default InterviewPrepLandingPage;
