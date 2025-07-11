import React, { createContext, useContext } from 'react';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from './Toast';

const ToastContext = createContext();

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const toastMethods = useToast();

  return (
    <ToastContext.Provider value={toastMethods}>
      {children}
      <ToastContainer 
        toasts={toastMethods.toasts} 
        onRemoveToast={toastMethods.removeToast} 
      />
    </ToastContext.Provider>
  );
};
