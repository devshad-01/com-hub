import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';

export const AddEventForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    type: 'social', // Default type
    date: '',      // YYYY-MM-DD
    time: '',      // HH:MM
    location: '',
    description: '',
    capacity: 0,
    // --- NEW FIELDS FOR COST ---
    cost: 0, // Default cost to 0
    isFree: true, // Default to free event
    // --- END NEW FIELDS ---
  });

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double submission

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => {
      let newValue;
      if (name === 'capacity' || name === 'cost') {
        newValue = parseFloat(value); // Parse cost as float to allow decimals
        if (isNaN(newValue)) { // Handle cases where input is not a number
            newValue = 0;
        }
      } else if (name === 'isFree') {
        newValue = checked;
        // If 'isFree' is checked, set cost to 0
        if (checked) {
          return { ...prev, [name]: newValue, cost: 0 };
        }
      } else {
        newValue = value;
      }
      return { ...prev, [name]: newValue };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) {
      console.log('Already submitting, ignoring duplicate submission');
      return;
    }

    setIsSubmitting(true);
    setMessage(''); // Clear previous messages
    setMessageType('');

    // Client-side validation (basic)
    if (!formData.title || !formData.date || !formData.time || !formData.location || formData.capacity <= 0) {
      setMessage('Please fill in all required fields and ensure capacity is greater than 0.');
      setMessageType('error');
      setIsSubmitting(false);
      return;
    }

    // Additional validation for cost if not free
    if (!formData.isFree && formData.cost <= 0) {
        setMessage('For non-free events, the cost must be greater than 0.');
        setMessageType('error');
        setIsSubmitting(false);
        return;
    }

    // Prepare data to send to server
    const dataToSend = {
      ...formData,
      // Ensure cost is 0 if isFree is true, otherwise use the entered cost
      cost: formData.isFree ? 0 : formData.cost,
      // Remove isFree from the data sent to the server, as server only needs cost
      isFree: undefined // Explicitly remove or set to undefined
    };

    try {
      console.log('Submitting event data:', dataToSend);
      const result = await Meteor.callAsync('events.insert', dataToSend);

      console.log('Event created successfully:', result);
      setMessage('Event added successfully!');
      setMessageType('success');

      // Clear form fields after successful submission
      setFormData({
        title: '',
        type: 'social',
        date: '',
        time: '',
        location: '',
        description: '',
        capacity: 0,
        cost: 0,
        isFree: true,
      });

    } catch (error) {
      console.error('Error adding event:', error);
      setMessage(`Error adding event: ${error.error || error.reason || error.message}`);
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-5 bg-slate-800 rounded-lg shadow-md text-slate-100">
      <h2 className="text-2xl font-bold text-orange-400 mb-6">Add New Event</h2>

      {message && (
        <div className={`p-3 mb-4 rounded-md ${messageType === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">Event Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium mb-1">Event Type</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            disabled={isSubmitting}
          >
            <option value="workshop">Workshop</option>
            <option value="meeting">Meeting</option>
            <option value="social">Social</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium mb-1">Date (YYYY-MM-DD)</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label htmlFor="time" className="block text-sm font-medium mb-1">Time (HH:MM)</label>
            <input
              type="time"
              id="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium mb-1">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">Description (Optional)</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            disabled={isSubmitting}
          ></textarea>
        </div>

        <div>
          <label htmlFor="capacity" className="block text-sm font-medium mb-1">Capacity</label>
          <input
            type="number"
            id="capacity"
            name="capacity"
            value={formData.capacity}
            onChange={handleChange}
            min="0"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* --- NEW SECTION FOR EVENT COST --- */}
        <div className="flex items-center space-x-4">
            <div className="flex items-center">
                <input
                    type="checkbox"
                    id="isFree"
                    name="isFree"
                    checked={formData.isFree}
                    onChange={handleChange}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-slate-600 rounded"
                    disabled={isSubmitting}
                />
                <label htmlFor="isFree" className="ml-2 block text-sm font-medium">
                    Entry Free
                </label>
            </div>

            <div className="flex-grow">
                <label htmlFor="cost" className="block text-sm font-medium mb-1">Cost (KES)</label>
                <input
                    type="number"
                    id="cost"
                    name="cost"
                    value={formData.cost}
                    onChange={handleChange}
                    min="0"
                    step="0.01" // Allow decimal for currency
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={formData.isFree || isSubmitting} // Disable if 'Entry Free' is checked or submitting
                    required={!formData.isFree} // Required only if not free
                />
            </div>
        </div>
        {/* --- END NEW SECTION --- */}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full font-bold py-2 px-4 rounded-md transition-colors ${
            isSubmitting
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-orange-500 hover:bg-orange-600'
          } text-white`}
        >
          {isSubmitting ? 'Adding Event...' : 'Add Event'}
        </button>
      </form>
    </div>
  );
};
