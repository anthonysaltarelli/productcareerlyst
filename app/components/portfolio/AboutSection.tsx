'use client';

import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Camera,
  Pencil,
  Linkedin,
  Twitter,
  Github,
  Youtube,
  Globe,
  Mail,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import { Portfolio, PortfolioWorkExperience } from '@/lib/types/portfolio';
import ProfileImageUploadModal from '@/app/components/ProfileImageUploadModal';
import { WorkExperienceEditor } from '@/app/components/portfolio/WorkExperienceEditor';

// Custom Substack icon (lucide-react doesn't have one)
const SubstackIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" />
  </svg>
);

// ============================================================================
// Types
// ============================================================================

interface AboutSectionProps {
  portfolio: Portfolio;
  onUpdate: () => void;
  onUpdateWorkExperience: (workExperience: PortfolioWorkExperience[]) => Promise<void>;
  onToggleWorkExperienceVisibility: (show: boolean) => Promise<void>;
}

interface SocialPlatform {
  key: string;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
}

// ============================================================================
// Social Platform Config
// ============================================================================

const socialPlatforms: SocialPlatform[] = [
  { key: 'linkedin', label: 'LinkedIn', icon: <Linkedin className="h-5 w-5" />, placeholder: 'https://linkedin.com/in/yourname' },
  { key: 'twitter', label: 'Twitter / X', icon: <Twitter className="h-5 w-5" />, placeholder: 'https://twitter.com/yourhandle' },
  { key: 'github', label: 'GitHub', icon: <Github className="h-5 w-5" />, placeholder: 'https://github.com/username' },
  { key: 'youtube', label: 'YouTube', icon: <Youtube className="h-5 w-5" />, placeholder: 'https://youtube.com/@channel' },
  { key: 'substack', label: 'Substack', icon: <SubstackIcon className="h-5 w-5" />, placeholder: 'https://yourname.substack.com' },
  { key: 'website', label: 'Website', icon: <Globe className="h-5 w-5" />, placeholder: 'https://yourwebsite.com' },
  { key: 'email', label: 'Email', icon: <Mail className="h-5 w-5" />, placeholder: 'you@example.com' },
];

// ============================================================================
// Main Component
// ============================================================================

