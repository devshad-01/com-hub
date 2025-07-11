import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export const ResetPasswordRedirect = () => {
  const navigate = useNavigate();
  const { token } = useParams();

  useEffect(() => {
    if (token) {
      // Redirect to our proper reset password route with token as query parameter
      navigate(`/reset-password?token=${token}`, { replace: true });
    } else {
      // If no token, redirect to forgot password page
      navigate('/forgot-password', { replace: true });
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
};
