import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Buffer } from 'buffer';
import B2 from 'backblaze-b2';

export class BackblazeStorage {
  constructor() {
    if (!Meteor.settings.private?.backblaze) {
      throw new Meteor.Error('backblaze-not-configured', 'Backblaze credentials not configured');
    }

    this.b2 = new B2({
      applicationKeyId: Meteor.settings.private.backblaze.keyId,
      applicationKey: Meteor.settings.private.backblaze.applicationKey,
    });

    this.bucketName = Meteor.settings.private.backblaze.bucketName;
    this.bucketId = null;
    this.authorized = false;
  }

  async authorize() {
    if (this.authorized) return;

    try {
      await this.b2.authorize();
      const buckets = (await this.b2.listBuckets()).data.buckets;
      const bucket = buckets.find(b => b.bucketName === this.bucketName);
      
      if (!bucket) {
        throw new Meteor.Error('bucket-not-found', `Bucket ${this.bucketName} not found`);
      }
      
      this.bucketId = bucket.bucketId;
      this.authorized = true;
    } catch (err) {
      throw new Meteor.Error('backblaze-auth-failed', err.message);
    }
  }

  async uploadImage(base64Data, options = {}) {
    check(base64Data, String);
    check(options, {
      folder: Match.Optional(String),
      filename: Match.Optional(String),
      context: Match.Optional(String)
    });

    await this.authorize();

    const fileName = options.filename || `image_${Date.now()}`;
    const folder = options.folder ? `${options.folder}/` : '';
    const fullFileName = `${folder}${fileName}`;

    try {
      // Extract content type and base64 data
      let base64String = base64Data;
      let contentType = 'image/jpeg'; // default
      const matches = base64Data.match(/^data:(image\/[^;]+);base64,(.+)$/);
      if (matches) {
        contentType = matches[1];
        base64String = matches[2];
      } else {
        // fallback: if no prefix, assume jpeg
        base64String = base64Data.split(',')[1] || base64Data;
      }
      const buffer = Buffer.from(base64String, 'base64');

      // Get upload URL
      const uploadUrlResp = await this.b2.getUploadUrl({ bucketId: this.bucketId });
      
      // Upload file
      const uploadResp = await this.b2.uploadFile({
        uploadUrl: uploadUrlResp.data.uploadUrl,
        uploadAuthToken: uploadUrlResp.data.authorizationToken,
        fileName: fullFileName,
        data: buffer,
        contentType // use detected type
      });

      if (!uploadResp?.data?.fileId) {
        throw new Meteor.Error('upload-failed', 'Backblaze did not return a fileId');
      }

      const baseUrl = Meteor.settings.private?.backblaze?.downloadUrl || `https://f005.backblazeb2.com`;
      const fileUrl = `${baseUrl}/file/${this.bucketName}/${fullFileName.split('/').map(encodeURIComponent).join('/')}`;
      
      return {
        url: fileUrl,
        publicId: uploadResp.data.fileId,
        size: buffer.length,
        fileName: fullFileName
      };
    } catch (err) {
      throw new Meteor.Error('backblaze-upload-failed', err.message);
    }
  }

  async deleteImage({ fileId, fileName }) {
    if (!fileId || !fileName) {
      throw new Meteor.Error('backblaze-delete-invalid-args', `Both fileId and fileName are required. Received: fileId=${fileId}, fileName=${fileName}`);
    }
    check(fileId, String);
    check(fileName, String);
    
    await this.authorize();

    try {
      await this.b2.deleteFileVersion({
        fileId,
        fileName
      });
      return true;
    } catch (err) {
      throw new Meteor.Error('backblaze-delete-failed', err.message);
    }
  }
}