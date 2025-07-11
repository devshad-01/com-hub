import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { StorageFactory } from '../StorageFactory';

Meteor.methods({
  async 'storage.uploadImage'(base64Data, options = {}) {
    check(base64Data, String);
    check(options, {
      context: Match.Optional(String),
      filename: Match.Optional(String),
      folder: Match.Optional(String)
    });

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to upload images');
    }

    try {
      const storageType = Meteor.settings.public?.app?.storage?.default || 'cloudinary';
      const storage = StorageFactory.create(storageType);
      
      return await storage.uploadImage(base64Data, options);
    } catch (error) {
      console.error('Image upload error:', error);
      throw new Meteor.Error('upload-failed', error.message);
    }
  },

  async 'storage.deleteImage'(imageInfo) {
    check(imageInfo, Match.OneOf(String, Object));

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to delete images');
    }

    try {
      const storageType = Meteor.settings.public?.app?.storage?.default || 'cloudinary';
      const storage = StorageFactory.create(storageType);
      // For Cloudinary, imageInfo is a string (publicId). For Backblaze, it's an object.
      return await storage.deleteImage(imageInfo);
    } catch (error) {
      console.error('Image deletion error:', error);
      throw new Meteor.Error('delete-failed', error.message);
    }
  }
});