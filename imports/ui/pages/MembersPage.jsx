// imports/ui/pages/MembersPage.jsx

import React, { useState, useCallback } from 'react';
import { Meteor } from 'meteor/meteor';
import { useNavigate } from 'react-router-dom'; // <--- NEW: Import useNavigate
import {
  Users,
  Search,
  UserCheck,
  Star,
  MessageCircle,
  MapPin
} from 'lucide-react';
import { useToastContext } from '../components/common/ToastProvider';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
// Removed: import { MessageModal } from '../components/common/MessageModal'; // <--- REMOVED: No longer using modal
import { UserAvatar } from '../components/common/UserAvatar';
import { useMembers } from '../hooks/useMembers';

export const MembersPage = () => {
  const { success, error: showError } = useToastContext();

  // Removed: const [selectedMember, setSelectedMember] = useState(null); // <--- REMOVED
  // Removed: const [showChat, setShowChat] = useState(false); // <--- REMOVED
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const navigate = useNavigate(); // <--- NEW: Initialize useNavigate hook

  // Use the custom hook for members data
  const {
    members = [],
    loading,
    user,
    conversations = new Map(), // Keep conversations if used elsewhere for display (e.g., last message preview)
    searchTerm,
    setSearchTerm,
    selectedFilter,
    setSelectedFilter,
    limit,
    setLimit
  } = useMembers();

  const formatTimeAgo = useCallback((date) => {
    if (!date) return 'Unknown';

    const dateObj = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffInMinutes = Math.floor((now - dateObj) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return dateObj.toLocaleDateString();
  }, []);

  // --- MODIFIED: Direct navigation to DirectMessagePage ---
  const handleStartChat = useCallback((member) => {
    if (Meteor.userId() && member._id) {
      // Navigate to the DirectMessagePage with the member's ID as a parameter
      navigate(`/messages/${member._id}`);
    } else {
      showError("Cannot start chat: invalid user or member ID.");
    }
  }, [navigate, showError]);

  // Removed: const handleCloseChat = useCallback(() => { ... }); // <--- REMOVED

  const loadMoreMembers = useCallback(() => {
    setIsLoadingMore(true);
    setLimit(prev => prev + 20);
    setTimeout(() => setIsLoadingMore(false), 1000);
  }, [setLimit]);

  if (loading && members.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading members..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40 backdrop-blur-sm bg-white/95 dark:bg-slate-800/95">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-500 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Members
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {members.length} community member{members.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex space-x-2">
              {[
                { id: 'all', label: 'All Members', icon: Users, count: members.length },
                { id: 'online', label: 'Online', icon: UserCheck, count: members.filter(m => m.status?.online).length },
                { id: 'admins', label: 'Admins', icon: Star, count: members.filter(m => m.profile?.role === 'admin').length }
              ].map(filter => {
                const Icon = filter.icon;
                const isActive = selectedFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedFilter(filter.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{filter.label}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-600'
                    }`}>
                      {filter.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-6 relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border-0 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-600 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Members List */}
        <div className="space-y-3">
          {members.map(member => {
            const conversation = conversations.get(member._id);
            const isOnline = member.status?.online;
            const lastActivity = member.status?.lastActivity; // Assuming lastActivity is your last seen field

            // Don't show self in the members list to message
            if (member._id === Meteor.userId()) {
              return null;
            }

            return (
              <div
                key={member._id}
                className="group bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <UserAvatar user={member} size="md" />
                      {isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                      )}
                    </div>

                    {/* Member Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                          {member.profile?.name || member.username}
                        </h3>
                        {member.profile?.role === 'admin' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            <Star className="w-3 h-3 mr-1" />
                            Admin
                          </span>
                        )}
                        {isOnline && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></div>
                            Online
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
                        {member.profile?.name && (
                          <span>@{member.username}</span>
                        )}
                        {member.profile?.location && (
                          <span className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {member.profile.location}
                          </span>
                        )}
                        <span>
                          {isOnline ? 'Active now' : `Last seen ${formatTimeAgo(lastActivity || member.createdAt)}`}
                        </span>
                      </div>

                      {member.profile?.bio && (
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                          {member.profile.bio}
                        </p>
                      )}

                      {/* Conversation Preview (if exists) */}
                      {conversation && (
                        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                              Recent conversation
                            </span>
                            {conversation.unreadCount > 0 && (
                              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
                            "{conversation.lastMessage.content}"
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {formatTimeAgo(conversation.lastMessage.createdAt)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button: Message */}
                  <div className="flex-shrink-0 ml-4">
                    {/* Only show message button if it's not the current user */}
                    {member._id !== Meteor.userId() && (
                      <button
                        onClick={() => handleStartChat(member)} // <--- MODIFIED: Calls new navigation handler
                        className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/25"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">Message</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load More Button */}
        {members.length >= limit && (
          <div className="flex justify-center mt-8">
            <button
              onClick={loadMoreMembers}
              disabled={isLoadingMore}
              className="inline-flex items-center space-x-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-8 py-4 rounded-xl font-medium border border-slate-200 dark:border-slate-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isLoadingMore ? (
                <>
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading more members...</span>
                </>
              ) : (
                <>
                  <Users className="w-5 h-5" />
                  <span>Load More Members</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Empty State */}
        {members.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-8 max-w-md mx-auto">
              <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-400 mb-2">
                No members found
              </h3>
              <p className="text-slate-500 dark:text-slate-500">
                {searchTerm ? 'Try adjusting your search terms' : 'No members match the selected filter'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Removed: Message Modal is no longer needed */}
      {/*
      <MessageModal
        isOpen={showChat}
        onClose={handleCloseChat}
        selectedMember={selectedMember}
        user={user}
      />
      */}
    </div>
  );
};
