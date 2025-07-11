import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { NotificationsCollection, NOTIFICATION_TYPES } from './index';

Meteor.methods({
  async 'notifications.create'(notificationData) {
    check(notificationData, {
      userId: String,
      type: String,
      title: String,
      message: String,
      relatedId: String, // ID of the post, message, etc.
      relatedType: String, // 'post', 'message', 'reply'
      fromUserId: String,
      data: Match.Optional(Object) // Allow optional data field
    });

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to create notifications');
    }

    // Don't create notification for yourself
    if (notificationData.userId === this.userId) {
      return null;
    }

    // Check if similar notification already exists (avoid spam)
    const existingNotification = await NotificationsCollection.findOneAsync({
      userId: notificationData.userId,
      type: notificationData.type,
      relatedId: notificationData.relatedId,
      read: false
    });

    if (existingNotification) {
      return existingNotification._id;
    }

    const notificationId = await NotificationsCollection.insertAsync({
      ...notificationData,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return notificationId;
  },

  async 'notifications.markAsRead'(notificationId) {
    check(notificationId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    const notification = await NotificationsCollection.findOneAsync({
      _id: notificationId,
      userId: this.userId
    });

    if (!notification) {
      throw new Meteor.Error('not-found', 'Notification not found');
    }

    await NotificationsCollection.updateAsync(notificationId, {
      $set: {
        read: true,
        readAt: new Date(),
        updatedAt: new Date()
      }
    });

    return true;
  },

  async 'notifications.markAllAsRead'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    await NotificationsCollection.updateAsync(
      { userId: this.userId, read: false },
      {
        $set: {
          read: true,
          readAt: new Date(),
          updatedAt: new Date()
        }
      },
      { multi: true }
    );

    return true;
  },

  async 'notifications.delete'(notificationId) {
    check(notificationId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    const notification = await NotificationsCollection.findOneAsync({
      _id: notificationId,
      userId: this.userId
    });

    if (!notification) {
      throw new Meteor.Error('not-found', 'Notification not found');
    }

    await NotificationsCollection.removeAsync(notificationId);
    return true;
  }
});
