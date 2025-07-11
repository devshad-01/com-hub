// imports/ui/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';
import { ROLES } from '../../api/users/roles';
import { ClientSecurity } from '../utils/security';
import { sessionManager } from '../../utils/sessionManager';

// Create the context with default values
const AuthContext = createContext({
  user: null,
  userId: null,
  isLoggedIn: false,
  isLoading: true,
  roles: [],
  permissions: [],
  securityStatus: null,
  sessionValid: true,
  sessionInfo: null,
  checkPermission: () => false,
  checkRole: () => false,
  hasRole: () => false,
  updateSecurityStatus: () => {},
  checkSessionValidity: () => {},
  can: {},
  isAdmin: false,
  isModerator: false,
  isEventCreator: false
});

// Create the provider component
export const AuthProvider = ({ children }) => {
  const [securityStatus, setSecurityStatus] = useState(null);
  const [sessionValid, setSessionValid] = useState(true);
  const [sessionInfo, setSessionInfo] = useState(null);

  const { user, userId, isLoggedIn, isLoading } = useTracker(() => {
    const user = Meteor.user();
    const userId = Meteor.userId();
    const isLoading = Meteor.loggingIn();
    
    // Subscribe to roles data
    Meteor.subscribe('roles'); // Current user's roles
    Meteor.subscribe('publicRoles'); // All users' roles for forum badges
    
    return {
      user,
      userId,
      isLoggedIn: !!userId,
      isLoading
    };
  }, []);

  // Initialize session manager and load session info
  useEffect(() => {
    if (userId) {
      loadSessionInfo();
    }
  }, [userId]);

  const loadSessionInfo = async () => {
    try {
      const info = await sessionManager.getSessionInfo();
      setSessionInfo(info);
    } catch (error) {
      console.warn('Failed to load session info:', error);
    }
  };

  // Check session validity when user changes
  useEffect(() => {
    if (userId) {
      const valid = ClientSecurity.isSessionValid();
      setSessionValid(valid);
      
      // Get security status
      ClientSecurity.getSecurityStatus()
        .then(status => setSecurityStatus(status))
        .catch(error => console.error('Failed to get security status:', error));
    } else {
      setSecurityStatus(null);
      setSessionValid(true);
    }
  }, [userId]);

  // For client-side role checks, we will use the non-async methods
  // or reactive data sources when possible
  
  // Check if user has a specific role - use the reactive data sources
  const hasRole = (role, options = {}) => {
    if (!userId) return false;
    
    // Handle both single role and array of roles
    const rolesToCheck = Array.isArray(role) ? role : [role];
    
    // On the client, check for role assignments that have been published
    if (Meteor.isClient) {
      // Use Roles.userIsInRole which is the proper way to check roles on client
      return Roles.userIsInRole(userId, rolesToCheck, options.group);
    } else {
      // On the server, we can use the synchronous method
      return Roles.userIsInRole(userId, rolesToCheck, options.group);
    }
  };

  // Get user's roles
  const getUserRoles = (targetUserId = null) => {
    const id = targetUserId || userId;
    if (!id) return [];
    
    try {
      // Use Roles.getRolesForUser which works on both client and server
      const roles = Roles.getRolesForUser(id);
      return roles || [];
    } catch (e) {
      console.error('Error getting roles for user:', e);
      return [];
    }
  };

  // Get primary role with priority
  const getUserPrimaryRole = (targetUserId = null) => {
    const roles = getUserRoles(targetUserId);
    
    // Priority order: superadmin > admin > moderator > event-creator > member
    if (roles.includes(ROLES.SUPERADMIN)) return ROLES.SUPERADMIN;
    if (roles.includes(ROLES.ADMIN)) return ROLES.ADMIN;
    if (roles.includes(ROLES.MODERATOR)) return ROLES.MODERATOR;
    if (roles.includes(ROLES.EVENT_CREATOR)) return ROLES.EVENT_CREATOR;
    return ROLES.MEMBER;
  };

  // Common permission checks - explicit about what each role can do
  const can = {
    // Superadmin-only permissions
    manageAdmins: () => hasRole(ROLES.SUPERADMIN),
    
    // Superadmin + Admin permissions
    accessAdminDashboard: () => hasRole([ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MODERATOR, ROLES.EVENT_CREATOR]),
    deleteUsers: () => hasRole([ROLES.SUPERADMIN, ROLES.ADMIN]),
    createCategory: () => hasRole([ROLES.SUPERADMIN, ROLES.ADMIN]),
    updateUserRoles: () => hasRole([ROLES.SUPERADMIN, ROLES.ADMIN]),
    updateSettings: () => hasRole([ROLES.SUPERADMIN, ROLES.ADMIN]),
    manageUsers: () => hasRole([ROLES.SUPERADMIN, ROLES.ADMIN]),
    
    // Superadmin + Admin + Moderator permissions
    moderatePosts: () => hasRole([ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MODERATOR]),
    pinPost: () => hasRole([ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MODERATOR]),
    lockThread: () => hasRole([ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MODERATOR]),
    deletePost: () => hasRole([ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MODERATOR]),
    postInLockedThread: () => hasRole([ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MODERATOR]),
    
    // Superadmin + Admin + Moderator + Event Creator permissions
    createEvent: () => hasRole([ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MODERATOR, ROLES.EVENT_CREATOR]),
    manageEvents: () => hasRole([ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MODERATOR, ROLES.EVENT_CREATOR]),
    
    // Basic permissions everyone has
    updateOwnProfile: () => !!userId, // Anyone logged in
    participateInForums: () => !!userId, // Anyone logged in
    useChat: () => !!userId, // Anyone logged in
  };

  // Get role color for UI
  const getRoleColor = (role) => {
    const colors = {
      [ROLES.SUPERADMIN]: 'purple',
      [ROLES.ADMIN]: 'red',
      [ROLES.MODERATOR]: 'amber',
      [ROLES.EVENT_CREATOR]: 'green',
      [ROLES.MEMBER]: 'blue',
    };
    return colors[role] || 'blue';
  };

  // Security-related methods
  const changePassword = async (oldPassword, newPassword, confirmPassword) => {
    try {
      return await ClientSecurity.changePassword(oldPassword, newPassword, confirmPassword);
    } catch (error) {
      throw error;
    }
  };

  const logoutAllSessions = async () => {
    try {
      return await ClientSecurity.logoutAllSessions();
    } catch (error) {
      throw error;
    }
  };

  const resendVerificationEmail = async () => {
    try {
      return await ClientSecurity.resendVerificationEmail();
    } catch (error) {
      throw error;
    }
  };

  const refreshSecurityStatus = async () => {
    if (userId) {
      try {
        const status = await ClientSecurity.getSecurityStatus();
        setSecurityStatus(status);
        return status;
      } catch (error) {
        console.error('Failed to refresh security status:', error);
        throw error;
      }
    }
  };

  // Session management methods
  const enableRememberMe = async () => {
    try {
      const success = await sessionManager.enableRememberMe();
      if (success) {
        await loadSessionInfo();
      }
      return success;
    } catch (error) {
      console.error('Failed to enable remember me:', error);
      return false;
    }
  };

  const disableRememberMe = async () => {
    try {
      const success = await sessionManager.disableRememberMe();
      if (success) {
        await loadSessionInfo();
      }
      return success;
    } catch (error) {
      console.error('Failed to disable remember me:', error);
      return false;
    }
  };

  const getSessionTimeRemaining = () => {
    return sessionManager.getTimeUntilExpiry();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userId,
        isLoggedIn,
        isLoading,
        sessionValid,
        sessionInfo,
        securityStatus,
        hasRole,
        getUserRoles,
        getUserPrimaryRole,
        getRoleColor,
        can,
        // Security methods
        changePassword,
        logoutAllSessions,
        resendVerificationEmail,
        refreshSecurityStatus,
        // Session management
        enableRememberMe,
        disableRememberMe,
        getSessionTimeRemaining,
        loadSessionInfo,
        // Role shortcuts
        isAdmin: hasRole(ROLES.ADMIN),
        isModerator: hasRole(ROLES.MODERATOR),
        isEventCreator: hasRole(ROLES.EVENT_CREATOR),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
