export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100">
      <div className="max-w-7xl mx-auto p-8 md:p-12 lg:p-16">
        {/* Header */}
        <div className="mb-16">
          <div className="inline-block px-8 py-4 rounded-[2rem] bg-gradient-to-br from-pink-200 to-purple-200 shadow-[0_8px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Product Careerlyst
            </h1>
          </div>
        </div>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
          <div className="p-12 rounded-[3rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_20px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300">
            <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold mb-6">
              🔥 LIMITED BETA ACCESS
            </div>
            <h2 className="text-5xl md:text-7xl font-bold bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent mb-6 leading-tight">
              Level Up
              <br />
              Your PM
              <br />
              Career
            </h2>
            <p className="text-xl text-gray-700 font-semibold mb-8">
              Stop feeling stuck. Start crushing it.
            </p>
            <button className="w-full px-10 py-6 rounded-[2rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_10px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_6px_0_0_rgba(147,51,234,0.6)] text-xl font-black text-white transition-all duration-200">
              GET INSTANT ACCESS →
            </button>
            <p className="text-center text-sm text-gray-600 mt-4 font-medium">
              Join 12,847 PMs who've already leveled up
            </p>
          </div>

          <div className="p-10 rounded-[3rem] bg-gradient-to-br from-orange-200 to-yellow-200 shadow-[0_20px_0_0_rgba(234,88,12,0.3)] border-2 border-orange-300 flex items-center">
            <div className="space-y-6">
              <p className="text-xl text-gray-800 leading-relaxed font-bold">
                The harsh truth: Being "good enough" doesn't cut it anymore.
              </p>
              <p className="text-lg text-gray-800 leading-relaxed font-medium">
                While you're stuck in the same role, other PMs are landing $200K+ offers, getting promoted every 18 months, and building products that actually matter.
              </p>
              <p className="text-lg text-gray-800 leading-relaxed font-medium">
                The difference? They have a system. You're about to get one too.
              </p>
            </div>
          </div>
        </div>

        {/* Pain Points Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-gray-800 mb-4">
              Sound Familiar?
            </h2>
            <p className="text-xl text-gray-700 font-medium">
              You're not alone. These are the struggles every PM faces.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="p-8 rounded-[2rem] bg-gradient-to-br from-red-200 to-orange-200 shadow-[0_10px_0_0_rgba(239,68,68,0.3)] border-2 border-red-300">
              <div className="flex items-start gap-4">
                <span className="text-4xl">😰</span>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Stuck in Interview Hell
                  </h3>
                  <p className="text-gray-700 font-medium">
                    You've sent 50+ applications, done 10+ interviews, but keep getting rejected at the final round. Meanwhile, less experienced PMs are landing offers left and right.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-[2rem] bg-gradient-to-br from-red-200 to-orange-200 shadow-[0_10px_0_0_rgba(239,68,68,0.3)] border-2 border-red-300">
              <div className="flex items-start gap-4">
                <span className="text-4xl">😤</span>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Watching Others Get Promoted
                  </h3>
                  <p className="text-gray-700 font-medium">
                    You've been in the same role for 3 years while your peers leap ahead. You work harder, but they get the promotions. What are they doing that you're not?
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-[2rem] bg-gradient-to-br from-red-200 to-orange-200 shadow-[0_10px_0_0_rgba(239,68,68,0.3)] border-2 border-red-300">
              <div className="flex items-start gap-4">
                <span className="text-4xl">🤯</span>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Drowning in Chaos
                  </h3>
                  <p className="text-gray-700 font-medium">
                    Conflicting priorities, endless meetings, stakeholders who don't listen. You're reactive instead of strategic. You know you're capable of more but can't break through.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-[2rem] bg-gradient-to-br from-red-200 to-orange-200 shadow-[0_10px_0_0_rgba(239,68,68,0.3)] border-2 border-red-300">
              <div className="flex items-start gap-4">
                <span className="text-4xl">😔</span>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Imposter Syndrome is Crushing You
                  </h3>
                  <p className="text-gray-700 font-medium">
                    You second-guess every decision. You feel like you're faking it. You're terrified someone will realize you don't belong. The anxiety is exhausting.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-slate-700 to-slate-900 shadow-[0_15px_0_0_rgba(15,23,42,0.4)] border-2 border-slate-800 text-center">
            <p className="text-2xl md:text-3xl font-black text-white mb-4">
              Here's What This Costs You:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div>
                <p className="text-5xl font-black text-red-400 mb-2">$100K+</p>
                <p className="text-white font-medium">Lost compensation from not getting promoted or switching jobs</p>
              </div>
              <div>
                <p className="text-5xl font-black text-red-400 mb-2">3+ Years</p>
                <p className="text-white font-medium">Average time PMs waste stuck at the same level</p>
              </div>
              <div>
                <p className="text-5xl font-black text-red-400 mb-2">∞</p>
                <p className="text-white font-medium">Opportunity cost of missing your dream role</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transformation Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-gray-800 mb-4">
              Imagine This Instead...
            </h2>
            <p className="text-xl text-gray-700 font-medium">
              What if you could transform from stuck to unstoppable?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-green-200 to-emerald-200 shadow-[0_12px_0_0_rgba(22,163,74,0.3)] border-2 border-green-300">
              <span className="text-5xl mb-6 block">✅</span>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Crushing Every Interview
              </h3>
              <p className="text-gray-700 font-medium mb-4">
                Walk into any PM interview with complete confidence. You know exactly what they'll ask and exactly how to answer. You're not hoping to pass—you're choosing which offer to accept.
              </p>
              <p className="text-green-700 font-bold italic">
                "I went from 0 offers to 4 offers in 6 weeks. Including one at Google." - Sarah M.
              </p>
            </div>

            <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-green-200 to-emerald-200 shadow-[0_12px_0_0_rgba(22,163,74,0.3)] border-2 border-green-300">
              <span className="text-5xl mb-6 block">✅</span>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Getting Promoted on YOUR Timeline
              </h3>
              <p className="text-gray-700 font-medium mb-4">
                Stop waiting for someone to notice you. You have a clear roadmap to Senior PM, Principal PM, and beyond. You're building a promotion case so strong they can't say no.
              </p>
              <p className="text-green-700 font-bold italic">
                "Promoted to Senior PM in 14 months. My manager said my growth was 'unprecedented.'" - James K.
              </p>
            </div>

            <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-green-200 to-emerald-200 shadow-[0_12px_0_0_rgba(22,163,74,0.3)] border-2 border-green-300">
              <span className="text-5xl mb-6 block">✅</span>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Operating Like a Senior PM
              </h3>
              <p className="text-gray-700 font-medium mb-4">
                You're strategic, not reactive. Stakeholders respect you. Your roadmap is clear. Your team is aligned. You're shipping features that users actually love and execs actually notice.
              </p>
              <p className="text-green-700 font-bold italic">
                "Went from firefighting to strategic planning. My CEO now asks for MY input." - Michelle R.
              </p>
            </div>

            <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-green-200 to-emerald-200 shadow-[0_12px_0_0_rgba(22,163,74,0.3)] border-2 border-green-300">
              <span className="text-5xl mb-6 block">✅</span>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Total Career Confidence
              </h3>
              <p className="text-gray-700 font-medium mb-4">
                No more imposter syndrome. You KNOW you're a great PM because you have the frameworks, the results, and the recognition. You belong here, and everyone knows it.
              </p>
              <p className="text-green-700 font-bold italic">
                "I finally feel like I know what I'm doing. The confidence is everything." - David L.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mb-20">
          <div className="p-12 rounded-[3rem] bg-gradient-to-br from-indigo-200 to-purple-200 shadow-[0_20px_0_0_rgba(99,102,241,0.3)] border-2 border-indigo-300">
            <h2 className="text-4xl md:text-5xl font-black text-gray-800 mb-8 text-center">
              The Product Careerlyst Difference
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <p className="text-6xl font-black text-indigo-600 mb-2">94%</p>
                <p className="text-lg font-bold text-gray-800">Get an offer within 90 days</p>
              </div>
              <div className="text-center">
                <p className="text-6xl font-black text-indigo-600 mb-2">$68K</p>
                <p className="text-lg font-bold text-gray-800">Average salary increase</p>
              </div>
              <div className="text-center">
                <p className="text-6xl font-black text-indigo-600 mb-2">18mo</p>
                <p className="text-lg font-bold text-gray-800">Average time to promotion</p>
              </div>
              <div className="text-center">
                <p className="text-6xl font-black text-indigo-600 mb-2">12.8K</p>
                <p className="text-lg font-bold text-gray-800">PMs transformed</p>
              </div>
            </div>
          </div>
        </div>

        {/* What You Get Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-gray-800 mb-4">
              Your AI-Powered Career Operating System
            </h2>
            <p className="text-xl text-gray-700 font-medium">
              Not static content. Real tools that do the work for you.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-200 to-cyan-200 shadow-[0_12px_0_0_rgba(37,99,235,0.3)] border-2 border-blue-300">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-blue-400 to-cyan-400 shadow-[0_6px_0_0_rgba(37,99,235,0.4)] border-2 border-blue-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl">🤖</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">AI Interview Coach</h3>
                  <p className="text-gray-700 font-medium mb-3">
                    Practice with an AI that interviews you like Google, Meta, and Amazon actually do. Get instant feedback on your answers, not generic advice.
                  </p>
                  <ul className="space-y-2 text-gray-700 font-medium">
                    <li className="flex items-center gap-2">
                      <span className="text-blue-600 font-black">✓</span>
                      Real-time mock interviews for product design, metrics, and strategy
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-blue-600 font-black">✓</span>
                      Performance tracking across 8 competency areas
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-blue-600 font-black">✓</span>
                      Personalized weak spot drills based on your interview data
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_12px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-purple-400 to-pink-400 shadow-[0_6px_0_0_rgba(147,51,234,0.4)] border-2 border-purple-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl">📊</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">Career Progression Tracker</h3>
                  <p className="text-gray-700 font-medium mb-3">
                    See exactly what skills you're missing for Senior PM, Principal PM, or Director level—and get a personalized roadmap to close every gap.
                  </p>
                  <ul className="space-y-2 text-gray-700 font-medium">
                    <li className="flex items-center gap-2">
                      <span className="text-purple-600 font-black">✓</span>
                      Skills gap analysis comparing you vs target level
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-purple-600 font-black">✓</span>
                      Promotion readiness score with specific action items
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-purple-600 font-black">✓</span>
                      Milestone tracking for strategic projects and visibility
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-green-200 to-emerald-200 shadow-[0_12px_0_0_rgba(22,163,74,0.3)] border-2 border-green-300">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-green-400 to-emerald-400 shadow-[0_6px_0_0_rgba(22,163,74,0.4)] border-2 border-green-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl">🏆</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">Impact Portfolio Builder</h3>
                  <p className="text-gray-700 font-medium mb-3">
                    Auto-document your wins, metrics, and launches. When promotion time comes, your case is already built—complete with data that proves impact.
                  </p>
                  <ul className="space-y-2 text-gray-700 font-medium">
                    <li className="flex items-center gap-2">
                      <span className="text-green-600 font-black">✓</span>
                      Achievement logging with before/after metrics
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600 font-black">✓</span>
                      One-click promotion packet generator
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600 font-black">✓</span>
                      Calendar integration to capture wins as they happen
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-orange-200 to-yellow-200 shadow-[0_12px_0_0_rgba(234,88,12,0.3)] border-2 border-orange-300">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-orange-400 to-yellow-400 shadow-[0_6px_0_0_rgba(234,88,12,0.4)] border-2 border-orange-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl">💰</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">Compensation Intelligence Engine</h3>
                  <p className="text-gray-700 font-medium mb-3">
                    Real compensation data from 10,000+ PM offers. Know your worth, practice your negotiation, and get the offer you actually deserve.
                  </p>
                  <ul className="space-y-2 text-gray-700 font-medium">
                    <li className="flex items-center gap-2">
                      <span className="text-orange-600 font-black">✓</span>
                      Salary benchmarking by level, company, and location
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-orange-600 font-black">✓</span>
                      AI negotiation simulator with counter-offer scripts
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-orange-600 font-black">✓</span>
                      Total comp calculator (equity, bonus, sign-on breakdown)
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-200 to-purple-200 shadow-[0_12px_0_0_rgba(99,102,241,0.3)] border-2 border-indigo-300">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-indigo-400 to-purple-400 shadow-[0_6px_0_0_rgba(99,102,241,0.4)] border-2 border-indigo-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl">⚡</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">AI PM Assistant</h3>
                  <p className="text-gray-700 font-medium mb-3">
                    PRDs, roadmaps, OKRs, stakeholder updates—generate first drafts in seconds. Frameworks that actually help you ship faster and think more strategically.
                  </p>
                  <ul className="space-y-2 text-gray-700 font-medium">
                    <li className="flex items-center gap-2">
                      <span className="text-indigo-600 font-black">✓</span>
                      Smart templates that adapt to your product context
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-indigo-600 font-black">✓</span>
                      Metrics framework generator for any feature launch
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-indigo-600 font-black">✓</span>
                      Prioritization assistant (RICE, value vs effort, ICE)
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-gray-800 mb-4">
              Don't Take Our Word For It
            </h2>
            <p className="text-xl text-gray-700 font-medium">
              Real PMs. Real results. Real fast.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-[2rem] bg-white shadow-[0_10px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xl">★</span>
                ))}
              </div>
              <p className="text-gray-700 font-medium mb-4 italic">
                "I was stuck at the same level for 4 years. Within 3 months of joining, I had the frameworks to finally break through. Got promoted to Senior PM with a $55K raise. This literally changed my life."
              </p>
              <p className="font-bold text-gray-800">— Alex Chen</p>
              <p className="text-sm text-gray-600">Senior PM at Stripe</p>
            </div>

            <div className="p-8 rounded-[2rem] bg-white shadow-[0_10px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xl">★</span>
                ))}
              </div>
              <p className="text-gray-700 font-medium mb-4 italic">
                "After 47 rejections, I was ready to give up on PM. The interview prep here is INSANE. I went from zero offers to 4 offers in 6 weeks. Accepted a role at Google. Worth every penny and more."
              </p>
              <p className="font-bold text-gray-800">— Priya Sharma</p>
              <p className="text-sm text-gray-600">PM at Google</p>
            </div>

            <div className="p-8 rounded-[2rem] bg-white shadow-[0_10px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xl">★</span>
                ))}
              </div>
              <p className="text-gray-700 font-medium mb-4 italic">
                "Best investment in my career, period. The frameworks alone saved me 10+ hours a week. The community is incredible. I'm shipping better products and my team actually respects me now. Game changer."
              </p>
              <p className="font-bold text-gray-800">— Marcus Johnson</p>
              <p className="text-sm text-gray-600">PM at Airbnb</p>
            </div>
          </div>
        </div>

        {/* Pricing / CTA */}
        <div className="mb-20">
          <div className="p-12 rounded-[3rem] bg-gradient-to-br from-violet-200 to-purple-200 shadow-[0_20px_0_0_rgba(124,58,237,0.4)] border-2 border-violet-300 text-center">
            <div className="inline-block px-6 py-3 rounded-full bg-red-500 text-white text-sm font-black mb-6 animate-pulse">
              ⚠️ BETA PRICING ENDS IN 48 HOURS
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-800 mb-4">
              Get Lifetime Access Today
            </h2>
            <p className="text-xl text-gray-700 font-medium mb-8">
              Invest in yourself once. Reap the benefits forever.
            </p>

            <div className="max-w-md mx-auto mb-8">
              <div className="p-8 rounded-[2rem] bg-white shadow-[0_15px_0_0_rgba(124,58,237,0.3)] border-2 border-purple-400">
                <div className="text-center mb-6">
                  <p className="text-gray-600 font-medium line-through text-2xl mb-2">$997</p>
                  <p className="text-6xl font-black text-purple-600 mb-2">$297</p>
                  <p className="text-lg font-bold text-gray-700">One-time payment. Lifetime access.</p>
                </div>
                <div className="space-y-3 text-left mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 font-black text-xl">✓</span>
                    <span className="font-medium text-gray-700">All frameworks, templates, and guides</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 font-black text-xl">✓</span>
                    <span className="font-medium text-gray-700">Live coaching and community access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 font-black text-xl">✓</span>
                    <span className="font-medium text-gray-700">Future updates and new content FREE</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 font-black text-xl">✓</span>
                    <span className="font-medium text-gray-700">30-day money-back guarantee</span>
                  </div>
                </div>
                <button className="w-full px-10 py-6 rounded-[2rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_10px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_6px_0_0_rgba(147,51,234,0.6)] text-2xl font-black text-white transition-all duration-200">
                  CLAIM YOUR SPOT NOW →
                </button>
                <p className="text-sm text-gray-600 mt-4 font-medium">
                  🔒 Secure checkout • 247 spots left at this price
                </p>
              </div>
            </div>

            <div className="max-w-2xl mx-auto p-6 rounded-[2rem] bg-gradient-to-br from-green-200 to-emerald-200 border-2 border-green-300">
              <p className="text-lg font-bold text-gray-800 mb-2">
                💰 Think of it this way:
              </p>
              <p className="text-gray-700 font-medium">
                One salary negotiation win pays for this 10x over. One promotion pays for it 100x over. One avoided year of being stuck? Priceless. This is the best $297 you'll ever spend on your career.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-gray-800 mb-4">
              Your Questions, Answered
            </h2>
          </div>

          <div className="space-y-4">
            <div className="p-6 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                "Will this work for me if I'm just starting out as a PM?"
              </h3>
              <p className="text-gray-700 font-medium">
                Absolutely. We have dedicated tracks for Associate PMs, PMs making their first switch, and experienced PMs. The frameworks work at every level—we just adjust the application.
              </p>
            </div>

            <div className="p-6 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                "I don't have time for another course."
              </h3>
              <p className="text-gray-700 font-medium">
                Good, because this isn't a course. It's a resource library you use when you need it. Prepping for an interview? Grab the frameworks. Need to write a PRD? Use the template. 15 minutes when you need it beats 40 hours you don't have.
              </p>
            </div>

            <div className="p-6 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                "What if it doesn't work for me?"
              </h3>
              <p className="text-gray-700 font-medium">
                30-day money-back guarantee, no questions asked. If you put in the work and don't see results, we'll refund every penny. You literally can't lose.
              </p>
            </div>

            <div className="p-6 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                "How is this different from free content online?"
              </h3>
              <p className="text-gray-700 font-medium">
                Free content is scattered, generic, and overwhelming. We've distilled everything into battle-tested frameworks that actually work. Plus you get personalized coaching and a community of PMs who get it. That's worth way more than free blog posts.
              </p>
            </div>

            <div className="p-6 rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                "When does the beta pricing end?"
              </h3>
              <p className="text-gray-700 font-medium">
                In 48 hours or when we hit 250 members, whichever comes first. After that, price goes to $997. We're at 247 now. Don't miss this.
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="p-12 rounded-[3rem] bg-gradient-to-br from-slate-800 to-slate-900 shadow-[0_20px_0_0_rgba(15,23,42,0.5)] border-2 border-slate-700 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Your Career Won't Fix Itself
          </h2>
          <p className="text-xl text-gray-300 font-medium mb-8 max-w-3xl mx-auto">
            Every day you wait is another day stuck in the same role, getting passed over, watching others succeed. You have two choices: keep struggling alone, or get the system that actually works.
          </p>
          <button className="px-16 py-8 rounded-[2rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_12px_0_0_rgba(147,51,234,0.7)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_8px_0_0_rgba(147,51,234,0.7)] text-2xl font-black text-white transition-all duration-200 mb-6">
            YES, I'M READY TO LEVEL UP →
          </button>
          <p className="text-gray-400 font-medium">
            Join 12,847 PMs who've already made the decision to stop settling
          </p>
        </div>
      </div>
    </div>
  );
}
