// imports/api/users/server/session-methods.js
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { SecurityUtils } from './security';

Meteor.methods({
  
  // Check and cleanup expired sessions
  async 'session.cleanupExpired'() {
    // This method can be called by a cron job or periodically
    const now = new Date();
    const inactivityTimeout = 30 * 60 * 1000; // 30 minutes
    const rememberMeTimeout = 7 * 24 * 60 * 60 * 1000; // 7 days

    // Find users with expired regular sessions (inactive for 30+ minutes)
    const expiredRegularSessions = await Meteor.users.find({
      rememberMeSession: { $ne: true },
      lastActivityAt: { $lt: new Date(now.getTime() - inactivityTimeout) }
    }).fetchAsync();

    // Find users with expired remember-me sessions (older than 7 days)
    const expiredRememberMeSessions = await Meteor.users.find({
      rememberMeSession: true,
      sessionExtended: { $lt: now }
    }).fetchAsync();

    let cleanedCount = 0;

    // Clean up expired regular sessions
    for (const user of expiredRegularSessions) {
      await SecurityUtils.forceLogoutUser(user._id);
      SecurityUtils.logSecurityEvent(user._id, 'SESSION_EXPIRED_CLEANUP', {
        type: 'inactivity',
        lastActivity: user.lastActivityAt
      });
      cleanedCount++;
    }

    // Clean up expired remember-me sessions  
    for (const user of expiredRememberMeSessions) {
      await SecurityUtils.forceLogoutUser(user._id);
      SecurityUtils.logSecurityEvent(user._id, 'SESSION_EXPIRED_CLEANUP', {
        type: 'remember_me_expired',
        sessionExtended: user.sessionExtended
      });
      cleanedCount++;
    }

    console.log(`Cleaned up ${cleanedCount} expired sessions`);
    return { cleanedCount };
  },

  // Update user activity (call this on user interactions)
  async 'session.updateActivity'() {
    if (!this.userId) {
      return; // Silent fail for non-authenticated users
    }

    // Check if user has remember me enabled
    const user = await Meteor.users.findOneAsync(this.userId, {
      fields: { rememberMeSession: 1 }
    });

    // Only update activity for regular sessions (not remember me)
    if (!user['rememberMeSession']) {
      await Meteor.users.updateAsync(this.userId, {
        $set: {
          'lastActivityAt': new Date()
        }
      });
    }
  },

  // Check if session is still valid (considering inactivity)
  async 'session.checkValidity'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }

    const user = await Meteor.users.findOneAsync(this.userId, {
      fields: {
        lastActivityAt: 1,
        lastLoginAt: 1,
        rememberMeSession: 1,
        sessionExtended: 1,
        accountLocked: 1,
        lockUntil: 1
      }
    });

    if (!user) {
      throw new Meteor.Error('user-not-found', 'User not found');
    }

    const now = new Date();
    const lastActivity = user['lastActivityAt'] || user['lastLoginAt'] || new Date(0);
    const inactivityTimeout = 30 * 60 * 1000; // 30 minutes
    const isRememberMe = user['rememberMeSession'];

    // Check account lock
    if (user['accountLocked'] && user['lockUntil'] && now < user['lockUntil']) {
      return {
        valid: false,
        reason: 'account_locked',
        lockUntil: user['lockUntil']
      };
    }

    // For remember me sessions, check absolute expiry (7 days from creation)
    if (isRememberMe && user['sessionExtended'] && now > user['sessionExtended']) {
      // Force logout due to remember me expiry
      await SecurityUtils.forceLogoutUser(this.userId);
      SecurityUtils.logSecurityEvent(this.userId, 'SESSION_EXPIRED_REMEMBER_ME');
      
      return {
        valid: false,
        reason: 'remember_me_expired',
        lastActivity,
        sessionExtended: user['sessionExtended']
      };
    }

    // Check inactivity timeout (ONLY for regular sessions, skip for remember me)
    const timeSinceActivity = now.getTime() - lastActivity.getTime();
    if (!isRememberMe && timeSinceActivity > inactivityTimeout) {
      // Force logout due to inactivity
      await SecurityUtils.forceLogoutUser(this.userId);
      SecurityUtils.logSecurityEvent(this.userId, 'SESSION_EXPIRED_INACTIVITY', {
        timeSinceActivity: Math.round(timeSinceActivity / 1000 / 60) + ' minutes'
      });
      
      return {
        valid: false,
        reason: 'inactivity_timeout',
        lastActivity,
        timeSinceActivity: Math.round(timeSinceActivity / 1000 / 60) // in minutes
      };
    }

    // Update activity timestamp for regular sessions only
    if (!isRememberMe) {
      await Meteor.users.updateAsync(this.userId, {
        $set: { 'lastActivityAt': now }
      });
    }

    return {
      valid: true,
      isRememberMe,
      lastActivity,
      timeUntilExpiry: isRememberMe ? 
        'No inactivity timeout (expires: ' + (user['sessionExtended'] || 'unknown') + ')' : 
        Math.max(0, Math.round((inactivityTimeout - timeSinceActivity) / 1000 / 60)) + ' minutes'
    };
  },

  // Enable remember me for current session
  async 'session.enableRememberMe'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }

    const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await Meteor.users.updateAsync(this.userId, {
      $set: {
        'rememberMeSession': true,
        'sessionExtended': expiryDate
      }
    });

    SecurityUtils.logSecurityEvent(this.userId, 'REMEMBER_ME_ENABLED');

    return { success: true, expiryDate, message: 'Remember me enabled - session will last 7 days' };
  },

  // Disable remember me for current session
  async 'session.disableRememberMe'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }

    await Meteor.users.updateAsync(this.userId, {
      $unset: {
        'rememberMeSession': 1,
        'sessionExtended': 1
      }
    });

    SecurityUtils.logSecurityEvent(this.userId, 'REMEMBER_ME_DISABLED');

    return { success: true };
  },

  // Get session information
  async 'session.getInfo'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }

    const user = await Meteor.users.findOneAsync(this.userId, {
      fields: {
        lastActivityAt: 1,
        lastLoginAt: 1,
        rememberMeSession: 1,
        sessionExtended: 1,
        'services.resume.loginTokens': 1
      }
    });

    if (!user) {
      throw new Meteor.Error('user-not-found', 'User not found');
    }

    const now = new Date();
    const lastActivity = user['lastActivityAt'] || user['lastLoginAt'] || new Date(0);
    const isRememberMe = user['rememberMeSession'];
    const timeSinceActivity = now.getTime() - lastActivity.getTime();
    const inactivityTimeout = 30 * 60 * 1000; // 30 minutes

    return {
      isRememberMe,
      lastActivity,
      timeSinceActivity: Math.round(timeSinceActivity / 1000 / 60), // in minutes
      timeUntilExpiry: isRememberMe ? 
        'No inactivity timeout (expires: ' + (user['sessionExtended'] || 'unknown') + ')' :
        Math.max(0, Math.round((inactivityTimeout - timeSinceActivity) / 1000 / 60)) + ' minutes',
      activeSessions: user.services?.resume?.loginTokens?.length || 0,
      sessionExtended: user['sessionExtended']
    };
  }
});
