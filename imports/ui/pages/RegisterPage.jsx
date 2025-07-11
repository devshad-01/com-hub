import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RegisterFormWithVerification } from '../components/auth/RegisterFormWithVerification';

export const RegisterPage = () => {
  const navigate = useNavigate();

  const handleRegistrationSuccess = () => {
    // Redirect to home page after successful registration
    navigate('/');
  };

  return <RegisterFormWithVerification onSuccess={handleRegistrationSuccess} />;
};
