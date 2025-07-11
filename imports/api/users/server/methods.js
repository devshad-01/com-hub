import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import { Roles } from 'meteor/alanning:roles';
import { ROLES } from '../roles';
import { SecurityUtils } from './security';
import { StorageFactory } from '../../storage/StorageFactory';

Meteor.methods({
  async 'users.updateProfile'(profileData) {
    // Enhanced security validation
    if (!profileData || typeof profileData !== 'object') {
      throw new Meteor.Error('invalid-data', 'Profile data must be an object');
    }

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in to update profile');
    }

    // Check session validity
    if (!(await SecurityUtils.isSessionValid(this.userId))) {
      throw new Meteor.Error('session-invalid', 'Session is no longer valid');
    }

    // Rate limiting check (basic implementation)
    const user = await Meteor.users.findOneAsync(this.userId);
    const lastUpdate = user.profile?.lastUpdated;
    if (lastUpdate && (new Date() - lastUpdate) < 5000) { // 5 second cooldown
      throw new Meteor.Error('rate-limited', 'Please wait before updating again');
    }

    // Sanitize and validate input data
    const sanitizedData = {};
    
    if (profileData.name !== undefined && profileData.name !== null && typeof profileData.name === 'string') {
      const name = profileData.name.trim();
      if (name.length < 2 || name.length > 50) {
        throw new Meteor.Error('invalid-name', 'Name must be between 2 and 50 characters');
      }
      sanitizedData['profile.name'] = name;
    }
    
    if (profileData.bio !== undefined && profileData.bio !== null && typeof profileData.bio === 'string') {
      const bio = profileData.bio.trim();
      if (bio.length > 500) {
        throw new Meteor.Error('invalid-bio', 'Bio must be less than 500 characters');
      }
      sanitizedData['profile.bio'] = bio;
    }
    
    if (profileData.location !== undefined && profileData.location !== null && typeof profileData.location === 'string') {
      const location = profileData.location.trim();
      if (location.length > 100) {
        throw new Meteor.Error('invalid-location', 'Location must be less than 100 characters');
      }
      sanitizedData['profile.location'] = location;
    }

    // Modular avatar support with deletion of old avatar
    if (profileData.avatar !== undefined && profileData.avatar !== null) {
      if (typeof profileData.avatar === 'string' || 
          (typeof profileData.avatar === 'object' && profileData.avatar.url)) {
        const oldAvatar = user.profile?.avatar;
        const newAvatar = profileData.avatar;
        const isDifferent = oldAvatar && JSON.stringify(oldAvatar) !== JSON.stringify(newAvatar);
        if (isDifferent) {
          if (typeof oldAvatar === 'object' && oldAvatar.provider) {
            try {
              const storage = StorageFactory.create(oldAvatar.provider);
              if (oldAvatar.provider === 'cloudinary') {
                await storage.deleteImage(oldAvatar.publicId);
              } else if (oldAvatar.provider === 'backblaze') {
                // Use fileId and fileName, not publicId
                await storage.deleteImage({ fileId: oldAvatar.fileId, fileName: oldAvatar.fileName });
              }
            } catch (err) {
              console.error('Failed to delete old avatar:', err);
            }
          }
        }
        sanitizedData['profile.avatar'] = profileData.avatar;
      } else {
        throw new Meteor.Error('invalid-avatar', 'Avatar must be a string or an object with a url property');
      }
    }

    // Add update timestamp
    sanitizedData['profile.lastUpdated'] = new Date();

    return await Meteor.users.updateAsync(this.userId, {
      $set: sanitizedData
    });
  },

  async 'users.updateUsername'(newUsername) {
    check(newUsername, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in to update username');
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(newUsername)) {
      throw new Meteor.Error('invalid-username', 'Username must be 3-20 characters and contain only letters, numbers, hyphens, and underscores');
    }

    // Check if username is already taken
    const existingUser = await Meteor.users.findOneAsync({ username: newUsername });
    if (existingUser && existingUser._id !== this.userId) {
      throw new Meteor.Error('username-taken', 'Username is already taken');
    }

    return Accounts.setUsername(this.userId, newUsername);
  },

  async 'users.updateRole'(userId, role) {
    check(userId, String);
    check(role, String); // Accept any string role now

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }

    // Check if current user can manage roles
    const isSuperadmin = await Roles.userIsInRoleAsync(this.userId, ROLES.SUPERADMIN);
    const isAdmin = await Roles.userIsInRoleAsync(this.userId, ROLES.ADMIN);
    
    if (!isSuperadmin && !isAdmin) {
      throw new Meteor.Error('not-authorized', 'Must be admin or superadmin to change user roles');
    }
    
    // Only superadmin can assign superadmin or admin roles
    if ((role === ROLES.SUPERADMIN || role === ROLES.ADMIN) && !isSuperadmin) {
      throw new Meteor.Error('not-authorized', 'Only superadmin can assign admin or superadmin roles');
    }
    
    try {
      // Check if the role exists first
      const roleRecord = await Meteor.roles.findOneAsync({ _id: role });
      
      if (!roleRecord) {
        await Roles.createRoleAsync(role);
      }
      
      // Add the user to the specified role
      await Roles.addUsersToRolesAsync(userId, role);
      
      return true;
    } catch (error) {
      console.error(`Error adding role ${role} to user ${userId}:`, error);
      throw new Meteor.Error('role-update-failed', `Failed to add role: ${error.message}`);
    }
  },
  
  async 'users.removeRole'(userId, role) {
    check(userId, String);
    check(role, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }

    // Check if current user can manage roles
    const isSuperadmin = await Roles.userIsInRoleAsync(this.userId, ROLES.SUPERADMIN);
    const isAdmin = await Roles.userIsInRoleAsync(this.userId, ROLES.ADMIN);
    
    if (!isSuperadmin && !isAdmin) {
      throw new Meteor.Error('not-authorized', 'Must be admin or superadmin to change user roles');
    }
    
    // Only superadmin can remove superadmin or admin roles
    if ((role === ROLES.SUPERADMIN || role === ROLES.ADMIN) && !isSuperadmin) {
      throw new Meteor.Error('not-authorized', 'Only superadmin can remove admin or superadmin roles');
    }
    
    // Prevent removing the last superadmin
    if (role === ROLES.SUPERADMIN) {
      const superadminCount = await Roles.getUsersInRoleAsync(ROLES.SUPERADMIN).countAsync();
      if (superadminCount <= 1) {
        throw new Meteor.Error('cannot-remove-last-superadmin', 'Cannot remove the last superadmin');
      }
    }

    // Remove the role from the user
    await Roles.removeUsersFromRolesAsync(userId, role);
    
    return true;
  },

  async 'users.deleteUser'(userId) {
    check(userId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }

    // Check if current user can delete users
    const isSuperadmin = await Roles.userIsInRoleAsync(this.userId, ROLES.SUPERADMIN);
    const isAdmin = await Roles.userIsInRoleAsync(this.userId, ROLES.ADMIN);
    
    if (!isSuperadmin && !isAdmin) {
      throw new Meteor.Error('not-authorized', 'Must be admin or superadmin to delete users');
    }

    // Don't allow admin to delete themselves
    if (userId === this.userId) {
      throw new Meteor.Error('not-allowed', 'Cannot delete your own account');
    }
    
    // Check if target user is superadmin or admin
    const targetUser = await Meteor.users.findOneAsync(userId);
    if (!targetUser) {
      throw new Meteor.Error('user-not-found', 'User not found');
    }
    
    const targetIsSuperadmin = await Roles.userIsInRoleAsync(userId, ROLES.SUPERADMIN);
    const targetIsAdmin = await Roles.userIsInRoleAsync(userId, ROLES.ADMIN);
    
    // Only superadmin can delete other superadmins or admins
    if ((targetIsSuperadmin || targetIsAdmin) && !isSuperadmin) {
      throw new Meteor.Error('not-authorized', 'Only superadmin can delete admin or superadmin users');
    }
    
    // Prevent deleting the last superadmin
    if (targetIsSuperadmin) {
      const superadminCount = await Roles.getUsersInRoleAsync(ROLES.SUPERADMIN).countAsync();
      if (superadminCount <= 1) {
        throw new Meteor.Error('cannot-delete-last-superadmin', 'Cannot delete the last superadmin');
      }
    }

    return await Meteor.users.removeAsync(userId);
  },

  async 'users.sendVerificationEmail'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }

    return await Accounts.sendVerificationEmail(this.userId);
  },

  async 'users.sendPasswordResetEmail'(email) {
    check(email, String);

    const user = await Meteor.users.findOneAsync({
      'emails.address': email
    });

    if (!user) {
      throw new Meteor.Error('not-found', 'No user found with that email address');
    }

    return await Accounts.sendResetPasswordEmail(user._id);
  },

  async 'users.updatePresence'(isOnline) {
    check(isOnline, Boolean);
    
    if (!this.userId) {
      return; // Don't throw error, just return
    }

    const updateFields = {
      'status.lastActivity': new Date()
    };

    if (isOnline) {
      updateFields['status.online'] = true;
    } else {
      updateFields['status.online'] = false;
    }

    try {
      await Meteor.users.updateAsync(this.userId, {
        $set: updateFields
      });
    } catch (error) {
      console.error('Error updating user presence:', error);
    }
  }
});
