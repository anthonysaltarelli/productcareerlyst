'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Cropper, { Area, Point } from 'react-easy-crop';
import {
  Upload,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Loader2,
  Save,
  ImageIcon,
  LayoutGrid,
  Check,
  Search,
  Trash2,
} from 'lucide-react';
import { UnsplashPhoto } from '@/lib/types/unsplash';

// ============================================================================
// Types
// ============================================================================

interface UnsplashData {
  photoId: string;
  photographerName: string;
  photographerUsername: string;
  downloadLocation: string;
}

interface CoverImageUploadModalProps {
  currentUrl?: string;
  onSave: (url: string, unsplashData?: UnsplashData) => void;
  onClose: () => void;
}

interface CroppedAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TemplatePhoto {
  id: string;
  name: string;
  url: string;
  filename: string;
}

type TabType = 'upload' | 'templates' | 'unsplash';

// ============================================================================
// Constants
// ============================================================================

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ASPECT_RATIO = 3 / 1; // 3:1 aspect ratio for cover images

// ============================================================================
// Utility Functions
// ============================================================================

const createCroppedImage = async (
  imageSrc: string,
  pixelCrop: CroppedAreaPixels,
  rotation: number = 0
): Promise<Blob> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  const rotRad = getRadianAngle(rotation);
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    throw new Error('Could not get cropped canvas context');
  }

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas is empty'));
        }
      },
      'image/jpeg',
      0.9
    );
  });
};

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

const getRadianAngle = (degreeValue: number): number => {
  return (degreeValue * Math.PI) / 180;
};

const rotateSize = (
  width: number,
  height: number,
  rotation: number
): { width: number; height: number } => {
  const rotRad = getRadianAngle(rotation);
  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
};

// ============================================================================
// Component
// ============================================================================

