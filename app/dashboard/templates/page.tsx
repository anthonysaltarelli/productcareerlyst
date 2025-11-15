export default function TemplatesPage() {
  return (
    <div className="p-8 md:p-12">
      {/* Page Header */}
      <div className="mb-8">
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-pink-200 to-rose-200 shadow-[0_15px_0_0_rgba(236,72,153,0.3)] border-2 border-pink-300">
          <span className="text-5xl mb-4 block">⚡</span>
          <h1 className="text-4xl md:text-5xl font-black text-gray-800 mb-3">
            PM Templates & Frameworks
          </h1>
          <p className="text-xl text-gray-700 font-semibold">
            Generate PRDs, roadmaps, and strategy docs in seconds
          </p>
        </div>
      </div>

      {/* Template Categories */}
      <div className="space-y-8">
        {/* Strategy & Planning */}
        <div>
          <h2 className="text-2xl font-black text-gray-800 mb-4">
            🎯 Strategy & Planning
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TemplateCard
              icon="📋"
              title="Product Requirements Doc (PRD)"
              description="Comprehensive PRD template with all sections pre-filled"
              color="from-blue-200 to-cyan-200"
              borderColor="border-blue-300"
              shadowColor="rgba(37,99,235,0.3)"
            />
            <TemplateCard
              icon="🗺️"
              title="Product Roadmap"
              description="Quarterly roadmap with themes, epics, and timeline"
              color="from-purple-200 to-pink-200"
              borderColor="border-purple-300"
              shadowColor="rgba(147,51,234,0.3)"
            />
            <TemplateCard
              icon="🎯"
              title="OKRs & Goals"
              description="Objective and Key Results framework for your product"
              color="from-green-200 to-emerald-200"
              borderColor="border-green-300"
              shadowColor="rgba(22,163,74,0.3)"
            />
            <TemplateCard
              icon="📊"
              title="Product Strategy Doc"
              description="Vision, mission, strategy, and competitive positioning"
              color="from-orange-200 to-yellow-200"
              borderColor="border-orange-300"
              shadowColor="rgba(234,88,12,0.3)"
            />
            <TemplateCard
              icon="🔍"
              title="Market Analysis"
              description="TAM/SAM/SOM analysis and market opportunity sizing"
              color="from-indigo-200 to-purple-200"
              borderColor="border-indigo-300"
              shadowColor="rgba(99,102,241,0.3)"
            />
            <TemplateCard
              icon="⚔️"
              title="Competitive Analysis"
              description="Feature comparison and competitive landscape mapping"
              color="from-pink-200 to-rose-200"
              borderColor="border-pink-300"
              shadowColor="rgba(236,72,153,0.3)"
            />
          </div>
        </div>

        {/* Research & Discovery */}
        <div>
          <h2 className="text-2xl font-black text-gray-800 mb-4">
            🔬 Research & Discovery
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TemplateCard
              icon="👥"
              title="User Persona Template"
              description="Detailed user persona with jobs-to-be-done framework"
              color="from-teal-200 to-cyan-200"
              borderColor="border-teal-300"
              shadowColor="rgba(20,184,166,0.3)"
            />
            <TemplateCard
              icon="🗣️"
              title="User Interview Guide"
              description="Interview script with discovery questions"
              color="from-amber-200 to-yellow-200"
              borderColor="border-amber-300"
              shadowColor="rgba(245,158,11,0.3)"
            />
            <TemplateCard
              icon="📝"
              title="Research Summary"
              description="Synthesize user research findings and insights"
              color="from-violet-200 to-purple-200"
              borderColor="border-violet-300"
              shadowColor="rgba(124,58,237,0.3)"
            />
            <TemplateCard
              icon="🗺️"
              title="User Journey Map"
              description="Visualize user experience across touchpoints"
              color="from-emerald-200 to-green-200"
              borderColor="border-emerald-300"
              shadowColor="rgba(16,185,129,0.3)"
            />
            <TemplateCard
              icon="📋"
              title="Feature Request Form"
              description="Standardized intake for stakeholder requests"
              color="from-fuchsia-200 to-pink-200"
              borderColor="border-fuchsia-300"
              shadowColor="rgba(217,70,239,0.3)"
            />
            <TemplateCard
              icon="💡"
              title="Problem Statement"
              description="Define the problem you're solving and why"
              color="from-rose-200 to-red-200"
              borderColor="border-rose-300"
              shadowColor="rgba(244,63,94,0.3)"
            />
          </div>
        </div>

        {/* Execution & Delivery */}
        <div>
          <h2 className="text-2xl font-black text-gray-800 mb-4">
            🚀 Execution & Delivery
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TemplateCard
              icon="📅"
              title="Sprint Planning Doc"
              description="Structure your sprint planning meetings"
              color="from-blue-200 to-indigo-200"
              borderColor="border-blue-300"
              shadowColor="rgba(59,130,246,0.3)"
            />
            <TemplateCard
              icon="📄"
              title="User Stories"
              description="Write clear user stories with acceptance criteria"
              color="from-purple-200 to-pink-200"
              borderColor="border-purple-300"
              shadowColor="rgba(147,51,234,0.3)"
            />
            <TemplateCard
              icon="🚦"
              title="Launch Plan"
              description="Pre-launch checklist and go-to-market strategy"
              color="from-green-200 to-emerald-200"
              borderColor="border-green-300"
              shadowColor="rgba(22,163,74,0.3)"
            />
            <TemplateCard
              icon="📈"
              title="Success Metrics"
              description="Define and track your feature's KPIs"
              color="from-orange-200 to-yellow-200"
              borderColor="border-orange-300"
              shadowColor="rgba(234,88,12,0.3)"
            />
            <TemplateCard
              icon="🔄"
              title="Retrospective"
              description="Team retro with start/stop/continue framework"
              color="from-indigo-200 to-purple-200"
              borderColor="border-indigo-300"
              shadowColor="rgba(99,102,241,0.3)"
            />
            <TemplateCard
              icon="📊"
              title="Status Update"
              description="Weekly/monthly stakeholder update template"
              color="from-pink-200 to-rose-200"
              borderColor="border-pink-300"
              shadowColor="rgba(236,72,153,0.3)"
            />
          </div>
        </div>

        {/* Frameworks & Tools */}
        <div>
          <h2 className="text-2xl font-black text-gray-800 mb-4">
            🛠️ Frameworks & Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TemplateCard
              icon="🎲"
              title="RICE Prioritization"
              description="Score features by Reach, Impact, Confidence, Effort"
              color="from-teal-200 to-cyan-200"
              borderColor="border-teal-300"
              shadowColor="rgba(20,184,166,0.3)"
            />
            <TemplateCard
              icon="📐"
              title="Value vs Effort Matrix"
              description="2x2 matrix for feature prioritization"
              color="from-amber-200 to-yellow-200"
              borderColor="border-amber-300"
              shadowColor="rgba(245,158,11,0.3)"
            />
            <TemplateCard
              icon="🎯"
              title="North Star Metric"
              description="Define your product's single most important metric"
              color="from-violet-200 to-purple-200"
              borderColor="border-violet-300"
              shadowColor="rgba(124,58,237,0.3)"
            />
            <TemplateCard
              icon="⚖️"
              title="Trade-off Analysis"
              description="Evaluate pros/cons of different approaches"
              color="from-emerald-200 to-green-200"
              borderColor="border-emerald-300"
              shadowColor="rgba(16,185,129,0.3)"
            />
            <TemplateCard
              icon="🧩"
              title="Feature Spec"
              description="Technical specification for engineering handoff"
              color="from-fuchsia-200 to-pink-200"
              borderColor="border-fuchsia-300"
              shadowColor="rgba(217,70,239,0.3)"
            />
            <TemplateCard
              icon="🎨"
              title="Design Brief"
              description="Brief your designers with clear requirements"
              color="from-rose-200 to-red-200"
              borderColor="border-rose-300"
              shadowColor="rgba(244,63,94,0.3)"
            />
          </div>
        </div>
      </div>

      {/* AI Assistant CTA */}
      <div className="mt-8 p-10 rounded-[2.5rem] bg-gradient-to-br from-slate-700 to-slate-900 shadow-[0_20px_0_0_rgba(15,23,42,0.4)] border-2 border-slate-800 text-center">
        <span className="text-6xl mb-4 block">🤖</span>
        <h2 className="text-3xl font-black text-white mb-4">
          AI-Powered Template Generation
        </h2>
        <p className="text-xl text-gray-300 font-medium mb-6 max-w-2xl mx-auto">
          Not just templates—our AI adapts them to your specific product context. Just describe what you're building.
        </p>
        <button className="px-10 py-5 rounded-[2rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_10px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_6px_0_0_rgba(147,51,234,0.6)] text-xl font-black text-white transition-all duration-200">
          Try AI Assistant →
        </button>
      </div>
    </div>
  )
}

const TemplateCard = ({
  icon,
  title,
  description,
  color,
  borderColor,
  shadowColor,
}: {
  icon: string
  title: string
  description: string
  color: string
  borderColor: string
  shadowColor: string
}) => {
  return (
    <div
      className={`p-6 rounded-[2rem] bg-gradient-to-br ${color} shadow-[0_10px_0_0_${shadowColor}] border-2 ${borderColor} hover:translate-y-1 hover:shadow-[0_6px_0_0_${shadowColor}] transition-all duration-200 cursor-pointer`}
    >
      <span className="text-4xl mb-3 block">{icon}</span>
      <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-gray-700 font-medium mb-4">{description}</p>
      <button className="text-sm font-black text-gray-800 hover:text-gray-900">
        Use Template →
      </button>
    </div>
  )
}

