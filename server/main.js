import { Meteor } from 'meteor/meteor';
import '/imports/startup/server';
//import './api-methods.js';

import '../imports/api/paystack/server/paystack-webhook'; 

// Core API Imports
import '/imports/api/users';
import '../imports/api/messages'; // Your existing MessagesCollection (for general chat)
import '../imports/api/notifications'; // Notifications Collection

// Events API
import '../imports/api/events/events.js';
import '../imports/api/events/server/publications.js';
import '../imports/api/events/methods.js';

// RSVPs API
import '../imports/api/rsvps/rsvps.js';
import '../imports/api/rsvps/server/publications.js';

// Notification Server Logic
import '../imports/api/notifications/server/publications.js';
import '../imports/api/notifications/methods.js';
import '../imports/api/notifications/helpers.js';
// In your server/main.js, make sure you're importing the storage methods:
import '../imports/api/storage/server/methods';

// Direct Messages (new separate collection, methods, and publications)
import '../imports/api/DirectMessages/DirectMessagesCollection.js';
import '../imports/api/DirectMessages/methods.js';
// Direct Message Publications
import '../imports/api/DirectMessages/server/publications.js';

// Your existing general messages methods
import '../imports/api/messages/methods.js'; // Keep this for your general chat methods

// @ts-ignore - Meteor 3 TypeScript compatibility for alanning:roles
import { Roles } from 'meteor/alanning:roles';

Meteor.startup(async () => {
  console.log('Server started');
});
