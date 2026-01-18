'use client';
import { useState, useRef, useEffect, DragEvent, ChangeEvent } from 'react';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface ImageUploadProps {
  onImageSelect: (imageUrl: string | null) => void;
  initialImageUrl?: string;
  customerName?: string;
}

export default function ImageUpload({ onImageSelect, initialImageUrl, customerName }: ImageUploadProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(initialImageUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when initialImageUrl changes
  useEffect(() => {
    if (initialImageUrl) {
      setImagePreview(initialImageUrl);
    }
  }, [initialImageUrl]);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Create preview immediately
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    // Upload file
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Include customer name if provided
      if (customerName && customerName.trim()) {
        formData.append('customerName', customerName.trim());
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload image');
      }

      const data = await response.json();
      
      // Clean up preview URL
      URL.revokeObjectURL(previewUrl);
      
      // Set the final uploaded image URL
      setImagePreview(data.url);
      onImageSelect(data.url);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload image');
      setImagePreview(null);
      onImageSelect(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    setImagePreview(null);
    onImageSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mb-4">
      <label className="mb-2 block text-sm font-medium">
        Customer Image
      </label>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-6 transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {imagePreview ? (
          <div className="relative w-full">
            <div className="relative mx-auto h-48 w-48 overflow-hidden rounded-full border-4 border-white shadow-md group">
              <Image
                src={imagePreview}
                alt="Preview"
                fill
                className="object-cover"
                sizes="192px"
              />
              {/* Overlay on hover to indicate image can be changed */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center rounded-full">
                <p className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium transition-opacity">
                  Click to change
                </p>
              </div>
            </div>
            {!isUploading && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="absolute right-0 top-0 rounded-full bg-red-500 p-1 text-white hover:bg-red-600 transition-colors z-10"
                title="Remove image"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <PhotoIcon className="mb-4 h-12 w-12 text-gray-400" />
            <p className="mb-2 text-sm text-gray-600">
              {isDragging ? 'Drop the image here' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG, GIF up to 5MB
            </p>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <div className="flex flex-col items-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-2 text-sm text-gray-600">Uploading...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
