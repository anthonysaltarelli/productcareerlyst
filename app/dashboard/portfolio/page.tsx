export default function PortfolioPage() {
  return (
    <div className="p-8 md:p-12">
      {/* Page Header */}
      <div className="mb-8">
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-green-200 to-emerald-200 shadow-[0_15px_0_0_rgba(22,163,74,0.3)] border-2 border-green-300">
          <span className="text-5xl mb-4 block">🏆</span>
          <h1 className="text-4xl md:text-5xl font-black text-gray-800 mb-3">
            Impact Portfolio
          </h1>
          <p className="text-xl text-gray-700 font-semibold">
            Document your wins and build an irrefutable promotion case
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="p-6 rounded-[2rem] bg-gradient-to-br from-blue-200 to-cyan-200 shadow-[0_10px_0_0_rgba(37,99,235,0.3)] border-2 border-blue-300 text-center">
          <p className="text-4xl font-black text-blue-600 mb-2">0</p>
          <p className="text-sm font-bold text-gray-700">Total Achievements</p>
        </div>
        <div className="p-6 rounded-[2rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_10px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300 text-center">
          <p className="text-4xl font-black text-purple-600 mb-2">0</p>
          <p className="text-sm font-bold text-gray-700">Product Launches</p>
        </div>
        <div className="p-6 rounded-[2rem] bg-gradient-to-br from-green-200 to-emerald-200 shadow-[0_10px_0_0_rgba(22,163,74,0.3)] border-2 border-green-300 text-center">
          <p className="text-4xl font-black text-green-600 mb-2">0</p>
          <p className="text-sm font-bold text-gray-700">Metrics Improved</p>
        </div>
        <div className="p-6 rounded-[2rem] bg-gradient-to-br from-orange-200 to-yellow-200 shadow-[0_10px_0_0_rgba(234,88,12,0.3)] border-2 border-orange-300 text-center">
          <p className="text-4xl font-black text-orange-600 mb-2">-</p>
          <p className="text-sm font-bold text-gray-700">Promotion Ready</p>
        </div>
      </div>

      {/* Add Achievement CTA */}
      <div className="mb-8 p-10 rounded-[2.5rem] bg-gradient-to-br from-indigo-200 to-purple-200 shadow-[0_15px_0_0_rgba(99,102,241,0.3)] border-2 border-indigo-300 text-center">
        <h2 className="text-3xl font-black text-gray-800 mb-4">
          🎯 Start Building Your Case
        </h2>
        <p className="text-lg text-gray-700 font-medium mb-6">
          Document every win, no matter how small. When promotion time comes, you'll have everything you need.
        </p>
        <button className="px-10 py-5 rounded-[2rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_8px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_5px_0_0_rgba(147,51,234,0.6)] text-xl font-black text-white transition-all duration-200">
          + Add Your First Achievement
        </button>
      </div>

      {/* Achievement Categories */}
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-gray-800">Achievement Categories</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Launches */}
          <div className="p-6 rounded-[2rem] bg-gradient-to-br from-blue-200 to-cyan-200 shadow-[0_10px_0_0_rgba(37,99,235,0.3)] border-2 border-blue-300">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🚀</span>
              <h3 className="text-xl font-bold text-gray-800">Product Launches</h3>
            </div>
            <p className="text-gray-700 font-medium mb-4 text-sm">
              Major features, new products, and significant releases
            </p>
            <div className="text-center py-8 border-2 border-dashed border-blue-300 rounded-xl bg-white/40">
              <p className="text-gray-600 font-medium">No launches yet</p>
              <button className="mt-3 px-6 py-2 rounded-[1rem] bg-white hover:bg-blue-50 border-2 border-blue-300 font-bold text-gray-800 text-sm transition-all duration-200">
                + Add Launch
              </button>
            </div>
          </div>

          {/* Metrics Impact */}
          <div className="p-6 rounded-[2rem] bg-gradient-to-br from-green-200 to-emerald-200 shadow-[0_10px_0_0_rgba(22,163,74,0.3)] border-2 border-green-300">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">📈</span>
              <h3 className="text-xl font-bold text-gray-800">Metrics Impact</h3>
            </div>
            <p className="text-gray-700 font-medium mb-4 text-sm">
              Revenue growth, user engagement, conversion improvements
            </p>
            <div className="text-center py-8 border-2 border-dashed border-green-300 rounded-xl bg-white/40">
              <p className="text-gray-600 font-medium">No metrics yet</p>
              <button className="mt-3 px-6 py-2 rounded-[1rem] bg-white hover:bg-green-50 border-2 border-green-300 font-bold text-gray-800 text-sm transition-all duration-200">
                + Add Metric
              </button>
            </div>
          </div>

          {/* Leadership */}
          <div className="p-6 rounded-[2rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_10px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">👥</span>
              <h3 className="text-xl font-bold text-gray-800">Leadership</h3>
            </div>
            <p className="text-gray-700 font-medium mb-4 text-sm">
              Mentoring, team building, cross-functional leadership
            </p>
            <div className="text-center py-8 border-2 border-dashed border-purple-300 rounded-xl bg-white/40">
              <p className="text-gray-600 font-medium">No leadership wins yet</p>
              <button className="mt-3 px-6 py-2 rounded-[1rem] bg-white hover:bg-purple-50 border-2 border-purple-300 font-bold text-gray-800 text-sm transition-all duration-200">
                + Add Win
              </button>
            </div>
          </div>

          {/* Innovation */}
          <div className="p-6 rounded-[2rem] bg-gradient-to-br from-orange-200 to-yellow-200 shadow-[0_10px_0_0_rgba(234,88,12,0.3)] border-2 border-orange-300">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">💡</span>
              <h3 className="text-xl font-bold text-gray-800">Innovation</h3>
            </div>
            <p className="text-gray-700 font-medium mb-4 text-sm">
              New processes, frameworks, tools that improved the team
            </p>
            <div className="text-center py-8 border-2 border-dashed border-orange-300 rounded-xl bg-white/40">
              <p className="text-gray-600 font-medium">No innovations yet</p>
              <button className="mt-3 px-6 py-2 rounded-[1rem] bg-white hover:bg-orange-50 border-2 border-orange-300 font-bold text-gray-800 text-sm transition-all duration-200">
                + Add Innovation
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Promotion Packet Generator */}
      <div className="mt-8 p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-700 to-slate-900 shadow-[0_15px_0_0_rgba(15,23,42,0.4)] border-2 border-slate-800">
        <h2 className="text-2xl font-black text-white mb-4">
          📄 Promotion Packet Generator
        </h2>
        <p className="text-gray-400 font-medium mb-6">
          Once you've logged achievements, we'll automatically generate a compelling promotion case with all your metrics and impact stories.
        </p>
        <button
          className="px-8 py-4 rounded-[1.5rem] bg-slate-600 border-2 border-slate-500 font-black text-gray-400 cursor-not-allowed"
          disabled
        >
          Generate Packet (Add achievements first)
        </button>
      </div>
    </div>
  )
}

