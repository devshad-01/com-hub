// imports/api/DirectMessages/server/publications.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { DirectMessagesCollection } from '../DirectMessagesCollection'; // IMPORTANT: Using the new collection

/**
 * Publishes direct messages between the current logged-in user and a specified target user.
 * Messages are retrieved from the DirectMessagesCollection.
 *
 * @param {string} targetUserId The _id of the other participant in the direct message conversation.
 */
Meteor.publish('directMessages.conversation', function(targetUserId) {
  check(targetUserId, String);

  if (!this.userId) {
    return this.ready();
  }

  return DirectMessagesCollection.find({ // Find from DirectMessagesCollection
    $or: [
      { senderId: this.userId, receiverId: targetUserId },
      { senderId: targetUserId, receiverId: this.userId },
    ],
  }, {
    sort: { createdAt: 1 },
    fields: { content: 1, senderId: 1, receiverId: 1, createdAt: 1, readBy: 1 }
  });
});

/**
 * Publishes a reactive list of direct message conversations for the current user.
 * This uses the native MongoDB driver's aggregation pipeline to provide partner details,
 * last message, and unread count.
 * This does NOT require 'tunguska:aggregate' as it uses rawCollection().aggregate().
 */
Meteor.publish('directMessages.conversationsList', function() {
  const userId = this.userId;
  const self = this;

  if (!userId) {
    return self.ready();
  }

  const clientCollectionName = 'direct_message_conversations'; // Name of the client-side collection

  // Store the list of currently published partner IDs to handle removals
  const publishedPartnerIds = new Set();

  // Function to run the aggregation and update the client-side collection
  const updateConversations = async () => {
    try {
      // --- CRITICAL: Use DirectMessagesCollection.rawCollection().aggregate() ---
      const conversations = await DirectMessagesCollection.rawCollection().aggregate([
        {
          $match: {
            $or: [
              { senderId: userId },
              { receiverId: userId }
            ]
          }
        },
        {
          $group: {
            _id: { // Group by the partner's ID
              $cond: {
                if: { $eq: ['$senderId', userId] },
                then: '$receiverId',
                else: '$senderId'
              }
            },
            lastMessage: { $last: '$$ROOT' }, // Get the full last message document for each group
            unreadCount: { // Calculate unread count for messages received by the current user
              $sum: {
                $cond: [
                  { $and: [
                      { $eq: ['$receiverId', userId] }, // Message was received by current user
                      { $not: { $in: [userId, '$readBy'] } } // And current user has not read it
                  ]},
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $lookup: { // Join with the Meteor.users collection to get partner details
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'partnerInfo'
          }
        },
        {
          $unwind: { // Deconstruct the partnerInfo array, preserving documents if no match
            path: '$partnerInfo',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: { // Project the final shape of the conversation object for the client
            _id: 0, // Remove the default aggregation _id
            partnerId: '$_id',
            partnerUsername: '$partnerInfo.username',
            partnerName: '$partnerInfo.profile.name',
            partnerAvatar: '$partnerInfo.profile.avatar', // Assuming profile.avatar field
            partnerOnline: '$partnerInfo.status.online',
            partnerLastLogin: '$partnerInfo.status.lastLogin', // Assuming status.lastLogin field
            lastMessage: { // Explicitly project fields from the last message
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
          $sort: { 'lastMessage.createdAt': -1 } // Sort conversations by the most recent message
        }
      ]).toArray(); // Use .toArray() for native driver, not .toArrayAsync()

      // Manually manage client-side collection updates for reactive aggregation results
      const newPartnerIds = new Set(conversations.map(c => c.partnerId));

      // Remove conversations that no longer exist
      publishedPartnerIds.forEach(oldId => {
        if (!newPartnerIds.has(oldId)) {
          self.removed(clientCollectionName, oldId);
          publishedPartnerIds.delete(oldId);
        }
      });

      // Add/update existing conversations
      conversations.forEach(conv => {
        if (publishedPartnerIds.has(conv.partnerId)) {
          self.changed(clientCollectionName, conv.partnerId, conv);
        } else {
          self.added(clientCollectionName, conv.partnerId, conv);
          publishedPartnerIds.add(conv.partnerId);
        }
      });

    } catch (error) {
      console.error('Error in directMessages.conversationsList aggregation:', error);
      // It's usually better to log the error and allow the publication to continue than to crash it.
      // self.error(new Meteor.Error('publication-error', 'Failed to retrieve conversations list.'));
    }
  };

  // Set up a reactive observer on the DirectMessagesCollection
  // This will trigger `updateConversations` when any relevant message changes
  const cursor = DirectMessagesCollection.find({
    $or: [
      { senderId: userId },
      { receiverId: userId }
    ]
  }, { fields: { _id: 1, senderId: 1, receiverId: 1, createdAt: 1, readBy: 1 } }); // Only observe relevant fields

  const observer = cursor.observeChanges({
    added: (id, fields) => updateConversations(),
    changed: (id, fields) => updateConversations(),
    removed: (id) => updateConversations()
  });

  // Run the aggregation initially to populate the client-side collection
  updateConversations();

  // Stop the observer when the publication is stopped
  self.onStop(() => {
    observer.stop();
  });

  // Signal that the publication is ready after initial data push
  return self.ready();
});

/**
 * Publishes information about a specific user (used to display the conversation partner's name/profile).
 * This publication exists specifically to provide user details for the DM page header.
 */
Meteor.publish('directMessages.otherUser', function(userId) {
  check(userId, String);

  if (!this.userId) {
    return this.ready();
  }

  return Meteor.users.find(
    { _id: userId },
    { fields: { username: 1, 'profile.name': 1, 'profile.avatar': 1, 'status.online': 1, 'status.lastLogin': 1 } }
  );
});
