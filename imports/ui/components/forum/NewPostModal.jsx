import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { X, Send, Tag, FileText, Folder, Image, Trash2 } from 'lucide-react';
import { useToastContext } from '../common/ToastProvider';

export const NewPostModal = ({ isOpen, onClose, categories = [], selectedCategoryId = null }) => {
  const { success, error: showError } = useToastContext();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    categoryId: selectedCategoryId || '',
    tags: '',
    pinned: false
  });
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select only image files');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      
      // Convert to base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = {
          id: Date.now() + Math.random(),
          name: file.name,
          data: event.target.result,
          size: file.size
        };
        
        setUploadedImages(prev => [...prev, imageData]);
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input
    e.target.value = '';
  };

  const removeImage = (imageId) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Validate form
      if (!formData.title.trim()) {
        throw new Error('Please enter a title');
      }
      if (!formData.content.trim()) {
        throw new Error('Please enter content');
      }
      if (!formData.categoryId) {
        throw new Error('Please select a category');
      }

      // Parse tags
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0);

      // Create post
      await Meteor.callAsync('forums.posts.create', {
        title: formData.title.trim(),
        content: formData.content.trim(),
        categoryId: formData.categoryId,
        tags,
        images: uploadedImages.map(img => img.data), // Send base64 image data
        pinned: formData.pinned
      });

      // Show success notification
      success(
        'Post Created!',
        `Your post "${formData.title.trim()}" has been published successfully.`,
        { duration: 3000 }
      );

      // Reset form and close modal
      setFormData({
        title: '',
        content: '',
        categoryId: selectedCategoryId || '',
        tags: '',
        pinned: false
      });
      setUploadedImages([]);
      onClose();
      
    } catch (err) {
      const errorMessage = err.message || 'Failed to create post';
      setError(errorMessage);
      
      // Show error toast
      showError(
        'Failed to Create Post',
        errorMessage,
        { duration: 6000 }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-warm-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-warm-900 dark:text-white flex items-center">
            <FileText className="w-6 h-6 mr-2 text-warm-500 dark:text-orange-400" />
            Create New Post
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-warm-100 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5 text-warm-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-warm-700 dark:text-slate-300 mb-2">
              Post Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter a descriptive title for your post..."
              className="w-full px-4 py-3 border border-warm-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-warm-500 dark:focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="categoryId" className="flex items-center text-sm font-medium text-warm-700 dark:text-slate-300 mb-2">
              <Folder className="w-4 h-4 mr-1" />
              Category *
            </label>
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-warm-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-warm-500 dark:focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              required
            >
              <option value="">Select a category...</option>
              {categories
                .filter(cat => cat._id !== 'all')
                .map(category => (
                <option key={category._id} value={category._id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-warm-700 dark:text-slate-300 mb-2">
              Content *
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Share your thoughts, ask questions, or start a discussion..."
              rows={8}
              className="w-full px-4 py-3 border border-warm-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-warm-500 dark:focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white resize-vertical"
              required
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="flex items-center text-sm font-medium text-warm-700 dark:text-slate-300 mb-2">
              <Image className="w-4 h-4 mr-1" />
              Images (optional)
            </label>
            
            {/* Upload Button */}
            <div className="mb-4">
              <label className="inline-flex items-center px-4 py-2 border border-warm-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-warm-50 dark:hover:bg-slate-700 transition-colors duration-200">
                <Image className="w-4 h-4 mr-2" />
                <span className="text-sm text-warm-600 dark:text-slate-400">Choose Images</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-warm-500 dark:text-slate-400 mt-1">
                Maximum 5MB per image. Supported formats: JPG, PNG, GIF, WebP
              </p>
            </div>

            {/* Image Preview */}
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {uploadedImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.data}
                      alt={image.name}
                      className="w-full h-24 object-cover rounded-lg border border-warm-200 dark:border-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded">
                      {image.name.length > 15 ? image.name.substring(0, 15) + '...' : image.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="flex items-center text-sm font-medium text-warm-700 dark:text-slate-300 mb-2">
              <Tag className="w-4 h-4 mr-1" />
              Tags (optional)
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="prayer, community, announcement (separate with commas)"
              className="w-full px-4 py-3 border border-warm-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-warm-500 dark:focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            />
            <p className="text-xs text-warm-500 dark:text-slate-400 mt-1">
              Separate multiple tags with commas
            </p>
          </div>

          {/* Pin Post (for admins/moderators) */}
          {Meteor.user()?.profile?.role === 'admin' || Meteor.user()?.profile?.role === 'moderator' ? (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="pinned"
                name="pinned"
                checked={formData.pinned}
                onChange={handleInputChange}
                className="w-4 h-4 text-warm-600 bg-warm-100 border-warm-300 rounded focus:ring-warm-500 dark:focus:ring-orange-500 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
              />
              <label htmlFor="pinned" className="ml-2 text-sm font-medium text-warm-700 dark:text-slate-300">
                Pin this post (appears at the top of the forum)
              </label>
            </div>
          ) : null}

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-warm-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-warm-300 dark:border-slate-600 text-warm-700 dark:text-slate-300 rounded-lg hover:bg-warm-50 dark:hover:bg-slate-700 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-warm-500 hover:bg-warm-600 dark:bg-orange-500 dark:hover:bg-orange-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Create Post
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
