// imports/api/users/permissions.js
import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';
import { ROLES } from './roles';

// Define permissions matrix - maps actions to roles that can perform them
export const PERMISSIONS = {
  // Admin dashboard - now accessible to multiple roles
  ACCESS_ADMIN_DASHBOARD: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MODERATOR, ROLES.EVENT_CREATOR],
  
  // Settings management
  UPDATE_SETTINGS: [ROLES.SUPERADMIN, ROLES.ADMIN],
  
  // User management - superadmin can manage admins, admin can manage others
  DELETE_USERS: [ROLES.SUPERADMIN, ROLES.ADMIN],
  UPDATE_USER_ROLES: [ROLES.SUPERADMIN, ROLES.ADMIN],
  MANAGE_USERS: [ROLES.SUPERADMIN, ROLES.ADMIN], // New permission for user approval
  MANAGE_ADMINS: [ROLES.SUPERADMIN], // Only superadmin can manage other admins
  
  // Forum permissions
  CREATE_CATEGORY: [ROLES.SUPERADMIN, ROLES.ADMIN],
  DELETE_CATEGORY: [ROLES.SUPERADMIN, ROLES.ADMIN],
  PIN_POSTS: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MODERATOR],
  LOCK_THREADS: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MODERATOR],
  DELETE_POSTS: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MODERATOR],
  POST_IN_LOCKED_THREADS: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MODERATOR],
  
  // Event permissions
  CREATE_EVENTS: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MODERATOR, ROLES.EVENT_CREATOR],
  MANAGE_EVENTS: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MODERATOR, ROLES.EVENT_CREATOR],
  
  // Member permissions (everyone has these)
  PARTICIPATE_IN_FORUMS: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MODERATOR, ROLES.EVENT_CREATOR, ROLES.MEMBER],
  RSVP_TO_EVENTS: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MODERATOR, ROLES.EVENT_CREATOR, ROLES.MEMBER],
  UPDATE_OWN_PROFILE: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MODERATOR, ROLES.EVENT_CREATOR, ROLES.MEMBER],
  USE_CHAT: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MODERATOR, ROLES.EVENT_CREATOR, ROLES.MEMBER],
};

// Check if a user has a specific permission
export const hasPermission = async (userId, permission) => {
  if (!userId) return false;
  
  // Get the roles that can perform this action
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) return false;
  
  // Check if the user has any of these roles
  if (Meteor.isServer) {
    return await Roles.userIsInRoleAsync(userId, allowedRoles);
  } else {
    // On the client, use the published role assignments
    const assignments = Meteor.roleAssignment
      .find({
        'user._id': userId,
        'role._id': { $in: allowedRoles }
      })
      .fetch();
    return assignments.length > 0;
  }
};

// Convenience function to check if user can perform an action
export const can = {
  accessAdminDashboard: (userId) => hasPermission(userId, 'ACCESS_ADMIN_DASHBOARD'),
  updateSettings: (userId) => hasPermission(userId, 'UPDATE_SETTINGS'),
  deleteUsers: (userId) => hasPermission(userId, 'DELETE_USERS'),
  updateUserRoles: (userId) => hasPermission(userId, 'UPDATE_USER_ROLES'),
  manageUsers: (userId) => hasPermission(userId, 'MANAGE_USERS'),
  createCategory: (userId) => hasPermission(userId, 'CREATE_CATEGORY'),
  deleteCategory: (userId) => hasPermission(userId, 'DELETE_CATEGORY'),
  pinPosts: (userId) => hasPermission(userId, 'PIN_POSTS'),
  lockThreads: (userId) => hasPermission(userId, 'LOCK_THREADS'),
  deletePosts: (userId) => hasPermission(userId, 'DELETE_POSTS'),
  postInLockedThreads: (userId) => hasPermission(userId, 'POST_IN_LOCKED_THREADS'),
  createEvents: (userId) => hasPermission(userId, 'CREATE_EVENTS'),
  manageEvents: (userId) => hasPermission(userId, 'MANAGE_EVENTS'),
  participateInForums: (userId) => hasPermission(userId, 'PARTICIPATE_IN_FORUMS'),
  rsvpToEvents: (userId) => hasPermission(userId, 'RSVP_TO_EVENTS'),
  updateOwnProfile: (userId) => hasPermission(userId, 'UPDATE_OWN_PROFILE'),
  useChat: (userId) => hasPermission(userId, 'USE_CHAT'),
};
