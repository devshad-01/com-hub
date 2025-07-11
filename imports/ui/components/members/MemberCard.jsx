import React from 'react';
import { 
  Star, 
  MapPin, 
  Calendar, 
  Clock, 
  MessageCircle, 
  UserCheck,
  MessageSquare
} from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';

export const MemberCard = ({ 
  member, 
  conversation, 
  onStartChat,
  formatTimeAgo 
}) => {
  const isOnline = member.status?.online;
  const lastActivity = member.status?.lastActivity;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-warm border border-warm-200 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
      {/* Member Card Header */}
      <div className="relative p-6 bg-gradient-to-br from-warm-100 to-orange-100 dark:from-slate-700 dark:to-slate-600 group-hover:from-warm-200 group-hover:to-orange-200 dark:group-hover:from-slate-600 dark:group-hover:to-slate-500 transition-all duration-300">
        {/* Online Status Indicator */}
        {isOnline && (
          <div className="absolute top-4 right-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-700 dark:text-green-400 font-medium">Online</span>
            </div>
          </div>
        )}

        {/* Avatar */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <UserAvatar
              user={member}
              size="lg"
              className="ring-4 ring-white dark:ring-slate-800 group-hover:ring-warm-200 dark:group-hover:ring-slate-600 transition-all duration-300"
            />
            {isOnline && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-3 border-white dark:border-slate-800 rounded-full flex items-center justify-center">
                <UserCheck className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Member Info */}
        <div className="text-center">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-warm-700 dark:group-hover:text-warm-300 transition-colors">
            {member.profile?.name || member.username}
          </h3>
          {member.profile?.name && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
              @{member.username}
            </p>
          )}
          
          {/* Role Badge */}
          <div className="flex justify-center mb-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
              member.profile?.role === 'admin' 
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 group-hover:bg-red-200 dark:group-hover:bg-red-800'
                : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 group-hover:bg-purple-200 dark:group-hover:bg-purple-800'
            }`}>
              {member.profile?.role === 'admin' && <Star className="w-3 h-3 mr-1" />}
              {member.profile?.role || 'Member'}
            </span>
          </div>
        </div>
      </div>

      {/* Member Details */}
      <div className="p-6">
        {/* Bio */}
        {member.profile?.bio && (
          <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg group-hover:bg-warm-50 dark:group-hover:bg-slate-600 transition-colors">
            <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
              {member.profile.bio}
            </p>
          </div>
        )}

        {/* Member Metadata */}
        <div className="space-y-2 mb-4">
          {/* Location */}
          {member.profile?.location && (
            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
              <MapPin className="w-4 h-4 mr-2 text-warm-500" />
              <span>{member.profile.location}</span>
            </div>
          )}

          {/* Join Date */}
          <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
            <Calendar className="w-4 h-4 mr-2 text-warm-500" />
            <span>Joined {formatTimeAgo(member.createdAt)}</span>
          </div>

          {/* Last Activity */}
          {!isOnline && lastActivity && (
            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
              <Clock className="w-4 h-4 mr-2 text-warm-500" />
              <span>Last seen {formatTimeAgo(lastActivity)}</span>
            </div>
          )}
        </div>

        {/* Conversation Info */}
        {conversation && (
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1">
                <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  Recent conversation
                </span>
              </div>
              {conversation.unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium animate-pulse">
                  {conversation.unreadCount}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 truncate mb-1">
              "{conversation.lastMessage.content}"
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {formatTimeAgo(conversation.lastMessage.createdAt)}
            </p>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => onStartChat(member)}
          className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-warm-500 to-orange-500 hover:from-warm-600 hover:to-orange-600 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg group-hover:shadow-xl"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Send Message</span>
        </button>
      </div>
    </div>
  );
};
