import React, { useState, useMemo } from 'react';
import { Meteor } from 'meteor/meteor';
import { Trash2, Plus, Check, X, Shield, Users, Crown, Star, UserCheck, Search, Filter, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../../api/users/roles';
import { useToastContext } from '../../components/common/ToastProvider';
import { UserAvatar } from '../../components/common/UserAvatar';
import { AdminUserSkeleton } from '../../components/common/AdminSkeletons';

export const AdminUserManagement = ({ 
  users, 
  isLoading, 
  onRoleChange, 
  onRemoveRole, 
  onDeleteUser, 
  userHasRole,
  onApproveUser,
  onRejectUser 
}) => {
  const { getUserRoles, hasRole } = useAuth();
  const { success, error: showError } = useToastContext();
  const [loadingStates, setLoadingStates] = useState({});
  const [expandedUsers, setExpandedUsers] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [approvalFilter, setApprovalFilter] = useState('all');

  // Filter users based on search term, role filter, and approval status
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = searchTerm === '' || 
        (user.profile?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.emails?.[0]?.address || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const userRoles = getUserRoles(user._id);
      const matchesRole = roleFilter === 'all' || userRoles.includes(roleFilter);
      
      const approvalStatus = user.approvalStatus || 'approved'; // Default to approved for existing users
      const matchesApproval = approvalFilter === 'all' || approvalStatus === approvalFilter;
      
      return matchesSearch && matchesRole && matchesApproval;
    });
  }, [users, searchTerm, roleFilter, approvalFilter, getUserRoles]);

  // Enhanced role change handler with loading state and feedback
  const handleRoleChange = async (userId, newRole) => {
    const loadingKey = `${userId}-${newRole}`;
    setLoadingStates(prev => ({ ...prev, [loadingKey]: true }));
    
    try {
      await new Promise((resolve, reject) => {
        onRoleChange(userId, newRole);
        // Wait for reactivity to update
        setTimeout(() => {
          success(`Successfully added ${newRole} role`);
          resolve();
        }, 300);
      });
    } catch (error) {
      showError(`Failed to add ${newRole} role: ${error.message}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Enhanced role removal handler
  const handleRemoveRole = async (userId, role) => {
    const loadingKey = `${userId}-remove-${role}`;
    setLoadingStates(prev => ({ ...prev, [loadingKey]: true }));
    
    try {
      await new Promise((resolve, reject) => {
        onRemoveRole(userId, role);
        setTimeout(() => {
          success(`Successfully removed ${role} role`);
          resolve();
        }, 300);
      });
    } catch (error) {
      showError(`Failed to remove ${role} role: ${error.message}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Handle user approval
  const handleApproveUser = async (userId) => {
    const loadingKey = `${userId}-approve`;
    setLoadingStates(prev => ({ ...prev, [loadingKey]: true }));
    
    try {
      await new Promise((resolve, reject) => {
        if (onApproveUser) {
          onApproveUser(userId);
          setTimeout(() => {
            success('User approved successfully');
            resolve();
          }, 300);
        } else {
          reject(new Error('Approval handler not available'));
        }
      });
    } catch (error) {
      showError(`Failed to approve user: ${error.message}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Handle user rejection
  const handleRejectUser = async (userId, reason = '') => {
    const loadingKey = `${userId}-reject`;
    setLoadingStates(prev => ({ ...prev, [loadingKey]: true }));
    
    try {
      await new Promise((resolve, reject) => {
        if (onRejectUser) {
          onRejectUser(userId, reason);
          setTimeout(() => {
            success('User rejected successfully');
            resolve();
          }, 300);
        } else {
          reject(new Error('Rejection handler not available'));
        }
      });
    } catch (error) {
      showError(`Failed to reject user: ${error.message}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Check if current user can manage roles for a specific user
  const canManageUserRoles = (targetUser) => {
    const currentUserRoles = getUserRoles(Meteor.userId());
    const targetUserRoles = getUserRoles(targetUser._id);
    
    // Superadmin can manage anyone
    if (currentUserRoles.includes(ROLES.SUPERADMIN)) {
      return true;
    }
    
    // Admin can manage non-superadmins
    if (currentUserRoles.includes(ROLES.ADMIN)) {
      return !targetUserRoles.includes(ROLES.SUPERADMIN);
    }
    
    // Others can only view
    return false;
  };

  // Check if current user can assign a specific role
  const canAssignRole = (role) => {
    const currentUserRoles = getUserRoles(Meteor.userId());
    
    // Only superadmin can assign superadmin role
    if (role === ROLES.SUPERADMIN) {
      return currentUserRoles.includes(ROLES.SUPERADMIN);
    }
    
    // Superadmin and Admin can assign other roles
    if (currentUserRoles.includes(ROLES.SUPERADMIN) || currentUserRoles.includes(ROLES.ADMIN)) {
      return true;
    }
    
    return false;
  };

  // Toggle user details expansion
  const toggleUserExpansion = (userId) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  // Get role icon
  const getRoleIcon = (role) => {
    switch (role) {
      case ROLES.SUPERADMIN: return Crown;
      case ROLES.ADMIN: return Shield;
      case ROLES.MODERATOR: return Star;
      case ROLES.EVENT_CREATOR: return UserCheck;
      case ROLES.MEMBER: return Users;
      default: return Users;
    }
  };

  // Get role colors for badges
  const getRoleColors = (role) => {
    const roleColors = {
      [ROLES.SUPERADMIN]: {
        bg: 'bg-gradient-to-r from-purple-500 to-pink-500',
        text: 'text-white',
        badge: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100 border-purple-200 dark:border-purple-700'
      },
      [ROLES.ADMIN]: {
        bg: 'bg-gradient-to-r from-red-500 to-orange-500',
        text: 'text-white',
        badge: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 border-red-200 dark:border-red-700'
      },
      [ROLES.MODERATOR]: {
        bg: 'bg-gradient-to-r from-amber-500 to-yellow-500',
        text: 'text-white',
        badge: 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100 border-amber-200 dark:border-amber-700'
      },
      [ROLES.EVENT_CREATOR]: {
        bg: 'bg-gradient-to-r from-green-500 to-emerald-500',
        text: 'text-white',
        badge: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 border-green-200 dark:border-green-700'
      },
      [ROLES.MEMBER]: {
        bg: 'bg-gradient-to-r from-blue-500 to-indigo-500',
        text: 'text-white',
        badge: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 border-blue-200 dark:border-blue-700'
      }
    };
    return roleColors[role] || roleColors[ROLES.MEMBER];
  };

  // Get role colors for UserAvatar
  const getRoleColorForAvatar = (role) => {
    const roleColorMap = {
      [ROLES.SUPERADMIN]: 'purple',
      [ROLES.ADMIN]: 'red',
      [ROLES.MODERATOR]: 'slate', // Using slate for amber as it's not available in UserAvatar
      [ROLES.EVENT_CREATOR]: 'purple', // Using purple for green as it's not available
      [ROLES.MEMBER]: 'slate'
    };
    return roleColorMap[role] || 'slate';
  };

  // Get primary role for avatar display
  const getUserPrimaryRole = (userId) => {
    const roles = getUserRoles(userId);
    // Return highest priority role for avatar color
    for (const role of [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MODERATOR, ROLES.EVENT_CREATOR, ROLES.MEMBER]) {
      if (roles.includes(role)) {
        return role;
      }
    }
    return ROLES.MEMBER;
  };

  // Get approval status colors and icons
  const getApprovalStatusInfo = (user) => {
    const status = user.approvalStatus || 'approved';
    
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          text: 'Pending Approval',
          colors: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700'
        };
      case 'approved':
        return {
          icon: CheckCircle,
          text: 'Approved',
          colors: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700'
        };
      case 'rejected':
        return {
          icon: XCircle,
          text: 'Rejected',
          colors: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700'
        };
      default:
        return {
          icon: CheckCircle,
          text: 'Approved',
          colors: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700'
        };
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">User Management</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage user roles and permissions
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
            <Users className="h-4 w-4" />
            <span>{filteredUsers.length} of {users.length} users</span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search users by name, username, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value={ROLES.SUPERADMIN}>Super Admins</option>
              <option value={ROLES.ADMIN}>Admins</option>
              <option value={ROLES.MODERATOR}>Moderators</option>
              <option value={ROLES.EVENT_CREATOR}>Event Creators</option>
              <option value={ROLES.MEMBER}>Members</option>
            </select>
          </div>

          {/* Approval Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Users</option>
              <option value="approved">Approved Users</option>
              <option value="pending">Pending Approval</option>
              <option value="rejected">Rejected Users</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-6">
          {[...Array(4)].map((_, i) => <AdminUserSkeleton key={i} />)}
        </div>
      ) : (
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {filteredUsers.length > 0 ? filteredUsers.map((user) => {
            const userRoles = getUserRoles(user._id);
            const isExpanded = expandedUsers.has(user._id);
            const isCurrentUser = user._id === Meteor.userId();
            const approvalStatusInfo = getApprovalStatusInfo(user);
            
            // Debug logging
            console.log(`User ${user.username || user.profile?.name}: roles =`, userRoles);
            
            return (
              <div key={user._id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex items-start justify-between">
                  {/* User Info */}
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <UserAvatar
                        user={user}
                        size="lg"
                        showTooltip={true}
                        getRoleColor={getRoleColorForAvatar}
                        getUserRole={getUserPrimaryRole}
                        className="shadow-md"
                      />
                    </div>
                    
                    {/* User Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {user.profile?.name || user.username || 'No name'}
                        </h3>
                        {isCurrentUser && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            You
                          </span>
                        )}
                        {/* Online Status Indicator */}
                        {user.status?.online && (
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                            <span className="text-xs text-green-600 dark:text-green-400">Online</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-sm text-slate-600 dark:text-slate-400">
                        <span className="flex items-center">
                          <span className="text-slate-500 mr-1">@</span>
                          {user.username || 'no-username'}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="break-all">{user.emails?.[0]?.address || 'No email'}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</span>
                        {/* Last seen */}
                        {user.status?.lastLogin && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span className="text-xs">
                              Last seen {new Date(user.status.lastLogin.date).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Current Roles */}
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-2">
                          {userRoles.length > 0 ? userRoles.map((role) => {
                            const RoleIcon = getRoleIcon(role);
                            const roleColors = getRoleColors(role);
                            const isRemoving = loadingStates[`${user._id}-remove-${role}`];
                            const canRemove = canManageUserRoles(user) && !isCurrentUser;
                            
                            return (
                              <div
                                key={role}
                                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${roleColors.badge} ${isRemoving ? 'opacity-50' : ''}`}
                              >
                                <RoleIcon className="w-3.5 h-3.5 mr-1.5" />
                                <span>{role}</span>
                                {canRemove ? (
                                  <button
                                    onClick={() => handleRemoveRole(user._id, role)}
                                    disabled={isRemoving}
                                    className="ml-2 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:cursor-not-allowed"
                                    title={`Remove ${role} role`}
                                  >
                                    {isRemoving ? (
                                      <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                      <X className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                ) : (
                                  <div className="ml-2 w-3.5 h-3.5 flex items-center justify-center">
                                    <div className="w-1 h-1 bg-current rounded-full opacity-50"></div>
                                  </div>
                                )}
                              </div>
                            );
                          }) : (
                            <span className="text-slate-500 dark:text-slate-400 italic">No roles assigned</span>
                          )}
                        </div>
                        
                        {/* Role Management Status */}
                        {!canManageUserRoles(user) && !isCurrentUser && (
                          <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center">
                            <Shield className="w-3 h-3 mr-1" />
                            View only - insufficient permissions to modify roles
                          </div>
                        )}
                        
                        {isCurrentUser && (
                          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 flex items-center">
                            <UserCheck className="w-3 h-3 mr-1" />
                            Cannot modify your own roles
                          </div>
                        )}
                      </div>

                      {/* Expandable Role Management */}
                      <div className="mt-4">
                        {canManageUserRoles(user) && !isCurrentUser ? (
                          <>
                            <button
                              onClick={() => toggleUserExpansion(user._id)}
                              className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                            >
                              <Plus className={`w-4 h-4 mr-1 transition-transform ${isExpanded ? 'rotate-45' : ''}`} />
                              {isExpanded ? 'Hide' : 'Manage'} Roles
                            </button>
                            
                            {isExpanded && (
                              <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                  Add roles to this user:
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {[
                                    ...(hasRole(ROLES.SUPERADMIN) ? [ROLES.SUPERADMIN] : []),
                                    ROLES.ADMIN,
                                    ROLES.MODERATOR,
                                    ROLES.EVENT_CREATOR,
                                    ROLES.MEMBER
                                  ].map((role) => {
                                    const hasThisRole = userHasRole(user, role);
                                    const isAdding = loadingStates[`${user._id}-${role}`];
                                    const RoleIcon = getRoleIcon(role);
                                    const canAssign = canAssignRole(role);
                                    
                                    return (
                                      <button
                                        key={role}
                                        onClick={() => !hasThisRole && canAssign && handleRoleChange(user._id, role)}
                                        disabled={hasThisRole || isAdding || !canAssign}
                                        className={`inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                          hasThisRole
                                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 cursor-not-allowed'
                                            : !canAssign
                                            ? 'bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                                            : 'bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-500'
                                        }`}
                                        title={!canAssign ? `Insufficient permissions to assign ${role}` : ''}
                                      >
                                        <RoleIcon className="w-4 h-4 mr-2" />
                                        <span className="flex-1 text-left">{role}</span>
                                        {isAdding ? (
                                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ml-2"></div>
                                        ) : hasThisRole ? (
                                          <Check className="w-4 h-4 ml-2 text-green-600" />
                                        ) : canAssign ? (
                                          <Plus className="w-4 h-4 ml-2" />
                                        ) : (
                                          <Shield className="w-4 h-4 ml-2 opacity-50" />
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                                
                                {!hasRole(ROLES.SUPERADMIN) && (
                                  <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-700 dark:text-amber-300">
                                    <Shield className="w-3 h-3 inline mr-1" />
                                    Only Super Admins can assign Super Admin roles
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-sm text-slate-500 dark:text-slate-400 italic">
                            {isCurrentUser ? "You cannot manage your own roles" : "View-only access"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 ml-4">
                    {canManageUserRoles(user) && !isCurrentUser ? (
                      <button
                        onClick={() => onDeleteUser(user._id)}
                        className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    ) : (
                      <div className="p-2 text-slate-300 dark:text-slate-600" title={isCurrentUser ? "Cannot delete yourself" : "Insufficient permissions"}>
                        <Trash2 className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Approval Status Section */}
                <div className="mt-4">
                  {(() => {
                    const approvalInfo = getApprovalStatusInfo(user);
                    const ApprovalIcon = approvalInfo.icon;
                    const isPending = user.approvalStatus === 'pending';
                    const isApproving = loadingStates[`${user._id}-approve`];
                    const isRejecting = loadingStates[`${user._id}-reject`];
                    const canApprove = canManageUserRoles(user) && !isCurrentUser;
                    
                    return (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${approvalInfo.colors}`}>
                            <ApprovalIcon className="w-3.5 h-3.5 mr-1.5" />
                            <span>{approvalInfo.text}</span>
                          </div>
                          
                          {user.approvalStatus === 'rejected' && user.rejectionReason && (
                            <div className="text-xs text-red-600 dark:text-red-400" title={`Rejection reason: ${user.rejectionReason}`}>
                              ({user.rejectionReason.substring(0, 30)}...)
                            </div>
                          )}
                        </div>
                        
                        {/* Approval Actions */}
                        {isPending && canApprove && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleApproveUser(user._id)}
                              disabled={isApproving || isRejecting}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Approve user"
                            >
                              {isApproving ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5"></div>
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-1.5" />
                              )}
                              {isApproving ? 'Approving...' : 'Approve'}
                            </button>
                            
                            <button
                              onClick={() => {
                                const reason = prompt('Enter rejection reason (optional):') || '';
                                handleRejectUser(user._id, reason);
                              }}
                              disabled={isApproving || isRejecting}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Reject user"
                            >
                              {isRejecting ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5"></div>
                              ) : (
                                <XCircle className="w-4 h-4 mr-1.5" />
                              )}
                              {isRejecting ? 'Rejecting...' : 'Reject'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          }) : (
            <div className="p-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  No users found
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  {searchTerm || roleFilter !== 'all' 
                    ? 'No users match your current filters' 
                    : 'No users in the system'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
