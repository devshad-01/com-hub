import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../../api/users/roles';

export const ProtectedRoute = ({ 
  children, 
  requireAdmin = false, 
  requireRoles = [], 
  fallback = null 
}) => {
  // Use our AuthContext hook instead of directly using useTracker
  const { user, isLoading, hasRole } = useAuth();
  
  // Check if user has the required roles
  const hasRequiredPermissions = 
    (requireAdmin ? hasRole([ROLES.SUPERADMIN, ROLES.ADMIN]) : true) && 
    (requireRoles.length > 0 ? hasRole(requireRoles) : true);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return fallback || <Navigate to="/login" replace />;
  }

  if ((requireAdmin || requireRoles.length > 0) && !hasRequiredPermissions) {
    return <Navigate to="/" replace />;
  }

  return children;
};
