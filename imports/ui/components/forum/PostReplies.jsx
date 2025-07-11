import React, { useState, useMemo } from 'react';
import { Meteor } from 'meteor/meteor';
import { Heart, Shield, Crown, Star, UserCheck, Zap, AlertTriangle } from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';
import { ROLES } from '../../../api/users/roles';

// Constants for safety limits
const MAX_REPLY_DEPTH = 10;
const MAX_CHILDREN_PER_REPLY = 100;

// Enhanced helper to build a tree of replies with cycle detection and safety limits
function buildReplyTree(replies) {
  if (!replies || !Array.isArray(replies)) {
    console.warn('[PostReplies] Invalid replies data:', replies);
    return [];
  }

  const replyMap = {};
  const roots = [];
  const visited = new Set();
  
  // First pass: create map and initialize children arrays
  replies.forEach(reply => {
    if (!reply || !reply._id) {
      console.warn('[PostReplies] Invalid reply object:', reply);
      return;
    }
    reply.children = [];
    replyMap[reply._id] = reply;
  });
  
  // Second pass: build tree structure with cycle detection
  replies.forEach(reply => {
    if (!reply || !reply._id) return;
    
    if (reply.parentReplyId) {
      const parent = replyMap[reply.parentReplyId];
      if (parent) {
        // Cycle detection: check if parent is already a descendant of this reply
        if (!hasCircularReference(reply._id, reply.parentReplyId, replyMap)) {
          // Limit children per reply for performance
          if (parent.children.length < MAX_CHILDREN_PER_REPLY) {
            parent.children.push(reply);
          } else {
            console.warn(`[PostReplies] Max children limit reached for reply ${reply.parentReplyId}`);
          }
        } else {
          console.warn(`[PostReplies] Circular reference detected: ${reply._id} -> ${reply.parentReplyId}`);
          // Add as root instead to prevent loss of data
          roots.push(reply);
        }
      } else {
        console.warn(`[PostReplies] Parent reply not found: ${reply.parentReplyId} for reply ${reply._id}`);
        // Add as root if parent doesn't exist
        roots.push(reply);
      }
    } else {
      roots.push(reply);
    }
  });
  
  console.log('[PostReplies] Reply tree built:', { totalReplies: replies.length, roots: roots.length });
  return roots;
}

// Helper function to detect circular references
function hasCircularReference(replyId, parentId, replyMap, visited = new Set()) {
  if (!parentId || !replyMap[parentId]) return false;
  if (visited.has(parentId)) return true;
  if (parentId === replyId) return true;
  
  visited.add(parentId);
  const parent = replyMap[parentId];
  return hasCircularReference(replyId, parent.parentReplyId, replyMap, visited);
}

export const PostReplies = ({ 
  postId, 
  allReplies, 
  showMoreReplies, 
  toggleShowMoreReplies,
  formatTimeAgo,
  getUserRole,
  getRoleColor,
  user,
  handleLikeReply,
  replyToggles,
  replyContents,
  submittingReplies,
  handleReplyContentChange,
  handleSubmitReply,
  toggleReply
}) => {
  // Memoize reply tree building for performance
  const replyTree = useMemo(() => {
    try {
      const replies = allReplies ? allReplies.filter(reply => reply && reply.postId === postId) : [];
      if (!replies || replies.length === 0) return [];
      return buildReplyTree(replies);
    } catch (error) {
      console.error('[PostReplies] Error building reply tree:', error);
      return [];
    }
  }, [allReplies, postId]);

  if (!replyTree || replyTree.length === 0) return null;

  const INITIAL_REPLIES_LIMIT = 3;
  const showingAll = showMoreReplies && showMoreReplies[postId];
  const visibleRoots = showingAll ? replyTree : replyTree.slice(0, INITIAL_REPLIES_LIMIT);
  const hasMoreReplies = replyTree.length > INITIAL_REPLIES_LIMIT;

  return (
    <div className="mt-4 space-y-3">
      {/* Error Boundary for Replies */}
      <ReplyErrorBoundary>
        {/* Replies Display */}
        {visibleRoots.map(reply => {
          if (!reply || !reply._id) {
            console.warn('[PostReplies] Skipping invalid reply:', reply);
            return null;
          }
          return (
            <ReplyItem 
              key={reply._id}
              reply={reply}
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
              depth={0}
            />
          );
        })}
      </ReplyErrorBoundary>

      {/* Show More Replies Button */}
      {hasMoreReplies && (
        <button
          onClick={() => toggleShowMoreReplies(postId)}
          className="w-full text-left text-sm text-warm-600 dark:text-slate-400 hover:text-warm-700 dark:hover:text-slate-300 transition-colors duration-200 py-2 cursor-pointer"
        >
          {showingAll 
            ? `Show fewer replies` 
            : `Show ${replyTree.length - INITIAL_REPLIES_LIMIT} more replies`
          }
        </button>
      )}
    </div>
  );
};

// Error Boundary Component for Replies
class ReplyErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ReplyErrorBoundary] Error in reply rendering:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Error loading replies</span>
          </div>
          <p className="text-sm text-red-500 dark:text-red-300 mt-1">
            There was an issue displaying the replies. Please refresh the page to try again.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Recursive ReplyItem
