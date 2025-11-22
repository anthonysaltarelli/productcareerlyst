import Link from "next/link";
import { PortfolioTemplateRequest } from '@/app/components/portfolio/PortfolioTemplateRequest';

export default function ProductPortfolioPage() {
  return (
    <div className="p-8 md:p-12">
      {/* Page Header */}
      <div className="mb-8">
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_15px_0_0_rgba(168,85,247,0.3)] border-2 border-purple-300">
          <span className="text-5xl mb-4 block">🎨</span>
          <h1 className="text-4xl md:text-5xl font-black text-gray-800 mb-3">
            Product Portfolio
          </h1>
          <p className="text-xl text-gray-700 font-semibold">
            Build standout case studies to showcase your product management skills
          </p>
        </div>
      </div>

      {/* Learning Section */}
      <div className="mb-8">
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-200 to-cyan-200 shadow-[0_12px_0_0_rgba(59,130,246,0.3)] border-2 border-blue-300">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-blue-400 to-cyan-400 shadow-[0_6px_0_0_rgba(59,130,246,0.4)] border-2 border-blue-500 flex items-center justify-center flex-shrink-0">
              <span className="text-3xl">📚</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Learn About Product Portfolios
              </h2>
              <p className="text-gray-700 font-medium mb-4">
                Master the art of creating compelling product portfolio case studies. Learn about the Discover, Define, Develop, and Deliver framework, and how to structure your case studies to stand out in the competitive PM job market.
              </p>
              <Link
                href="/dashboard/courses/launch-product-portfolio"
                className="inline-block px-6 py-3 rounded-[1.5rem] bg-white/80 hover:bg-white border-2 border-blue-300 font-black text-gray-800 transition-all duration-200"
              >
                Start Course →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Ideas Section */}
      <div className="mb-8">
        <Link href="/dashboard/portfolio/generate">
          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-orange-200 to-yellow-200 shadow-[0_12px_0_0_rgba(249,115,22,0.3)] border-2 border-orange-300 hover:translate-y-1 hover:shadow-[0_8px_0_0_rgba(249,115,22,0.3)] transition-all duration-200 cursor-pointer">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-orange-400 to-yellow-400 shadow-[0_6px_0_0_rgba(249,115,22,0.4)] border-2 border-orange-500 flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">✨</span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  AI Case Study Idea Generator
                </h2>
                <p className="text-gray-700 font-medium mb-4">
                  Enter an industry or company name, and we'll generate 3 unique case study ideas with specific problems, hypotheses, and user segments to help you build your portfolio.
                </p>
                <span className="inline-block px-6 py-3 rounded-[1.5rem] bg-white/80 hover:bg-white border-2 border-orange-300 font-black text-gray-800 transition-all duration-200">
                  Generate Ideas →
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Portfolio Template Request Section - Shown to all users, gated with upgrade modal */}
      <div className="mb-8">
        <PortfolioTemplateRequest />
      </div>
    </div>
  );
}
