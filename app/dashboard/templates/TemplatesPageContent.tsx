'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { TrackedLink } from '@/app/components/TrackedLink';
import { TemplatesPageTracking } from '@/app/components/TemplatesPageTracking';
import { PremiumResourceGate } from '@/app/components/PremiumResourceGate';
import { trackEvent } from '@/lib/amplitude/client';
import { getDashboardTrackingContext } from '@/lib/utils/dashboard-tracking-context';
import {
  getResourceId,
  getResourceCategory,
  getResourceType,
  getResourceFormat,
  getGridPosition,
  isAboveFold,
  getDeviceType,
} from '@/lib/utils/template-resource-utils';
import type { DashboardStats } from '@/app/api/dashboard/stats/route';

interface Subscription {
  plan: 'learn' | 'accelerate' | null;
  status: string | null;
  isActive: boolean;
}

interface TemplatesPageContentProps {
  stats: DashboardStats | null;
  subscription: Subscription | null;
  userCreatedAt?: string | null;
}

interface Resource {
  title: string;
  description: string;
  url: string;
  icon: string;
  color: string;
  borderColor: string;
  shadowColor: string;
}

// Map resource titles to baseline action triggers
const RESOURCE_BASELINE_TRIGGERS: Record<string, string> = {
  'Resume Guide': 'resume_guide_accessed',
  'PM Interview Frameworks': 'interview_frameworks_accessed',
  'Negotiation Scripts': 'negotiation_scripts_accessed',
  'Product Requirements Doc (PRD)': 'prd_template_accessed',
  'Networking Scripts': 'networking_scripts_accessed',
  'My 8 Stories': 'behavioral_prep_completed',
};

