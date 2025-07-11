// imports/api/settings/server/publications.js
import { Meteor } from 'meteor/meteor';
import { Settings } from '../settings';
import { hasPermission } from '../../users/permissions';

// Publish settings for admin users
Meteor.publish('settings', async function() {
  if (!this.userId) {
    this.ready();
    return;
  }
  
  // Check if user has admin access
  const canAccess = await hasPermission(this.userId, 'ACCESS_ADMIN_DASHBOARD');
  if (!canAccess) {
    this.ready();
    return;
  }
  
  return Settings.find({});
});

// Publish specific public settings for all users
Meteor.publish('publicSettings', function() {
  // Return only public settings that all users should know about
  return Settings.find({
    key: {
      $in: ['siteName', 'siteDescription', 'allowRegistration']
    }
  });
});
