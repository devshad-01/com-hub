import { Meteor } from 'meteor/meteor';
import { CloudinaryStorage } from './CloudinaryStorage';
import { BackblazeStorage } from './BackblazeStorage';

export class StorageFactory {
  static create(storageType) {
    switch (storageType) {
      case 'cloudinary':
        return new CloudinaryStorage();
      case 'backblaze':
        return new BackblazeStorage();
      default:
        throw new Meteor.Error('invalid-storage', 'Invalid storage type specified');
    }
  }

  static getDefaultStorage() {
    const storageType = Meteor.settings.public?.app?.storage?.default || 'cloudinary';
    return StorageFactory.create(storageType);
  }
}