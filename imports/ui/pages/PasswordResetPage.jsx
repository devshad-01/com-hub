import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { PasswordResetForm } from '../components/auth/PasswordResetForm';

export const PasswordResetPage = () => {
  const { isLoggedIn } = useAuth();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <PasswordResetForm isLoggedIn={isLoggedIn} />
    </div>
  );
};