const CoverImageUploadModal = ({
  currentUrl,
  onSave,
  onClose,
}: CoverImageUploadModalProps) => {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('upload');

  // Upload state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<CroppedAreaPixels | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Template state
  const [templates, setTemplates] = useState<TemplatePhoto[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

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
    if (activeTab === 'templates' && templates.length === 0) {
      fetchTemplates();
    }
  }, [activeTab, templates.length]);

  useEffect(() => {
    if (activeTab === 'unsplash' && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [activeTab]);

  const fetchTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const response = await fetch('/api/portfolio/cover-templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Failed to load templates');
    } finally {
      setIsLoadingTemplates(false);
    }
  };

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
        orientation: 'landscape',
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
    setSelectedImage(null);
    setSelectedTemplate(null);
    setError(null);
  }, []);

  const handleCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File is too large. Maximum size is 10MB.`;
    }
    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSelectedTemplate(null);
    setSelectedUnsplash(null);
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
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
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.1, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.1, 1));
  }, []);

  const handleRotateLeft = useCallback(() => {
    setRotation((prev) => prev - 90);
  }, []);

  const handleRotateRight = useCallback(() => {
    setRotation((prev) => prev + 90);
  }, []);

  const handleSelectTemplate = useCallback((templateUrl: string) => {
    setSelectedTemplate(templateUrl);
    setSelectedImage(null);
    setSelectedUnsplash(null);
    setError(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (selectedUnsplash) {
      try {
        await fetch('/api/unsplash/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ downloadLocation: selectedUnsplash.downloadLocation }),
        });
      } catch (err) {
        console.warn('Failed to track Unsplash download:', err);
      }

      onSave(selectedUnsplash.urls.cover, {
        photoId: selectedUnsplash.id,
        photographerName: selectedUnsplash.photographer.name,
        photographerUsername: selectedUnsplash.photographer.username,
        downloadLocation: selectedUnsplash.downloadLocation,
      });
      return;
    }

    if (selectedTemplate) {
      onSave(selectedTemplate);
      return;
    }

    if (!selectedImage || !croppedAreaPixels) return;

    setIsUploading(true);
    setError(null);

    try {
      const croppedBlob = await createCroppedImage(
        selectedImage,
        croppedAreaPixels,
        rotation
      );

      const formData = new FormData();
      formData.append('file', croppedBlob, 'cover-image.jpg');

      const response = await fetch('/api/portfolio/images/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();
      onSave(data.url);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  }, [selectedImage, selectedTemplate, selectedUnsplash, croppedAreaPixels, rotation, onSave]);

  const handleReset = useCallback(() => {
    setSelectedImage(null);
    setSelectedTemplate(null);
    setSelectedUnsplash(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleUnsplashSearch(1);
    }
  }, [handleUnsplashSearch]);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setSelectedTemplate(null);
    setSelectedUnsplash(null);
    setSelectedImage(null);
    setError(null);
  }, []);

  if (!mounted) return null;

  const canSave = selectedUnsplash || selectedTemplate || (selectedImage && croppedAreaPixels);

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="button"
        tabIndex={-1}
        aria-label="Close modal"
      />

      {/* Modal - Larger with sidebar layout */}
      <div className="relative z-10 flex h-[600px] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Left Sidebar */}
        <div className="flex w-48 flex-shrink-0 flex-col border-r border-gray-200 bg-gray-50">
          {/* Header */}
          <div className="border-b border-gray-200 px-4 py-4">
            <h2 className="font-semibold text-gray-900">Cover Image</h2>
            <p className="mt-0.5 text-xs text-gray-500">Choose a cover photo</p>
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
                onClick={() => handleTabChange('templates')}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  activeTab === 'templates'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                type="button"
              >
                <LayoutGrid className="h-4 w-4" />
                Templates
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

          {/* Current Image Preview & Remove Option */}
          {currentUrl && !selectedImage && !selectedTemplate && !selectedUnsplash && (
            <div className="border-t border-gray-200 p-3">
              <p className="mb-2 text-xs font-medium text-gray-500">Current</p>
              <div className="aspect-[3/1] overflow-hidden rounded-lg">
                <img
                  src={currentUrl}
                  alt="Current cover"
                  className="h-full w-full object-cover"
                />
              </div>
              <button
                onClick={() => onSave('')}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
                type="button"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove cover
              </button>
            </div>
          )}
        </div>

        {/* Right Content Area */}
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {activeTab === 'upload' && (selectedImage ? 'Crop Image' : 'Upload Image')}
              {activeTab === 'templates' && 'Choose Template'}
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
            {activeTab === 'upload' && !selectedImage && (
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

                <div className={`mb-4 rounded-full p-4 ${isDragging ? 'bg-purple-100' : 'bg-gray-100'}`}>
                  {isDragging ? (
                    <Upload className="h-10 w-10 text-purple-500" />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-gray-400" />
                  )}
                </div>

                <p className="mb-2 text-center text-base font-medium text-gray-700">
                  {isDragging ? 'Drop your image here' : 'Drag & drop your cover image'}
                </p>
                <p className="text-center text-sm text-gray-500">
                  or click to browse
                </p>
                <p className="mt-4 text-center text-xs text-gray-400">
                  JPEG, PNG, GIF, WebP • Max 10MB • 3:1 aspect ratio
                </p>
              </div>
            )}

            {/* Crop Interface */}
            {activeTab === 'upload' && selectedImage && (
              <div className="flex h-full flex-col">
                <div className="relative flex-1 overflow-hidden rounded-xl bg-gray-900">
                  <Cropper
                    image={selectedImage}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={ASPECT_RATIO}
                    cropShape="rect"
                    showGrid={true}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={handleCropComplete}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleZoomOut}
                      className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
                      type="button"
                      aria-label="Zoom out"
                      disabled={zoom <= 1}
                    >
                      <ZoomOut className="h-5 w-5" />
                    </button>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.01}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="h-2 w-32 cursor-pointer appearance-none rounded-full bg-gray-200 accent-purple-500"
                      aria-label="Zoom level"
                    />
                    <button
                      onClick={handleZoomIn}
                      className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
                      type="button"
                      aria-label="Zoom in"
                      disabled={zoom >= 3}
                    >
                      <ZoomIn className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRotateLeft}
                      className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
                      type="button"
                      aria-label="Rotate left"
                    >
                      <RotateCcw className="h-5 w-5" />
                    </button>
                    <span className="min-w-[3rem] text-center text-sm text-gray-500">
                      {rotation}°
                    </span>
                    <button
                      onClick={handleRotateRight}
                      className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
                      type="button"
                      aria-label="Rotate right"
                    >
                      <RotateCw className="h-5 w-5" />
                    </button>
                  </div>

                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    type="button"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Change Image
                  </button>
                </div>
              </div>
            )}

            {/* Templates Tab */}
            {activeTab === 'templates' && (
              <div className="h-full">
                {isLoadingTemplates ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
                  </div>
                ) : templates.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-gray-500">
                    <ImageIcon className="mb-3 h-12 w-12 text-gray-300" />
                    <p className="text-sm">No templates available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleSelectTemplate(template.url)}
                        className={`group relative aspect-[3/1] overflow-hidden rounded-xl transition-all ${
                          selectedTemplate === template.url
                            ? 'ring-3 ring-purple-500 ring-offset-2'
                            : 'hover:ring-2 hover:ring-purple-300 hover:ring-offset-2'
                        }`}
                        type="button"
                        aria-label={`Select ${template.name} template`}
                      >
                        <img
                          src={template.url}
                          alt={template.name}
                          className="h-full w-full object-cover"
                        />
                        {selectedTemplate === template.url && (
                          <div className="absolute inset-0 flex items-center justify-center bg-purple-500/20">
                            <div className="rounded-full bg-purple-500 p-1.5">
                              <Check className="h-5 w-5 text-white" />
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                          <p className="truncate text-sm text-white">{template.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
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
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        {unsplashPhotos.map((photo) => (
                          <button
                            key={photo.id}
                            onClick={() => handleSelectUnsplash(photo)}
                            className={`group relative aspect-[3/2] overflow-hidden rounded-xl transition-all ${
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
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                              <div className="flex items-center gap-2">
                                <img
                                  src={photo.photographer.profileImage}
                                  alt={photo.photographer.name}
                                  className="h-5 w-5 rounded-full"
                                />
                                <p className="truncate text-sm text-white">{photo.photographer.name}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                      
                      {unsplashPage < unsplashTotalPages && (
                        <div className="mt-6 text-center">
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

          {/* Footer */}
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
              onClick={handleSave}
              disabled={!canSave || isUploading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 px-4 py-2.5 text-sm font-medium text-white transition-all hover:from-purple-600 hover:to-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Cover
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default CoverImageUploadModal;
