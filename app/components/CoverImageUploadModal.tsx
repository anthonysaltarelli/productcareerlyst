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
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface CoverImageUploadModalProps {
  currentUrl?: string;
  onSave: (url: string) => void;
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

type TabType = 'upload' | 'templates';

// ============================================================================
// Constants
// ============================================================================

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ASPECT_RATIO = 3 / 1; // 3:1 aspect ratio for cover images

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Creates a cropped image blob from the original image and crop area
 */
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

  // Calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // Set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Translate canvas to center and rotate
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);

  // Draw rotated image
  ctx.drawImage(image, 0, 0);

  // Create a new canvas for the cropped result
  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    throw new Error('Could not get cropped canvas context');
  }

  // Set the size of the cropped canvas
  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  // Draw the cropped image
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

  // Return as blob
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

/**
 * Creates an HTMLImageElement from a source URL
 */
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

/**
 * Converts degrees to radians
 */
const getRadianAngle = (degreeValue: number): number => {
  return (degreeValue * Math.PI) / 180;
};

/**
 * Calculates the new bounding box dimensions after rotation
 */
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  // Mount state for portal (needed for SSR)
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Fetch templates when tab switches to templates
  useEffect(() => {
    if (activeTab === 'templates' && templates.length === 0) {
      fetchTemplates();
    }
  }, [activeTab, templates.length]);

  const fetchTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const response = await fetch('/api/portfolio/cover-templates');
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Failed to load templates');
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Handlers
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
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      // Reset crop settings for new image
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
      if (file) {
        handleFileSelect(file);
      }
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
      if (file) {
        handleFileSelect(file);
      }
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
    setError(null);
  }, []);

  const handleSave = useCallback(async () => {
    // If a template is selected, save it directly
    if (selectedTemplate) {
      onSave(selectedTemplate);
      return;
    }

    // Otherwise, crop and upload the custom image
    if (!selectedImage || !croppedAreaPixels) return;

    setIsUploading(true);
    setError(null);

    try {
      // Create cropped image blob
      const croppedBlob = await createCroppedImage(
        selectedImage,
        croppedAreaPixels,
        rotation
      );

      // Create form data for upload
      const formData = new FormData();
      formData.append('file', croppedBlob, 'cover-image.jpg');

      // Upload to API
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
  }, [selectedImage, selectedTemplate, croppedAreaPixels, rotation, onSave]);

  const handleReset = useCallback(() => {
    setSelectedImage(null);
    setSelectedTemplate(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Render - use portal to escape parent container constraints
  if (!mounted) return null;

  const canSave = selectedTemplate || (selectedImage && croppedAreaPixels);

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
    >
      {/* Backdrop click handler */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="button"
        tabIndex={-1}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div className="relative z-10 mx-4 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        {/* Header with Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between px-5 py-3">
            <h2 className="font-semibold text-gray-900">
              {selectedImage ? 'Edit Cover Image' : 'Choose Cover Image'}
            </h2>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              type="button"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tab Navigation - only show when not editing */}
          {!selectedImage && (
            <div className="flex gap-1 px-5 pb-2">
              <button
                onClick={() => {
                  setActiveTab('upload');
                  setSelectedTemplate(null);
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === 'upload'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                type="button"
              >
                <Upload className="h-4 w-4" />
                Upload
              </button>
              <button
                onClick={() => {
                  setActiveTab('templates');
                  setSelectedImage(null);
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === 'templates'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                type="button"
              >
                <LayoutGrid className="h-4 w-4" />
                Templates
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-5 pb-4 pt-3">
          {/* Upload Tab */}
          {activeTab === 'upload' && !selectedImage && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative flex h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all ${
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

              <div
                className={`mb-3 rounded-full p-3 ${
                  isDragging ? 'bg-purple-100' : 'bg-gray-100'
                }`}
              >
                {isDragging ? (
                  <Upload className="h-8 w-8 text-purple-500" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                )}
              </div>

              <p className="mb-1 text-center text-sm font-medium text-gray-700">
                {isDragging ? 'Drop your image here' : 'Drag & drop your cover image'}
              </p>
              <p className="text-center text-xs text-gray-500">
                or click to browse • JPEG, PNG, GIF, WebP • Max 10MB
              </p>
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && !selectedImage && (
            <div className="min-h-[180px]">
              {isLoadingTemplates ? (
                <div className="flex h-[180px] items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                </div>
              ) : templates.length === 0 ? (
                <div className="flex h-[180px] flex-col items-center justify-center text-gray-500">
                  <ImageIcon className="mb-2 h-10 w-10 text-gray-300" />
                  <p className="text-sm">No templates available</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template.url)}
                      className={`group relative aspect-[3/1] overflow-hidden rounded-lg transition-all ${
                        selectedTemplate === template.url
                          ? 'ring-2 ring-purple-500 ring-offset-2'
                          : 'hover:ring-2 hover:ring-purple-300 hover:ring-offset-1'
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
                          <div className="rounded-full bg-purple-500 p-1">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <p className="truncate text-xs text-white">{template.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Crop Interface - when image is selected */}
          {selectedImage && (
            <div className="space-y-3">
              {/* Cropper */}
              <div className="relative h-[220px] overflow-hidden rounded-xl bg-gray-900">
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

              {/* Preview indicator */}
              <p className="text-center text-xs text-gray-500">
                Drag to reposition • Scroll to zoom • 3:1 ratio
              </p>

              {/* Controls */}
              <div className="flex items-center gap-4">
                {/* Zoom Control */}
                <div className="flex flex-1 items-center gap-2">
                  <button
                    onClick={handleZoomOut}
                    className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100"
                    type="button"
                    aria-label="Zoom out"
                    disabled={zoom <= 1}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-purple-500"
                    aria-label="Zoom level"
                  />
                  <button
                    onClick={handleZoomIn}
                    className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100"
                    type="button"
                    aria-label="Zoom in"
                    disabled={zoom >= 3}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                </div>

                <div className="h-6 w-px bg-gray-200" />

                {/* Rotation Control */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRotateLeft}
                    className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100"
                    type="button"
                    aria-label="Rotate left"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <span className="min-w-[2.5rem] text-center text-xs text-gray-500">
                    {rotation}°
                  </span>
                  <button
                    onClick={handleRotateRight}
                    className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100"
                    type="button"
                    aria-label="Rotate right"
                  >
                    <RotateCw className="h-4 w-4" />
                  </button>
                </div>

                <div className="h-6 w-px bg-gray-200" />

                {/* Change Image Button */}
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
                  type="button"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  Change
                </button>
              </div>
            </div>
          )}

          {/* Current Image Preview - only show in upload zone */}
          {!selectedImage && !selectedTemplate && currentUrl && (
            <div className="mt-4">
              <p className="mb-1.5 text-center text-xs text-gray-500">Current cover:</p>
              <div className="h-[60px] overflow-hidden rounded-lg">
                <img
                  src={currentUrl}
                  alt="Current cover"
                  className="h-full w-full object-cover"
                />
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
        <div className="flex gap-3 border-t border-gray-200 px-5 py-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            type="button"
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || isUploading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 px-4 py-2 text-sm font-medium text-white transition-all hover:from-purple-600 hover:to-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
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
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default CoverImageUploadModal;
