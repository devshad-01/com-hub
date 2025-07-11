// Forum-related constants and configurations

export const FORUM_CONSTANTS = {
  // Post and reply limits
  MAX_TITLE_LENGTH: 200,
  MAX_CONTENT_LENGTH: 10000,
  MAX_TAGS_PER_POST: 5,
  MAX_TAG_LENGTH: 30,
  
  // Pagination defaults
  DEFAULT_POSTS_LIMIT: 20,
  DEFAULT_REPLIES_LIMIT: 50,
  MAX_POSTS_LIMIT: 100,
  MAX_REPLIES_LIMIT: 200,
  
  // Search limits
  MIN_SEARCH_LENGTH: 2,
  MAX_SEARCH_RESULTS: 50,
  
  // Rate limiting
  POSTS_PER_MINUTE: 5,
  REPLIES_PER_MINUTE: 10,
  VOTES_PER_MINUTE: 20,
  SEARCHES_PER_MINUTE: 30,
  
  // User roles that can moderate
  MODERATOR_ROLES: ['admin', 'moderator'],
  
  // Sort options
  SORT_OPTIONS: {
    RECENT: 'recent',
    POPULAR: 'popular',
    LIKES: 'likes',
    OLDEST: 'oldest'
  },
  
  // Vote types
  VOTE_TYPES: {
    LIKE: 'like',
    DISLIKE: 'dislike',
    REMOVE: 'remove'
  },
  
  // Default tag colors
  TAG_COLORS: [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#F97316', '#6366F1', '#14B8A6', '#EAB308'
  ]
};

export const FORUM_PERMISSIONS = {
  // Who can create categories
  CREATE_CATEGORY: ['admin'],
  
  // Who can edit/delete any post
  MODERATE_POSTS: ['admin', 'moderator'],
  
  // Who can pin/lock posts
  PIN_LOCK_POSTS: ['admin', 'moderator'],
  
  // Who can delete categories
  DELETE_CATEGORY: ['admin'],
  
  // Who can post in locked threads
  POST_IN_LOCKED: ['admin', 'moderator']
};

export const FORUM_ERRORS = {
  NOT_AUTHORIZED: 'not-authorized',
  INSUFFICIENT_PERMISSIONS: 'insufficient-permissions',
  POST_NOT_FOUND: 'post-not-found',
  REPLY_NOT_FOUND: 'reply-not-found',
  CATEGORY_NOT_FOUND: 'category-not-found',
  CATEGORY_EXISTS: 'category-exists',
  CATEGORY_HAS_POSTS: 'category-has-posts',
  POST_LOCKED: 'post-locked',
  INVALID_PARENT_REPLY: 'invalid-parent-reply',
  TITLE_TOO_LONG: 'title-too-long',
  CONTENT_TOO_LONG: 'content-too-long',
  TOO_MANY_TAGS: 'too-many-tags',
  TAG_TOO_LONG: 'tag-too-long'
};
