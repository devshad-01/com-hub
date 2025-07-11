import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';

// Import your ForumPost component
import { ForumPost } from '../components/forum/ForumPost'; // Adjusted path as per your ForumPage

// Import your Forum API collections directly (as seen in publications.js)
import { ForumCategories, ForumPosts, ForumReplies } from '../../api/forums/collections'; // Assuming collections are in `api/forums/collections.js`

// Import your Forum API publications (assuming this file is at api/forums/publications.js)
// NOTE: We don't import the publication *object* itself, but rather use the string names directly
// as defined in publications.js
// No explicit import for ForumPublications object is needed if we use direct strings.

// You will still need ForumFormatting from your utilities file
import { ForumFormatting } from '../../api/forums/utils'; // Adjust this path if different

import { ROLES } from '../../api/users/roles'; // Assuming this path

// Import custom hooks and common components
import { useToastContext } from '../components/common/ToastProvider';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Alert } from '../components/common/Alert';
import { Button } from '../components/common/Button';
import { useForumActions } from '../hooks/useForumActions';
import { useAuth } from '../contexts/AuthContext';

export const PostDetailPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useToastContext();
  const { handleLikePost: likePost, handleSubmitReply: submitReply, handleLikeReply: likeReply } = useForumActions();
  const { getUserRoles } = useAuth();

  const [replyToggles, setReplyToggles] = useState({});
  const [replyContents, setReplyContents] = useState({});
  const [submittingReplies, setSubmittingReplies] = useState({});
  const [showMoreReplies, setShowMoreReplies] = useState({});

  // --- Data Fetching with useTracker ---
  const { post, replies, user, categories, isLoading } = useTracker(() => {
    // Correct publication names based on your publications.js
    const postHandle = Meteor.subscribe('forums.posts.single', postId);
    const repliesHandle = Meteor.subscribe('forums.replies.byPost', postId);
    const categoriesHandle = Meteor.subscribe('forums.categories'); // Corrected from 'forums.categories.list'
    const usersBasicHandle = Meteor.subscribe('usersBasic'); // For user avatars/names

    const isPostSubReady = postHandle.ready();
    const isRepliesSubReady = repliesHandle.ready();
    const isCategoriesSubReady = categoriesHandle.ready();
    const isUsersBasicReady = usersBasicHandle.ready();

    // Fetch data using the imported collections (ForumPosts, ForumReplies, ForumCategories)
    const currentPost = isPostSubReady ? ForumPosts.findOne(postId) : undefined;
    const allReplies = isRepliesSubReady ? ForumReplies.find({ postId: postId }, { sort: { createdAt: 1 } }).fetch() : [];
    const allCategories = isCategoriesSubReady ? ForumCategories.find({}, { sort: { order: 1, name: 1 } }).fetch() : [];

    return {
      post: currentPost,
      replies: allReplies,
      user: Meteor.user(),
      categories: allCategories,
      isLoading: !isPostSubReady || !isRepliesSubReady || !isCategoriesSubReady || !isUsersBasicReady,
    };
  }, [postId]);

  // --- Helper Functions - Using ForumFormatting and Auth Context ---
  const getCategoryColor = useCallback((categoryId) => {
    const category = categories.find(c => c._id === categoryId);
    if (!category) return 'slate';

    const colorMap = {
      'announcements': 'warm',
      'faith-life': 'orange',
      'prayer': 'purple',
      'events': 'blue',
      'support': 'green',
      'general': 'slate'
    };

    const categoryName = category.name?.toLowerCase().replace(/\s+/g, '-');
    return colorMap[categoryName] || colorMap[category.slug] || 'slate';
  }, [categories]);

  const getCategoryInfo = useCallback((categoryId) => {
    const category = categories.find(c => c._id === categoryId);
    return category || { name: 'General', icon: '💭' };
  }, [categories]);

  const formatTimeAgo = useCallback((date) => {
    // Use the existing ForumFormatting utility
    return ForumFormatting.timeAgo(date);
  }, []);

  const getUserRole = useCallback((userId) => {
    const userToFind = Meteor.users.findOne(userId);
    if (!userToFind) return 'member';

    const userRoles = getUserRoles(userId);

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

  // --- Handlers for ForumPost props ---
  const handleLikePost = useCallback(async (postIdToLike) => {
    if (!user) {
      showError('Authentication Required', 'Please log in to like posts');
      return;
    }
    try {
      await likePost(postIdToLike);
    } catch (error) {
      showError('Like Failed', error.message);
    }
  }, [user, likePost, showError]);

  const handleLikeReply = useCallback(async (replyIdToLike) => {
    if (!user) {
      showError('Authentication Required', 'Please log in to like replies');
      return;
    }
    try {
      await likeReply(replyIdToLike);
    } catch (error) {
      showError('Like Failed', error.message);
    }
  }, [user, likeReply, showError]);

  const toggleReply = useCallback((id) => {
    setReplyToggles(prev => ({ ...prev, [id]: !prev[id] }));
    if (!replyToggles[id]) { // If showing, clear content
      setReplyContents(prev => ({ ...prev, [id]: '' }));
    }
  }, [replyToggles]);

  const handleReplyContentChange = useCallback((id, content) => {
    setReplyContents(prev => ({ ...prev, [id]: content }));
  }, []);

  const handleSubmitReply = useCallback(async (e, postIdToReply, parentReplyId = null) => {
    e.preventDefault();
    if (!user) {
      showError('Authentication Required', 'Please log in to reply');
      return;
    }
    
    // For nested replies, use the parentReplyId as the key for content and submission state
    const contentKey = parentReplyId || postIdToReply;
    const content = replyContents[contentKey]?.trim();
    if (!content) {
      showError('Empty Reply', 'Please enter a reply before submitting');
      return;
    }

    setSubmittingReplies(prev => ({ ...prev, [contentKey]: true }));
    try {
      await submitReply({ 
        postId: postIdToReply, 
        content,
        parentReplyId: parentReplyId 
      });
      success('Reply Posted!', 'Your reply has been posted successfully.', { duration: 3000 });
      setReplyContents(prev => ({ ...prev, [contentKey]: '' }));
      setReplyToggles(prev => ({ ...prev, [contentKey]: false }));
    } catch (error) {
      console.error('Error submitting reply:', error);
      showError('Failed to post reply: ' + (error.reason || error.message));
    } finally {
      setSubmittingReplies(prev => ({ ...prev, [contentKey]: false }));
    }
  }, [user, replyContents, submitReply, success, showError]);

  const toggleShowMoreReplies = useCallback((replyId) => {
    setShowMoreReplies(prev => ({
      ...prev,
      [replyId]: !prev[replyId]
    }));
  }, []);

  // Scroll to top when postId changes (when navigating to a new post detail)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [postId]);

  // --- Render Logic ---
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-warm-50 to-orange-50 dark:from-slate-900 dark:to-slate-800 transition-smooth">
        <LoadingSpinner size="lg" text="Loading post..." />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-warm-50 to-orange-50 dark:from-slate-900 dark:to-slate-800 transition-smooth py-6 sm:py-8 lg:py-10">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 text-center">
          <Alert variant="error" title="Post Not Found" message="The post you are looking for does not exist or has been deleted." />
          <Button onClick={() => navigate('/forum')} className="mt-6">Back to Forum</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-50 to-orange-50 dark:from-slate-900 dark:to-slate-800 transition-smooth py-6 sm:py-8 lg:py-10">
      <div className="max-w-4xl mx-auto px-3 sm:px-4">
        {/* Back button */}
        <div className="mb-6">
          <Button variant="link" onClick={() => navigate('/forum')} className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">
            &larr; Back to Forum
          </Button>
        </div>

        {/* Render the ForumPost component */}
        <ForumPost
          post={post}
          user={user}
          isPinned={post.pinned || false}
          getCategoryInfo={getCategoryInfo}
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
          allReplies={replies}
          showMoreReplies={showMoreReplies}
          toggleShowMoreReplies={toggleShowMoreReplies}
        />
      </div>
    </div>
  );
};