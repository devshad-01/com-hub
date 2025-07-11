import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { MessagesCollection } from './index';
import { NotificationHelpers } from '../notifications/helpers';

Meteor.methods({
  async 'messages.sendGeneral'(messageData) {
    console.log('Method called with:', messageData);
    
    // Basic validation
    if (!messageData || typeof messageData !== 'object') {
      throw new Meteor.Error('invalid-data', 'Invalid message data');
    }
    
    check(messageData, {
      content: String
    });

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to send messages');
    }

    const content = messageData.content?.trim();
    if (!content || content.length === 0) {
      throw new Meteor.Error('invalid-content', 'Message content cannot be empty');
    }

    if (content.length > 500) {
      throw new Meteor.Error('content-too-long', 'Message content cannot exceed 500 characters');
    }

    try {
      // Check rate limiting - max 10 messages per minute
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const recentMessagesCount = await MessagesCollection.find({
        userId: this.userId,
        type: 'general',
        createdAt: { $gte: oneMinuteAgo }
      }).countAsync();

      if (recentMessagesCount >= 10) {
        throw new Meteor.Error('rate-limit', 'Too many messages. Please wait before sending another message.');
      }

      const messageId = await MessagesCollection.insertAsync({
        content: content,
        userId: this.userId,
        type: 'general',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log('Message inserted with ID:', messageId);
      
      // Create notifications for new message
      if (Meteor.isServer) {
        await NotificationHelpers.createForNewMessage(messageId, content, this.userId);
        
        // Detect and create mention notifications
        const mentions = NotificationHelpers.detectMentions(content);
        if (mentions.length > 0) {
          const mentionedUsers = await NotificationHelpers.findUsersByUsernames(mentions);
          for (const mentionedUser of mentionedUsers) {
            if (mentionedUser._id !== this.userId) { // Don't notify self
              await NotificationHelpers.createForMention(
                mentionedUser._id,
                this.userId,
                'message',
                messageId,
                'You were mentioned in chat',
                content
              );
            }
          }
        }
      }
      
      return messageId;
    } catch (error) {
      console.error('Error in messages.sendGeneral method:', error);
      throw error;
    }
  },

  async 'messages.addReaction'(messageId, emoji) {
    // Check if user is logged in
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to react to messages');
    }

    // Validate inputs
    check(messageId, String);
    check(emoji, String);

    try {
      const message = await MessagesCollection.findOneAsync(messageId);
      
      if (!message) {
        throw new Meteor.Error('not-found', 'Message not found');
      }

      // Check if user has already reacted with this emoji
      const existingReaction = message.reactions && 
        message.reactions.find(r => r.emoji === emoji && r.userIds.includes(this.userId));

      if (existingReaction) {
        // Remove user's reaction
        await MessagesCollection.updateAsync(
          { _id: messageId, "reactions.emoji": emoji },
          { 
            $pull: { "reactions.$.userIds": this.userId },
          }
        );

        // If no users are left for this reaction, remove the entire reaction
        await MessagesCollection.updateAsync(
          { _id: messageId },
          { 
            $pull: { reactions: { userIds: { $size: 0 } } }
          }
        );
      } else {
        // Check if this emoji reaction already exists
        if (message.reactions && message.reactions.some(r => r.emoji === emoji)) {
          // Add user to existing reaction
          await MessagesCollection.updateAsync(
            { _id: messageId, "reactions.emoji": emoji },
            { 
              $addToSet: { "reactions.$.userIds": this.userId }
            }
          );
        } else {
          // Create new reaction
          await MessagesCollection.updateAsync(
            { _id: messageId },
            { 
              $push: { 
                reactions: { 
                  emoji: emoji, 
                  userIds: [this.userId] 
                } 
              },
              $set: { updatedAt: new Date() }
            }
          );
        }

        // Don't send notification if user is reacting to their own message
        if (message.userId !== this.userId) {
          await NotificationHelpers.createForMessageReaction(
            message.userId,
            this.userId,
            messageId,
            emoji
          );
        }
      }

      return true;
    } catch (error) {
      console.error('Error in messages.addReaction method:', error);
      throw error;
    }
  },

  // Direct messaging methods
  async 'messages.sendDirect'(messageData) {
    check(messageData, {
      content: String,
      recipientId: String
    });

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to send messages');
    }

    if (this.userId === messageData.recipientId) {
      throw new Meteor.Error('invalid-recipient', 'You cannot send a message to yourself');
    }

    const content = messageData.content?.trim();
    if (!content || content.length === 0) {
      throw new Meteor.Error('invalid-content', 'Message content cannot be empty');
    }

    if (content.length > 1000) {
      throw new Meteor.Error('content-too-long', 'Message content cannot exceed 1000 characters');
    }

    // Verify recipient exists
    const recipient = await Meteor.users.findOneAsync(messageData.recipientId);
    if (!recipient) {
      throw new Meteor.Error('user-not-found', 'Recipient not found');
    }

    try {
      // Rate limiting for direct messages - max 20 per hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentMessagesCount = await MessagesCollection.find({
        senderId: this.userId,
        type: 'direct',
        createdAt: { $gte: oneHourAgo }
      }).countAsync();

      if (recentMessagesCount >= 20) {
        throw new Meteor.Error('rate-limit', 'Too many direct messages. Please wait before sending another message.');
      }

      const messageId = await MessagesCollection.insertAsync({
        content: content,
        senderId: this.userId,
        recipientId: messageData.recipientId,
        type: 'direct',
        read: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Create notification for recipient
      if (Meteor.isServer) {
        const sender = await Meteor.users.findOneAsync(this.userId);
        await NotificationHelpers.createNotification({
          userId: messageData.recipientId,
          type: 'direct_message',
          title: 'New Message',
          message: `${sender?.profile?.name || sender?.username || 'Someone'} sent you a message`,
          relatedId: messageId,
          relatedType: 'message',
          fromUserId: this.userId
        });
      }

      return messageId;
    } catch (error) {
      console.error('Error in messages.sendDirect method:', error);
      throw error;
    }
  },

  async 'messages.markAsRead'(conversationUserId) {
    check(conversationUserId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    try {
      // Mark all unread messages from the conversation user as read
      await MessagesCollection.updateAsync(
        {
          type: 'direct',
          senderId: conversationUserId,
          recipientId: this.userId,
          read: false
        },
        {
          $set: { 
            read: true,
            readAt: new Date()
          }
        },
        { multi: true }
      );

      return true;
    } catch (error) {
      console.error('Error in messages.markAsRead method:', error);
      throw error;
    }
  },

  async 'messages.getConversations'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    try {
      // Get unique conversation partners
      const sent = await MessagesCollection.find({
        senderId: this.userId,
        type: 'direct'
      }, {
        fields: { recipientId: 1, createdAt: 1 },
        sort: { createdAt: -1 }
      }).fetchAsync();

      const received = await MessagesCollection.find({
        recipientId: this.userId,
        type: 'direct'
      }, {
        fields: { senderId: 1, createdAt: 1 },
        sort: { createdAt: -1 }
      }).fetchAsync();

      // Combine and get unique user IDs
      const userIds = new Set();
      sent.forEach(msg => userIds.add(msg.recipientId));
      received.forEach(msg => userIds.add(msg.senderId));

      // Get conversation details for each user
      const conversations = [];
      for (const userId of userIds) {
        const lastMessage = await MessagesCollection.findOneAsync({
          type: 'direct',
          $or: [
            { senderId: this.userId, recipientId: userId },
            { senderId: userId, recipientId: this.userId }
          ]
        }, { sort: { createdAt: -1 } });

        const unreadCount = await MessagesCollection.find({
          type: 'direct',
          senderId: userId,
          recipientId: this.userId,
          read: false
        }).countAsync();

        conversations.push({
          userId,
          lastMessage,
          unreadCount
        });
      }

      // Sort by last message time
      conversations.sort((a, b) => {
        const aTime = a.lastMessage?.createdAt || new Date(0);
        const bTime = b.lastMessage?.createdAt || new Date(0);
        return bTime - aTime;
      });

      return conversations;
    } catch (error) {
      console.error('Error in messages.getConversations method:', error);
      throw error;
    }
  }
});