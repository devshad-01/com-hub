// imports/api/settings/methods.js
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Settings, setSetting, getSetting, SETTING_KEYS } from './settings';
import { hasPermission } from '../users/permissions';

Meteor.methods({
  
  // Update a setting (admin only)
  async 'settings.update'(key, value) {
    check(key, String);
    check(value, Match.Any);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }
    
    // Check if user has permission to update settings
    const canUpdateSettings = await hasPermission(this.userId, 'UPDATE_SETTINGS');
    if (!canUpdateSettings) {
      throw new Meteor.Error('not-authorized', 'You do not have permission to update settings');
    }
    
    // Validate the setting key
    if (!Object.values(SETTING_KEYS).includes(key)) {
      throw new Meteor.Error('invalid-setting', 'Invalid setting key');
    }
    
    // Additional validation for specific settings
    if (key === SETTING_KEYS.USER_VERIFICATION_REQUIRED && typeof value !== 'boolean') {
      throw new Meteor.Error('invalid-value', 'User verification setting must be a boolean');
    }
    
    if (key === SETTING_KEYS.SITE_NAME && (!value || typeof value !== 'string' || value.trim().length === 0)) {
      throw new Meteor.Error('invalid-value', 'Site name cannot be empty');
    }
    
    await setSetting(key, value);
    
    console.log(`⚙️ Setting updated: ${key} = ${value} by user ${this.userId}`);
    
    return { success: true };
  },
  
  // Get a setting value
  async 'settings.get'(key) {
    check(key, String);
    
    return await getSetting(key);
  },
  
  // Get all settings (admin only)
  async 'settings.getAll'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }
    
    // Check if user has permission to view settings
    const canViewSettings = await hasPermission(this.userId, 'ACCESS_ADMIN_DASHBOARD');
    if (!canViewSettings) {
      throw new Meteor.Error('not-authorized', 'You do not have permission to view settings');
    }
    
    const settings = await Settings.find({}).fetchAsync();
    const settingsObj = {};
    
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });
    
    return settingsObj;
  }
  
});