const resources: Resource[] = [
  {
    title: 'Resume Guide',
    description: 'View keywords to include and generally PM resume tips & tricks',
    url: 'https://docs.google.com/document/d/1TgMhFSh1PLJ4q8rSskt7iQi4GzaNzDgUA5Gt7HH0o5c/edit',
    icon: '📄',
    color: 'from-blue-200 to-cyan-200',
    borderColor: 'border-blue-300',
    shadowColor: 'rgba(37,99,235,0.3)',
  },
  {
    title: 'Case Study Template',
    description: 'Use this template as you build your Product Portfolio case studies',
    url: 'https://docs.google.com/document/d/1c2RO866_VMP1UcHagka9agOz8wUeCdJjfmy4LicQ01o/edit#heading=h.2fjp59d97orb',
    icon: '📋',
    color: 'from-purple-200 to-pink-200',
    borderColor: 'border-purple-300',
    shadowColor: 'rgba(147,51,234,0.3)',
  },
  {
    title: 'Figma Graphic Templates',
    description: 'Edit pre-made user journey and graphics for your Portfolio',
    url: 'https://www.figma.com/file/fk0PJS7fZtWxBLg5eE0iF6/Product-Portfolio-Pro-Templates?node-id=0%3A1&t=kWeA9R5gayq3qDrB-1',
    icon: '🎨',
    color: 'from-pink-200 to-rose-200',
    borderColor: 'border-pink-300',
    shadowColor: 'rgba(236,72,153,0.3)',
  },
  {
    title: 'Networking Scripts',
    description: 'Get the exact scripts that convert to informational calls and referrals',
    url: 'https://docs.google.com/document/d/1T7LYwjsuH8gdjJq4ggLpgfvuBP85fcJOgnibI0jtTdM/edit',
    icon: '💬',
    color: 'from-green-200 to-emerald-200',
    borderColor: 'border-green-300',
    shadowColor: 'rgba(22,163,74,0.3)',
  },
  {
    title: 'Find Contacts Guide',
    description: 'Learn how to find important Product folks on LinkedIn',
    url: 'https://docs.google.com/document/d/11TIOe5plhFVjyDhynVGAQs5MVVz6QsdPCXupaMeLO-E/edit',
    icon: '🔍',
    color: 'from-teal-200 to-cyan-200',
    borderColor: 'border-teal-300',
    shadowColor: 'rgba(20,184,166,0.3)',
  },
  {
    title: 'Company Red Flags',
    description: 'Watch out for these Red Flags when considering a company',
    url: 'https://docs.google.com/document/d/1BVr0zFRQOh0YJYe3KMzYssVLpxWO1IgM0KIzMYMSF7k/edit',
    icon: '🚩',
    color: 'from-red-200 to-rose-200',
    borderColor: 'border-red-300',
    shadowColor: 'rgba(239,68,68,0.3)',
  },
  {
    title: 'Job Application Checklist',
    description: 'Follow these steps to increase your chances of an offer',
    url: 'https://docs.google.com/document/d/1hONTPDVQnw8ki5Bg_5Rqohz0doTcBB4_xw4rcVv0IrE/edit',
    icon: '✅',
    color: 'from-yellow-200 to-amber-200',
    borderColor: 'border-yellow-300',
    shadowColor: 'rgba(245,158,11,0.3)',
  },
  {
    title: 'My 8 Stories',
    description: 'Prepare for Behavioral PM interviews with this worksheet',
    url: 'https://docs.google.com/document/d/1gqH7oXT8GSp53yFc3cGeonzn5EkJXev_sfUYUO9oxkg/edit',
    icon: '📖',
    color: 'from-indigo-200 to-purple-200',
    borderColor: 'border-indigo-300',
    shadowColor: 'rgba(99,102,241,0.3)',
  },
  {
    title: 'Interview Prep',
    description: 'Be prepared for every PM interview you have',
    url: 'https://docs.google.com/document/d/12qwhC74AqdbP6ExlQggMDv2XETCR7Yd3LUYebF2SeO8/edit',
    icon: '🎯',
    color: 'from-violet-200 to-purple-200',
    borderColor: 'border-violet-300',
    shadowColor: 'rgba(124,58,237,0.3)',
  },
  {
    title: 'PM Interview Frameworks',
    description: 'Cheatsheet all the most powerful and relevant frameworks',
    url: 'https://docs.google.com/document/d/1qDLPAQGgV3RkseyjvXYZbQFqbUF3nMb9AQm4FjqsXyY',
    icon: '🧩',
    color: 'from-fuchsia-200 to-pink-200',
    borderColor: 'border-fuchsia-300',
    shadowColor: 'rgba(217,70,239,0.3)',
  },
  {
    title: 'Questions & Answers',
    description: 'View dozens of potential interview questions and answers',
    url: 'https://docs.google.com/document/d/18NHHSmKziFwbMLbIuZDA88PAEWM8YJkYFCIJZOUVF2I',
    icon: '❓',
    color: 'from-orange-200 to-yellow-200',
    borderColor: 'border-orange-300',
    shadowColor: 'rgba(234,88,12,0.3)',
  },
  {
    title: 'Offer Calculator',
    description: 'Use this calculator to increase your total compensation',
    url: 'https://docs.google.com/spreadsheets/d/10ZJVW9ME0JduJDs2b6ot3f_VAuFaEJmpQyNpVWe-oGY/edit?gid=0#gid=0',
    icon: '💰',
    color: 'from-emerald-200 to-green-200',
    borderColor: 'border-emerald-300',
    shadowColor: 'rgba(16,185,129,0.3)',
  },
  {
    title: 'Negotiation Scripts',
    description: 'Get the exact scripts you can use to increase your compensation',
    url: 'https://docs.google.com/document/d/1Tu77g5QTQ7CyHCrUhmnXFPaW389QdIuuM3uavGajc1M/edit',
    icon: '💼',
    color: 'from-slate-200 to-gray-200',
    borderColor: 'border-slate-300',
    shadowColor: 'rgba(71,85,105,0.3)',
  },
  {
    title: 'Product Requirements Doc (PRD)',
    description: 'Get started on a product initiative with this template',
    url: 'https://docs.google.com/document/d/12zR--P3Pe6E1znDH4PYTNJ5lgDtmeov2RPC9fmg_Dm8',
    icon: '📝',
    color: 'from-cyan-200 to-blue-200',
    borderColor: 'border-cyan-300',
    shadowColor: 'rgba(6,182,212,0.3)',
  },
  {
    title: 'Jira Ticket Templates',
    description: 'Improve your team\'s effectiveness by standardizing your tickets',
    url: 'https://docs.google.com/document/d/11ucJ6ls2PzuO7UdtOgXx0crZjae7_noR74BpTn7l9ok/',
    icon: '🎫',
    color: 'from-blue-200 to-indigo-200',
    borderColor: 'border-blue-300',
    shadowColor: 'rgba(59,130,246,0.3)',
  },
  {
    title: 'Roadmap Template',
    description: 'Organize your Roadmap into a visual tracker',
    url: 'https://docs.google.com/spreadsheets/d/1FAMgirb42Sp9N8tD8etDTxXn_fMRjYMl_zl7EZrpHu4/edit?gid=0#gid=0',
    icon: '🗺️',
    color: 'from-purple-200 to-indigo-200',
    borderColor: 'border-purple-300',
    shadowColor: 'rgba(147,51,234,0.3)',
  },
  {
    title: 'PM Terminology Glossary',
    description: 'Stuck on a concept? Look it up quickly and see an example',
    url: 'https://docs.google.com/document/d/1uYzYUJQyvx6jowhpYCjwkqNO0-2P31mTEnVnNGehEk4/edit',
    icon: '📚',
    color: 'from-amber-200 to-yellow-200',
    borderColor: 'border-amber-300',
    shadowColor: 'rgba(245,158,11,0.3)',
  },
  {
    title: 'Popular Metrics',
    description: 'Understand the most common KPIs used by product teams',
    url: 'https://docs.google.com/document/d/1h2rDM1Hx7Pwp_OC6oOssOdLhHKpfgjj6idyG5nEePLE/edit',
    icon: '📊',
    color: 'from-rose-200 to-pink-200',
    borderColor: 'border-rose-300',
    shadowColor: 'rgba(244,63,94,0.3)',
  },
  {
    title: 'Software Guide (Jira, Notion)',
    description: 'Learn the basis of popular PM software Jira & Notion',
    url: 'https://docs.google.com/document/d/1wJ8OQBiQxt5QCT_uMqIkBZYEd_rcCBCoo3wD3Q0tsAg',
    icon: '🛠️',
    color: 'from-sky-200 to-blue-200',
    borderColor: 'border-sky-300',
    shadowColor: 'rgba(14,165,233,0.3)',
  },
  {
    title: 'Project Tracker',
    description: 'Use this project tracker to keep your initiatives on track',
    url: 'https://docs.google.com/spreadsheets/d/1rK9ASRuKtvm2i22pmV59MUKdQoLJUbM1NDz5yMKLGOc/edit?gid=0#gid=0',
    icon: '📈',
    color: 'from-lime-200 to-green-200',
    borderColor: 'border-lime-300',
    shadowColor: 'rgba(132,204,22,0.3)',
  },
  {
    title: 'User Research / Interview Guide',
    description: 'Follow this guide for effective user research projects',
    url: 'https://docs.google.com/document/d/1SB7Qao94RvOlSWxl2QdYroE-ODNvccyx-3xRxOsC1k4',
    icon: '👥',
    color: 'from-teal-200 to-emerald-200',
    borderColor: 'border-teal-300',
    shadowColor: 'rgba(20,184,166,0.3)',
  },
];

