// imports/api/users/server/approval-methods.js
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Email } from 'meteor/email';
import { hasPermission } from '../permissions';
import { getSetting, SETTING_KEYS } from '../../settings';
import { EmailService } from '../../email/EmailService.js';

Meteor.methods({
  
  // Approve a user account
  async 'users.approve'(userId) {
    check(userId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }
    
    // Check if user has permission to manage users
    const canManageUsers = await hasPermission(this.userId, 'MANAGE_USERS');
    if (!canManageUsers) {
      throw new Meteor.Error('not-authorized', 'You do not have permission to approve users');
    }
    
    const user = await Meteor.users.findOneAsync(userId);
    if (!user) {
      throw new Meteor.Error('user-not-found', 'User not found');
    }
    
    if (user.isApproved) {
      throw new Meteor.Error('already-approved', 'User is already approved');
    }
    
    // Update user status
    await Meteor.users.updateAsync(userId, {
      $set: {
        isApproved: true,
        approvalStatus: 'approved',
        approvedAt: new Date(),
        approvedBy: this.userId
      }
    });
    
    // Send approval email notification
    try {
      await sendApprovalNotification(user, 'approved');
    } catch (error) {
      console.error('Failed to send approval email:', error);
      // Don't fail the approval if email fails
    }
    
    console.log(`✅ User ${userId} approved by ${this.userId}`);
    
    return { success: true };
  },
  
  // Reject a user account
  async 'users.reject'(userId, reason = '') {
    check(userId, String);
    check(reason, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }
    
    // Check if user has permission to manage users
    const canManageUsers = await hasPermission(this.userId, 'MANAGE_USERS');
    if (!canManageUsers) {
      throw new Meteor.Error('not-authorized', 'You do not have permission to reject users');
    }
    
    const user = await Meteor.users.findOneAsync(userId);
    if (!user) {
      throw new Meteor.Error('user-not-found', 'User not found');
    }
    
    // Update user status
    await Meteor.users.updateAsync(userId, {
      $set: {
        isApproved: false,
        approvalStatus: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: this.userId,
        rejectionReason: reason
      }
    });
    
    // Send rejection email notification
    try {
      await sendApprovalNotification(user, 'rejected', reason);
    } catch (error) {
      console.error('Failed to send rejection email:', error);
      // Don't fail the rejection if email fails
    }
    
    console.log(`❌ User ${userId} rejected by ${this.userId}. Reason: ${reason}`);
    
    return { success: true };
  },
  
  // Get pending users for approval
  async 'users.getPending'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }
    
    // Check if user has permission to manage users
    const canManageUsers = await hasPermission(this.userId, 'MANAGE_USERS');
    if (!canManageUsers) {
      throw new Meteor.Error('not-authorized', 'You do not have permission to view pending users');
    }
    
    const pendingUsers = await Meteor.users.find({
      approvalStatus: 'pending'
    }, {
      fields: {
        _id: 1,
        emails: 1,
        profile: 1,
        createdAt: 1,
        approvalStatus: 1,
        isEmailVerified: 1
      },
      sort: { createdAt: 1 }
    }).fetchAsync();
    
    return pendingUsers;
  }
  
});

// Helper function to send approval/rejection notifications
async function sendApprovalNotification(user, action, reason = '') {
  const userEmail = user.emails?.[0]?.address;
  const userName = user.profile?.name || 'User';
  
  if (!userEmail) {
    console.error('User has no email address for notification');
    return;
  }
  
  const isApproved = action === 'approved';
  await EmailService.sendApprovalNotification(userEmail, userName, isApproved);
}
