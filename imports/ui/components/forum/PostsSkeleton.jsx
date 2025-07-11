import React from 'react';

export const PostsSkeleton = ({ count = 3, isPinned = false }) => {
  const skeletons = Array.from({ length: count }, (_, index) => (
    <div 
      key={index}
      className={`${isPinned 
        ? "bg-gradient-to-r from-warm-50 to-orange-50 dark:from-warm-900/20 dark:to-orange-900/20 border border-warm-200 dark:border-orange-800" 
        : "bg-white dark:bg-slate-800 border border-warm-200 dark:border-slate-700"
      } rounded-xl p-6 animate-pulse animate-slideInUp`}
      style={{ 
        animationDelay: `${index * 150}ms`,
        animationFillMode: 'both'
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-warm-200 dark:bg-slate-600 rounded-full animate-skeleton-pulse"></div>
          <div className="space-y-2">
            <div className="h-4 bg-warm-200 dark:bg-slate-600 rounded w-32 animate-skeleton-pulse"></div>
            <div className="h-3 bg-warm-200 dark:bg-slate-600 rounded w-24 animate-skeleton-pulse"></div>
          </div>
        </div>
        <div className="h-6 bg-warm-200 dark:bg-slate-600 rounded-full w-20 animate-skeleton-pulse"></div>
      </div>

      {/* Title */}
      <div className="mb-3">
        <div className="h-6 bg-warm-200 dark:bg-slate-600 rounded w-3/4 mb-2 animate-skeleton-pulse"></div>
      </div>

      {/* Content */}
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-warm-200 dark:bg-slate-600 rounded w-full animate-skeleton-pulse"></div>
        <div className="h-4 bg-warm-200 dark:bg-slate-600 rounded w-5/6 animate-skeleton-pulse"></div>
        <div className="h-4 bg-warm-200 dark:bg-slate-600 rounded w-4/6 animate-skeleton-pulse"></div>
      </div>

      {/* Tags */}
      <div className="flex space-x-2 mb-4">
        <div className="h-6 bg-warm-200 dark:bg-slate-600 rounded-full w-16 animate-skeleton-pulse"></div>
        <div className="h-6 bg-warm-200 dark:bg-slate-600 rounded-full w-20 animate-skeleton-pulse"></div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="h-4 bg-warm-200 dark:bg-slate-600 rounded w-16 animate-skeleton-pulse"></div>
          <div className="h-4 bg-warm-200 dark:bg-slate-600 rounded w-12 animate-skeleton-pulse"></div>
          <div className="h-4 bg-warm-200 dark:bg-slate-600 rounded w-14 animate-skeleton-pulse"></div>
        </div>
        <div className="h-8 bg-warm-200 dark:bg-slate-600 rounded w-20 animate-skeleton-pulse"></div>
      </div>
    </div>
  ));

  return (
    <div className={isPinned ? "mb-6" : "space-y-4"}>
      {isPinned && (
        <div className="mb-4">
          <div className="h-6 bg-warm-200 dark:bg-slate-600 rounded w-32 animate-pulse"></div>
        </div>
      )}
      <div className="space-y-4">
        {skeletons}
      </div>
    </div>
  );
};
