// imports/startup/server/email.js
import { Meteor } from 'meteor/meteor';
import { Email } from 'meteor/email';
import { getEmailFromAddress, getAppName } from '/imports/utils/email.js';

Meteor.startup(() => {
  // Check environment variables first
  console.log('📧 Environment check:');
  console.log('📧 SMTP_USER:', process.env.SMTP_USER ? 'SET' : 'NOT SET');
  console.log('📧 SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? 'SET' : 'NOT SET');
  console.log('📧 MAIL_URL:', process.env.MAIL_URL ? 'SET' : 'NOT SET');
  console.log('📧 EMAIL_FROM:', process.env.EMAIL_FROM ? 'SET' : 'NOT SET');
  console.log('📧 Configured FROM address:', getEmailFromAddress());
  
  // Get SMTP credentials from environment variables or MAIL_URL
  let smtpUser = process.env.SMTP_USER;
  let smtpPassword = process.env.SMTP_PASSWORD;
  let configSource = 'none';
  
  // If individual variables not set, try to extract from MAIL_URL
  if ((!smtpUser || !smtpPassword) && process.env.MAIL_URL) {
    try {
      const mailUrl = new URL(process.env.MAIL_URL);
      if (mailUrl.username && mailUrl.password) {
        smtpUser = decodeURIComponent(mailUrl.username);
        smtpPassword = decodeURIComponent(mailUrl.password);
        configSource = 'MAIL_URL';
        console.log('📧 Extracted credentials from MAIL_URL');
        console.log('📧 Extracted user:', smtpUser);
      }
    } catch (error) {
      console.log('📧 Failed to parse MAIL_URL:', error.message);
    }
  } else if (smtpUser && smtpPassword) {
    configSource = 'environment_vars';
    console.log('📧 Using individual environment variables');
  }
  
  // Check if email package settings are configured from settings.json
  let emailSettings = Meteor.settings.packages?.email;
  
  // Override with environment credentials if available
  if (smtpUser && smtpPassword && configSource !== 'none') {
    emailSettings = {
      service: 'brevo',
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      user: smtpUser,
      password: smtpPassword
    };
    
    // Also set the package settings for Meteor to use
    if (!Meteor.settings.packages) {
      Meteor.settings.packages = {};
    }
    Meteor.settings.packages.email = emailSettings;
    
    console.log(`📧 Configured email using ${configSource}`);
  } else if (emailSettings && emailSettings.user && emailSettings.password) {
    // Check if settings.json has placeholder values
    if (emailSettings.user === 'SMTP_USER' || emailSettings.password === 'SMTP_PASSWORD') {
      console.log('📧 Settings.json contains placeholder values, not actual credentials');
      emailSettings = null;
      configSource = 'placeholder_detected';
    } else {
      configSource = 'settings_json';
      console.log('📧 Using credentials from settings.json');
    }
  }
  
  console.log('📧 Email configuration startup...');
  console.log('📧 Configuration source:', configSource);
  console.log('📧 Package email settings found:', !!emailSettings);
  
  if (emailSettings) {
    console.log('📧 Email configured successfully');
    console.log('📧 Service:', emailSettings.service || 'Custom SMTP');
    console.log('📧 Host:', emailSettings.host);
    console.log('📧 Port:', emailSettings.port);
    console.log('📧 User:', emailSettings.user);
  } else {
    // For development, we'll use a simple console log method
    console.log('📧 No valid email configuration found - using development mode');
    console.log('📧 In development mode, emails will be logged to console');
    
    // Override Email methods for development
    Email.sendAsync = async function(options) {
      console.log('\n=== EMAIL SENT (Development Mode) ===');
      console.log('To:', options.to);
      console.log('From:', options.from);
      console.log('Subject:', options.subject);
      if (options.html) {
        console.log('HTML Content:');
        console.log(options.html);
      }
      if (options.text) {
        console.log('Text Content:');
        console.log(options.text);
      }
      console.log('======================================\n');
      return { messageId: 'dev-mode-' + Date.now() };
    };
    
    // Also override the synchronous Email.send method
    Email.send = function(options) {
      console.log('\n=== EMAIL SENT (Development Mode) ===');
      console.log('To:', options.to);
      console.log('From:', options.from);
      console.log('Subject:', options.subject);
      if (options.html) {
        console.log('HTML Content:');
        console.log(options.html);
      }
      if (options.text) {
        console.log('Text Content:');
        console.log(options.text);
      }
      console.log('======================================\n');
    };
  }
});
