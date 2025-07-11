// imports/api/settings/index.js
import { Meteor } from 'meteor/meteor';

export { Settings, getSetting, setSetting, SETTING_KEYS, DEFAULT_SETTINGS } from './settings';

// Import server-side code
if (Meteor.isServer) {
  require('./server');
  require('./methods');
}

// Export method names
export const SettingsMethods = {
  update: 'settings.update',
  get: 'settings.get',
  getAll: 'settings.getAll'
};

// Export publication names
export const SettingsPublications = {
  settings: 'settings',
  publicSettings: 'publicSettings'
};
