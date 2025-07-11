import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
// @ts-ignore - Meteor 3 TypeScript compatibility for alanning:roles
import { Roles } from 'meteor/alanning:roles';
import { ROLES, ROLE_GROUPS, initRoles, addUserToRole } from '../roles';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { getEmailFromAddress, getAppName } from '/imports/utils/email.js';
import { getSetting, SETTING_KEYS } from '../../settings';
import './types.js'; // Import for documentation

Meteor.startup(async () => {
  
  // Initialize roles first before doing anything else
  await initRoles();
  
  // Enhanced secure accounts configuration (simplified for JavaScript)
  Accounts.config({
    sendVerificationEmail: true,
    forbidClientAccountCreation: false,
    loginExpirationInDays: 7, // 7 days max (we'll handle inactivity separately)
    passwordResetTokenExpirationInDays: 1,
    passwordEnrollTokenExpirationInDays: 30,
    ambiguousErrorMessages: true, // Don't leak info about existing accounts
  });

  // Custom session management
  const SESSION_CONFIG = {
    DEFAULT_EXPIRY: 30 * 60 * 1000, // 30 minutes in milliseconds
    REMEMBER_ME_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    INACTIVITY_TIMEOUT: 30 * 60 * 1000, // 30 minutes of inactivity
  };

  // Rate limiting for authentication endpoints
  const authenticationMethods = [
    'login',
    'createUser',
    'resetPassword',
    'forgotPassword',   
    'verifyEmail',
    'changePassword',
  ];

  DDPRateLimiter.addRule({
    type: 'method',
    name(name) {
      return authenticationMethods.includes(name);
    },
    connectionId() { return true; }
  }, 5, 60000); // 5 attempts per minute per connection

  // Rate limiting for login attempts per user
  DDPRateLimiter.addRule({
    type: 'method',
    name: 'login',
    userId(userId) { return !!userId; } // Return boolean instead of string
  }, 3, 300000); // 3 attempts per 5 minutes per user

  // Enhanced user validation with security checks (Meteor 3 async version)
  Accounts.validateNewUser(async (user) => {
    // Check allowRegistration setting
    const allowRegistration = await getSetting(SETTING_KEYS.ALLOW_REGISTRATION, true);
    if (!allowRegistration) {
      throw new Meteor.Error(403, 'User registration is currently disabled.');
    }
    
    // Basic validation
    if (!user.emails || !user.emails[0] || !user.emails[0].address) {
      throw new Meteor.Error(403, 'Email is required');
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.emails[0].address)) {
      throw new Meteor.Error(403, 'Invalid email format');
    }
    
    // Check for duplicate emails (case insensitive) - using async method
    const existingUser = await Meteor.users.findOneAsync({
      'emails.address': {
        $regex: new RegExp('^' + user.emails[0].address + '$', 'i')
      }
    });
    
    if (existingUser) {
      throw new Meteor.Error(403, 'An account with this email already exists');
    }
    
    if (!user.profile || !user.profile.name) {
      throw new Meteor.Error(403, 'Name is required');
    }
    
    // Name validation
    if (user.profile.name.length < 2 || user.profile.name.length > 50) {
      throw new Meteor.Error(403, 'Name must be between 2 and 50 characters');
    }

    return true;
  });

  // Enhanced user creation with security measures and role assignment
  Accounts.onCreateUser((options, user) => {
    // Set default profile with proper handling
    user.profile = options.profile || {};
    
    // Sanitize profile data (using bracket notation to avoid TS errors)
    if (user.profile['name']) {
      user.profile['name'] = user.profile['name'].trim();
    }
    
    // Add creation timestamp and security fields (using bracket notation)
    user.createdAt = new Date();
    user['isEmailVerified'] = false;
    user['lastLoginAt'] = null;
    user['loginAttempts'] = 0;
    user['accountLocked'] = false;
    user['lockUntil'] = null;
    
    // Set initial approval status - will be updated by verification flow if needed
    user['isApproved'] = true; // Default to approved for non-verification flow
    user['approvalStatus'] = 'approved'; // Default to approved
    
    // Assign default member role immediately after user creation
    Meteor.defer(async () => {
      try {
        // Double-check that the MEMBER role exists before assigning
        const memberRoleExists = await Meteor.roles.findOneAsync({ _id: ROLES.MEMBER });
        if (memberRoleExists) {
          await Roles.addUsersToRolesAsync(user._id, ROLES.MEMBER);
          console.log(`✅ Assigned ${ROLES.MEMBER} role to user:`, user._id);
        } else {
          console.error(`❌ Role ${ROLES.MEMBER} does not exist when trying to assign to user:`, user._id);
        }
      } catch (error) {
        console.error('Error adding default role:', error);
      }
    });
    
    return user;
  });

  // Configure secure email templates
  Accounts.emailTemplates.siteName = getAppName();
  Accounts.emailTemplates.from = getEmailFromAddress();
  
  // Configure URLs to use our custom format without hash
  Accounts.urls.resetPassword = (token) => {
    return `${Meteor.absoluteUrl()}reset-password?token=${token}`;
  };

  Accounts.emailTemplates.resetPassword = {
    subject() {
      return 'Reset your password on CommunityHub';
    },
    text(user, url) {
      const userName = user.profile?.['name'] || 'User';
      console.log('Reset password URL:', url);
      return `Hello ${userName},\n\nTo reset your password, simply click the link below:\n\n${url}\n\nThis link will expire in 24 hours for security reasons.\n\nIf you did not request this reset, please ignore this email.\n\nThanks,\nThe CommunityHub Team`;
    },
    html(user, url) {
      const userName = user.profile?.['name'] || 'User';
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #f97316; margin: 0;">CommunityHub</h1>
          </div>
          
          <div style="background: #f8fafc; border-radius: 8px; padding: 30px; text-align: center;">
            <h2 style="color: #334155; margin-bottom: 20px;">Reset Your Password</h2>
            
            <p style="color: #64748b; margin-bottom: 30px; font-size: 16px;">
              Hello ${userName},<br><br>
              We received a request to reset your password. Click the button below to set a new password:
            </p>
            
            <div style="margin: 30px 0;">
              <a href="${url}" style="background: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
              This link will expire in 24 hours for security reasons.
            </p>
            
            <p style="color: #64748b; font-size: 14px;">
              If you didn't request this password reset, you can safely ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              © 2025 CommunityHub. All rights reserved.
            </p>
          </div>
        </div>
      `;
    }
  };

  Accounts.emailTemplates.verifyEmail = {
    subject() {
      return 'Verify your email address on CommunityHub';
    },
    text(user, url) {
      const userName = user.profile?.['name'] || 'User';
      return `Hello ${userName},\n\nTo verify your account email, simply click the link below:\n\n${url}\n\nThis step is required to ensure the security of your account.\n\nThanks,\nThe CommunityHub Team`;
    }
  };

  // Security hooks for login attempts (Meteor 3 async)
  Accounts.onLogin(async (loginInfo) => {
    const userId = loginInfo.user._id;
    
    // Update last login time and reset failed attempts
    await Meteor.users.updateAsync(userId, {
      $set: {
        lastLoginAt: new Date(),
        lastActivityAt: new Date(), // Track activity for inactivity timeout
        loginAttempts: 0,
        accountLocked: false
      },
      $unset: {
        lockUntil: 1
      }
    });
    
    console.log(`User ${userId} logged in successfully from ${loginInfo.connection.clientAddress}`);
  });

  Accounts.onLoginFailure(async (loginInfo) => {
    if (loginInfo.user) {
      const userId = loginInfo.user._id;
      const user = await Meteor.users.findOneAsync(userId);
      
      if (user) {
        const attempts = (user['loginAttempts'] || 0) + 1;
        const updates = { loginAttempts: attempts };
        
        // Lock account after 5 failed attempts for 15 minutes
        if (attempts >= 5) {
          updates.accountLocked = true;
          updates.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
          console.log(`Account ${userId} locked due to failed login attempts`);
        }
        
        await Meteor.users.updateAsync(userId, { $set: updates });
      }
    }
    
    console.log(`Login failed from ${loginInfo.connection.clientAddress}: ${loginInfo.error.reason}`);
  });

  // Create default superadmin user on first run (when database is empty)
  const userCount = await Meteor.users.find().countAsync();
  if (userCount === 0) {
    console.log('🔧 First run detected - Creating default superadmin user...');
    
    const superAdminEmail = process.env.SUPERADMIN_EMAIL || 'mutinda.shadrack20@gmail.com';
    const superAdminPassword = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin123!@#';
    
    try {
      // Ensure the superadmin role exists before creating user
      const superadminRoleExists = await Meteor.roles.findOneAsync({ _id: ROLES.SUPERADMIN });
      if (!superadminRoleExists) {
        console.log('🔧 Superadmin role does not exist, creating it...');
        await Roles.createRoleAsync(ROLES.SUPERADMIN);
      }

      const superAdminUserId = await Accounts.createUserAsync({
        email: superAdminEmail,
        password: superAdminPassword,
        username: 'superadmin',
        profile: {
          name: 'Super Administrator'
        }
      });
      
      // Add superadmin role to the user (this will also add all lower roles due to hierarchy)
      await addUserToRole(superAdminUserId, ROLES.SUPERADMIN);
      
      // Mark email as verified
      await Meteor.users.updateAsync(superAdminUserId, {
        $set: {
          'emails.0.verified': true,
          'isEmailVerified': true,
          'isApproved': true, // Auto-approve superadmin
          'approvalStatus': 'approved'
        }
      });
      
      console.log('✅ Created superadmin user');
      console.log('📧 Email:', superAdminEmail);
      console.log('⚠️  Change password after first login!');
    } catch (error) {
      console.error('❌ Error creating superadmin:', error);
    }
  } else {
    console.log(`📊 Database already has ${userCount} users - skipping default user creation`);
    
    // Update existing users without approval status to be approved by default
    const usersWithoutApprovalStatus = await Meteor.users.find({
      approvalStatus: { $exists: false }
    }).countAsync();
    
    if (usersWithoutApprovalStatus > 0) {
      console.log(`🔧 Updating ${usersWithoutApprovalStatus} existing users to approved status...`);
      await Meteor.users.updateAsync(
        { approvalStatus: { $exists: false } },
        { 
          $set: { 
            isApproved: true, 
            approvalStatus: 'approved' 
          } 
        },
        { multi: true }
      );
      console.log('✅ Updated existing users approval status');
    }
    
    // Fix existing superusers to have complete role hierarchy
    const superusers = await Meteor.users.find({
      roles: { $in: [ROLES.SUPERADMIN] }
    }).fetchAsync();
    
    for (const superuser of superusers) {
      const userRoles = await Roles.getRolesForUserAsync(superuser._id);
      const expectedRoles = ROLE_GROUPS[ROLES.SUPERADMIN];
      
      // Check if user has all expected roles
      const missingRoles = expectedRoles.filter(role => !userRoles.includes(role));
      
      if (missingRoles.length > 0) {
        console.log(`🔧 Fixing superuser ${superuser.profile?.name || superuser.emails?.[0]?.address} - adding missing roles:`, missingRoles);
        await addUserToRole(superuser._id, ROLES.SUPERADMIN);
        console.log('✅ Updated superuser roles');
      }
    }
  }

  // Password validation (Meteor 3 async)
  Accounts.validateLoginAttempt(async (attemptInfo) => {
    // Enforce email verification if required
    if (attemptInfo.user) {
      const emailVerificationRequired = await getSetting(SETTING_KEYS.EMAIL_VERIFICATION_REQUIRED, true);
      console.log('[DEBUG] emailVerificationRequired value:', emailVerificationRequired, 'type:', typeof emailVerificationRequired);
      const isEmailVerified = attemptInfo.user.emails?.[0]?.verified || attemptInfo.user.isEmailVerified;
      if (emailVerificationRequired && !isEmailVerified) {
        throw new Meteor.Error(403, 'You must verify your email address before logging in.');
      }
    }
    // Check if account is locked
    if (attemptInfo.user && attemptInfo.user['accountLocked']) {
      const lockUntil = attemptInfo.user['lockUntil'];
      if (lockUntil && new Date() < lockUntil) {
        throw new Meteor.Error(423, 'Account temporarily locked due to failed login attempts');
      } else {
        // Unlock account if lock period has expired
        await Meteor.users.updateAsync(attemptInfo.user._id, {
          $unset: {
            accountLocked: 1,
            lockUntil: 1,
            loginAttempts: 1
          }
        });
      }
    }
    
    // Check if user is approved (if user verification is enabled)
    if (attemptInfo.user && attemptInfo.user.approvalStatus === 'pending') {
      throw new Meteor.Error(403, 'Your account is pending approval. Please wait for an administrator to approve your account.');
    }
    
    if (attemptInfo.user && attemptInfo.user.approvalStatus === 'rejected') {
      throw new Meteor.Error(403, 'Your account has been rejected. Please contact support for more information.');
    }
    
    return true;
  });
});
