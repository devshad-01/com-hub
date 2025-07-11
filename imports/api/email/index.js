// imports/api/email/index.js
import { Meteor } from 'meteor/meteor';

export { EmailService } from './EmailService.js';

// Import server methods if on server
if (Meteor.isServer) {
  import('./server/methods.js');
}
