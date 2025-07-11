// imports/api/paystack/server/paystack-webhook.js
import { WebApp } from 'meteor/webapp';
import { UserRsvps } from '../../rsvps/rsvps'; // Assuming your RSVP collection path
import { Events } from '../../events/events'; // Assuming your Events collection path
import crypto from 'crypto'; // Node.js built-in module for cryptographic functions
import { HTTP } from 'meteor/http'; // Import Meteor's HTTP package for API calls

WebApp.connectHandlers.use('/api/paystack-webhook', (req, res, next) => {
    if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => { body += chunk.toString(); });

        req.on('end', Meteor.bindEnvironment(async () => {
            try {
                // Ensure Meteor.settings.private is accessible and check its structure
                if (!Meteor.settings.private || !Meteor.settings.private.paystack || !Meteor.settings.private.paystack.secretKey) {
                    console.error('Paystack Webhook: Missing or incomplete Paystack secretKey in Meteor.settings.private.paystack.');
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Server configuration error: Paystack secret key missing.' }));
                    return;
                }
                const paystackSecret = Meteor.settings.private.paystack.secretKey;

                const hash = crypto.createHmac('sha512', paystackSecret).update(body).digest('hex');
                const signature = req.headers['x-paystack-signature'];

                if (hash !== signature) {
                    console.warn('Paystack Webhook: Invalid signature. Request denied.');
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Unauthorized: Invalid signature' }));
                    return;
                }

                const event = JSON.parse(body);
                console.log('Paystack Webhook Event Received:', JSON.stringify(event, null, 2));

                if (event.event === 'charge.success') {
                    const transactionData = event.data;
                    const paystackReference = transactionData.reference;

                    console.log(`Processing successful charge webhook: Ref=${paystackReference}`);

                    try {
                        // --- CRITICAL STEP 1: VERIFY TRANSACTION WITH PAYSTACK API ---
                        const verifyResponse = await HTTP.get(`https://api.paystack.co/transaction/verify/${paystackReference}`, {
                            headers: { 'Authorization': `Bearer ${paystackSecret}` }
                        });

                        if (verifyResponse.statusCode === 200 && verifyResponse.data.data.status === 'success') {
                            const verifiedTransaction = verifyResponse.data.data;
                            const amountPaid = verifiedTransaction.amount / 100; // Convert from kobo/pesewas to main currency

                            console.log(`Transaction ${paystackReference} successfully verified with Paystack.`);

                            const eventId = verifiedTransaction.metadata?.custom_fields?.find(f => f.variable_name === 'event_id')?.value;
                            const userId = verifiedTransaction.metadata?.custom_fields?.find(f => f.variable_name === 'user_id')?.value;

                            // --- CRITICAL SPOT: RSVP AND EVENT UPDATES ---
                            const rsvpQuery = { paystackReference: paystackReference, status: 'pending_payment' };
                            if (eventId) rsvpQuery.eventId = eventId;
                            if (userId) rsvpQuery.userId = userId;

                            // Use findOneAsync() as required in async context
                            const rsvp = await UserRsvps.findOneAsync(rsvpQuery); 

                            if (rsvp) {
                                // Update RSVP using updateAsync()
                                const updateResultRsvp = await UserRsvps.updateAsync(rsvp._id, {
                                    $set: {
                                        status: 'confirmed',
                                        paymentConfirmedAt: new Date(verifiedTransaction.paid_at),
                                        amountPaid: amountPaid,
                                        paystackTransactionId: verifiedTransaction.id,
                                        paystackGatewayResponse: verifiedTransaction.gateway_response,
                                        updatedAt: new Date(), // Always update updatedAt
                                    },
                                });

                                if (updateResultRsvp === 1) { // Check if update was successful
                                    console.log(`UserRsvps update successful for _id: ${rsvp._id}`);
                                } else {
                                    console.warn(`UserRsvps update did not modify any document for _id: ${rsvp._id}. It might have been already updated.`);
                                }

                                // Increment the registered count for the event using updateAsync()
                                const updateResultEvent = await Events.updateAsync(rsvp.eventId, { $inc: { registered: 1 } });
                                
                                if (updateResultEvent === 1) { // Check if update was successful
                                    console.log(`Events update successful for eventId: ${rsvp.eventId}`);
                                } else {
                                    console.warn(`Events update did not modify any document for eventId: ${rsvp.eventId}. Event not found or already incremented?`);
                                }
                                
                                console.log(`RSVP ${rsvp._id} confirmed for event ${rsvp.eventId}. Event registered count incremented.`);

                                // --- OPTIONAL: Send a confirmation email to the user here ---
                                // Requires 'email' package (meteor add email) and SMTP configuration
                                // if (verifiedTransaction.customer?.email) {
                                //     try {
                                //         Email.send({
                                //             from: 'CommunityHub <noreply@communityhub.com>',
                                //             to: verifiedTransaction.customer.email,
                                //             subject: 'Your Event Booking Confirmation',
                                //             text: `Dear ${verifiedTransaction.customer.first_name || 'Participant'},\n\nYour booking for event ${eventId} (Ref: ${paystackReference}) has been confirmed!\n\nThank you for your payment.\n\nCommunityHub Team`
                                //         });
                                //         console.log(`Confirmation email sent to ${verifiedTransaction.customer.email}`);
                                //     } catch (emailError) {
                                //         console.error('Error sending confirmation email:', emailError);
                                //     }
                                // }

                            } else {
                                console.warn(`Paystack Webhook: No pending RSVP found for reference ${paystackReference} (eventId: ${eventId}, userId: ${userId}). This could mean a duplicate webhook, or the initial RSVP was not created/found with 'pending_payment' status.`);
                            }

                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ status: 'success', message: 'Webhook received and processed successfully' }));

                        } else {
                            // Paystack's verification API reported a failure or non-success status
                            console.error(`Paystack Webhook: Transaction verification failed for reference ${paystackReference}:`, verifyResponse.data);
                            res.writeHead(400, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ status: 'error', message: 'Transaction verification failed with Paystack' }));
                        }

                    } catch (verifyError) {
                        console.error(`Paystack Webhook: Error verifying transaction ${paystackReference} with Paystack:`, verifyError.response?.data?.message || verifyError.message || verifyError);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ status: 'error', message: 'Internal server error during verification' }));
                    }

                } else if (event.event === 'charge.failure') {
                    const transactionData = event.data;
                    const paystackReference = transactionData.reference;
                    const failureReason = transactionData.gateway_response || 'Unknown reason';

                    console.log(`Processing failed charge webhook: Ref=${paystackReference}, Reason=${failureReason}`);

                    const eventId = transactionData.metadata?.custom_fields?.find(f => f.variable_name === 'event_id')?.value;
                    const userId = transactionData.metadata?.custom_fields?.find(f => f.variable_name === 'user_id')?.value;

                    const rsvpQuery = { paystackReference: paystackReference, status: 'pending_payment' };
                    if (eventId) rsvpQuery.eventId = eventId;
                    if (userId) rsvpQuery.userId = userId;

                    // Use findOneAsync()
                    const rsvp = await UserRsvps.findOneAsync(rsvpQuery); 

                    if (rsvp) {
                       
                        const updateResult = await UserRsvps.updateAsync(rsvp._id, {
                            $set: {
                                status: 'failed',
                                paymentFailedAt: new Date(transactionData.transaction_date),
                                failureReason: failureReason,
                                updatedAt: new Date(), // Always update updatedAt
                            },
                        });
                        if (updateResult === 1) {
                            console.log(`RSVP ${rsvp._id} marked as failed.`);
                        } else {
                            console.warn(`UserRsvps update for failed transaction did not modify any document for _id: ${rsvp._id}. It might have been already updated.`);
                        }
                    } else {
                        console.warn(`Paystack Webhook: No pending RSVP found for failed reference ${paystackReference}. Or already processed.`);
                    }

                    res.writeHead(200, { 'Content-Type': 'application/json' }); // Always respond 200 to acknowledge webhook
                    res.end(JSON.stringify({ status: 'success', message: 'Failure webhook received and processed' }));

                } else {
                    console.log(`Paystack Webhook: Unhandled event type: ${event.event}. Acknowledging.`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'success', message: 'Event type not handled by this webhook' }));
                }

            } catch (e) {
                console.error('Error processing Paystack webhook:', e.message || e);
                // Ensure a valid JSON response even on unexpected errors
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: 'Internal server error processing webhook', details: e.message }));
            }
        }));
    } else {
        next(); // Pass to next handler if not POST (e.g., GET requests to this path)
    }
});

console.log('SERVER WEBHOOK: Paystack webhook handler initialized.');
