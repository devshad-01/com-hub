import React from 'react';
import { Meteor } from 'meteor/meteor';
import { MessageCircle } from 'lucide-react';

export const AdminPopularPosts = ({ posts, isLoading, onNavigate }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Popular Forum Posts</h2>
        <button 
          onClick={() => onNavigate('forumPosts')}
          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          View All
        </button>
      </div>
      
      {isLoading ? (
        <div className="py-8 flex justify-center">
          <span className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin"></span>
        </div>
      ) : posts && posts.length > 0 ? (
        <div className="overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Post</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Author</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Replies</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(post => {
                const author = Meteor.users.findOne(post.authorId);
                return (
                  <tr key={post._id} className="border-b border-slate-200 dark:border-slate-700">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[200px]">
                        {post.title}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {author?.username || author?.profile?.name || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center justify-center">
                        <MessageCircle className="h-3.5 w-3.5 mr-1" />
                        {post.replyCount || 0}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-8 text-center text-slate-500 dark:text-slate-400">
          No forum posts yet
        </div>
      )}
    </div>
  );
};
