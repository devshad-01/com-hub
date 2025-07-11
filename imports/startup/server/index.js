// Server startup code
import { Meteor } from 'meteor/meteor';

// Import email configuration
import './email.js';

// Import cloud configuration
import './storage.js';

// Import API modules
import '../../api/users/server';
import '../../api/email';
import { initRoles } from '../../api/users/roles';
import '../../api/settings/server';
import '../../api/forums';
import '../../api/messages/server';
import '../../api/notifications/server';

// Initialize server-specific code here
Meteor.startup(async () => {
  console.log('Server application started');
  
  try {
    // Initialize roles - properly await the async function
    await initRoles();
  } catch (error) {
    console.error("Error during startup:", error);
  }
});
