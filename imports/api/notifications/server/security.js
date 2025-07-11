import { Meteor } from 'meteor/meteor';
import { NotificationsCollection } from '../index';

// Security rules for notifications
NotificationsCollection.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; }
});

// Only allow operations through Meteor methods

Meteor.startup(() => {
  // Create indexes for better performance
  if (Meteor.isServer) {
    NotificationsCollection.createIndex({ userId: 1, read: 1, createdAt: -1 });
    NotificationsCollection.createIndex({ userId: 1, createdAt: -1 });
    NotificationsCollection.createIndex({ relatedId: 1, type: 1 });
  }
});
