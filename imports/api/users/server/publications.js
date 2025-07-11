import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Roles } from 'meteor/alanning:roles';
import { ROLES } from '../roles';

// Publish current user's full profile
Meteor.publish('userData', function () {
  if (this.userId) {
    return Meteor.users.find(
      { _id: this.userId },
      {
        fields: {
          emails: 1,
          username: 1,
          profile: 1,
          createdAt: 1,
          services: 1 // Include services for social login info
        }
      }
    );
  } else {
    this.ready();
  }
});

// Publish user list for admins
Meteor.publish('allUsers', async function () {
  const isAdmin = await Roles.userIsInRoleAsync(this.userId, [ROLES.SUPERADMIN, ROLES.ADMIN]);
  if (isAdmin) {
    return Meteor.users.find(
      {},
      {
        fields: {
          emails: 1,
          username: 1,
          profile: 1,
          createdAt: 1,
          approvalStatus: 1,
          isApproved: 1,
          rejectionReason: 1,
          approvedAt: 1,
          rejectedAt: 1,
          approvedBy: 1,
          rejectedBy: 1,
          'services.facebook.name': 1,
          'services.google.name': 1,
          'services.github.username': 1
        }
      }
    );
  } else {
    this.ready();
  }
});

// Publish basic user info for all authenticated users (for mentions, etc.)
Meteor.publish('usersBasic', function () {
  if (this.userId) {
    return Meteor.users.find(
      {},
      {
        fields: {
          username: 1,
          'profile.name': 1,
          'profile.role': 1,
          'profile.avatar': 1,  // Added avatar field for UserAvatar component
          'status.online': 1,   // Add online status for sidebar and member cards
          'status.lastActivity': 1 // Add last activity for accurate presence
        }
      }
    );
  } else {
    this.ready();
  }
});

// Publish current user's roles
Meteor.publish('roles', function() {
  if (this.userId) {
    return Meteor.roleAssignment.find({ 'user._id': this.userId });
  } else {
    this.ready();
  }
});

// Publish role assignments for all users (for forum badges, etc.)
// This is safe because role information is generally public in community platforms
Meteor.publish('publicRoles', function() {
  if (this.userId) {
    // Only publish role assignments, not user details
    return Meteor.roleAssignment.find({}, {
      fields: {
        'user._id': 1,
        'role._id': 1,
        scope: 1
      }
    });
  } else {
    this.ready();
  }
});

// Publish all roles for admins (kept for backward compatibility)
Meteor.publish('allRoles', async function() {
  const isAdmin = await Roles.userIsInRoleAsync(this.userId, [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MODERATOR]);
  if (isAdmin) {
    return Meteor.roleAssignment.find();
  } else {
    this.ready();
  }
});