export const TemplatesPageContent = ({
  stats,
  subscription,
  userCreatedAt,
}: TemplatesPageContentProps) => {
  // Session tracking state
  const [resourcesClickedThisSession, setResourcesClickedThisSession] = useState<string[]>([]);
  const [resourcesViewedThisSession, setResourcesViewedThisSession] = useState<Set<string>>(new Set());
  const [timeOnPage, setTimeOnPage] = useState(0);
  const [scrollDepth, setScrollDepth] = useState(0);
  const [lastResourceClicked, setLastResourceClicked] = useState<string | null>(null);
  const [scrollMilestonesReached, setScrollMilestonesReached] = useState<Set<number>>(new Set());
  const timeMilestonesReached = useRef<Set<number>>(new Set());
  const pageLoadTime = useRef<number>(Date.now());
  const resourceRefs = useRef<Map<string, HTMLElement>>(new Map());
  const hoverTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const scrollTracked = useRef(false);

  // Premium gate state
  const [showGateModal, setShowGateModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  // Check if user has access to premium resources (Learn or Accelerate plan)
  const hasAccess = subscription?.isActive && (subscription?.plan === 'learn' || subscription?.plan === 'accelerate');

  // Track template access on page load (existing functionality)
  useEffect(() => {
    const trackAccess = async () => {
      try {
        await fetch('/api/dashboard/track-template-access', {
          method: 'POST',
        });
      } catch (error) {
        // Silently fail - don't interrupt user experience
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to track template access:', error);
        }
      }
    };

    trackAccess();
  }, []);

  // Time on page tracking
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - pageLoadTime.current) / 1000);
      setTimeOnPage(elapsed);

      // Track time milestones: 30s, 60s, 120s, 300s
      const milestones = [30, 60, 120, 300];
      milestones.forEach((milestone) => {
        if (elapsed >= milestone && !timeMilestonesReached.current.has(milestone)) {
          timeMilestonesReached.current.add(milestone);
          
          const userStateContext = getDashboardTrackingContext(stats, subscription);
          
          setTimeout(() => {
            trackEvent('User Spent Time on PM Templates Page', {
              'Time on Page': elapsed,
              'Time Interval': milestone,
              'Resources Clicked': resourcesClickedThisSession.length,
              'Resources Viewed': resourcesViewedThisSession.size,
              'Scroll Depth Reached': scrollDepth,
              'Page Route': '/dashboard/templates',
              'Subscription Plan': subscription?.plan || null,
              'Is Subscription Active': subscription?.isActive || false,
              ...userStateContext,
            });
          }, 0);
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [stats, subscription, resourcesClickedThisSession.length, resourcesViewedThisSession.size, scrollDepth]);

  // Scroll depth tracking
  useEffect(() => {
    const handleScroll = () => {
      if (typeof window === 'undefined') return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const percentage = totalHeight > 0 ? Math.round((scrollTop / totalHeight) * 100) : 0;
      
      setScrollDepth(percentage);

      // Track scroll milestones: 25%, 50%, 75%, 100%
      const milestones = [25, 50, 75, 100];
      milestones.forEach((milestone) => {
        if (percentage >= milestone && !scrollMilestonesReached.has(milestone)) {
          setScrollMilestonesReached((prev) => new Set([...prev, milestone]));
          
          // Count resources visible in viewport
          let resourcesVisible = 0;
          resourceRefs.current.forEach((element) => {
            const rect = element.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            if (rect.top < viewportHeight && rect.bottom > 0) {
              resourcesVisible++;
            }
          });

          const userStateContext = getDashboardTrackingContext(stats, subscription);
          
          setTimeout(() => {
            trackEvent('User Scrolled PM Templates Page', {
              'Scroll Percentage': milestone,
              'Scroll Depth Pixels': scrollTop,
              'Total Page Height': document.documentElement.scrollHeight,
              'Viewport Height': window.innerHeight,
              'Time on Page': Math.floor((Date.now() - pageLoadTime.current) / 1000),
              'Resources Visible': resourcesVisible,
              'Resources Clicked Before Scroll': resourcesClickedThisSession.length,
              'Page Route': '/dashboard/templates',
              'Subscription Plan': subscription?.plan || null,
              ...userStateContext,
            });
          }, 0);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [stats, subscription, resourcesClickedThisSession.length, scrollMilestonesReached]);

  // Exit intent tracking
  useEffect(() => {
    const handleBeforeUnload = () => {
      const elapsed = Math.floor((Date.now() - pageLoadTime.current) / 1000);
        const userStateContext = getDashboardTrackingContext(stats, subscription);
        
        // Track exit (may not always fire on unload, but best effort)
        trackEvent('User Exited PM Templates Page', {
          'Time on Page': elapsed,
          'Resources Clicked': resourcesClickedThisSession.length,
          'Resources Viewed': resourcesViewedThisSession.size,
          'Scroll Depth Reached': scrollDepth,
          'Last Resource Clicked': lastResourceClicked,
          'Exit Method': 'Navigation',
          'Page Route': '/dashboard/templates',
          'Subscription Plan': subscription?.plan || null,
          'Is Subscription Active': subscription?.isActive || false,
          ...userStateContext,
        });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [stats, subscription, resourcesClickedThisSession.length, resourcesViewedThisSession.size, scrollDepth, lastResourceClicked]);

  // Resource viewport entry tracking (Intersection Observer)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.IntersectionObserver) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const resourceId = entry.target.getAttribute('data-resource-id');
            if (resourceId && !resourcesViewedThisSession.has(resourceId)) {
              setResourcesViewedThisSession((prev) => new Set([...prev, resourceId]));
              
              const resource = resources.find((r) => getResourceId(r.title) === resourceId);
              if (resource) {
                const elapsed = Math.floor((Date.now() - pageLoadTime.current) / 1000);
                const userStateContext = getDashboardTrackingContext(stats, subscription);
                
                setTimeout(() => {
                  trackEvent('User Viewed PM Template Resource Details', {
                    'Resource ID': resourceId,
                    'Resource Title': resource.title,
                    'Resource Category': getResourceCategory(resource.title),
                    'Resource Type': getResourceType(resource.url),
                    'Resource Grid Position': resources.findIndex((r) => r.title === resource.title) + 1,
                    'Interaction Type': 'Viewport Entry',
                    'Time on Page Before View': elapsed,
                    'Resources Previously Viewed This Session': resourcesViewedThisSession.size,
                    'Page Route': '/dashboard/templates',
                    'Subscription Plan': subscription?.plan || null,
                    'Is Subscription Active': subscription?.isActive || false,
                    ...userStateContext,
                  });
                }, 0);
              }
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    // Observe all resource cards
    resourceRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [stats, subscription, resourcesViewedThisSession]);

  // Get user state context for resource clicks
  const getUserStateContext = useCallback(() => {
    return getDashboardTrackingContext(stats, subscription);
  }, [stats, subscription]);

  // Check if first resource click ever
  const isFirstResourceClickEver = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem('first-resource-click-ever');
  }, []);

  // Check if first time clicking specific resource
  const isFirstTimeClickingResource = useCallback((resourceId: string) => {
    if (typeof window === 'undefined') return true;
    const clickedResources = JSON.parse(localStorage.getItem('clicked-resources') || '[]');
    return !clickedResources.includes(resourceId);
  }, []);

  // Get resource click event properties (used by TrackedLink)
  const getResourceClickProperties = useCallback((resource: Resource, index: number) => {
    const resourceId = getResourceId(resource.title);
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    const elapsed = Math.floor((Date.now() - pageLoadTime.current) / 1000);
    
    // Update session state
    const isFirstResourceClick = resourcesClickedThisSession.length === 0;
    const isFirstTimeThisResource = isFirstTimeClickingResource(resourceId);
    const isFirstResourceClickEver = isFirstResourceClick && isFirstTimeThisResource;
    
    // Mark as clicked in localStorage
    if (typeof window !== 'undefined') {
      if (isFirstResourceClickEver) {
        localStorage.setItem('first-resource-click-ever', 'true');
      }
      const clickedResources = JSON.parse(localStorage.getItem('clicked-resources') || '[]');
      if (!clickedResources.includes(resourceId)) {
        clickedResources.push(resourceId);
        localStorage.setItem('clicked-resources', JSON.stringify(clickedResources));
      }
    }

    // Get grid position
    const gridPos = getGridPosition(index, viewportWidth);
    const resourceElement = resourceRefs.current.get(resourceId);
    const isAbove = isAboveFold(resourceElement ?? null);

    // Get user state context
    const userStateContext = getUserStateContext();

    return {
      // Resource Identification
      'Resource ID': resourceId,
      'Resource Title': resource.title,
      'Resource Description': resource.description,
      'Resource Icon': resource.icon,
      'Resource URL': resource.url,
      
      // Resource Categorization
      'Resource Category': getResourceCategory(resource.title),
      'Resource Type': getResourceType(resource.url),
      'Resource Format': getResourceFormat(resource.title, resource.url),
      'Resource Color Scheme': resource.color,
      
      // Grid Position Context
      'Resource Grid Position': gridPos.position,
      'Resource Grid Row': gridPos.row,
      'Resource Grid Column': gridPos.column,
      'Resource Position in Viewport': isAbove ? 'Above Fold' : 'Below Fold',
      'Grid Layout': gridPos.gridLayout,
      
      // Click Context
      'Link Section': 'Resources Grid',
      'Link Position': `Row ${gridPos.row}, Column ${gridPos.column}`,
      'Link Text': 'Open Resource',
      'Link Type': 'Resource Card CTA',
      'Page Section': isAbove ? 'Above the fold' : 'Below the fold',
      
      // User State Context
      ...userStateContext,
      
      // Session Context
      'Is First Resource Click': isFirstResourceClick,
      'Is First Time Clicking This Resource': isFirstTimeThisResource,
      'Is First Resource Click Ever': isFirstResourceClickEver,
      'Resources Clicked This Session': resourcesClickedThisSession.length + 1,
      'Time on Page Before Click': elapsed,
      'Previous Resources Clicked This Session': resourcesClickedThisSession,
    };
  }, [resourcesClickedThisSession, getUserStateContext, isFirstTimeClickingResource]);

  // Handle resource click (update session state)
  const handleResourceClick = useCallback((resource: Resource, e?: React.MouseEvent) => {
    const resourceId = getResourceId(resource.title);
    setResourcesClickedThisSession((prev) => [...prev, resourceId]);
    setLastResourceClicked(resourceId);

    // If user doesn't have access, prevent navigation and show gate modal
    if (!hasAccess) {
      e?.preventDefault();
      setSelectedResource(resource);
      setShowGateModal(true);
      return;
    }

    // User has access - trigger baseline action if this resource has one
    const baselineTrigger = RESOURCE_BASELINE_TRIGGERS[resource.title];
    if (baselineTrigger) {
      // Fire and forget - don't block the navigation
      fetch('/api/goals/baseline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: baselineTrigger }),
      }).catch(() => {
        // Silently fail - baseline tracking should never block user experience
      });
    }
  }, [hasAccess]);

  // Handle resource hover
  const handleResourceHover = useCallback((resource: Resource, index: number) => {
    const resourceId = getResourceId(resource.title);
    
    // Start hover timer
    const timer = setTimeout(() => {
      if (!resourcesViewedThisSession.has(resourceId)) {
        setResourcesViewedThisSession((prev) => new Set([...prev, resourceId]));
        
        const elapsed = Math.floor((Date.now() - pageLoadTime.current) / 1000);
        const userStateContext = getUserStateContext();
        
        setTimeout(() => {
          trackEvent('User Viewed PM Template Resource Details', {
            'Resource ID': resourceId,
            'Resource Title': resource.title,
            'Resource Category': getResourceCategory(resource.title),
            'Resource Type': getResourceType(resource.url),
            'Resource Grid Position': index + 1,
            'Interaction Type': 'Hover',
            'Hover Duration': 2,
            'Time on Page Before View': elapsed,
            'Resources Previously Viewed This Session': resourcesViewedThisSession.size,
            'Page Route': '/dashboard/templates',
            'Subscription Plan': subscription?.plan || null,
            'Is Subscription Active': subscription?.isActive || false,
            ...userStateContext,
          });
        }, 0);
      }
    }, 2000);
    
    hoverTimers.current.set(resourceId, timer);
  }, [resourcesViewedThisSession, getUserStateContext, subscription]);

  // Handle resource hover end
  const handleResourceHoverEnd = useCallback((resourceId: string) => {
    const timer = hoverTimers.current.get(resourceId);
    if (timer) {
      clearTimeout(timer);
      hoverTimers.current.delete(resourceId);
    }
  }, []);

  return (
    <div className="p-8 md:p-12">
      {/* Page view tracking */}
      <TemplatesPageTracking
        stats={stats}
        subscription={subscription}
        userCreatedAt={userCreatedAt}
      />

      {/* Page Header */}
      <div className="mb-8">
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-pink-200 to-rose-200 shadow-[0_15px_0_0_rgba(236,72,153,0.3)] border-2 border-pink-300">
          <span className="text-5xl mb-4 block">📚</span>
          <h1 className="text-4xl md:text-5xl font-black text-gray-800 mb-3">
            PM Resources
          </h1>
          <p className="text-xl text-gray-700 font-semibold">
            Essential guides, templates, and tools for Product Managers
          </p>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource, index) => {
          const resourceId = getResourceId(resource.title);
          return (
            <div
              key={resourceId}
              ref={(el) => {
                if (el) {
                  resourceRefs.current.set(resourceId, el);
                } else {
                  resourceRefs.current.delete(resourceId);
                }
              }}
              data-resource-id={resourceId}
              onMouseEnter={() => handleResourceHover(resource, index)}
              onMouseLeave={() => handleResourceHoverEnd(resourceId)}
            >
              <TrackedLink
                href={hasAccess ? resource.url : '#'}
                target={hasAccess ? '_blank' : undefined}
                rel={hasAccess ? 'noopener noreferrer' : undefined}
                linkId={`templates-page-resource-${resourceId}`}
                eventName="User Clicked PM Template Resource"
                eventProperties={getResourceClickProperties(resource, index)}
                className={`block p-6 rounded-[2rem] bg-gradient-to-br ${resource.color} border-2 ${resource.borderColor} hover:translate-y-1 transition-all duration-200 cursor-pointer relative`}
                style={{
                  boxShadow: `0 10px 0 0 ${resource.shadowColor}`,
                  '--shadow-color': resource.shadowColor,
                } as React.CSSProperties & { '--shadow-color': string }}
                tabIndex={0}
                ariaLabel={hasAccess ? `Open ${resource.title}` : `Unlock ${resource.title}`}
                onClick={(e) => handleResourceClick(resource, e)}
              >
                {/* Lock badge for non-subscribers */}
                {!hasAccess && (
                  <div className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center border border-gray-200 shadow-sm">
                    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                )}
                <span className="text-4xl mb-3 block">{resource.icon}</span>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{resource.title}</h3>
                <p className="text-sm text-gray-700 font-medium mb-4">{resource.description}</p>
                <span className="text-sm font-black text-gray-800 hover:text-gray-900 inline-flex items-center gap-1">
                  {hasAccess ? (
                    <>
                      Open Resource
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </>
                  ) : (
                    <>
                      Unlock Resource
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </>
                  )}
                </span>
              </TrackedLink>
            </div>
          );
        })}
      </div>

      {/* Premium Resource Gate Modal */}
      {showGateModal && selectedResource && (
        <PremiumResourceGate
          resourceTitle={selectedResource.title}
          resourceId={getResourceId(selectedResource.title)}
          resourceCategory={getResourceCategory(selectedResource.title)}
          currentPlan={subscription?.plan || null}
          onClose={() => {
            setShowGateModal(false);
            setSelectedResource(null);
          }}
        />
      )}
    </div>
  );
};

