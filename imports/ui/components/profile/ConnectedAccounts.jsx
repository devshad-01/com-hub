import React from 'react';

export const ConnectedAccounts = ({ user }) => {
  // Don't render if no connected accounts
  if (!user?.services?.google && !user?.services?.facebook && !user?.services?.github) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
          Connected Accounts
        </h3>
      </div>
      
      <div className="p-4 sm:p-6 space-y-3">
        {user?.services?.google && (
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
            <div className="flex items-center min-w-0 flex-1">
              <div className="w-6 h-6 bg-red-500 rounded-full mr-3 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">G</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">Google</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{user.services.google.email}</p>
              </div>
            </div>
            <span className="text-xs text-green-600 dark:text-green-400 font-medium bg-green-100 dark:bg-green-900 px-2 py-1 rounded flex-shrink-0 ml-2">
              Connected
            </span>
          </div>
        )}
        
        {user?.services?.facebook && (
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
            <div className="flex items-center min-w-0 flex-1">
              <div className="w-6 h-6 bg-blue-600 rounded-full mr-3 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">f</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">Facebook</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{user.services.facebook.name}</p>
              </div>
            </div>
            <span className="text-xs text-green-600 dark:text-green-400 font-medium bg-green-100 dark:bg-green-900 px-2 py-1 rounded flex-shrink-0 ml-2">
              Connected
            </span>
          </div>
        )}
        
        {user?.services?.github && (
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
            <div className="flex items-center min-w-0 flex-1">
              <div className="w-6 h-6 bg-gray-800 rounded-full mr-3 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">GH</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">GitHub</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{user.services.github.username}</p>
              </div>
            </div>
            <span className="text-xs text-green-600 dark:text-green-400 font-medium bg-green-100 dark:bg-green-900 px-2 py-1 rounded flex-shrink-0 ml-2">
              Connected
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
