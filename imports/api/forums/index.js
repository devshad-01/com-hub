// Forums API - Main entry point
import { Meteor } from 'meteor/meteor';

// Import collections
export * from './collections';

// Import utilities
export * from './utils';
export * from './constants';

// Import methods
import './methods';

// Import server-side code when on server
if (Meteor.isServer) {
  import './server';
}

// Export method names for client use
export const ForumMethods = {
  // Category methods
  createCategory: 'forums.categories.create',
  updateCategory: 'forums.categories.update',
  deleteCategory: 'forums.categories.delete',
  
  // Post methods
  createPost: 'forums.posts.create',
  updatePost: 'forums.posts.update',
  deletePost: 'forums.posts.delete',
  votePost: 'forums.posts.vote',
  incrementViews: 'forums.posts.incrementViews',
  
  // Reply methods
  createReply: 'forums.replies.create',
  updateReply: 'forums.replies.update',
  deleteReply: 'forums.replies.delete',
  voteReply: 'forums.replies.vote',
  
  // Tag methods
  searchTags: 'forums.tags.search'
};

// Export publication names for client use
export const ForumPublications = {
  categories: 'forums.categories',
  singleCategory: 'forums.categories.single',
  postsList: 'forums.posts.list',
  singlePost: 'forums.posts.single',
  postsByUser: 'forums.posts.byUser',
  popularPosts: 'forums.posts.popular',
  repliesByPost: 'forums.replies.byPost',
  repliesByUser: 'forums.replies.byUser',
  popularTags: 'forums.tags.popular',
  searchTags: 'forums.tags.search',
  stats: 'forums.stats',
  userActivity: 'forums.userActivity'
};
