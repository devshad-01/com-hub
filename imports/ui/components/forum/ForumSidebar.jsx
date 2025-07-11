import React, { memo } from 'react';
import { Users } from 'lucide-react';
import { Meteor } from 'meteor/meteor';
import { UserAvatar } from '../common/UserAvatar';

export const ForumSidebar = memo(({ 
  categories, 
  selectedCategory, 
  onCategoryChange, 
  loading
}) => {
  // Get online users from Meteor.users
  const onlineUsers = Meteor.users.find({ 'status.online': true }, { fields: { username: 1, 'profile.name': 1, 'profile.avatar': 1 } }).fetch();

  return (
    <div className="space-y-4 lg:space-y-6 animate-slideInLeft">
      {/* Categories - Desktop Only (Mobile categories are now in header) */}
      <div className="hidden lg:block bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-warm-200 dark:border-slate-700 transition-smooth">
        {/* Desktop: Always Visible Header */}
        <div className="p-6 pb-4">
          <h3 className="text-lg font-semibold text-warm-900 dark:text-white">
            Posts Categories
          </h3>
        </div>

        {/* Categories Content - Desktop Only */}
        <div className="px-6 pb-6">
          {/* Desktop: Vertical List */}
          <div className="space-y-2">
            {loading ? (
              Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-12 bg-warm-200 dark:bg-slate-600 rounded-lg"></div>
                </div>
              ))
            ) : (
              categories.map(category => (
                <button
                  key={category._id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onCategoryChange(category._id);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] cursor-pointer ${
                    selectedCategory === category._id
                      ? 'bg-warm-50 dark:bg-orange-900/20 text-warm-700 dark:text-orange-300 shadow-sm'
                      : 'text-warm-600 dark:text-slate-400 hover:bg-warm-25 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span>{category.icon}</span>
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                  <span className="text-xs bg-warm-100 dark:bg-slate-700 text-warm-700 dark:text-slate-300 px-2 py-1 rounded-full">
                    {category.postCount || 0}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Online Members - Hidden on Mobile */}
      <div className="hidden lg:block bg-white dark:bg-slate-800 rounded-xl shadow-warm border border-warm-200 dark:border-slate-700 transition-smooth">
        {/* Desktop: Always Visible Header */}
        <div className="p-6 pb-4">
          <h3 className="text-lg font-semibold text-warm-900 dark:text-white flex items-center">
            <Users className="w-4 h-4 mr-2 text-green-500" />
            Online Now
          </h3>
        </div>

        {/* Online Members Content - Desktop Only */}
        <div className="px-6 pb-6">
          <div className="space-y-3">
            {onlineUsers.length === 0 ? (
              <div className="text-sm text-slate-400">No members online</div>
            ) : (
              onlineUsers.map(user => (
                <div key={user._id} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <UserAvatar user={user} size="xs" />
                  <span className="text-sm text-warm-600 dark:text-slate-400">
                    {user.profile?.name || user.username || 'User'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
