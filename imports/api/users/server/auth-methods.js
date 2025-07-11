// imports/api/users/server/auth-methods.js
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import { SecurityUtils } from './security';

Meteor.methods({
  
  // Secure password change method (Meteor 3 async)
  async 'auth.changePassword'(oldPassword, newPassword) {
    check(oldPassword, String);
    check(newPassword, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }

    // Validate session
    if (!(await SecurityUtils.isSessionValid(this.userId))) {
      throw new Meteor.Error('session-invalid', 'Session is no longer valid');
    }

    // Validate new password strength
    const validation = SecurityUtils.validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      throw new Meteor.Error('weak-password', validation.errors.join(', '));
    }

    try {
      // Change password using Accounts API (Meteor 3)
      await Accounts.setPasswordAsync(this.userId, newPassword);
      
      // Log security event
      SecurityUtils.logSecurityEvent(this.userId, 'PASSWORD_CHANGED', {
        method: 'user_initiated'
      });
      
      // Force logout all other sessions for security
      await SecurityUtils.forceLogoutUser(this.userId);
      
      return { success: true };
    } catch (error) {
      SecurityUtils.logSecurityEvent(this.userId, 'PASSWORD_CHANGE_FAILED', {
        error: error.reason
      });
      throw error;
    }
  },

  // Force logout all sessions (Meteor 3 async)
  async 'auth.logoutAllSessions'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }

    await SecurityUtils.forceLogoutUser(this.userId);
    SecurityUtils.logSecurityEvent(this.userId, 'ALL_SESSIONS_LOGGED_OUT');
    
    return { success: true };
  },

  // Resend verification email with rate limiting (Meteor 3 async)
  async 'auth.resendVerificationEmail'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }

    const user = await Meteor.users.findOneAsync(this.userId);
    if (!user) {
      throw new Meteor.Error('user-not-found', 'User not found');
    }

    // Check if email is already verified
    if (user.emails?.[0]?.verified) {
      throw new Meteor.Error('already-verified', 'Email is already verified');
    }

    // Rate limiting - allow only one email per 5 minutes
    const lastSent = user['lastVerificationEmailSent'];
    if (lastSent && (new Date().getTime() - lastSent.getTime()) < 5 * 60 * 1000) {
      throw new Meteor.Error('rate-limited', 'Please wait 5 minutes before requesting another verification email');
    }

    try {
      Accounts.sendVerificationEmail(this.userId);
      
      // Update last sent timestamp
      await Meteor.users.updateAsync(this.userId, {
        $set: { 'lastVerificationEmailSent': new Date() }
      });
      
      SecurityUtils.logSecurityEvent(this.userId, 'VERIFICATION_EMAIL_SENT');
      
      return { success: true };
    } catch (error) {
      SecurityUtils.logSecurityEvent(this.userId, 'VERIFICATION_EMAIL_FAILED', {
        error: error.reason
      });
      throw error;
    }
  },

  // Check account security status (Meteor 3 async)
  async 'auth.getSecurityStatus'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }

    const user = await Meteor.users.findOneAsync(this.userId, {
      fields: {
        emails: 1,
        createdAt: 1,
        lastLoginAt: 1,
        loginAttempts: 1,
        accountLocked: 1,
        lockUntil: 1,
        'services.resume.loginTokens': 1
      }
    });

    if (!user) {
      throw new Meteor.Error('user-not-found', 'User not found');
    }

    const activeSessions = user.services?.resume?.loginTokens?.length || 0;
    const emailVerified = user.emails?.[0]?.verified || false;

    return {
      emailVerified,
      activeSessions,
      accountLocked: user['accountLocked'] || false,
      lockUntil: user['lockUntil'],
      lastLoginAt: user['lastLoginAt'],
      failedLoginAttempts: user['loginAttempts'] || 0
    };
  },

  // Admin method to unlock user account (Meteor 3 async)
  async 'auth.unlockUserAccount'(targetUserId) {
    check(targetUserId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }

    // Check admin permissions
    const hasPermission = await SecurityUtils.checkPermissionWithContext(
      this.userId, 
      'MANAGE_USERS',
      { targetUserId }
    );
    
    if (!hasPermission) {
      throw new Meteor.Error('insufficient-permissions', 'Not authorized to unlock accounts');
    }

    // Unlock the account
    await Meteor.users.updateAsync(targetUserId, {
      $unset: {
        accountLocked: 1,
        lockUntil: 1,
        loginAttempts: 1
      }
    });

    SecurityUtils.logSecurityEvent(this.userId, 'ACCOUNT_UNLOCKED', {
      targetUserId,
      adminUserId: this.userId
    });

    return { success: true };
  },

  // Enhanced login with remember me functionality
  async 'auth.loginWithRememberMe'(email, password, rememberMe = false) {
    check(email, String);
    check(password, String);
    check(rememberMe, Boolean);
    
    try {
      // Use standard Meteor login
      const result = await Accounts._hashLoginToken(await Accounts._generateStampedLoginToken());
      const loginResult = await new Promise((resolve, reject) => {
        Meteor.loginWithPassword.call(this, { email }, password, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
      });
      
      if (rememberMe && this.userId) {
        // Extend session for remember me
        const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        
        await Meteor.users.updateAsync(this.userId, {
          $set: {
            'rememberMeSession': true,
            'sessionExtended': expiryDate
          }
        });
        
        SecurityUtils.logSecurityEvent(this.userId, 'REMEMBER_ME_LOGIN');
      }
      
      return { success: true, rememberMe };
    } catch (error) {
      SecurityUtils.logSecurityEvent(null, 'LOGIN_FAILED', {
        email,
        error: error.reason
      });
      throw error;
    }
  },

  // Update user activity (call this on user interactions)
  async 'auth.updateActivity'() {
    if (!this.userId) {
      return; // Silent fail for non-authenticated users
    }

    await Meteor.users.updateAsync(this.userId, {
      $set: {
        lastActivityAt: new Date()
      }
    });
  },

  // Check if session is still valid (considering inactivity)
  async 'auth.checkSessionValidity'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }

    const user = await Meteor.users.findOneAsync(this.userId, {
      fields: {
        lastActivityAt: 1,
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
    const lastActivity = user.lastActivityAt || user.lastLoginAt || new Date(0);
    const inactivityTimeout = 2 * 60 * 60 * 1000; // 2 hours
    const isRememberMe = user.rememberMeSession;

    // Check account lock
    if (user.accountLocked && user.lockUntil && now < user.lockUntil) {
      return {
        valid: false,
        reason: 'account_locked',
        lockUntil: user.lockUntil
      };
    }

    // Check inactivity timeout (skip for remember me sessions)
    if (!isRememberMe && (now - lastActivity) > inactivityTimeout) {
      // Force logout due to inactivity
      await SecurityUtils.forceLogoutUser(this.userId);
      SecurityUtils.logSecurityEvent(this.userId, 'SESSION_EXPIRED_INACTIVITY');
      
      return {
        valid: false,
        reason: 'inactivity_timeout',
        lastActivity
      };
    }

    // Update activity timestamp
    await Meteor.users.updateAsync(this.userId, {
      $set: { lastActivityAt: now }
    });

    return {
      valid: true,
      isRememberMe,
      lastActivity,
      timeUntilExpiry: isRememberMe ? null : inactivityTimeout - (now - lastActivity)
    };
  },

  // Convert existing session to remember me
  async 'auth.enableRememberMe'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }

    const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await Meteor.users.updateAsync(this.userId, {
      $set: {
        'rememberMeSession': true,
        'sessionExtended': expiryDate
      }
    });

    SecurityUtils.logSecurityEvent(this.userId, 'REMEMBER_ME_ENABLED');

    return { success: true, expiryDate };
  },

  // Disable remember me for current session
  async 'auth.disableRememberMe'() {
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
  }
});
