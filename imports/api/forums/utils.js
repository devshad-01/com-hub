import { FORUM_CONSTANTS, FORUM_PERMISSIONS, FORUM_ERRORS } from './constants';
import { Roles } from 'meteor/alanning:roles';

/**
 * Validation utilities for forum data
 */
export const ForumValidation = {
  // Validate post title
  validateTitle(title) {
    if (!title || typeof title !== 'string') {
      throw new Meteor.Error(FORUM_ERRORS.TITLE_TOO_LONG, 'Title is required');
    }
    
    if (title.length > FORUM_CONSTANTS.MAX_TITLE_LENGTH) {
      throw new Meteor.Error(FORUM_ERRORS.TITLE_TOO_LONG, `Title cannot exceed ${FORUM_CONSTANTS.MAX_TITLE_LENGTH} characters`);
    }
    
    return title.trim();
  },

  // Validate post content
  validateContent(content) {
    if (!content || typeof content !== 'string') {
      throw new Meteor.Error(FORUM_ERRORS.CONTENT_TOO_LONG, 'Content is required');
    }
    
    if (content.length > FORUM_CONSTANTS.MAX_CONTENT_LENGTH) {
      throw new Meteor.Error(FORUM_ERRORS.CONTENT_TOO_LONG, `Content cannot exceed ${FORUM_CONSTANTS.MAX_CONTENT_LENGTH} characters`);
    }
    
    return content.trim();
  },

  // Validate tags
  validateTags(tags) {
    if (!tags || !Array.isArray(tags)) {
      return [];
    }
    
    if (tags.length > FORUM_CONSTANTS.MAX_TAGS_PER_POST) {
      throw new Meteor.Error(FORUM_ERRORS.TOO_MANY_TAGS, `Maximum ${FORUM_CONSTANTS.MAX_TAGS_PER_POST} tags allowed`);
    }
    
    const validTags = [];
    for (const tag of tags) {
      if (typeof tag === 'string' && tag.trim()) {
        const cleanTag = tag.trim().toLowerCase();
        if (cleanTag.length > FORUM_CONSTANTS.MAX_TAG_LENGTH) {
          throw new Meteor.Error(FORUM_ERRORS.TAG_TOO_LONG, `Tag "${tag}" cannot exceed ${FORUM_CONSTANTS.MAX_TAG_LENGTH} characters`);
        }
        if (!validTags.includes(cleanTag)) {
          validTags.push(cleanTag);
        }
      }
    }
    
    return validTags;
  }
};

/**
 * Permission checking utilities
 */
export const ForumPermissions = {
  // Check if user has specific role
  // Note: This can't be async due to how it's used in UI components
  hasRole(user, roles) {
    if (!user) return false;
    
    // Get the user ID
    const userId = user._id;
    
    if (!userId) return false;
    
    // On the client, check for role assignments that have been published
    if (Meteor.isClient) {
      // Handle both array of roles and single role
      const rolesToCheck = Array.isArray(roles) ? roles : [roles];
      
      // Check if we have any matching role assignments
      const assignments = Meteor.roleAssignment.find({
        'user._id': userId,
        'role._id': { $in: rolesToCheck }
      }).fetch();
      
      return assignments.length > 0;
    } else {
      // On the server side, we'll use the sync version for simplicity
      // In real async contexts, you should use userIsInRoleAsync instead
      return Array.isArray(roles) 
        ? Roles.userIsInRole(userId, roles) 
        : Roles.userIsInRole(userId, [roles]);
    }
  },

  // Check if user can moderate posts
  canModerate(user) {
    return this.hasRole(user, FORUM_PERMISSIONS.MODERATE_POSTS);
  },

  // Check if user can create categories
  canCreateCategory(user) {
    return this.hasRole(user, FORUM_PERMISSIONS.CREATE_CATEGORY);
  },

  // Check if user can pin/lock posts
  canPinLock(user) {
    return this.hasRole(user, FORUM_PERMISSIONS.PIN_LOCK_POSTS);
  },

  // Check if user can delete categories
  canDeleteCategory(user) {
    return this.hasRole(user, FORUM_PERMISSIONS.DELETE_CATEGORY);
  },

  // Check if user can post in locked threads
  canPostInLocked(user) {
    return this.hasRole(user, FORUM_PERMISSIONS.POST_IN_LOCKED);
  },

  // Check if user can edit specific post
  canEditPost(user, post) {
    if (!user || !post) return false;
    return post.authorId === user._id || this.canModerate(user);
  },

  // Check if user can delete specific post
  canDeletePost(user, post) {
    if (!user || !post) return false;
    return post.authorId === user._id || this.canModerate(user);
  }
};

