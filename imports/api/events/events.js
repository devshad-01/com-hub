import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'meteor/aldeed:simple-schema';
SimpleSchema.debug = true;
import 'meteor/aldeed:collection2/dynamic';
import { Roles } from 'meteor/alanning:roles'; // Ensure this import is used if Roles are defined globally or here

export const Events = new Mongo.Collection('Events');

// Define schema
const EventsSchema = new SimpleSchema({
  title: {
    type: String,
    label: "Event Title",
    max: 100
  },
  type: {
    type: String,
    label: "Event Type",
    allowedValues: ['workshop', 'meeting', 'social'],
    defaultValue: 'social'
  },
  date: {
    type: String,
    label: "Event Date",
    regEx: SimpleSchema.RegEx.Date
  },
  time: {
    type: String,
    label: "Event Time",
    regEx: /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/
  },
  location: {
    type: String,
    label: "Event Location",
    max: 200
  },
  description: {
    type: String,
    label: "Event Description",
    max: 1000,
    optional: true
  },
  capacity: {
    type: Number,
    label: "Event Capacity",
    min: 0
  },
  registered: {
    type: Number,
    label: "Registered Attendees",
    min: 0,
    defaultValue: 0
  },
  // --- NEW FIELD: Cost ---
  cost: {
    type: Number,
    label: "Event Cost (KES)",
    min: 0,        
    defaultValue: 0 
  },
  // --- END NEW FIELD ---
  createdAt: {
    type: Date,
    label: "Created At",
    autoValue: function() {
      if (this.isInsert) {
        return new Date();
      }
    }
  },
  updatedAt: {
    type: Date,
    label: "Updated At",
    autoValue: function() {
      if (this.isUpdate) {
        return new Date();
      }
    },
    optional: true
  }
});

// Attach schema using the imported function
// Assuming Collection2 is correctly imported and loaded globally or via a specific import.
// If you're using 'meteor/aldeed:collection2/dynamic', ensure it's properly set up.
// Often, you'd just do `Events.attachSchema(EventsSchema);` if Collection2 is attached to Mongo.Collection prototype.
// However, if 'Collection2.load' is the way you're using it, keep it.
// The provided code snippet uses `Collection2.load(Events, EventsSchema);`
// If 'Collection2' is not globally available, you might need:
// import { Collection2 } from 'meteor/aldeed:collection2'; // or similar depending on setup
// For common use, simply `Events.attachSchema(EventsSchema);` after `import 'meteor/aldeed:collection2';`
// For now, assuming `Collection2.load` works in your specific setup based on your code.
// Attach schema using the imported function
Collection2.load(Events, EventsSchema);
