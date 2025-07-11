// imports/api/users/server/session-cleanup.js
import { Meteor } from 'meteor/meteor';

// Clean up expired sessions every 5 minutes
let cleanupInterval;

Meteor.startup(() => {
  // Clean up immediately on startup
  Meteor.call('session.cleanupExpired', (error, result) => {
    if (error) {
      console.error('Error during session cleanup on startup:', error);
    } else {
      console.log('Session cleanup on startup completed:', result);
    }
  });

  // Set up periodic cleanup every 5 minutes (300,000 ms)
  cleanupInterval = Meteor.setInterval(() => {
    Meteor.call('session.cleanupExpired', (error, result) => {
      if (error) {
        console.error('Error during periodic session cleanup:', error);
      } else if (result && result.cleanedCount > 0) {
        console.log('Periodic session cleanup completed:', result);
      }
    });
  }, 5 * 60 * 1000); // 5 minutes

  console.log('Session cleanup scheduler started (runs every 5 minutes)');
});

// Clean up on shutdown
process.on('SIGTERM', () => {
  if (cleanupInterval) {
    Meteor.clearInterval(cleanupInterval);
  }
});

process.on('SIGINT', () => {
  if (cleanupInterval) {
    Meteor.clearInterval(cleanupInterval);
  }
});
