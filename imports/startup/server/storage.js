import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
  const defaultStorage = Meteor.settings.public?.app?.storage?.default;
  if (defaultStorage === 'cloudinary') {
    const c = Meteor.settings.private?.cloudinary;
    if (!c || !c.cloudname || !c.apikey || !c.apisecret) {
      console.error('==============================');
      console.error('[Startup] Cloudinary credentials are missing or incomplete in settings.');
      console.error('==============================');
    } else {
      console.log('==============================');
      console.log('[Startup] Cloudinary credentials loaded:');
      console.log('cloudname:', c.cloudname);
      console.log('apikey:', c.apikey);
      console.log('apisecret:', c.apisecret);
      console.log('==============================');
    }
  } else if (defaultStorage === 'backblaze') {
    const b = Meteor.settings.private?.backblaze;
    if (!b || !b.keyId || !b.applicationKey || !b.bucketName || !b.apiUrl || !b.downloadUrl) {
      console.error('==============================');
      console.error('[Startup] Backblaze credentials are missing or incomplete in settings.');
      console.error('==============================');
    } else {
      console.log('==============================');
      console.log('[Startup] Backblaze credentials loaded:');
      console.log('keyId:', b.keyId);
      console.log('applicationKey:', b.applicationKey);
      console.log('bucketName:', b.bucketName);
      console.log('apiUrl:', b.apiUrl);
      console.log('downloadUrl:', b.downloadUrl);
      console.log('==============================');
    }
  } else {
    console.warn('==============================');
    console.warn('[Startup] No recognized storage provider set as default.');
    console.warn('==============================');
  }
});
