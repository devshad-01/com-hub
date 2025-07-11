import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { NotificationsCollection } from '../index';

Meteor.publish('userNotifications', function(options = {}) {
  check(options, {
    limit: Match.Optional(Number),
    onlyUnread: Match.Optional(Boolean)
  });

  if (!this.userId) {
    return this.ready();
  }

  const limit = Math.min(options.limit || 50, 100);
  let selector = { userId: this.userId };
  
  if (options.onlyUnread) {
    selector.read = false;
  }

  return NotificationsCollection.find(selector, {
    sort: { createdAt: -1 },
    limit,
    fields: {
      userId: 1,
      type: 1,
      title: 1,
      message: 1,
      relatedId: 1,
      relatedType: 1,
      fromUserId: 1,
      read: 1,
      createdAt: 1,
      readAt: 1
    }
  });
});

// Real-time notification count
Meteor.publish('notificationCount', function() {
  if (!this.userId) {
    return this.ready();
  }

  const self = this;
  let count = 0;

  const cursor = NotificationsCollection.find({
    userId: this.userId,
    read: false
  });

  const handle = cursor.observe({
    added: function() {
      count++;
      self.changed('notificationCounts', self.userId, { count });
    },
    removed: function() {
      count--;
      self.changed('notificationCounts', self.userId, { count });
    }
  });

  // Initial count
  count = cursor.count();
  self.added('notificationCounts', this.userId, { count });
  self.ready();

  self.onStop(function() {
    handle.stop();
  });
});
