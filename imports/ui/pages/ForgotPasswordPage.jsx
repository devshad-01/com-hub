import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm';

export const ForgotPasswordPage = () => {
  const { isLoggedIn } = useAuth();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <ForgotPasswordForm isLoggedIn={isLoggedIn} />
    </div>
  );
};
