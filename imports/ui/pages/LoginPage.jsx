import React from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const LoginPage = () => {
  const { isLoggedIn } = useAuth();

  if (isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  const handleLoginSuccess = () => {
    // Navigation will be handled by the auth state change
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <LoginForm onSuccess={handleLoginSuccess} />
    </div>
  );
};
