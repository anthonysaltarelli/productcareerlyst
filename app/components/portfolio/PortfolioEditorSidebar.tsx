'use client';

import { Settings, User, FileText, ArrowLeft, Eye, EyeOff, ExternalLink, Copy, Check, Globe } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

export type PortfolioSection = 'profile' | 'about' | 'content';

interface PortfolioEditorSidebarProps {
  selectedSection: PortfolioSection;
  onSectionChange: (section: PortfolioSection) => void;
  onBack: () => void;
  portfolioSlug: string;
  portfolioName: string;
  isPublished: boolean;
  onPublishToggle: () => void;
  categoriesCount: number;
  pagesCount: number;
}

// ============================================================================
// Section Configuration
// ============================================================================

const sections = [
  {
    id: 'profile' as const,
    label: 'Profile & Settings',
    icon: Settings,
    description: 'Name, URL, visibility',
  },
  {
    id: 'about' as const,
    label: 'About',
    icon: User,
    description: 'Bio, social links, experience',
  },
  {
    id: 'content' as const,
    label: 'Content',
    icon: FileText,
    description: 'Case studies, categories',
  },
];

// ============================================================================
// Main Component
// ============================================================================

export const PortfolioEditorSidebar = ({
  selectedSection,
  onSectionChange,
  onBack,
  portfolioSlug,
  portfolioName,
  isPublished,
  onPublishToggle,
  categoriesCount,
  pagesCount,
}: PortfolioEditorSidebarProps) => {
  const [justCopied, setJustCopied] = useState(false);

  const portfolioUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${portfolioSlug}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(portfolioUrl);
      setJustCopied(true);
      toast.success('Portfolio link copied!');
      setTimeout(() => setJustCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-slate-200 p-4">
        <div className="mb-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex-shrink-0 rounded-lg p-2 transition-all hover:bg-slate-100"
            aria-label="Back to portfolios"
            type="button"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold text-gray-800">{portfolioName}</h1>
            <p className="truncate text-sm text-gray-500">Portfolio Editor</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          {/* Publish Toggle */}
          <button
            onClick={onPublishToggle}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              isPublished
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            type="button"
            aria-label={isPublished ? 'Unpublish portfolio' : 'Publish portfolio'}
          >
            {isPublished ? (
              <>
                <Eye className="h-4 w-4" />
                <span>Published</span>
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4" />
                <span>Draft</span>
              </>
            )}
          </button>

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-200"
            type="button"
            aria-label="Copy portfolio link"
          >
            {justCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>

        {/* Preview & View Live Links */}
        <div className="mt-3 flex gap-2">
          <a
            href={`/p/${portfolioSlug}?preview=true`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-700 transition-all hover:bg-amber-200"
          >
            <Eye className="h-4 w-4" />
            Preview
          </a>
          {isPublished && (
            <a
              href={`/p/${portfolioSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-sm font-medium text-purple-700 transition-all hover:bg-purple-200"
            >
              <ExternalLink className="h-4 w-4" />
              View Live
            </a>
          )}
        </div>

        {/* Portfolio URL */}
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
          <Globe className="h-4 w-4 flex-shrink-0 text-gray-400" />
          <span className="truncate text-xs text-gray-500">/p/{portfolioSlug}</span>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const isSelected = selectedSection === section.id;
            
            // Show item count for Content section
            let itemCount: number | undefined;
            if (section.id === 'content') {
              itemCount = pagesCount;
            }

            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                  isSelected
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50 hover:shadow-sm'
                }`}
                type="button"
              >
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                    isSelected ? 'bg-white/20' : 'bg-gray-100'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                      {section.label}
                    </span>
                    {itemCount !== undefined && itemCount > 0 && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {itemCount}
                      </span>
                    )}
                  </div>
                  <span className={`text-sm ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                    {section.description}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Stats */}
      <div className="border-t border-slate-200 p-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-2xl font-bold text-gray-800">{categoriesCount}</p>
            <p className="text-xs text-gray-500">Categories</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-2xl font-bold text-gray-800">{pagesCount}</p>
            <p className="text-xs text-gray-500">Pages</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioEditorSidebar;

