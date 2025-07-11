import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Menu, X } from 'lucide-react';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { UserPublications, UserMethods } from '/imports/api/users';
import { Events } from '/imports/api/events/events';
import { UserRsvps } from '/imports/api/rsvps/rsvps';
import { ForumPosts } from '/imports/api/forums/collections';
import { ForumPublications } from '/imports/api/forums/index';
import { AddEventForm } from './AddEventForm.jsx';
import { ForumManagement } from './ForumManagement.jsx';
import { ForumPostManagement } from './ForumPostManagement.jsx';
import { AdminSidebar } from './AdminSidebar.jsx';
import { AdminStatsCards } from './AdminStatsCards.jsx';
import { AdminQuickActions } from './AdminQuickActions.jsx';
import { AdminUpcomingEvents } from './AdminUpcomingEvents.jsx';
import { AdminPopularPosts } from './AdminPopularPosts.jsx';
import { AdminUserManagement } from './AdminUserManagement.jsx';
import { AdminSettings } from './AdminSettings.jsx';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../../components/common/ToastProvider';
import { ROLES } from '../../../api/users/roles';

export const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const { getUserRoles, can } = useAuth();
  const { success, error: showError } = useToastContext();
  
  // Track users, events, RSVPs and forum posts
  const { users, events, rsvps, upcomingEvents, popularPosts, isLoading } = useTracker(() => {
    // Subscribe to users, events and RSVPs
    const usersHandle = Meteor.subscribe(UserPublications.allUsers);
    const rolesHandle = Meteor.subscribe('allRoles');
    const eventsHandle = Meteor.subscribe('events.all');
    const rsvpsHandle = Meteor.subscribe('rsvps.myEvents');
    const popularPostsHandle = Meteor.subscribe(ForumPublications.popularPosts, 5);
    const categoriesHandle = Meteor.subscribe(ForumPublications.categories);
    
    // Get the current date to filter upcoming events
    const today = new Date();
    const currentDateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    return {
      users: Meteor.users.find({}).fetch(),
      events: Events.find({}).fetch(),
      rsvps: UserRsvps.find({}).fetch(),
      // Get upcoming events (events with dates greater than or equal to today)
      upcomingEvents: Events.find(
        { date: { $gte: currentDateStr } },
        { sort: { date: 1, time: 1 }, limit: 5 }
      ).fetch(),
      // Get popular forum posts
      popularPosts: ForumPosts.find(
        {}, 
        { sort: { views: -1, replyCount: -1 }, limit: 5 }
      ).fetch(),
      isLoading: !usersHandle.ready() || !eventsHandle.ready() || 
                !rsvpsHandle.ready() || !popularPostsHandle.ready() || 
                !categoriesHandle.ready() || !rolesHandle.ready()
    };
  }, []);

  const handleRoleChange = (userId, newRole) => {
    Meteor.call(UserMethods.updateRole, userId, newRole, (error) => {
      if (error) {
        showError('Failed to update role: ' + error.reason);
      } else {
        success(`Successfully assigned ${newRole} role`);
      }
    });
  };
  
  const handleRemoveRole = (userId, role) => {
    if (confirm(`Are you sure you want to remove the ${role} role?`)) {
      Meteor.call('users.removeRole', userId, role, (error) => {
        if (error) {
          showError('Failed to remove role: ' + error.reason);
        } else {
          success(`Successfully removed ${role} role`);
        }
      });
    }
  };

  // Helper to determine if a user has a specific role
  const userHasRole = (user, role) => {
    const userRoles = getUserRoles(user._id);
    return userRoles.includes(role);
  };

  const handleDeleteUser = (userId) => {
    if (confirm('Are you sure you want to delete this user?')) {
      Meteor.call(UserMethods.deleteUser, userId, (error) => {
        if (error) {
          showError('Failed to delete user: ' + error.reason);
        } else {
          success('User deleted successfully');
        }
      });
    }
  };

  const handleApproveUser = (userId) => {
    Meteor.call('users.approve', userId, (error) => {
      if (error) {
        showError('Failed to approve user: ' + error.reason);
      } else {
        success('User approved successfully');
      }
    });
  };

  const handleRejectUser = (userId, reason = '') => {
    Meteor.call('users.reject', userId, reason, (error) => {
      if (error) {
        showError('Failed to reject user: ' + error.reason);
      } else {
        success('User rejected successfully');
      }
    });
  };

  const handleNavigate = (tab) => {
    setActiveTab(tab);
    setMenuOpen(false);
  };

  return (
    <ProtectedRoute requireRoles={[ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MODERATOR, ROLES.EVENT_CREATOR]}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          {/* Mobile Header with Menu Toggle */}
          <div className="flex items-center justify-between mb-4 sm:mb-8 md:hidden">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
            </div>
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-800 shadow"
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
            {/* Sidebar */}
            <AdminSidebar 
              activeTab={activeTab}
              menuOpen={menuOpen}
              onNavigate={handleNavigate}
              onMenuToggle={setMenuOpen}
            />
            
            {/* Main Content */}
            <div className="flex-1">
              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && (
                <div>
                  {/* Stats Cards */}
                  <AdminStatsCards 
                    users={users}
                    events={events}
                    rsvps={rsvps}
                    isLoading={isLoading}
                    onStatClick={handleNavigate}
                  />
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Quick Actions */}
                    <AdminQuickActions onNavigate={handleNavigate} />
                    
                    {/* Upcoming Events */}
                    <AdminUpcomingEvents 
                      events={upcomingEvents}
                      isLoading={isLoading}
                      onNavigate={handleNavigate}
                    />
                  </div>
                  
                  {/* Popular Forum Posts */}
                  <AdminPopularPosts 
                    posts={popularPosts}
                    isLoading={isLoading}
                    onNavigate={handleNavigate}
                  />
                </div>
              )}
              
              {/* User Management Tab */}
              {activeTab === 'users' && can.deleteUsers() && (
                <AdminUserManagement 
                  users={users}
                  isLoading={isLoading}
                  onRoleChange={handleRoleChange}
                  onRemoveRole={handleRemoveRole}
                  onDeleteUser={handleDeleteUser}
                  onApproveUser={handleApproveUser}
                  onRejectUser={handleRejectUser}
                  userHasRole={userHasRole}
                />
              )}
              
              {/* Event Management Tab */}
              {activeTab === 'events' && can.createEvent() && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Event Management</h2>
                  </div>
                  <div className="p-6">
                    <AddEventForm />
                  </div>
                </div>
              )}

              {/* Forum Categories Tab */}
              {activeTab === 'forumCategories' && can.createCategory() && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Forum Categories Management</h2>
                  </div>
                  <div className="p-6">
                    <ForumManagement />
                  </div>
                </div>
              )}
              
              {/* Forum Posts Tab */}
              {activeTab === 'forumPosts' && can.moderatePosts() && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Forum Posts Management</h2>
                  </div>
                  <div className="p-6">
                    <ForumPostManagement />
                  </div>
                </div>
              )}
              
              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <AdminSettings />
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};