const ReplyItem = ({ 
  reply, 
  formatTimeAgo, 
  getUserRole, 
  getRoleColor, 
  user, 
  handleLikeReply,
  replyToggles,
  replyContents,
  submittingReplies,
  handleReplyContentChange,
  handleSubmitReply,
  toggleReply,
  depth
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const replyAuthor = Meteor.users.findOne(reply.authorId);
  const replyAuthorName = replyAuthor?.profile?.name || replyAuthor?.username || 'Unknown User';
  const replyAuthorRole = getUserRole(reply.authorId);
  const MOBILE_CHAR_LIMIT = 150;
  const shouldTruncate = reply.content && reply.content.length > MOBILE_CHAR_LIMIT;
  const displayContent = shouldTruncate && !isExpanded 
    ? reply.content.substring(0, MOBILE_CHAR_LIMIT).trim() + '...'
    : reply.content;

  // Only show role badge for privileged users
  const shouldShowRoleBadge = (role) => role && role !== ROLES.MEMBER;
  const getRoleDisplay = (role) => {
    if ([ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MODERATOR, ROLES.EVENT_CREATOR].includes(role)) return 'Admin';
    return 'Member';
  };

  // Logging for debugging
  console.log(`[ReplyItem] Render replyId: ${reply._id}, parentReplyId: ${reply.parentReplyId}, depth: ${depth}`);

  return (
    <div className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 bg-warm-25 dark:bg-slate-700/30 rounded-lg border border-warm-100 dark:border-slate-600 mt-2" style={{ marginLeft: depth * 24 }}>
      <UserAvatar 
        user={replyAuthor}
        size="sm"
        showTooltip={true}
        getRoleColor={getRoleColor}
        getUserRole={getUserRole}
        className="flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
          <span className="font-medium text-sm text-warm-900 dark:text-white truncate max-w-[120px] sm:max-w-none">
            {replyAuthorName}
          </span>
          {shouldShowRoleBadge(replyAuthorRole) && (
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border transition-all duration-200 bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700`}>
              <Shield className="w-2.5 h-2.5 mr-1" />
              {getRoleDisplay(replyAuthorRole)}
            </span>
          )}
          <span className="text-xs text-warm-500 dark:text-slate-400 flex-shrink-0">
            {formatTimeAgo(reply.createdAt)}
          </span>
        </div>
        <p className="text-sm text-warm-700 dark:text-slate-300 whitespace-pre-wrap break-words">
          {displayContent}
        </p>
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-1 text-warm-600 dark:text-orange-400 hover:text-warm-700 dark:hover:text-orange-300 text-xs font-medium transition-colors duration-200 sm:hidden"
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}
        <div className="flex items-center space-x-3 sm:space-x-4 mt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (handleLikeReply) {
                handleLikeReply(reply._id);
              }
            }}
            className={`flex items-center space-x-1 text-xs transition-colors duration-200 cursor-pointer ${
              (reply.likes && reply.likes.includes(user?._id))
                ? 'text-red-500 hover:text-red-600' 
                : 'text-warm-500 dark:text-slate-400 hover:text-warm-600 dark:hover:text-slate-300'
            }`}
          >
            <Heart className={`w-3 h-3 ${(reply.likes && reply.likes.includes(user?._id)) ? 'fill-current' : ''}`} />
            <span>{(reply.likes || []).length}</span>
          </button>
          <button
            className="text-xs text-warm-500 dark:text-slate-400 hover:text-warm-600 dark:hover:text-slate-300 transition-colors duration-200 cursor-pointer"
            onClick={() => setShowReplyBox(!showReplyBox)}
          >
            {showReplyBox ? 'Cancel' : 'Reply'}
          </button>
        </div>
        {/* Inline Reply Box for this reply */}
        {showReplyBox && user && (
          <div className="mt-2">
            <form onSubmit={e => {
              e.preventDefault();
              if (!replyContents || !replyContents[reply._id] || !replyContents[reply._id].trim()) return;
              console.log('[ReplyItem] Submitting reply to replyId:', reply._id, 'content:', replyContents[reply._id]);
              handleSubmitReply(e, reply.postId, reply._id);
              setShowReplyBox(false);
            }}>
              <textarea
                value={(replyContents && replyContents[reply._id]) || ''}
                onChange={e => handleReplyContentChange(reply._id, e.target.value)}
                placeholder="Write your reply..."
                className="w-full p-2 border border-warm-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-warm-500 dark:focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white resize-none transition-all duration-300 ease-in-out text-sm"
                rows="2"
              />
              <div className="flex justify-end mt-1 space-x-2">
                <button
                  type="button"
                  onClick={() => setShowReplyBox(false)}
                  className="text-xs text-warm-500 hover:text-warm-600 dark:text-slate-400 dark:hover:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={(submittingReplies && submittingReplies[reply._id]) || !(replyContents && replyContents[reply._id] && replyContents[reply._id].trim())}
                  className="bg-warm-500 hover:bg-warm-600 dark:bg-orange-500 dark:hover:bg-orange-600 text-white px-3 py-1 rounded-lg font-medium text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(submittingReplies && submittingReplies[reply._id]) ? 'Posting...' : 'Post Reply'}
                </button>
              </div>
            </form>
          </div>
        )}
        {/* Render children recursively */}
        {reply.children && Array.isArray(reply.children) && reply.children.length > 0 && !reply.children.some(child => child._id === reply._id) && (
          <div className="mt-2 space-y-2">
            {reply.children.map(child => (
              <ReplyItem
                key={child._id}
                reply={child}
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
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
