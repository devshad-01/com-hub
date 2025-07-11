import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Loading indicator for infinite scroll
 * Shows at the bottom when loading more content
 */
export const InfiniteScrollLoader = ({ 
  isLoading = false, 
  hasMore = true,
  totalLoaded = 0,
  className = ""
}) => {
  if (!isLoading && !hasMore) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="inline-flex items-center space-x-2 text-warm-500 dark:text-slate-400">
          <div className="w-2 h-2 bg-warm-300 dark:bg-slate-600 rounded-full"></div>
          <span className="text-sm font-medium">
            You've reached the end • {totalLoaded} posts loaded
          </span>
          <div className="w-2 h-2 bg-warm-300 dark:bg-slate-600 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="inline-flex items-center space-x-3 text-warm-600 dark:text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Loading more posts...</span>
        </div>
      </div>
    );
  }

  return null;
};

/**
 * Progressive skeleton loader for posts as they're loading
 * Creates a staggered animation effect
 */
export const ProgressivePostsSkeleton = ({ 
  count = 3, 
  startDelay = 0,
  delayBetween = 150 
}) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="animate-slideInFromBottom opacity-0"
          style={{
            animationDelay: `${startDelay + (index * delayBetween)}ms`,
            animationFillMode: 'forwards',
            animationDuration: '500ms'
          }}
        >
          <PostSkeletonItem />
        </div>
      ))}
    </div>
  );
};

/**
 * Individual post skeleton item
 */
const PostSkeletonItem = () => (
  <div className="bg-white dark:bg-slate-800 rounded-lg border border-warm-200 dark:border-slate-700 p-6 shadow-warm">
    <div className="animate-pulse">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-warm-200 dark:bg-slate-700 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-warm-200 dark:bg-slate-700 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-warm-100 dark:bg-slate-600 rounded w-1/6"></div>
        </div>
        <div className="h-6 bg-warm-100 dark:bg-slate-600 rounded-full w-16"></div>
      </div>

      {/* Title */}
      <div className="h-6 bg-warm-200 dark:bg-slate-700 rounded w-3/4 mb-3"></div>

      {/* Content */}
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-warm-100 dark:bg-slate-600 rounded w-full"></div>
        <div className="h-4 bg-warm-100 dark:bg-slate-600 rounded w-5/6"></div>
        <div className="h-4 bg-warm-100 dark:bg-slate-600 rounded w-2/3"></div>
      </div>

      {/* Tags */}
      <div className="flex space-x-2 mb-4">
        <div className="h-6 bg-warm-100 dark:bg-slate-600 rounded-full w-16"></div>
        <div className="h-6 bg-warm-100 dark:bg-slate-600 rounded-full w-20"></div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-4">
          <div className="h-8 bg-warm-100 dark:bg-slate-600 rounded w-16"></div>
          <div className="h-8 bg-warm-100 dark:bg-slate-600 rounded w-16"></div>
        </div>
        <div className="h-4 bg-warm-100 dark:bg-slate-600 rounded w-20"></div>
      </div>
    </div>
  </div>
);

/**
 * Loading state for new posts appearing
 */
export const NewPostLoader = ({ count = 1 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }, (_, index) => (
      <div
        key={index}
        className="bg-gradient-to-r from-warm-50 to-orange-50 dark:from-slate-800 dark:to-slate-700 rounded-lg border-2 border-dashed border-warm-300 dark:border-slate-600 p-6 animate-pulse"
      >
        <div className="flex items-center justify-center space-x-3 text-warm-500 dark:text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">New post loading...</span>
        </div>
      </div>
    ))}
  </div>
);
