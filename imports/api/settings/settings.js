// imports/api/settings/settings.js
import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

// Settings collection
export const Settings = new Mongo.Collection('settings');

// Settings schema and constants
export const SETTING_KEYS = {
  USER_VERIFICATION_REQUIRED: 'userVerificationRequired',
  SITE_NAME: 'siteName',
  SITE_DESCRIPTION: 'siteDescription',
  ALLOW_REGISTRATION: 'allowRegistration',
  EMAIL_VERIFICATION_REQUIRED: 'emailVerificationRequired'
};

// Default settings
export const DEFAULT_SETTINGS = {
  [SETTING_KEYS.USER_VERIFICATION_REQUIRED]: false,
  [SETTING_KEYS.SITE_NAME]: 'CommunityHub',
  [SETTING_KEYS.SITE_DESCRIPTION]: 'A community platform for everyone',
  [SETTING_KEYS.ALLOW_REGISTRATION]: true,
  [SETTING_KEYS.EMAIL_VERIFICATION_REQUIRED]: true
};

// Helper function to get a setting value
export const getSetting = async (key, defaultValue = null) => {
  if (Meteor.isServer) {
    const setting = await Settings.findOneAsync({ key });
    return setting ? setting.value : (defaultValue !== null ? defaultValue : DEFAULT_SETTINGS[key]);
  }
  
  // For client-side, return from minimongo
  const setting = Settings.findOne({ key });
  return setting ? setting.value : (defaultValue !== null ? defaultValue : DEFAULT_SETTINGS[key]);
};

// Helper function to set a setting value
export const setSetting = async (key, value) => {
  if (!Meteor.isServer) {
    throw new Meteor.Error('not-authorized', 'Settings can only be modified on the server');
  }
  
  return await Settings.upsertAsync(
    { key }, 
    { 
      $set: { 
        value, 
        updatedAt: new Date(),
        updatedBy: Meteor.userId()
      } 
    }
  );
};

// Initialize default settings on server startup
if (Meteor.isServer) {
  Meteor.startup(async () => {
    console.log('🔧 Initializing default settings...');
    
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      const existingSetting = await Settings.findOneAsync({ key });
      if (!existingSetting) {
        await Settings.insertAsync({
          key,
          value,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`✅ Created default setting: ${key} = ${value}`);
      }
    }
    
    console.log('✅ Settings initialization complete');
  });
}
