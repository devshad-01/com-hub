import React, { useState, useEffect, useRef } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Send, X, Users, MessageCircle, Smile, Image, Reply, MoreHorizontal, Copy, Trash2 } from 'lucide-react';
import { MessagesCollection } from '../../../api/messages';
import { useToastContext } from '../common/ToastProvider';
import { UserAvatar } from '../common/UserAvatar';

// Extended emoji reactions with categories
const EMOJI_CATEGORIES = {
  common: ['👍', '❤️', '😂', '🎉', '😮', '👏', '🙏', '🔥'],
  faces: ['😀', '😃', '😄', '😁', '😆', '😅', '😊', '🥰', '😇', '🤩', '🤣', '😘', '😋', '😜'],
  gestures: ['👋', '✌️', '👌', '🤞', '👍', '👎', '👊', '🤟', '🙌', '👐', '🤲', '🤝'],
  symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '❣️', '💯', '✨', '💫', '🌟']
};

export const GeneralChat = ({ isOpen, onClose, user }) => {
  const { error: showError, success: showSuccess } = useToastContext();
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null); // Stores message ID when picker is open
  const [activeEmojiCategory, setActiveEmojiCategory] = useState('common');
  const [showMessageMenu, setShowMessageMenu] = useState(null); // Stores message ID when menu is open
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messageInputRef = useRef(null);

  // Subscribe to messages and online users
  const { messages, onlineUsers, loading } = useTracker(() => {
    const messagesHandle = Meteor.subscribe('generalChatMessages', { limit: 50 });
    const usersHandle = Meteor.subscribe('usersBasic');
    
    return {
      messages: MessagesCollection.find(
        { type: 'general' }, 
        { sort: { createdAt: 1 } }
      ).fetch(),
      onlineUsers: Meteor.users.find(
        { 'status.online': true },
        { fields: { username: 1, profile: 1, status: 1 } }
      ).fetch(),
      loading: !messagesHandle.ready() || !usersHandle.ready()
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close emoji picker and message menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmojiPicker && !event.target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(null);
      }
      if (showMessageMenu && !event.target.closest('.message-menu-container')) {
        setShowMessageMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker, showMessageMenu]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      // Directly scroll the container to bottom without affecting page scroll
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await Meteor.callAsync('messages.sendGeneral', {
        content: newMessage.trim()
      });
      setNewMessage('');
      messageInputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
      showError(
        'Failed to Send Message',
        error.message || 'Please try again.',
        { duration: 4000 }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      await Meteor.callAsync('messages.addReaction', messageId, emoji);
      setShowEmojiPicker(null); // Close emoji picker
    } catch (error) {
      console.error('Error adding reaction:', error);
      showError(
        'Failed to Add Reaction',
        error.message || 'Please try again.',
        { duration: 4000 }
      );
    }
  };

  const copyMessageText = (message) => {
    navigator.clipboard.writeText(message.content)
      .then(() => {
        showSuccess('Copied', 'Message copied to clipboard', { duration: 2000 });
        setShowMessageMenu(null);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        showError('Failed to copy', 'Could not copy to clipboard', { duration: 2000 });
      });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getUserDisplayName = (userId) => {
    const user = Meteor.users.findOne(userId);
    return user?.profile?.name || user?.username || 'Anonymous';
  };

  const getUserAvatar = (userId) => {
    const user = Meteor.users.findOne(userId);
    return user?.profile?.avatar || null;
  };

  const getUserInitial = (userId) => {
    const user = Meteor.users.findOne(userId);
    if (user?.profile?.name) {
      return user.profile.name.charAt(0).toUpperCase();
    }
    if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const isOwnMessage = (message) => {
    return message.userId === Meteor.userId();
  };

  // Helper functions for user roles and colors (similar to forum)
  const getUserRole = (userId) => {
    const user = Meteor.users.findOne(userId);
    return user?.profile?.role || 'member';
  };

  const getRoleColor = (role) => {
    const colors = {
      'admin': 'red',
      'member': 'purple'
    };
    return colors[role] || 'purple';
  };

  const renderAvatar = (userId) => {
    const user = Meteor.users.findOne(userId);
    
    return (
      <UserAvatar 
        user={user}
        size="sm"
        showTooltip={true}
        getRoleColor={getRoleColor}
        getUserRole={getUserRole}
      />
    );
  };

  const renderReactions = (message) => {
    if (!message.reactions || message.reactions.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {message.reactions.map((reaction, idx) => {
          const isReacted = reaction.userIds.includes(Meteor.userId());
          return (
            <button
              key={`${reaction.emoji}-${idx}`}
              onClick={() => handleReaction(message._id, reaction.emoji)}
              className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-0.5 border cursor-pointer ${
                isReacted 
                  ? 'bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700' 
                  : 'bg-warm-100 border-warm-200 dark:bg-slate-700 dark:border-slate-600'
              }`}
            >
              <span>{reaction.emoji}</span>
              <span className="text-xs">{reaction.userIds.length}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderEmojiPicker = (messageId) => {
    if (showEmojiPicker !== messageId) return null;
    
    return (
      <div className="emoji-picker-container absolute bottom-full mb-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-warm-200 dark:border-slate-600 p-2 z-10 w-64">
        <div className="border-b border-warm-200 dark:border-slate-600 pb-2 mb-2">
          <div className="flex space-x-1 mb-1">
            {Object.keys(EMOJI_CATEGORIES).map((category) => (
              <button
                key={category}
                onClick={() => setActiveEmojiCategory(category)}
                className={`px-2 py-1 text-xs rounded-md cursor-pointer ${
                  activeEmojiCategory === category 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                    : 'hover:bg-warm-100 dark:hover:bg-slate-700'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {EMOJI_CATEGORIES[activeEmojiCategory].map(emoji => (
            <button
              key={emoji}
              onClick={() => handleReaction(messageId, emoji)}
              className="h-8 w-8 flex items-center justify-center hover:bg-warm-100 dark:hover:bg-slate-700 rounded text-xl cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderMessageMenu = (message) => {
    if (showMessageMenu !== message._id) return null;

    const isOwn = isOwnMessage(message);
    
    return (
      <div className="message-menu-container absolute top-0 right-0 mt-1 mr-1 bg-white dark:bg-slate-800 rounded shadow-lg border border-warm-200 dark:border-slate-600 p-1 z-10">
        <div className="w-36">
          <button 
            onClick={() => copyMessageText(message)}
            className="flex items-center w-full px-2 py-1.5 text-sm hover:bg-warm-100 dark:hover:bg-slate-700 rounded cursor-pointer"
          >
            <Copy className="h-4 w-4 mr-2" />
            <span>Copy text</span>
          </button>
          
          <button 
            className="flex items-center w-full px-2 py-1.5 text-sm hover:bg-warm-100 dark:hover:bg-slate-700 rounded cursor-pointer"
          >
            <Reply className="h-4 w-4 mr-2" />
            <span>Reply</span>
          </button>
          
          {isOwn && (
            <button 
              className="flex items-center w-full px-2 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded cursor-pointer"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-warm border border-warm-200 dark:border-slate-700 h-[500px] md:h-[600px] flex flex-col overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-3 md:p-4 border-b border-warm-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <MessageCircle className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
          <div>
            <h3 className="text-base md:text-lg font-semibold text-warm-900 dark:text-white">
              General Chat
            </h3>
            <p className="text-xs md:text-sm text-warm-600 dark:text-slate-400 hidden md:block">
              {onlineUsers.length} online
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-warm-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
        >
          <X className="h-4 w-4 md:h-5 md:w-5 text-warm-600 dark:text-slate-400" />
        </button>
      </div>

      {/* Online Users Bar - Hidden as requested */}
      {/* 
      <div className="p-3 bg-warm-50 dark:bg-slate-700/50 border-b border-warm-200 dark:border-slate-700">
        <div className="flex items-center space-x-2 text-sm">
          <Users className="h-4 w-4 text-warm-600 dark:text-slate-400" />
          <span className="text-warm-700 dark:text-slate-300 font-medium">Online:</span>
          <div className="flex flex-wrap gap-1">
            {onlineUsers.slice(0, 8).map(user => (
              <span
                key={user._id}
                className="px-2 py-1 bg-warm-200 dark:bg-slate-600 text-warm-800 dark:text-slate-200 rounded-full text-xs"
              >
                {user.profile?.name || user.username}
              </span>
            ))}
            {onlineUsers.length > 8 && (
              <span className="text-warm-600 dark:text-slate-400 text-xs">
                +{onlineUsers.length - 8} more
              </span>
            )}
          </div>
        </div>
      </div>
      */}

      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-warm-600 dark:text-slate-400">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const own = isOwnMessage(message);
            return (
              <div 
                key={message._id} 
                className={`flex ${own ? 'justify-end' : 'justify-start'} mb-4`}
              >
                <div 
                  className={`flex ${own ? 'flex-row-reverse' : 'flex-row'} relative group items-end`}
                >
                  {/* Avatar component - no margins here as we want it directly next to the bubble */}
                  <div className={`flex-shrink-0 ${own ? 'ml-2' : 'mr-2'}`}>
                    {renderAvatar(message.userId)}
                  </div>
                  
                  {/* Message content with its container */}
                  <div className="relative">
                    <div 
                      className={`flex flex-col ${
                        own 
                          ? 'items-end' 
                          : 'items-start'
                      }`}
                    >
                      {/* Username and timestamp */}
                      <div className={`flex items-center mb-1 ${own ? 'flex-row-reverse' : 'flex-row'} gap-2`}>
                        <span className="text-sm font-medium text-warm-900 dark:text-white">
                          {own ? 'You' : getUserDisplayName(message.userId)}
                        </span>
                        <span className="text-xs text-warm-500 dark:text-slate-400">
                          {formatTime(message.createdAt)}
                        </span>
                      </div>
                      
                      {/* Message bubble */}
                      <div 
                        className={`relative rounded-2xl px-4 py-2 break-words max-w-xs sm:max-w-md ${
                          own 
                            ? 'bg-blue-500 text-white rounded-br-none' 
                            : 'bg-warm-200 dark:bg-slate-700 text-warm-900 dark:text-white rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        
                        {/* Message menu button */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowMessageMenu(showMessageMenu === message._id ? null : message._id);
                            }}
                            className={`p-1 rounded-full cursor-pointer ${own ? 'hover:bg-blue-600' : 'hover:bg-warm-300 dark:hover:bg-slate-600'}`}
                          >
                            <MoreHorizontal className={`h-4 w-4 ${own ? 'text-white' : 'text-warm-600 dark:text-slate-400'}`} />
                          </button>
                          {renderMessageMenu(message)}
                        </div>
                      </div>
                      
                      {/* Reactions */}
                      <div className={`mt-1 flex ${own ? 'justify-end' : 'justify-start'}`}>
                        {renderReactions(message)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Edge icons - visible on hover */}
                  <div className={`absolute ${
                    own ? 'left-0 -translate-x-[140%]' : 'right-0 translate-x-[140%]'
                  } bottom-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2`}>
                    <button 
                      onClick={() => setShowEmojiPicker(showEmojiPicker === message._id ? null : message._id)}
                      className="p-2 bg-warm-100 dark:bg-slate-700 rounded-full hover:bg-warm-200 dark:hover:bg-slate-600 transition-colors shadow-sm cursor-pointer"
                    >
                      <Smile className="h-4 w-4 text-warm-600 dark:text-slate-300" />
                    </button>
                    
                    <button 
                      className="p-2 bg-warm-100 dark:bg-slate-700 rounded-full hover:bg-warm-200 dark:hover:bg-slate-600 transition-colors shadow-sm"
                    >
                      <Reply className="h-4 w-4 text-warm-600 dark:text-slate-300" />
                    </button>
                    
                    {/* Emoji picker - positioned properly based on message ownership */}
                    <div className={`absolute ${
                      own ? 'left-0' : 'right-0'
                    } top-0`}>
                      {renderEmojiPicker(message._id)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-warm-200 dark:border-slate-700">
        <div className="flex items-end space-x-2">
          <div className="flex-shrink-0">
            <button
              type="button"
              className="p-2 text-warm-600 dark:text-slate-400 hover:bg-warm-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            >
              <Image className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 relative">
            <input
              ref={messageInputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={user ? "Type a message..." : "Please log in to chat"}
              disabled={!user || isSubmitting}
              className="w-full px-4 py-2 pl-3 pr-10 border border-warm-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-warm-900 dark:text-white placeholder-warm-500 dark:placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
              maxLength={500}
            />
            
            <button
              type="button"
              className="absolute right-3 bottom-2.5 text-warm-500 dark:text-slate-400 hover:text-warm-700 dark:hover:text-white"
            >
              <Smile className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-shrink-0">
            <button
              type="submit"
              disabled={!user || !newMessage.trim() || isSubmitting}
              className="p-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-warm-300 dark:disabled:bg-slate-600 text-white rounded-full transition-colors disabled:cursor-not-allowed flex items-center justify-center shadow-sm"
            >
              {isSubmitting ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        
        {newMessage.length > 450 && (
          <p className="text-xs text-warm-500 dark:text-slate-400 mt-1 text-right">
            {500 - newMessage.length} characters remaining
          </p>
        )}
      </form>
    </div>
  );
};