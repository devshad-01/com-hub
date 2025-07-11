// imports/api/notifications/helpers.js

import { Meteor } from 'meteor/meteor';
import { NOTIFICATION_TYPES } from './index'; // Make sure this path is correct

// Helper functions to create notifications
export const NotificationHelpers = {
  async createForNewPost(postId, postTitle, authorId, categoryId) {
    if (!Meteor.isServer) return;

    const users = await Meteor.users.find({
      _id: { $ne: authorId },
      'status.online': true
    }, {
      fields: { _id: 1 },
      limit: 50
    }).fetchAsync();

    const notifications = users.map(user => ({
      userId: user._id,
      type: NOTIFICATION_TYPES.NEW_POST,
      title: 'New Post Created',
      message: `"${postTitle}" was posted in the forum`,
      relatedId: postId,
      relatedType: 'post',
      fromUserId: authorId
    }));

    for (const notification of notifications) {
      try {
        await Meteor.callAsync('notifications.create', notification);
      } catch (error) {
        console.error('Error creating new post notification:', error);
      }
    }
  },

  /**
   * Creates a notification specifically for a new direct message.
   * This is called by the 'directMessages.send' method.
   *
   * @param {string} messageId The ID of the newly created direct message.
   * @param {string} senderId The ID of the user who sent the message.
   * @param {string} receiverId The ID of the user who received the message.
   * @param {string} messageContent The content of the message for preview.
   */
  async createForNewMessage(messageId, senderId, receiverId, messageContent) {
    if (!Meteor.isServer) return;

    if (receiverId && receiverId !== senderId) {
      try {
        const senderUser = await Meteor.users.findOneAsync(senderId, {
          fields: { 'profile.name': 1, username: 1 }
        });
        const senderName = senderUser?.profile?.name || senderUser?.username || 'Someone';

        await Meteor.callAsync('notifications.create', {
          userId: receiverId,
          type: NOTIFICATION_TYPES.NEW_MESSAGE, // Type set to 'new_message'
          title: 'New Direct Message',
          message: `${senderName} sent you a message: "${messageContent.substring(0, 70)}${messageContent.length > 70 ? '...' : ''}"`,
          relatedId: messageId,
          relatedType: 'message',
          fromUserId: senderId // Essential for navigation
        });
      } catch (error) {
        console.error('Error creating new direct message notification:', error);
      }
    }
  },

  async createForNewReply(replyId, postId, replyContent, authorId, postAuthorId) {
    if (!Meteor.isServer) return;

    if (postAuthorId && postAuthorId !== authorId) {
      const truncatedContent = replyContent.length > 50
        ? replyContent.substring(0, 50) + '...'
        : replyContent;

      try {
        await Meteor.callAsync('notifications.create', {
          userId: postAuthorId,
          type: NOTIFICATION_TYPES.NEW_REPLY,
          title: 'New Reply to Your Post',
          message: `Someone replied: "${truncatedContent}"`,
          relatedId: postId,
          relatedType: 'post',
          fromUserId: authorId
        });
      } catch (error) {
        console.error('Error creating reply notification:', error);
      }
    }
  },

  async createForPostLike(postId, postTitle, likedUserId, postAuthorId) {
    if (!Meteor.isServer) return;

    if (postAuthorId && postAuthorId !== likedUserId) {
      try {
        await Meteor.callAsync('notifications.create', {
          userId: postAuthorId,
          type: NOTIFICATION_TYPES.POST_LIKED,
          title: 'Your Post Was Liked',
          message: `Someone liked your post: "${postTitle}"`,
          relatedId: postId,
          relatedType: 'post',
          fromUserId: likedUserId
        });
      } catch (error) {
        console.error('Error creating like notification:', error);
      }
    }
  },

  async createForMention(mentionedUserId, fromUserId, contentType, relatedId, title, content) {
    if (!mentionedUserId || !fromUserId) return;

    try {
      const fromUser = await Meteor.users.findOneAsync(fromUserId, {
        fields: { 'profile.name': 1, username: 1 }
      });

      const fromUserName = fromUser?.profile?.name || fromUser?.username || 'Someone';

      let notificationTitle = title;
      let notificationMessage = content;

      switch (contentType) {
        case 'post':
          notificationTitle = `${fromUserName} mentioned you in a post`;
          notificationMessage = `"${title}"`;
          break;
        case 'reply':
          notificationTitle = `${fromUserName} mentioned you in a reply`;
          notificationMessage = content.substring(0, 100) + (content.length > 100 ? '...' : '');
          break;
        case 'message': // Mention in a direct message
          notificationTitle = `${fromUserName} mentioned you in chat`;
          notificationMessage = content.substring(0, 100) + (content.length > 100 ? '...' : '');
          break;
      }

      await Meteor.callAsync('notifications.create', {
        userId: mentionedUserId,
        type: NOTIFICATION_TYPES.MENTION,
        title: notificationTitle,
        message: notificationMessage,
        relatedId: relatedId,
        relatedType: contentType,
        fromUserId: fromUserId,
        data: {
          contentType,
          content: content.substring(0, 200)
        }
      });
    } catch (error) {
      console.error('Error creating mention notification:', error);
    }
  },

  async createForMessageReaction(userId, reactingUserId, messageId, emoji) {
    if (!Meteor.isServer) return;

    if (userId === reactingUserId) return;

    try {
      const reactingUser = await Meteor.users.findOneAsync(reactingUserId, {
        fields: { username: 1, 'profile.name': 1 }
      });

      const userName = reactingUser?.profile?.name || reactingUser?.username || 'Someone';

      await Meteor.callAsync('notifications.create', {
        userId: userId,
        type: NOTIFICATION_TYPES.MESSAGE_REACTION,
        title: 'New Reaction',
        message: `${userName} reacted with ${emoji} to your message`,
        relatedId: messageId,
        relatedType: 'message',
        fromUserId: reactingUserId,
        data: { emoji }
      });
    } catch (error) {
      console.error('Error creating reaction notification:', error);
    }
  },

  detectMentions(text) {
    if (!text) return [];

    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }

    return [...new Set(mentions)];
  },

  async findUsersByUsernames(usernames) {
    if (!usernames || usernames.length === 0) return [];

    return await Meteor.users.find({
      username: { $in: usernames }
    }, {
      fields: { _id: 1, username: 1, 'profile.name': 1 }
    }).fetchAsync();
  },

  async createNotification(notificationData) {
    if (!Meteor.isServer) return;

    try {
      return await Meteor.callAsync('notifications.create', notificationData);
    } catch (error) {
      console.error('Error creating generic notification:', error);
      return null;
    }
  },
};
