'use client';

import { PageTracking } from '@/app/components/PageTracking';
import { TrackedButton } from '@/app/components/TrackedButton';
import {
  Briefcase,
  ClipboardList,
  Search,
  Users,
  MessageSquare,
  Mail,
  Building2,
  Calendar,
  CheckCircle2,
  Zap,
  Target,
  ArrowRight,
  FileText,
  Sparkles,
  LayoutGrid,
  Link as LinkIcon,
  UserCheck,
  Linkedin,
  AtSign,
  HelpCircle,
  TrendingUp,
  Shield,
  Clock,
  Brain,
  FileQuestion,
  Send,
} from 'lucide-react';

const RESEARCH_VECTORS = [
  { icon: '🎯', label: 'Mission' },
  { icon: '💎', label: 'Values' },
  { icon: '📖', label: 'Origin Story' },
  { icon: '📦', label: 'Product' },
  { icon: '👥', label: 'User Types' },
  { icon: '🏆', label: 'Competition' },
  { icon: '⚠️', label: 'Risks' },
  { icon: '🚀', label: 'Recent Launches' },
  { icon: '🎯', label: 'Strategy' },
  { icon: '💰', label: 'Funding' },
  { icon: '🤝', label: 'Partnerships' },
  { icon: '💬', label: 'Customer Feedback' },
  { icon: '📊', label: 'Business Model' },
];

const JobCenterLandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-100 via-cyan-100 to-blue-100">
      <PageTracking pageName="Job Center Landing Page" />

      <div className="max-w-7xl mx-auto px-4 py-6 sm:p-8 md:p-12 lg:p-16">

        {/* Hero Section */}
        <div className="flex justify-center mb-12 md:mb-20 relative">
          <div className="hidden md:block absolute -top-8 -left-8 w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 opacity-20 blur-2xl animate-pulse"></div>
          <div className="hidden md:block absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br from-cyan-400 to-teal-400 opacity-20 blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>

          <div className="w-full max-w-4xl relative z-10">
            <div className="p-5 sm:p-8 md:p-12 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[3rem] bg-gradient-to-br from-teal-200 to-cyan-200 shadow-[0_12px_0_0_rgba(20,184,166,0.3)] md:shadow-[0_20px_0_0_rgba(20,184,166,0.3)] border-2 border-teal-300 relative overflow-hidden">
              <div className="relative z-10">
                {/* Badges */}
                <div className="flex justify-center gap-3 mb-4 sm:mb-6 flex-wrap">
                  <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/80 backdrop-blur-sm border-2 border-teal-300 shadow-lg">
                    <span className="text-xs sm:text-sm font-bold text-teal-700">
                      🤖 AI-Powered
                    </span>
                  </div>
                  <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/80 backdrop-blur-sm border-2 border-cyan-300 shadow-lg">
                    <span className="text-xs sm:text-sm font-bold text-cyan-700">
                      ✨ Available on the Accelerate Plan
                    </span>
                  </div>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-br from-teal-700 to-cyan-600 bg-clip-text text-transparent mb-4 sm:mb-6 leading-tight text-center">
                  Your PM Job Search Command Center
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-gray-700 font-semibold mb-6 sm:mb-8 text-center max-w-3xl mx-auto">
                  Stop drowning in spreadsheets. Track applications, research companies, manage interviews, and network smarter—all in one place.
                </p>

                {/* Key stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div className="text-center p-3 sm:p-4 rounded-[1rem] sm:rounded-[1.5rem] bg-white/60 backdrop-blur-sm border-2 border-teal-200">
                    <div className="text-2xl sm:text-3xl font-black text-teal-700 mb-1">13</div>
                    <p className="text-xs sm:text-sm font-bold text-gray-700">AI research vectors per company</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 rounded-[1rem] sm:rounded-[1.5rem] bg-white/60 backdrop-blur-sm border-2 border-cyan-200">
                    <div className="text-2xl sm:text-3xl font-black text-cyan-700 mb-1">60 sec</div>
                    <p className="text-xs sm:text-sm font-bold text-gray-700">to import a job from URL</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 rounded-[1rem] sm:rounded-[1.5rem] bg-white/60 backdrop-blur-sm border-2 border-teal-200">
                    <div className="text-4xl sm:text-5xl font-black text-teal-700 mb-1">∞</div>
                    <p className="text-xs sm:text-sm font-bold text-gray-700">verified PM contacts to discover</p>
                  </div>
                </div>

                <TrackedButton
                  href="/auth/sign-up"
                  className="block w-full px-6 py-4 sm:px-10 sm:py-6 rounded-[1.5rem] sm:rounded-[2rem] bg-gradient-to-br from-teal-500 to-cyan-500 shadow-[0_8px_0_0_rgba(20,184,166,0.6)] sm:shadow-[0_10px_0_0_rgba(20,184,166,0.6)] border-2 border-teal-600 hover:translate-y-1 hover:shadow-[0_4px_0_0_rgba(20,184,166,0.6)] sm:hover:shadow-[0_6px_0_0_rgba(20,184,166,0.6)] text-lg sm:text-xl font-black text-white transition-all duration-200 text-center mb-3 sm:mb-4"
                  eventName="User Clicked Try For Free Button"
                  buttonId="job-center-landing-hero-cta"
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
              Why Your Job Search Feels Like Chaos
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 font-medium px-2">
              Here's the reality of managing a PM job search without the right tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
            <div className="p-5 sm:p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-br from-red-200 to-orange-200 shadow-[0_8px_0_0_rgba(239,68,68,0.3)] md:shadow-[0_10px_0_0_rgba(239,68,68,0.3)] border-2 border-red-300">
              <div className="flex items-start gap-3 sm:gap-4">
                <span className="text-3xl sm:text-4xl flex-shrink-0">📊</span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">
                    Spreadsheet Hell
                  </h3>
                  <p className="text-sm sm:text-base text-gray-700 font-medium">
                    You're managing 50+ applications across tabs, columns, and filters. Which company was that recruiter from? Did you follow up last week? Nobody knows.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-br from-red-200 to-orange-200 shadow-[0_8px_0_0_rgba(239,68,68,0.3)] md:shadow-[0_10px_0_0_rgba(239,68,68,0.3)] border-2 border-red-300">
              <div className="flex items-start gap-3 sm:gap-4">
                <span className="text-3xl sm:text-4xl flex-shrink-0">🔍</span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">
                    Research Black Hole
                  </h3>
                  <p className="text-sm sm:text-base text-gray-700 font-medium">
                    Every interview requires hours of research. You're digging through press releases, LinkedIn, Glassdoor, and product reviews—and still miss critical insights.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-br from-red-200 to-orange-200 shadow-[0_8px_0_0_rgba(239,68,68,0.3)] md:shadow-[0_10px_0_0_rgba(239,68,68,0.3)] border-2 border-red-300">
              <div className="flex items-start gap-3 sm:gap-4">
                <span className="text-3xl sm:text-4xl flex-shrink-0">🤝</span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">
                    Networking Dead Ends
                  </h3>
                  <p className="text-sm sm:text-base text-gray-700 font-medium">
                    You want to reach out to PMs at target companies, but finding verified emails and the right contacts is a full-time job in itself.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-br from-red-200 to-orange-200 shadow-[0_8px_0_0_rgba(239,68,68,0.3)] md:shadow-[0_10px_0_0_rgba(239,68,68,0.3)] border-2 border-red-300">
              <div className="flex items-start gap-3 sm:gap-4">
                <span className="text-3xl sm:text-4xl flex-shrink-0">📝</span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">
                    Interview Prep Scramble
                  </h3>
                  <p className="text-sm sm:text-base text-gray-700 font-medium">
                    What questions should you ask? What follow-up email should you send? You're scrambling before every interview without a system.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-slate-700 to-slate-900 shadow-[0_10px_0_0_rgba(15,23,42,0.4)] md:shadow-[0_15px_0_0_rgba(15,23,42,0.4)] border-2 border-slate-800 text-center">
            <p className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight">
              The result? Qualified PMs spend{' '}
              <span className="text-red-400">80% of their time</span>{' '}
              on admin tasks instead of actually landing jobs.
            </p>
          </div>
        </div>

        {/* The Solution Section */}
        <div className="mb-12 md:mb-20">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-800 mb-3 md:mb-4 px-2">
              Everything You Need to Win the Job Search
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 font-medium px-2">
              Powerful AI tools that handle the busywork so you can focus on landing offers.
            </p>
          </div>

          <div className="space-y-8 md:space-y-12">

            {/* Feature 1: Job Import */}
            <div className="rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-teal-100 to-emerald-100 border-2 border-teal-200 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 md:p-10">
                <div className="flex flex-col justify-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500 text-white text-xs font-bold mb-4 w-fit">
                    <LinkIcon className="w-3.5 h-3.5" />
                    INSTANT IMPORT
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-gray-800 mb-3">
                    Paste a URL, Import Everything
                  </h3>
                  <p className="text-base sm:text-lg text-gray-700 font-medium mb-6">
                    Found a job on LinkedIn, Indeed, or a company site? Just paste the URL. Our AI extracts the title, company, description, requirements—everything—and creates a complete application record instantly.
                  </p>
                  <div className="flex items-center gap-3 text-sm font-bold text-teal-700">
                    <CheckCircle2 className="w-5 h-5" />
                    Works with any job posting URL
                  </div>
                </div>
                {/* Mock Import UI */}
                <div className="bg-white rounded-2xl border-2 border-teal-200 p-6 shadow-lg">
                  <div className="mb-4">
                    <label className="text-sm font-bold text-gray-700 mb-2 block">Job URL</label>
                    <div className="flex gap-2">
                      <div className="flex-1 p-3 rounded-xl bg-gray-50 border-2 border-gray-200 text-sm text-gray-600 font-medium truncate">
                        https://linkedin.com/jobs/view/product-manager-at-stripe...
                      </div>
                      <button className="px-4 py-2 rounded-xl bg-teal-500 text-white font-bold text-sm flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Import
                      </button>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                        S
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">Product Manager, Growth</p>
                        <p className="text-sm text-gray-600">Stripe • San Francisco, CA</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 rounded-lg bg-green-200 text-green-800 text-xs font-bold">✓ Title</span>
                      <span className="px-2 py-1 rounded-lg bg-green-200 text-green-800 text-xs font-bold">✓ Company</span>
                      <span className="px-2 py-1 rounded-lg bg-green-200 text-green-800 text-xs font-bold">✓ Location</span>
                      <span className="px-2 py-1 rounded-lg bg-green-200 text-green-800 text-xs font-bold">✓ Description</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2: Contact Discovery */}
            <div className="rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-200 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 md:p-10">
                <div className="flex flex-col justify-center order-2 lg:order-1">
                  {/* Mock Contact Discovery UI */}
                  <div className="bg-white rounded-2xl border-2 border-purple-200 p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-bold text-gray-700">PM Contacts at Stripe</span>
                      <span className="px-2 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-bold">
                        3 verified contacts
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white font-bold">
                              JC
                            </div>
                            <div>
                              <p className="font-bold text-gray-800 text-sm">Jessica Chen</p>
                              <p className="text-xs text-gray-600">Senior Product Manager</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-[10px] text-green-600 font-bold">VERIFIED</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold">
                            <AtSign className="w-3 h-3" />
                            jessica@stripe.com
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold">
                            <Linkedin className="w-3 h-3" />
                            LinkedIn
                          </span>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center text-white font-bold">
                              MK
                            </div>
                            <div>
                              <p className="font-bold text-gray-800 text-sm">Michael Kim</p>
                              <p className="text-xs text-gray-600">Group Product Manager</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-[10px] text-green-600 font-bold">VERIFIED</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold">
                            <AtSign className="w-3 h-3" />
                            michael.k@stripe.com
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold">
                            <Linkedin className="w-3 h-3" />
                            LinkedIn
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-center order-1 lg:order-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500 text-white text-xs font-bold mb-4 w-fit">
                    <UserCheck className="w-3.5 h-3.5" />
                    VERIFIED CONTACTS
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-gray-800 mb-3">
                    Discover PMs at Any Company
                  </h3>
                  <p className="text-base sm:text-lg text-gray-700 font-medium mb-6">
                    Get verified contact information for Product Managers at your target companies. Find their name, title, email, and LinkedIn—so you can network strategically and get referrals.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm font-bold text-purple-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Verified email addresses
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-purple-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Direct LinkedIn profiles
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-purple-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Job titles and seniority levels
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3: Company Research */}
            <div className="rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-amber-100 to-orange-100 border-2 border-amber-200 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 md:p-10">
                <div className="flex flex-col justify-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500 text-white text-xs font-bold mb-4 w-fit">
                    <Brain className="w-3.5 h-3.5" />
                    13 RESEARCH VECTORS
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-gray-800 mb-3">
                    Know Everything About the Company
                  </h3>
                  <p className="text-base sm:text-lg text-gray-700 font-medium mb-6">
                    One click generates comprehensive research across 13 dimensions. Mission, values, competition, funding, recent launches, strategy, business model—everything you need to ace your interviews.
                  </p>
                  <div className="flex items-center gap-3 text-sm font-bold text-amber-700">
                    <Sparkles className="w-5 h-5" />
                    AI-powered research with cited sources
                  </div>
                </div>
                {/* Mock Research UI */}
                <div className="bg-white rounded-2xl border-2 border-amber-200 p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-gray-700">Research Vectors</span>
                    <span className="px-2 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold">
                      13/13 Complete
                    </span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {RESEARCH_VECTORS.map((vector, index) => (
                      <div
                        key={index}
                        className="p-2 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 text-center"
                      >
                        <span className="text-lg block mb-1">{vector.icon}</span>
                        <span className="text-[10px] font-bold text-gray-700">{vector.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <p className="text-xs text-amber-800 font-medium">
                      <span className="font-bold">💡 Example insight:</span> "Stripe's recent launch of financial infrastructure APIs positions them directly against Plaid and Finicity..."
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 4: Interview Management */}
            <div className="rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-blue-100 to-cyan-100 border-2 border-blue-200 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 md:p-10">
                <div className="flex flex-col justify-center order-2 lg:order-1">
                  {/* Mock Interview UI */}
                  <div className="bg-white rounded-2xl border-2 border-blue-200 p-5 shadow-lg">
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gray-700">Upcoming Interview</span>
                        <span className="px-2 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold">
                          Product Sense
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                        <div className="flex items-center gap-3 mb-2">
                          <Calendar className="w-5 h-5 text-blue-600" />
                          <span className="font-bold text-gray-800">Tomorrow, 2:00 PM</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Interviewer: Sarah Johnson (Senior PM)</p>
                      </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">AI-Generated Questions to Ask</p>
                      <div className="space-y-2">
                        <div className="p-2 rounded-lg bg-green-50 border border-green-200">
                          <div className="flex items-start gap-2">
                            <HelpCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-gray-700">"I noticed Stripe recently launched Revenue Recognition—how does the Growth team balance driving adoption of new products vs. deepening usage of core payments?"</p>
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-green-50 border border-green-200">
                          <div className="flex items-start gap-2">
                            <HelpCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-gray-700">"For a Product Sense case, would you prioritize activation rate or time-to-first-transaction as the north star metric for merchant onboarding?"</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button className="w-full px-4 py-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-bold text-sm flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Generate More Questions
                    </button>
                  </div>
                </div>
                <div className="flex flex-col justify-center order-1 lg:order-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500 text-white text-xs font-bold mb-4 w-fit">
                    <FileQuestion className="w-3.5 h-3.5" />
                    AI INTERVIEW PREP
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-gray-800 mb-3">
                    Never Run Out of Smart Questions
                  </h3>
                  <p className="text-base sm:text-lg text-gray-700 font-medium mb-6">
                    Add interviews, specify the type (Product Sense, Technical, Hiring Manager, etc.), and our AI generates tailored questions to ask. Questions are based on the company, role, interviewer, and interview type.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm font-bold text-blue-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Questions tailored to interview type
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-blue-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Context-aware based on company research
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-blue-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Add notes on interviewer answers
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 5: Thank You Emails */}
            <div className="rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-pink-100 to-rose-100 border-2 border-pink-200 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 md:p-10">
                <div className="flex flex-col justify-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-500 text-white text-xs font-bold mb-4 w-fit">
                    <Send className="w-3.5 h-3.5" />
                    AI THANK YOU NOTES
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-gray-800 mb-3">
                    Personalized Follow-Ups in Seconds
                  </h3>
                  <p className="text-base sm:text-lg text-gray-700 font-medium mb-6">
                    Record the answers to questions you asked during your interview. Our AI uses those notes to generate a personalized, thoughtful thank you email that references specific conversation points—making you stand out.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm font-bold text-pink-700">
                      <CheckCircle2 className="w-5 h-5" />
                      References actual interview conversation
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-pink-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Professional tone, authentic feel
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-pink-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Copy and send instantly
                    </div>
                  </div>
                </div>
                {/* Mock Email UI */}
                <div className="bg-white rounded-2xl border-2 border-pink-200 p-5 shadow-lg">
                  <div className="mb-4">
                    <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Generated Thank You Email</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 mb-4">
                    <div className="mb-3 pb-3 border-b border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Subject:</p>
                      <p className="text-sm font-bold text-gray-800">Thank you for the conversation about the Growth PM role</p>
                    </div>
                    <div className="text-sm text-gray-700 space-y-3">
                      <p>Hi Sarah,</p>
                      <p>Thank you so much for taking the time to speak with me today about the Product Manager role at Stripe. I really enjoyed our conversation about <span className="bg-yellow-100 px-1 rounded">how the Growth team measures success through activation metrics</span>.</p>
                      <p>Your insight about <span className="bg-yellow-100 px-1 rounded">the cross-functional collaboration with engineering</span> was particularly interesting, and it reinforced my excitement about the opportunity...</p>
                    </div>
                  </div>
                  <button className="w-full px-4 py-2 rounded-xl bg-pink-100 text-pink-700 font-bold text-sm flex items-center justify-center gap-2 border-2 border-pink-200 hover:bg-pink-200 transition-colors">
                    <Mail className="w-4 h-4" />
                    Copy to Clipboard
                  </button>
                </div>
              </div>
            </div>

            {/* Feature 6: Kanban Organization */}
            <div className="rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-slate-100 to-gray-100 border-2 border-slate-200 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 md:p-10">
                <div className="flex flex-col justify-center order-2 lg:order-1">
                  {/* Mock Kanban UI */}
                  <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-lg overflow-hidden">
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      <div className="flex-shrink-0 w-36">
                        <div className="px-3 py-2 rounded-lg bg-gray-100 mb-2">
                          <span className="text-xs font-bold text-gray-600">Applied</span>
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 text-[10px] font-bold">12</span>
                        </div>
                        <div className="space-y-2">
                          <div className="p-2 rounded-lg bg-white border border-gray-200 shadow-sm">
                            <p className="text-xs font-bold text-gray-800 truncate">Stripe</p>
                            <p className="text-[10px] text-gray-500">PM, Growth</p>
                          </div>
                          <div className="p-2 rounded-lg bg-white border border-gray-200 shadow-sm">
                            <p className="text-xs font-bold text-gray-800 truncate">Notion</p>
                            <p className="text-[10px] text-gray-500">Senior PM</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 w-36">
                        <div className="px-3 py-2 rounded-lg bg-blue-100 mb-2">
                          <span className="text-xs font-bold text-blue-600">Interviewing</span>
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-blue-200 text-blue-600 text-[10px] font-bold">4</span>
                        </div>
                        <div className="space-y-2">
                          <div className="p-2 rounded-lg bg-white border-2 border-blue-300 shadow-sm">
                            <p className="text-xs font-bold text-gray-800 truncate">Figma</p>
                            <p className="text-[10px] text-gray-500">Product Lead</p>
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 text-[10px] font-bold">Round 2</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 w-36">
                        <div className="px-3 py-2 rounded-lg bg-green-100 mb-2">
                          <span className="text-xs font-bold text-green-600">Offer</span>
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-green-200 text-green-600 text-[10px] font-bold">1</span>
                        </div>
                        <div className="space-y-2">
                          <div className="p-2 rounded-lg bg-white border-2 border-green-300 shadow-sm">
                            <p className="text-xs font-bold text-gray-800 truncate">Linear</p>
                            <p className="text-[10px] text-gray-500">Senior PM</p>
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-bold">🎉 Offer!</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-center order-1 lg:order-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-600 text-white text-xs font-bold mb-4 w-fit">
                    <LayoutGrid className="w-3.5 h-3.5" />
                    VISUAL ORGANIZATION
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-gray-800 mb-3">
                    Finally, Get Out of Spreadsheet Hell
                  </h3>
                  <p className="text-base sm:text-lg text-gray-700 font-medium mb-6">
                    Track every application with a beautiful Kanban board. Drag and drop between stages, see your pipeline at a glance, and never lose track of where you stand with any company.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Drag-and-drop between stages
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Track status history and timeline
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Filter by company, status, and more
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Comparison Section */}
        <div className="mb-12 md:mb-20">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-800 mb-3 md:mb-4">
              Chaos vs. Command Center
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 font-medium px-2">
              See the difference an organized job search makes.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Without Job Center */}
            <div className="p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] bg-gradient-to-br from-slate-100 to-slate-200 shadow-[0_10px_0_0_rgba(0,0,0,0.1)] md:shadow-[0_12px_0_0_rgba(0,0,0,0.1)] border-2 border-slate-300">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-400 flex items-center justify-center">
                  <span className="text-xl sm:text-2xl">😵</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-800">The Chaotic Search</h3>
              </div>
              <ul className="space-y-3 sm:space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-red-500 text-lg font-bold flex-shrink-0">✗</span>
                  <span className="text-sm sm:text-base text-gray-700 font-medium">50+ tabs across Google Sheets, LinkedIn, and email</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 text-lg font-bold flex-shrink-0">✗</span>
                  <span className="text-sm sm:text-base text-gray-700 font-medium">Hours spent researching each company manually</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 text-lg font-bold flex-shrink-0">✗</span>
                  <span className="text-sm sm:text-base text-gray-700 font-medium">No idea who to reach out to at target companies</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 text-lg font-bold flex-shrink-0">✗</span>
                  <span className="text-sm sm:text-base text-gray-700 font-medium">Scrambling to think of questions before interviews</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 text-lg font-bold flex-shrink-0">✗</span>
                  <span className="text-sm sm:text-base text-gray-700 font-medium">Generic thank you emails that don't stand out</span>
                </li>
              </ul>
            </div>

            {/* With Job Center */}
            <div className="p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] bg-gradient-to-br from-teal-200 to-cyan-200 shadow-[0_10px_0_0_rgba(20,184,166,0.3)] md:shadow-[0_12px_0_0_rgba(20,184,166,0.3)] border-2 border-teal-300">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-teal-500 flex items-center justify-center">
                  <span className="text-xl sm:text-2xl">🎯</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-800">The Command Center</h3>
              </div>
              <ul className="space-y-3 sm:space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-teal-600 text-lg font-bold flex-shrink-0">✓</span>
                  <span className="text-sm sm:text-base text-gray-700 font-medium">One dashboard with everything organized visually</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-teal-600 text-lg font-bold flex-shrink-0">✓</span>
                  <span className="text-sm sm:text-base text-gray-700 font-medium">AI research on 13 dimensions with one click</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-teal-600 text-lg font-bold flex-shrink-0">✓</span>
                  <span className="text-sm sm:text-base text-gray-700 font-medium">Verified PM contacts with emails and LinkedIn</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-teal-600 text-lg font-bold flex-shrink-0">✓</span>
                  <span className="text-sm sm:text-base text-gray-700 font-medium">AI-generated questions tailored to each interview</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-teal-600 text-lg font-bold flex-shrink-0">✓</span>
                  <span className="text-sm sm:text-base text-gray-700 font-medium">Personalized follow-ups that reference the conversation</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Mid-page CTA */}
        <div className="mb-12 md:mb-20">
          <div className="p-5 sm:p-8 md:p-12 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[3rem] bg-gradient-to-br from-teal-500 to-cyan-500 shadow-[0_10px_0_0_rgba(20,184,166,0.5)] md:shadow-[0_15px_0_0_rgba(20,184,166,0.5)] border-2 border-teal-600 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-4">
              Ready to Take Control of Your Job Search?
            </h2>
            <p className="text-base sm:text-lg text-teal-100 font-medium mb-6 max-w-2xl mx-auto">
              Join thousands of PMs who've transformed their job search with AI-powered organization and research.
            </p>
            <TrackedButton
              href="/auth/sign-up"
              className="inline-block px-8 py-4 sm:px-12 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] bg-white shadow-[0_6px_0_0_rgba(0,0,0,0.2)] border-2 border-gray-200 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(0,0,0,0.2)] text-lg sm:text-xl font-black text-teal-600 transition-all duration-200"
              eventName="User Clicked Try For Free Button"
              buttonId="job-center-landing-mid-page-cta"
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
              From chaos to command center in minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 shadow-[0_6px_0_0_rgba(20,184,166,0.4)] border-2 border-teal-500 flex items-center justify-center mb-4 sm:mb-6">
                <span className="text-2xl sm:text-3xl font-black text-white">1</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Add Your Jobs</h3>
              <p className="text-sm sm:text-base text-gray-600 font-medium">
                Import jobs from URLs or add them manually. All your applications in one place, organized by status.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 shadow-[0_6px_0_0_rgba(147,51,234,0.4)] border-2 border-purple-500 flex items-center justify-center mb-4 sm:mb-6">
                <span className="text-2xl sm:text-3xl font-black text-white">2</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Research & Network</h3>
              <p className="text-sm sm:text-base text-gray-600 font-medium">
                Generate AI research on each company. Find verified PM contacts to reach out to for referrals.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-400 shadow-[0_6px_0_0_rgba(16,185,129,0.4)] border-2 border-emerald-500 flex items-center justify-center mb-4 sm:mb-6">
                <span className="text-2xl sm:text-3xl font-black text-white">3</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Ace Interviews</h3>
              <p className="text-sm sm:text-base text-gray-600 font-medium">
                Get AI-generated questions for each interview. Send personalized thank you notes that stand out.
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
              question="How does the contact discovery work?"
              answer="We use verified data sources to find PM contacts at companies you're targeting. You'll get their name, title, email address, and LinkedIn profile. These are real, verified contacts—not guessed data."
            />

            <FAQItem
              question="What are the 13 research vectors?"
              answer="Our AI researches companies across 13 dimensions: Mission, Values, Origin Story, Product, User Types, Competition, Risks, Recent Launches, Strategy, Funding, Partnerships, Customer Feedback, and Business Model. Each dimension includes cited sources so you can dive deeper."
            />

            <FAQItem
              question="How are interview questions generated?"
              answer="Our AI considers the company, role, interview type (Product Sense, Technical, etc.), and interviewer to generate relevant questions. Questions are designed to help you learn about the role while demonstrating your strategic thinking."
            />

            <FAQItem
              question="Can I import jobs from any website?"
              answer="Some platforms like LinkedIn prevent imports, but company career pages or other platforms typically work. Our AI extracts all the relevant information automatically—title, company, location, description, and requirements."
            />

            <FAQItem
              question="How do the thank you emails work?"
              answer="After your interview prep, you drop in answers to the questions you asked. After the interview, our AI uses those specific conversation points to generate a personalized, thoughtful thank you email that references what you actually discussed."
            />

            <FAQItem
              question="Is Job Center included in the free trial?"
              answer="Yes! You get full access to Job Center during your trial, including AI research, contact discovery, interview question generation, and thank you email creation. Cancel anytime if it's not right for you."
            />
          </div>
        </div>

        {/* Final CTA */}
        <div className="p-5 sm:p-8 md:p-12 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[3rem] bg-gradient-to-br from-slate-800 to-slate-900 shadow-[0_12px_0_0_rgba(15,23,42,0.5)] md:shadow-[0_20px_0_0_rgba(15,23,42,0.5)] border-2 border-slate-700 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 sm:mb-6">
            Stop Managing Your Job Search in Chaos
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 font-medium mb-6 sm:mb-8 max-w-3xl mx-auto px-2">
            Every hour you spend on spreadsheets and manual research is an hour you're not spending on landing offers. Let AI handle the busywork while you focus on what matters.
          </p>
          <TrackedButton
            href="/auth/sign-up"
            className="inline-block px-8 py-4 sm:px-10 sm:py-5 md:px-14 md:py-6 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 shadow-[0_6px_0_0_rgba(20,184,166,0.7)] sm:shadow-[0_8px_0_0_rgba(20,184,166,0.7)] md:shadow-[0_10px_0_0_rgba(20,184,166,0.7)] border-2 border-teal-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(20,184,166,0.7)] sm:hover:shadow-[0_4px_0_0_rgba(20,184,166,0.7)] md:hover:shadow-[0_6px_0_0_rgba(20,184,166,0.7)] text-base sm:text-lg md:text-xl font-black text-white transition-all duration-200 mb-4 sm:mb-6"
            eventName="User Clicked Try For Free Button"
            buttonId="job-center-landing-final-cta"
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

export default JobCenterLandingPage;

