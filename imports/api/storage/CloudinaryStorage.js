import { Meteor } from 'meteor/meteor';
import cloudinary from 'cloudinary';
import { check, Match } from 'meteor/check';

export class CloudinaryStorage {
  constructor() {
    // Use the keys as they appear in your settings.json
    const config = Meteor.settings.private?.cloudinary || {};
    console.log('Cloudinary config:', config); // Optional: for debugging
    cloudinary.v2.config({
      cloud_name: config.cloudname,
      api_key: config.apikey,
      api_secret: config.apisecret
    });
    this.cloudinary = cloudinary.v2;
  }

  async uploadImage(base64Data, options = {}) {
    check(base64Data, String);
    check(options, {
      folder: Match.Optional(String),
      filename: Match.Optional(String),
      context: Match.Optional(String)
    });

    const folder = options.folder || Meteor.settings.public?.cloudinary?.defaultFolder || 'community_uploads';
    const publicId = options.filename || `image_${Date.now()}`;

    try {
      const uploadOptions = {
        folder,
        public_id: publicId,
        resource_type: 'auto',
        overwrite: false
      };
      if (options.context) {
        uploadOptions.context = {
          custom: { context: options.context }
        };
      }
      const result = await this.cloudinary.uploader.upload(base64Data, uploadOptions);
      return {
        url: result.secure_url,
        publicId: result.public_id,
        size: result.bytes,
        format: result.format,
        width: result.width,
        height: result.height
      };
    } catch (err) {
      throw new Meteor.Error('cloudinary-upload-failed', err.message);
    }
  }

  async deleteImage(publicId) {
    check(publicId, String);

    try {
      await new Promise((resolve, reject) => {
        this.cloudinary.uploader.destroy(publicId, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });
      });
      return true;
    } catch (err) {
      throw new Meteor.Error('cloudinary-delete-failed', err.message);
    }
  }
}