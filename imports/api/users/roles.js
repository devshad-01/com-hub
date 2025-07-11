// imports/api/users/roles.js
import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';

// Define role constants
export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  MODERATOR: 'moderator', 
  EVENT_CREATOR: 'event-creator',
  MEMBER: 'member'
};

// Define role groups/hierarchy
export const ROLE_GROUPS = {
  // Superadmin can do everything including managing admins
  [ROLES.SUPERADMIN]: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MODERATOR, ROLES.EVENT_CREATOR, ROLES.MEMBER],
  // Admin can do everything except manage other admins
  [ROLES.ADMIN]: [ROLES.ADMIN, ROLES.MODERATOR, ROLES.EVENT_CREATOR, ROLES.MEMBER],
  // Moderators can create events and moderate forums, but not admin functions
  [ROLES.MODERATOR]: [ROLES.MODERATOR, ROLES.EVENT_CREATOR, ROLES.MEMBER],
  // Event creators can only create events, plus member capabilities
  [ROLES.EVENT_CREATOR]: [ROLES.EVENT_CREATOR, ROLES.MEMBER],
  // Regular members
  [ROLES.MEMBER]: [ROLES.MEMBER]
};

// Permission check functions
export const hasRole = (userId, roles, options = {}) => {
  if (!userId) return false;
  
  // Handle single role or array of roles
  const rolesToCheck = Array.isArray(roles) ? roles : [roles];
  
  // Check if user has any of the roles
  return Roles.userIsInRole(userId, rolesToCheck, options.group);
};

// Helper to add a user to a role
export const addUserToRole = async (userId, role, options = {}) => {
  if (!Meteor.isServer) {
    throw new Meteor.Error('not-authorized', 'This method can only be called from the server');
  }
  
  // Add the user to the role
  await Roles.addUsersToRolesAsync(userId, role, options.group);
  
  // If it's an array, process each role
  if (Array.isArray(role)) {
    return;
  }
  
  // If it's a single role and we have role hierarchy defined, add all lower roles too
  if (ROLE_GROUPS[role]) {
    await Roles.addUsersToRolesAsync(userId, ROLE_GROUPS[role], options.group);
  }
};

// Helper to remove a user from a role
export const removeUserFromRole = async (userId, role, options = {}) => {
  if (!Meteor.isServer) {
    throw new Meteor.Error('not-authorized', 'This method can only be called from the server');
  }
  
  await Roles.removeUsersFromRolesAsync(userId, role, options.group);
};

// Initialize roles
export const initRoles = async () => {
  if (!Meteor.isServer) return;
  
  // Create the roles using async methods
  for (const role of Object.values(ROLES)) {
    try {
      // Check if the role exists in the _roles collection
      const roleRecord = await Meteor.roles.findOneAsync({ _id: role });
      
      if (!roleRecord) {
        // Role doesn't exist, create it
        await Roles.createRoleAsync(role);
      }
    } catch (e) {
      console.error(`Error creating role ${role}:`, e);
    }
  }
};

// Helper to get user's highest role based on hierarchy
export const getUserRole = (userId) => {
  if (!userId) return ROLES.MEMBER;
  
  const userRoles = Roles.getRolesForUser(userId);
  if (!userRoles || userRoles.length === 0) return ROLES.MEMBER;
  
  // Check roles in hierarchy order (highest to lowest)
  const roleHierarchy = [
    ROLES.SUPERADMIN,
    ROLES.ADMIN, 
    ROLES.MODERATOR,
    ROLES.EVENT_CREATOR,
    ROLES.MEMBER
  ];
  
  for (const role of roleHierarchy) {
    if (userRoles.includes(role)) {
      return role;
    }
  }
  
  return ROLES.MEMBER;
};

// Method decorator for checking roles
export const requireRole = (roles) => {
  return (target, key, descriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(...args) {
      if (!this.userId || !hasRole(this.userId, roles)) {
        throw new Meteor.Error('not-authorized', 'You do not have permission to perform this action');
      }
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
};

// Permission checker functions for common actions
export const Permissions = {
  canDeleteUser: (userId) => hasRole(userId, [ROLES.SUPERADMIN, ROLES.ADMIN]),
  canUpdateRoles: (userId) => hasRole(userId, [ROLES.SUPERADMIN, ROLES.ADMIN]),
  canManageAdmins: (userId) => hasRole(userId, [ROLES.SUPERADMIN]),
  canAccessAdminDashboard: (userId) => hasRole(userId, [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MODERATOR, ROLES.EVENT_CREATOR]),
  canCreateEvent: (userId) => hasRole(userId, [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.EVENT_CREATOR, ROLES.MODERATOR]),
  canManageEvents: (userId) => hasRole(userId, [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.EVENT_CREATOR, ROLES.MODERATOR]),
  canModeratePosts: (userId) => hasRole(userId, [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MODERATOR]),
  canPinPost: (userId) => hasRole(userId, [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MODERATOR]),
  canLockPost: (userId) => hasRole(userId, [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MODERATOR]),
  canDeletePost: (userId) => hasRole(userId, [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MODERATOR]),
  canCreateCategory: (userId) => hasRole(userId, [ROLES.SUPERADMIN, ROLES.ADMIN]),
  canDeleteCategory: (userId) => hasRole(userId, [ROLES.SUPERADMIN, ROLES.ADMIN]),
  canEditAnyPost: (userId) => hasRole(userId, [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MODERATOR])
};
