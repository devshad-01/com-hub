import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Events } from '/imports/api/events/events';
import { UserRsvps } from '/imports/api/rsvps/rsvps';
import { useToastContext } from '../components/common/ToastProvider';
import {
    Search as FiSearch,
    Calendar as FiCalendar,
    Users as FiUsers,
    Wrench as FiTool,
    MapPin as FiMapPin,
    Clock as FiClock,
    DollarSign as FiDollarSign
} from 'lucide-react';

// ====================================================================================
// EventsPage Component 
// ====================================================================================
export const EventsPage = () => {

    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('upcoming');

    const { isLoading, allEvents, upcomingEvents, pastEvents, userRsvps } = useTracker(() => {
        // IMPORTANT: Ensure your 'events.all' publication on the server includes the 'cost' field.
        // (e.g., return Events.find({}, { fields: { ..., cost: 1 } });)
        const allEventsHandle = Meteor.subscribe('events.all');
        const userRsvpsHandle = Meteor.subscribe('rsvps.myEvents');

        const isLoading = !allEventsHandle.ready() || !userRsvpsHandle.ready();

        const fetchedAllEvents = Events.find(
            {},
            { sort: { date: 1, time: 1 } }
        ).fetch();

        const fetchedUserRsvps = UserRsvps.find({}).fetch();

        const now = new Date();
        const currentDateStr = now.toISOString().split('T')[0];
        const currentTimeStr = now.toTimeString().slice(0, 5);

        const upcoming = [];
        const past = [];

        fetchedAllEvents.forEach(event => {
            const eventDateTimeStr = `${event.date} ${event.time}`;
            const currentDateTimeStr = `${currentDateStr} ${currentTimeStr}`;

            if (eventDateTimeStr >= currentDateTimeStr) {
                upcoming.push(event);
            } else {
                past.push(event);
            }
        });

        return {
            isLoading,
            allEvents: fetchedAllEvents,
            upcomingEvents: upcoming,
            pastEvents: past,
            userRsvps: fetchedUserRsvps,
        };
    });

    const filterCounts = {
        all: allEvents.length,
        upcoming: upcomingEvents.length,
        past: pastEvents.length,
        workshop: allEvents.filter(e => e.type === 'workshop').length,
        meeting: allEvents.filter(e => e.type === 'meeting').length,
        social: allEvents.filter(e => e.type === 'social').length,
    };

    const filteredEvents = allEvents.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()));

        let matchesFilter = false;
        if (activeFilter === 'all') {
            matchesFilter = true;
        } else if (activeFilter === 'upcoming') {
            matchesFilter = upcomingEvents.some(e => e._id === event._id);
        } else if (activeFilter === 'past') {
            matchesFilter = pastEvents.some(e => e._id === event._id);
        } else {
            matchesFilter = event.type === activeFilter;
        }

        return matchesSearch && matchesFilter;
    });

    // The handleRsvp prop passed to EventCard is for general console logging,
    // the actual logic is now directly within EventCard.
    const handleRsvp = (eventId, wantsToAttend) => {
        console.log(`(EventsPage) Initiating booking/cancellation for event ${eventId} (Wants to attend: ${wantsToAttend})`);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen text-slate-100 p-4 md:p-8 flex justify-center items-center">
                <p className="text-xl text-orange-400">Loading Events...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-slate-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-orange-400 mb-2">Events Hub</h1>
                    <p className="text-slate-400">Browse and join events in your community</p>
                </header>

                {/* Search and Filters */}
                <div className="mb-8">
                    <div className="relative mb-6">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiSearch className="text-orange-400 w-4 h-4" />
                        </div>
                        <input
                            type="text"
                            className="w-full bg-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Search events..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <FilterTab name="all" count={filterCounts.all} active={activeFilter === 'all'} onClick={() => setActiveFilter('all')} />
                        <FilterTab name="upcoming" icon={<FiCalendar className="mr-1 w-4 h-4" />} count={filterCounts.upcoming} active={activeFilter === 'upcoming'} onClick={() => setActiveFilter('upcoming')} />
                        <FilterTab name="past" icon={<FiClock className="mr-1 w-4 h-4" />} count={filterCounts.past} active={activeFilter === 'past'} onClick={() => setActiveFilter('past')} />
                        <FilterTab name="workshop" icon={<FiTool className="mr-1 w-4 h-4" />} count={filterCounts.workshop} active={activeFilter === 'workshop'} onClick={() => setActiveFilter('workshop')} />
                        <FilterTab name="meeting" icon={<FiUsers className="mr-1 w-4 h-4 " />} count={filterCounts.meeting} active={activeFilter === 'meeting'} onClick={() => setActiveFilter('meeting')} />
                        <FilterTab name="social" icon={<FiUsers className="mr-1 w-4 h-4" />} count={filterCounts.social} active={activeFilter === 'social'} onClick={() => setActiveFilter('social')} />
                    </div>
                </div>

                {/* Events Grid */}
                {filteredEvents.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-slate-500 text-lg">No events found matching your criteria</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEvents.map(event => (
                            <EventCard
                                key={event._id}
                                event={event}
                                onRsvp={handleRsvp} // This prop is now mostly for logging in EventsPage parent
                                isPastEvent={pastEvents.some(e => e._id === event._id)}
                                currentUserRsvps={userRsvps}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ====================================================================================
// Filter Tab Component & EventCard Component (UPDATED for Cost Display)
// ====================================================================================
const FilterTab = ({ name, icon, count, active, onClick }) => {
    const base = 'flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer';
    const classes = active ? 'bg-orange-400 text-white outline' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white';
    return (
        <button className={`${base} ${classes}`} onClick={onClick}>
            {icon}
            {name.charAt(0).toUpperCase() + name.slice(1)}
            <span className="ml-2 bg-black bg-opacity-10 px-2 py-0.5 rounded-full text-xs">{count}</span>
        </button>
    );
};
const EventCard = ({ event, onRsvp, isPastEvent, currentUserRsvps }) => {
    // Corrected destructuring for toast functions
    const { success: showSuccessToast, error: showErrorToast, warning: showWarningToast } = useToastContext();

    const typeColors = {
        workshop: 'bg-white text-slate-800',
        meeting: 'bg-white text-slate-800',
        social: 'bg-white text-slate-800',
    };

    const currentUserRsvp = currentUserRsvps.find(rsvp => rsvp.eventId === event._id && rsvp.userId === Meteor.userId());
    const isPendingPayment = currentUserRsvp && currentUserRsvp.status === 'pending_payment';
    const isConfirmed = currentUserRsvp && currentUserRsvp.status === 'confirmed';
    const isFreeEvent = !event.cost || event.cost <= 0;

    const [showPaymentInput, setShowPaymentInput] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [paymentMessage, setPaymentMessage] = useState('');
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [showCancelConfirmation, setShowCancelConfirmation] = useState(false); // NEW STATE for cancellation confirmation

    const isConnected = useTracker(() => Meteor.status().connected);
    console.log(`CLIENT DEBUG: EventCard for ${event.title} - isConnected: ${isConnected}`);

    // New function to handle the actual cancellation logic
    const confirmCancelBooking = async () => {
        setIsProcessingPayment(true);
        try {
            await Meteor.callAsync('events.rsvp', event._id, false); // Call with wantsToAttend: false for cancellation
            showSuccessToast('Booking Cancelled', 'Your booking has been cancelled successfully!');
            setPaymentMessage(''); // Clear any old payment messages
        } catch (error) {
            console.error('Error cancelling booking:', error);
            showErrorToast('Cancellation Failed', `Failed to cancel booking: ${error.error || error.reason || error.message || 'Unknown error'}`);
            setPaymentMessage(`Failed to cancel booking: ${error.error || error.reason || error.message || 'Unknown error'}`);
        } finally {
            setIsProcessingPayment(false);
            setShowCancelConfirmation(false); // Hide confirmation dialog
        }
    };

    const handleRsvpClick = async () => {
        if (!isConnected) {
            showWarningToast('Connection Issue', 'Not connected to server. Please wait a moment.');
            console.warn("CLIENT WARNING: Attempted RSVP/booking action while Meteor is not connected.");
            return;
        }

        if (!Meteor.userId()) {
            showErrorToast('Authentication Required', 'You need to be logged in to book for events. Please log in.');
            return;
        }

        if (isPastEvent) {
            showWarningToast('Event Passed', 'Cannot book for past events.');
            return;
        }

        if (isConfirmed) {
            // If already confirmed, prompt for cancellation
            setShowCancelConfirmation(true); // Show confirmation dialog
        } else if (isPendingPayment) {
            setShowPaymentInput(true);
            setPaymentMessage('You have a pending payment for this event. Please complete it to confirm your booking.');
        } else if (isFreeEvent) {
            setIsProcessingPayment(true);
            try {
                console.log("CLIENT DEBUG: Attempting to book FREE event. Event ID:", event._id);
                console.log("CLIENT DEBUG: Event cost on client:", event.cost);
                console.log("CLIENT DEBUG: isFreeEvent determined as:", isFreeEvent);

                const result = await Meteor.callAsync('events.rsvp', event._id, true, { paid: false });

                console.log("CLIENT DEBUG: Result from events.rsvp for FREE event booking:", result);
                console.log("CLIENT DEBUG: Type of result from events.rsvp:", typeof result);

                if (result && typeof result === 'object' && result.message) {
                    showSuccessToast('Booking Confirmed', result.message);
                } else {
                    console.error("CLIENT ERROR: Unexpected result structure from events.rsvp for FREE event:", result);
                    showSuccessToast('RSVP Successful!', 'You have successfully booked this free event.'); // Generic success for free events
                }
                setPaymentMessage('');
                setShowPaymentInput(false);

            } catch (error) {
                console.error('Error booking free event:', error);
                showErrorToast('Booking Failed', `Failed to book free event: ${error.error || error.reason || error.message || 'Unknown error'}`);
                setPaymentMessage(`Failed to book free event: ${error.error || error.reason || error.message || 'Unknown error'}`);
            } finally {
                setIsProcessingPayment(false);
            }
        } else {
            // New paid booking attempt
            setShowPaymentInput(true);
            setPaymentMessage('Please enter your M-Pesa phone number to proceed with payment and confirm your booking.');
        }
    };

    const handlePaymentSubmit = async () => {
        if (!phoneNumber.trim()) {
            setPaymentMessage('Please enter a valid phone number.');
            return;
        }

        setIsProcessingPayment(true);
        setPaymentMessage('Initiating payment...');

        try {
            console.log('CLIENT DEBUG: Calling events.processPayment method...');

            const amountToPay = event.cost || 0;
            if (amountToPay <= 0) {
                throw new Meteor.Error('client-payment-not-required', 'Payment not required for free events.');
            }

            const paymentResult = await Meteor.callAsync('events.processPayment', event._id, amountToPay, phoneNumber);

            console.log('CLIENT DEBUG: Raw paymentResult received:', paymentResult);
            console.log('CLIENT DEBUG: Type of paymentResult:', typeof paymentResult);

            if (paymentResult && paymentResult.success) {
                console.log('CLIENT DEBUG: Payment initiation successful!');

                const paystackUrl = paymentResult.paystackAuthUrl;
                if (paystackUrl) {
                    setPaymentMessage('Redirecting to Paystack for payment...');
                    window.location.href = paystackUrl;
                } else {
                    console.error('CLIENT DEBUG: Paystack Authorization URL missing from response.');
                    showErrorToast('Payment Issue', 'Payment initiated, but no payment link found. Please contact support.');
                    setPaymentMessage('Payment initiated, but no payment link found. Please contact support.');
                }
                showSuccessToast('Payment Initiated', paymentResult.message || 'Payment request sent! Please check your phone and enter your M-Pesa PIN.');


            } else {
                console.error('CLIENT DEBUG: Payment initiation failed:', paymentResult);
                const errorMessage = paymentResult?.message || paymentResult?.error || 'Payment initiation failed. Please try again.';
                setPaymentMessage(errorMessage);
                showErrorToast('Payment Failed', errorMessage);
            }
        } catch (error) {
            console.error('CLIENT DEBUG: Error during payment method call:', error);
            const errorMessage = error.error || error.reason || error.message || 'Payment failed. Please try again.';
            setPaymentMessage(`Payment Error: ${errorMessage}`);
            showErrorToast('Payment Failed', errorMessage);
        } finally {
            setIsProcessingPayment(false);
            console.log('CLIENT DEBUG: Payment method call finished.');
        }
    };

    let buttonText = 'Book Now';
    let buttonDisabled = isPastEvent || isProcessingPayment;

    if (!isPastEvent) {
        if (isConfirmed) {
            buttonText = 'Confirmed (Cancel Booking)';
            buttonDisabled = isProcessingPayment;
        } else if (isPendingPayment) {
            buttonText = 'Complete Payment';
            buttonDisabled = isProcessingPayment;
        } else if (event.registered >= event.capacity) {
            buttonText = 'Event Full';
            buttonDisabled = true;
        } else {
            buttonText = `Book Now ${isFreeEvent ? '(Free)' : `(${event.cost} KES)`}`;
            buttonDisabled = isProcessingPayment;
        }
    }

    return (
        <div className={`relative rounded-lg overflow-hidden shadow-md border ${isPastEvent ? 'border-slate-800 opacity-60' : 'border-slate-700'}`}>
            <div className="bg-slate-800 p-6 h-full flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <span className={`${typeColors[event.type]} text-xs px-2 py-1 rounded-full font-semibold`}>
                        {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                    </span>
                    <span className="text-slate-400 text-sm flex items-center">
                        <FiCalendar className="w-4 h-4 mr-1" /> {event.date}
                    </span>
                </div>

                <h3 className="text-xl font-bold text-orange-400 mb-2">{event.title}</h3>
                <p className="text-slate-400 text-sm mb-4 flex-grow">{event.description}</p>

                <div className="text-sm text-slate-400 mb-4 space-y-2">
                    <div className="flex items-center"><FiUsers className="w-4 h-4 mr-2" /> {event.registered}/{event.capacity} attending</div>
                    <div className="flex items-center"><FiMapPin className="w-4 h-4 mr-2" /> {event.location}</div>
                    <div className="flex items-center"><FiClock className="w-4 h-4 mr-2" /> {event.time}</div>
                    <div className="flex items-center text-orange-400 font-semibold">
                        <FiDollarSign className="w-4 h-4 mr-2" />
                        {isFreeEvent ? 'Free Entry' : `Cost: ${event.cost} KES`}
                    </div>
                </div>

                {showPaymentInput ? (
                    <div className="mt-auto">
                        <p className="text-sm text-slate-300 mb-2">{paymentMessage}</p>
                        <input
                            type="tel"
                            placeholder="Enter M-Pesa Phone (e.g., 2547XXXXXXXX)"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            disabled={isProcessingPayment}
                            className="w-full bg-slate-700 rounded-md py-2 px-3 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 mb-2"
                        />
                        <button
                            onClick={handlePaymentSubmit}
                            disabled={isProcessingPayment}
                            className={`w-full py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center
                                ${isProcessingPayment ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'}`}
                        >
                            {isProcessingPayment ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <FiDollarSign className="w-4 h-4 mr-2" /> Pay Now
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => {
                                setShowPaymentInput(false);
                                setPaymentMessage('');
                                setPhoneNumber('');
                            }}
                            className="w-full mt-2 bg-slate-700 text-slate-300 py-2 rounded-md text-sm font-medium hover:bg-slate-600 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <>
                        <button
                            onClick={handleRsvpClick}
                            className={`mt-auto px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                isConfirmed
                                    ? 'bg-slate-700 text-orange-400 hover:bg-orange-400 hover:text-white'
                                    : 'bg-orange-400 text-slate-900 hover:bg-orange-300'
                            } ${buttonDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={buttonDisabled}
                        >
                            {buttonText}
                        </button>

                        {/* NEW: Cancellation Confirmation Dialog */}
                        {showCancelConfirmation && (
                            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                                <div className="bg-slate-800 rounded-lg p-6 shadow-xl max-w-sm w-full border border-slate-700">
                                    <h4 className="text-lg font-bold text-orange-400 mb-3">Confirm Cancellation</h4>
                                    <p className="text-slate-300 mb-5">
                                        Are you sure you want to cancel your booking for **{event.title}**? This action cannot be undone.
                                    </p>
                                    <div className="flex justify-end space-x-3">
                                        <button
                                            onClick={() => setShowCancelConfirmation(false)}
                                            className="px-4 py-2 rounded-md text-sm font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                                            disabled={isProcessingPayment}
                                        >
                                            No, Keep Booking
                                        </button>
                                        <button
                                            onClick={confirmCancelBooking}
                                            className="px-4 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                                            disabled={isProcessingPayment}
                                        >
                                            {isProcessingPayment ? 'Cancelling...' : 'Yes, Cancel'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
