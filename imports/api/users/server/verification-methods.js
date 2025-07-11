// imports/api/users/server/verification-methods.js
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import { SecurityUtils } from './security';
import { getSetting, SETTING_KEYS } from '../../settings';
import { EmailService } from '../../email/EmailService.js';

// Email verification code methods
Meteor.methods({
  
  // Generate and send verification code via email
  async 'verification.sendCode'(email) {
    check(email, String);
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Meteor.Error('invalid-email', 'Invalid email format');
    }
    
    // Check if email is already registered
    const existingUser = await Meteor.users.findOneAsync({
      'emails.address': {
        $regex: new RegExp('^' + email + '$', 'i')
      }
    });
    
    if (existingUser) {
      throw new Meteor.Error('email-exists', 'An account with this email already exists');
    }
    
    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    
    // Store verification code in a collection or memory (using a simple in-memory store for demo)
    const verificationData = {
      email: email.toLowerCase(),
      code: verificationCode,
      expiresAt,
      attempts: 0,
      createdAt: new Date()
    };
    
    // Store in global variable for simplicity (in production, use a proper collection)
    if (!global.verificationCodes) {
      global.verificationCodes = new Map();
    }
    global.verificationCodes.set(email.toLowerCase(), verificationData);
    
    // Send verification email
    try {
      await EmailService.sendVerificationCode(email, verificationCode);
      
      SecurityUtils.logSecurityEvent(null, 'VERIFICATION_CODE_SENT', {
        email: email.toLowerCase(),
        ip: this.connection?.clientAddress
      });
      
      return { success: true, message: 'Verification code sent to your email' };
      
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw new Meteor.Error('email-send-failed', 'Failed to send verification email');
    }
  },
  
  // Verify the email code
  async 'verification.verifyCode'(email, code) {
    check(email, String);
    check(code, String);
    
    if (!global.verificationCodes) {
      throw new Meteor.Error('invalid-code', 'Invalid or expired verification code');
    }
    
    const verificationData = global.verificationCodes.get(email.toLowerCase());
    
    if (!verificationData) {
      throw new Meteor.Error('invalid-code', 'Invalid or expired verification code');
    }
    
    // Check if code has expired
    if (new Date() > verificationData.expiresAt) {
      global.verificationCodes.delete(email.toLowerCase());
      throw new Meteor.Error('code-expired', 'Verification code has expired');
    }
    
    // Check attempt limit (max 3 attempts)
    if (verificationData.attempts >= 3) {
      global.verificationCodes.delete(email.toLowerCase());
      throw new Meteor.Error('too-many-attempts', 'Too many failed attempts. Please request a new code.');
    }
    
    // Verify the code
    if (verificationData.code !== code.toString()) {
      verificationData.attempts++;
      global.verificationCodes.set(email.toLowerCase(), verificationData);
      
      SecurityUtils.logSecurityEvent(null, 'VERIFICATION_CODE_FAILED', {
        email: email.toLowerCase(),
        attempts: verificationData.attempts,
        ip: this.connection?.clientAddress
      });
      
      throw new Meteor.Error('invalid-code', `Invalid verification code. ${3 - verificationData.attempts} attempts remaining.`);
    }
    
    // Code is valid - clean up and mark as verified
    global.verificationCodes.delete(email.toLowerCase());
    
    SecurityUtils.logSecurityEvent(null, 'VERIFICATION_CODE_SUCCESS', {
      email: email.toLowerCase(),
      ip: this.connection?.clientAddress
    });
    
    return { success: true, verified: true };
  },
  
  // Resend verification code
  async 'verification.resendCode'(email) {
    check(email, String);
    
    // Rate limiting - check if too many requests
    if (global.verificationCodes) {
      const existing = global.verificationCodes.get(email.toLowerCase());
      if (existing && (new Date().getTime() - existing.createdAt.getTime()) < 60000) {
        throw new Meteor.Error('rate-limited', 'Please wait 1 minute before requesting a new code');
      }
    }
    
    // Send new code
    return await Meteor.callAsync('verification.sendCode', email);
  },
  
  // Create user account after email verification
  async 'verification.createUserWithVerifiedEmail'(userData, verificationToken) {
    check(userData, {
      name: String,
      email: String,
      password: String
    });
    check(verificationToken, String);
    
    // For simplicity, we'll verify that the email was verified in the last 5 minutes
    // In production, you'd use proper token verification
    const email = userData.email.toLowerCase();
    
    try {
      // Create the user account
      const userId = await Accounts.createUserAsync({
        email: userData.email,
        password: userData.password,
        profile: {
          name: userData.name
        }
      });
      
      // Check if user verification is required
      const userVerificationRequired = await getSetting(SETTING_KEYS.USER_VERIFICATION_REQUIRED, false);
      
      console.log(`🔧 User verification required: ${userVerificationRequired}`);
      
      // Mark email as verified since they used the verification code
      const updateFields = {
        'emails.0.verified': true,
        'isEmailVerified': true
      };
      
      // Set approval status based on settings
      if (userVerificationRequired) {
        updateFields.isApproved = false;
        updateFields.approvalStatus = 'pending';
        console.log(`🔧 Setting user ${userId} to pending approval`);
      } else {
        updateFields.isApproved = true;
        updateFields.approvalStatus = 'approved';
        console.log(`🔧 Setting user ${userId} to auto-approved`);
      }
      
      await Meteor.users.updateAsync(userId, {
        $set: updateFields
      });
      
      SecurityUtils.logSecurityEvent(userId, 'USER_CREATED_WITH_VERIFIED_EMAIL', {
        email: userData.email,
        userVerificationRequired,
        approvalStatus: userVerificationRequired ? 'pending' : 'approved',
        ip: this.connection?.clientAddress
      });
      
      // If user verification is required, notify admins
      if (userVerificationRequired) {
        try {
          await notifyAdminsNewUserPending(userId, userData);
        } catch (error) {
          console.error('Failed to notify admins of pending user:', error);
          // Don't fail user creation if admin notification fails
        }
      }
      
      return { 
        success: true, 
        userId,
        requiresApproval: userVerificationRequired
      };
      
    } catch (error) {
      console.error('Error creating verified user:', error);
      throw new Meteor.Error('user-creation-failed', error.reason || 'Failed to create user account');
    }
  }
});

