import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { NavigationBar } from './NavigationBar';
import { Footer } from './Footer';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../../api/users/roles';

export const RouteRenderer = ({ children, userId, requireAdmin = false }) => {
  const location = useLocation();
  const { hasRole, can } = useAuth();

  // Check admin access if required (only applies to authenticated users)
  if (requireAdmin && userId && !can.accessAdminDashboard()) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="app min-h-screen bg-slate-50 dark:bg-slate-900">
      <NavigationBar userId={userId} />
      
      <main className="flex-1">
        {children}
      </main>
      
      <Footer />
    </div>
  );
};
