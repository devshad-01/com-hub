import { useState, useCallback } from 'react';

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      ...toast,
      createdAt: new Date()
    };
    
    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods for different toast types
  const success = useCallback((title, message, options = {}) => {
    return addToast({
      type: 'success',
      title,
      message,
      duration: 3000,
      ...options
    });
  }, [addToast]);

  const error = useCallback((title, message, options = {}) => {
    return addToast({
      type: 'error',
      title,
      message,
      duration: 4000,
      ...options
    });
  }, [addToast]);

  const warning = useCallback((title, message, options = {}) => {
    return addToast({
      type: 'warning',
      title,
      message,
      duration: 3500,
      ...options
    });
  }, [addToast]);

  const info = useCallback((title, message, options = {}) => {
    return addToast({
      type: 'info',
      title,
      message,
      duration: 3000,
      ...options
    });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    success,
    error,
    warning,
    info
  };
};
