import { Loader2 } from 'lucide-react';
import React from 'react';

export const AdminUserSkeleton = () => (
  <div className="p-6 animate-pulse">
    <div className="flex items-start space-x-4">
      <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-700" />
      <div className="flex-1 space-y-3">
        <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-3 w-1/4 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="flex space-x-2 mt-2">
          <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
          <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
        </div>
      </div>
    </div>
  </div>
);

export const AdminStatsSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 animate-pulse">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-slate-200 dark:border-slate-700 flex flex-col items-start">
        <div className="flex items-center mb-4">
          <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full mr-4" />
          <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
        <div className="h-6 w-1/2 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
        <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    ))}
  </div>
);

export const AdminDashboardSpinner = () => (
  <div className="flex flex-col items-center justify-center py-16">
    <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
    <span className="text-lg text-slate-600 dark:text-slate-300 font-medium">Loading dashboard...</span>
  </div>
);
