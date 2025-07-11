// imports/api/DirectMessages/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { DirectMessagesCollection } from './DirectMessagesCollection'; // IMPORTANT: Using the new collection
import { NotificationHelpers } from '/imports/api/notifications/helpers'; // Helper for creating notifications
import { NOTIFICATION_TYPES } from '/imports/api/notifications'; // Needed for notification type constant

Meteor.methods({
  /**
   * Server method to send a direct message from the current user to a specified receiver.
   * This method uses the new, separate DirectMessagesCollection.
   *
   * @param {string} receiverId The _id of the user who will receive the message.
   * @param {string} content The actual message content.
   */
  async 'directMessages.send'(receiverId, content) {
    check(receiverId, String);
    check(content, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to send direct messages.');
    }

    if (!content.trim()) {
      throw new Meteor.Error('invalid-input', 'Message content cannot be empty.');
    }

    if (this.userId === receiverId) {
      throw new Meteor.Error('invalid-receiver', 'You cannot send a direct message to yourself.');
    }

    const receiverExists = await Meteor.users.findOneAsync(receiverId, { fields: { _id: 1 } });
    if (!receiverExists) {
      throw new Meteor.Error('invalid-receiver', 'Recipient user does not exist.');
    }

    let messageId;
    try {
      messageId = await DirectMessagesCollection.insertAsync({ // Insert into DirectMessagesCollection
        senderId: this.userId,
        receiverId: receiverId,
        content: content.trim(),
        createdAt: new Date(),
        readBy: [this.userId], // Sender reads it immediately
      });
    } catch (dbError) {
      console.error('Error inserting direct message:', dbError);
      throw new Meteor.Error('db-insert-failed', 'Failed to save direct message.');
    }

    if (messageId) {
      try {
        // Create a notification for the recipient
        await NotificationHelpers.createForNewMessage(messageId, this.userId, receiverId, content);
      } catch (notificationError) {
        console.error('Error creating notification for direct message:', notificationError);
      }
    }

    return messageId;
  },

  /**
   * Server method to mark direct messages in a conversation as read by the current user.
   *
   * @param {string} conversationPartnerId The ID of the other user in the conversation.
   */
  async 'directMessages.markAsRead'(conversationPartnerId) {
    check(conversationPartnerId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to mark messages as read.');
    }

    try {
      const numUpdated = await DirectMessagesCollection.updateAsync( // Update DirectMessagesCollection
        {
          senderId: conversationPartnerId,
          receiverId: this.userId,
          readBy: { $ne: this.userId } // Only mark if not already read by this user
        },
        {
          $addToSet: { readBy: this.userId } // Add current user to readBy array
        },
        { multi: true }
      );
      console.log(`Marked ${numUpdated} direct messages from ${conversationPartnerId} as read by ${this.userId}`);
      return numUpdated;
    } catch (error) {
      console.error('Error marking direct messages as read:', error);
      throw new Meteor.Error('mark-read-failed', 'Failed to mark messages as read.');
    }
  },

  /**
   * Server method to get a list of direct message conversations.
   * This method is largely for one-time fetch or testing, as reactive lists are
   * typically provided by publications like 'directMessages.conversationsList'.
   * Keeping it here for completeness if needed for other non-reactive purposes.
   */
  async 'directMessages.getConversations'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to view conversations.');
    }

    try {
      // This aggregation is now primarily handled by the 'directMessages.conversationsList' publication
      const conversations = await DirectMessagesCollection.aggregate([ // Use aggregate on DirectMessagesCollection
        {
          $match: {
            $or: [
              { senderId: this.userId },
              { receiverId: this.userId }
            ]
          }
        },
        {
          $group: {
            _id: {
              $cond: {
                if: { $eq: ['$senderId', this.userId] },
                then: '$receiverId',
                else: '$senderId'
              }
            },
            lastMessage: { $last: '$$ROOT' },
            unreadCount: {
              $sum: {
                $cond: [
                  { $and: [
                      { $eq: ['$receiverId', this.userId] },
                      { $not: { $in: [this.userId, '$readBy'] } }
                  ]},
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'partnerInfo'
          }
        },
        {
          $unwind: { path: '$partnerInfo', preserveNullAndEmptyArrays: true }
        },
        {
          $project: {
            _id: 0,
            partnerId: '$_id',
            partnerUsername: '$partnerInfo.username',
            partnerName: '$partnerInfo.profile.name',
            partnerAvatar: '$partnerInfo.profile.avatar',
            partnerOnline: '$partnerInfo.status.online',
            partnerLastLogin: '$partnerInfo.status.lastLogin',
            lastMessage: {
              _id: '$lastMessage._id',
              content: '$lastMessage.content',
              senderId: '$lastMessage.senderId',
              receiverId: '$lastMessage.receiverId',
              createdAt: '$lastMessage.createdAt',
              readBy: '$lastMessage.readBy'
            },
            unreadCount: 1
          }
        },
        {
          $sort: { 'lastMessage.createdAt': -1 }
        }
      ]).toArrayAsync();

      return conversations;
    } catch (error) {
      console.error('Error in directMessages.getConversations method:', error);
      throw new Meteor.Error('conversations-fetch-failed', 'Failed to retrieve direct message conversations.');
    }
  },
});
