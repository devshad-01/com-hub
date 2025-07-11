import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { ForumCategories } from '/imports/api/forums/collections';
import { ForumPublications } from '/imports/api/forums/index';

export const ForumManagement = () => {
  // State for category form
  const [categoryForm, setCategoryForm] = useState({
    _id: null,
    name: '',
    description: '',
    icon: '',
    color: '#3B82F6',
  });

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get categories from publication
  const { categories, loading } = useTracker(() => {
    const handle = Meteor.subscribe(ForumPublications.categories);
    return {
      categories: ForumCategories.find({}, { sort: { order: 1 } }).fetch(),
      loading: !handle.ready(),
    };
  }, []);

  const resetForm = () => {
    setCategoryForm({
      _id: null,
      name: '',
      description: '',
      icon: '',
      color: '#3B82F6',
    });
    setEditingCategory(false);
  };

  const handleCategoryChange = (e) => {
    const { name, value } = e.target;
    setCategoryForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditCategory = (category) => {
    setCategoryForm({
      _id: category._id,
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color || '#3B82F6',
    });
    setEditingCategory(true);
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('Are you sure you want to delete this category? This cannot be undone.')) return;
    
    try {
      await Meteor.callAsync('forums.categories.delete', categoryId);
      setMessage('Category deleted successfully');
      setMessageType('success');
    } catch (error) {
      console.error('Error deleting category:', error);
      setMessage(`Error: ${error.reason || error.message}`);
      setMessageType('error');
    }
  };

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    setIsSubmitting(true);
    setMessage('');
    
    try {
      const categoryData = { 
        name: categoryForm.name,
        description: categoryForm.description,
        icon: categoryForm.icon,
        color: categoryForm.color
      };

      if (editingCategory) {
        // Update existing category
        await Meteor.callAsync('forums.categories.update', categoryForm._id, categoryData);
        setMessage('Category updated successfully');
      } else {
        // Create new category
        await Meteor.callAsync('forums.categories.create', categoryData);
        setMessage('Category created successfully');
      }

      setMessageType('success');
      resetForm();
      setShowCategoryForm(false);
    } catch (error) {
      console.error('Error saving category:', error);
      setMessage(`Error: ${error.reason || error.message}`);
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Common emojis for forum categories
  const commonEmojis = ['💬', '📢', '✝️', '🙏', '📅', '🤝', '💭', '🔥', '📚', '🎵', '🎉'];

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-3 mb-4 rounded-md ${messageType === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
          {message}
        </div>
      )}

      {/* Categories Section */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Forum Categories</h3>
          <button
            onClick={() => {
              resetForm();
              setShowCategoryForm(!showCategoryForm);
            }}
            className={`flex items-center px-3 py-1.5 rounded-md ${
              showCategoryForm 
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white text-sm font-medium transition-colors duration-200`}
          >
            {showCategoryForm ? (
              <>
                <X className="h-4 w-4 mr-1.5" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1.5" />
                Add Category
              </>
            )}
          </button>
        </div>

        {/* Category Form */}
        {showCategoryForm && (
          <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-md shadow-sm mb-6">
            <form onSubmit={handleSubmitCategory} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={categoryForm.name}
                    onChange={handleCategoryChange}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="color" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                    Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      id="color"
                      name="color"
                      value={categoryForm.color}
                      onChange={handleCategoryChange}
                      className="h-9 w-16 border-0 rounded p-0"
                      disabled={isSubmitting}
                    />
                    <span 
                      className="px-2 py-1 rounded-md text-sm font-medium" 
                      style={{ 
                        backgroundColor: `${categoryForm.color}20`, 
                        color: categoryForm.color 
                      }}
                    >
                      {categoryForm.name || 'Sample Text'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={categoryForm.description}
                  onChange={handleCategoryChange}
                  rows="2"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                  disabled={isSubmitting}
                ></textarea>
              </div>

              <div>
                <label htmlFor="icon" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Icon (Emoji)
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    id="icon"
                    name="icon"
                    value={categoryForm.icon}
                    onChange={handleCategoryChange}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    maxLength="2"
                    required
                    disabled={isSubmitting}
                    placeholder="Use an emoji"
                  />
                  <div className="flex flex-wrap gap-2">
                    {commonEmojis.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setCategoryForm(prev => ({ ...prev, icon: emoji }))}
                        className={`w-8 h-8 flex items-center justify-center text-lg rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors ${
                          categoryForm.icon === emoji ? 'bg-slate-200 dark:bg-slate-600' : ''
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-md font-medium text-white transition-colors ${
                    isSubmitting
                      ? 'bg-gray-500 cursor-not-allowed'
                      : editingCategory
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSubmitting
                    ? 'Saving...'
                    : editingCategory
                      ? 'Update Category'
                      : 'Add Category'
                  }
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Categories List */}
        <div className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
          {loading ? (
            <div className="p-4 text-center text-slate-600 dark:text-slate-400">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="p-4 text-center text-slate-600 dark:text-slate-400">No categories found. Create your first category!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Icon
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Posts
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  {categories.map(category => (
                    <tr key={category._id}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-2xl">{category.icon || '💬'}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            {category.name}
                          </div>
                          <div 
                            className="text-xs px-1 py-0.5 rounded-sm inline-block mt-1" 
                            style={{ 
                              backgroundColor: `${category.color || '#3B82F6'}20`, 
                              color: category.color || '#3B82F6'
                            }}
                          >
                            {category.slug}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {category.description}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                        {category.postCount}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Edit category"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category._id)}
                            disabled={category.postCount > 0}
                            className={`p-1 ${
                              category.postCount > 0
                                ? 'text-slate-400 cursor-not-allowed'
                                : 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300'
                            }`}
                            title={category.postCount > 0 ? "Cannot delete category with posts" : "Delete category"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Post Management Section - Can be expanded later */}
      <div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Forum Posts</h3>
        <p className="text-slate-600 dark:text-slate-400">
          Manage forum posts from the forums page. You can pin, lock or delete posts from there.
        </p>
      </div>
    </div>
  );
};
