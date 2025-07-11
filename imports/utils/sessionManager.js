// imports/utils/sessionManager.js
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

class SessionManager {
  constructor() {
    this.activityTimer = null;
    this.lastActivity = new Date();
    this.isActive = false;
    this.checkInterval = 30000; // Check every 30 seconds
    this.lastServerUpdate = 0; // Initialize lastServerUpdate

    // Bind methods to maintain context
    this.updateActivity = this.updateActivity.bind(this);
    this.startTracking = this.startTracking.bind(this);
    this.stopTracking = this.stopTracking.bind(this);
    this.handleSessionExpiry = this.handleSessionExpiry.bind(this); // Also bind this
  }

  // Track user activity
  async updateActivity() { // Make this method async
    this.lastActivity = new Date();

    // Only call server method if user is logged in
    if (Meteor.userId()) {
      // Throttle server calls - only update server every 2 minutes
      if (!this.lastServerUpdate || (Date.now() - this.lastServerUpdate) > 120000) {
        try {
          await Meteor.callAsync('session.updateActivity'); // Changed to callAsync
          this.lastServerUpdate = Date.now();
        } catch (error) {
          console.warn('Failed to update activity on server:', error);
        }
      }
    }
  }

  // Start tracking user activity
  startTracking() {
    if (this.isActive) return;

    this.isActive = true;
    console.log('Session activity tracking started');

    // Track various user interactions
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Add event listeners for activity
    events.forEach(event => {
      document.addEventListener(event, this.updateActivity, { passive: true });
    });

    // Periodic session validity check
    this.validityCheckInterval = setInterval(async () => { // Make the interval callback async
      if (Meteor.userId()) {
        try {
          const result = await Meteor.callAsync('session.checkValidity'); // Changed to callAsync
          if (result && !result.valid) {
            console.warn('Session invalid:', result.reason);
            // Handle session expiry
            this.handleSessionExpiry(result);
          }
        } catch (error) {
          console.error('Session validity check failed:', error);
          // If the checkValidity method throws an error indicating session expiry, handle it
          // You might need to refine this based on the exact error structure
          if (error.error === 'session-expired') { // Example error code
             this.handleSessionExpiry({ reason: 'server_error_expiry', timeSinceActivity: null }); // Or specific error info
          }
        }
      }
    }, this.checkInterval);
  }

  // Stop tracking user activity
  stopTracking() {
    if (!this.isActive) return;

    this.isActive = false;
    console.log('Session activity tracking stopped');

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Remove event listeners
    events.forEach(event => {
      document.removeEventListener(event, this.updateActivity);
    });

    // Clear intervals
    if (this.validityCheckInterval) {
      clearInterval(this.validityCheckInterval);
      this.validityCheckInterval = null; // Clear reference
    }
  }

  // Handle session expiry
  handleSessionExpiry(result) {
    let message = 'Your session has expired.';

    switch (result.reason) {
      case 'inactivity_timeout':
        message = `Your session expired due to ${result.timeSinceActivity} minutes of inactivity.`;
        break;
      case 'remember_me_expired':
        message = 'Your extended session has expired.';
        break;
      case 'account_locked':
        message = 'Your account has been temporarily locked.';
        break;
      case 'server_error_expiry': // Added for cases where checkValidity throws directly
        message = 'There was an issue verifying your session. Please log in again.';
        break;
      default:
        message = 'Your session has expired for an unknown reason.';
        break;
    }

    // Show notification or redirect to login
    if (typeof window !== 'undefined' && window.location) {
      alert(message + ' Please log in again.');
      // It's good practice to log out the user on the client side too
      // if the server indicates an expired session, to clear local state.
      Meteor.logout((logoutError) => {
        if (logoutError) {
          console.error('Error during client-side logout after session expiry:', logoutError);
        }
        window.location.href = '/login';
      });
    }
  }

  // Get session information
  async getSessionInfo() {
    if (!Meteor.userId()) {
      return null;
    }

    try {
      return await Meteor.callAsync('session.getInfo');
    } catch (error) {
      console.error('Failed to get session info:', error);
      return null;
    }
  }

  // Enable remember me
  async enableRememberMe() {
    if (!Meteor.userId()) {
      throw new Error('Must be logged in');
    }

    try {
      const result = await Meteor.callAsync('session.enableRememberMe');
      console.log('Remember me enabled:', result.message);
      return result;
    } catch (error) {
      console.error('Failed to enable remember me:', error);
      throw error;
    }
  }

  // Disable remember me
  async disableRememberMe() {
    if (!Meteor.userId()) {
      throw new Error('Must be logged in');
    }

    try {
      const result = await Meteor.callAsync('session.disableRememberMe');
      console.log('Remember me disabled');
      return result;
    } catch (error) {
      console.error('Failed to disable remember me:', error);
      throw error;
    }
  }
}

// Create singleton instance
const sessionManager = new SessionManager();

// Auto-start tracking when user logs in
Meteor.startup(() => {
  // Track login state changes
  Tracker.autorun(() => {
    const userId = Meteor.userId();

    if (userId) {
      // User logged in - start tracking
      sessionManager.startTracking();
    } else {
      // User logged out - stop tracking
      sessionManager.stopTracking();
    }
  });
});

export { sessionManager };