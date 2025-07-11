import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { MessageSquare } from 'lucide-react';
import { ForumPost } from './ForumPost';
import { InfiniteScrollLoader } from './InfiniteScrollLoader';

export const PostsList = ({ 
  posts,
  user,
  isPinned = false,
  title,
  categoryInfo,
  getCategoryColor,
  getRoleColor,
  formatTimeAgo,
  getUserRole,
  handleLikePost,
  handleLikeReply,
  toggleReply,
  replyToggles,
  replyContents,
  submittingReplies,
  handleReplyContentChange,
  handleSubmitReply,
  allReplies,
  showMoreReplies,
  toggleShowMoreReplies,
  // New infinite scroll props
  isLoadingMore = false,
  hasMore = true,
  onLoadMore,
  triggerRef,
  totalLoaded = 0,
  // Loading state to prevent showing "no posts" during initial load
  loading = false,
  // Feed view prop
  showFeedView = false
}) => {
  const [displayedPosts, setDisplayedPosts] = useState([]);
  const [animationIndex, setAnimationIndex] = useState(0);
  const [showEmptyState, setShowEmptyState] = useState(false);

  // Delay showing empty state to prevent flash during loading
  useEffect(() => {
    if (posts.length === 0 && !loading && !isPinned) {
      const timer = setTimeout(() => {
        setShowEmptyState(true);
      }, 500); // Wait 500ms before showing "no posts found"
      
      return () => clearTimeout(timer);
    } else {
      setShowEmptyState(false);
    }
  }, [posts.length, loading, isPinned]);

  // Progressively show posts with staggered animation
  useEffect(() => {
    // If we're loading, don't update displayed posts yet
    if (loading) {
      return;
    }

    if (posts.length === 0) {
      setDisplayedPosts([]);
      setAnimationIndex(0);
      return;
    }

    // Filter out any undefined or invalid posts
    const validPosts = posts.filter(post => post && post._id);

    // If this is a fresh load (not infinite scroll), show all posts immediately
    if (validPosts.length <= displayedPosts.length || isPinned) {
      setDisplayedPosts(validPosts);
      return;
    }

    // For infinite scroll, animate new posts in progressively
    const newPosts = validPosts.slice(displayedPosts.length);
    let currentIndex = 0;

    const showNextPost = () => {
      if (currentIndex < newPosts.length) {
        setDisplayedPosts(prev => [...prev, newPosts[currentIndex]]);
        setAnimationIndex(prev => prev + 1);
        currentIndex++;
        setTimeout(showNextPost, 150); // Stagger by 150ms
      }
    };

    // Start showing new posts after a brief delay
    setTimeout(showNextPost, 100);
  }, [posts, isPinned, loading]);

  // Don't render anything for empty pinned posts (no need to show empty pinned section)
  if (posts.length === 0 && isPinned) return null;
  
  // Only show "no posts found" after delay to prevent flash during loading
  if (posts.length === 0 && !isPinned && showEmptyState) {
    return (
      <div className="text-center py-12 animate-fadeIn">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-warm-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-warm-500 dark:text-orange-400" />
          </div>
          <h3 className="text-xl font-semibold text-warm-900 dark:text-white mb-2">
            No posts found
          </h3>
          <p className="text-warm-600 dark:text-slate-400 mb-4">
            Try adjusting your search or filter criteria, or scroll up to create a new post
          </p>
        </div>
      </div>
    );
  }

  // While posts are empty and we haven't shown empty state yet, don't render anything
  if (posts.length === 0) return null;

  return (
    <div className={isPinned ? "mb-6" : "space-y-4"}>
      {title && (
        <h2 className="text-xl font-semibold text-warm-900 dark:text-white mb-4 flex items-center">
          {title}
        </h2>
      )}
      
      <div className="space-y-4">
        {displayedPosts
          .filter(post => post && post._id) // Extra safety check
          .map((post, index) => (
          <div
            key={`${isPinned ? 'pinned' : 'regular'}-${post._id}`} // Ensure unique keys
            className="animate-slideInFromBottom opacity-0"
            style={{
              animationDelay: isPinned ? '0ms' : `${index * 150}ms`,
              animationFillMode: 'forwards',
              animationDuration: '500ms'
            }}
          >
            <ForumPost
              post={post}
              user={user}
              isPinned={isPinned}
              getCategoryInfo={categoryInfo}
              getCategoryColor={getCategoryColor}
              getRoleColor={getRoleColor}
              formatTimeAgo={formatTimeAgo}
              getUserRole={getUserRole}
              handleLikePost={handleLikePost}
              handleLikeReply={handleLikeReply}
              toggleReply={toggleReply}
              replyToggles={replyToggles}
              replyContents={replyContents}
              submittingReplies={submittingReplies}
              handleReplyContentChange={handleReplyContentChange}
              handleSubmitReply={handleSubmitReply}
              allReplies={allReplies}
              showMoreReplies={showMoreReplies}
              toggleShowMoreReplies={toggleShowMoreReplies}
              showFeedView={showFeedView}
            />
          </div>
        ))}
      </div>

      {/* Infinite scroll trigger and loader for non-pinned posts */}
      {!isPinned && (
        <>
          {/* Invisible trigger element for intersection observer */}
          <div ref={triggerRef} className="h-1" />
          
          {/* Loading indicator */}
          <InfiniteScrollLoader
            isLoading={isLoadingMore}
            hasMore={hasMore}
            totalLoaded={totalLoaded}
            className="mt-6"
          />
        </>
      )}
    </div>
  );
};
