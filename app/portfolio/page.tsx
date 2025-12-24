'use client';

import { PageTracking } from '@/app/components/PageTracking';
import { TrackedButton } from '@/app/components/TrackedButton';
import { TrackedLink } from '@/app/components/TrackedLink';
import { 
  Briefcase, 
  Image, 
  Layout, 
  FolderOpen, 
  Link2, 
  Smartphone, 
  Eye, 
  Search,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Wand2,
  PenLine,
  List,
  FileText,
  Type,
  ImagePlus,
  Layers,
  Tag,
  Star,
  GripVertical,
  Globe,
  User,
  Linkedin,
  Twitter,
  Github,
  Mail,
  ToggleRight,
  EyeOff,
} from 'lucide-react';

const PortfolioLandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100">
      <PageTracking pageName="Portfolio Landing Page" />
      
      <div className="max-w-7xl mx-auto px-4 py-6 sm:p-8 md:p-12 lg:p-16">
        
        {/* Hero Section */}
        <div className="flex justify-center mb-12 md:mb-20 relative">
          <div className="hidden md:block absolute -top-8 -left-8 w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 opacity-20 blur-2xl animate-pulse"></div>
          <div className="hidden md:block absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br from-teal-400 to-emerald-400 opacity-20 blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          
          <div className="w-full max-w-4xl relative z-10">
            <div className="p-5 sm:p-8 md:p-12 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[3rem] bg-gradient-to-br from-emerald-200 to-teal-200 shadow-[0_12px_0_0_rgba(16,185,129,0.3)] md:shadow-[0_20px_0_0_rgba(16,185,129,0.3)] border-2 border-emerald-300 relative overflow-hidden">
              <div className="relative z-10">
                {/* Badge */}
                <div className="flex justify-center gap-4 mb-4 sm:mb-6 flex-wrap">
                  <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/80 backdrop-blur-sm border-2 border-emerald-300 shadow-lg">
                    <span className="text-xs sm:text-sm font-bold text-emerald-700">
                      ✨ Available on the Accelerate Plan
                    </span>
                  </div>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-br from-emerald-700 to-teal-600 bg-clip-text text-transparent mb-4 sm:mb-6 leading-tight text-center">
                  Launch a Product Portfolio
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-gray-700 font-semibold mb-6 sm:mb-8 text-center max-w-3xl mx-auto">
                  Build a stunning portfolio website that showcases your strategic thinking and ships your personal brand to the world.
                </p>

                {/* Stats highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div className="text-center p-3 sm:p-4 rounded-[1rem] sm:rounded-[1.5rem] bg-white/60 backdrop-blur-sm border-2 border-emerald-200">
                    <div className="text-2xl sm:text-3xl font-black text-emerald-700 mb-1">99%</div>
                    <p className="text-xs sm:text-sm font-bold text-gray-700">of PMs don't have a portfolio</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 rounded-[1rem] sm:rounded-[1.5rem] bg-white/60 backdrop-blur-sm border-2 border-teal-200">
                    <div className="text-2xl sm:text-3xl font-black text-teal-700 mb-1">5 min</div>
                    <p className="text-xs sm:text-sm font-bold text-gray-700">to set up your portfolio</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 rounded-[1rem] sm:rounded-[1.5rem] bg-white/60 backdrop-blur-sm border-2 border-emerald-200">
                    <div className="text-2xl sm:text-3xl font-black text-emerald-700 mb-1">Easy</div>
                    <p className="text-xs sm:text-sm font-bold text-gray-700">No design skills needed</p>
                  </div>
                </div>

                <TrackedButton
                  href="/auth/sign-up"
                  className="block w-full px-6 py-4 sm:px-10 sm:py-6 rounded-[1.5rem] sm:rounded-[2rem] bg-gradient-to-br from-emerald-500 to-teal-500 shadow-[0_8px_0_0_rgba(16,185,129,0.6)] sm:shadow-[0_10px_0_0_rgba(16,185,129,0.6)] border-2 border-emerald-600 hover:translate-y-1 hover:shadow-[0_4px_0_0_rgba(16,185,129,0.6)] sm:hover:shadow-[0_6px_0_0_rgba(16,185,129,0.6)] text-lg sm:text-xl font-black text-white transition-all duration-200 text-center mb-3 sm:mb-4"
                  eventName="User Clicked Get Started Button"
                  buttonId="portfolio-landing-hero-cta"
                  eventProperties={{
                    'Button Section': 'Hero Section',
                    'Button Position': 'Center of Hero Card',
                    'Button Type': 'Primary CTA',
                    'Button Text': 'Get Started →',
                    'Button Context': 'Below headline and stats highlights',
                    'Page Section': 'Above the fold',
                  }}
                >
                  Get Started →
                </TrackedButton>
                <p className="text-center text-xs sm:text-sm text-gray-600 font-medium">
                  Trusted by thousands of PMs
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stand Out Callout */}
        <div className="mb-12 md:mb-20">
          <div className="p-6 sm:p-8 md:p-12 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[3rem] bg-gradient-to-br from-slate-800 to-slate-900 shadow-[0_10px_0_0_rgba(15,23,42,0.4)] md:shadow-[0_15px_0_0_rgba(15,23,42,0.4)] border-2 border-slate-700 text-center">
            <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight">
              Stand Out From 99% of PM Candidates
            </p>
          </div>
        </div>

        {/* Why You Need a Portfolio Section */}
        <div className="mb-12 md:mb-20">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-800 mb-3 md:mb-4">
              Why You Need a Product Portfolio
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 font-medium px-2">
              In a competitive job market, a portfolio is your secret weapon.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            <div className="p-5 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-amber-200 to-orange-200 shadow-[0_8px_0_0_rgba(245,158,11,0.3)] md:shadow-[0_12px_0_0_rgba(245,158,11,0.3)] border-2 border-amber-300">
              <span className="text-4xl sm:text-5xl mb-4 sm:mb-6 block">🎯</span>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-4">
                Differentiate Instantly
              </h3>
              <p className="text-sm sm:text-base text-gray-700 font-medium">
                When 99% of PM candidates rely solely on resumes, your portfolio immediately signals that you're serious, strategic, and capable of shipping great work.
              </p>
            </div>

            <div className="p-5 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-sky-200 to-blue-200 shadow-[0_8px_0_0_rgba(14,165,233,0.3)] md:shadow-[0_12px_0_0_rgba(14,165,233,0.3)] border-2 border-sky-300">
              <span className="text-4xl sm:text-5xl mb-4 sm:mb-6 block">💼</span>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-4">
                Prove Your Skills
              </h3>
              <p className="text-sm sm:text-base text-gray-700 font-medium">
                Case studies demonstrate your ability to think strategically, solve problems, and deliver results—exactly what hiring managers want to see.
              </p>
            </div>

            <div className="p-5 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-violet-200 to-purple-200 shadow-[0_8px_0_0_rgba(139,92,246,0.3)] md:shadow-[0_12px_0_0_rgba(139,92,246,0.3)] border-2 border-violet-300">
              <span className="text-4xl sm:text-5xl mb-4 sm:mb-6 block">🤝</span>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-4">
                Supercharge Networking
              </h3>
              <p className="text-sm sm:text-base text-gray-700 font-medium">
                Include case study links in your outreach messages to give contacts a reason to respond. Show them what you can do before they even meet you.
              </p>
            </div>

            <div className="p-5 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-rose-200 to-pink-200 shadow-[0_8px_0_0_rgba(244,63,94,0.3)] md:shadow-[0_12px_0_0_rgba(244,63,94,0.3)] border-2 border-rose-300">
              <span className="text-4xl sm:text-5xl mb-4 sm:mb-6 block">✨</span>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-4">
                Build Your Brand
              </h3>
              <p className="text-sm sm:text-base text-gray-700 font-medium">
                A professional portfolio establishes you as a thought leader. It's your personal website that lives on long after the job search ends.
              </p>
            </div>
          </div>
        </div>

        {/* Live Portfolio Example Section */}
        <div className="mb-12 md:mb-20">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-800 mb-3 md:mb-4">
              See It In Action
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 font-medium px-2">
              Here's a live portfolio built with Product Careerlyst
            </p>
          </div>

          {/* Mobile: Just the button */}
          <div className="sm:hidden flex justify-center">
            <TrackedLink
              href="https://productcareerlyst.com/p/anthonysaltarelli"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-gray-800 to-gray-900 shadow-[0_6px_0_0_rgba(0,0,0,0.3)] border-2 border-gray-700 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(0,0,0,0.3)] font-bold text-white transition-all duration-200"
              eventName="User Clicked View Live Portfolio Link"
              linkId="portfolio-landing-view-live-portfolio-mobile"
              eventProperties={{
                'Link Section': 'Live Example Section',
                'Link Position': 'Mobile view',
                'Link Type': 'External Link',
                'Link Text': 'View Live Portfolio',
                'Portfolio URL': 'productcareerlyst.com/p/anthonysaltarelli',
              }}
            >
              <ExternalLink className="w-5 h-5" />
              View Live Portfolio
            </TrackedLink>
          </div>

          {/* Desktop: Full preview with container */}
          <div className="hidden sm:block p-8 rounded-[2.5rem] bg-white shadow-[0_10px_0_0_rgba(0,0,0,0.1)] md:shadow-[0_15px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
            {/* Portfolio Preview */}
            <div className="rounded-[1.5rem] overflow-hidden border-2 border-gray-200 mb-6">
              <div className="bg-gray-100 px-4 py-2 flex items-center gap-2 border-b border-gray-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white rounded-md px-3 py-1 text-sm text-gray-600 font-mono">
                    productcareerlyst.com/p/anthonysaltarelli
                  </div>
                </div>
              </div>
              <div className="aspect-[2/1] bg-gradient-to-br from-gray-50 to-gray-100 relative">
                <iframe
                  src="https://productcareerlyst.com/p/anthonysaltarelli"
                  className="w-full h-full border-0"
                  title="Anthony Saltarelli's Product Portfolio"
                  loading="lazy"
                />
              </div>
            </div>

            <div className="flex flex-row gap-4 justify-center">
              <TrackedLink
                href="https://productcareerlyst.com/p/anthonysaltarelli"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-gray-800 to-gray-900 shadow-[0_6px_0_0_rgba(0,0,0,0.3)] border-2 border-gray-700 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(0,0,0,0.3)] font-bold text-white transition-all duration-200"
                eventName="User Clicked View Live Portfolio Link"
                linkId="portfolio-landing-view-live-portfolio"
                eventProperties={{
                  'Link Section': 'Live Example Section',
                  'Link Position': 'Below portfolio preview',
                  'Link Type': 'External Link',
                  'Link Text': 'View Live Portfolio',
                  'Portfolio URL': 'productcareerlyst.com/p/anthonysaltarelli',
                }}
              >
                <ExternalLink className="w-5 h-5" />
                View Live Portfolio
              </TrackedLink>
              <TrackedButton
                href="/auth/sign-up"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-emerald-500 to-teal-500 shadow-[0_6px_0_0_rgba(16,185,129,0.6)] border-2 border-emerald-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(16,185,129,0.6)] font-bold text-white transition-all duration-200"
                eventName="User Clicked Build Your Own Button"
                buttonId="portfolio-landing-build-your-own"
                eventProperties={{
                  'Button Section': 'Live Example Section',
                  'Button Position': 'Below portfolio preview',
                  'Button Type': 'Secondary CTA',
                  'Button Text': 'Build Your Own',
                  'Button Context': 'After viewing live portfolio example',
                }}
              >
                <Sparkles className="w-5 h-5" />
                Build Your Own
              </TrackedButton>
            </div>
          </div>
        </div>

        {/* Networking Use Case Section */}
        <div className="mb-12 md:mb-20">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-800 mb-3 md:mb-4">
              Level Up Your Networking
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 font-medium px-2">
              Turn cold outreach into warm conversations with case study links
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
            {/* Example Outreach Message */}
            <div className="p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] bg-white shadow-[0_10px_0_0_rgba(0,0,0,0.1)] md:shadow-[0_12px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Example Outreach Message</h3>
                  <p className="text-sm text-gray-500">Email to a DoorDash PM</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200 flex-1">
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  Hi Sarah,
                  <br /><br />
                  I noticed you're a PM on the merchant experience team at DoorDash. I've been following DoorDash's expansion into grocery delivery and find the logistics challenges fascinating.
                  <br /><br />
                  I recently completed a{' '}
                  <TrackedLink
                    href="https://productcareerlyst.com/p/anthonysaltarelli/uber-eats"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 font-semibold hover:underline"
                    eventName="User Clicked Case Study Link In Example"
                    linkId="portfolio-landing-uber-eats-case-study-example"
                    eventProperties={{
                      'Link Section': 'Networking Example Section',
                      'Link Position': 'Within example outreach message',
                      'Link Type': 'Case Study Link',
                      'Link Text': 'case study',
                      'Case Study URL': 'productcareerlyst.com/p/anthonysaltarelli/uber-eats',
                    }}
                  >
                    case study
                  </TrackedLink>
                  {' '}on food delivery optimization that you might find interesting.
                  <br /><br />
                  I'd love to hear your thoughts on the merchant activation strategy I proposed. Would you be open to a 15-minute chat about your experience at DoorDash?
                  <br /><br />
                  Best,
                  <br />
                  Anthony
                </p>
              </div>
            </div>

            {/* Why This Works */}
            <div className="p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] bg-gradient-to-br from-emerald-200 to-teal-200 shadow-[0_10px_0_0_rgba(16,185,129,0.3)] md:shadow-[0_12px_0_0_rgba(16,185,129,0.3)] border-2 border-emerald-300 flex flex-col">
              <h3 className="text-2xl sm:text-3xl font-black text-gray-800 mb-5 text-center">
                Why This Works
              </h3>
              
              <div className="grid grid-cols-2 gap-3 sm:gap-4 flex-1">
                <div className="p-4 sm:p-5 rounded-xl bg-white/50 border border-emerald-300/50 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <p className="font-bold text-gray-800 text-sm sm:text-base">Shows Initiative</p>
                  <p className="text-xs sm:text-sm text-gray-600">You've done the work first</p>
                </div>
                
                <div className="p-4 sm:p-5 rounded-xl bg-white/50 border border-emerald-300/50 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <p className="font-bold text-gray-800 text-sm sm:text-base">Provides Value</p>
                  <p className="text-xs sm:text-sm text-gray-600">You're offering insights first</p>
                </div>
                
                <div className="p-4 sm:p-5 rounded-xl bg-white/50 border border-emerald-300/50 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <p className="font-bold text-gray-800 text-sm sm:text-base">Starts Conversation</p>
                  <p className="text-xs sm:text-sm text-gray-600">Makes replies easier</p>
                </div>
                
                <div className="p-4 sm:p-5 rounded-xl bg-white/50 border border-emerald-300/50 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <p className="font-bold text-gray-800 text-sm sm:text-base">Stands Out</p>
                  <p className="text-xs sm:text-sm text-gray-600">Yours has real substance</p>
                </div>
              </div>

              <TrackedLink
                href="https://productcareerlyst.com/p/anthonysaltarelli/uber-eats"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 flex items-center justify-center gap-2 w-full px-6 py-3 rounded-[1.5rem] bg-white/80 hover:bg-white border-2 border-emerald-400 font-bold text-emerald-700 transition-all duration-200"
                eventName="User Clicked View Uber Eats Case Study"
                linkId="portfolio-landing-view-uber-eats-cta"
                eventProperties={{
                  'Link Section': 'Networking Example Section',
                  'Link Position': 'Bottom of Why This Works card',
                  'Link Type': 'Case Study CTA',
                  'Link Text': 'View the Uber Eats Case Study',
                }}
              >
                View the Uber Eats Case Study
                <ArrowRight className="w-5 h-5" />
              </TrackedLink>
            </div>
          </div>
        </div>

        {/* Visual Features Section - NEW DESIGN */}
        <div className="mb-12 md:mb-20">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-800 mb-3 md:mb-4 px-2">
              Everything You Need to Build a Stunning Portfolio
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 font-medium px-2">
              Professional tools that make portfolio creation effortless
            </p>
          </div>

          <div className="space-y-8 md:space-y-12">

            {/* Feature 1: Unsplash Integration */}
            <div className="rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-pink-100 to-rose-100 border-2 border-pink-200 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 md:p-10">
                <div className="flex flex-col justify-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-500 text-white text-xs font-bold mb-4 w-fit">
                    <ImagePlus className="w-3.5 h-3.5" />
                    UNSPLASH INTEGRATION
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-gray-800 mb-3">
                    Millions of Stunning Photos at Your Fingertips
                  </h3>
                  <p className="text-base sm:text-lg text-gray-700 font-medium mb-6">
                    Search Unsplash's library of professional photos directly from your editor. Find the perfect images for your portfolio in seconds—no design skills required.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm font-bold text-pink-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Millions of free professional photos
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-pink-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Search by keyword instantly
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-pink-700">
                      <CheckCircle2 className="w-5 h-5" />
                      One-click to add to your portfolio
                    </div>
                  </div>
                </div>
                {/* Mock Unsplash Search UI */}
                <div className="bg-white rounded-2xl border-2 border-pink-200 p-5 shadow-lg">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border-2 border-gray-200">
                      <Search className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600 font-medium">uber eats</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="aspect-[4/3] rounded-lg relative overflow-hidden group cursor-pointer">
                      <img 
                        src="/portfolio_example_photos/greenbackpackonbike.jpg" 
                        alt="Green backpack on bike"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="absolute bottom-1 right-1 text-[8px] text-white/80 bg-black/40 px-1 rounded">Robert Anasch</span>
                    </div>
                    <div className="aspect-[4/3] rounded-lg relative overflow-hidden group cursor-pointer">
                      <img 
                        src="/portfolio_example_photos/app.jpg" 
                        alt="App interface"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="absolute bottom-1 right-1 text-[8px] text-white/80 bg-black/40 px-1 rounded">appshunter.io</span>
                    </div>
                    <div className="aspect-[4/3] rounded-lg relative overflow-hidden group cursor-pointer ring-2 ring-pink-500 ring-offset-2">
                      <img 
                        src="/portfolio_example_photos/computer.jpg" 
                        alt="Computer workspace"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      </div>
                      <span className="absolute bottom-1 right-1 text-[8px] text-white/80 bg-black/40 px-1 rounded">charlesdeluvio</span>
                    </div>
                    <div className="aspect-[4/3] rounded-lg relative overflow-hidden group cursor-pointer">
                      <img 
                        src="/portfolio_example_photos/biker.jpg" 
                        alt="Biker from above"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="absolute bottom-1 right-1 text-[8px] text-white/80 bg-black/40 px-1 rounded">Pim de Boer</span>
                    </div>
                    <div className="aspect-[4/3] rounded-lg relative overflow-hidden group cursor-pointer">
                      <img 
                        src="/portfolio_example_photos/reflective.jpg" 
                        alt="Reflective photo"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="absolute bottom-1 right-1 text-[8px] text-white/80 bg-black/40 px-1 rounded">Tony Sebastian</span>
                    </div>
                    <div className="aspect-[4/3] rounded-lg relative overflow-hidden group cursor-pointer">
                      <img 
                        src="/portfolio_example_photos/bikerdownback.jpg" 
                        alt="Biker down back view"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="absolute bottom-1 right-1 text-[8px] text-white/80 bg-black/40 px-1 rounded">Kai Pilger</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-green-800">Cover image added!</p>
                        <p className="text-xs text-green-700">Photo by charlesdeluvio on Unsplash</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2: AI Writing Assistant */}
            <div className="rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-violet-100 to-purple-100 border-2 border-violet-200 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 md:p-10">
                <div className="flex flex-col justify-center order-2 lg:order-1">
                  {/* Mock AI Dropdown UI */}
                  <div className="bg-white rounded-2xl border-2 border-violet-200 p-5 shadow-lg">
                    <div className="mb-4 p-3 rounded-xl bg-gray-50 border border-gray-200">
                      <p className="text-sm text-gray-700 font-medium">
                        <span className="bg-violet-100 px-1 rounded">|</span> Type / to see AI commands...
                      </p>
                    </div>
                    <div className="bg-white rounded-xl border-2 border-violet-300 shadow-lg overflow-hidden">
                      <div className="p-2 border-b border-gray-100">
                        <p className="text-xs font-bold text-gray-500 px-2">AI WRITING ASSISTANT</p>
                      </div>
                      <div className="divide-y divide-gray-100">
                        <div className="p-3 flex items-center gap-3 hover:bg-violet-50 cursor-pointer transition-colors bg-violet-50">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                            <Wand2 className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-800">Continue Writing</p>
                            <p className="text-xs text-gray-500">AI will continue your paragraph</p>
                          </div>
                        </div>
                        <div className="p-3 flex items-center gap-3 hover:bg-violet-50 cursor-pointer transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                            <PenLine className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-800">Improve Writing</p>
                            <p className="text-xs text-gray-500">Make your text more professional</p>
                          </div>
                        </div>
                        <div className="p-3 flex items-center gap-3 hover:bg-violet-50 cursor-pointer transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-800">Summarize</p>
                            <p className="text-xs text-gray-500">Create a concise summary</p>
                          </div>
                        </div>
                        <div className="p-3 flex items-center gap-3 hover:bg-violet-50 cursor-pointer transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                            <List className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-800">Make Bullet Points</p>
                            <p className="text-xs text-gray-500">Convert to a scannable list</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-center order-1 lg:order-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500 text-white text-xs font-bold mb-4 w-fit">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI WRITING ASSISTANT
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-gray-800 mb-3">
                    Write Better Case Studies with AI
                  </h3>
                  <p className="text-base sm:text-lg text-gray-700 font-medium mb-6">
                    Stuck on what to write? Just type "/" to access AI commands. Continue your thoughts, improve your writing, create summaries, or transform text into bullet points—all powered by AI.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm font-bold text-violet-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Continue writing from where you left off
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-violet-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Improve and polish your writing
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-violet-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Transform into bullet points or summaries
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3: Categories & Organization */}
            <div className="rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-amber-100 to-orange-100 border-2 border-amber-200 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 md:p-10">
                <div className="flex flex-col justify-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500 text-white text-xs font-bold mb-4 w-fit">
                    <Layers className="w-3.5 h-3.5" />
                    CATEGORIES & ORGANIZATION
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-gray-800 mb-3">
                    Organize Your Work Beautifully
                  </h3>
                  <p className="text-base sm:text-lg text-gray-700 font-medium mb-6">
                    Create categories to group your case studies by theme, industry, or skill. Feature your best work, reorder with drag-and-drop, and help recruiters find exactly what they're looking for.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm font-bold text-amber-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Unlimited custom categories
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-amber-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Drag-and-drop reordering
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-amber-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Feature your top case studies
                    </div>
                  </div>
                </div>
                {/* Mock Categories UI */}
                <div className="bg-white rounded-2xl border-2 border-amber-200 p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-gray-700">Your Categories</span>
                    <button className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-200 transition-colors">
                      <Tag className="w-3.5 h-3.5" />
                      Add Category
                    </button>
                  </div>
                  <div className="space-y-3">
                    {/* Category 1 */}
                    <div className="p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                          <span className="font-bold text-gray-800 text-sm">Case Studies</span>
                        </div>
                        <span className="text-xs text-blue-600 font-bold">3 projects</span>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 p-2 rounded-lg bg-white border border-blue-100">
                          <div className="flex items-center gap-2">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span className="text-xs font-medium text-gray-700 truncate">Uber Eats Redesign</span>
                          </div>
                        </div>
                        <div className="flex-1 p-2 rounded-lg bg-white border border-blue-100">
                          <span className="text-xs font-medium text-gray-700 truncate block">Spotify Discovery</span>
                        </div>
                      </div>
                    </div>
                    {/* Category 2 */}
                    <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                          <span className="font-bold text-gray-800 text-sm">Work</span>
                        </div>
                        <span className="text-xs text-emerald-600 font-bold">2 projects</span>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 p-2 rounded-lg bg-white border border-emerald-100">
                          <span className="text-xs font-medium text-gray-700 truncate block">Checkout Flow</span>
                        </div>
                        <div className="flex-1 p-2 rounded-lg bg-white border border-emerald-100">
                          <span className="text-xs font-medium text-gray-700 truncate block">Search Ranking</span>
                        </div>
                      </div>
                    </div>
                    {/* Category 3 */}
                    <div className="p-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                          <span className="font-bold text-gray-800 text-sm">Side Projects</span>
                        </div>
                        <span className="text-xs text-purple-600 font-bold">2 projects</span>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 p-2 rounded-lg bg-white border border-purple-100">
                          <span className="text-xs font-medium text-gray-700 truncate block">Habit Tracker App</span>
                        </div>
                        <div className="flex-1 p-2 rounded-lg bg-white border border-purple-100">
                          <span className="text-xs font-medium text-gray-700 truncate block">Recipe Finder</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 4: Rich Text Editor */}
            <div className="rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-indigo-100 to-blue-100 border-2 border-indigo-200 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 md:p-10">
                <div className="flex flex-col justify-center order-2 lg:order-1">
                  {/* Mock Editor UI */}
                  <div className="bg-white rounded-2xl border-2 border-indigo-200 p-5 shadow-lg">
                    {/* Toolbar */}
                    <div className="flex items-center gap-1 p-2 rounded-lg bg-gray-50 border border-gray-200 mb-4">
                      <button className="p-2 rounded hover:bg-gray-200 transition-colors">
                        <Type className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-2 rounded hover:bg-gray-200 transition-colors font-bold text-gray-600 text-sm">B</button>
                      <button className="p-2 rounded hover:bg-gray-200 transition-colors italic text-gray-600 text-sm">I</button>
                      <div className="w-px h-5 bg-gray-300 mx-1"></div>
                      <button className="p-2 rounded hover:bg-gray-200 transition-colors">
                        <List className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-2 rounded hover:bg-gray-200 transition-colors">
                        <Image className="w-4 h-4 text-gray-600" />
                      </button>
                      <div className="w-px h-5 bg-gray-300 mx-1"></div>
                      <button className="p-2 rounded bg-violet-100 hover:bg-violet-200 transition-colors">
                        <Sparkles className="w-4 h-4 text-violet-600" />
                      </button>
                    </div>
                    {/* Content */}
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold text-gray-800">Problem Statement</h3>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        The Uber Eats merchant dashboard had a <span className="bg-blue-100 px-1 rounded font-semibold">30% abandonment rate</span> during onboarding. Restaurant owners were struggling to complete menu setup and go live.
                      </p>
                      <div className="p-3 rounded-lg bg-gray-100 border border-gray-200 font-mono">
                        <p className="text-sm text-gray-700">Menu photo requirements were the #1 reason for drop-off</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-center order-1 lg:order-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500 text-white text-xs font-bold mb-4 w-fit">
                    <Layout className="w-3.5 h-3.5" />
                    NOTION-LIKE EDITOR
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-gray-800 mb-3">
                    Write Like You're in Notion
                  </h3>
                  <p className="text-base sm:text-lg text-gray-700 font-medium mb-6">
                    A familiar, powerful editing experience. Add headings, images, callouts, bullet points, and more. Focus on your content while we handle the formatting.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm font-bold text-indigo-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Rich formatting options
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-indigo-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Drag-and-drop images
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-indigo-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Callout boxes and highlights
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 5: Custom URLs & Publishing */}
            <div className="rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-slate-100 to-gray-100 border-2 border-slate-200 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 md:p-10">
                <div className="flex flex-col justify-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-600 text-white text-xs font-bold mb-4 w-fit">
                    <Link2 className="w-3.5 h-3.5" />
                    CUSTOM URLs & PUBLISHING
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-gray-800 mb-3">
                    Your Personal Domain, One Click to Go Live
                  </h3>
                  <p className="text-base sm:text-lg text-gray-700 font-medium mb-6">
                    Get a personalized URL for your portfolio and each case study. Preview everything before going live, then publish with one click when you're ready.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Custom portfolio URL slug
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Custom slugs for each case study
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                      <CheckCircle2 className="w-5 h-5" />
                      One-click publish/unpublish
                    </div>
                  </div>
                </div>
                {/* Mock URL & Publishing UI */}
                <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-lg">
                  <div className="mb-5">
                    <p className="text-xs font-bold text-gray-500 mb-2">YOUR PORTFOLIO URL</p>
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border-2 border-gray-200">
                      <Globe className="w-5 h-5 text-gray-400" />
                      <span className="text-sm font-mono text-gray-600">productcareerlyst.com/p/</span>
                      <span className="text-sm font-mono font-bold text-emerald-600">yourname</span>
                    </div>
                  </div>
                  <div className="mb-5">
                    <p className="text-xs font-bold text-gray-500 mb-2">PAGE SLUGS</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200">
                        <span className="text-xs text-gray-500">/p/yourname/</span>
                        <span className="text-xs font-bold text-gray-800">uber-eats-optimization</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200">
                        <span className="text-xs text-gray-500">/p/yourname/</span>
                        <span className="text-xs font-bold text-gray-800">airbnb-pricing-strategy</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-100 to-teal-100 border border-emerald-200">
                    <div className="flex items-center gap-3">
                      <Eye className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="text-sm font-bold text-emerald-800">Portfolio Published</p>
                        <p className="text-xs text-emerald-600">Visible to everyone</p>
                      </div>
                    </div>
                    <div className="w-12 h-6 rounded-full bg-emerald-500 flex items-center justify-end px-1">
                      <div className="w-4 h-4 rounded-full bg-white shadow"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Mid-page CTA */}
        <div className="mb-12 md:mb-20">
          <div className="p-5 sm:p-8 md:p-12 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[3rem] bg-gradient-to-br from-emerald-500 to-teal-500 shadow-[0_10px_0_0_rgba(16,185,129,0.5)] md:shadow-[0_15px_0_0_rgba(16,185,129,0.5)] border-2 border-emerald-600 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-4">
              Ready to Stand Out?
            </h2>
            <p className="text-base sm:text-lg text-emerald-100 font-medium mb-6 max-w-2xl mx-auto">
              Join the top 1% of PM candidates who have a professional portfolio.
            </p>
            <TrackedButton
              href="/auth/sign-up"
              className="inline-block px-8 py-4 sm:px-12 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] bg-white shadow-[0_6px_0_0_rgba(0,0,0,0.2)] border-2 border-gray-200 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(0,0,0,0.2)] text-lg sm:text-xl font-black text-emerald-600 transition-all duration-200"
              eventName="User Clicked Get Started Button"
              buttonId="portfolio-landing-mid-page-cta"
              eventProperties={{
                'Button Section': 'Mid-Page CTA Section',
                'Button Position': 'Center of CTA Card',
                'Button Type': 'Primary CTA',
                'Button Text': 'Get Started →',
                'Button Context': 'After features section',
                'Page Section': 'Below the fold',
              }}
            >
              Get Started →
            </TrackedButton>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-12 md:mb-20">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-800 mb-3 md:mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <FAQItem
              question="Do I need coding experience to build a portfolio?"
              answer="Not at all! Our portfolio editor is completely no-code. Just type your content, upload images, and publish. It's as easy as writing a document and looks professionally designed."
            />
            
            <FAQItem
              question="How long does it take to create a portfolio?"
              answer="You can set up your profile and publish your portfolio in less than 5 minutes. Most users take a few days to write high quality case studies, design mockups, etc."
            />
            
            <FAQItem
              question="What kind of case studies should I create?"
              answer="Focus on solving problems within your target industries. Include content covering the 4 part product development process: Discover, Define, Design, Deliver. Our AI case study idea generator can help you brainstorm ideas!"
            />
            
            <FAQItem
              question="Can I use this for projects from work?"
              answer="Yes, but be mindful of confidentiality. Focus on your process and learnings rather than proprietary information. Many PMs use disguised or conceptual case studies effectively. A good rule of thumb is: if a user on the internet can view the feature you built, you should share screenshots on your portfolio!"
            />
            
            <FAQItem
              question="Is the Portfolio Editor included in the Accelerate plan?"
              answer="Yes! The Portfolio Editor is included in the Accelerate plan, giving you full access to create and publish your professional portfolio."
            />
            
            <FAQItem
              question="Can I keep my portfolio after my subscription ends?"
              answer="Your portfolio remains published as long as you have an active Accelerate subscription. If you cancel, your portfolio will become unpublished. You can resubscribe any time to restore access."
            />
          </div>
        </div>

        {/* Final CTA */}
        <div className="p-5 sm:p-8 md:p-12 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[3rem] bg-gradient-to-br from-slate-800 to-slate-900 shadow-[0_12px_0_0_rgba(15,23,42,0.5)] md:shadow-[0_20px_0_0_rgba(15,23,42,0.5)] border-2 border-slate-700 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 sm:mb-6">
            Your Portfolio Awaits
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 font-medium mb-6 sm:mb-8 max-w-3xl mx-auto px-2">
            Stop blending in with every other PM candidate. Build a portfolio that showcases your strategic thinking, demonstrates your skills, and opens doors to new opportunities.
          </p>
          <TrackedButton
            href="/auth/sign-up"
            className="inline-block px-8 py-4 sm:px-10 sm:py-5 md:px-14 md:py-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 shadow-[0_6px_0_0_rgba(16,185,129,0.7)] sm:shadow-[0_8px_0_0_rgba(16,185,129,0.7)] md:shadow-[0_10px_0_0_rgba(16,185,129,0.7)] border-2 border-emerald-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(16,185,129,0.7)] sm:hover:shadow-[0_4px_0_0_rgba(16,185,129,0.7)] md:hover:shadow-[0_6px_0_0_rgba(16,185,129,0.7)] text-base sm:text-lg md:text-xl font-black text-white transition-all duration-200 mb-4 sm:mb-6"
            eventName="User Clicked Get Started Button"
            buttonId="portfolio-landing-final-cta"
            eventProperties={{
              'Button Section': 'Final CTA Section',
              'Button Position': 'Center of Final CTA Card',
              'Button Type': 'Final CTA',
              'Button Text': 'GET STARTED →',
              'Button Context': 'After FAQ section, bottom of page',
              'Page Section': 'Below the fold',
            }}
          >
            GET STARTED →
          </TrackedButton>
          <p className="text-sm sm:text-base text-gray-400 font-medium px-2">
            Trusted by thousands of PMs
          </p>
        </div>
      </div>
    </div>
  );
};

// FAQ Item Component
interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem = ({ question, answer }: FAQItemProps) => (
  <div className="p-4 sm:p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-white shadow-[0_6px_0_0_rgba(0,0,0,0.1)] md:shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
    <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-1.5 sm:mb-2">
      {question}
    </h3>
    <p className="text-sm sm:text-base text-gray-700 font-medium">
      {answer}
    </p>
  </div>
);

export default PortfolioLandingPage;
