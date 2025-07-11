import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { MessagesCollection } from '../index';

Meteor.publish('generalChatMessages', function(options = {}) {
  check(options, {
    limit: Match.Optional(Number)
  });

  if (!this.userId) {
    return this.ready();
  }

  const limit = Math.min(options.limit || 50, 100); // Cap at 100 messages

  return MessagesCollection.find(
    { type: 'general' },
    {
      sort: { createdAt: -1 },
      limit,
      fields: {
        content: 1,
        userId: 1,
        type: 1,
        createdAt: 1,
        reactions: 1,
        updatedAt: 1
      }
    }
  );
});

// Direct message publications
Meteor.publish('directMessages', function(otherUserId, options = {}) {
  check(otherUserId, String);
  check(options, {
    limit: Match.Optional(Number)
  });

  if (!this.userId) {
    return this.ready();
  }

  const limit = Math.min(options.limit || 50, 100);

  return MessagesCollection.find({
    type: 'direct',
    $or: [
      { senderId: this.userId, recipientId: otherUserId },
      { senderId: otherUserId, recipientId: this.userId }
    ]
  }, {
    sort: { createdAt: -1 },
    limit,
    fields: {
      content: 1,
      senderId: 1,
      recipientId: 1,
      type: 1,
      read: 1,
      readAt: 1,
      createdAt: 1,
      updatedAt: 1
    }
  });
});

// Publish conversation list for current user
Meteor.publish('userConversations', function() {
  if (!this.userId) {
    return this.ready();
  }

  // Return recent direct messages for this user to build conversation list
  return MessagesCollection.find({
    type: 'direct',
    $or: [
      { senderId: this.userId },
      { recipientId: this.userId }
    ]
  }, {
    sort: { createdAt: -1 },
    limit: 200, // Last 200 messages to determine conversations
    fields: {
      senderId: 1,
      recipientId: 1,
      content: 1,
      read: 1,
      type: 1,
      createdAt: 1
    }
  });
});

// Publish members list for directory
Meteor.publish('membersList', function(options = {}) {
  check(options, {
    search: Match.Optional(String),
    limit: Match.Optional(Number),
    skip: Match.Optional(Number)
  });

  if (!this.userId) {
    return this.ready();
  }

  const limit = Math.min(options.limit || 20, 50);
  const skip = options.skip || 0;
  let selector = {};

  // Search functionality
  if (options.search) {
    const searchRegex = new RegExp(options.search.trim(), 'i');
    selector = {
      $or: [
        { username: searchRegex },
        { 'profile.name': searchRegex }
      ]
    };
  }

  return Meteor.users.find(selector, {
    fields: {
      username: 1,
      'profile.name': 1,
      'profile.avatar': 1,
      'profile.role': 1,
      'profile.bio': 1,
      'profile.location': 1,
      createdAt: 1,
      'status.online': 1,
      'status.lastActivity': 1
    },
    sort: { 
      'status.online': -1, // Online users first
      'status.lastActivity': -1,
      createdAt: -1 
    },
    limit,
    skip
  });
});