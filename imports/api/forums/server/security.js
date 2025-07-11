import { Meteor } from 'meteor/meteor';
import { ForumCategories, ForumPosts, ForumReplies, ForumTags } from '../collections';

// Deny all client-side updates for security
ForumCategories.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; }
}); 

ForumPosts.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; }
});

ForumReplies.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; }
});

ForumTags.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; }
});

// Rate limiting for forum methods
if (Meteor.isServer) {
  import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

  // Rate limit post creation
  DDPRateLimiter.addRule({
    name: 'forums.posts.create',
    type: 'method',
    connectionId() { return true; }
  }, 5, 60000); // 5 posts per minute

  // Rate limit reply creation
  DDPRateLimiter.addRule({
    name: 'forums.replies.create',
    type: 'method',
    connectionId() { return true; }
  }, 10, 60000); // 10 replies per minute

  // Rate limit voting
  DDPRateLimiter.addRule({
    name: ['forums.posts.vote', 'forums.replies.vote'],
    type: 'method',
    connectionId() { return true; }
  }, 20, 60000); // 20 votes per minute

  // Rate limit category operations (admin only, but still limit)
  DDPRateLimiter.addRule({
    name: ['forums.categories.create', 'forums.categories.update', 'forums.categories.delete'],
    type: 'method',
    connectionId() { return true; }
  }, 10, 60000); // 10 category operations per minute

  // Rate limit search operations
  DDPRateLimiter.addRule({
    name: 'forums.tags.search',
    type: 'method',
    connectionId() { return true; }
  }, 30, 60000); // 30 searches per minute
}
