import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

// Forum Categories Collection
export const ForumCategories = new Mongo.Collection('forumCategories');

// Forum Posts Collection  
export const ForumPosts = new Mongo.Collection('forumPosts');

// Forum Replies Collection
export const ForumReplies = new Mongo.Collection('forumReplies');

// Forum Tags Collection
export const ForumTags = new Mongo.Collection('forumTags');

// Security: Deny all client-side database operations
// All operations should go through Meteor methods for security
ForumCategories.deny({
  insert: () => true,
  update: () => true,
  remove: () => true
});

ForumPosts.deny({
  insert: () => true,
  update: () => true,
  remove: () => true
});

ForumReplies.deny({
  insert: () => true,
  update: () => true,
  remove: () => true
});

ForumTags.deny({
  insert: () => true,
  update: () => true,
  remove: () => true
});

// Server-side indexes for better performance
if (Meteor.isServer) {
  // Forum Categories indexes
  ForumCategories.createIndex({ slug: 1 });
  ForumCategories.createIndex({ order: 1 });

  // Forum Posts indexes
  ForumPosts.createIndex({ categoryId: 1, createdAt: -1 });
  ForumPosts.createIndex({ authorId: 1, createdAt: -1 });
  ForumPosts.createIndex({ pinned: -1, lastReplyAt: -1 });
  ForumPosts.createIndex({ tags: 1 });
  ForumPosts.createIndex({ images: 1 }); // Index for posts with images
  ForumPosts.createIndex({ title: 'text', content: 'text' });

  // Forum Replies indexes
  ForumReplies.createIndex({ postId: 1, createdAt: 1 });
  ForumReplies.createIndex({ authorId: 1, createdAt: -1 });
  ForumReplies.createIndex({ parentReplyId: 1 });

  // Forum Tags indexes
  ForumTags.createIndex({ name: 1 });
  ForumTags.createIndex({ usageCount: -1 });
}
