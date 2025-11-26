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
  Camera,
  Loader2,
  Save,
  ImageIcon,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface ProfileImageUploadModalProps {
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

// ============================================================================
// Constants
// ============================================================================

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

const ProfileImageUploadModal = ({
  currentUrl,
  onSave,
  onClose,
}: ProfileImageUploadModalProps) => {
  // State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<CroppedAreaPixels | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  // Mount state for portal (needed for SSR)
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

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

  const handleSave = useCallback(async () => {
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
      formData.append('file', croppedBlob, 'profile-image.jpg');

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
  }, [selectedImage, croppedAreaPixels, rotation, onSave]);

  const handleReset = useCallback(() => {
    setSelectedImage(null);
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
      <div className="relative z-10 mx-4 w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {selectedImage ? 'Edit Profile Photo' : 'Upload Profile Photo'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            type="button"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!selectedImage ? (
            // Upload Zone
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all ${
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
                className={`mb-4 rounded-full p-4 ${
                  isDragging ? 'bg-purple-100' : 'bg-gray-100'
                }`}
              >
                {isDragging ? (
                  <Upload className="h-10 w-10 text-purple-500" />
                ) : (
                  <Camera className="h-10 w-10 text-gray-400" />
                )}
              </div>

              <p className="mb-2 text-center text-base font-medium text-gray-700">
                {isDragging ? 'Drop your image here' : 'Drag & drop your photo'}
              </p>
              <p className="mb-4 text-center text-sm text-gray-500">
                or click to browse
              </p>
              <p className="text-center text-xs text-gray-400">
                JPEG, PNG, GIF, or WebP • Max 10MB
              </p>

              {/* Current Image Preview */}
              {currentUrl && (
                <div className="mt-6 flex flex-col items-center">
                  <p className="mb-2 text-xs text-gray-500">Current photo:</p>
                  <img
                    src={currentUrl}
                    alt="Current profile"
                    className="h-16 w-16 rounded-full object-cover ring-2 ring-gray-200"
                  />
                </div>
              )}
            </div>
          ) : (
            // Crop Interface
            <div className="space-y-4">
              {/* Cropper */}
              <div className="relative h-[300px] overflow-hidden rounded-xl bg-gray-900">
                <Cropper
                  image={selectedImage}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={handleCropComplete}
                />
              </div>

              {/* Controls */}
              <div className="space-y-3">
                {/* Zoom Control */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleZoomOut}
                    className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
                    type="button"
                    aria-label="Zoom out"
                    disabled={zoom <= 1}
                  >
                    <ZoomOut className="h-5 w-5" />
                  </button>
                  <div className="flex-1">
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.01}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-purple-500"
                      aria-label="Zoom level"
                    />
                  </div>
                  <button
                    onClick={handleZoomIn}
                    className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
                    type="button"
                    aria-label="Zoom in"
                    disabled={zoom >= 3}
                  >
                    <ZoomIn className="h-5 w-5" />
                  </button>
                  <span className="min-w-[3rem] text-center text-sm text-gray-500">
                    {Math.round(zoom * 100)}%
                  </span>
                </div>

                {/* Rotation Control */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRotateLeft}
                    className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
                    type="button"
                    aria-label="Rotate left"
                  >
                    <RotateCcw className="h-5 w-5" />
                  </button>
                  <div className="flex-1">
                    <input
                      type="range"
                      min={-180}
                      max={180}
                      step={1}
                      value={rotation}
                      onChange={(e) => setRotation(Number(e.target.value))}
                      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-purple-500"
                      aria-label="Rotation angle"
                    />
                  </div>
                  <button
                    onClick={handleRotateRight}
                    className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
                    type="button"
                    aria-label="Rotate right"
                  >
                    <RotateCw className="h-5 w-5" />
                  </button>
                  <span className="min-w-[3rem] text-center text-sm text-gray-500">
                    {rotation}°
                  </span>
                </div>
              </div>

              {/* Change Image Button */}
              <button
                onClick={handleReset}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                type="button"
              >
                <ImageIcon className="h-4 w-4" />
                Choose Different Photo
              </button>
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
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-50"
            type="button"
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedImage || !croppedAreaPixels || isUploading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 px-4 py-2.5 font-medium text-white transition-all hover:from-purple-600 hover:to-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
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
                Save Photo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ProfileImageUploadModal;

