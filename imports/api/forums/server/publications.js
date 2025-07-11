import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { ForumCategories, ForumPosts, ForumReplies, ForumTags } from '../collections';

// Categories Publications
Meteor.publish('forums.categories', function() {
  return ForumCategories.find({}, {
    sort: { order: 1, name: 1 }
  });
});

Meteor.publish('forums.categories.single', function(categoryId) {
  check(categoryId, String);
  
  return ForumCategories.find({ _id: categoryId });
});

// Posts Publications
Meteor.publish('forums.posts.list', function(options = {}) {
  check(options, {
    categoryId: Match.Optional(Match.OneOf(String, null)),
    searchTerm: Match.Optional(Match.OneOf(String, null)),
    tags: Match.Optional([String]),
    sortBy: Match.Optional(String),
    limit: Match.Optional(Number),
    skip: Match.Optional(Number)
  });

  const {
    categoryId,
    searchTerm,
    tags,
    sortBy = 'recent',
    limit = 20,
    skip = 0
  } = options;

  // Build selector
  let selector = {};
  
  if (categoryId && categoryId !== 'all') {
    selector.categoryId = categoryId;
  }

  if (searchTerm && searchTerm.length >= 2) {
    selector.$or = [
      { title: new RegExp(searchTerm, 'i') },
      { content: new RegExp(searchTerm, 'i') }
    ];
  }

  if (tags && tags.length > 0) {
    selector.tags = { $in: tags };
  }

  // Build sort options
  let sort = {};
  switch (sortBy) {
    case 'recent':
      sort = { pinned: -1, lastReplyAt: -1, createdAt: -1 };
      break;
    case 'popular':
      sort = { pinned: -1, views: -1, replyCount: -1 };
      break;
    case 'likes':
      sort = { pinned: -1, likes: -1, createdAt: -1 };
      break;
    case 'oldest':
      sort = { pinned: -1, createdAt: 1 };
      break;
    default:
      sort = { pinned: -1, lastReplyAt: -1, createdAt: -1 };
  }

  return ForumPosts.find(selector, {
    sort,
    limit,
    skip,
    fields: {
      title: 1,
      content: 1,
      authorId: 1,
      categoryId: 1,
      tags: 1,
      images: 1,
      pinned: 1,
      locked: 1,
      replyCount: 1,
      views: 1,
      likes: 1,
      dislikes: 1,
      lastReplyAt: 1,
      lastReplyId: 1,
      createdAt: 1,
      updatedAt: 1
    }
  });
});

Meteor.publish('forums.posts.single', function(postId) {
  check(postId, String);
  
  if (!postId) {
    return this.ready();
  }

  return ForumPosts.find({ _id: postId });
});

Meteor.publish('forums.posts.byUser', function(userId, limit = 10) {
  check(userId, String);
  check(limit, Number);

  return ForumPosts.find(
    { authorId: userId },
    {
      sort: { createdAt: -1 },
      limit,
      fields: {
        title: 1,
        categoryId: 1,
        replyCount: 1,
        views: 1,
        likes: 1,
        createdAt: 1
      }
    }
  );
});

Meteor.publish('forums.posts.popular', function(limit = 10) {
  check(limit, Number);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  return ForumPosts.find(
    { createdAt: { $gte: weekAgo } },
    {
      sort: { views: -1, replyCount: -1 },
      limit,
      fields: {
        title: 1,
        authorId: 1,
        categoryId: 1,
        views: 1,
        replyCount: 1,
        likes: 1,
        createdAt: 1
      }
    }
  );
});

// Replies Publications
Meteor.publish('forums.replies.byPost', function(postId, options = {}) {
  check(postId, String);
  check(options, {
    limit: Match.Optional(Number),
    skip: Match.Optional(Number),
    sortBy: Match.Optional(String)
  });

  const { limit = 50, skip = 0, sortBy = 'oldest' } = options;

  let sort = {};
  switch (sortBy) {
    case 'oldest':
      sort = { createdAt: 1 };
      break;
    case 'newest':
      sort = { createdAt: -1 };
      break;
    case 'popular':
      sort = { likes: -1, createdAt: 1 };
      break;
    default:
      sort = { createdAt: 1 };
  }

  return ForumReplies.find(
    { postId },
    {
      sort,
      limit,
      skip
    }
  );
});

