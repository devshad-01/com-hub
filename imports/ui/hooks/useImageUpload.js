import { useState } from 'react';
import { Meteor } from 'meteor/meteor';

/**
 * useImageUpload - React hook for uploading images to the server (Cloudinary/Backblaze)
 * @param {Object} options
 * @param {string} options.folder - Folder path in cloud storage (e.g. 'forum-posts/123', 'avatars/USERID')
 * @param {string} [options.context] - Optional context for the upload (e.g. 'forum-post', 'avatar')
 * @returns {Object} { uploadImages, isUploading, uploadError, uploadedImages }
 */
export function useImageUpload({ folder, context } = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]);

  // images: array of File or base64 strings
  const uploadImages = async (images) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadedImages([]);
    try {
      const results = [];
      for (const image of images) {
        // Convert File to base64 if needed
        let base64Data = image;
        if (image instanceof File) {
          base64Data = await fileToBase64(image);
        }
        const uploadResult = await Meteor.callAsync('storage.uploadImage', base64Data, {
          folder,
          context,
          filename: image.name || undefined
        });
        // Compose the image object
        const imageObj = {
          name: image.name || 'image',
          url: uploadResult.url,
          size: uploadResult.size,
        };
        if (uploadResult.fileName && uploadResult.publicId) {
          // Backblaze
          imageObj.fileId = uploadResult.publicId;
          imageObj.fileName = uploadResult.fileName;
          imageObj.provider = 'backblaze';
        } else if (uploadResult.publicId) {
          // Cloudinary
          imageObj.publicId = uploadResult.publicId;
          imageObj.provider = 'cloudinary';
          imageObj.format = uploadResult.format;
          imageObj.width = uploadResult.width;
          imageObj.height = uploadResult.height;
        }
        results.push(imageObj);
      }
      setUploadedImages(results);
      return results;
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
      return [];
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadImages, isUploading, uploadError, uploadedImages };
}

// Helper: convert File to base64 string
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
