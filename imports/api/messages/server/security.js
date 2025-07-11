import { Meteor } from 'meteor/meteor';
import { MessagesCollection } from '../index';

// Security rules for messages
MessagesCollection.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; }
});

// Only allow inserts through Meteor methods

Meteor.startup(() => {
  // Create indexes for better performance
  if (Meteor.isServer) {
    MessagesCollection.createIndex({ type: 1, createdAt: -1 });
    MessagesCollection.createIndex({ userId: 1, createdAt: -1 });
  }
});
