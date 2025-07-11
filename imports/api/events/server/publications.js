// imports/api/events/server/publications.js

import { Meteor } from 'meteor/meteor';
import { Events } from '../events.js';
import { UserRsvps } from '/imports/api/rsvps/rsvps.js'; 

if (Meteor.isServer) {
  /**
   * Publishes ALL events to the client, including necessary fields.
   * The client will handle categorizing these into upcoming/past.
   */
  Meteor.publish('events.all', function() {
    return Events.find({}, {
      fields: {
        _id: 1, // Always include _id
        title: 1,
        type: 1,
        date: 1,
        time: 1,
        location: 1,
        description: 1,
        capacity: 1,
        registered: 1,
        cost: 1 
      },
      sort: { date: 1, time: 1 }
    });
  });

}