export const AboutSection = ({
  portfolio,
  onUpdate,
  onUpdateWorkExperience,
  onToggleWorkExperienceVisibility,
}: AboutSectionProps) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    bio: portfolio.bio || '',
    profile_image_url: portfolio.profile_image_url || '',
    social_links: portfolio.social_links || {},
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showProfileImageModal, setShowProfileImageModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync form data with portfolio prop
  useEffect(() => {
    setFormData({
      bio: portfolio.bio || '',
      profile_image_url: portfolio.profile_image_url || '',
      social_links: portfolio.social_links || {},
    });
  }, [portfolio]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingField === 'bio' && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
    } else if (editingField && editingField.startsWith('social_') && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingField]);

  const handleSave = async (field: string, value: string | Record<string, string | undefined>) => {
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

  const handleSocialLinkSave = async (platform: string, value: string) => {
    const newSocialLinks = { ...formData.social_links, [platform]: value };
    setFormData((prev) => ({ ...prev, social_links: newSocialLinks }));
    await handleSave('social_links', newSocialLinks);
  };

  const handleProfileImageSave = async (url: string) => {
    setFormData((prev) => ({ ...prev, profile_image_url: url }));
    await handleSave('profile_image_url', url);
    setShowProfileImageModal(false);
  };

  const socialLinks = formData.social_links as Record<string, string>;

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6 md:p-8">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">About</h2>
        <p className="mt-1 text-gray-500">Tell visitors about yourself and how to connect</p>
      </div>

      {/* Profile Image Card */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">Profile Picture</h3>
        
        <div className="flex items-center gap-6">
          {/* Profile Image */}
          <div className="group relative">
            {formData.profile_image_url ? (
              <img
                src={formData.profile_image_url}
                alt={portfolio.display_name}
                className="h-28 w-28 rounded-full object-cover shadow-lg ring-4 ring-white"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-4xl font-bold text-white shadow-lg ring-4 ring-white">
                {portfolio.display_name.charAt(0).toUpperCase()}
              </div>
            )}
            <button
              onClick={() => setShowProfileImageModal(true)}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
              type="button"
              aria-label="Change profile image"
            >
              <Camera className="h-6 w-6 text-white" />
            </button>
          </div>

          <div className="flex-1">
            <p className="text-gray-600">
              {formData.profile_image_url
                ? 'Click on your photo to change it'
                : 'Add a profile picture to personalize your portfolio'}
            </p>
            <button
              onClick={() => setShowProfileImageModal(true)}
              className="mt-3 flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-200"
              type="button"
            >
              <Camera className="h-4 w-4" />
              {formData.profile_image_url ? 'Change Photo' : 'Upload Photo'}
            </button>
          </div>
        </div>
      </div>

      {/* Bio Card */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">Bio</h3>
        
        {editingField === 'bio' ? (
          <div className="space-y-3">
            <textarea
              ref={textareaRef}
              value={formData.bio}
              onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
              className="w-full rounded-lg border-2 border-purple-400 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-200"
              rows={8}
              placeholder="Tell visitors about yourself, your experience, and what you're passionate about..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditingField(null);
                  setFormData((prev) => ({ ...prev, bio: portfolio.bio || '' }));
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSave('bio', formData.bio)}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                type="button"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setEditingField('bio')}
            className="group w-full rounded-lg bg-gray-50 p-4 text-left hover:bg-gray-100"
            type="button"
          >
            <div className="flex items-start justify-between gap-4">
              <div className={`flex-1 ${formData.bio ? 'text-gray-700' : 'italic text-gray-400'}`}>
                {formData.bio ? (
                  <p className="whitespace-pre-wrap">{formData.bio}</p>
                ) : (
                  'Add a bio to tell visitors about yourself...'
                )}
              </div>
              <Pencil className="mt-1 h-4 w-4 flex-shrink-0 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </button>
        )}
      </div>

      {/* Social Links Card */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">Social Links</h3>
        <p className="mb-6 text-sm text-gray-500">
          Add your social profiles so visitors can connect with you
        </p>
        
        <div className="space-y-3">
          {socialPlatforms.map((platform) => {
            const value = socialLinks[platform.key] || '';
            const isEditing = editingField === `social_${platform.key}`;

            return (
              <SocialLinkRow
                key={platform.key}
                platform={platform}
                value={value}
                isEditing={isEditing}
                isSaving={isSaving && isEditing}
                inputRef={isEditing ? inputRef : undefined}
                onEdit={() => setEditingField(`social_${platform.key}`)}
                onCancel={() => {
                  setEditingField(null);
                  setFormData((prev) => ({
                    ...prev,
                    social_links: { ...prev.social_links, [platform.key]: socialLinks[platform.key] || '' },
                  }));
                }}
                onSave={(newValue) => handleSocialLinkSave(platform.key, newValue)}
                onChange={(newValue) =>
                  setFormData((prev) => ({
                    ...prev,
                    social_links: { ...prev.social_links, [platform.key]: newValue },
                  }))
                }
              />
            );
          })}
        </div>
      </div>

      {/* Work Experience Card */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        <WorkExperienceEditor
          workExperience={portfolio.work_experience || []}
          onUpdate={onUpdateWorkExperience}
          showWorkExperience={portfolio.show_work_experience ?? true}
          onToggleVisibility={onToggleWorkExperienceVisibility}
        />
      </div>

      {/* Profile Image Upload Modal */}
      {showProfileImageModal && (
        <ProfileImageUploadModal
          currentUrl={formData.profile_image_url}
          onSave={handleProfileImageSave}
          onClose={() => setShowProfileImageModal(false)}
        />
      )}

      {isSaving && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm text-white shadow-lg">
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving...
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Social Link Row Component
// ============================================================================

interface SocialLinkRowProps {
  platform: SocialPlatform;
  value: string;
  isEditing: boolean;
  isSaving: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (value: string) => void;
  onChange: (value: string) => void;
}

const SocialLinkRow = ({
  platform,
  value,
  isEditing,
  isSaving,
  inputRef,
  onEdit,
  onCancel,
  onSave,
  onChange,
}: SocialLinkRowProps) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSave(localValue);
    } else if (e.key === 'Escape') {
      setLocalValue(value);
      onCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-purple-50 p-3 ring-2 ring-purple-200">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
          {platform.icon}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={(e) => {
            setLocalValue(e.target.value);
            onChange(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          className="flex-1 rounded-lg border-2 border-purple-400 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
          placeholder={platform.placeholder}
        />
        <button
          onClick={() => onSave(localValue)}
          disabled={isSaving}
          className="rounded-lg bg-purple-600 p-2 text-white hover:bg-purple-700 disabled:opacity-50"
          type="button"
          aria-label="Save"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        </button>
        <button
          onClick={() => {
            setLocalValue(value);
            onCancel();
          }}
          className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-gray-200"
          type="button"
          aria-label="Cancel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onEdit}
      className="group flex w-full items-center gap-3 rounded-lg bg-gray-50 p-3 text-left transition-all hover:bg-gray-100"
      type="button"
    >
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
          value ? 'bg-gray-200 text-gray-600' : 'border-2 border-dashed border-gray-300 text-gray-400'
        }`}
      >
        {platform.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-700">{platform.label}</p>
        <p className={`truncate text-sm ${value ? 'text-gray-500' : 'italic text-gray-400'}`}>
          {value || 'Not set'}
        </p>
      </div>
      <Pencil className="h-4 w-4 flex-shrink-0 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
};

export default AboutSection;

