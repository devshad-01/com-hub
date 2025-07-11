import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { ForumCategories, ForumPosts, ForumReplies, ForumTags } from './collections';
import { ForumValidation, ForumPermissions } from './utils';
import { FORUM_CONSTANTS } from './constants';
import { NotificationHelpers } from '../notifications/helpers';
import { Roles } from 'meteor/alanning:roles';

// Helper function to generate random tag colors
function generateTagColor() {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#F97316', '#6366F1', '#14B8A6', '#EAB308'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

Meteor.methods({
  // Category Methods
  async 'forums.categories.create'(categoryData) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to create categories');
    }

    // Check if user is admin using Roles package
    const isAdmin = await Roles.userIsInRoleAsync(this.userId, 'admin');
    if (!isAdmin) {
      throw new Meteor.Error('insufficient-permissions', 'Only admins can create categories');
    }

    check(categoryData, {
      name: String,
      description: String,
      icon: String,
      color: Match.Optional(String),
      order: Match.Optional(Number)
    });

    // Create slug from name
    const slug = categoryData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Check if slug already exists
    const existingCategory = await ForumCategories.findOneAsync({ slug });
    if (existingCategory) {
      throw new Meteor.Error('category-exists', 'Category with this name already exists');
    }

    const categoryId = await ForumCategories.insertAsync({
      ...categoryData,
      slug,
      postCount: 0,
      lastPostAt: null,
      lastPostId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return categoryId;
  },

  async 'forums.categories.update'(categoryId, updateData) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    // Check if user is admin using Roles package
    const isAdmin = await Roles.userIsInRoleAsync(this.userId, 'admin');
    if (!isAdmin) {
      throw new Meteor.Error('insufficient-permissions', 'Only admins can update categories');
    }

    check(categoryId, String);
    check(updateData, {
      name: Match.Optional(String),
      description: Match.Optional(String),
      icon: Match.Optional(String),
      color: Match.Optional(String),
      order: Match.Optional(Number)
    });

    const category = await ForumCategories.findOneAsync(categoryId);
    if (!category) {
      throw new Meteor.Error('category-not-found', 'Category not found');
    }

    // Update slug if name changed
    if (updateData.name) {
      updateData.slug = updateData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    await ForumCategories.updateAsync(categoryId, {
      $set: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    return categoryId;
  },

  async 'forums.categories.delete'(categoryId) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    // Check if user is admin using Roles package
    const isAdmin = await Roles.userIsInRoleAsync(this.userId, 'admin');
    if (!isAdmin) {
      throw new Meteor.Error('insufficient-permissions', 'Only admins can delete categories');
    }

    check(categoryId, String);

    // Check if category has posts
    const postCount = await ForumPosts.countDocuments({ categoryId });
    if (postCount > 0) {
      throw new Meteor.Error('category-has-posts', 'Cannot delete category with existing posts');
    }

    await ForumCategories.removeAsync(categoryId);
    return true;
  },

  // Post Methods
  async 'forums.posts.create'(postData) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to create posts');
    }

    check(postData, {
      title: String,
      content: String,
      categoryId: String,
      tags: Match.Optional([String]),
      pinned: Match.Optional(Boolean),
      images: Match.Optional([Match.OneOf(String, Object)]) // Allow array of string or object
    });

    // Validate category exists
    const category = await ForumCategories.findOneAsync(postData.categoryId);
    if (!category) {
      throw new Meteor.Error('category-not-found', 'Category not found');
    }

    // Only admins can create pinned posts
    const user = await Meteor.users.findOneAsync(this.userId);
    const canPin = user?.profile?.role === 'admin' || user?.profile?.role === 'moderator';
    
    const postId = await ForumPosts.insertAsync({
      title: postData.title,
      content: postData.content,
      categoryId: postData.categoryId,
      authorId: this.userId,
      tags: postData.tags || [],
      images: postData.images || [], // Store image objects or strings
      pinned: canPin ? (postData.pinned || false) : false,
      locked: false,
      replyCount: 0,
      views: 0,
      likes: [],
      dislikes: [],
      lastReplyAt: new Date(),
      lastReplyId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Update category post count and last post
    await ForumCategories.updateAsync(postData.categoryId, {
      $inc: { postCount: 1 },
      $set: {
        lastPostAt: new Date(),
        lastPostId: postId
      }
    });

    // Update tag usage count
    if (postData.tags && postData.tags.length > 0) {
      for (const tagName of postData.tags) {
        await ForumTags.upsertAsync(
          { name: tagName },
          {
            $inc: { usageCount: 1 },
            $setOnInsert: { 
              createdAt: new Date(),
              color: generateTagColor() 
            },
            $set: { updatedAt: new Date() }
          }
        );
      }
    }

    // Create notifications for new post
    if (Meteor.isServer) {
      await NotificationHelpers.createForNewPost(postId, postData.title, this.userId, postData.categoryId);
      
      // Detect and create mention notifications
      const mentions = NotificationHelpers.detectMentions(postData.content);
      if (mentions.length > 0) {
        const mentionedUsers = await NotificationHelpers.findUsersByUsernames(mentions);
        for (const mentionedUser of mentionedUsers) {
          if (mentionedUser._id !== this.userId) { // Don't notify self
            await NotificationHelpers.createForMention(
              mentionedUser._id,
              this.userId,
              'post',
              postId,
              postData.title,
              postData.content
            );
          }
        }
      }
    }

    return postId;
  },

  async 'forums.posts.update'(postId, updateData) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    check(postId, String);
    check(updateData, {
      title: Match.Optional(String),
      content: Match.Optional(String),
      tags: Match.Optional([String]),
      pinned: Match.Optional(Boolean),
      locked: Match.Optional(Boolean)
    });

    const post = await ForumPosts.findOneAsync(postId);
    if (!post) {
      throw new Meteor.Error('post-not-found', 'Post not found');
    }

    const user = await Meteor.users.findOneAsync(this.userId);
    const isAuthor = post.authorId === this.userId;
    const isModerator = user?.profile?.role === 'admin' || user?.profile?.role === 'moderator';

    // Check permissions
    if (!isAuthor && !isModerator) {
      throw new Meteor.Error('insufficient-permissions', 'You can only edit your own posts');
    }

    // Only moderators can pin/lock posts
    if (updateData.pinned !== undefined || updateData.locked !== undefined) {
      if (!isModerator) {
        throw new Meteor.Error('insufficient-permissions', 'Only moderators can pin or lock posts');
      }
    }

    // Update tag usage if tags changed
    if (updateData.tags) {
      const oldTags = post.tags || [];
      const newTags = updateData.tags || [];
      
      // Decrease count for removed tags
      const removedTags = oldTags.filter(tag => !newTags.includes(tag));
      for (const tagName of removedTags) {
        await ForumTags.updateAsync(
          { name: tagName },
          { $inc: { usageCount: -1 } }
        );
      }
      
      // Increase count for new tags
      const addedTags = newTags.filter(tag => !oldTags.includes(tag));
      for (const tagName of addedTags) {
        await ForumTags.upsertAsync(
          { name: tagName },
          {
            $inc: { usageCount: 1 },
            $setOnInsert: { 
              createdAt: new Date(),
              color: generateTagColor() 
            },
            $set: { updatedAt: new Date() }
          }
        );
      }
    }

    await ForumPosts.updateAsync(postId, {
      $set: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    return postId;
  },

  async 'forums.posts.delete'(postId) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    check(postId, String);

    const post = await ForumPosts.findOneAsync(postId);
    if (!post) {
      throw new Meteor.Error('post-not-found', 'Post not found');
    }

    const user = await Meteor.users.findOneAsync(this.userId);
    const isAuthor = post.authorId === this.userId;
    const isModerator = user?.profile?.role === 'admin' || user?.profile?.role === 'moderator';

    if (!isAuthor && !isModerator) {
      throw new Meteor.Error('insufficient-permissions', 'You can only delete your own posts');
    }

    // Delete all replies
    const replyCount = await ForumReplies.countDocuments({ postId });
    await ForumReplies.removeAsync({ postId });

    // Delete all images from storage
    if (post.images && post.images.length > 0) {
      for (const image of post.images) {
        if (typeof image === 'object') {
          if (image.provider === 'backblaze' && image.fileId && image.fileName) {
            await Meteor.callAsync('storage.deleteImage', { fileId: image.fileId, fileName: image.fileName });
          } else if (image.provider === 'cloudinary' && image.publicId) {
            await Meteor.callAsync('storage.deleteImage', image.publicId);
          } else if (image.fileId && image.fileName) {
            // fallback for Backblaze object without provider
            await Meteor.callAsync('storage.deleteImage', { fileId: image.fileId, fileName: image.fileName });
          } else if (image.publicId) {
            // fallback for Cloudinary object without provider
            await Meteor.callAsync('storage.deleteImage', image.publicId);
          } else {
            console.warn('Skipping image deletion: invalid image object', image);
          }
        } else if (typeof image === 'string') {
          // Try to detect provider from string
          if (image.startsWith('http') && image.includes('backblazeb2.com')) {
            // Backblaze legacy string URL, cannot delete without fileId/fileName
            console.warn('Cannot delete Backblaze image by URL only:', image);
          } else {
            // Assume Cloudinary publicId or legacy string
            await Meteor.callAsync('storage.deleteImage', image);
          }
        } else {
          console.warn('Skipping image deletion: unknown image type', image);
        }
      }
    }

    // Update category post count
    await ForumCategories.updateAsync(post.categoryId, {
      $inc: { postCount: -1 }
    });

    // Update tag usage count
    if (post.tags && post.tags.length > 0) {
      for (const tagName of post.tags) {
        await ForumTags.updateAsync(
          { name: tagName },
          { $inc: { usageCount: -1 } }
        );
      }
    }

    await ForumPosts.removeAsync(postId);
    return true;
  },

  async 'forums.posts.vote'(postId, voteType) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to vote');
    }

    check(postId, String);
    check(voteType, Match.OneOf('like', 'dislike', 'remove'));

    const post = await ForumPosts.findOneAsync(postId);
    if (!post) {
      throw new Meteor.Error('post-not-found', 'Post not found');
    }

    const likes = post.likes || [];
    const dislikes = post.dislikes || [];
    const hasLiked = likes.includes(this.userId);
    const hasDisliked = dislikes.includes(this.userId);

    let updateOperation = {};

    switch (voteType) {
      case 'like':
        if (hasLiked) {
          // Remove like
          updateOperation = { $pull: { likes: this.userId } };
        } else {
          // Add like and remove dislike if exists
          updateOperation = {
            $addToSet: { likes: this.userId },
            $pull: { dislikes: this.userId }
          };
        }
        break;
      
      case 'dislike':
        if (hasDisliked) {
          // Remove dislike
          updateOperation = { $pull: { dislikes: this.userId } };
        } else {
          // Add dislike and remove like if exists
          updateOperation = {
            $addToSet: { dislikes: this.userId },
            $pull: { likes: this.userId }
          };
        }
        break;
      
      case 'remove':
        // Remove both like and dislike
        updateOperation = {
          $pull: {
            likes: this.userId,
            dislikes: this.userId
          }
        };
        break;
    }

    await ForumPosts.updateAsync(postId, updateOperation);
    
    // Create notification for post like (only for new likes, not unlikes)
    if (Meteor.isServer && voteType === 'like' && !hasLiked && this.userId !== post.authorId) {
      await NotificationHelpers.createForPostLike(postId, post.title, this.userId, post.authorId);
    }
    
    return true;
  },

  async 'forums.posts.incrementViews'(postId) {
    check(postId, String);

    const post = await ForumPosts.findOneAsync(postId);
    if (!post) {
      throw new Meteor.Error('post-not-found', 'Post not found');
    }

    await ForumPosts.updateAsync(postId, {
      $inc: { views: 1 }
    });

    return true;
  },

  // Reply Methods
  async 'forums.replies.create'(replyData) {
    console.log('[forums.replies.create] called with:', replyData);
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to reply');
    }

    check(replyData, {
      postId: String,
      content: String,
      parentReplyId: Match.Optional(Match.OneOf(String, null, undefined))
    });

    const post = await ForumPosts.findOneAsync(replyData.postId);
    if (!post) {
      throw new Meteor.Error('post-not-found', 'Post not found');
    }

    if (post.locked) {
      const user = await Meteor.users.findOneAsync(this.userId);
      const isModerator = user?.profile?.role === 'admin' || user?.profile?.role === 'moderator';
      if (!isModerator) {
        throw new Meteor.Error('post-locked', 'This post is locked');
      }
    }

    // Validate parent reply if specified
    if (replyData.parentReplyId) {
      const parentReply = await ForumReplies.findOneAsync(replyData.parentReplyId);
      console.log('[forums.replies.create] parentReply:', parentReply);
      if (!parentReply || parentReply.postId !== replyData.postId) {
        throw new Meteor.Error('invalid-parent-reply', 'Invalid parent reply');
      }
    }

    const replyId = await ForumReplies.insertAsync({
      postId: replyData.postId,
      content: replyData.content,
      authorId: this.userId,
      parentReplyId: replyData.parentReplyId || null,
      likes: [],
      dislikes: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('[forums.replies.create] inserted replyId:', replyId, 'for postId:', replyData.postId, 'parentReplyId:', replyData.parentReplyId);

    // Update post reply count and last reply
    await ForumPosts.updateAsync(replyData.postId, {
      $inc: { replyCount: 1 },
      $set: {
        lastReplyAt: new Date(),
        lastReplyId: replyId
      }
    });

    // Create notifications for new reply
    if (Meteor.isServer) {
      await NotificationHelpers.createForNewReply(replyId, replyData.postId, replyData.content, this.userId, post.authorId);
      
      // Detect and create mention notifications
      const mentions = NotificationHelpers.detectMentions(replyData.content);
      if (mentions.length > 0) {
        const mentionedUsers = await NotificationHelpers.findUsersByUsernames(mentions);
        for (const mentionedUser of mentionedUsers) {
          if (mentionedUser._id !== this.userId) { // Don't notify self
            await NotificationHelpers.createForMention(
              mentionedUser._id,
              this.userId,
              'reply',
              replyId,
              `Reply to: ${post.title}`,
              replyData.content
            );
          }
        }
      }
    }

    return replyId;
  },

  async 'forums.replies.update'(replyId, content) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    check(replyId, String);
    check(content, String);

    const reply = await ForumReplies.findOneAsync(replyId);
    if (!reply) {
      throw new Meteor.Error('reply-not-found', 'Reply not found');
    }

    const user = await Meteor.users.findOneAsync(this.userId);
    const isAuthor = reply.authorId === this.userId;
    const isModerator = user?.profile?.role === 'admin' || user?.profile?.role === 'moderator';

    if (!isAuthor && !isModerator) {
      throw new Meteor.Error('insufficient-permissions', 'You can only edit your own replies');
    }

    await ForumReplies.updateAsync(replyId, {
      $set: {
        content,
        updatedAt: new Date()
      }
    });

    return replyId;
  },

  async 'forums.replies.delete'(replyId) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    check(replyId, String);

    const reply = await ForumReplies.findOneAsync(replyId);
    if (!reply) {
      throw new Meteor.Error('reply-not-found', 'Reply not found');
    }

    const user = await Meteor.users.findOneAsync(this.userId);
    const isAuthor = reply.authorId === this.userId;
    const isModerator = user?.profile?.role === 'admin' || user?.profile?.role === 'moderator';

    if (!isAuthor && !isModerator) {
      throw new Meteor.Error('insufficient-permissions', 'You can only delete your own replies');
    }

    // Recursively delete all descendants
    const deletedCount = await this.deleteReplyAndDescendants(replyId);

    // Update post reply count
    await ForumPosts.updateAsync(reply.postId, {
      $inc: { replyCount: -deletedCount }
    });

    return true;
  },

  // Helper method for recursive deletion
  async deleteReplyAndDescendants(replyId) {
    let totalDeleted = 0;
    const visited = new Set(); // Prevent infinite loops
    
    const deleteRecursively = async (currentReplyId) => {
      // Cycle detection
      if (visited.has(currentReplyId)) {
        console.warn(`Cycle detected in reply deletion: ${currentReplyId}`);
        return 0;
      }
      visited.add(currentReplyId);
      
      // Find all direct children
      const children = await ForumReplies.find({ parentReplyId: currentReplyId }).fetchAsync();
      let childrenDeleted = 0;
      
      // Recursively delete children first
      for (const child of children) {
        childrenDeleted += await deleteRecursively(child._id);
      }
      
      // Delete the current reply
      const deleteResult = await ForumReplies.removeAsync(currentReplyId);
      const currentDeleted = deleteResult ? 1 : 0;
      
      return currentDeleted + childrenDeleted;
    };
    
    totalDeleted = await deleteRecursively(replyId);
    return totalDeleted;
  },

  async 'forums.replies.vote'(replyId, voteType) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to vote');
    }

    check(replyId, String);
    check(voteType, Match.OneOf('like', 'dislike', 'remove'));

    const reply = await ForumReplies.findOneAsync(replyId);
    if (!reply) {
      throw new Meteor.Error('reply-not-found', 'Reply not found');
    }

    const likes = reply.likes || [];
    const dislikes = reply.dislikes || [];
    const hasLiked = likes.includes(this.userId);
    const hasDisliked = dislikes.includes(this.userId);

    let updateOperation = {};

    switch (voteType) {
      case 'like':
        if (hasLiked) {
          updateOperation = { $pull: { likes: this.userId } };
        } else {
          updateOperation = {
            $addToSet: { likes: this.userId },
            $pull: { dislikes: this.userId }
          };
        }
        break;
      
      case 'dislike':
        if (hasDisliked) {
          updateOperation = { $pull: { dislikes: this.userId } };
        } else {
          updateOperation = {
            $addToSet: { dislikes: this.userId },
            $pull: { likes: this.userId }
          };
        }
        break;
      
      case 'remove':
        updateOperation = {
          $pull: {
            likes: this.userId,
            dislikes: this.userId
          }
        };
        break;
    }

    await ForumReplies.updateAsync(replyId, updateOperation);
    return true;
  },

  // Tag Methods
  async 'forums.tags.search'(searchTerm) {
    check(searchTerm, String);

    if (searchTerm.length < 2) {
      return [];
    }

    const tags = await ForumTags.find(
      { name: new RegExp(searchTerm, 'i') },
      { 
        sort: { usageCount: -1 },
        limit: 10,
        fields: { name: 1, usageCount: 1, color: 1 }
      }
    ).fetchAsync();

    return tags;
  }
});
