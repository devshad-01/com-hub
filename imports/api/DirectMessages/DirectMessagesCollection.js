// imports/api/DirectMessages/DirectMessagesCollection.js

import { Mongo } from 'meteor/mongo';

/**
 * @summary The DirectMessagesCollection holds all individual direct messages between two users,
 * separated from the general MessagesCollection.
 * @type {Mongo.Collection}
 */
export const DirectMessagesCollection = new Mongo.Collection('directMessages');

// You might add a schema definition here if you use SimpleSchema
// For example:
// import SimpleSchema from 'simpl-schema';
// DirectMessagesCollection.schema = new SimpleSchema({
//   senderId: { type: String, regEx: SimpleSchema.RegEx.Id },
//   receiverId: { type: String, regEx: SimpleSchema.RegEx.Id },
//   content: { type: String, max: 2000 },
//   createdAt: { type: Date, autoValue: function() { if (this.isInsert) return new Date(); } },
//   readBy: { type: Array, defaultValue: [] },
//   'readBy.$': { type: String, regEx: SimpleSchema.RegEx.Id },
// });
// DirectMessagesCollection.attachSchema(DirectMessagesCollection.schema);
