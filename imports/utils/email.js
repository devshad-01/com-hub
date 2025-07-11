// imports/utils/email.js
import { Meteor } from 'meteor/meteor';

/**
 * Get the correct email "from" address from settings
 * Priority: environment variable > settings.json > default
 */
export function getEmailFromAddress() {
  // Check for environment variable first
  if (process.env.EMAIL_FROM) {
    console.log('📧 Using EMAIL_FROM environment variable:', process.env.EMAIL_FROM);
    return process.env.EMAIL_FROM;
  }
  
  // Check settings.json
  const settingsFrom = Meteor.settings.private?.email?.from;
  if (settingsFrom && settingsFrom !== 'EMAIL_FROM') {
    // If it's not a placeholder, use it
    console.log('📧 Using from address from settings.json:', settingsFrom);
    return settingsFrom;
  }
  
  // Default fallback
  console.log('📧 Using default fallback from address');
  return 'CommunityHub <noreply@communityhub.com>';
}

/**
 * Get the app name from settings
 */
export function getAppName() {
  return Meteor.settings.public?.app?.name || 'CommunityHub';
}
