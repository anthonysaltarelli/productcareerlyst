'use client';

import { useState } from 'react';
import { PageTracking } from '@/app/components/PageTracking';
import { TrackedButton } from '@/app/components/TrackedButton';
import { SignUpModal } from '@/app/components/SignUpModal';
import { trackEventWithContext } from '@/lib/amplitude/client';
import {
  FileText,
  Layout,
  Palette,
  MessageSquare,
  Search,
  AlertTriangle,
  CheckSquare,
  BookOpen,
  Target,
  Puzzle,
  HelpCircle,
  Calculator,
  Briefcase,
  ClipboardList,
  Ticket,
  Map,
  BookMarked,
  BarChart3,
  Settings,
  LineChart,
  Users,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  shadowColor: string;
  category: string;
}

const resources: Resource[] = [
  {
    id: 'resume-guide',
    title: 'Resume Guide',
    description: 'Keywords to include and PM resume tips & tricks that get you noticed',
    icon: <FileText className="w-8 h-8" />,
    color: 'from-blue-200 to-cyan-200',
    borderColor: 'border-blue-300',
    shadowColor: 'rgba(37,99,235,0.3)',
    category: 'Career Prep',
  },
  {
    id: 'case-study-template',
    title: 'Case Study Template',
    description: 'Build compelling Product Portfolio case studies with this proven template',
    icon: <Layout className="w-8 h-8" />,
    color: 'from-purple-200 to-pink-200',
    borderColor: 'border-purple-300',
    shadowColor: 'rgba(147,51,234,0.3)',
    category: 'Portfolio',
  },
  {
    id: 'figma-templates',
    title: 'Figma Graphic Templates',
    description: 'Pre-made user journey maps and graphics for your Portfolio',
    icon: <Palette className="w-8 h-8" />,
    color: 'from-pink-200 to-rose-200',
    borderColor: 'border-pink-300',
    shadowColor: 'rgba(236,72,153,0.3)',
    category: 'Portfolio',
  },
  {
    id: 'networking-scripts',
    title: 'Networking Scripts',
    description: 'Exact scripts that convert to informational calls and referrals',
    icon: <MessageSquare className="w-8 h-8" />,
    color: 'from-green-200 to-emerald-200',
    borderColor: 'border-green-300',
    shadowColor: 'rgba(22,163,74,0.3)',
    category: 'Networking',
  },
  {
    id: 'find-contacts-guide',
    title: 'Find Contacts Guide',
    description: 'Learn how to find important Product folks on LinkedIn',
    icon: <Search className="w-8 h-8" />,
    color: 'from-teal-200 to-cyan-200',
    borderColor: 'border-teal-300',
    shadowColor: 'rgba(20,184,166,0.3)',
    category: 'Networking',
  },
  {
    id: 'company-red-flags',
    title: 'Company Red Flags',
    description: 'Watch out for these Red Flags when evaluating companies',
    icon: <AlertTriangle className="w-8 h-8" />,
    color: 'from-red-200 to-rose-200',
    borderColor: 'border-red-300',
    shadowColor: 'rgba(239,68,68,0.3)',
    category: 'Job Search',
  },
  {
    id: 'job-application-checklist',
    title: 'Job Application Checklist',
    description: 'Follow these steps to increase your chances of landing an offer',
    icon: <CheckSquare className="w-8 h-8" />,
    color: 'from-yellow-200 to-amber-200',
    borderColor: 'border-yellow-300',
    shadowColor: 'rgba(245,158,11,0.3)',
    category: 'Job Search',
  },
  {
    id: 'behavioral-stories',
    title: 'My 8 Stories',
    description: 'Prepare for Behavioral PM interviews with this proven worksheet',
    icon: <BookOpen className="w-8 h-8" />,
    color: 'from-indigo-200 to-purple-200',
    borderColor: 'border-indigo-300',
    shadowColor: 'rgba(99,102,241,0.3)',
    category: 'Interview Prep',
  },
  {
    id: 'interview-prep',
    title: 'Interview Prep',
    description: 'Be prepared for every type of PM interview you\'ll face',
    icon: <Target className="w-8 h-8" />,
    color: 'from-violet-200 to-purple-200',
    borderColor: 'border-violet-300',
    shadowColor: 'rgba(124,58,237,0.3)',
    category: 'Interview Prep',
  },
  {
    id: 'pm-frameworks',
    title: 'PM Interview Frameworks',
    description: 'Cheatsheet of the most powerful and relevant PM frameworks',
    icon: <Puzzle className="w-8 h-8" />,
    color: 'from-fuchsia-200 to-pink-200',
    borderColor: 'border-fuchsia-300',
    shadowColor: 'rgba(217,70,239,0.3)',
    category: 'Interview Prep',
  },
  {
    id: 'questions-answers',
    title: 'Questions & Answers',
    description: 'Dozens of potential interview questions with sample answers',
    icon: <HelpCircle className="w-8 h-8" />,
    color: 'from-orange-200 to-yellow-200',
    borderColor: 'border-orange-300',
    shadowColor: 'rgba(234,88,12,0.3)',
    category: 'Interview Prep',
  },
  {
    id: 'offer-calculator',
    title: 'Offer Calculator',
    description: 'Use this calculator to maximize your total compensation',
    icon: <Calculator className="w-8 h-8" />,
    color: 'from-emerald-200 to-green-200',
    borderColor: 'border-emerald-300',
    shadowColor: 'rgba(16,185,129,0.3)',
    category: 'Compensation',
  },
  {
    id: 'negotiation-scripts',
    title: 'Negotiation Scripts',
    description: 'Exact scripts to increase your compensation package',
    icon: <Briefcase className="w-8 h-8" />,
    color: 'from-slate-200 to-gray-200',
    borderColor: 'border-slate-300',
    shadowColor: 'rgba(71,85,105,0.3)',
    category: 'Compensation',
  },
  {
    id: 'prd-template',
    title: 'Product Requirements Doc',
    description: 'Get started on any product initiative with this PRD template',
    icon: <ClipboardList className="w-8 h-8" />,
    color: 'from-cyan-200 to-blue-200',
    borderColor: 'border-cyan-300',
    shadowColor: 'rgba(6,182,212,0.3)',
    category: 'PM Fundamentals',
  },
  {
    id: 'jira-templates',
    title: 'Jira Ticket Templates',
    description: 'Improve your team\'s effectiveness with standardized tickets',
    icon: <Ticket className="w-8 h-8" />,
    color: 'from-blue-200 to-indigo-200',
    borderColor: 'border-blue-300',
    shadowColor: 'rgba(59,130,246,0.3)',
    category: 'PM Fundamentals',
  },
  {
    id: 'roadmap-template',
    title: 'Roadmap Template',
    description: 'Organize your product roadmap into a visual tracker',
    icon: <Map className="w-8 h-8" />,
    color: 'from-purple-200 to-indigo-200',
    borderColor: 'border-purple-300',
    shadowColor: 'rgba(147,51,234,0.3)',
    category: 'PM Fundamentals',
  },
  {
    id: 'pm-glossary',
    title: 'PM Terminology Glossary',
    description: 'Look up any PM concept quickly with clear examples',
    icon: <BookMarked className="w-8 h-8" />,
    color: 'from-amber-200 to-yellow-200',
    borderColor: 'border-amber-300',
    shadowColor: 'rgba(245,158,11,0.3)',
    category: 'PM Fundamentals',
  },
  {
    id: 'popular-metrics',
    title: 'Popular Metrics',
    description: 'Understand the most common KPIs used by product teams',
    icon: <BarChart3 className="w-8 h-8" />,
    color: 'from-rose-200 to-pink-200',
    borderColor: 'border-rose-300',
    shadowColor: 'rgba(244,63,94,0.3)',
    category: 'PM Fundamentals',
  },
  {
    id: 'software-guide',
    title: 'Software Guide',
    description: 'Learn the basics of popular PM software like Jira & Notion',
    icon: <Settings className="w-8 h-8" />,
    color: 'from-sky-200 to-blue-200',
    borderColor: 'border-sky-300',
    shadowColor: 'rgba(14,165,233,0.3)',
    category: 'PM Fundamentals',
  },
  {
    id: 'project-tracker',
    title: 'Project Tracker',
    description: 'Keep your product initiatives on track with this template',
    icon: <LineChart className="w-8 h-8" />,
    color: 'from-lime-200 to-green-200',
    borderColor: 'border-lime-300',
    shadowColor: 'rgba(132,204,22,0.3)',
    category: 'PM Fundamentals',
  },
  {
    id: 'user-research-guide',
    title: 'User Research Guide',
    description: 'Follow this guide for effective user research projects',
    icon: <Users className="w-8 h-8" />,
    color: 'from-teal-200 to-emerald-200',
    borderColor: 'border-teal-300',
    shadowColor: 'rgba(20,184,166,0.3)',
    category: 'PM Fundamentals',
  },
];

