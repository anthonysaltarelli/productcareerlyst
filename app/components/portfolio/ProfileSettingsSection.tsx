'use client';

import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Pencil,
  Globe,
  Eye,
  EyeOff,
  Copy,
  Check,
  Loader2,
  X,
  Save,
} from 'lucide-react';
import { Portfolio, PortfolioPage } from '@/lib/types/portfolio';

// ============================================================================
// Types
// ============================================================================

interface ProfileSettingsSectionProps {
  portfolio: Portfolio;
  pages: PortfolioPage[];
  onUpdate: () => void;
}

// ============================================================================
// Main Component
// ============================================================================

export const ProfileSettingsSection = ({
  portfolio,
  pages,
  onUpdate,
}: ProfileSettingsSectionProps) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    display_name: portfolio.display_name,
    subtitle: portfolio.subtitle || '',
    slug: portfolio.slug,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'same'>('same');
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync form data with portfolio prop
  useEffect(() => {
    setFormData({
      display_name: portfolio.display_name,
      subtitle: portfolio.subtitle || '',
      slug: portfolio.slug,
    });
  }, [portfolio]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingField && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingField]);

  const handleCopyPageLink = async (linkId: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLinkId(linkId);
      toast.success('Link copied!');
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleSave = async (field: string, value: string) => {
    // Validate required fields
    if (field === 'display_name' && !value.trim()) {
      toast.error('Display name is required');
      return;
    }
    if (field === 'subtitle' && !value.trim()) {
      toast.error('Subtitle is required. Your portfolio displays as "[Name] is a [subtitle]"');
      return;
    }
    if (field === 'slug' && slugStatus === 'taken') {
      toast.error('This URL is already taken');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/portfolio/manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update');
      }

      toast.success('Saved!');
      onUpdate();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save');
      // Revert on error
      setFormData((prev) => ({
        ...prev,
        [field]: portfolio[field as keyof Portfolio] || '',
      }));
    } finally {
      setIsSaving(false);
      setEditingField(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: string, value: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave(field, value);
    } else if (e.key === 'Escape') {
      setEditingField(null);
      setFormData((prev) => ({
        ...prev,
        [field]: portfolio[field as keyof Portfolio] || '',
      }));
    }
  };

  const checkSlug = async (newSlug: string) => {
    if (!newSlug) {
      setSlugStatus('idle');
      return;
    }
    
    if (newSlug === portfolio.slug) {
      setSlugStatus('same');
      return;
    }

    setSlugStatus('checking');
    try {
      const response = await fetch(`/api/portfolio/manage/check-slug?slug=${newSlug}`);
      const data = await response.json();
      setSlugStatus(data.available ? 'available' : 'taken');
    } catch {
      setSlugStatus('idle');
    }
  };

  const handleSlugChange = (value: string) => {
    const formatted = value.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    setFormData((prev) => ({ ...prev, slug: formatted }));
    checkSlug(formatted);
  };

  const handlePublishToggle = async () => {
    try {
      const response = await fetch('/api/portfolio/manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !portfolio.is_published }),
      });

      if (!response.ok) throw new Error('Failed to update');

      toast.success(
        portfolio.is_published
          ? 'Portfolio unpublished'
          : 'Portfolio published!'
      );
      onUpdate();
    } catch (error) {
      console.error('Error toggling publish:', error);
      toast.error('Failed to update publish status');
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6 md:p-8">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Profile & Settings</h2>
        <p className="mt-1 text-gray-500">Manage your portfolio's identity and visibility</p>
      </div>

      {/* Portfolio Title Card */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">Portfolio Title</h3>
        
        {/* Display Name */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-600">Display Name</label>
          {editingField === 'display_name' ? (
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, display_name: e.target.value }))}
                onKeyDown={(e) => handleKeyDown(e, 'display_name', formData.display_name)}
                className="flex-1 rounded-lg border-2 border-purple-400 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-200"
                placeholder="Your Name"
              />
              <button
                onClick={() => handleSave('display_name', formData.display_name)}
                disabled={isSaving}
                className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
                type="button"
              >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
              </button>
              <button
                onClick={() => {
                  setEditingField(null);
                  setFormData((prev) => ({ ...prev, display_name: portfolio.display_name }));
                }}
                className="rounded-lg bg-gray-100 px-4 py-2 text-gray-600 hover:bg-gray-200"
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingField('display_name')}
              className="group flex w-full items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-left hover:bg-gray-100"
              type="button"
            >
              <span className="text-gray-900">{formData.display_name || 'Add your name'}</span>
              <Pencil className="h-4 w-4 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          )}
        </div>

        {/* Subtitle */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-600">
            Subtitle
          </label>
          {editingField === 'subtitle' ? (
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
                onKeyDown={(e) => handleKeyDown(e, 'subtitle', formData.subtitle)}
                className="flex-1 rounded-lg border-2 border-purple-400 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-200"
                placeholder="Senior Product Manager in New York City"
              />
              <button
                onClick={() => handleSave('subtitle', formData.subtitle)}
                disabled={isSaving}
                className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
                type="button"
              >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
              </button>
              <button
                onClick={() => {
                  setEditingField(null);
                  setFormData((prev) => ({ ...prev, subtitle: portfolio.subtitle || '' }));
                }}
                className="rounded-lg bg-gray-100 px-4 py-2 text-gray-600 hover:bg-gray-200"
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingField('subtitle')}
              className="group flex w-full items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-left hover:bg-gray-100"
              type="button"
            >
              <span className={formData.subtitle ? 'text-gray-700' : 'italic text-gray-400'}>
                {formData.subtitle || 'Add your subtitle...'}
              </span>
              <Pencil className="h-4 w-4 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          )}
          {!formData.subtitle && (
            <p className="mt-2 text-sm text-amber-600">⚠️ Subtitle is required for your portfolio to display properly.</p>
          )}
        </div>

        {/* Live Preview */}
        <div className="mt-6 rounded-xl bg-gradient-to-br from-slate-50 to-purple-50 p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">Preview</p>
          <p className="text-xl text-gray-900">
            <span className="font-bold">{formData.display_name || 'Your Name'}</span>
            <span className="font-normal">
              {' '}is a {formData.subtitle ? `${formData.subtitle.charAt(0).toLowerCase()}${formData.subtitle.slice(1)}` : '...'}
              {formData.subtitle && !formData.subtitle.endsWith('.') && '.'}
            </span>
          </p>
        </div>
      </div>

      {/* URL Settings Card */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">Edit Portfolio URL</h3>
        
        {editingField === 'slug' ? (
          <div className="space-y-3">
            <div className="flex items-center">
              <span className="rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                productcareerlyst.com/p/
              </span>
              <input
                ref={inputRef}
                type="text"
                value={formData.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'slug', formData.slug)}
                className="flex-1 rounded-r-lg border-2 border-purple-400 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-200"
                placeholder="yourname"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                {slugStatus === 'checking' && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    <span className="text-gray-500">Checking availability...</span>
                  </>
                )}
                {slugStatus === 'available' && (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">Available!</span>
                  </>
                )}
                {slugStatus === 'taken' && (
                  <>
                    <X className="h-4 w-4 text-red-500" />
                    <span className="text-red-600">Already taken</span>
                  </>
                )}
                {slugStatus === 'same' && (
                  <span className="text-gray-500">Current URL</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingField(null);
                    setFormData((prev) => ({ ...prev, slug: portfolio.slug }));
                    setSlugStatus('same');
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSave('slug', formData.slug)}
                  disabled={isSaving || slugStatus === 'taken' || slugStatus === 'same' || slugStatus === 'checking'}
                  className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                  type="button"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Update URL
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setEditingField('slug')}
            className="group flex w-full items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-left hover:bg-gray-100"
            type="button"
          >
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">productcareerlyst.com/p/{portfolio.slug}</span>
            </div>
            <Pencil className="h-4 w-4 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        )}
      </div>

      {/* Visibility Card */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">Visibility</h3>
        
        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
          <div>
            <p className="font-medium text-gray-800">
              {portfolio.is_published ? 'Published' : 'Draft'}
            </p>
            <p className="text-sm text-gray-500">
              {portfolio.is_published
                ? 'Your portfolio is live and visible to everyone'
                : 'Your portfolio is hidden from the public'}
            </p>
          </div>
          <button
            onClick={handlePublishToggle}
            className={`flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-all ${
              portfolio.is_published
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
            }`}
            type="button"
          >
            {portfolio.is_published ? (
              <>
                <EyeOff className="h-5 w-5" />
                Unpublish
              </>
            ) : (
              <>
                <Eye className="h-5 w-5" />
                Publish
              </>
            )}
          </button>
        </div>
      </div>

      {/* Share Portfolio Card */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">Share Portfolio</h3>
        
        <div className="space-y-3">
          {/* Homepage Link */}
          <div className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-xs font-medium text-gray-500">Homepage</p>
              <p className="truncate text-sm text-gray-700">
                productcareerlyst.com/p/{portfolio.slug}
              </p>
            </div>
            <button
              onClick={() => handleCopyPageLink('homepage', `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${portfolio.slug}`)}
              className="flex-shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
              type="button"
              aria-label="Copy homepage link"
            >
              {copiedLinkId === 'homepage' ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Page Links */}
          {pages.map((page) => (
            <div
              key={page.id}
              className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-xs font-medium text-gray-500">{page.title}</p>
                <p className="truncate text-sm text-gray-700">
                  productcareerlyst.com/p/{portfolio.slug}/{page.slug}
                </p>
              </div>
              <button
                onClick={() => handleCopyPageLink(page.id, `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${portfolio.slug}/${page.slug}`)}
                className="flex-shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                type="button"
                aria-label={`Copy ${page.title} link`}
              >
                {copiedLinkId === page.id ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {isSaving && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm text-white shadow-lg">
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving...
        </div>
      )}
    </div>
  );
};

export default ProfileSettingsSection;

