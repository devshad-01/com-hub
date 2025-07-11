// imports/ui/components/common/ImageUpload.jsx
import React, { useState, useRef, useCallback } from 'react';
import { useToastContext } from '../common/ToastProvider';
import { useImageUpload } from '../../hooks/useImageUpload';
import { compressImageFile } from '../../utils/compressImageFile';

const ImageUpload = React.forwardRef(({
  onImagesSelected,
  onUploadComplete,
  onUploadError,
  maxFiles = 5,
  maxSizePerFile = 5 * 1024 * 1024, // 5MB
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  context = 'general',
  className = '',
  buttonText = 'Add Images',
  showPreview = true,
  disabled = false,
  folder = 'community_uploads'
}, ref) => {
  const [previewImages, setPreviewImages] = useState([]);
  const fileInputRef = useRef(null);
  const { success, error: showError } = useToastContext();
  const { uploadImages, isUploading, uploadError, uploadedImages } = useImageUpload({ folder, context });

  const handleFileSelect = useCallback((event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    if (files.length > maxFiles) {
      showError(`Maximum ${maxFiles} files allowed`);
      return;
    }
    const validFiles = [];
    const errors = [];
    files.forEach((file) => {
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        errors.push(`${file.name}: Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
        return;
      }
      if (file.size > maxSizePerFile) {
        errors.push(`${file.name}: File too large. Max size: ${(maxSizePerFile / 1024 / 1024).toFixed(1)}MB`);
        return;
      }
      validFiles.push(file);
    });
    if (errors.length > 0) {
      errors.forEach(error => showError(error));
      if (validFiles.length === 0) return;
    }
    processFiles(validFiles);
    event.target.value = '';
  }, [maxFiles, maxSizePerFile, allowedTypes, showError]);

  const processFiles = useCallback(async (files) => {
    const newPreviewImages = [];
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      let compressedFile = file;
      try {
        compressedFile = await compressImageFile(file);
      } catch (err) {
        showError(`Compression failed for ${file.name}, uploading original.`);
      }
      const reader = new FileReader();
      const imageId = `${Date.now()}_${index}`;
      reader.onload = (e) => {
        const imageData = {
          id: imageId,
          file: compressedFile,
          name: compressedFile.name,
          size: compressedFile.size,
          type: compressedFile.type,
          preview: e.target.result,
          base64: e.target.result, // store base64 for upload
          uploaded: false,
          uploading: false,
          error: null,
          url: null,
          publicId: null
        };
        newPreviewImages.push(imageData);
        if (newPreviewImages.length === files.length) {
          setPreviewImages(prev => [...prev, ...newPreviewImages]);
          if (onImagesSelected) {
            onImagesSelected(newPreviewImages);
          }
        }
      };
      reader.onerror = () => {
        showError(`Error reading file: ${file.name}`);
      };
      reader.readAsDataURL(compressedFile);
    }
  }, [onImagesSelected, showError]);

  const clearAll = useCallback(() => {
    setPreviewImages([]);
  }, []);

  React.useImperativeHandle(ref, () => ({
    uploadImages: () => uploadImages(previewImages.map(img => img.base64)),
    clearAll,
    getUploadedImages: () => uploadedImages,
    hasImages: () => previewImages.length > 0,
    hasUploadedImages: () => uploadedImages.length > 0,
    allImagesUploaded: () => previewImages.length > 0 && uploadedImages.length === previewImages.length
  }));

  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return (
    <div className={`image-upload-component ${className}`}>
      {/* Upload Button */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {isUploading ? 'Uploading...' : buttonText}
        </button>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          accept={allowedTypes.join(',')}
          className="hidden"
          disabled={disabled || isUploading}
        />
        
        <p className="mt-2 text-sm text-gray-500">
          Max {maxFiles} files, {formatFileSize(maxSizePerFile)} each. 
          Supported: {allowedTypes.map(type => type.split('/')[1]).join(', ')}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Storage folder: {folder}
        </p>
      </div>


      {/* Image Previews */}
      {showPreview && previewImages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">
              Selected Images ({previewImages.length})
            </h4>
            <button
              type="button"
              onClick={clearAll}
              className="text-sm text-red-600 hover:text-red-700"
              disabled={isUploading}
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {previewImages.map((image) => (
              <div key={image.id} className="relative bg-gray-50 rounded-lg p-4 border">
                {/* Image Preview */}
                <div className="aspect-w-16 aspect-h-9 mb-3">
                  <img
                    src={image.preview}
                    alt={image.name}
                    className="object-cover rounded w-full h-32"
                  />
                </div>

                {/* Image Info */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900 truncate" title={image.name}>
                    {image.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(image.size)}
                  </p>

                  {/* Upload Status */}
                  {uploadedImages.find(u => u.name === image.name) && (
                    <div className="flex items-center text-xs text-green-600">
                      <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Uploaded
                    </div>
                  )}

                  {uploadError && (
                    <div className="space-y-1">
                      <div className="flex items-center text-xs text-red-600">
                        <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Failed
                      </div>
                      <p className="text-xs text-red-500">{uploadError}</p>
                    </div>
                  )}
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => setPreviewImages(prev => prev.filter(img => img.id !== image.id))}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                  disabled={isUploading}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Upload All Button */}
          {previewImages.some(img => !uploadedImages.find(u => u.name === img.name)) && (
            <div className="pt-4 border-t">
              <button
                type="button"
                onClick={() => uploadImages(previewImages.map(img => img.file))}
                disabled={isUploading}
                className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading Images...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload All Images
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default ImageUpload;