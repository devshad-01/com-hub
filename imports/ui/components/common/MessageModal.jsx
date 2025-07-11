import React, { useState, useEffect, useCallback } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { X, Send, MessageSquare } from 'lucide-react';
import { MessagesCollection } from '../../../api/messages';
import { UserAvatar } from './UserAvatar';
import { useToastContext } from './ToastProvider';

export const MessageModal = ({ 
  isOpen, 
  onClose, 
  selectedMember,
  user 
}) => {
  const { success, error: showError } = useToastContext();
  const [messageContent, setMessageContent] = useState('');

  // Subscribe to direct messages with selected member
  const { directMessages, loading } = useTracker(() => {
    if (!selectedMember || !user) {
      return { directMessages: [], loading: false };
    }

    const handle = Meteor.subscribe('directMessages', selectedMember._id, { limit: 50 });
    
    const directMessages = MessagesCollection.find({
      type: 'direct',
      $or: [
        { senderId: user._id, recipientId: selectedMember._id },
        { senderId: selectedMember._id, recipientId: user._id }
      ]
    }, { sort: { createdAt: 1 } }).fetch();

    return {
      directMessages,
      loading: !handle.ready()
    };
  }, [selectedMember, user]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen && directMessages.length > 0) {
      setTimeout(() => {
        const messagesContainer = document.getElementById('messages-container');
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, 100);
    }
  }, [directMessages, isOpen]);

  // Mark messages as read when opening chat
  useEffect(() => {
    if (selectedMember && isOpen) {
      Meteor.callAsync('messages.markAsRead', selectedMember._id).catch(console.error);
    }
  }, [selectedMember?._id, isOpen]);

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

  const handleSendMessage = useCallback(async () => {
    if (!selectedMember || !messageContent.trim()) return;

    try {
      await Meteor.callAsync('messages.sendDirect', {
        content: messageContent.trim(),
        recipientId: selectedMember._id
      });
      
      setMessageContent('');
      success('Message sent!', `Your message was sent to ${selectedMember.profile?.name || selectedMember.username}`);
    } catch (error) {
      showError('Failed to send message', error.message);
    }
  }, [selectedMember, messageContent, success, showError]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  if (!isOpen || !selectedMember) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col animate-fadeIn border border-slate-200 dark:border-slate-700">
        {/* Chat Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <UserAvatar user={selectedMember} size="md" />
              {selectedMember.status?.online && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {selectedMember.profile?.name || selectedMember.username}
              </h3>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {selectedMember.status?.online ? (
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Online now
                  </span>
                ) : (
                  'Offline'
                )}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        {/* Messages Container */}
        <div 
          id="messages-container"
          className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-slate-900"
        >
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : directMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-8">
                <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400 text-lg font-medium mb-2">
                  Start the conversation
                </p>
                <p className="text-slate-500 dark:text-slate-500 text-sm">
                  Send a message to {selectedMember.profile?.name || selectedMember.username}
                </p>
              </div>
            </div>
          ) : (
            directMessages.map(message => (
              <div
                key={message._id}
                className={`flex ${message.senderId === user._id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] group ${
                  message.senderId === user._id
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600'
                } rounded-2xl px-4 py-3 shadow-sm hover:shadow-md transition-all duration-200`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-2 ${
                    message.senderId === user._id 
                      ? 'text-blue-100' 
                      : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {formatTimeAgo(message.createdAt)}
                    {message.senderId === user._id && !message.read && (
                      <span className="ml-2 opacity-70">•</span>
                    )}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Message ${selectedMember.profile?.name || selectedMember.username}...`}
                rows={1}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                style={{ minHeight: '48px', maxHeight: '120px' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!messageContent.trim()}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:transform-none shadow-lg shadow-blue-500/25"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          {/* Character count */}
          <div className="flex justify-between items-center mt-3 text-xs text-slate-400">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span className={messageContent.length > 900 ? 'text-red-500 font-medium' : ''}>
              {messageContent.length}/1000
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
