// Forum Actions Hook - Implements proper Meteor reactivity patterns
import { Meteor } from 'meteor/meteor';
import { useCallback } from 'react';
import { Tracker } from 'meteor/tracker';
import { ForumMethods } from '../../api/forums';

// Helper function to wrap Meteor method calls properly
const callForumMethod = (methodName, ...args) => {
  return new Promise((resolve, reject) => {
    // Use Tracker.nonreactive to completely isolate the method call
    Tracker.nonreactive(() => {
      Meteor.call(methodName, ...args, (error, result) => {
        // Use setTimeout instead of Tracker.afterFlush for better isolation
        setTimeout(() => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }, 0);
      });
    });
  });
};

export const useForumActions = () => {
  // Handle post liking with proper reactivity isolation
  const handleLikePost = useCallback(async (postId) => {
    if (!Meteor.userId()) {
      throw new Error('Please log in to like posts');
    }

    try {
      await callForumMethod(ForumMethods.votePost, postId, 'like');
      return true;
    } catch (error) {
      console.error('Error liking post:', error);
      throw new Error('Failed to like post. Please try again.');
    }
  }, []);

  // Handle reply submission with proper reactivity isolation
  const handleSubmitReply = useCallback(async (replyData) => {
    console.log('[handleSubmitReply] called with:', replyData);
    if (!Meteor.userId()) {
      throw new Error('Please log in to reply');
    }

    if (!replyData.content || !replyData.content.trim()) {
      throw new Error('Please enter a reply before submitting');
    }

    try {
      const result = await callForumMethod(ForumMethods.createReply, {
        postId: replyData.postId,
        content: replyData.content.trim(),
        parentReplyId: replyData.parentReplyId || null
      });
      console.log('[handleSubmitReply] reply created, result:', result);
      return result;
    } catch (error) {
      console.error('Error creating reply:', error);
      throw new Error(error.message || 'Failed to post reply. Please try again.');
    }
  }, []);

  // Handle reply liking with proper reactivity isolation
  const handleLikeReply = useCallback(async (replyId) => {
    if (!Meteor.userId()) {
      throw new Error('Please log in to like replies');
    }

    try {
      await callForumMethod(ForumMethods.voteReply, replyId, 'like');
      return true;
    } catch (error) {
      console.error('Error liking reply:', error);
      throw new Error('Failed to like reply. Please try again.');
    }
  }, []);

  // Handle post creation with proper reactivity isolation
  const handleCreatePost = useCallback(async (postData) => {
    if (!Meteor.userId()) {
      throw new Error('Please log in to create posts');
    }

    try {
      const result = await callForumMethod(ForumMethods.createPost, postData);
      return result;
    } catch (error) {
      console.error('Error creating post:', error);
      throw new Error(error.message || 'Failed to create post. Please try again.');
    }
  }, []);

  // Handle view increment with proper reactivity isolation
  const handleIncrementViews = useCallback(async (postId) => {
    try {
      await callForumMethod(ForumMethods.incrementViews, postId);
    } catch (error) {
      // Don't throw error for view increments, just log
      console.error('Error incrementing views:', error);
    }
  }, []);

  return {
    handleLikePost,
    handleSubmitReply,
    handleLikeReply,
    handleCreatePost,
    handleIncrementViews
  };
};
