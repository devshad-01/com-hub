import React from 'react';

export const AdminQuickActions = ({ onNavigate }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-6">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button 
          onClick={() => onNavigate('users')}
          className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium text-center hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
        >
          Manage Users
        </button>
        <button 
          onClick={() => onNavigate('events')}
          className="p-4 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium text-center hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
        >
          Add New Event
        </button>
        <button 
          onClick={() => onNavigate('forumCategories')}
          className="p-4 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-lg text-sm font-medium text-center hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
        >
          Manage Forums
        </button>
      </div>
    </div>
  );
};
