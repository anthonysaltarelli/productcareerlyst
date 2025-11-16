'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Upload, FileText } from 'lucide-react';

type ImportResumeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File, versionName: string, isMaster: boolean) => Promise<void>;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export default function ImportResumeModal({
  isOpen,
  onClose,
  onImport,
}: ImportResumeModalProps) {
  const [versionName, setVersionName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    if (!isLoading) {
      setVersionName('');
      setSelectedFile(null);
      setFileError(null);
      setIsDragging(false);
      onClose();
    }
  }, [isLoading, onClose]);

  // Validate file
  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Unsupported file type: ${file.type}. Only PDF and DOCX files are supported.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds 5MB limit.`;
    }
    return null;
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      setFileError(error);
      setSelectedFile(null);
      return;
    }

    setFileError(null);
    setSelectedFile(file);
    
    // Auto-fill version name from filename if empty
    if (!versionName.trim()) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setVersionName(nameWithoutExt);
    }
  }, [validateFile, versionName]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Handle drag and drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Handle keyboard events for drag area
  const handleDragAreaKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile || !versionName.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      await onImport(selectedFile, versionName.trim(), true);
      handleClose();
    } catch (error) {
      console.error('Error importing resume:', error);
      // Error is already handled by toast in the hook
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile, versionName, onImport, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Import Resume
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            aria-label="Close modal"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClose();
              }
            }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resume File <span className="text-gray-400">(PDF or DOCX, max 5MB)</span>
            </label>
            
            {/* Drag and Drop Area */}
            <div
              className={`
                relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
                ${fileError ? 'border-red-300 bg-red-50' : ''}
                ${selectedFile ? 'border-green-500 bg-green-50' : ''}
              `}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              tabIndex={0}
              role="button"
              aria-label="Drag and drop area for resume file"
              onKeyDown={handleDragAreaKeyDown}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileInputChange}
                className="hidden"
                aria-label="Select resume file"
                disabled={isLoading}
              />

              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="w-12 h-12 text-green-600" />
                  <div className="text-sm font-medium text-gray-800">
                    {selectedFile.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setFileError(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    disabled={isLoading}
                  >
                    Change File
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-12 h-12 text-gray-400" />
                  <div className="text-sm font-medium text-gray-700">
                    Drag and drop your resume here
                  </div>
                  <div className="text-xs text-gray-500">
                    or click to browse
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                    disabled={isLoading}
                  >
                    Select File
                  </button>
                </div>
              )}

              {fileError && (
                <div className="mt-2 text-sm text-red-600" role="alert">
                  {fileError}
                </div>
              )}
            </div>
          </div>

          {/* Version Name */}
          <div>
            <label htmlFor="version-name" className="block text-sm font-medium text-gray-700 mb-2">
              Resume Name
            </label>
            <input
              id="version-name"
              type="text"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="e.g., Master Resume"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={isLoading}
              aria-label="Resume version name"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedFile || !versionName.trim() || !!fileError}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Importing...' : 'Import Resume'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

