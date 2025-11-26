'use client';

import { ExternalLink, Sparkles } from 'lucide-react';
import { TrackedLink } from '@/app/components/TrackedLink';

// ============================================================================
// Types
// ============================================================================

interface FeaturedPortfolio {
  name: string;
  slug: string;
  subtitle: string;
}

// ============================================================================
// Hardcoded Featured Portfolios (will be dynamic later)
// ============================================================================

const FEATURED_PORTFOLIOS: FeaturedPortfolio[] = [
  {
    name: 'Anthony Saltarelli',
    slug: 'anthonysaltarelli',
    subtitle: 'Senior Product Manager',
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// ============================================================================
// Main Component
// ============================================================================

export const FeaturedPortfolioSection = () => {
  return (
    <div className="sticky top-6">
      {/* Section Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-bold text-gray-800">Featured Product Portfolios</h3>
        </div>
        <p className="text-xs text-gray-500">built on Product Careerlyst</p>
      </div>

      {/* Featured Portfolios List */}
      <div className="space-y-3">
        {FEATURED_PORTFOLIOS.map((portfolio) => (
          <FeaturedPortfolioCard key={portfolio.slug} portfolio={portfolio} />
        ))}
      </div>

    </div>
  );
};

// ============================================================================
// Featured Portfolio Card Component
// ============================================================================

interface FeaturedPortfolioCardProps {
  portfolio: FeaturedPortfolio;
}

const FeaturedPortfolioCard = ({ portfolio }: FeaturedPortfolioCardProps) => {
  const portfolioUrl = `/p/${portfolio.slug}`;
  const initials = getInitials(portfolio.name);

  return (
    <TrackedLink
      href={portfolioUrl}
      linkId={`featured-portfolio-${portfolio.slug}-link`}
      eventName="User Clicked Featured Portfolio Link"
      eventProperties={{
        'Link Section': 'Featured Portfolios Section',
        'Link Position': 'Right Sidebar',
        'Link Text': portfolio.name,
        'Link Type': 'Featured Portfolio Card',
        'Link Context': 'Featured Portfolio showcase in sidebar',
        'Link Destination': portfolioUrl,
        'Featured Portfolio Name': portfolio.name,
        'Featured Portfolio Slug': portfolio.slug,
        'Page Section': 'Above the fold',
      }}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200">
        {/* Avatar & Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-white">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 text-sm truncate group-hover:text-indigo-600 transition-colors">
              {portfolio.name}
            </h4>
            <p className="text-xs text-gray-500 truncate">
              {portfolio.subtitle}
            </p>
          </div>
          <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
        </div>
      </div>
    </TrackedLink>
  );
};
