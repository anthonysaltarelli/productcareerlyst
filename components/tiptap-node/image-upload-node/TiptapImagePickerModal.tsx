'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Upload,
  X,
  Loader2,
  ImageIcon,
  Check,
  Search,
} from 'lucide-react';
import { UnsplashPhoto } from '@/lib/types/unsplash';

// ============================================================================
// Types
// ============================================================================

export interface UnsplashData {
  photoId: string;
  photographerName: string;
  photographerUsername: string;
  downloadLocation: string;
}

export interface ImagePickerResult {
  url: string;
  unsplashData?: UnsplashData;
  alt?: string;
}

interface TiptapImagePickerModalProps {
  onSelect: (result: ImagePickerResult) => void;
  onClose: () => void;
  uploadFn?: (file: File) => Promise<string>;
}

type TabType = 'upload' | 'unsplash';

// ============================================================================
// Constants
// ============================================================================

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ============================================================================
// Component
// ============================================================================

export const TiptapImagePickerModal = ({
  onSelect,
  onClose,
  uploadFn,
}: TiptapImagePickerModalProps) => {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('upload');

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Unsplash state
  const [unsplashQuery, setUnsplashQuery] = useState('');
  const [unsplashPhotos, setUnsplashPhotos] = useState<UnsplashPhoto[]>([]);
  const [isSearchingUnsplash, setIsSearchingUnsplash] = useState(false);
  const [selectedUnsplash, setSelectedUnsplash] = useState<UnsplashPhoto | null>(null);
  const [unsplashPage, setUnsplashPage] = useState(1);
  const [unsplashTotalPages, setUnsplashTotalPages] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (activeTab === 'unsplash' && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [activeTab]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleUnsplashSearch = useCallback(async (page: number = 1) => {
    if (!unsplashQuery.trim()) return;

    setIsSearchingUnsplash(true);
    setError(null);
    setHasSearched(true);

    try {
      const params = new URLSearchParams({
        query: unsplashQuery.trim(),
        page: page.toString(),
        per_page: '18',
        // Don't restrict orientation for inline images - allow any
      });

      const response = await fetch(`/api/unsplash/search?${params}`);
      if (!response.ok) throw new Error('Failed to search Unsplash');

      const data = await response.json();
      
      if (page === 1) {
        setUnsplashPhotos(data.photos);
      } else {
        setUnsplashPhotos(prev => {
          const existingIds = new Set(prev.map((p: UnsplashPhoto) => p.id));
          const newPhotos = data.photos.filter((p: UnsplashPhoto) => !existingIds.has(p.id));
          return [...prev, ...newPhotos];
        });
      }
      
      setUnsplashPage(page);
      setUnsplashTotalPages(data.totalPages);
    } catch (err) {
      console.error('Error searching Unsplash:', err);
      setError('Failed to search Unsplash. Please try again.');
    } finally {
      setIsSearchingUnsplash(false);
    }
  }, [unsplashQuery]);

  const handleLoadMoreUnsplash = useCallback(() => {
    if (unsplashPage < unsplashTotalPages && !isSearchingUnsplash) {
      handleUnsplashSearch(unsplashPage + 1);
    }
  }, [unsplashPage, unsplashTotalPages, isSearchingUnsplash, handleUnsplashSearch]);

  const handleSelectUnsplash = useCallback((photo: UnsplashPhoto) => {
    setSelectedUnsplash(photo);
    setError(null);
  }, []);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File is too large. Maximum size is 10MB.`;
    }
    return null;
  };

  const handleFileUpload = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      let url: string;
      
      if (uploadFn) {
        // Use provided upload function
        url = await uploadFn(file);
      } else {
        // Default: Upload to portfolio images API
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/portfolio/images/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to upload image');
        }

        const data = await response.json();
        url = data.url;
      }

      // Get filename without extension for alt text
      const alt = file.name.replace(/\.[^/.]+$/, '');
      
      onSelect({ url, alt });
    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  }, [uploadFn, onSelect]);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload]
  );

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleSaveUnsplash = useCallback(async () => {
    if (!selectedUnsplash) return;

    setIsUploading(true);

    try {
      // Track download with Unsplash (required by their API guidelines)
      await fetch('/api/unsplash/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ downloadLocation: selectedUnsplash.downloadLocation }),
      }).catch(err => {
        console.warn('Failed to track Unsplash download:', err);
      });

      // Use regular size URL for inline images (good balance of quality and size)
      onSelect({
        url: selectedUnsplash.urls.regular,
        alt: selectedUnsplash.description || `Photo by ${selectedUnsplash.photographer.name}`,
        unsplashData: {
          photoId: selectedUnsplash.id,
          photographerName: selectedUnsplash.photographer.name,
          photographerUsername: selectedUnsplash.photographer.username,
          downloadLocation: selectedUnsplash.downloadLocation,
        },
      });
    } catch (err) {
      console.error('Error saving Unsplash image:', err);
      setError('Failed to save image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [selectedUnsplash, onSelect]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleUnsplashSearch(1);
    }
  }, [handleUnsplashSearch]);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setSelectedUnsplash(null);
    setError(null);
  }, []);

  if (!mounted) return null;

  const canSave = selectedUnsplash !== null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        role="button"
        tabIndex={-1}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div className="relative z-10 flex h-[550px] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Left Sidebar */}
        <div className="flex w-44 flex-shrink-0 flex-col border-r border-gray-200 bg-gray-50">
          {/* Header */}
          <div className="border-b border-gray-200 px-4 py-4">
            <h2 className="font-semibold text-gray-900">Add Image</h2>
            <p className="mt-0.5 text-xs text-gray-500">Choose an image source</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3">
            <div className="space-y-1">
              <button
                onClick={() => handleTabChange('upload')}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  activeTab === 'upload'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                type="button"
              >
                <Upload className="h-4 w-4" />
                Upload
              </button>
              <button
                onClick={() => handleTabChange('unsplash')}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  activeTab === 'unsplash'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                type="button"
              >
                <Search className="h-4 w-4" />
                Unsplash
              </button>
            </div>
          </nav>

          {/* Selected Unsplash Preview */}
          {selectedUnsplash && (
            <div className="border-t border-gray-200 p-3">
              <p className="mb-2 text-xs font-medium text-gray-500">Selected</p>
              <div className="aspect-[4/3] overflow-hidden rounded-lg">
                <img
                  src={selectedUnsplash.urls.small}
                  alt={selectedUnsplash.description}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="mt-2 truncate text-xs text-gray-500">
                by {selectedUnsplash.photographer.name}
              </p>
            </div>
          )}
        </div>

        {/* Right Content Area */}
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {activeTab === 'upload' && 'Upload Image'}
              {activeTab === 'unsplash' && 'Search Unsplash'}
            </h3>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              type="button"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Upload Tab */}
            {activeTab === 'upload' && (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`flex h-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all ${
                  isDragging
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-50/50'
                }`}
                onClick={handleBrowseClick}
                onKeyDown={(e) => e.key === 'Enter' && handleBrowseClick()}
                role="button"
                tabIndex={0}
                aria-label="Upload image"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleInputChange}
                  className="hidden"
                  aria-label="Select image file"
                />

                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="mb-4 h-10 w-10 animate-spin text-purple-500" />
                    <p className="text-sm font-medium text-gray-700">Uploading...</p>
                  </div>
                ) : (
                  <>
                    <div className={`mb-4 rounded-full p-4 ${isDragging ? 'bg-purple-100' : 'bg-gray-100'}`}>
                      {isDragging ? (
                        <Upload className="h-10 w-10 text-purple-500" />
                      ) : (
                        <ImageIcon className="h-10 w-10 text-gray-400" />
                      )}
                    </div>

                    <p className="mb-2 text-center text-base font-medium text-gray-700">
                      {isDragging ? 'Drop your image here' : 'Drag & drop your image'}
                    </p>
                    <p className="text-center text-sm text-gray-500">
                      or click to browse
                    </p>
                    <p className="mt-4 text-center text-xs text-gray-400">
                      JPEG, PNG, GIF, WebP • Max 10MB
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Unsplash Tab */}
            {activeTab === 'unsplash' && (
              <div className="flex h-full flex-col">
                {/* Search Bar */}
                <div className="mb-4 flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={unsplashQuery}
                      onChange={(e) => setUnsplashQuery(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      placeholder="Search for photos (e.g., office, technology, nature)"
                      className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-4 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
                      aria-label="Search Unsplash photos"
                    />
                  </div>
                  <button
                    onClick={() => handleUnsplashSearch(1)}
                    disabled={!unsplashQuery.trim() || isSearchingUnsplash}
                    className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                    type="button"
                  >
                    {isSearchingUnsplash ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Search className="h-5 w-5" />
                    )}
                    Search
                  </button>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto">
                  {!hasSearched ? (
                    <div className="flex h-full flex-col items-center justify-center text-gray-500">
                      <Search className="mb-3 h-12 w-12 text-gray-300" />
                      <p className="text-sm font-medium">Search for free high-quality photos</p>
                      <p className="mt-1 text-xs text-gray-400">Photos provided by Unsplash</p>
                    </div>
                  ) : isSearchingUnsplash && unsplashPhotos.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
                    </div>
                  ) : unsplashPhotos.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-gray-500">
                      <ImageIcon className="mb-3 h-12 w-12 text-gray-300" />
                      <p className="text-sm">No photos found for &quot;{unsplashQuery}&quot;</p>
                      <p className="mt-1 text-xs text-gray-400">Try different keywords</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {unsplashPhotos.map((photo) => (
                          <button
                            key={photo.id}
                            onClick={() => handleSelectUnsplash(photo)}
                            className={`group relative aspect-[4/3] overflow-hidden rounded-xl transition-all ${
                              selectedUnsplash?.id === photo.id
                                ? 'ring-3 ring-purple-500 ring-offset-2'
                                : 'hover:ring-2 hover:ring-purple-300 hover:ring-offset-2'
                            }`}
                            type="button"
                            aria-label={`Select photo by ${photo.photographer.name}`}
                          >
                            <img
                              src={photo.urls.small}
                              alt={photo.description}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                            {selectedUnsplash?.id === photo.id && (
                              <div className="absolute inset-0 flex items-center justify-center bg-purple-500/20">
                                <div className="rounded-full bg-purple-500 p-1.5">
                                  <Check className="h-5 w-5 text-white" />
                                </div>
                              </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                              <div className="flex items-center gap-2">
                                <img
                                  src={photo.photographer.profileImage}
                                  alt={photo.photographer.name}
                                  className="h-4 w-4 rounded-full"
                                />
                                <p className="truncate text-xs text-white">{photo.photographer.name}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                      
                      {unsplashPage < unsplashTotalPages && (
                        <div className="mt-4 text-center">
                          <button
                            onClick={handleLoadMoreUnsplash}
                            disabled={isSearchingUnsplash}
                            className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                            type="button"
                          >
                            {isSearchingUnsplash ? 'Loading...' : 'Load more photos'}
                          </button>
                        </div>
                      )}

                      <p className="mt-4 text-center text-xs text-gray-400">
                        Photos by{' '}
                        <a
                          href="https://unsplash.com/?utm_source=productcareerlyst&utm_medium=referral"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 underline hover:text-gray-600"
                        >
                          Unsplash
                        </a>
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>

          {/* Footer - Only show for Unsplash tab when photo is selected */}
          {activeTab === 'unsplash' && (
            <div className="flex gap-3 border-t border-gray-200 px-6 py-4">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                type="button"
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUnsplash}
                disabled={!canSave || isUploading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 px-4 py-2.5 text-sm font-medium text-white transition-all hover:from-purple-600 hover:to-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Inserting...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Insert Image
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default TiptapImagePickerModal;

