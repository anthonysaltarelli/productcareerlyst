export default function CareerPage() {
  return (
    <div className="p-8 md:p-12">
      {/* Page Header */}
      <div className="mb-8">
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_15px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300">
          <span className="text-5xl mb-4 block">📊</span>
          <h1 className="text-4xl md:text-5xl font-black text-gray-800 mb-3">
            Career Progression Tracker
          </h1>
          <p className="text-xl text-gray-700 font-semibold">
            Your roadmap to Senior PM, Principal PM, and beyond
          </p>
        </div>
      </div>

      {/* Current Level */}
      <div className="mb-8 p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-200 to-purple-200 shadow-[0_12px_0_0_rgba(99,102,241,0.3)] border-2 border-indigo-300">
        <h2 className="text-2xl font-black text-gray-800 mb-4">Your Current Level</h2>
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-indigo-500 to-purple-500 shadow-[0_6px_0_0_rgba(99,102,241,0.5)] border-2 border-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-4xl">🎯</span>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-600 mb-1">CURRENT ROLE</p>
            <h3 className="text-3xl font-black text-gray-800 mb-2">Product Manager</h3>
            <p className="text-gray-700 font-medium">Set your level to get personalized guidance</p>
          </div>
        </div>
      </div>

      {/* Career Path */}
      <div className="mb-8">
        <h2 className="text-2xl font-black text-gray-800 mb-4">Career Progression Path</h2>
        <div className="space-y-4">
          {/* Associate PM */}
          <div className="p-6 rounded-[2rem] bg-gradient-to-br from-blue-200 to-cyan-200 shadow-[0_10px_0_0_rgba(37,99,235,0.3)] border-2 border-blue-300 opacity-60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-blue-400 to-cyan-400 border-2 border-blue-500 flex items-center justify-center">
                  <span className="text-2xl">✓</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Associate Product Manager</h3>
                  <p className="text-sm font-medium text-gray-600">0-2 years experience</p>
                </div>
              </div>
              <span className="text-sm font-bold text-gray-600 bg-white/60 px-4 py-2 rounded-full">
                Completed
              </span>
            </div>
          </div>

          {/* PM (Current) */}
          <div className="p-6 rounded-[2rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_10px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-purple-500 flex items-center justify-center">
                  <span className="text-2xl">📍</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Product Manager</h3>
                  <p className="text-sm font-medium text-gray-600">2-4 years experience</p>
                </div>
              </div>
              <span className="text-sm font-bold text-purple-700 bg-purple-400/60 px-4 py-2 rounded-full">
                Current Level
              </span>
            </div>
            <div className="bg-white/60 rounded-xl p-4">
              <div className="flex justify-between text-sm font-bold text-gray-700 mb-2">
                <span>Skills Mastered</span>
                <span>0%</span>
              </div>
              <div className="w-full h-3 bg-white rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: '0%' }} />
              </div>
            </div>
          </div>

          {/* Senior PM (Next) */}
          <div className="p-6 rounded-[2rem] bg-gradient-to-br from-green-200 to-emerald-200 shadow-[0_10px_0_0_rgba(22,163,74,0.3)] border-2 border-green-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-green-400 to-emerald-400 border-2 border-green-500 flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Senior Product Manager</h3>
                  <p className="text-sm font-medium text-gray-600">4-7 years experience</p>
                </div>
              </div>
              <span className="text-sm font-bold text-green-700 bg-green-400/60 px-4 py-2 rounded-full">
                Next Level
              </span>
            </div>
            <div className="bg-white/60 rounded-xl p-4">
              <p className="text-sm font-bold text-gray-700 mb-3">Key Skills to Develop:</p>
              <div className="space-y-2 text-sm font-medium text-gray-700">
                <p>• Lead cross-functional initiatives independently</p>
                <p>• Drive product strategy for your area</p>
                <p>• Mentor junior PMs</p>
                <p>• Influence senior stakeholders</p>
              </div>
            </div>
          </div>

          {/* Principal PM */}
          <div className="p-6 rounded-[2rem] bg-gradient-to-br from-orange-200 to-yellow-200 shadow-[0_10px_0_0_rgba(234,88,12,0.3)] border-2 border-orange-300 opacity-60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-orange-400 to-yellow-400 border-2 border-orange-500 flex items-center justify-center">
                  <span className="text-2xl">🔒</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Principal Product Manager</h3>
                  <p className="text-sm font-medium text-gray-600">7-10 years experience</p>
                </div>
              </div>
              <span className="text-sm font-bold text-gray-600 bg-white/60 px-4 py-2 rounded-full">
                Locked
              </span>
            </div>
          </div>

          {/* Director */}
          <div className="p-6 rounded-[2rem] bg-gradient-to-br from-red-200 to-rose-200 shadow-[0_10px_0_0_rgba(239,68,68,0.3)] border-2 border-red-300 opacity-60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-red-400 to-rose-400 border-2 border-red-500 flex items-center justify-center">
                  <span className="text-2xl">🔒</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Director of Product</h3>
                  <p className="text-sm font-medium text-gray-600">10+ years experience</p>
                </div>
              </div>
              <span className="text-sm font-bold text-gray-600 bg-white/60 px-4 py-2 rounded-full">
                Locked
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Skills Assessment */}
      <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-700 to-slate-900 shadow-[0_15px_0_0_rgba(15,23,42,0.4)] border-2 border-slate-800">
        <h2 className="text-2xl font-black text-white mb-6">Skills Assessment</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { skill: 'Product Strategy', level: 0 },
            { skill: 'User Research', level: 0 },
            { skill: 'Data Analysis', level: 0 },
            { skill: 'Technical Knowledge', level: 0 },
            { skill: 'Stakeholder Management', level: 0 },
            { skill: 'Execution & Delivery', level: 0 },
            { skill: 'Leadership', level: 0 },
            { skill: 'Communication', level: 0 },
          ].map((item) => (
            <div key={item.skill} className="p-4 rounded-[1.5rem] bg-white/10 border-2 border-slate-600">
              <div className="flex justify-between text-sm font-bold text-white mb-2">
                <span>{item.skill}</span>
                <span>{item.level}/5</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  style={{ width: `${(item.level / 5) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <button className="px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_6px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200">
            Take Skills Assessment →
          </button>
        </div>
      </div>
    </div>
  )
}

