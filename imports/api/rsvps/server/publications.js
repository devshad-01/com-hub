import { Meteor } from 'meteor/meteor';
import { UserRsvps } from '../rsvps.js'; // Import the UserRsvps collection

// Ensure this publication only runs on the server
if (Meteor.isServer) {
  /**
   * Publishes the RSVP records for the currently logged-in user.
   * This allows a user to see all events they have RSVP'd to, their status, etc.
   */
  Meteor.publish('rsvps.myEvents', function() {
    // Check if a user is logged in
    if (!this.userId) {
      // If not logged in, stop the publication and return no data
      this.ready();
      return;
    }

    // Return all UserRsvps documents where the userId matches the current user's ID
    return UserRsvps.find({ userId: this.userId });
  });
}