import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Search, Pin, Lock, Unlock, Trash2, ThumbsUp, MessageSquare } from 'lucide-react';
import { ForumPosts, ForumCategories } from '/imports/api/forums/collections';
import { ForumPublications } from '/imports/api/forums/index';

export const ForumPostManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get posts and categories from publications
  const { posts, categories, loading } = useTracker(() => {
    // Subscribe to categories
    const categoriesHandle = Meteor.subscribe(ForumPublications.categories);
    
    // Build post query options
    const postQueryOptions = {
      categoryId: searchCategory === 'all' ? null : searchCategory,
      searchTerm: searchTerm.length >= 2 ? searchTerm : null,
      sortBy,
      limit: 20,
      skip: 0
    };
    
    // Subscribe to posts
    const postsHandle = Meteor.subscribe(ForumPublications.postsList, postQueryOptions);
    
    // Get user data for authors
    const usersHandle = Meteor.subscribe('usersBasic');
    
    const isLoading = !categoriesHandle.ready() || !postsHandle.ready() || !usersHandle.ready();
    
    // Build query for client-side filtering
    let postQuery = {};
    if (searchCategory !== 'all') {
      postQuery.categoryId = searchCategory;
    }
    if (searchTerm && searchTerm.length >= 2) {
      postQuery.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { content: { $regex: searchTerm, $options: 'i' } },
      ];
    }
    
    // Build sort options
    let sortOptions = {};
    switch (sortBy) {
      case 'recent':
        sortOptions = { createdAt: -1 };
        break;
      case 'popular':
        sortOptions = { replyCount: -1 };
        break;
      case 'likes':
        sortOptions = { likeCount: -1, createdAt: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    return {
      categories: ForumCategories.find({}, { sort: { order: 1 } }).fetch(),
      posts: ForumPosts.find(postQuery, { sort: sortOptions, limit: 20 }).fetch(),
      loading: isLoading
    };
  }, [searchTerm, searchCategory, sortBy]);

  const handlePinPost = async (postId, currentlyPinned) => {
    try {
      setIsSubmitting(true);
      setMessage('');
      
      await Meteor.callAsync('forums.posts.update', postId, { pinned: !currentlyPinned });
      setMessage(`Post ${currentlyPinned ? 'unpinned' : 'pinned'} successfully`);
      setMessageType('success');
    } catch (error) {
      console.error('Error updating post pin status:', error);
      setMessage(`Error: ${error.reason || error.message}`);
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLockPost = async (postId, currentlyLocked) => {
    try {
      setIsSubmitting(true);
      setMessage('');
      
      await Meteor.callAsync('forums.posts.update', postId, { locked: !currentlyLocked });
      setMessage(`Post ${currentlyLocked ? 'unlocked' : 'locked'} successfully`);
      setMessageType('success');
    } catch (error) {
      console.error('Error updating post lock status:', error);
      setMessage(`Error: ${error.reason || error.message}`);
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async (postId, title) => {
    if (!confirm(`Are you sure you want to delete the post "${title}"? This cannot be undone.`)) return;
    
    try {
      setIsSubmitting(true);
      setMessage('');
      
      await Meteor.callAsync('forums.posts.delete', postId);
      setMessage('Post deleted successfully');
      setMessageType('success');
    } catch (error) {
      console.error('Error deleting post:', error);
      setMessage(`Error: ${error.reason || error.message}`);
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat._id === categoryId);
    return category ? category.name : 'Unknown';
  };

  const getCategoryColor = (categoryId) => {
    const category = categories.find(cat => cat._id === categoryId);
    return category?.color || '#3B82F6';
  };

  const getAuthorName = (authorId) => {
    const user = Meteor.users.findOne(authorId);
    return user?.profile?.name || user?.username || 'Unknown';
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  // Truncate text
  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-3 mb-4 rounded-md ${messageType === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
          {message}
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow border border-slate-200 dark:border-slate-700 space-y-4">
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">Search & Filter Posts</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search posts..."
              className="pl-10 w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          
          {/* Category Filter */}
          <div>
            <select
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>
                  {category.name} ({category.postCount})
                </option>
              ))}
            </select>
          </div>
          
          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
              <option value="likes">Most Liked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
        {loading ? (
          <div className="p-4 text-center text-slate-600 dark:text-slate-400">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="p-4 text-center text-slate-600 dark:text-slate-400">No posts found matching the criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Title & Content
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {posts.map(post => (
                  <tr key={post._id}>
                    <td className="px-4 py-3">
                      <div className="max-w-xs sm:max-w-none">
                        <div className="flex items-center space-x-1">
                          {post.pinned && (
                            <Pin className="h-3.5 w-3.5 text-amber-500 -rotate-45" />
                          )}
                          {post.locked && (
                            <Lock className="h-3.5 w-3.5 text-red-500" />
                          )}
                          <div className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-xs">
                            {post.title}
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {truncateText(post.content)}
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          Posted: {formatDate(post.createdAt)}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span 
                        className="px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: `${getCategoryColor(post.categoryId)}20`, 
                          color: getCategoryColor(post.categoryId) 
                        }}
                      >
                        {getCategoryName(post.categoryId)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {getAuthorName(post.authorId)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex space-x-3 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center">
                          <ThumbsUp className="h-3.5 w-3.5 mr-1" />
                          {post.likes?.length || 0}
                        </div>
                        <div className="flex items-center">
                          <MessageSquare className="h-3.5 w-3.5 mr-1" />
                          {post.replyCount || 0}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handlePinPost(post._id, post.pinned)}
                          disabled={isSubmitting}
                          className={`p-1 ${
                            post.pinned
                              ? 'text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300'
                              : 'text-slate-600 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400'
                          }`}
                          title={post.pinned ? "Unpin post" : "Pin post"}
                        >
                          <Pin className="h-4 w-4 -rotate-45" />
                        </button>
                        <button
                          onClick={() => handleLockPost(post._id, post.locked)}
                          disabled={isSubmitting}
                          className={`p-1 ${
                            post.locked
                              ? 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300'
                              : 'text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400'
                          }`}
                          title={post.locked ? "Unlock post" : "Lock post"}
                        >
                          {post.locked ? (
                            <Lock className="h-4 w-4" />
                          ) : (
                            <Unlock className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeletePost(post._id, post.title)}
                          disabled={isSubmitting}
                          className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete post"
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
  );
};
