import React from 'react';
import { Meteor } from 'meteor/meteor';

/**
 * UserAvatar component with role-based color coding
 * Displays user avatar image with colored outline, or colored initial if no avatar
 */
export const UserAvatar = ({ 
  userId, 
  user,
  size = 'md', 
  showTooltip = false,
  className = '',
  getRoleColor,
  getUserRole
}) => {
  // Use provided user object or fetch from userId
  const userData = user || (userId ? Meteor.users.findOne(userId) : null);
  
  if (!userData && !userId) return null;

  // Get user details
  const userName = userData?.profile?.name || userData?.username || 'Unknown User';
  // Support both string and object for avatar
  const userAvatar = typeof userData?.profile?.avatar === 'string'
    ? userData?.profile?.avatar
    : userData?.profile?.avatar?.url;
  const userRole = getUserRole ? getUserRole(userData?._id || userId) : (userData?.profile?.role || 'member');
  const roleColor = getRoleColor ? getRoleColor(userRole) : 'purple';
  
  // Get user initial
  const getUserInitial = () => {
    if (userData?.profile?.name) {
      return userData.profile.name.charAt(0).toUpperCase();
    }
    if (userData?.username) {
      return userData.username.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Size configurations
  const sizeConfig = {
    xs: {
      container: 'w-6 h-6',
      text: 'text-xs',
      border: 'border-2'
    },
    sm: {
      container: 'w-8 h-8',
      text: 'text-xs',
      border: 'border-2'
    },
    md: {
      container: 'w-10 h-10',
      text: 'text-sm',
      border: 'border-2'
    },
    lg: {
      container: 'w-12 h-12',
      text: 'text-base',
      border: 'border-3'
    },
    xl: {
      container: 'w-16 h-16',
      text: 'text-lg',
      border: 'border-4'
    },
    '2xl': {
      container: 'w-20 h-20',
      text: 'text-xl',
      border: 'border-4'
    }
  };

  const config = sizeConfig[size] || sizeConfig.md;

  // Role-based color classes for borders and backgrounds
  const getRoleColorClasses = (color) => {
    const colorMap = {
      red: {
        border: 'border-red-400 dark:border-red-500',
        bg: 'from-red-500 to-red-600 dark:from-red-400 dark:to-red-500',
        ring: 'ring-red-200 dark:ring-red-800'
      },
      purple: {
        border: 'border-purple-400 dark:border-purple-500',
        bg: 'from-purple-500 to-purple-600 dark:from-purple-400 dark:to-purple-500',
        ring: 'ring-purple-200 dark:ring-purple-800'
      },
      slate: {
        border: 'border-slate-400 dark:border-slate-500',
        bg: 'from-slate-500 to-slate-600 dark:from-slate-400 dark:to-slate-500',
        ring: 'ring-slate-200 dark:ring-slate-800'
      }
    };
    
    return colorMap[color] || colorMap.purple;
  };

  const colorClasses = getRoleColorClasses(roleColor);

  const containerClasses = `
    relative inline-block ${config.container} rounded-full 
    ${config.border} ${colorClasses.border} 
    ring-2 ${colorClasses.ring}
    transition-all duration-200 hover:ring-4 
    ${className}
  `.trim();

  const avatarElement = userAvatar ? (
    // User has uploaded avatar
    <img
      src={userAvatar}
      alt={userName}
      className={`${config.container} rounded-full object-cover`}
      title={showTooltip ? `${userName} (${userRole})` : undefined}
    />
  ) : (
    // Fallback to colored initial
    <div 
      className={`
        ${config.container} rounded-full 
        bg-gradient-to-br ${colorClasses.bg}
        flex items-center justify-center 
        text-white font-semibold ${config.text}
      `}
      title={showTooltip ? `${userName} (${userRole})` : undefined}
    >
      {getUserInitial()}
    </div>
  );

  return (
    <div className={containerClasses}>
      {avatarElement}
      
      {/* Optional role indicator dot */}
      {userRole === 'admin' && (
        <div className={`
          absolute -top-1 -right-1 w-3 h-3 rounded-full 
          bg-gradient-to-br ${colorClasses.bg}
          border-2 border-white dark:border-slate-800
          ${size === 'xs' || size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'}
        `} />
      )}
    </div>
  );
};

// Default export for easier importing
export default UserAvatar;
