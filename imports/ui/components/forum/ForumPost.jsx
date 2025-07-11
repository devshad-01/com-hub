import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Meteor } from 'meteor/meteor';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Heart, Shield, Crown, Star, UserCheck, Zap, MoreHorizontal, Trash2, Edit, Pin } from 'lucide-react';
import { PostImages } from './PostImages';
import { PostReplies } from './PostReplies';
import { InlineReplyBox } from './InlineReplyBox';
import { UserAvatar } from '../common/UserAvatar';
import { ROLES } from '../../../api/users/roles';
import { useToastContext } from '../common/ToastProvider';

export const ForumPost = ({ 
  post,
  user,
  isPinned = false,
  getCategoryInfo,
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
  showFeedView = false // New prop to control feed vs detail view
}) => {
  const { success, error: showError } = useToastContext();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef(null);
  
  // Get the top comment (most liked) for feed view
  const topComment = useMemo(() => {
    if (!showFeedView || !allReplies || allReplies.length === 0) return null;
    
    const postReplies = allReplies.filter(reply => reply.postId === post._id);
    if (postReplies.length === 0) return null;
    
    // Sort by likes count (descending) and get the first one
    const sortedReplies = postReplies.sort((a, b) => {
      const aLikes = (a.likes || []).length;
      const bLikes = (b.likes || []).length;
      return bLikes - aLikes;
    });
    
    return sortedReplies[0];
  }, [showFeedView, allReplies, post._id]);
  
  // Handle post click to navigate to detail page
  const handleContentClick = (e) => {
    // Don't navigate if clicking on interactive elements
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('[role="button"]')) {
      return;
    }
    if (showFeedView) {
      // Prevent scroll jump by using replace and disabling scroll restoration
      navigate(`/forum/post/${post._id}`, { replace: false, state: { preventScroll: true } });
    }
  };
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);
  
  // Calculate author info
  const authorUser = Meteor.users.findOne(post.authorId);
  const authorName = authorUser?.profile?.name || authorUser?.username || 'Unknown User';
  const authorRole = getUserRole(post.authorId);
  const categoryData = getCategoryInfo(post.categoryId);
  
  // Enhanced role badge logic - only show for privileged users
  const shouldShowRoleBadge = (role) => {
    return role && role !== ROLES.MEMBER;
  };
  
  // Get role icon
  const getRoleIcon = (role) => {
    switch (role) {
      case ROLES.SUPERADMIN: return Crown;
      case ROLES.ADMIN: return Shield;
      case ROLES.MODERATOR: return Star;
      case ROLES.EVENT_CREATOR: return UserCheck;
      default: return null;
    }
  };
  
  // Get simplified role display - show "Admin" for all privileged roles
  const getRoleDisplay = (role) => {
    // If it's a privileged role, show "Admin"
    if (role === ROLES.SUPERADMIN || role === ROLES.ADMIN || role === ROLES.MODERATOR || role === ROLES.EVENT_CREATOR) {
      return 'Admin';
    }
    // For members, return "Member" (though we might not show this badge)
    return 'Member';
  };
  
  // Check if user can delete this post
  const canDeletePost = () => {
    if (!user) return false;
    
    // User can delete their own posts
    if (post.authorId === user._id) return true;
    
    // Admins and moderators can delete any posts
    const userRole = getUserRole(user._id);
    return userRole === ROLES.SUPERADMIN || userRole === ROLES.ADMIN || userRole === ROLES.MODERATOR;
  };
  
  // Check if user can unpin this post
  const canUnpinPost = () => {
    if (!user || !post.pinned) return false;
    
    // Only moderators can pin/unpin posts
    const userRole = getUserRole(user._id);
    return userRole === ROLES.SUPERADMIN || userRole === ROLES.ADMIN || userRole === ROLES.MODERATOR;
  };
  
  // Show menu if user can delete OR unpin
  const canShowMenu = () => {
    return canDeletePost() || canUnpinPost();
  };
  
  // Handle post deletion
  const handleDeletePost = async () => {
    if (!canDeletePost()) return;
    
    const confirmDelete = window.confirm('Are you sure you want to delete this post? This action cannot be undone.');
    if (!confirmDelete) return;
    
    setIsDeleting(true);
    try {
      await Meteor.callAsync('forums.posts.delete', post._id);
      success('Post deleted successfully');
      // The post will disappear from the UI automatically due to reactivity
    } catch (error) {
      console.error('Error deleting post:', error);
      showError('Failed to delete post: ' + (error.reason || error.message));
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };
  
  // Handle post unpinning
  const handleUnpinPost = async () => {
    if (!canUnpinPost()) return;
    
    const confirmUnpin = window.confirm('Are you sure you want to unpin this post?');
    if (!confirmUnpin) return;
    
    setIsDeleting(true); // Reuse the same loading state
    try {
      await Meteor.callAsync('forums.posts.update', post._id, { pinned: false });
      success('Post unpinned successfully');
      // The post will move from pinned to regular posts automatically due to reactivity
    } catch (error) {
      console.error('Error unpinning post:', error);
      showError('Failed to unpin post: ' + (error.reason || error.message));
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };
  
  // Content truncation logic
  const MOBILE_CHAR_LIMIT = 200;
  const DESKTOP_CHAR_LIMIT = 400;
  
  const shouldTruncateMobile = post.content && post.content.length > MOBILE_CHAR_LIMIT;
  const shouldTruncateDesktop = post.content && post.content.length > DESKTOP_CHAR_LIMIT;
  
  const getMobileContent = () => {
    if (shouldTruncateMobile && !isExpanded) {
      return post.content.substring(0, MOBILE_CHAR_LIMIT).trim() + '...';
    }
    return post.content;
  };
  
  const getDesktopContent = () => {
    if (shouldTruncateDesktop && !isExpanded) {
      return post.content.substring(0, DESKTOP_CHAR_LIMIT).trim() + '...';
    }
    return post.content;
  };
  const baseClasses = isPinned 
    ? "bg-gradient-to-r from-warm-50 to-orange-50 dark:from-warm-900/20 dark:to-orange-900/20 border border-warm-200 dark:border-orange-800 rounded-xl p-3 sm:p-6 hover:shadow-warm transition-all duration-300 ease-in-out will-change-transform"
    : "bg-white dark:bg-slate-800 rounded-xl shadow-warm hover:shadow-warm-lg border border-warm-200 dark:border-slate-700 p-3 sm:p-6 transition-all duration-300 ease-in-out group will-change-transform";

  return (
    <div className={baseClasses}>
      {/* Clickable content area (header, content, images) */}
      <div onClick={handleContentClick} style={{ cursor: showFeedView ? 'pointer' : 'default' }}>
        {/* Header - Mobile-first responsive design */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
          <div className="flex items-start space-x-3 min-w-0 flex-1">
            <UserAvatar 
              user={authorUser}
              size="md"
              showTooltip={true}
              getRoleColor={getRoleColor}
              getUserRole={getUserRole}
              className="flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h3 className={`text-base sm:text-lg font-semibold text-warm-900 dark:text-white transition-colors duration-200 leading-tight break-words ${
                isPinned 
                  ? 'hover:text-warm-600 dark:hover:text-orange-400'
                  : 'group-hover:text-warm-600 dark:group-hover:text-orange-400'
              }`}>
                {post.title}
              </h3>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-warm-600 dark:text-slate-400 mt-1">
                <span className="truncate max-w-[120px] sm:max-w-none">{authorName}</span>
                
                {/* Enhanced Role Badge - Only show for privileged users */}
                {shouldShowRoleBadge(authorRole) && (
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border transition-all duration-200 bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700 shadow-sm`}>
                    <Shield className="w-3 h-3 mr-1" />
                    {getRoleDisplay(authorRole)}
                  </span>
                )}
                
                <span className="hidden sm:inline">•</span>
                <span className="text-xs">{formatTimeAgo(post.createdAt)}</span>
              </div>
            </div>
          </div>
          
          {/* Category badge and menu - responsive positioning */}
          <div className="flex items-center gap-2 self-start flex-shrink-0">
            <span className={`inline-flex items-center px-2 sm:px-2.5 py-1 sm:py-0.5 rounded-full text-xs font-medium bg-${getCategoryColor(post.categoryId)}-100 dark:bg-${getCategoryColor(post.categoryId)}-900/20 text-${getCategoryColor(post.categoryId)}-800 dark:text-${getCategoryColor(post.categoryId)}-300 whitespace-nowrap`}>
              <span className="mr-1">{categoryData.icon}</span>
              <span>{categoryData.name}</span>
            </span>
            
            {/* Three-dot menu */}
            {canShowMenu() && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  title="Post options"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                
                {/* Dropdown menu */}
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 z-10">
                    <div className="py-1">
                      {/* Unpin option - only show for pinned posts and moderators */}
                      {canUnpinPost() && (
                        <button
                          onClick={handleUnpinPost}
                          disabled={isDeleting}
                          className="w-full px-4 py-2 text-left text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 flex items-center transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isDeleting ? (
                            <>
                              <div className="w-4 h-4 mr-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                              Unpinning...
                            </>
                          ) : (
                            <>
                              <Pin className="w-4 h-4 mr-3" />
                              Unpin post
                            </>
                          )}
                        </button>
                      )}
                      
                      {/* Delete option */}
                      {canDeletePost() && (
                        <button
                          onClick={handleDeletePost}
                          disabled={isDeleting}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isDeleting ? (
                            <>
                              <div className="w-4 h-4 mr-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4 mr-3" />
                              Delete post
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="mb-4">
          {/* Mobile content */}
          <p className="sm:hidden text-warm-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-sm break-words">
            {getMobileContent()}
          </p>
          {/* Desktop content */}
          <p className="hidden sm:block text-warm-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-base break-words">
            {getDesktopContent()}
          </p>
          
          {/* Read More/Less button for mobile */}
          {shouldTruncateMobile && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="sm:hidden mt-2 text-warm-600 dark:text-orange-400 hover:text-warm-700 dark:hover:text-orange-300 text-sm font-medium transition-colors duration-200"
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
          
          {/* Read More/Less button for desktop */}
          {shouldTruncateDesktop && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="hidden sm:block mt-2 text-warm-600 dark:text-orange-400 hover:text-warm-700 dark:hover:text-orange-300 text-sm font-medium transition-colors duration-200"
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
        
        {/* Images */}
        <PostImages images={post.images} />
        
        {/* Tags - responsive layout */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 sm:gap-2 mb-4">
            {post.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-1.5 sm:px-2 py-1 rounded-md text-xs font-medium bg-warm-100 dark:bg-slate-700 text-warm-700 dark:text-slate-300 hover:bg-warm-200 dark:hover:bg-slate-600 cursor-pointer transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
      {/* Action buttons and stats - mobile-responsive layout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm overflow-x-auto">
          <button
            onClick={() => toggleReply(post._id)}
            className="flex items-center space-x-1 text-warm-500 dark:text-slate-400 hover:text-warm-600 dark:hover:text-slate-300 transition-colors duration-200 cursor-pointer flex-shrink-0"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden xs:inline">{post.replyCount || 0} replies</span>
            <span className="xs:hidden">{post.replyCount || 0}</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLikePost(post._id);
            }}
            className={`flex items-center space-x-1 transition-colors duration-200 cursor-pointer flex-shrink-0 ${
              (post.likes && post.likes.includes(user?._id))
                ? 'text-red-500 hover:text-red-600' 
                : 'text-warm-500 dark:text-slate-400 hover:text-warm-600 dark:hover:text-slate-300'
            }`}
          >
            <Heart className={`w-4 h-4 ${(post.likes && post.likes.includes(user?._id)) ? 'fill-current' : ''}`} />
            <span className="hidden xs:inline">{(post.likes || []).length} likes</span>
            <span className="xs:hidden">{(post.likes || []).length}</span>
          </button>
        </div>
        <div className="text-xs text-warm-400 dark:text-slate-500 self-start sm:self-auto">
          <span className="hidden sm:inline">Last reply </span>
          <span className="sm:hidden">Reply: </span>
          {formatTimeAgo(post.lastReplyAt)}
        </div>
      </div>

      {/* Replies Display - Different for feed vs detail view */}
      {showFeedView ? (
        // Feed view: Show only top comment + link to view all
        topComment && (
          <div className="mt-4 border-t border-warm-100 dark:border-slate-600 pt-4">
            <div className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 bg-warm-25 dark:bg-slate-700/30 rounded-lg border border-warm-100 dark:border-slate-600">
              <UserAvatar 
                user={Meteor.users.findOne(topComment.authorId)}
                size="sm"
                showTooltip={true}
                getRoleColor={getRoleColor}
                getUserRole={getUserRole}
                className="flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                  <span className="font-medium text-sm text-warm-900 dark:text-white truncate max-w-[120px] sm:max-w-none">
                    {Meteor.users.findOne(topComment.authorId)?.profile?.name || 
                     Meteor.users.findOne(topComment.authorId)?.username || 'Unknown User'}
                  </span>
                  <span className="text-xs text-warm-500 dark:text-slate-400 flex-shrink-0">
                    {formatTimeAgo(topComment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-warm-700 dark:text-slate-300 whitespace-pre-wrap break-words line-clamp-2">
                  {topComment.content}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (handleLikeReply) {
                          handleLikeReply(topComment._id);
                        }
                      }}
                      className={`flex items-center space-x-1 text-xs transition-colors duration-200 cursor-pointer ${
                        (topComment.likes && topComment.likes.includes(user?._id))
                          ? 'text-red-500 hover:text-red-600' 
                          : 'text-warm-500 dark:text-slate-400 hover:text-warm-600 dark:hover:text-slate-300'
                      }`}
                    >
                      <Heart className={`w-3 h-3 ${(topComment.likes && topComment.likes.includes(user?._id)) ? 'fill-current' : ''}`} />
                      <span>{(topComment.likes || []).length}</span>
                    </button>
                  </div>
                  {post.replyCount > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/forum/post/${post._id}`);
                      }}
                      className="text-xs text-warm-600 dark:text-orange-400 hover:text-warm-700 dark:hover:text-orange-300 transition-colors duration-200"
                    >
                      View all {post.replyCount} comments
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      ) : (
        // Detail view: Show all replies as before
        <PostReplies 
          postId={post._id}
          allReplies={allReplies}
          showMoreReplies={showMoreReplies}
          toggleShowMoreReplies={toggleShowMoreReplies}
          formatTimeAgo={formatTimeAgo}
          getUserRole={getUserRole}
          getRoleColor={getRoleColor}
          user={user}
          handleLikeReply={handleLikeReply}
          replyToggles={replyToggles}
          replyContents={replyContents}
          submittingReplies={submittingReplies}
          handleReplyContentChange={handleReplyContentChange}
          handleSubmitReply={handleSubmitReply}
          toggleReply={toggleReply}
        />
      )}

      {/* Inline Reply Box */}
      {user && replyToggles[post._id] && (
        <InlineReplyBox 
          postId={post._id}
          user={user}
          replyContents={replyContents}
          submittingReplies={submittingReplies}
          handleReplyContentChange={handleReplyContentChange}
          handleSubmitReply={handleSubmitReply}
          toggleReply={toggleReply}
        />
      )}

      {!user && replyToggles[post._id] && (
        <div className="mt-4 p-3 sm:p-4 bg-warm-50 dark:bg-slate-700/50 rounded-lg border-l-4 border-warm-500 dark:border-orange-500 text-center">
          <p className="text-warm-600 dark:text-slate-400 text-sm">
            Please log in to reply to this post.
          </p>
        </div>
      )}
    </div>
  );
};