Meteor.publish('forums.replies.byUser', function(userId, limit = 20) {
  check(userId, String);
  check(limit, Number);

  return ForumReplies.find(
    { authorId: userId },
    {
      sort: { createdAt: -1 },
      limit,
      fields: {
        postId: 1,
        content: 1,
        likes: 1,
        dislikes: 1,
        createdAt: 1
      }
    }
  );
});

// Tags Publications
Meteor.publish('forums.tags.popular', function(limit = 50) {
  check(limit, Number);

  return ForumTags.find(
    { usageCount: { $gt: 0 } },
    {
      sort: { usageCount: -1 },
      limit
    }
  );
});

Meteor.publish('forums.tags.search', function(searchTerm, limit = 10) {
  check(searchTerm, String);
  check(limit, Number);

  if (searchTerm.length < 2) {
    return this.ready();
  }

  return ForumTags.find(
    { name: new RegExp(searchTerm, 'i') },
    {
      sort: { usageCount: -1 },
      limit,
      fields: { name: 1, usageCount: 1, color: 1 }
    }
  );
});

// Statistics Publications
Meteor.publish('forums.stats', function() {
  // Only publish to authenticated users
  if (!this.userId) {
    return this.ready();
  }

  const self = this;
  let initializing = true;

  // Function to calculate and publish stats
  const publishStats = async () => {
    try {
      const totalPosts = await ForumPosts.countDocuments();
      const totalReplies = await ForumReplies.countDocuments();
      const totalCategories = await ForumCategories.countDocuments();
      const totalTags = await ForumTags.countDocuments();

      // Calculate posts from last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const recentPosts = await ForumPosts.countDocuments({
        createdAt: { $gte: yesterday }
      });

      const stats = {
        totalPosts,
        totalReplies,
        totalCategories,
        totalTags,
        recentPosts,
        totalTopics: totalPosts + totalReplies,
        updatedAt: new Date()
      };

      if (!initializing) {
        self.changed('forumStats', 'global', stats);
      } else {
        self.added('forumStats', 'global', stats);
        initializing = false;
      }

    } catch (error) {
      console.error('Error calculating forum stats:', error);
    }
  };

  // Publish initial stats
  publishStats();

  // Set up observers for real-time updates (throttled to avoid excessive updates)
  let updateTimeout;
  const throttledUpdate = () => {
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }
    updateTimeout = setTimeout(() => {
      if (!initializing) {
        publishStats();
      }
    }, 1000); // Update at most once per second
  };

  const postObserver = ForumPosts.find().observeChanges({
    added: throttledUpdate,
    removed: throttledUpdate
  });

  const replyObserver = ForumReplies.find().observeChanges({
    added: throttledUpdate,
    removed: throttledUpdate
  });

  const categoryObserver = ForumCategories.find().observeChanges({
    added: throttledUpdate,
    removed: throttledUpdate
  });

  self.ready();

  // Clean up observers
  self.onStop(() => {
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }
    if (postObserver && typeof postObserver.stop === 'function') {
      postObserver.stop();
    }
    if (replyObserver && typeof replyObserver.stop === 'function') {
      replyObserver.stop();
    }
    if (categoryObserver && typeof categoryObserver.stop === 'function') {
      categoryObserver.stop();
    }
  });
});

// User Activity Publication
Meteor.publish('forums.userActivity', function(userId) {
  check(userId, String);

  if (!this.userId) {
    return this.ready();
  }

  // Return recent posts and replies by the user
  return [
    ForumPosts.find(
      { authorId: userId },
      {
        sort: { createdAt: -1 },
        limit: 10,
        fields: {
          title: 1,
          categoryId: 1,
          replyCount: 1,
          views: 1,
          likes: 1,
          createdAt: 1
        }
      }
    ),
    ForumReplies.find(
      { authorId: userId },
      {
        sort: { createdAt: -1 },
        limit: 10,
        fields: {
          postId: 1,
          content: 1,
          likes: 1,
          createdAt: 1
        }
      }
    )
  ];
});
