import React from 'react';
import { AdminStatsCards } from './AdminStatsCards';
import { AdminQuickActions } from './AdminQuickActions';
import { AdminUpcomingEvents } from './AdminUpcomingEvents';
import { AdminPopularPosts } from './AdminPopularPosts';

export const AdminDashboard = ({ 
  users, 
  events, 
  rsvps, 
  upcomingEvents, 
  popularPosts, 
  isLoading, 
  onNavigate 
}) => {
  return (
    <div>
      {/* Stats Cards */}
      <AdminStatsCards 
        users={users}
        events={events}
        rsvps={rsvps}
        isLoading={isLoading}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Quick Actions */}
        <AdminQuickActions onNavigate={onNavigate} />
        
        {/* Upcoming Events */}
        <AdminUpcomingEvents 
          events={upcomingEvents}
          isLoading={isLoading}
          onNavigate={onNavigate}
        />
      </div>
      
      {/* Popular Forum Posts */}
      <AdminPopularPosts 
        posts={popularPosts}
        isLoading={isLoading}
        onNavigate={onNavigate}
      />
    </div>
  );
};
