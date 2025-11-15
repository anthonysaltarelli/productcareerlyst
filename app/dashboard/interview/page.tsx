export default function InterviewPage() {
  return (
    <div className="p-8 md:p-12">
      {/* Page Header */}
      <div className="mb-8">
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-200 to-cyan-200 shadow-[0_15px_0_0_rgba(37,99,235,0.3)] border-2 border-blue-300">
          <span className="text-5xl mb-4 block">🤖</span>
          <h1 className="text-4xl md:text-5xl font-black text-gray-800 mb-3">
            AI Interview Coach
          </h1>
          <p className="text-xl text-gray-700 font-semibold">
            Practice with AI that interviews you like Google, Meta, and Amazon
          </p>
        </div>
      </div>

      {/* Interview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="p-6 rounded-[2rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_10px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300 text-center">
          <p className="text-4xl font-black text-purple-600 mb-2">0</p>
          <p className="text-sm font-bold text-gray-700">Total Interviews</p>
        </div>
        <div className="p-6 rounded-[2rem] bg-gradient-to-br from-green-200 to-emerald-200 shadow-[0_10px_0_0_rgba(22,163,74,0.3)] border-2 border-green-300 text-center">
          <p className="text-4xl font-black text-green-600 mb-2">-</p>
          <p className="text-sm font-bold text-gray-700">Avg Score</p>
        </div>
        <div className="p-6 rounded-[2rem] bg-gradient-to-br from-orange-200 to-yellow-200 shadow-[0_10px_0_0_rgba(234,88,12,0.3)] border-2 border-orange-300 text-center">
          <p className="text-4xl font-black text-orange-600 mb-2">0h</p>
          <p className="text-sm font-bold text-gray-700">Practice Time</p>
        </div>
        <div className="p-6 rounded-[2rem] bg-gradient-to-br from-blue-200 to-cyan-200 shadow-[0_10px_0_0_rgba(37,99,235,0.3)] border-2 border-blue-300 text-center">
          <p className="text-4xl font-black text-blue-600 mb-2">0</p>
          <p className="text-sm font-bold text-gray-700">Streak Days</p>
        </div>
      </div>

      {/* Interview Types */}
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-gray-800">
          Choose Your Interview Type
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Design */}
          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-200 to-cyan-200 shadow-[0_12px_0_0_rgba(37,99,235,0.3)] border-2 border-blue-300">
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              📐 Product Design
            </h3>
            <p className="text-gray-700 font-medium mb-4">
              "Design a product for..." exercises. Practice designing new products, improving existing ones, and thinking through user needs.
            </p>
            <div className="mb-4 text-sm font-bold text-gray-600">
              <p>✓ User research & personas</p>
              <p>✓ Feature prioritization</p>
              <p>✓ Success metrics</p>
            </div>
            <button className="w-full px-6 py-4 rounded-[1.5rem] bg-gradient-to-br from-blue-500 to-cyan-500 shadow-[0_6px_0_0_rgba(37,99,235,0.6)] border-2 border-blue-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(37,99,235,0.6)] font-black text-white transition-all duration-200">
              Start Design Interview →
            </button>
          </div>

          {/* Product Strategy */}
          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_12px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300">
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              🎯 Product Strategy
            </h3>
            <p className="text-gray-700 font-medium mb-4">
              Market analysis, competitive positioning, and go-to-market strategy. Practice thinking like a product leader.
            </p>
            <div className="mb-4 text-sm font-bold text-gray-600">
              <p>✓ Market opportunity sizing</p>
              <p>✓ Competitive analysis</p>
              <p>✓ Strategic roadmapping</p>
            </div>
            <button className="w-full px-6 py-4 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_6px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200">
              Start Strategy Interview →
            </button>
          </div>

          {/* Metrics & Analytics */}
          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-green-200 to-emerald-200 shadow-[0_12px_0_0_rgba(22,163,74,0.3)] border-2 border-green-300">
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              📊 Metrics & Analytics
            </h3>
            <p className="text-gray-700 font-medium mb-4">
              Analyze product metrics, investigate drops, and define success criteria. Practice data-driven decision making.
            </p>
            <div className="mb-4 text-sm font-bold text-gray-600">
              <p>✓ Metric selection & KPIs</p>
              <p>✓ A/B testing analysis</p>
              <p>✓ Root cause investigation</p>
            </div>
            <button className="w-full px-6 py-4 rounded-[1.5rem] bg-gradient-to-br from-green-500 to-emerald-500 shadow-[0_6px_0_0_rgba(22,163,74,0.6)] border-2 border-green-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(22,163,74,0.6)] font-black text-white transition-all duration-200">
              Start Metrics Interview →
            </button>
          </div>

          {/* Behavioral */}
          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-orange-200 to-yellow-200 shadow-[0_12px_0_0_rgba(234,88,12,0.3)] border-2 border-orange-300">
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              💬 Behavioral
            </h3>
            <p className="text-gray-700 font-medium mb-4">
              Tell me about a time when... questions. Practice using STAR method to craft compelling stories about your experience.
            </p>
            <div className="mb-4 text-sm font-bold text-gray-600">
              <p>✓ STAR method mastery</p>
              <p>✓ Leadership examples</p>
              <p>✓ Conflict resolution</p>
            </div>
            <button className="w-full px-6 py-4 rounded-[1.5rem] bg-gradient-to-br from-orange-500 to-yellow-500 shadow-[0_6px_0_0_rgba(234,88,12,0.6)] border-2 border-orange-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(234,88,12,0.6)] font-black text-white transition-all duration-200">
              Start Behavioral Interview →
            </button>
          </div>
        </div>
      </div>

      {/* Performance Tracking */}
      <div className="mt-8 p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-700 to-slate-900 shadow-[0_15px_0_0_rgba(15,23,42,0.4)] border-2 border-slate-800">
        <h2 className="text-2xl font-black text-white mb-6">
          📈 Your Performance Breakdown
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Communication', score: '-' },
            { label: 'Structure', score: '-' },
            { label: 'User Focus', score: '-' },
            { label: 'Data Analysis', score: '-' },
            { label: 'Strategy', score: '-' },
            { label: 'Execution', score: '-' },
            { label: 'Innovation', score: '-' },
            { label: 'Trade-offs', score: '-' },
          ].map((competency) => (
            <div
              key={competency.label}
              className="p-4 rounded-[1.5rem] bg-white/10 border-2 border-slate-600 text-center"
            >
              <p className="text-2xl font-black text-white mb-1">{competency.score}</p>
              <p className="text-xs font-bold text-gray-400">{competency.label}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-gray-400 font-medium mt-6">
          Complete your first interview to see your competency scores
        </p>
      </div>
    </div>
  )
}

