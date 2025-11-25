import SalaryProgressionChart from "@/app/components/SalaryProgressionChart";
import { HomePageTracking } from "@/app/components/HomePageTracking";
import { TrackedLink } from "@/app/components/TrackedLink";
import { TrackedButton } from "@/app/components/TrackedButton";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100">
      <HomePageTracking />
      <div className="max-w-7xl mx-auto px-4 py-6 sm:p-8 md:p-12 lg:p-16">

        {/* Hero Section */}
        <div className="flex justify-center mb-12 md:mb-20 relative">
          {/* Floating decorative elements - hidden on mobile for cleaner look */}
          <div className="hidden md:block absolute -top-8 -left-8 w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 opacity-20 blur-2xl animate-pulse"></div>
          <div className="hidden md:block absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 opacity-20 blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          
          <div className="w-full max-w-4xl relative z-10">
            <div className="p-5 sm:p-8 md:p-12 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[3rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_12px_0_0_rgba(147,51,234,0.3)] md:shadow-[0_20px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300 relative overflow-hidden">
              <div className="relative z-10">
                {/* Floating badges */}
                <div className="flex justify-center gap-4 mb-4 sm:mb-6 flex-wrap">
                  <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/80 backdrop-blur-sm border-2 border-purple-300 shadow-lg">
                    <span className="text-xs sm:text-sm font-bold text-purple-700">
                      ✨ AI-Powered
                    </span>
                  </div>
                </div>

                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent mb-4 sm:mb-6 leading-tight text-center">
                  Level Up Your Product Management Career
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-gray-700 font-semibold mb-6 sm:mb-8 text-center">
                  Stop feeling stuck. Start crushing it.
                </p>

                {/* Outcome highlights */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
                  <div className="text-center p-3 sm:p-4 rounded-[1rem] sm:rounded-[1.5rem] bg-white/60 backdrop-blur-sm border-2 border-purple-200">
                    <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">🎯</div>
                    <p className="text-xs sm:text-sm font-bold text-gray-700">Land Your Dream Job</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 rounded-[1rem] sm:rounded-[1.5rem] bg-white/60 backdrop-blur-sm border-2 border-pink-200">
                    <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">🚀</div>
                    <p className="text-xs sm:text-sm font-bold text-gray-700">Get Promoted Faster</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 rounded-[1rem] sm:rounded-[1.5rem] bg-white/60 backdrop-blur-sm border-2 border-purple-200">
                    <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">💡</div>
                    <p className="text-xs sm:text-sm font-bold text-gray-700">Build Impactful Products</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 rounded-[1rem] sm:rounded-[1.5rem] bg-white/60 backdrop-blur-sm border-2 border-pink-200">
                    <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">💰</div>
                    <p className="text-xs sm:text-sm font-bold text-gray-700">Increase Your Salary</p>
                  </div>
                </div>

                <TrackedButton
                  href="/auth/sign-up"
                  className="block w-full px-6 py-4 sm:px-10 sm:py-6 rounded-[1.5rem] sm:rounded-[2rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_8px_0_0_rgba(147,51,234,0.6)] sm:shadow-[0_10px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_4px_0_0_rgba(147,51,234,0.6)] sm:hover:shadow-[0_6px_0_0_rgba(147,51,234,0.6)] text-lg sm:text-xl font-black text-white transition-all duration-200 text-center mb-3 sm:mb-4"
                  eventName="User Clicked Sign Up Button"
                  buttonId="homepage-hero-primary-cta"
                  eventProperties={{
                    'Button Section': 'Hero Section',
                    'Button Position': 'Center of Hero Card',
                    'Button Type': 'Primary CTA',
                    'Button Text': 'Start now for free →',
                    'Button Context': 'Below headline and outcome highlights',
                    'Page Section': 'Above the fold',
                  }}
                >
                  Start now for free →
                </TrackedButton>
                <p className="text-center text-xs sm:text-sm text-gray-600 font-medium">
                  Join thousands of PMs who've already leveled up
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pain Points Section */}
        <div className="mb-12 md:mb-20">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-800 mb-3 md:mb-4">
              Sound Familiar?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 font-medium px-2">
              You're not alone. These are the struggles every PM faces.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 md:mb-12">
            <div className="p-5 sm:p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-br from-red-200 to-orange-200 shadow-[0_8px_0_0_rgba(239,68,68,0.3)] md:shadow-[0_10px_0_0_rgba(239,68,68,0.3)] border-2 border-red-300">
              <div className="flex items-start gap-3 sm:gap-4">
                <span className="text-3xl sm:text-4xl flex-shrink-0">😰</span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">
                    Stuck in Interview Hell
                  </h3>
                  <p className="text-sm sm:text-base text-gray-700 font-medium">
                    You've sent 50+ applications, done 10+ interviews, but keep getting rejected at the final round. Meanwhile, less experienced PMs are landing offers left and right.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-br from-red-200 to-orange-200 shadow-[0_8px_0_0_rgba(239,68,68,0.3)] md:shadow-[0_10px_0_0_rgba(239,68,68,0.3)] border-2 border-red-300">
              <div className="flex items-start gap-3 sm:gap-4">
                <span className="text-3xl sm:text-4xl flex-shrink-0">😤</span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">
                    Watching Others Get Promoted
                  </h3>
                  <p className="text-sm sm:text-base text-gray-700 font-medium">
                    You've been in the same role for 3 years while your peers leap ahead. You work harder, but they get the promotions. What are they doing that you're not?
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-br from-red-200 to-orange-200 shadow-[0_8px_0_0_rgba(239,68,68,0.3)] md:shadow-[0_10px_0_0_rgba(239,68,68,0.3)] border-2 border-red-300">
              <div className="flex items-start gap-3 sm:gap-4">
                <span className="text-3xl sm:text-4xl flex-shrink-0">🤯</span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">
                    Drowning in Chaos
                  </h3>
                  <p className="text-sm sm:text-base text-gray-700 font-medium">
                    Conflicting priorities, endless meetings, stakeholders who don't listen. You're reactive instead of strategic. You know you're capable of more but can't break through.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-br from-red-200 to-orange-200 shadow-[0_8px_0_0_rgba(239,68,68,0.3)] md:shadow-[0_10px_0_0_rgba(239,68,68,0.3)] border-2 border-red-300">
              <div className="flex items-start gap-3 sm:gap-4">
                <span className="text-3xl sm:text-4xl flex-shrink-0">😔</span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">
                    Imposter Syndrome is Crushing You
                  </h3>
                  <p className="text-sm sm:text-base text-gray-700 font-medium">
                    You second-guess every decision. You feel like you're faking it. You're terrified someone will realize you don't belong. The anxiety is exhausting.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 sm:space-y-8">
            <div className="p-5 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-slate-700 to-slate-900 shadow-[0_10px_0_0_rgba(15,23,42,0.4)] md:shadow-[0_15px_0_0_rgba(15,23,42,0.4)] border-2 border-slate-800 text-center">
              <p className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-3 md:mb-4">
                Here's What This Costs You:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
                <div>
                  <p className="text-3xl sm:text-4xl md:text-5xl font-black text-red-400 mb-1 sm:mb-2">$100K+</p>
                  <p className="text-sm sm:text-base text-white font-medium">Lost compensation from not getting promoted or switching jobs</p>
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl md:text-5xl font-black text-red-400 mb-1 sm:mb-2">3+ Years</p>
                  <p className="text-sm sm:text-base text-white font-medium">Average time PMs waste stuck at the same level</p>
                </div>
                <div>
                  <p className="text-5xl sm:text-6xl md:text-7xl font-black text-red-400 mb-1 sm:mb-2">∞</p>
                  <p className="text-sm sm:text-base text-white font-medium">Opportunity cost of missing your dream role</p>
                </div>
              </div>
            </div>
            
            <SalaryProgressionChart />
          </div>
        </div>

        {/* Transformation Section */}
        <div className="mb-12 md:mb-20">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-800 mb-3 md:mb-4">
              Imagine This Instead...
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 font-medium px-2">
              What if you could transform from stuck to unstoppable?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            <div className="p-5 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-green-200 to-emerald-200 shadow-[0_8px_0_0_rgba(22,163,74,0.3)] md:shadow-[0_12px_0_0_rgba(22,163,74,0.3)] border-2 border-green-300">
              <span className="text-4xl sm:text-5xl mb-4 sm:mb-6 block">✅</span>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-4">
                Crushing Every Interview
              </h3>
              <p className="text-sm sm:text-base text-gray-700 font-medium mb-3 sm:mb-4">
                Walk into any PM interview with complete confidence. You know exactly what they'll ask and exactly how to answer. You're not hoping to pass—you're choosing which offer to accept.
              </p>
            </div>

            <div className="p-5 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-green-200 to-emerald-200 shadow-[0_8px_0_0_rgba(22,163,74,0.3)] md:shadow-[0_12px_0_0_rgba(22,163,74,0.3)] border-2 border-green-300">
              <span className="text-4xl sm:text-5xl mb-4 sm:mb-6 block">✅</span>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-4">
                Getting Promoted on YOUR Timeline
              </h3>
              <p className="text-sm sm:text-base text-gray-700 font-medium mb-3 sm:mb-4">
                Stop waiting for someone to notice you. You have a clear roadmap to Senior PM, Principal PM, and beyond. You're building a promotion case so strong they can't say no.
              </p>
            </div>

            <div className="p-5 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-green-200 to-emerald-200 shadow-[0_8px_0_0_rgba(22,163,74,0.3)] md:shadow-[0_12px_0_0_rgba(22,163,74,0.3)] border-2 border-green-300">
              <span className="text-4xl sm:text-5xl mb-4 sm:mb-6 block">✅</span>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-4">
                Operating Like a Senior PM
              </h3>
              <p className="text-sm sm:text-base text-gray-700 font-medium mb-3 sm:mb-4">
                You're strategic, not reactive. Stakeholders respect you. Your roadmap is clear. Your team is aligned. You're shipping features that users actually love and execs actually notice.
              </p>
            </div>

            <div className="p-5 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-green-200 to-emerald-200 shadow-[0_8px_0_0_rgba(22,163,74,0.3)] md:shadow-[0_12px_0_0_rgba(22,163,74,0.3)] border-2 border-green-300">
              <span className="text-4xl sm:text-5xl mb-4 sm:mb-6 block">✅</span>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-4">
                Total Career Confidence
              </h3>
              <p className="text-sm sm:text-base text-gray-700 font-medium mb-3 sm:mb-4">
                No more imposter syndrome. You KNOW you're a great PM because you have the frameworks, the results, and the recognition. You belong here, and everyone knows it.
              </p>
            </div>
          </div>
        </div>

        {/* What You Get Section */}
        <div id="features" className="mb-12 md:mb-20">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-800 mb-3 md:mb-4 px-2">
              Your AI-Powered Career Operating System
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 font-medium px-2">
              Not static content. Real tools that do the work for you.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            <div className="p-5 sm:p-6 md:p-8 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-indigo-200 to-purple-200 shadow-[0_8px_0_0_rgba(99,102,241,0.3)] md:shadow-[0_12px_0_0_rgba(99,102,241,0.3)] border-2 border-indigo-300">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[1rem] sm:rounded-[1.5rem] bg-gradient-to-br from-indigo-400 to-purple-400 shadow-[0_4px_0_0_rgba(99,102,241,0.4)] sm:shadow-[0_6px_0_0_rgba(99,102,241,0.4)] border-2 border-indigo-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl sm:text-3xl">📚</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">PM Courses</h3>
                  <p className="text-sm sm:text-base text-gray-700 font-medium mb-2 sm:mb-3">
                    Structured learning paths with 120+ video lessons across 7 comprehensive courses. Master product management skills from resume building to portfolio creation.
                  </p>
                  <ul className="space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700 font-medium mb-3 sm:mb-4">
                    <li className="flex items-start sm:items-center gap-2">
                      <span className="text-indigo-600 font-black flex-shrink-0">✓</span>
                      <span>7 courses organized by category (Interview Mastery, Career Advancement, PM Fundamentals)</span>
                    </li>
                    <li className="flex items-start sm:items-center gap-2">
                      <span className="text-indigo-600 font-black flex-shrink-0">✓</span>
                      <span>Embedded Loom video lessons with progress tracking</span>
                    </li>
                    <li className="flex items-start sm:items-center gap-2">
                      <span className="text-indigo-600 font-black flex-shrink-0">✓</span>
                      <span>Course navigation with lesson-by-lesson progression</span>
                    </li>
                  </ul>
                  <TrackedLink
                    href="/courses"
                    className="inline-block px-5 py-2.5 sm:px-6 sm:py-3 rounded-[1rem] sm:rounded-[1.5rem] bg-white/80 hover:bg-white border-2 border-indigo-300 font-black text-sm sm:text-base text-indigo-700 transition-all duration-200"
                    eventName="User Clicked Courses Link"
                    linkId="homepage-features-pm-courses-link"
                    eventProperties={{
                      'Link Section': 'Features Section',
                      'Link Position': 'PM Courses Feature Card',
                      'Link Type': 'Feature Card CTA',
                      'Link Text': 'Browse Courses →',
                      'Feature Card': 'PM Courses',
                      'Card Color': 'Indigo to Purple Gradient',
                      'Card Position': 'First Feature Card',
                    }}
                  >
                    Browse Courses →
                  </TrackedLink>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 md:p-8 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-pink-200 to-rose-200 shadow-[0_8px_0_0_rgba(236,72,153,0.3)] md:shadow-[0_12px_0_0_rgba(236,72,153,0.3)] border-2 border-pink-300">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[1rem] sm:rounded-[1.5rem] bg-gradient-to-br from-pink-400 to-rose-400 shadow-[0_4px_0_0_rgba(236,72,153,0.4)] sm:shadow-[0_6px_0_0_rgba(236,72,153,0.4)] border-2 border-pink-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl sm:text-3xl">⚡</span>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">PM Templates & Resources</h3>
                  <p className="text-sm sm:text-base text-gray-700 font-medium mb-2 sm:mb-3">
                    Access 50+ essential PM templates and resources. PRDs, roadmaps, OKRs, and frameworks that help you ship faster and think more strategically.
                  </p>
                  <ul className="space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700 font-medium">
                    <li className="flex items-start sm:items-center gap-2">
                      <span className="text-pink-600 font-black flex-shrink-0">✓</span>
                      <span>50+ templates across 4 categories</span>
                    </li>
                    <li className="flex items-start sm:items-center gap-2">
                      <span className="text-pink-600 font-black flex-shrink-0">✓</span>
                      <span>Smart templates that adapt to your product context</span>
                    </li>
                    <li className="flex items-start sm:items-center gap-2">
                      <span className="text-pink-600 font-black flex-shrink-0">✓</span>
                      <span>Prioritization frameworks (RICE, value vs effort, ICE)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 md:p-8 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-teal-200 to-cyan-200 shadow-[0_8px_0_0_rgba(20,184,166,0.3)] md:shadow-[0_12px_0_0_rgba(20,184,166,0.3)] border-2 border-teal-300">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[1rem] sm:rounded-[1.5rem] bg-gradient-to-br from-teal-400 to-cyan-400 shadow-[0_4px_0_0_rgba(20,184,166,0.4)] sm:shadow-[0_6px_0_0_rgba(20,184,166,0.4)] border-2 border-teal-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl sm:text-3xl">💼</span>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">Job Center</h3>
                  <p className="text-sm sm:text-base text-gray-700 font-medium mb-2 sm:mb-3">
                    Track applications, research companies, and manage your entire job search in one place. Kanban boards, interview scheduling, and automated company research.
                  </p>
                  <ul className="space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700 font-medium">
                    <li className="flex items-start sm:items-center gap-2">
                      <span className="text-teal-600 font-black flex-shrink-0">✓</span>
                      <span>Track applications with Kanban board and list views</span>
                    </li>
                    <li className="flex items-start sm:items-center gap-2">
                      <span className="text-teal-600 font-black flex-shrink-0">✓</span>
                      <span>Schedule interviews and manage contacts at companies</span>
                    </li>
                    <li className="flex items-start sm:items-center gap-2">
                      <span className="text-teal-600 font-black flex-shrink-0">✓</span>
                      <span>Automated company research with AI-powered insights</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 md:p-8 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-blue-200 to-cyan-200 shadow-[0_8px_0_0_rgba(37,99,235,0.3)] md:shadow-[0_12px_0_0_rgba(37,99,235,0.3)] border-2 border-blue-300">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[1rem] sm:rounded-[1.5rem] bg-gradient-to-br from-blue-400 to-cyan-400 shadow-[0_4px_0_0_rgba(37,99,235,0.4)] sm:shadow-[0_6px_0_0_rgba(37,99,235,0.4)] border-2 border-blue-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl sm:text-3xl">📄</span>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">Resume Editor</h3>
                  <p className="text-sm sm:text-base text-gray-700 font-medium mb-2 sm:mb-3">
                    Build, optimize, and analyze your resume with AI-powered insights. Create multiple versions, customize for specific jobs, and export to PDF.
                  </p>
                  <ul className="space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700 font-medium">
                    <li className="flex items-start sm:items-center gap-2">
                      <span className="text-blue-600 font-black flex-shrink-0">✓</span>
                      <span>Multiple resume versions with full editing capabilities</span>
                    </li>
                    <li className="flex items-start sm:items-center gap-2">
                      <span className="text-blue-600 font-black flex-shrink-0">✓</span>
                      <span>AI-powered bullet optimization and resume analysis</span>
                    </li>
                    <li className="flex items-start sm:items-center gap-2">
                      <span className="text-blue-600 font-black flex-shrink-0">✓</span>
                      <span>Customizable styles and PDF export functionality</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 md:p-8 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-green-200 to-emerald-200 shadow-[0_8px_0_0_rgba(22,163,74,0.3)] md:shadow-[0_12px_0_0_rgba(22,163,74,0.3)] border-2 border-green-300">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[1rem] sm:rounded-[1.5rem] bg-gradient-to-br from-green-400 to-emerald-400 shadow-[0_4px_0_0_rgba(22,163,74,0.4)] sm:shadow-[0_6px_0_0_rgba(22,163,74,0.4)] border-2 border-green-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl sm:text-3xl">🎨</span>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">Portfolio Hub</h3>
                  <p className="text-sm sm:text-base text-gray-700 font-medium mb-2 sm:mb-3">
                    Build standout product portfolio case studies. Learn the framework, generate AI-powered case study ideas, and showcase your PM skills.
                  </p>
                  <ul className="space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700 font-medium">
                    <li className="flex items-start sm:items-center gap-2">
                      <span className="text-green-600 font-black flex-shrink-0">✓</span>
                      <span>Complete course on building product portfolios</span>
                    </li>
                    <li className="flex items-start sm:items-center gap-2">
                      <span className="text-green-600 font-black flex-shrink-0">✓</span>
                      <span>AI case study idea generator with specific problems and hypotheses</span>
                    </li>
                    <li className="flex items-start sm:items-center gap-2">
                      <span className="text-green-600 font-black flex-shrink-0">✓</span>
                      <span>Discover, Define, Develop, and Deliver framework</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div id="testimonials" className="mb-12 md:mb-20">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-800 mb-3 md:mb-4">
              Don't Take Our Word For It
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 font-medium">
              Real PMs. Real results. Real fast.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="p-5 sm:p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] md:shadow-[0_10px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
              <div className="flex gap-1 mb-3 sm:mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg sm:text-xl">★</span>
                ))}
              </div>
              <p className="text-sm sm:text-base text-gray-700 font-medium mb-3 sm:mb-4 italic">
                "Super helpful along the way. Finding a product role is hard in this market but product careerlyst made it super easy to keep track and helped me find an in that eventually got me my offer. highly recommend the videos included too which were great for case study prepping."
              </p>
              <p className="font-bold text-gray-800 text-sm sm:text-base">— Shreenath Bhanderi</p>
              <p className="text-xs sm:text-sm text-gray-600">January 19, 2025</p>
            </div>

            <div className="p-5 sm:p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] md:shadow-[0_10px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
              <div className="flex gap-1 mb-3 sm:mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg sm:text-xl">★</span>
                ))}
              </div>
              <p className="text-sm sm:text-base text-gray-700 font-medium mb-3 sm:mb-4 italic">
                "Product Careerlyst has been an absolute game-changer in my product management journey. As someone transitioning into product management, I was looking for a comprehensive resource that went beyond theoretical concepts, and this platform delivered exactly that. What sets Product Careerlyst apart is Anthony's thoughtful approach to product education. You can tell it's built by a seasoned PM who understands exactly what aspiring product managers need."
              </p>
              <p className="font-bold text-gray-800 text-sm sm:text-base">— Sharad</p>
              <p className="text-xs sm:text-sm text-gray-600">January 22, 2025</p>
            </div>

            <div className="p-5 sm:p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] md:shadow-[0_10px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
              <div className="flex gap-1 mb-3 sm:mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg sm:text-xl">★</span>
                ))}
              </div>
              <p className="text-sm sm:text-base text-gray-700 font-medium mb-3 sm:mb-4 italic">
                "Product Careerlyst is a game-changer. If you're really looking for something that'll boost your chance to find your next product gig, this is it. The dashboard is super user-friendly and streamlines your job search, and the resources are well-organized. Some of the content are stuff that you see on a daily basis in product/tech companies, so it really gave me an edge during interviews. I found a job in Product Ops thanks to PC - so definitely recommend if you're on the fence!"
              </p>
              <p className="font-bold text-gray-800 text-sm sm:text-base">— Peter</p>
              <p className="text-xs sm:text-sm text-gray-600">January 29, 2025</p>
            </div>

            <div className="p-5 sm:p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] md:shadow-[0_10px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
              <div className="flex gap-1 mb-3 sm:mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg sm:text-xl">★</span>
                ))}
              </div>
              <p className="text-sm sm:text-base text-gray-700 font-medium mb-3 sm:mb-4 italic">
                "I'm currently taking Anthony's course and really enjoying it! The material is engaging, and I've learned a lot about how to search for jobs effectively. Anthony explains the content in a clear and easy-to-understand way. I'm looking forward to revisiting the videos as I continue my job search. I recommend this course to anyone looking to improve their job-hunting skills!"
              </p>
              <p className="font-bold text-gray-800 text-sm sm:text-base">— Solomon S.</p>
              <p className="text-xs sm:text-sm text-gray-600">February 20, 2025</p>
            </div>

            <div className="p-5 sm:p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] md:shadow-[0_10px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
              <div className="flex gap-1 mb-3 sm:mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg sm:text-xl">★</span>
                ))}
              </div>
              <p className="text-sm sm:text-base text-gray-700 font-medium mb-3 sm:mb-4 italic">
                "Finally an AI enabled tool for Product Managers to find a job in this tough market. I started with the base plan and expanded out to to premium model. The features related to resume optimization and portfolio creation have been very useful. When I first transitioned to PM it was very hard to find information that encompasses all the hats a PM wears. The resources from this tool has helped me become a better product manager and have greatly helped me as I got through interview processes."
              </p>
              <p className="font-bold text-gray-800 text-sm sm:text-base">— Ken Patel</p>
              <p className="text-xs sm:text-sm text-gray-600">February 21, 2025</p>
            </div>

            <div className="p-5 sm:p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] md:shadow-[0_10px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
              <div className="flex gap-1 mb-3 sm:mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg sm:text-xl">★</span>
                ))}
              </div>
              <p className="text-sm sm:text-base text-gray-700 font-medium mb-3 sm:mb-4 italic">
                "Anthony is a product wizard. Whenever I have questions about my career I go to his content. I've spent so much time searching for resources to help - YouTube, blogs, etc - nothing compares to Anthony's expertise. Thank you Anthony, my career wouldn't be same without you!"
              </p>
              <p className="font-bold text-gray-800 text-sm sm:text-base">— Alex</p>
              <p className="text-xs sm:text-sm text-gray-600">January 22, 2025</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-12 md:mb-20">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-800 mb-3 md:mb-4">
              Your Questions, Answered
            </h2>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="p-4 sm:p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-white shadow-[0_6px_0_0_rgba(0,0,0,0.1)] md:shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-1.5 sm:mb-2">
                "Will this work for me if I'm just starting out as a PM?"
              </h3>
              <p className="text-sm sm:text-base text-gray-700 font-medium">
                Absolutely. We have dedicated tracks for Associate PMs, PMs making their first switch, and experienced PMs. The frameworks work at every level—we just adjust the application.
              </p>
            </div>

            <div className="p-4 sm:p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-white shadow-[0_6px_0_0_rgba(0,0,0,0.1)] md:shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-1.5 sm:mb-2">
                "I don't have time for another course."
              </h3>
              <p className="text-sm sm:text-base text-gray-700 font-medium">
                Good, because this isn't a course. It's a resource library you use when you need it. Prepping for an interview? Grab the frameworks. Need to write a PRD? Use the template. 15 minutes when you need it beats 40 hours you don't have.
              </p>
            </div>

            <div className="p-4 sm:p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-white shadow-[0_6px_0_0_rgba(0,0,0,0.1)] md:shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-1.5 sm:mb-2">
                "How is this different from free content online?"
              </h3>
              <p className="text-sm sm:text-base text-gray-700 font-medium">
                Free content is scattered, generic, and overwhelming. We've distilled everything into battle-tested frameworks that actually work. Plus you get powerful AI-enabled tools trained by PMs who get it. That's worth way more than free blog posts.
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="p-5 sm:p-8 md:p-12 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[3rem] bg-gradient-to-br from-slate-800 to-slate-900 shadow-[0_12px_0_0_rgba(15,23,42,0.5)] md:shadow-[0_20px_0_0_rgba(15,23,42,0.5)] border-2 border-slate-700 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 sm:mb-6">
            Your Career Won't Fix Itself
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 font-medium mb-6 sm:mb-8 max-w-3xl mx-auto px-2">
            Every day you wait is another day stuck in the same role, getting passed over, watching others succeed. You have two choices: keep struggling alone, or get the system that actually works.
          </p>
          <TrackedButton
            href="/auth/sign-up"
            className="inline-block px-6 py-5 sm:px-10 sm:py-6 md:px-16 md:py-8 rounded-[1.5rem] sm:rounded-[2rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_8px_0_0_rgba(147,51,234,0.7)] sm:shadow-[0_10px_0_0_rgba(147,51,234,0.7)] md:shadow-[0_12px_0_0_rgba(147,51,234,0.7)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_4px_0_0_rgba(147,51,234,0.7)] sm:hover:shadow-[0_6px_0_0_rgba(147,51,234,0.7)] md:hover:shadow-[0_8px_0_0_rgba(147,51,234,0.7)] text-lg sm:text-xl md:text-2xl font-black text-white transition-all duration-200 mb-4 sm:mb-6"
            eventName="User Clicked Sign Up Button"
            buttonId="homepage-final-cta-large-button"
            eventProperties={{
              'Button Section': 'Final CTA Section',
              'Button Position': 'Center of Final CTA Card',
              'Button Type': 'Final CTA',
              'Button Text': 'YES, I\'M READY TO LEVEL UP →',
              'Button Context': 'After all content sections, before footer',
              'Page Section': 'Below the fold',
              'CTA Theme': 'Dark slate background with purple gradient button',
            }}
          >
            YES, I'M READY TO LEVEL UP →
          </TrackedButton>
          <p className="text-sm sm:text-base text-gray-400 font-medium px-2">
            Join thousands of PMs who've already made the decision to stop settling
          </p>
        </div>
      </div>
    </div>
  );
}
