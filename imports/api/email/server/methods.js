// imports/api/email/server/methods.js
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { EmailService } from '../EmailService.js';
import { hasPermission } from '../../users/permissions.js';

/**
 * Server-only email methods using the centralized EmailService
 */
Meteor.methods({
  /**
   * Send verification code email (public method)
   */
  async 'email.sendVerificationCode'(email, verificationCode) {
    check(email, String);
    check(verificationCode, String);
    
    if (!Meteor.isServer) return;
    
    try {
      await EmailService.sendVerificationCode(email, verificationCode);
      return { success: true, message: 'Verification email sent successfully' };
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw new Meteor.Error('email-failed', 'Failed to send verification email');
    }
  },

  /**
   * Send welcome email (admin only)
   */
  async 'email.sendWelcome'(userEmail, userName) {
    check(userEmail, String);
    check(userName, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }
    
    const canManageUsers = await hasPermission(this.userId, 'MANAGE_USERS');
    if (!canManageUsers) {
      throw new Meteor.Error('not-authorized', 'You do not have permission to send welcome emails');
    }
    
    if (!Meteor.isServer) return;
    
    try {
      await EmailService.sendWelcomeEmail(userEmail, userName);
      return { success: true, message: 'Welcome email sent successfully' };
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      throw new Meteor.Error('email-failed', 'Failed to send welcome email');
    }
  },

  /**
   * Send approval notification (admin only)
   */
  async 'email.sendApprovalNotification'(userEmail, userName, isApproved) {
    check(userEmail, String);
    check(userName, String);
    check(isApproved, Boolean);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }
    
    const canManageUsers = await hasPermission(this.userId, 'MANAGE_USERS');
    if (!canManageUsers) {
      throw new Meteor.Error('not-authorized', 'You do not have permission to send approval notifications');
    }
    
    if (!Meteor.isServer) return;
    
    try {
      await EmailService.sendApprovalNotification(userEmail, userName, isApproved);
      return { success: true, message: 'Approval notification sent successfully' };
    } catch (error) {
      console.error('Failed to send approval notification:', error);
      throw new Meteor.Error('email-failed', 'Failed to send approval notification');
    }
  },

  /**
   * Send admin notification (admin only)
   */
  async 'email.sendAdminNotification'(adminEmail, subject, message, actionUrl = null) {
    check(adminEmail, String);
    check(subject, String);
    check(message, String);
    check(actionUrl, Match.Maybe(String));
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }
    
    const canManageUsers = await hasPermission(this.userId, 'MANAGE_USERS');
    if (!canManageUsers) {
      throw new Meteor.Error('not-authorized', 'You do not have permission to send admin notifications');
    }
    
    if (!Meteor.isServer) return;
    
    try {
      await EmailService.sendAdminNotification(adminEmail, subject, message, actionUrl);
      return { success: true, message: 'Admin notification sent successfully' };
    } catch (error) {
      console.error('Failed to send admin notification:', error);
      throw new Meteor.Error('email-failed', 'Failed to send admin notification');
    }
  },

  /**
   * Send event notification (event creators and admins only)
   */
  async 'email.sendEventNotification'(userEmail, userName, eventTitle, eventDate, notificationType) {
    check(userEmail, String);
    check(userName, String);
    check(eventTitle, String);
    check(eventDate, String);
    check(notificationType, Match.OneOf('event-created', 'event-updated', 'event-cancelled', 'event-reminder'));
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }
    
    const canCreateEvents = await hasPermission(this.userId, 'CREATE_EVENTS');
    if (!canCreateEvents) {
      throw new Meteor.Error('not-authorized', 'You do not have permission to send event notifications');
    }
    
    if (!Meteor.isServer) return;
    
    try {
      await EmailService.sendEventNotification(userEmail, userName, eventTitle, eventDate, notificationType);
      return { success: true, message: 'Event notification sent successfully' };
    } catch (error) {
      console.error('Failed to send event notification:', error);
      throw new Meteor.Error('email-failed', 'Failed to send event notification');
    }
  }
});
