// imports/api/events/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Events } from './events.js'; // Assuming correct path to Events collection
import { UserRsvps } from '../rsvps/rsvps.js'; // Assuming correct path to UserRsvps collection
import { Roles } from 'meteor/alanning:roles';
import { ROLES } from '../users/roles'; // Assuming correct path to ROLES
import axios from 'axios';

Meteor.methods({
  'events.insert': async function (eventData) {
    try {
        if (!this.userId) {
        console.error('Error: User not authorized - Not logged in.');
        throw new Meteor.Error('not-authorized', 'You must be logged in to create events.');
      }
      const canCreateEvents = await Roles.userIsInRoleAsync(this.userId, [ROLES.ADMIN, ROLES.MODERATOR, ROLES.EVENT_CREATOR]);
      if (!canCreateEvents) {
        console.error('Error: User not authorized to create events. User ID:', this.userId);
        throw new Meteor.Error('not-authorized', 'You need appropriate permissions to create events.');
      }

      check(eventData, {
        title: String,
        type: String,
        date: String,
        time: String,
        location: String,
        description: Match.Maybe(String),
        capacity: Number,
        // The cost field is correctly included and validated here.
        cost: Match.Maybe(Number), 
      });

      // The 'cost' field is now automatically included from eventData as sent by client (0 for free, >0 for paid)
      const newEventData = { ...eventData, registered: 0 };
      const newEventId = await Events.insertAsync(newEventData);
      return newEventId;

    } catch (error) {
      console.error('--- A CRITICAL ERROR OCCURRED IN events.insert method (SERVER-SIDE) ---');
      console.error('Error object (full):', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      if (error.reason) {
          console.error('Error reason (for Meteor.Error):', error.reason);
      }
      if (error.details) {
          console.error('Error details (for SimpleSchema validation errors):', error.details);
      }
      if (error.stack) {
          console.error('Error stack trace:', error.stack);
      }
      const clientErrorMessage = error.reason || error.message || 'An unknown error occurred on the server.';
      throw new Meteor.Error('event-insert-failed', clientErrorMessage);
    }
  },


 'events.rsvp': async function (eventId, wantsToAttend, options = {}) {
    try { // --- NEW: Top-level try-catch for the entire method ---
        if (!this.userId) {
            throw new Meteor.Error('not-authorized', 'You must be logged in to book for events.');
        }

        check(eventId, String);
        check(wantsToAttend, Boolean);
        check(options, Match.Maybe(Object)); 

        console.log(`SERVER DEBUG: events.rsvp called. Event ID: ${eventId}, Wants to attend: ${wantsToAttend}, Options: ${JSON.stringify(options)}`);

        const event = await Events.findOneAsync(eventId);
        if (!event) {
            throw new Meteor.Error('event-not-found', 'Event not found.');
        }
        console.log("SERVER DEBUG: Event found. Cost:", event.cost, "Capacity:", event.capacity);

        const userId = this.userId;
        const existingRsvp = await UserRsvps.findOneAsync({ eventId, userId });
        console.log("SERVER DEBUG: Existing RSVP found:", existingRsvp ? existingRsvp.status : 'None');

        const paymentIsRequired = event.cost && event.cost > 0;
        const clientIndicatesPaid = options.paid === true;
        console.log(`SERVER DEBUG: Payment required: ${paymentIsRequired}, Client indicates paid: ${clientIndicatesPaid}`);


        if (wantsToAttend) {
            if (event.registered >= event.capacity) {
                throw new Meteor.Error('event-full', 'This event is at full capacity.');
            }
            console.log("SERVER DEBUG: Capacity check passed.");

            if (existingRsvp) { 
                console.log("SERVER DEBUG: Existing RSVP status:", existingRsvp.status);
                if (existingRsvp.status === 'confirmed') {
                    throw new Meteor.Error('already-booked', 'You have already confirmed your booking for this event.');
                } else if (existingRsvp.status === 'pending_payment') {
                    if (clientIndicatesPaid || !paymentIsRequired) {
                        console.log("SERVER DEBUG: Updating pending_payment to confirmed.");
                        await UserRsvps.updateAsync(existingRsvp._id, {
                            $set: { status: 'confirmed', updatedAt: new Date() }
                        });
                        await Events.updateAsync(eventId, { $inc: { registered: 1 } }); 
                        return { success: true, message: 'Your spot has been confirmed!' };
                    } else {
                        throw new Meteor.Error('payment-still-required', 'Your booking is still pending payment. Please complete payment first.');
                    }
                } else if (existingRsvp.status === 'cancelled') {
                    console.log("SERVER DEBUG: Re-booking cancelled RSVP.");
                    if (clientIndicatesPaid || !paymentIsRequired) {
                        await UserRsvps.updateAsync(existingRsvp._id, { $set: { status: 'confirmed', updatedAt: new Date() } });
                        await Events.updateAsync(eventId, { $inc: { registered: 1 } }); 
                        // --- ADDED RETURN HERE ---
                        return { success: true, message: 'Your spot has been re-booked successfully!' }; // <--- THIS WAS MISSING
                    } else {
                        throw new Meteor.Error('payment-required-to-rebook', 'Payment is required to re-book this event. Please proceed with payment.');
                    }
                } else { 
                    console.error(`SERVER DEBUG: Unhandled existingRsvp status: ${existingRsvp.status} for user ${userId}, event ${eventId}`);
                    throw new Meteor.Error(
                        'unhandled-booking-status',
                        `Cannot book: An unexpected existing booking status was found (${existingRsvp.status}). Please contact support.`
                    );
                }
            } else { // No existing RSVP record (a brand new booking)
                console.log("SERVER DEBUG: No existing RSVP, attempting new booking.");
                if (clientIndicatesPaid || !paymentIsRequired) {
                    await UserRsvps.insertAsync({
                        eventId,
                        userId,
                        status: 'confirmed',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                    await Events.updateAsync(eventId, { $inc: { registered: 1 } }); 
                    return { success: true, message: 'Your spot has been booked successfully!' };
                } else {
                    throw new Meteor.Error('payment-missing-for-new-booking', 'Payment must be completed before booking this event.');
                }
            }
        } else { // User wants to cancel booking (wantsToAttend is false)
            console.log("SERVER DEBUG: Attempting to cancel booking.");
            if (!existingRsvp || existingRsvp.status === 'cancelled') {
                throw new Meteor.Error('not-booked', 'You are not currently booked for this event.');
            }

            await UserRsvps.updateAsync(existingRsvp._id, { $set: { status: 'cancelled', updatedAt: new Date() } });

            if (existingRsvp.status === 'confirmed') { 
                await Events.updateAsync(eventId, { $inc: { registered: -1 } });
            }
            return { success: true, message: 'Your booking has been cancelled successfully.' };
        }
    } catch (e) { // --- NEW: Catch all for unexpected server errors ---
        console.error("SERVER DEBUG: Uncaught error in events.rsvp method:", e);
        // Re-throw as a Meteor.Error to ensure client receives a structured error.
        if (e.error) { // If it's already a Meteor.Error
            throw e;
        } else {
            throw new Meteor.Error('server-internal-error', `An unexpected server error occurred during booking: ${e.message}`);
        }
    }
}, 

  'events.processPayment': async function (eventId, amount, phoneNumber) {
    this.unblock();

    console.log("SERVER DEBUG: events.processPayment method called.");
    console.log(`SERVER DEBUG: eventId: ${eventId}, amount: ${amount}, phoneNumber: ${phoneNumber}`);

    if (!this.userId) { // UNCOMMENTED THIS - CRUCIAL FOR SECURITY
        throw new Meteor.Error('not-authorized', 'You must be logged in to process payments.');
    }
    console.log("SERVER DEBUG: User is authenticated.");

    try {
        const userId = this.userId;
        console.log(`SERVER DEBUG: Current user ID: ${userId}`);

        check(Meteor.settings.private, Object);
        check(Meteor.settings.private.paystack, Match.ObjectIncluding({
            secretKey: String,
            publicKey: String,
            callbackUrl: String,
            baseURL: String
        }));
        console.log("SERVER DEBUG: Paystack settings check passed.");

        const paystackSettings = Meteor.settings.private.paystack;
        if (!paystackSettings || !paystackSettings.secretKey || !paystackSettings.baseURL) {
            console.error('Paystack settings missing or incomplete in settings.json after check()');
            throw new Meteor.Error('paystack-config-error', 'Paystack API keys are not configured correctly on the server (missing values).');
        }
        console.log("SERVER DEBUG: Paystack settings retrieved.");

        const event = await Events.findOneAsync(eventId);
        if (!event) {
            throw new Meteor.Error('event-not-found', 'Event not found.');
        }
        console.log("SERVER DEBUG: Event found for payment:", event.title);
        // ORIGINAL: console.log("SERVER DEBUG: Event cost:", event.cost); // This will show 'undefined' for free events

        // --- START MINIMAL CHANGES ---

        // Ensure event.cost is treated as 0 if it's undefined, null, or falsy.
        // This is crucial for the comparison below.
        const actualEventCost = event.cost || 0;
        console.log(`SERVER DEBUG: Event cost (normalized): ${actualEventCost}`);

        // 1. Prevent processing payment for genuinely free events (cost 0)
        if (actualEventCost === 0) {
            throw new Meteor.Error('payment-not-required', 'Payment is not required for this event.');
        }

        // 2. Validate the amount passed from the client matches the event's cost
        // This prevents clients from trying to pay a different amount
        if (amount !== actualEventCost) {
            throw new Meteor.Error('invalid-amount-mismatch', `Payment amount (${amount}) does not match event cost (${actualEventCost}).`);
        }
        if (amount <= 0) {
             // This check is still good, but 'actualEventCost === 0' handles the main case for free events
            throw new Meteor.Error('invalid-amount', 'Amount must be greater than zero.');
        }

        // --- END MINIMAL CHANGES ---

        let formattedPhoneNumber = phoneNumber;
        if (formattedPhoneNumber.startsWith('0')) {
            formattedPhoneNumber = '254' + formattedPhoneNumber.substring(1);
        }
        if (!/^2547[0-9]{8}$/.test(formattedPhoneNumber)) {
            throw new Meteor.Error('invalid-phone-number', 'Please enter a valid M-Pesa phone number (e.g., 07XXXXXXXX or 2547XXXXXXXX).');
        }
        console.log(`SERVER DEBUG: Inputs validated. Formatted phone: ${formattedPhoneNumber}, Amount: ${amount}`);

        const reference = `PYMT_${eventId}_${this.userId}_${new Date().getTime()}`;
        console.log(`SERVER DEBUG: Generated Paystack reference: ${reference}`);

        // --- CRITICAL ADDITION HERE: Create/Update the RSVP with 'pending_payment' status ---
        const existingRsvp = await UserRsvps.findOneAsync({ eventId, userId });

        if (existingRsvp) {
            // If an RSVP already exists (e.g., cancelled or just pending again), update it
            if (existingRsvp.status === 'pending_payment' && existingRsvp.paystackReference === reference) {
                console.log("SERVER DEBUG: Existing pending RSVP found with same reference. No update needed for RSVP status before Paystack call.");
                // No update needed if it's already pending with the same reference
            } else {
                console.log(`SERVER DEBUG: Updating existing RSVP status to 'pending_payment' for event ${eventId}, user ${userId}.`);
                await UserRsvps.updateAsync(existingRsvp._id, {
                    $set: {
                        status: 'pending_payment',
                        paystackReference: reference, // Store the new reference
                        amount: amount, // Store the amount
                        updatedAt: new Date(),
                        // Clear any previous payment confirmation details if re-attempting payment
                        paymentConfirmedAt: null,
                        paystackTransactionId: null,
                        paystackGatewayResponse: null,
                    },
                });
            }
        } else {
            // If no RSVP exists, create a new one
            console.log(`SERVER DEBUG: Creating new RSVP with 'pending_payment' status for event ${eventId}, user ${userId}.`);
            await UserRsvps.insertAsync({
                eventId,
                userId,
                status: 'pending_payment',
                paystackReference: reference, // Store this reference!
                amount: amount, // Store the amount
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }
        // --- END CRITICAL ADDITION ---

        console.log(`SERVER DEBUG: Attempting Paystack initialization POST to ${paystackSettings.baseURL}/transaction/initialize`);
        console.log(`SERVER DEBUG: Paystack Secret Key (first 5 chars): ${paystackSettings.secretKey.substring(0, 5)}...`);
        console.log(`SERVER DEBUG: Paystack Callback URL: ${paystackSettings.callbackUrl}`);

        const paystackResponse = await axios.post(
            `${paystackSettings.baseURL}/transaction/initialize`,
            {
                email: Meteor.userAsync()?.emails?.[0]?.address || 'anonymous@example.com',
                amount: amount * 100,
                currency: 'KES',
                mobile_money: {
                    phone: formattedPhoneNumber,
                    provider: 'mpesa'
                },
                channels: ['mobile_money'],
                reference: reference,
                callback_url: paystackSettings.callbackUrl,
                metadata: {
                    custom_fields: [
                        { display_name: 'Event ID', variable_name: 'event_id', value: eventId },
                        { display_name: 'User ID', variable_name: 'user_id', value: userId },
                        { display_name: 'Amount KES', variable_name: 'amount_kes', value: amount }
                    ],
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${paystackSettings.secretKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        console.log('SERVER DEBUG: Paystack API Response received.');
        console.log('SERVER DEBUG: Paystack API Response Status:', paystackResponse.status);
        console.log('SERVER DEBUG: Paystack API Response Data:', JSON.stringify(paystackResponse.data, null, 2));

        if (paystackResponse.data.status) {
            const resultToReturn = {
                success: true,
                message: 'STK Push sent to your phone. Please complete the payment.',
                paystackAuthUrl: paystackResponse.data.data?.authorization_url
            };
            console.log('SERVER DEBUG: Preparing to return successful payment result.');
            console.log('SERVER DEBUG: Actual result being returned:', JSON.stringify(resultToReturn, null, 2));
            return resultToReturn;

        } else {
            console.error('SERVER ERROR: Paystack API Initiation Error (response data):', JSON.stringify(paystackResponse.data, null, 2));
            throw new Meteor.Error('paystack-initiation-failed', paystackResponse.data.message || 'Payment initiation failed with Paystack.');
        }
    } catch (error) {
        console.error('--- SERVER ERROR IN events.processPayment (CATCH BLOCK) ---');
        console.error('Error object:', error);
        if (error.response) {
            console.error('Axios Error - Paystack API Response Data:', JSON.stringify(error.response.data, null, 2));
            console.error('Axios Error - Paystack API Response Status:', error.response.status);
            console.error('Axios Error - Paystack API Response Headers:', error.response.headers);
        } else if (error.request) {
            console.error('Axios Error - Request made but no response received:', error.request);
        } else {
            console.error('General Error Message:', error.message);
        }
        console.error('Error stack:', error.stack);

        // Re-throw the error as a Meteor.Error to propagate it to the client's catch block
        throw new Meteor.Error(
            error.error || 'payment-processing-failed', // Use existing Meteor.Error code if available
            error.response?.data?.message || error.reason || error.message || 'An unexpected error occurred during payment processing.'
        );
    }
},
});