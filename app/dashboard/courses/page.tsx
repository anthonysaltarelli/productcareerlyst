export default function CoursesPage() {
  return (
    <div className="p-8 md:p-12">
      {/* Page Header */}
      <div className="mb-8">
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-200 to-purple-200 shadow-[0_15px_0_0_rgba(99,102,241,0.3)] border-2 border-indigo-300">
          <span className="text-5xl mb-4 block">📚</span>
          <h1 className="text-4xl md:text-5xl font-black text-gray-800 mb-3">
            PM Courses
          </h1>
          <p className="text-xl text-gray-700 font-semibold">
            Structured learning paths to master product management
          </p>
        </div>
      </div>

      {/* Course Categories */}
      <div className="space-y-8">
        {/* Interview Prep Courses */}
        <div>
          <h2 className="text-2xl font-black text-gray-800 mb-4">
            🎯 Interview Mastery
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CourseCard
              title="Product Design Interviews"
              description="Master the product design interview format used by FAANG companies"
              duration="4 hours"
              lessons={12}
              color="from-blue-200 to-cyan-200"
              borderColor="border-blue-300"
              shadowColor="rgba(37,99,235,0.3)"
              progress={0}
            />
            <CourseCard
              title="Metrics & Analytics"
              description="Learn to analyze product metrics and make data-driven decisions"
              duration="3 hours"
              lessons={10}
              color="from-purple-200 to-pink-200"
              borderColor="border-purple-300"
              shadowColor="rgba(147,51,234,0.3)"
              progress={0}
            />
            <CourseCard
              title="Strategy & Execution"
              description="Build frameworks for strategic thinking and product execution"
              duration="5 hours"
              lessons={15}
              color="from-green-200 to-emerald-200"
              borderColor="border-green-300"
              shadowColor="rgba(22,163,74,0.3)"
              progress={0}
            />
            <CourseCard
              title="Behavioral Interview Prep"
              description="Craft compelling stories using STAR method for behavioral questions"
              duration="2 hours"
              lessons={8}
              color="from-orange-200 to-yellow-200"
              borderColor="border-orange-300"
              shadowColor="rgba(234,88,12,0.3)"
              progress={0}
            />
          </div>
        </div>

        {/* Career Growth Courses */}
        <div>
          <h2 className="text-2xl font-black text-gray-800 mb-4">
            📈 Career Advancement
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CourseCard
              title="From PM to Senior PM"
              description="Navigate the promotion path and demonstrate senior-level impact"
              duration="6 hours"
              lessons={18}
              color="from-violet-200 to-purple-200"
              borderColor="border-violet-300"
              shadowColor="rgba(124,58,237,0.3)"
              progress={0}
            />
            <CourseCard
              title="Stakeholder Management"
              description="Master the art of influencing without authority"
              duration="3 hours"
              lessons={9}
              color="from-pink-200 to-rose-200"
              borderColor="border-pink-300"
              shadowColor="rgba(236,72,153,0.3)"
              progress={0}
            />
            <CourseCard
              title="Building Promotion Cases"
              description="Document your impact and build an irrefutable promotion packet"
              duration="2 hours"
              lessons={7}
              color="from-teal-200 to-cyan-200"
              borderColor="border-teal-300"
              shadowColor="rgba(20,184,166,0.3)"
              progress={0}
            />
            <CourseCard
              title="Salary Negotiation"
              description="Negotiate compensation like a pro and maximize your worth"
              duration="2 hours"
              lessons={6}
              color="from-amber-200 to-yellow-200"
              borderColor="border-amber-300"
              shadowColor="rgba(245,158,11,0.3)"
              progress={0}
            />
          </div>
        </div>

        {/* PM Fundamentals */}
        <div>
          <h2 className="text-2xl font-black text-gray-800 mb-4">
            🎓 PM Fundamentals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CourseCard
              title="Product Management 101"
              description="Essential foundations for aspiring and new product managers"
              duration="8 hours"
              lessons={24}
              color="from-blue-200 to-indigo-200"
              borderColor="border-blue-300"
              shadowColor="rgba(59,130,246,0.3)"
              progress={0}
            />
            <CourseCard
              title="Writing Effective PRDs"
              description="Create product requirement documents that drive execution"
              duration="3 hours"
              lessons={10}
              color="from-emerald-200 to-green-200"
              borderColor="border-emerald-300"
              shadowColor="rgba(16,185,129,0.3)"
              progress={0}
            />
            <CourseCard
              title="Roadmap Planning"
              description="Build compelling roadmaps that align teams and stakeholders"
              duration="4 hours"
              lessons={12}
              color="from-fuchsia-200 to-pink-200"
              borderColor="border-fuchsia-300"
              shadowColor="rgba(217,70,239,0.3)"
              progress={0}
            />
            <CourseCard
              title="User Research & Discovery"
              description="Conduct research that uncovers real user needs and insights"
              duration="5 hours"
              lessons={14}
              color="from-rose-200 to-red-200"
              borderColor="border-rose-300"
              shadowColor="rgba(244,63,94,0.3)"
              progress={0}
            />
          </div>
        </div>
      </div>

      {/* Coming Soon Banner */}
      <div className="mt-8 p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-700 to-slate-900 shadow-[0_15px_0_0_rgba(15,23,42,0.4)] border-2 border-slate-800 text-center">
        <p className="text-2xl font-black text-white mb-2">
          🚀 More courses launching soon!
        </p>
        <p className="text-gray-400 font-medium">
          We're constantly adding new content. Check back regularly for updates.
        </p>
      </div>
    </div>
  )
}

const CourseCard = ({
  title,
  description,
  duration,
  lessons,
  color,
  borderColor,
  shadowColor,
  progress,
}: {
  title: string
  description: string
  duration: string
  lessons: number
  color: string
  borderColor: string
  shadowColor: string
  progress: number
}) => {
  return (
    <div
      className={`p-6 rounded-[2rem] bg-gradient-to-br ${color} shadow-[0_10px_0_0_${shadowColor}] border-2 ${borderColor} hover:translate-y-1 hover:shadow-[0_6px_0_0_${shadowColor}] transition-all duration-200 cursor-pointer`}
    >
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-700 font-medium text-sm mb-4">{description}</p>

      <div className="flex items-center gap-4 text-sm font-bold text-gray-600 mb-4">
        <span>⏱️ {duration}</span>
        <span>📝 {lessons} lessons</span>
      </div>

      {progress > 0 ? (
        <div>
          <div className="flex justify-between text-xs font-bold text-gray-600 mb-2">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-3 bg-white/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <button className="w-full px-6 py-3 rounded-[1.5rem] bg-white/80 hover:bg-white border-2 border-gray-300 font-black text-gray-800 transition-all duration-200">
          Start Course →
        </button>
      )}
    </div>
  )
}