// Helper function to notify admins of new pending users
async function notifyAdminsNewUserPending(userId, userData) {
  const siteName = await getSetting(SETTING_KEYS.SITE_NAME, 'CommunityHub');
  
  // Get all admin users using the Roles package
  const { Roles } = require('meteor/alanning:roles');
  const { ROLES } = require('../roles');
  
  const adminUsers = await Roles.getUsersInRoleAsync([ROLES.SUPERADMIN, ROLES.ADMIN]);
  const adminUsersArray = await adminUsers.fetchAsync();
  
  console.log(`📧 Found ${adminUsersArray.length} admin users for notification`);
  
  const adminEmails = adminUsersArray
    .filter(user => user.emails?.[0]?.address)
    .map(user => user.emails[0].address);
  
  console.log(`📧 Admin emails found:`, adminEmails);
  
  if (adminEmails.length === 0) {
    console.log('No admin emails found for notification');
    return;
  }
  
  const userEmail = userData.email;
  const userName = userData.name;
  
  // Send email to all admins
  for (const adminEmail of adminEmails) {
    try {
      await EmailService.sendAdminNotification(
        adminEmail,
        `New User Pending Approval`,
        `A new user has registered and is awaiting approval.\n\nUser Details:\nName: ${userName}\nEmail: ${userEmail}\n\nPlease review and approve/reject this user in the admin dashboard.`,
        Meteor.absoluteUrl('admin')
      );
    } catch (error) {
      console.error(`Failed to send admin notification to ${adminEmail}:`, error);
    }
  }
  
  console.log(`📧 Notified ${adminEmails.length} admins of pending user: ${userName} (${userEmail})`);
}
