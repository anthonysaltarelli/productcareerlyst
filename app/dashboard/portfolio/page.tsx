'use client';

import { useFlags } from 'launchdarkly-react-client-sdk';
import { TrackedLink } from '@/app/components/TrackedLink';
import { PortfolioTemplateRequest } from '@/app/components/portfolio/PortfolioTemplateRequest';
import { PortfolioModule } from '@/app/components/portfolio/PortfolioModule';
import { PortfolioPageTracking } from '@/app/components/PortfolioPageTracking';
import { MobileDashboardHeader } from '@/app/components/MobileDashboardHeader';
import { FeaturedPortfolioSection } from '@/app/components/portfolio/FeaturedPortfolioSection';

export default function ProductPortfolioPage() {
  const { productPortfolioRequest } = useFlags();

  return (
    <>
      <MobileDashboardHeader title="Product Portfolio" />
      <PortfolioPageTracking pageName="Product Portfolio" />
      <div className="min-h-screen bg-gray-50 p-6 pt-20 md:p-8 lg:p-12 md:pt-8 lg:pt-12">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-black text-gray-800 mb-2">
            Product Portfolio
          </h1>
          <p className="text-gray-600 font-medium">
            Build and showcase your PM portfolio with case studies
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Main Content - Left Column */}
          <div className="flex-1 min-w-0">
            {/* Portfolio Module - Create or Overview */}
            <PortfolioModule />

            {/* Generate Ideas Section */}
            <div className="mb-6 md:mb-8">
              <TrackedLink
                href="/dashboard/portfolio/generate"
                linkId="portfolio-page-generate-ideas-link"
                eventName="User Clicked Generate Ideas Link"
                eventProperties={{
                  'Link Section': 'Generate Ideas Section',
                  'Link Position': 'Center of Generate Ideas Card',
                  'Link Text': 'Generate Ideas →',
                  'Link Type': 'Primary Feature CTA',
                  'Link Context': 'Below "AI Case Study Idea Generator" description',
                  'Page Section': 'Above the fold',
                  'Link Destination': '/dashboard/portfolio/generate',
                }}
              >
                <div className="p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] bg-gradient-to-br from-orange-200 to-yellow-200 shadow-[0_8px_0_0_rgba(249,115,22,0.3)] md:shadow-[0_12px_0_0_rgba(249,115,22,0.3)] border-2 border-orange-300 hover:translate-y-1 hover:shadow-[0_4px_0_0_rgba(249,115,22,0.3)] md:hover:shadow-[0_8px_0_0_rgba(249,115,22,0.3)] transition-all duration-200 cursor-pointer">
                  <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-[1.5rem] bg-gradient-to-br from-orange-400 to-yellow-400 shadow-[0_4px_0_0_rgba(249,115,22,0.4)] md:shadow-[0_6px_0_0_rgba(249,115,22,0.4)] border-2 border-orange-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl md:text-3xl">✨</span>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
                        AI Case Study Idea Generator
                      </h2>
                      <p className="text-sm md:text-base text-gray-700 font-medium mb-4">
                        Enter an industry or company name, and we&apos;ll generate 3 unique case study ideas with specific problems, hypotheses, and user segments to help you build your portfolio.
                      </p>
                      <span className="inline-block px-5 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-[1.5rem] bg-white/80 hover:bg-white border-2 border-orange-300 font-black text-sm md:text-base text-gray-800 transition-all duration-200">
                        Generate Ideas →
                      </span>
                    </div>
                  </div>
                </div>
              </TrackedLink>
            </div>

            {/* Learning Section */}
            <div className="mb-6 md:mb-8">
              <div className="p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] bg-gradient-to-br from-blue-200 to-cyan-200 shadow-[0_8px_0_0_rgba(59,130,246,0.3)] md:shadow-[0_12px_0_0_rgba(59,130,246,0.3)] border-2 border-blue-300">
                <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-[1.5rem] bg-gradient-to-br from-blue-400 to-cyan-400 shadow-[0_4px_0_0_rgba(59,130,246,0.4)] md:shadow-[0_6px_0_0_rgba(59,130,246,0.4)] border-2 border-blue-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl md:text-3xl">📚</span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
                      Learn About Product Portfolios
                    </h2>
                    <p className="text-sm md:text-base text-gray-700 font-medium mb-4">
                      Master the art of creating compelling product portfolio case studies. Learn about the Discover, Define, Develop, and Deliver framework, and how to structure your case studies to stand out in the competitive PM job market.
                    </p>
                    <TrackedLink
                      href="/dashboard/courses/launch-product-portfolio"
                      linkId="portfolio-page-learning-start-course-link"
                      eventName="User Clicked Start Course Link"
                      eventProperties={{
                        'Link Section': 'Learning Section',
                        'Link Position': 'Center of Learning Card',
                        'Link Text': 'Start Course →',
                        'Link Type': 'Learning CTA',
                        'Link Context': 'Below "Learn About Product Portfolios" description',
                        'Page Section': 'Above the fold',
                        'Link Destination': '/dashboard/courses/launch-product-portfolio',
                        'Course Slug': 'launch-product-portfolio',
                        'Course Name': 'Launch Product Portfolio',
                      }}
                      className="inline-block px-5 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-[1.5rem] bg-white/80 hover:bg-white border-2 border-blue-300 font-black text-sm md:text-base text-gray-800 transition-all duration-200"
                    >
                      Start Course →
                    </TrackedLink>
                  </div>
                </div>
              </div>
            </div>

            {/* Portfolio Template Request Section - Behind feature flag */}
            {productPortfolioRequest && (
              <div className="mb-8">
                <PortfolioTemplateRequest />
              </div>
            )}
          </div>

          {/* Featured Portfolios - Right Sidebar on desktop, below content on mobile */}
          <div className="w-full lg:w-64 xl:w-72 flex-shrink-0">
            <FeaturedPortfolioSection />
          </div>
        </div>
      </div>
    </>
  );
}
