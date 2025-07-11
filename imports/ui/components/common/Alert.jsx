// imports/ui/components/common/Alert.jsx
import React from 'react';
import PropTypes from 'prop-types'; // For prop type validation
import { Info, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'; // Example icons

export const Alert = ({
  variant = 'info', // 'info', 'success', 'warning', 'error'
  title,
  message,
  className = '',
  children, // Allow custom content
  onClose, // Optional close button handler
  showIcon = true,
}) => {
  let baseClasses = 'p-4 rounded-lg shadow-sm flex items-start space-x-3 transition-all duration-300';
  let icon;
  let titleClasses = 'font-semibold text-lg';
  let messageClasses = 'text-sm';

  // Define styles and icon based on variant
  switch (variant) {
    case 'success':
      baseClasses += ' bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800';
      titleClasses += ' text-green-800 dark:text-green-300';
      messageClasses += ' text-green-700 dark:text-green-400';
      icon = <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />;
      break;
    case 'warning':
      baseClasses += ' bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800';
      titleClasses += ' text-amber-800 dark:text-amber-300';
      messageClasses += ' text-amber-700 dark:text-amber-400';
      icon = <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />;
      break;
    case 'error':
      baseClasses += ' bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800';
      titleClasses += ' text-red-800 dark:text-red-300';
      messageClasses += ' text-red-700 dark:text-red-400';
      icon = <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />;
      break;
    case 'info':
    default:
      baseClasses += ' bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
      titleClasses += ' text-blue-800 dark:text-blue-300';
      messageClasses += ' text-blue-700 dark:text-blue-400';
      icon = <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />;
      break;
  }

  return (
    <div className={`${baseClasses} ${className}`} role="alert">
      {showIcon && <div className="flex-shrink-0 mt-0.5">{icon}</div>}
      <div className="flex-grow">
        {title && <h3 className={titleClasses}>{title}</h3>}
        {message && <p className={messageClasses}>{message}</p>}
        {children && <div className={messageClasses}>{children}</div>} {/* Render children if provided */}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-auto p-1 rounded-md transition-colors duration-200
                     text-slate-500 hover:bg-slate-200 hover:text-slate-700
                     dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          aria-label="Close alert"
        >
          <XCircle className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

// Prop type validation for better development
Alert.propTypes = {
  variant: PropTypes.oneOf(['info', 'success', 'warning', 'error']),
  title: PropTypes.string,
  message: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node,
  onClose: PropTypes.func,
  showIcon: PropTypes.bool,
};