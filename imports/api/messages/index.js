// Messages collection and methods will be defined here
import { Mongo } from 'meteor/mongo';

export const MessagesCollection = new Mongo.Collection('messages');

// Import methods to make them available
import './methods';
