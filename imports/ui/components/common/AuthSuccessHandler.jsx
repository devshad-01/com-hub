import React, { useEffect } from 'react';
import { useToastContext } from './ToastProvider';

export const AuthSuccessHandler = ({ userId }) => {
  const { success } = useToastContext();

  useEffect(() => {
    // Only check for auth success when user is logged in
    if (userId) {
      const authSuccess = localStorage.getItem('authSuccess');
      if (authSuccess) {
        try {
          const { type, message } = JSON.parse(authSuccess);
          
          // Show appropriate success toast
          if (type === 'login') {
            success('Welcome back!', message);
          } else if (type === 'register') {
            success('Welcome to CommunityHub!', message);
          }
          
          // Clear the stored message
          localStorage.removeItem('authSuccess');
        } catch (error) {
          console.error('Error parsing auth success message:', error);
          localStorage.removeItem('authSuccess');
        }
      }
    }
  }, [userId, success]);

  return null; // This component doesn't render anything
};