const categories = [
  { name: 'Career Prep', emoji: '🎯' },
  { name: 'Portfolio', emoji: '🎨' },
  { name: 'Networking', emoji: '🤝' },
  { name: 'Job Search', emoji: '💼' },
  { name: 'Interview Prep', emoji: '🎤' },
  { name: 'Compensation', emoji: '💰' },
  { name: 'PM Fundamentals', emoji: '📚' },
];

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

const PMResourcesPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const handleResourceClick = (resource: Resource) => {
    setSelectedResource(resource);
    setModalOpen(true);

    // Track resource click in background - non-blocking
    setTimeout(() => {
      try {
        const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/resources';
        const referrer = typeof window !== 'undefined' ? document.referrer : '';
        let referrerDomain: string | null = null;
        if (referrer) {
          try {
            referrerDomain = new URL(referrer).hostname;
          } catch {
            referrerDomain = null;
          }
        }
        const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

        trackEventWithContext('User Clicked PM Resource Card', {
          'Page Route': pageRoute,
          'Resource ID': resource.id,
          'Resource Title': resource.title,
          'Resource Category': resource.category,
          'Resource Description': resource.description,
          'Click Location': 'Resources Landing Page',
          'Referrer URL': referrer || 'None',
          'Referrer Domain': referrerDomain || 'None',
          'UTM Source': urlParams?.get('utm_source') || null,
          'UTM Medium': urlParams?.get('utm_medium') || null,
          'UTM Campaign': urlParams?.get('utm_campaign') || null,
        });
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Resource click tracking error (non-blocking):', error);
        }
      }
    }, 0);
  };

  const getModalContent = () => {
    if (selectedResource) {
      return {
        title: 'Unlock PM Resources',
        description: `Sign up to access "${selectedResource.title}" and 20+ other PM templates, guides, and tools. It's completely free to get started!`,
      };
    }
    return {
      title: 'Unlock All PM Resources',
      description: "Sign up to access 20+ PM templates, guides, and tools. It's completely free to get started!",
    };
  };

  const modalContent = getModalContent();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100">
      <PageTracking pageName="PM Resources Landing Page" />

      <div className="max-w-7xl mx-auto px-4 py-6 sm:p-8 md:p-12 lg:p-16">

        {/* Hero Section */}
        <div className="flex justify-center mb-12 md:mb-20 relative">
          <div className="hidden md:block absolute -top-8 -left-8 w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 opacity-20 blur-2xl animate-pulse"></div>
          <div className="hidden md:block absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 opacity-20 blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>

          <div className="w-full max-w-4xl relative z-10">
            <div className="p-5 sm:p-8 md:p-12 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[3rem] bg-gradient-to-br from-amber-200 to-orange-200 shadow-[0_12px_0_0_rgba(245,158,11,0.3)] md:shadow-[0_20px_0_0_rgba(245,158,11,0.3)] border-2 border-amber-300 relative overflow-hidden">
              <div className="relative z-10">
                {/* Badge */}
                <div className="flex justify-center gap-4 mb-4 sm:mb-6 flex-wrap">
                  <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/80 backdrop-blur-sm border-2 border-amber-300 shadow-lg">
                    <span className="text-xs sm:text-sm font-bold text-amber-700">
                      📚 20+ Essential Resources
                    </span>
                  </div>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-br from-amber-700 to-orange-600 bg-clip-text text-transparent mb-4 sm:mb-6 leading-tight text-center">
                  PM Resources & Templates
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-gray-700 font-semibold mb-6 sm:mb-8 text-center max-w-3xl mx-auto">
                  Battle-tested guides, templates, and frameworks used by PMs at top tech companies. Everything you need to accelerate your career.
                </p>

                {/* Stats highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div className="text-center p-3 sm:p-4 rounded-[1rem] sm:rounded-[1.5rem] bg-white/60 backdrop-blur-sm border-2 border-amber-200">
                    <div className="text-2xl sm:text-3xl font-black text-amber-700 mb-1">20+</div>
                    <p className="text-xs sm:text-sm font-bold text-gray-700">Templates & Guides</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 rounded-[1rem] sm:rounded-[1.5rem] bg-white/60 backdrop-blur-sm border-2 border-orange-200">
                    <div className="text-2xl sm:text-3xl font-black text-orange-700 mb-1">7</div>
                    <p className="text-xs sm:text-sm font-bold text-gray-700">Career Categories</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 rounded-[1rem] sm:rounded-[1.5rem] bg-white/60 backdrop-blur-sm border-2 border-amber-200">
                    <div className="text-2xl sm:text-3xl font-black text-amber-700 mb-1">Free</div>
                    <p className="text-xs sm:text-sm font-bold text-gray-700">Trial to start</p>
                  </div>
                </div>

                <TrackedButton
                  href="/auth/sign-up"
                  className="block w-full px-6 py-4 sm:px-10 sm:py-6 rounded-[1.5rem] sm:rounded-[2rem] bg-gradient-to-br from-amber-500 to-orange-500 shadow-[0_8px_0_0_rgba(245,158,11,0.6)] sm:shadow-[0_10px_0_0_rgba(245,158,11,0.6)] border-2 border-amber-600 hover:translate-y-1 hover:shadow-[0_4px_0_0_rgba(245,158,11,0.6)] sm:hover:shadow-[0_6px_0_0_rgba(245,158,11,0.6)] text-lg sm:text-xl font-black text-white transition-all duration-200 text-center mb-3 sm:mb-4"
                  eventName="User Clicked Get Access Button"
                  buttonId="resources-landing-hero-cta"
                  eventProperties={{
                    'Button Section': 'Hero Section',
                    'Button Position': 'Center of Hero Card',
                    'Button Type': 'Primary CTA',
                    'Button Text': 'Get Free Access →',
                    'Button Context': 'Below headline and stats highlights',
                    'Page Section': 'Above the fold',
                  }}
                >
                  Get Free Access →
                </TrackedButton>
                <p className="text-center text-xs sm:text-sm text-gray-600 font-medium">
                  Join thousands of PMs using these resources
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Value Proposition Callout */}
        <div className="mb-12 md:mb-20">
          <div className="p-6 sm:p-8 md:p-12 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[3rem] bg-gradient-to-br from-slate-800 to-slate-900 shadow-[0_10px_0_0_rgba(15,23,42,0.4)] md:shadow-[0_15px_0_0_rgba(15,23,42,0.4)] border-2 border-slate-700 text-center">
            <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight">
              Stop Reinventing the Wheel
            </p>
          </div>
        </div>

        {/* Why These Resources Section */}
        <div className="mb-12 md:mb-20">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-800 mb-3 md:mb-4">
              Why These Resources Matter
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 font-medium px-2">
              The difference between struggling and succeeding is having the right tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            <div className="p-5 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-amber-200 to-orange-200 shadow-[0_8px_0_0_rgba(245,158,11,0.3)] md:shadow-[0_12px_0_0_rgba(245,158,11,0.3)] border-2 border-amber-300">
              <span className="text-4xl sm:text-5xl mb-4 sm:mb-6 block">⏰</span>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-4">
                Save Hours of Work
              </h3>
              <p className="text-sm sm:text-base text-gray-700 font-medium">
                Don't waste time creating templates from scratch. Use battle-tested formats that work, so you can focus on what matters—landing your dream role.
              </p>
            </div>

            <div className="p-5 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-sky-200 to-blue-200 shadow-[0_8px_0_0_rgba(14,165,233,0.3)] md:shadow-[0_12px_0_0_rgba(14,165,233,0.3)] border-2 border-sky-300">
              <span className="text-4xl sm:text-5xl mb-4 sm:mb-6 block">🎯</span>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-4">
                Proven Frameworks
              </h3>
              <p className="text-sm sm:text-base text-gray-700 font-medium">
                These aren't generic templates. They're the exact frameworks used by PMs who've landed roles at FAANG companies and gotten promoted fast.
              </p>
            </div>

            <div className="p-5 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-violet-200 to-purple-200 shadow-[0_8px_0_0_rgba(139,92,246,0.3)] md:shadow-[0_12px_0_0_rgba(139,92,246,0.3)] border-2 border-violet-300">
              <span className="text-4xl sm:text-5xl mb-4 sm:mb-6 block">📈</span>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-4">
                Complete Coverage
              </h3>
              <p className="text-sm sm:text-base text-gray-700 font-medium">
                From resume building to salary negotiation, from interview prep to on-the-job success—we've got every stage of your PM journey covered.
              </p>
            </div>

            <div className="p-5 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-rose-200 to-pink-200 shadow-[0_8px_0_0_rgba(244,63,94,0.3)] md:shadow-[0_12px_0_0_rgba(244,63,94,0.3)] border-2 border-rose-300">
              <span className="text-4xl sm:text-5xl mb-4 sm:mb-6 block">✨</span>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-4">
                Always Updated
              </h3>
              <p className="text-sm sm:text-base text-gray-700 font-medium">
                The PM landscape changes fast. Our resources are continuously updated to reflect the latest best practices and industry standards.
              </p>
            </div>
          </div>
        </div>

        {/* Resource Categories Overview */}
        <div className="mb-12 md:mb-20">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-800 mb-3 md:mb-4">
              Resources for Every Stage
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 font-medium px-2">
              Whether you're job hunting or crushing it in your role, we've got you covered.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {categories.map((category) => (
              <div
                key={category.name}
                className="p-4 sm:p-5 rounded-[1.5rem] bg-white/80 backdrop-blur-sm border-2 border-gray-200 shadow-[0_6px_0_0_rgba(0,0,0,0.08)] text-center"
              >
                <span className="text-3xl sm:text-4xl mb-2 block">{category.emoji}</span>
                <p className="text-sm sm:text-base font-bold text-gray-800">{category.name}</p>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  {resources.filter((r) => r.category === category.name).length} resources
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Resources Grid */}
        <div className="mb-12 md:mb-20">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-800 mb-3 md:mb-4">
              Browse All Resources
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 font-medium px-2">
              Click any resource to unlock instant access
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {resources.map((resource) => (
              <button
                key={resource.id}
                onClick={() => handleResourceClick(resource)}
                className={`block w-full text-left p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] bg-gradient-to-br ${resource.color} border-2 ${resource.borderColor} hover:translate-y-1 transition-all duration-200 cursor-pointer`}
                style={{
                  boxShadow: `0 10px 0 0 ${resource.shadowColor}`,
                }}
                aria-label={`Learn more about ${resource.title}`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleResourceClick(resource);
                  }
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-gray-700">{resource.icon}</div>
                  <span className="text-xs font-bold text-gray-500 bg-white/50 px-2 py-1 rounded-full">
                    {resource.category}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">{resource.title}</h3>
                <p className="text-sm text-gray-700 font-medium mb-4">{resource.description}</p>
                <span className="text-sm font-black text-gray-800 inline-flex items-center gap-1">
                  Unlock Resource →
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Mid-page CTA */}
        <div className="mb-12 md:mb-20">
          <div className="p-5 sm:p-8 md:p-12 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[3rem] bg-gradient-to-br from-amber-500 to-orange-500 shadow-[0_10px_0_0_rgba(245,158,11,0.5)] md:shadow-[0_15px_0_0_rgba(245,158,11,0.5)] border-2 border-amber-600 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-4">
              Ready to Level Up?
            </h2>
            <p className="text-base sm:text-lg text-amber-100 font-medium mb-6 max-w-2xl mx-auto">
              Get instant access to all 20+ PM resources, plus courses, AI tools, and more.
            </p>
            <TrackedButton
              href="/auth/sign-up"
              className="inline-block px-8 py-4 sm:px-12 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] bg-white shadow-[0_6px_0_0_rgba(0,0,0,0.2)] border-2 border-gray-200 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(0,0,0,0.2)] text-lg sm:text-xl font-black text-amber-600 transition-all duration-200"
              eventName="User Clicked Get Access Button"
              buttonId="resources-landing-mid-page-cta"
              eventProperties={{
                'Button Section': 'Mid-Page CTA Section',
                'Button Position': 'Center of CTA Card',
                'Button Type': 'Primary CTA',
                'Button Text': 'Get Free Access →',
                'Button Context': 'After resources grid',
                'Page Section': 'Below the fold',
              }}
            >
              Get Free Access →
            </TrackedButton>
          </div>
        </div>

        {/* What's Included Section */}
        <div className="mb-12 md:mb-20">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-800 mb-3 md:mb-4">
              More Than Just Templates
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 font-medium px-2">
              Your PM Resources subscription includes everything you need
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="p-5 sm:p-6 md:p-8 rounded-[1.5rem] sm:rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Editable Templates</h3>
              <p className="text-sm text-gray-600 font-medium">
                All templates are Google Docs/Sheets that you can copy and customize for your needs.
              </p>
            </div>

            <div className="p-5 sm:p-6 md:p-8 rounded-[1.5rem] sm:rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">120+ Video Lessons</h3>
              <p className="text-sm text-gray-600 font-medium">
                Access our comprehensive PM course library covering interviews, career growth, and fundamentals.
              </p>
            </div>

            <div className="p-5 sm:p-6 md:p-8 rounded-[1.5rem] sm:rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">AI-Powered Tools</h3>
              <p className="text-sm text-gray-600 font-medium">
                Resume optimization, company research, and interview prep—all powered by AI.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-12 md:mb-20">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-800 mb-3 md:mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3 sm:space-y-4 max-w-3xl mx-auto">
            <FAQItem
              question="Are these resources really free?"
              answer="You get access to all resources with a free trial! After that, they're included in our Learn plan ($12/mo) or Accelerate plan ($20/mo) which includes everything else."
            />

            <FAQItem
              question="Can I download and edit the templates?"
              answer="Yes! All templates are Google Docs and Sheets. You can make a copy to your own Google Drive and customize them however you want."
            />

            <FAQItem
              question="How often are resources updated?"
              answer="We continuously update our resources based on feedback and industry changes. When we add new templates or update existing ones, you get access immediately."
            />

            <FAQItem
              question="What if I'm new to Product Management?"
              answer="Perfect! Our resources are designed for PMs at all levels. The PM Terminology Glossary and Software Guide are great starting points for beginners."
            />

            <FAQItem
              question="Do I get support if I have questions?"
              answer="Absolutely! All subscribers get access to our community and support. We're here to help you succeed."
            />
          </div>
        </div>

        {/* Final CTA */}
        <div className="p-5 sm:p-8 md:p-12 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[3rem] bg-gradient-to-br from-slate-800 to-slate-900 shadow-[0_12px_0_0_rgba(15,23,42,0.5)] md:shadow-[0_20px_0_0_rgba(15,23,42,0.5)] border-2 border-slate-700 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 sm:mb-6">
            Your PM Toolkit Awaits
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 font-medium mb-6 sm:mb-8 max-w-3xl mx-auto px-2">
            Stop wasting time searching for templates and frameworks. Get everything you need in one place and accelerate your PM career today.
          </p>
          <TrackedButton
            href="/auth/sign-up"
            className="inline-block px-8 py-4 sm:px-10 sm:py-5 md:px-14 md:py-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 shadow-[0_6px_0_0_rgba(245,158,11,0.7)] sm:shadow-[0_8px_0_0_rgba(245,158,11,0.7)] md:shadow-[0_10px_0_0_rgba(245,158,11,0.7)] border-2 border-amber-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(245,158,11,0.7)] sm:hover:shadow-[0_4px_0_0_rgba(245,158,11,0.7)] md:hover:shadow-[0_6px_0_0_rgba(245,158,11,0.7)] text-base sm:text-lg md:text-xl font-black text-white transition-all duration-200 mb-4 sm:mb-6"
            eventName="User Clicked Get Access Button"
            buttonId="resources-landing-final-cta"
            eventProperties={{
              'Button Section': 'Final CTA Section',
              'Button Position': 'Center of Final CTA Card',
              'Button Type': 'Final CTA',
              'Button Text': 'GET FREE ACCESS NOW →',
              'Button Context': 'After FAQ section, bottom of page',
              'Page Section': 'Below the fold',
            }}
          >
            GET FREE ACCESS NOW →
          </TrackedButton>
          <p className="text-sm sm:text-base text-gray-400 font-medium px-2">
            Free trial included • Cancel anytime
          </p>
        </div>
      </div>

      {/* Sign Up Modal */}
      <SignUpModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalContent.title}
        description={modalContent.description}
      />
    </div>
  );
};

export default PMResourcesPage;


