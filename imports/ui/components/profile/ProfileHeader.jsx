import React from 'react';
import { Check, X } from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';

export const ProfileHeader = ({
  user,
  getUserRole,
  getRoleColor
}) => {
  // Helper to get display name
  const displayName = user?.profile?.name || user?.username || 'User Profile';
  const username = user?.username || 'username';
  const memberSince =
    user?.createdAt
      ? new Date(user.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short'
        })
      : 'Unknown';

  // Email verification status
  const isVerified = user?.emails?.[0]?.verified;

  // Professional color palette
  const cardBg = 'bg-white dark:bg-slate-900';
  const border = 'border border-slate-200 dark:border-slate-800';
  const sectionTitle = 'text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white';
  const subtitle = 'text-slate-600 dark:text-slate-400 mt-1 font-medium text-sm sm:text-base';
  const secondary = 'text-slate-500 dark:text-slate-400 mt-2 text-xs sm:text-sm';
  const statText = 'font-medium text-slate-900 dark:text-white mr-1';

  // Status badge
  const badge = isVerified
    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
    : 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200';

  return (
    <div className="mb-6">
      <div className={`${cardBg} ${border} rounded-xl shadow-md p-5 sm:p-8`}>
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <UserAvatar
              userId={user?._id}
              user={user}
              size="2xl"
              showTooltip={false}
              getRoleColor={getRoleColor}
              getUserRole={getUserRole}
              className="shadow-lg"
            />
          </div>

          {/* Info Section */}
          <div className="flex-1 w-full">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
              <div className="text-center sm:text-left">
                <h1 className={sectionTitle}>{displayName}</h1>
                <p className={subtitle}>@{username}</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
                  {user?.emails?.[0]?.address || 'No email set'}
                </p>
              </div>
              <div
                className={`flex items-center px-3 py-2 rounded-lg ${badge} shadow-sm flex-shrink-0`}
              >
                {isVerified ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <X className="w-4 h-4 mr-2" />
                )}
                <span className="text-sm font-semibold">
                  {isVerified ? 'Verified' : 'Unverified'}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 mt-4 pt-4">
              <p className={`${secondary} mb-4 text-center sm:text-left`}>
                Manage your account settings and personal information
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-x-6 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
                <span className="flex items-center">
                  <span
                    className={statText}
                    style={{
                      color: getRoleColor
                        ? getRoleColor(getUserRole(user?._id))
                        : undefined
                    }}
                  >
                    {getUserRole(user?._id)}
                  </span>
                </span>
                <span className="hidden sm:inline text-slate-400 dark:text-slate-600">
                  •
                </span>
                <span className="text-center">Member since {memberSince}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};