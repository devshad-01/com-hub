import React from 'react';
import { CalendarPlus } from 'lucide-react';

export const AdminUpcomingEvents = ({ events, isLoading, onNavigate }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Upcoming Events</h2>
        <button 
          onClick={() => onNavigate('events')}
          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          View All
        </button>
      </div>
      
      {isLoading ? (
        <div className="py-8 flex justify-center">
          <span className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></span>
        </div>
      ) : events && events.length > 0 ? (
        <div className="space-y-3">
          {events.map(event => (
            <div key={event._id} className="flex items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <CalendarPlus className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-slate-900 dark:text-white">{event.title}</h3>
                <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-4">
                  <span>{event.date} at {event.time}</span>
                  <span>{event.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-slate-500 dark:text-slate-400">
          No upcoming events scheduled
        </div>
      )}
    </div>
  );
};
