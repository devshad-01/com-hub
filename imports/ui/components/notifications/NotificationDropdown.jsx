// imports/ui/components/NotificationDropdown.jsx

import React from "react";
import { useTracker } from "meteor/react-meteor-data";
import { Meteor } from "meteor/meteor";
import { useNavigate } from "react-router-dom";
import { Bell, MessageSquare, Heart, User, FileText, Clock, CalendarCheck } from "lucide-react";
import { NotificationsCollection } from "/imports/api/notifications"; // Ensure this path is correct

export const NotificationDropdown = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const { notifications, unreadCount, isLoading } = useTracker(() => {
    const handle = Meteor.subscribe("userNotifications");
    const notificationsList = NotificationsCollection.find(
      { userId: Meteor.userId() },
      {
        sort: { createdAt: -1 },
        limit: 20,
      },
    ).fetch();

    const unread = NotificationsCollection.find({
      userId: Meteor.userId(),
      read: false,
    }).count();

    return {
      notifications: notificationsList,
      unreadCount: unread,
      isLoading: !handle.ready(),
    };
  }, []);

  const handleMarkAsRead = (notificationId) => {
    if (notificationId) {
      // --- IMPORTANT: Ensure Meteor.callAsync is used correctly without a direct callback ---
      // It should be awaited or use .then/.catch if this function is async
      // For simplicity in this `handleMarkAsRead` callback (which is NOT async), we'll use .then/.catch
      Meteor.callAsync("notifications.markAsRead", notificationId)
        .then(() => {
          // Success, nothing explicitly needed here, reactivity will update UI
        })
        .catch(error => {
          console.error("Error marking notification as read:", error);
        });
    }
  };

  const handleMarkAllAsRead = () => {
    // --- IMPORTANT: Ensure Meteor.callAsync is used correctly without a direct callback ---
    Meteor.callAsync("notifications.markAllAsRead")
      .then(() => {
        // Success
      })
      .catch(error => {
        console.error("Error marking all notifications as read:", error);
      });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "new_post":
        return <FileText className="w-4 h-4 text-blue-400" />;
      case "post_liked":
        return <Heart className="w-4 h-4 text-red-400" />;
      case "mention":
        return <User className="w-4 h-4 text-yellow-400" />;
      case "new_message":
        return <MessageSquare className="w-4 h-4 text-green-400" />;
      case "new_reply":
        return <MessageSquare className="w-4 h-4 text-purple-400" />;
      case "new_event":
        return <CalendarCheck className="w-4 h-4 text-orange-400" />;
      case "message_reaction":
        return <Heart className="w-4 h-4 text-pink-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatTimeAgo = (date) => {
    if (!date) return "";
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification._id); // This will call the async method
    }

    try {
      switch (notification.type) {
        case "new_post":
        case "post_liked":
          if (notification.relatedId) {
            navigate(`/forum/post/${notification.relatedId}`);
          }
          break;
        case "new_reply":
          if (notification.relatedType === "post" && notification.relatedId) {
             navigate(`/forum/post/${notification.relatedId}`); // Modified this line
          } else if (notification.relatedType === "message" && notification.fromUserId) {
            navigate(`/messages/${notification.fromUserId}`); // CRITICAL: This is the navigation for DMs
          } else {
            console.warn("Unhandled 'new_reply' notification structure or missing data:", notification);
          }
          break;
        case "new_message": // CRITICAL: This case handles new direct messages
          if (notification.fromUserId) {
             navigate(`/messages/${notification.fromUserId}`); // CRITICAL: Navigates to DM page using fromUserId
          } else {
             console.warn("'new_message' notification missing fromUserId:", notification);
          }
          break;
        case "mention":
          if (notification.relatedType === "post" && notification.relatedId) {
            navigate(`/forum/post/${notification.relatedId}`);
          } else if (notification.relatedType === "message" && notification.fromUserId) {
            navigate(`/messages/${notification.fromUserId}`); // CRITICAL: Navigates to DM page for message mentions
          } else {
            console.warn("Unhandled 'mention' notification structure or missing data:", notification);
          }
          break;
        case "new_event":
          if (notification.relatedId) {
            navigate(`/events/${notification.relatedId}`);
          }
          break;
        case "message_reaction":
          if (notification.fromUserId) {
            navigate(`/messages/${notification.fromUserId}`); // CRITICAL: Navigates to DM page for message reactions
          } else {
             console.warn("'message_reaction' notification missing fromUserId:", notification);
          }
          break;
        default:
          console.log("Unknown notification type or missing navigation logic:", notification.type, notification);
      }
    } catch (error) {
      console.error("Navigation error during notification click:", error);
    }

    onClose(); // Close the dropdown after navigation attempt
  };

  if (!isOpen) return null;

  return (
    <div className="absolute -right-3/4  mt-2 w-80 sm:w-96 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden z-50 transform origin-top-right transition-all duration-200 animate-in fade-in-0 zoom-in-95">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 bg-slate-750">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors px-2 py-1 rounded-md hover:bg-slate-700/50"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
        {isLoading ? (
          <div className="px-4 py-8 text-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-3"></div>
            <p className="text-sm">Loading notifications...</p>
          </div>
        ) : notifications.length > 0 ? (
          <div className="divide-y divide-slate-700/50">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                className={`px-4 py-3 hover:bg-slate-750 cursor-pointer border-l-4 transition-all duration-200 ${
                  !notification.read ? "border-blue-500 bg-slate-750/50" : "border-transparent"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5 p-2 rounded-full bg-slate-700/50">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm leading-snug ${
                        !notification.read ? "font-medium text-white" : "text-slate-300"
                      }`}
                    >
                      {notification.title}
                    </p>
                    {notification.message && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{notification.message}</p>
                    )}
                    <div className="flex items-center mt-2 text-xs text-slate-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatTimeAgo(notification.createdAt)}
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-10 text-center text-slate-400">
            <div className="bg-slate-700/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-sm font-medium">No notifications</p>
            <p className="text-xs text-slate-500 mt-1">We'll notify you when something happens</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-700 bg-slate-750">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center space-x-2 text-xs font-medium text-slate-400 hover:text-slate-300 transition-colors py-1 hover:bg-slate-700/50 rounded-md"
          >
            <span>View all notifications</span>
          </button>
        </div>
      )}
    </div>
  );
};
