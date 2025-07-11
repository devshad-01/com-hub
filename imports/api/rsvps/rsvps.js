// imports/api/rsvps/rsvps.js
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'meteor/aldeed:simple-schema';
import 'meteor/aldeed:collection2/dynamic'; // Assumes you're loading Collection2 via dynamic import

// Create the MongoDB Collection for User RSVPs
export const UserRsvps = new Mongo.Collection('userRsvps');

// Define the schema for the UserRsvps collection
UserRsvps.schema = new SimpleSchema({
  eventId: {
    type: String,
    label: "Event ID",
    // Consider adding a custom validator here to ensure the eventId exists in Events collection
    // regEx: SimpleSchema.RegEx.Id, // If eventId is a Mongo _id
  },
  userId: {
    type: String,
    label: "User ID",
    regEx: SimpleSchema.RegEx.Id, // Ensures it's a valid MongoDB _id format
  },
  status: {
    type: String,
    label: "RSVP Status",
    allowedValues: ['pending_payment', 'confirmed', 'cancelled', 'failed'], // Added 'failed'
    defaultValue: 'pending_payment',
  },
  // --- NEW/UPDATED PAYMENT-RELATED FIELDS ---
  paystackReference: { // The reference used for Paystack initiation
    type: String,
    label: "Paystack Reference",
    optional: true, // Optional because free events won't have it
  },
  amount: { // Amount stored from payment initiation
    type: Number,
    label: "Amount (KES)",
    min: 0,
    optional: true, // Optional for free events
  },
  amountPaid: { // Amount confirmed as paid by Paystack webhook
    type: Number,
    label: "Amount Paid (KES)",
    min: 0,
    optional: true, // Only present after payment confirmed
  },
  paymentConfirmedAt: { // Timestamp of payment confirmation
    type: Date,
    label: "Payment Confirmed At",
    optional: true, // Only present after payment confirmed
  },
  paystackTransactionId: { // Paystack's unique transaction ID
    type: String,
    label: "Paystack Transaction ID",
    optional: true, // Only present after payment confirmed
  },
  paystackGatewayResponse: { // Gateway response from Paystack
    type: String,
    label: "Paystack Gateway Response",
    optional: true, // Stored on success or failure
  },
  failureReason: { // Reason for payment failure
    type: String,
    label: "Payment Failure Reason",
    optional: true, // Only present if payment failed
  },
  // --- END NEW/UPDATED PAYMENT-RELATED FIELDS ---
  createdAt: {
    type: Date,
    label: "Created At",
    autoValue: function() {
      if (this.isInsert) {
        return new Date();
      } else if (this.isUpsert) {
        return { $setOnInsert: new Date() };
      } else {
        this.unset();
      }
    },
  },
  updatedAt: {
    type: Date,
    label: "Updated At",
    autoValue: function() {
      if (this.isUpdate) {
        return new Date();
      }
    },
    optional: true,
  }
});
Collection2.load(UserRsvps, UserRsvps.schema); 