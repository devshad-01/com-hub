// Helper for client-side image compression using browser-image-compression
import imageCompression from 'browser-image-compression';

/**
 * Compress an image file before upload
 * @param {File} file - The original image file
 * @param {Object} options - Compression options
 * @returns {Promise<File>} - The compressed image file
 */
export async function compressImageFile(file, options = {}) {
  const defaultOptions = {
    maxSizeMB: 0.5, // Target max size in MB
    maxWidthOrHeight: 1200, // Resize if larger
    useWebWorker: true
  };
  return await imageCompression(file, { ...defaultOptions, ...options });
}
