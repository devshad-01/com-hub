import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import { X, MessageCircle } from 'lucide-react';
import { 
  ForumCategories, 
  ForumPublications, 
  ForumMethods,
  ForumFormatting,
  FORUM_CONSTANTS 
} from '../../api/forums';
import { useToastContext } from '../components/common/ToastProvider';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useForumActions } from '../hooks/useForumActions';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useForumPosts } from '../hooks/useForumPosts';
import { 
  ForumHeader,
  ForumSidebar,
  PostsList,
  PostsSkeleton,
  ProgressivePostsSkeleton,
  InlinePostComposer
} from '../components/forum';
import { GeneralChat } from '../components/chat';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../../api/users/roles';

export const ForumPage = () => {
  const { success, error: showError } = useToastContext();
  const navigate = useNavigate();
  const { handleLikePost: likePost, handleSubmitReply: submitReply, handleLikeReply: likeReply } = useForumActions();
  const { getUserRoles } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [showGeneralChat, setShowGeneralChat] = useState(false);
  const [replyToggles, setReplyToggles] = useState({}); // Track which posts have reply boxes open
  const [replyContents, setReplyContents] = useState({}); // Track reply content for each post
  const [submittingReplies, setSubmittingReplies] = useState({}); // Track which replies are being submitted
  const [showMoreReplies, setShowMoreReplies] = useState({}); // Track which posts show all replies
  const [composerExpanded, setComposerExpanded] = useState(false); // Track composer state

  // Debounce search term to prevent excessive re-renders
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Separate subscription for categories (stable)
  const { user, categories, loading: categoriesLoading } = useTracker(() => {
    const categoriesHandle = Meteor.subscribe(ForumPublications.categories);
    const usersHandle = Meteor.subscribe('usersBasic'); // Subscribe to user data for avatars
    
    const loading = !categoriesHandle.ready() || !usersHandle.ready();
    
    if (loading) {
      return {
        user: Meteor.user(),
        categories: [],
        loading: true
      };
    }

    // Get categories from database
    const categoriesFromDB = ForumCategories.find({}, { sort: { order: 1, name: 1 } }).fetch();
    
    // Add "All Topics" option with stable structure
    const allCategories = [
      { 
        _id: 'all', 
        name: 'All Topics', 
        postCount: 0,
        icon: '💬' 
      },
      ...categoriesFromDB
    ];

    return {
      user: Meteor.user(),
      categories: allCategories,
      loading: false
    };
  }, []); // No dependencies for stable categories

  // Use the new infinite scroll posts hook
  const {
    pinnedPosts,
    regularPosts,
    allReplies,
    loading: dataLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    totalLoaded
  } = useForumPosts({
    selectedCategory,
    searchTerm: debouncedSearchTerm,
    sortBy,
    initialLimit: 8 // Start with 8 posts, load 8 more each time
  });

  // Set up infinite scroll
  const { triggerRef } = useInfiniteScroll({
    threshold: 300,
    enabled: !dataLoading && hasMore,
    onLoadMore: loadMore,
    loading: isLoadingMore,
    hasMore
  });

  const loading = categoriesLoading || dataLoading;

  // Memoize helper functions to prevent unnecessary re-renders
  const getCategoryColor = useCallback((categoryId) => {
    const category = categories.find(c => c._id === categoryId);
    if (!category) return 'slate';
    
    // Map category names to colors
    const colorMap = {
      'announcements': 'warm',
      'faith-life': 'orange', 
      'prayer': 'purple',
      'events': 'blue',
      'support': 'green',
      'general': 'slate'
    };
    
    // Try to match by name or slug
    const categoryName = category.name?.toLowerCase().replace(/\s+/g, '-');
    return colorMap[categoryName] || colorMap[category.slug] || 'slate';
  }, [categories]);

  const getCategoryInfo = useCallback((categoryId) => {
    const category = categories.find(c => c._id === categoryId);
    return category || { name: 'General', icon: '💭' };
  }, [categories]);

  // Memoize other helper functions
  const formatTimeAgo = useCallback((date) => {
    if (!date) return 'Unknown';
    
    const dateObj = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffInHours = Math.floor((now - dateObj) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  }, []);

  const getUserRole = useCallback((userId) => {
    const user = Meteor.users.findOne(userId);
    if (!user) return 'member';
    
    // Use the new unified role system
    const userRoles = getUserRoles(userId);
    
    // Return the highest privilege role for display
    if (userRoles.includes(ROLES.SUPERADMIN)) return ROLES.SUPERADMIN;
    if (userRoles.includes(ROLES.ADMIN)) return ROLES.ADMIN;
    if (userRoles.includes(ROLES.MODERATOR)) return ROLES.MODERATOR;
    if (userRoles.includes(ROLES.EVENT_CREATOR)) return ROLES.EVENT_CREATOR;
    
    return ROLES.MEMBER;
  }, [getUserRoles]);

  const getRoleColor = useCallback((role) => {
    const colors = {
      [ROLES.SUPERADMIN]: 'purple',
      [ROLES.ADMIN]: 'red', 
      [ROLES.MODERATOR]: 'amber',
      [ROLES.EVENT_CREATOR]: 'green',
      [ROLES.MEMBER]: 'blue'
    };
    return colors[role] || 'blue';
  }, []);

  // Memoize search and sort handlers to prevent SearchAndSort re-renders
  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
    // Close chat when searching
    if (showGeneralChat) {
      setShowGeneralChat(false);
    }
  }, [showGeneralChat]);

  const handleSortChange = useCallback((value) => {
    setSortBy(value);
    // Close chat when changing sort
    if (showGeneralChat) {
      setShowGeneralChat(false);
    }
  }, [showGeneralChat]);

  // Memoize category change handler to prevent ForumSidebar re-renders
  const handleCategoryChange = useCallback((categoryId) => {
    setSelectedCategory(categoryId);
    // Close chat when switching categories
    if (showGeneralChat) {
      setShowGeneralChat(false);
    }
  }, [showGeneralChat]);

  const handlePostCreated = useCallback(() => {
    // Close chat when a new post is created
    if (showGeneralChat) {
      setShowGeneralChat(false);
    }
    // Optionally refresh the posts or the page will auto-update due to reactivity
  }, [showGeneralChat]);

  const handleToggleChat = () => {
    if (!user) {
      alert('Please log in to access chat');
      return;
    }
    setShowGeneralChat(!showGeneralChat);
  };

  const toggleReply = (postId) => {
    setReplyToggles(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
    // Close chat when interacting with posts
    if (showGeneralChat) {
      setShowGeneralChat(false);
    }
  };

  const toggleShowMoreReplies = useCallback((postId) => {
    setShowMoreReplies(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
    // Close chat when interacting with posts
    if (showGeneralChat) {
      setShowGeneralChat(false);
    }
  }, [showGeneralChat]);

  const handleReplyContentChange = (postId, content) => {
    setReplyContents(prev => ({
      ...prev,
      [postId]: content
    }));
  };

  const handleLikePost = useCallback(async (postId) => {
    if (!user) {
      showError('Authentication Required', 'Please log in to like posts');
      return;
    }

    try {
      await likePost(postId);
      // Don't show success message for likes to avoid spam
      // Close chat when interacting with posts
      if (showGeneralChat) {
        setShowGeneralChat(false);
      }
    } catch (error) {
      showError('Like Failed', error.message);
    }
  }, [user, likePost, showError, showGeneralChat]);

  // Enhanced: handleSubmitReply for posts and replies
  const handleSubmitReply = useCallback(async (e, postId, parentReplyId = null) => {
    e.preventDefault();
    if (!user) {
      showError('Authentication Required', 'Please log in to reply');
      return;
    }
    
    // Use parentReplyId as key if replying to a reply, else postId
    const key = parentReplyId || postId;
    const content = replyContents[key];
    
    if (!content || !content.trim()) {
      showError('Empty Reply', 'Please enter a reply before submitting');
      return;
    }
    setSubmittingReplies(prev => ({ ...prev, [key]: true }));
    try {
      await submitReply({
        postId,
        content: content.trim(),
        parentReplyId
      });
      success(
        'Reply Posted!',
        'Your reply has been posted successfully.',
        { duration: 3000 }
      );
      setReplyContents(prev => ({ ...prev, [key]: '' }));
      setReplyToggles(prev => ({ ...prev, [key]: false }));
      if (showGeneralChat) {
        setShowGeneralChat(false);
      }
    } catch (error) {
      showError(
        'Failed to Post Reply',
        error.message,
        { duration: 5000 }
      );
    } finally {
      setSubmittingReplies(prev => ({ ...prev, [key]: false }));
    }
  }, [user, replyContents, submitReply, success, showError, showGeneralChat]);

  const handleLikeReply = useCallback(async (replyId) => {
    if (!user) {
      showError('Authentication Required', 'Please log in to like replies');
      return;
    }

    try {
      await likeReply(replyId);
      // Don't show success message for likes to avoid spam
      // Close chat when interacting with posts
      if (showGeneralChat) {
        setShowGeneralChat(false);
      }
    } catch (error) {
      showError('Like Failed', error.message);
    }
  }, [user, likeReply, showError, showGeneralChat]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-50 to-orange-50 dark:from-slate-900 dark:to-slate-800 transition-smooth">
      {/* Header */}
      <ForumHeader 
        user={user} 
        onToggleChat={handleToggleChat}
        isChatOpen={showGeneralChat}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        // Mobile filter props
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        categoriesLoading={categoriesLoading}
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-1 pb-3 sm:py-4 lg:py-8">
        {/* Mobile-First Responsive Layout */}
        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-8">
          {/* Sidebar - Desktop Only (Categories moved to header on mobile) */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="lg:sticky lg:top-4">
              <ForumSidebar
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
                loading={categoriesLoading}
              />
            </div>
          </div>

          {/* Main Content - Full width on mobile, 3/4 on desktop */}
          <div className="lg:col-span-3 min-w-0 overflow-hidden">
            {/* Inline Post Composer - Only show if user is logged in */}
            {user && !showGeneralChat && (
              <InlinePostComposer
                categories={categories}
                selectedCategoryId={selectedCategory !== 'all' ? selectedCategory : null}
                onPostCreated={handlePostCreated}
                isExpanded={composerExpanded}
                onToggleExpanded={setComposerExpanded}
              />
            )}

            {/* Loading indicator for data refresh */}
            {isLoadingMore && regularPosts.length > 0 && (
              <div className="flex items-center justify-center py-2 mb-4">
                <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 rounded-full px-4 py-2 shadow-warm border border-warm-200 dark:border-slate-700">
                  <div className="w-4 h-4 border-2 border-warm-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-warm-600 dark:text-slate-400">Loading more posts...</span>
                </div>
              </div>
            )}

            {showGeneralChat ? (
              <GeneralChat 
                isOpen={showGeneralChat}
                onClose={() => setShowGeneralChat(false)}
                user={user}
              />
            ) : dataLoading ? (
              <div className="space-y-8 animate-fadeIn">
                {/* Main Loading Spinner */}
                <div className="text-center py-12">
                  <LoadingSpinner size="lg" text="Loading forum posts..." />
                </div>

                {/* Skeleton placeholders for better UX */}
                <div className="space-y-6">
                  {/* Pinned Posts Skeleton */}
                  <div className="mb-6">
                    <div className="h-6 bg-warm-200 dark:bg-slate-700 rounded w-40 mb-4 animate-pulse"></div>
                    <PostsSkeleton count={1} isPinned={true} />
                  </div>
                  
                  {/* Regular Posts Progressive Skeleton */}
                  <div>
                    <div className="h-6 bg-warm-200 dark:bg-slate-700 rounded w-48 mb-4 animate-pulse"></div>
                    <ProgressivePostsSkeleton count={3} startDelay={200} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-fadeIn" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
                {/* Pinned Posts */}
                {pinnedPosts.length > 0 && (
                  <PostsList
                    posts={pinnedPosts}
                    user={user}
                    isPinned={true}
                    title="📌 Pinned Posts"
                    categoryInfo={getCategoryInfo}
                    getCategoryColor={getCategoryColor}
                    getRoleColor={getRoleColor}
                    formatTimeAgo={formatTimeAgo}
                    getUserRole={getUserRole}
                    handleLikePost={handleLikePost}
                    handleLikeReply={handleLikeReply}
                    toggleReply={toggleReply}
                    replyToggles={replyToggles}
                    replyContents={replyContents}
                    submittingReplies={submittingReplies}
                    handleReplyContentChange={handleReplyContentChange}
                    handleSubmitReply={handleSubmitReply}
                    allReplies={allReplies}
                    showMoreReplies={showMoreReplies}
                    toggleShowMoreReplies={toggleShowMoreReplies}
                    loading={dataLoading}
                    showFeedView={true} // Enable feed view for forum page
                  />
                )}

                {/* Regular Posts with Infinite Scroll */}
                <PostsList
                  posts={regularPosts}
                  user={user}
                  isPinned={false}
                  title={`💬 Recent Discussions ${totalLoaded > 0 ? `(${totalLoaded} loaded)` : ''}`}
                  categoryInfo={getCategoryInfo}
                  getCategoryColor={getCategoryColor}
                  getRoleColor={getRoleColor}
                  formatTimeAgo={formatTimeAgo}
                  getUserRole={getUserRole}
                  handleLikePost={handleLikePost}
                  handleLikeReply={handleLikeReply}
                  toggleReply={toggleReply}
                  replyToggles={replyToggles}
                  replyContents={replyContents}
                  submittingReplies={submittingReplies}
                  handleReplyContentChange={handleReplyContentChange}
                  handleSubmitReply={handleSubmitReply}
                  allReplies={allReplies}
                  showMoreReplies={showMoreReplies}
                  toggleShowMoreReplies={toggleShowMoreReplies}
                  // Infinite scroll props
                  isLoadingMore={isLoadingMore}
                  hasMore={hasMore}
                  onLoadMore={loadMore}
                  triggerRef={triggerRef}
                  totalLoaded={totalLoaded}
                  loading={dataLoading}
                  showFeedView={true} // Enable feed view for forum page
                />
              </div>
            )}
          </div>
        </div> 
      </div>

      {/* Floating Chat Button - Mobile Only */}
      {user && (
        <button
          onClick={handleToggleChat}
          className={`lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl transition-all duration-300 transform active:scale-95 ${
            showGeneralChat
              ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 dark:from-red-600 dark:to-red-700 dark:hover:from-red-700 dark:hover:to-red-800 rotate-45'
              : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 hover:scale-110'
          } text-white flex items-center justify-center`}
          title={showGeneralChat ? 'Close Chat' : 'Open General Chat'}
        >
          {showGeneralChat ? (
            <X className="w-6 h-6" />
          ) : (
            <MessageCircle className="w-6 h-6" />
          )}
        </button>
      )}
    </div>
  );
};