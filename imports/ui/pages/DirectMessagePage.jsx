// DirectMessagePage.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import { useParams, useNavigate } from "react-router-dom";
import { DirectMessagesCollection } from "/imports/api/DirectMessages/DirectMessagesCollection";
import { Send, ArrowLeft } from "lucide-react";
import { formatTimeAgo } from '/imports/utils/formatTimeAgo';

// Import the UserAvatar component
import { UserAvatar } from '/imports/ui/components/common/UserAvatar'; // ADJUST THIS PATH if your UserAvatar is elsewhere!

import { useAuth } from '/imports/ui/contexts/AuthContext'; 

// Define the client-side collection once in a separate, dedicated file
// or ensure it's globally available to prevent HMR errors.
// For demonstration, we'll assume it's moved to a separate file like:
// /imports/api/DirectMessages/DirectMessageConversationsClient.js
// And then imported here:
import { DirectMessageConversationsClient } from '/imports/api/DirectMessages/DirectMessageConversationsClient';


export const DirectMessagePage = () => {
  const { targetUserId } = useParams();
  const navigate = useNavigate();

  // Destructure functions from useAuth for UserAvatar component
  // Make sure useAuth provides these if you want role colors/tooltips
  const { getUserPrimaryRole, getRoleColor } = useAuth();

  // ✅ HIDE FOOTER ON THIS PAGE
  useEffect(() => {
    const footer = document.querySelector("footer");
    if (footer) footer.style.display = "none";
    return () => {
      if (footer) footer.style.display = "";
    };
  }, []);

  const [messageContent, setMessageContent] = useState("");
  const messagesEndRef = useRef(null);

  const { conversations, isLoadingConversations } = useTracker(() => {
    const handle = Meteor.subscribe("directMessages.conversationsList");
    const conversationsData = DirectMessageConversationsClient.find({}, {
      sort: { 'lastMessage.createdAt': -1 }
    }).fetch();

    return {
      conversations: conversationsData,
      isLoadingConversations: !handle.ready(),
    };
  }, []);

  const { messages, targetUser, isLoadingChat } = useTracker(() => {
    let messagesData = [];
    let targetUserData = null;
    let loadingChat = true;

    if (targetUserId) {
      const messagesHandle = Meteor.subscribe("directMessages.conversation", targetUserId);
      const userHandle = Meteor.subscribe("directMessages.otherUser", targetUserId);

      messagesData = DirectMessagesCollection.find(
        {
          $or: [
            { senderId: Meteor.userId(), receiverId: targetUserId },
            { senderId: targetUserId, receiverId: Meteor.userId() },
          ],
        },
        { sort: { createdAt: 1 } }
      ).fetch();

      targetUserData = Meteor.users.findOne(targetUserId);
      loadingChat = !messagesHandle.ready() || !userHandle.ready();
    } else {
      loadingChat = false;
    }

    return {
      messages: messagesData,
      targetUser: targetUserData,
      isLoadingChat: loadingChat,
    };
  }, [targetUserId]);

  useEffect(() => {
    if (targetUserId && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }

    const markMessagesAsRead = async () => {
      if (!isLoadingChat && messages.length > 0 && targetUserId) {
        try {
          await Meteor.callAsync('directMessages.markAsRead', targetUserId);
        } catch (error) {
          console.error("Error marking messages as read:", error);
        }
      }
    };
    markMessagesAsRead();
  }, [messages, isLoadingChat, targetUserId]);

  const handleSendMessage = useCallback((e) => {
    e.preventDefault();
    if (!messageContent.trim() || !Meteor.userId() || !targetUserId) {
      return;
    }

    Meteor.call(
      "directMessages.send",
      targetUserId,
      messageContent,
      (error) => {
        if (error) {
          console.error("Error sending direct message:", error);
        } else {
          setMessageContent("");
        }
      }
    );
  }, [messageContent, targetUserId]);

  const isMyMessage = useCallback((message) => message.senderId === Meteor.userId(), []);
  const getFormattedTime = useCallback((date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const formatLastSeen = (lastLoginDate) => {
    if (!lastLoginDate) return "Unknown";
    const now = new Date();
    const lastLogin = new Date(lastLoginDate);
    const diffSeconds = Math.floor((now - lastLogin) / 1000);

    if (diffSeconds < 60) return "Just now";
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} minutes ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hours ago`; // Corrected to show hours
    if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)} days ago`; // Corrected to show days (up to 6 days)
    return lastLogin.toLocaleDateString(); // For longer periods
  };

  // getPartnerAvatar is no longer needed since UserAvatar handles this
  // const getPartnerAvatar = (partner) => {
  //   return partner.partnerAvatar || `https://placehold.co/40x40/slate/white?text=${partner.partnerUsername ? partner.partnerUsername[0].toUpperCase() : '?'}`;
  // };

  return (
    <div className="flex h-screen inset-0 bg-background dark:bg-slate-900 text-warm-900 dark:text-white">
      {/* Left Sidebar */}
      <div
        className={`w-full md:w-1/3 lg:w-1/4 xl:w-1/5 bg-warm-50 dark:bg-slate-800 border-r border-warm-200 dark:border-slate-700 flex flex-col ${
          targetUserId ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="p-4 border-b border-warm-200 dark:border-slate-700 ">
          <h2 className="text-xl font-bold text-orange-400">Chats</h2>
        </div>
        <div className="flex-1 bg-warm-300 overflow-y-auto custom-scrollbar">
          {isLoadingConversations ? (
            <div className="p-4 text-center bg-warm-300 text-warm-500 dark:text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto mb-3"></div>
              <p>Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-warm-500 dark:text-slate-400">
              No direct messages yet.
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.partnerId}
                onClick={() => navigate(`/messages/${conv.partnerId}`)}
                className={`flex items-center p-3 cursor-pointer border-l-4 border-dark transition-all duration-200
                  ${targetUserId === conv.partnerId ? "border-orange-500 bg-warm-100 dark:bg-slate-700" : "border-transparent hover:bg-warm-100 dark:hover:bg-slate-750"}`}
              >
                {/* Replaced img tag with UserAvatar component */}
                <UserAvatar
                  userId={conv.partnerId}
                  user={{ // Pass a user object structure that UserAvatar expects
                    _id: conv.partnerId,
                    username: conv.partnerUsername,
                    profile: {
                      name: conv.partnerName,
                      avatar: conv.partnerAvatar // Use partnerAvatar if directly available
                    }
                  }}
                  size="md" // Choose 'sm', 'md', 'lg' for size
                  showTooltip={true} // Set to true if you want tooltips on hover
                  getRoleColor={getRoleColor} // Pass role color function
                  getUserRole={getUserPrimaryRole} // Pass role retrieval function
                  className="w-10 h-10 mr-3" // Maintain existing size and margin via className
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-warm-800 dark:text-white truncate">
                      {conv.partnerName || conv.partnerUsername || "Unknown User"}
                    </p>
                    {conv.lastMessage && (
                      <p className="text-xs text-warm-500 dark:text-slate-400">
                        {formatTimeAgo(conv.lastMessage.createdAt)}
                      </p>
                    )}
                  </div>
                  {conv.lastMessage && (
                    <p className="text-sm text-warm-600 dark:text-slate-400 truncate mt-0.5">
                      {conv.lastMessage.content}
                    </p>
                  )}
                </div>
                {conv.unreadCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-orange-500 text-white">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div
        className={`flex-1 flex flex-col bg-background dark:bg-slate-900 ${
          targetUserId ? "flex" : "hidden md:flex"
        }`}
      >
        {targetUserId ? (
          <>
            <div className="bg-white dark:bg-slate-800 p-4 shadow-lg flex items-center justify-between border-b border-warm-200 dark:border-slate-700">
              <button
                onClick={() => navigate('/messages')}
                className=" mr-4 p-2 rounded-full text-warm-600 dark:text-slate-300 hover:bg-warm-100 dark:hover:bg-slate-700 transition-colors md:hidden"
                aria-label="Back to conversations"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              {/* Add UserAvatar to the chat header */}
              <UserAvatar
                userId={targetUser?._id}
                user={targetUser} // Pass the full targetUser object
                size="sm" // Choose appropriate size for header
                showTooltip={true}
                getRoleColor={getRoleColor}
                getUserRole={getUserPrimaryRole}
                className="mr-3" // Add margin for spacing
              />
              <h2 className="text-xl font-semibold flex-grow text-warm-900 dark:text-white truncate">
                {targetUser?.profile?.name || targetUser?.username || "Loading User..."}
              </h2>
              {!isLoadingChat && targetUser ? (
                targetUser.status?.online ? (
                  <span className="flex items-center text-sm text-green-600 dark:text-green-400 ml-4">
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500 mr-2 animate-pulse"></span> Online
                  </span>
                ) : (
                  <span className="flex items-center text-sm text-warm-500 dark:text-slate-400 ml-4">
                    Offline {targetUser.status?.lastLogin && `(Last seen ${formatLastSeen(targetUser.status.lastLogin.date)})`} {/* Access .date property for lastLogin */}
                  </span>
                )
              ) : (
                <span className="text-sm text-warm-500 dark:text-slate-500 ml-4">Loading status...</span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {isLoadingChat ? (
                <div className="text-center text-warm-500 dark:text-slate-400 mt-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto mb-3"></div>
                  <p>Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-warm-500 dark:text-slate-400 mt-10">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message._id}
                    className={`flex ${isMyMessage(message) ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`p-3 rounded-lg max-w-[70%] shadow-md ${
                        isMyMessage(message)
                          ? "bg-slate-600 text-white" // My messages
                          : "bg-warm-100 dark:bg-slate-700 text-warm-900 dark:text-slate-100" // Others' messages
                      }`}
                    >
                      <p className="text-sm break-words">{message.content}</p>
                      <p className={`text-xs mt-1 opacity-75 ${isMyMessage(message) ? 'text-orange-100' : 'text-warm-500 dark:text-slate-400'}`}>
                        {getFormattedTime(message.createdAt)}
                        {isMyMessage(message) && message.readBy && message.readBy.includes(targetUserId) && (
                          <span className="ml-2 text-xs text-orange-100">✓ Read</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleSendMessage}
              className="bg-white dark:bg-slate-800 p-4 border-t border-warm-200 dark:border-slate-700 flex items-center shadow-lg"
            >
              <input
                type="text"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-warm-100 dark:bg-slate-700 text-warm-900 dark:text-white rounded-full px-4 py-2.5 mr-3 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-warm-400 dark:placeholder-slate-400 transition-colors"
                aria-label="Message input"
              />
              <button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-full transition-colors duration-200 shadow-md flex items-center justify-center"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-warm-500 dark:text-slate-500 text-lg p-4">
            Select a conversation to start chatting.
          </div>
        )}
      </div>
    </div>
  );
};