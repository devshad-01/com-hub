// Client startup code
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import '../../utils/sessionManager.js'; // Initialize session manager

// Initialize client-specific code here
Meteor.startup(() => {
  console.log('Client application started');
  
  // Simple user presence tracking
  let presenceTimeout;
  
  const updatePresence = () => {
    if (Meteor.userId()) {
      Meteor.call('users.updatePresence', true, (error) => {
        if (error) {
          console.error('Error updating presence:', error);
        }
      });
    }
  };
  
  const setOffline = () => {
    if (Meteor.userId()) {
      Meteor.call('users.updatePresence', false);
    }
  };
  
  // Update presence every 30 seconds when active
  const startPresenceTracking = () => {
    updatePresence();
    presenceTimeout = setInterval(updatePresence, 30000);
  };
  
  const stopPresenceTracking = () => {
    if (presenceTimeout) {
      clearInterval(presenceTimeout);
    }
    setOffline();
  };
  
  // Track when user becomes active/inactive
  let isActive = true;
  
  const handleActivity = () => {
    if (!isActive) {
      isActive = true;
      startPresenceTracking();
    }
  };
  
  const handleInactivity = () => {
    if (isActive) {
      isActive = false;
      stopPresenceTracking();
    }
  };
  
  // Set up activity listeners
  ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
    document.addEventListener(event, handleActivity, true);
  });
  
  // Handle page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      handleActivity();
    } else {
      handleInactivity();
    }
  });
  
  // Handle window focus/blur
  window.addEventListener('focus', handleActivity);
  window.addEventListener('blur', handleInactivity);
  
  // Handle page unload
  window.addEventListener('beforeunload', setOffline);
  
  // Start tracking when user logs in
  Tracker.autorun(() => {
    if (Meteor.userId()) {
      startPresenceTracking();
    } else {
      stopPresenceTracking();
    }
  });
});
