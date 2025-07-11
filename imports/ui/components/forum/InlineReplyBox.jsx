import React from 'react';

export const InlineReplyBox = ({ 
  postId, 
  user, 
  replyContents, 
  submittingReplies, 
  handleReplyContentChange, 
  handleSubmitReply, 
  toggleReply 
}) => {
  const isSubmitting = submittingReplies[postId];
  const replyContent = replyContents[postId] || '';

  return (
    <div className="mt-4 p-3 sm:p-4 bg-warm-50 dark:bg-slate-700/50 rounded-lg border-l-4 border-warm-500 dark:border-orange-500">
      <form onSubmit={(e) => handleSubmitReply(e, postId)} className="space-y-3">
        <div className="flex items-start space-x-2 sm:space-x-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-warm-500 to-warm-600 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm flex-shrink-0">
            {user?.profile?.name?.charAt(0) || user?.username?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <textarea
              value={replyContent}
              onChange={(e) => handleReplyContentChange(postId, e.target.value)}
              placeholder="Write your reply..."
              className="w-full p-2 sm:p-3 border border-warm-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-warm-500 dark:focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white resize-none transition-all duration-300 ease-in-out text-sm sm:text-base"
              rows="3"
            />
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
          <button
            type="button"
            onClick={() => toggleReply(postId)}
            className="text-sm text-warm-500 hover:text-warm-600 dark:text-slate-400 dark:hover:text-slate-300 transition-colors text-center sm:text-left"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !replyContent.trim()}
            className="bg-warm-500 hover:bg-warm-600 dark:bg-orange-500 dark:hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 will-change-transform text-sm sm:text-base w-full sm:w-auto"
          >
            {isSubmitting ? 'Posting...' : 'Post Reply'}
          </button>
        </div>
      </form>
    </div>
  );
};
