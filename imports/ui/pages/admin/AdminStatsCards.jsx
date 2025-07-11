import React from 'react';
import { Users, Shield, CalendarPlus, Activity, Clock } from 'lucide-react';
import { ROLES } from '../../../api/users/roles';
import { AdminStatsSkeleton, AdminDashboardSpinner } from '../../components/common/AdminSkeletons';

export const AdminStatsCards = ({ users, events, rsvps, isLoading, onStatClick }) => {
  const pendingUsers = users.filter(u => u.approvalStatus === 'pending');
  
  const statsData = [
    {
      title: 'Total Users',
      value: isLoading ? null : users.length,
      icon: Users,
      color: 'blue',
      tab: 'users',
    },
    {
      title: 'Pending Approval',
      value: isLoading ? null : pendingUsers.length,
      icon: Clock,
      color: 'yellow',
      highlight: pendingUsers.length > 0,
      tab: 'users',
    },
    {
      title: 'Admins',
      value: isLoading ? null : users.filter(u => 
        u.roles?.includes('admin') || 
        u.roles?.includes(ROLES.ADMIN) || 
        u.profile?.role === 'admin'
      ).length,
      icon: Shield,
      color: 'green',
      tab: 'users',
    },
    {
      title: 'Total Events',
      value: isLoading ? null : events.length,
      icon: CalendarPlus,
      color: 'purple',
      tab: 'events',
    },
    {
      title: 'Active RSVPs',
      value: isLoading ? null : rsvps.filter(rsvp => rsvp.status === 'confirmed').length,
      icon: Activity,
      color: 'orange',
      tab: 'events',
    }
  ];

  const getColorClasses = (color) => {
    const colorMap = {
      blue: { icon: 'text-blue-500', spinner: 'border-blue-500' },
      green: { icon: 'text-green-500', spinner: 'border-green-500' },
      purple: { icon: 'text-purple-500', spinner: 'border-purple-500' },
      orange: { icon: 'text-orange-500', spinner: 'border-orange-500' },
      yellow: { icon: 'text-yellow-500', spinner: 'border-yellow-500' }
    };
    return colorMap[color] || colorMap.blue;
  };

  if (isLoading) {
    return <AdminDashboardSpinner />;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        const colors = getColorClasses(stat.color);
        return (
          <div
            key={index}
            className={`cursor-pointer transition-transform hover:scale-105 bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-slate-200 dark:border-slate-700 ${stat.highlight ? 'ring-2 ring-yellow-500 ring-opacity-50' : ''}`}
            onClick={() => onStatClick && stat.tab && onStatClick(stat.tab)}
            tabIndex={0}
            role="button"
            aria-label={`Go to ${stat.title}`}
          >
            <div className="flex items-center">
              <Icon className={`h-8 w-8 ${colors.icon}`} />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{stat.title}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white flex items-center h-8">
                  {isLoading ? (
                    <span className={`w-6 h-6 rounded-full border-2 ${colors.spinner} border-t-transparent animate-spin`}></span>
                  ) : (
                    <>
                      {stat.value}
                      {stat.highlight && stat.value > 0 && (
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          Action needed
                        </span>
                      )}
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
