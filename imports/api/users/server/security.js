// imports/api/users/server/security.js
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Roles } from 'meteor/alanning:roles';
import { ROLES } from '../roles';

// Security utilities for session management (Meteor 3 async)
export const SecurityUtils = {
  
  // Force logout all sessions for a user (useful for security breaches)
  async forceLogoutUser(userId) {
    if (!Meteor.isServer) return;
    
    // Remove all login tokens for the user
    await Meteor.users.updateAsync(userId, {
      $set: {
        'services.resume.loginTokens': []
      }
    });
    
    console.log(`Forced logout for user: ${userId}`);
  },

  // Check if user session is still valid
  async isSessionValid(userId) {
    if (!userId) return false;
    
    const user = await Meteor.users.findOneAsync(userId);
    if (!user) return false;
    
    // Check if account is locked (using bracket notation for JS)
    if (user['accountLocked']) {
      const lockUntil = user['lockUntil'];
      if (lockUntil && new Date() < lockUntil) {
        return false;
      }
    }
    
    // Check if email is verified for sensitive operations
    if (!user.emails?.[0]?.verified && this.requiresEmailVerification()) {
      return false;
    }
    
    return true;
  },

  // Require email verification for certain actions
  requiresEmailVerification() {
    return Meteor.settings.public?.requireEmailVerification !== false;
  },

  // Log security events
  logSecurityEvent(userId, event, details = {}) {
    const logEntry = {
      userId,
      event,
      timestamp: new Date(),
      ip: this.getCurrentIP(),
      userAgent: this.getCurrentUserAgent(),
      ...details
    };
    
    console.log('Security Event:', logEntry);
    
    // In production, you might want to store these in a dedicated collection
    // SecurityLogs.insert(logEntry);
  },

  getCurrentIP() {
    // Simplified for JavaScript - just return unknown for now
    return 'unknown';
  },

  getCurrentUserAgent() {
    // Simplified for JavaScript - just return unknown for now
    return 'unknown';
  },

  // Basic permission check (simplified for JavaScript)
  async hasPermission(userId, permission) {
    if (!userId) return false;
    
    // Simple admin check - in a real app you'd integrate with your ROLES system
    if (permission === 'MANAGE_USERS') {
      // For now, just check if user has admin role
      // You can expand this based on your actual roles implementation
      try {
        return await Roles.userIsInRoleAsync(userId, ['admin', 'superadmin']);
      } catch (error) {
        console.error('Error checking role:', error);
        return false;
      }
    }
    
    return false;
  },

  // Clean up expired sessions (call this periodically) - Meteor 3 async
  async cleanupExpiredSessions() {
    if (!Meteor.isServer) return;
    
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
    
    await Meteor.users.updateAsync({
      'services.resume.loginTokens.when': { $lt: cutoff }
    }, {
      $pull: {
        'services.resume.loginTokens': {
          when: { $lt: cutoff }
        }
      }
    }, { multi: true });
    
    console.log('Cleaned up expired sessions');
  },

  // Enhanced permission checking with context - Meteor 3 async
  async checkPermissionWithContext(userId, action, context = {}) {
    if (!userId) {
      this.logSecurityEvent(null, 'UNAUTHORIZED_ACCESS_ATTEMPT', { action, context });
      return false;
    }

    if (!(await this.isSessionValid(userId))) {
      this.logSecurityEvent(userId, 'INVALID_SESSION_ACCESS', { action, context });
      return false;
    }

    const hasPermission = await this.hasPermission(userId, action);
    
    if (!hasPermission) {
      this.logSecurityEvent(userId, 'PERMISSION_DENIED', { action, context });
    }
    
    return hasPermission;
  },

  // Password strength validation
  validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const errors = [];
    
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    
    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    }
    
    if (!hasSpecialChar) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

// Periodic cleanup of expired sessions (run every 24 hours) - Meteor 3 async
if (Meteor.isServer) {
  Meteor.setInterval(async () => {
    await SecurityUtils.cleanupExpiredSessions();
  }, 24 * 60 * 60 * 1000); // 24 hours
}

// Override default password validation - Meteor 3 async
if (Meteor.isServer) {
  Accounts.validateNewUser(async (user) => {
    // This will be called in addition to the validation in accounts.js
    return true;
  });
}