/**
 * Formatting utilities
 */
export const ForumFormatting = {
  // Format time ago
  timeAgo(date) {
    const now = new Date();
    const diffInMs = now - new Date(date);
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    if (diffInMonths < 12) return `${diffInMonths}mo ago`;
    return `${diffInYears}y ago`;
  },

  // Format numbers with K/M suffix
  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
  },

  // Truncate text
  truncateText(text, maxLength = 150) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  },

  // Generate excerpt from content
  generateExcerpt(content, maxLength = 200) {
    if (!content) return '';
    
    // Remove HTML tags if any
    const plainText = content.replace(/<[^>]*>/g, '');
    
    // Truncate and clean up
    return this.truncateText(plainText, maxLength);
  },

  // Get category color classes
  getCategoryColorClasses(color) {
    const colorMap = {
      '#3B82F6': 'blue',
      '#EF4444': 'red',
      '#10B981': 'green',
      '#F59E0B': 'yellow',
      '#8B5CF6': 'purple',
      '#EC4899': 'pink',
      '#06B6D4': 'cyan',
      '#84CC16': 'lime',
      '#F97316': 'orange',
      '#6366F1': 'indigo',
      '#14B8A6': 'teal',
      '#EAB308': 'amber'
    };
    
    const colorName = colorMap[color] || 'slate';
    
    return {
      bg: `bg-${colorName}-100 dark:bg-${colorName}-900/20`,
      text: `text-${colorName}-800 dark:text-${colorName}-300`,
      border: `border-${colorName}-200 dark:border-${colorName}-800`
    };
  }
};

/**
 * Search utilities
 */
export const ForumSearch = {
  // Build search selector for MongoDB
  buildSearchSelector(searchTerm, categoryId, tags) {
    let selector = {};
    
    if (categoryId && categoryId !== 'all') {
      selector.categoryId = categoryId;
    }

    if (searchTerm && searchTerm.length >= FORUM_CONSTANTS.MIN_SEARCH_LENGTH) {
      selector.$or = [
        { title: new RegExp(searchTerm, 'i') },
        { content: new RegExp(searchTerm, 'i') }
      ];
    }

    if (tags && tags.length > 0) {
      selector.tags = { $in: tags };
    }

    return selector;
  },

  // Build sort options
  buildSortOptions(sortBy) {
    switch (sortBy) {
      case FORUM_CONSTANTS.SORT_OPTIONS.RECENT:
        return { pinned: -1, lastReplyAt: -1, createdAt: -1 };
      case FORUM_CONSTANTS.SORT_OPTIONS.POPULAR:
        return { pinned: -1, views: -1, replyCount: -1 };
      case FORUM_CONSTANTS.SORT_OPTIONS.LIKES:
        return { pinned: -1, likes: -1, createdAt: -1 };
      case FORUM_CONSTANTS.SORT_OPTIONS.OLDEST:
        return { pinned: -1, createdAt: 1 };
      default:
        return { pinned: -1, lastReplyAt: -1, createdAt: -1 };
    }
  }
};

/**
 * Tag utilities
 */
export const ForumTags = {
  // Generate random tag color
  generateTagColor() {
    const colors = FORUM_CONSTANTS.TAG_COLORS;
    return colors[Math.floor(Math.random() * colors.length)];
  },

  // Clean and normalize tag name
  normalizeTagName(tagName) {
    if (typeof tagName !== 'string') return '';
    return tagName.toLowerCase().trim().replace(/[^a-z0-9\-]/g, '');
  },

  // Extract tags from text content
  extractTagsFromText(text) {
    if (!text) return [];
    const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
    const matches = text.match(hashtagRegex);
    if (!matches) return [];
    
    return matches.map(tag => tag.substring(1).toLowerCase()).slice(0, FORUM_CONSTANTS.MAX_TAGS_PER_POST);
  }
};
