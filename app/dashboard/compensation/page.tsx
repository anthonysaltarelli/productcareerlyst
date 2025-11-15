export default function CompensationPage() {
  return (
    <div className="p-8 md:p-12">
      {/* Page Header */}
      <div className="mb-8">
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-orange-200 to-yellow-200 shadow-[0_15px_0_0_rgba(234,88,12,0.3)] border-2 border-orange-300">
          <span className="text-5xl mb-4 block">💰</span>
          <h1 className="text-4xl md:text-5xl font-black text-gray-800 mb-3">
            Compensation Intelligence
          </h1>
          <p className="text-xl text-gray-700 font-semibold">
            Know your worth and negotiate like a pro
          </p>
        </div>
      </div>

      {/* Salary Calculator */}
      <div className="mb-8 p-8 rounded-[2.5rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_15px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300">
        <h2 className="text-2xl font-black text-gray-800 mb-6">
          💵 Salary Benchmarking Tool
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Your Level</label>
            <select className="w-full px-4 py-3 rounded-[1rem] border-2 border-purple-300 font-semibold text-gray-800 bg-white">
              <option>Product Manager</option>
              <option>Senior PM</option>
              <option>Principal PM</option>
              <option>Director of Product</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Location</label>
            <select className="w-full px-4 py-3 rounded-[1rem] border-2 border-purple-300 font-semibold text-gray-800 bg-white">
              <option>San Francisco Bay Area</option>
              <option>New York City</option>
              <option>Seattle</option>
              <option>Austin</option>
              <option>Remote (US)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Company Size</label>
            <select className="w-full px-4 py-3 rounded-[1rem] border-2 border-purple-300 font-semibold text-gray-800 bg-white">
              <option>FAANG</option>
              <option>Public (1000+)</option>
              <option>Series C-D</option>
              <option>Series A-B</option>
              <option>Startup (&lt;50)</option>
            </select>
          </div>
        </div>
        <button className="w-full px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_6px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200">
          See Compensation Data →
        </button>
      </div>

      {/* Comp Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Market Data */}
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-200 to-cyan-200 shadow-[0_12px_0_0_rgba(37,99,235,0.3)] border-2 border-blue-300">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">📊 Market Comp Ranges</h3>
          <div className="space-y-4">
            <div className="p-4 rounded-[1.5rem] bg-white/60">
              <p className="text-sm font-bold text-gray-600 mb-1">Base Salary</p>
              <p className="text-2xl font-black text-gray-800">$120K - $180K</p>
            </div>
            <div className="p-4 rounded-[1.5rem] bg-white/60">
              <p className="text-sm font-bold text-gray-600 mb-1">Annual Bonus</p>
              <p className="text-2xl font-black text-gray-800">$15K - $35K</p>
            </div>
            <div className="p-4 rounded-[1.5rem] bg-white/60">
              <p className="text-sm font-bold text-gray-600 mb-1">Equity (4-year vest)</p>
              <p className="text-2xl font-black text-gray-800">$80K - $200K</p>
            </div>
            <div className="p-4 rounded-[1.5rem] bg-gradient-to-br from-green-400 to-emerald-400 border-2 border-green-500">
              <p className="text-sm font-bold text-gray-700 mb-1">Total Comp (Median)</p>
              <p className="text-3xl font-black text-gray-800">$235K</p>
            </div>
          </div>
        </div>

        {/* Your Current Comp */}
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-green-200 to-emerald-200 shadow-[0_12px_0_0_rgba(22,163,74,0.3)] border-2 border-green-300">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">💼 Your Compensation</h3>
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">📝</span>
            <p className="text-gray-700 font-bold mb-4">Add your current compensation</p>
            <p className="text-gray-600 font-medium text-sm mb-6">
              See how you compare to market and get personalized negotiation tips
            </p>
            <button className="px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-green-500 to-emerald-500 shadow-[0_6px_0_0_rgba(22,163,74,0.6)] border-2 border-green-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(22,163,74,0.6)] font-black text-white transition-all duration-200">
              Add Your Comp →
            </button>
          </div>
        </div>
      </div>

      {/* Negotiation Simulator */}
      <div className="mb-8 p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-200 to-purple-200 shadow-[0_15px_0_0_rgba(99,102,241,0.3)] border-2 border-indigo-300">
        <div className="flex items-start gap-6 mb-6">
          <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-indigo-400 to-purple-400 shadow-[0_6px_0_0_rgba(99,102,241,0.4)] border-2 border-indigo-500 flex items-center justify-center flex-shrink-0">
            <span className="text-3xl">🎭</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-800 mb-2">AI Negotiation Simulator</h2>
            <p className="text-gray-700 font-medium">
              Practice negotiating your offer with AI that responds like real recruiters and hiring managers
            </p>
          </div>
        </div>
        <button className="w-full px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-indigo-500 to-purple-500 shadow-[0_6px_0_0_rgba(99,102,241,0.6)] border-2 border-indigo-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(99,102,241,0.6)] font-black text-white transition-all duration-200">
          Start Negotiation Practice →
        </button>
      </div>

      {/* Resources */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-[2rem] bg-gradient-to-br from-pink-200 to-rose-200 shadow-[0_10px_0_0_rgba(236,72,153,0.3)] border-2 border-pink-300">
          <span className="text-3xl mb-3 block">📄</span>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Negotiation Scripts</h3>
          <p className="text-sm text-gray-700 font-medium mb-4">
            Word-for-word scripts for every negotiation scenario
          </p>
          <button className="text-sm font-black text-pink-600 hover:text-pink-700">
            View Scripts →
          </button>
        </div>

        <div className="p-6 rounded-[2rem] bg-gradient-to-br from-yellow-200 to-amber-200 shadow-[0_10px_0_0_rgba(245,158,11,0.3)] border-2 border-yellow-300">
          <span className="text-3xl mb-3 block">📊</span>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Equity Calculator</h3>
          <p className="text-sm text-gray-700 font-medium mb-4">
            Understand the true value of your equity package
          </p>
          <button className="text-sm font-black text-yellow-600 hover:text-yellow-700">
            Calculate Value →
          </button>
        </div>

        <div className="p-6 rounded-[2rem] bg-gradient-to-br from-teal-200 to-cyan-200 shadow-[0_10px_0_0_rgba(20,184,166,0.3)] border-2 border-teal-300">
          <span className="text-3xl mb-3 block">🎯</span>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Counter-Offer Guide</h3>
          <p className="text-sm text-gray-700 font-medium mb-4">
            Step-by-step guide to making your counter-offer
          </p>
          <button className="text-sm font-black text-teal-600 hover:text-teal-700">
            Read Guide →
          </button>
        </div>
      </div>

      {/* Data Source Note */}
      <div className="mt-8 p-6 rounded-[2rem] bg-gradient-to-br from-slate-700 to-slate-900 shadow-[0_10px_0_0_rgba(15,23,42,0.4)] border-2 border-slate-800">
        <p className="text-sm text-gray-400 font-medium text-center">
          💡 Data sourced from 10,000+ verified PM offers at FAANG, unicorns, and high-growth startups
        </p>
      </div>
    </div>
  )
}

