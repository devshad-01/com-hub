import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const toastTypes = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-800',
    iconColor: 'text-emerald-600',
    accentColor: 'bg-emerald-500'
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-50',
    textColor: 'text-red-800',
    iconColor: 'text-red-600',
    accentColor: 'bg-red-500'
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-800',
    iconColor: 'text-amber-600',
    accentColor: 'bg-amber-500'
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-800',
    iconColor: 'text-blue-600',
    accentColor: 'bg-blue-500'
  }
};

export const Toast = ({ id, type = 'info', title, message, duration = 3000, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const config = toastTypes[type] || toastTypes.info;
  const Icon = config.icon;

  useEffect(() => {
    // Animate in
    const showTimer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto remove after duration
    const removeTimer = setTimeout(() => {
      handleRemove();
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(removeTimer);
    };
  }, [duration]);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onRemove(id);
    }, 300);
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-lg shadow-sm border backdrop-blur-sm
        ${config.bgColor} ${config.textColor} border-white/20
        transform transition-all duration-200 ease-out
        ${isVisible && !isLeaving 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
        }
        max-w-xs w-full min-w-64
      `}
    >
      {/* Accent line */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${config.accentColor}`} />
      
      <div className="flex items-center space-x-2 p-3">
        <Icon className={`w-4 h-4 flex-shrink-0 ${config.iconColor}`} />
        <div className="flex-1 min-w-0">
          {title && (
            <p className="text-xs font-medium leading-tight">
              {title}
            </p>
          )}
          {message && (
            <p className="text-xs opacity-80 leading-tight mt-0.5 line-clamp-2">
              {message}
            </p>
          )}
        </div>
        <button
          onClick={handleRemove}
          className={`flex-shrink-0 p-0.5 hover:bg-black/10 rounded transition-colors ${config.iconColor} opacity-60 hover:opacity-100`}
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export const ToastContainer = ({ toasts, onRemoveToast }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-1.5">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          {...toast}
          onRemove={onRemoveToast}
        />
      ))}
    </div>
  );
};
