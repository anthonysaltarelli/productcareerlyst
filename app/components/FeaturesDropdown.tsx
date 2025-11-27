'use client';

import { useState, useRef, useEffect } from 'react';
import { TrackedLink } from './TrackedLink';

interface FeatureItem {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  linkId: string;
  eventName: string;
}

interface FeatureCategory {
  label: string;
  items: FeatureItem[];
}

const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    label: 'CAREER TOOLS',
    items: [
      {
        href: '/resume',
        title: 'Resume Builder',
        description: 'Create ATS-friendly resumes with AI assistance',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
        linkId: 'navigation-features-resume-link',
        eventName: 'User Clicked Resume Link',
      },
      {
        href: '/portfolio',
        title: 'Product Portfolio',
        description: 'Showcase your PM work with beautiful case studies',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        ),
        linkId: 'navigation-features-portfolio-link',
        eventName: 'User Clicked Portfolio Link',
      },
      {
        href: '/job-center',
        title: 'Job Center',
        description: 'Track applications and discover PM opportunities',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        ),
        linkId: 'navigation-features-job-center-link',
        eventName: 'User Clicked Job Center Link',
      },
    ],
  },
  {
    label: 'LEARNING',
    items: [
      {
        href: '/courses',
        title: 'PM Courses',
        description: 'Master product management with expert-led training',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        ),
        linkId: 'navigation-features-courses-link',
        eventName: 'User Clicked Courses Link',
      },
    ],
  },
];

export const FeaturesDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    // Small delay to allow moving to dropdown without closing
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger Button */}
      <button
        type="button"
        className="flex items-center gap-1.5 px-6 py-3 rounded-[1.5rem] font-bold text-gray-700 hover:bg-white/50 transition-all duration-200"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="true"
        tabIndex={0}
      >
        Features
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      <div
        className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 transition-all duration-200 ${
          isOpen
            ? 'opacity-100 visible translate-y-0'
            : 'opacity-0 invisible -translate-y-2'
        }`}
        role="menu"
        aria-orientation="vertical"
      >
        {/* Arrow pointer */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-l border-t border-purple-200" />
        
        {/* Content */}
        <div className="relative bg-white rounded-2xl shadow-xl border-2 border-purple-200 p-6 min-w-[540px]">
          <div className="grid grid-cols-2 gap-8">
            {FEATURE_CATEGORIES.map((category) => (
              <div key={category.label}>
                {/* Category Label */}
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                  {category.label}
                </p>
                
                {/* Feature Items */}
                <div className="space-y-1">
                  {category.items.map((item) => (
                    <TrackedLink
                      key={item.href}
                      href={item.href}
                      linkId={item.linkId}
                      eventName={item.eventName}
                      eventProperties={{
                        'Link Section': 'Navigation Features Dropdown',
                        'Link Position': `${category.label} column`,
                        'Link Type': 'Feature Dropdown Item',
                        'Link Text': item.title,
                        'Link Context': `Features dropdown - ${category.label}`,
                      }}
                      className="group flex items-start gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-200"
                      onClick={() => setIsOpen(false)}
                    >
                      {/* Icon */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-purple-600 group-hover:from-purple-200 group-hover:to-pink-200 transition-colors duration-200">
                        {item.icon}
                      </div>
                      
                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 group-hover:text-purple-700 transition-colors duration-200">
                          {item.title}
                        </p>
                        <p className="text-sm text-gray-500 leading-snug">
                          {item.description}
                        </p>
                      </div>
                    </TrackedLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

