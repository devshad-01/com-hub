import React from 'react';
import { Activity, Users, CalendarPlus, MessageSquare, Settings, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const AdminSidebar = ({ 
  activeTab, 
  onNavigate, 
  menuOpen, 
  onMenuToggle 
}) => {
  const { can } = useAuth();

  const handleTabChange = (tab) => {
    onNavigate(tab);
    if (onMenuToggle) {
      onMenuToggle(false);
    }
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Activity,
      condition: true
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      condition: can.deleteUsers()
    },
    {
      id: 'events',
      label: 'Event Management',
      icon: CalendarPlus,
      condition: can.createEvent()
    },
    {
      id: 'forumCategories',
      label: 'Forum Categories',
      icon: MessageSquare,
      condition: can.createCategory()
    },
    {
      id: 'forumPosts',
      label: 'Forum Posts',
      icon: MessageSquare,
      condition: can.moderatePosts()
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      condition: true
    }
  ];

  return (
    <div className={`${
      menuOpen ? 'block' : 'hidden'
    } md:block w-full md:w-64 flex-shrink-0`}>
      <div className="hidden md:block mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Manage your community
        </p>
      </div>
        
      <nav className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 overflow-hidden">
        <ul>
          {menuItems.map((item) => {
            if (!item.condition) return null;
            
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button 
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium ${
                    activeTab === item.id 
                      ? 'bg-orange-500 text-white' 
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                  } transition-colors duration-150`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};
