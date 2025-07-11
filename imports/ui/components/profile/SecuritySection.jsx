import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail, Check, X, Key, Settings, ChevronDown, ChevronUp } from 'lucide-react';

export const SecuritySection = ({
  user,
  showEmailActions,
  setShowEmailActions,
  handleSendVerificationEmail,
  handlePasswordReset,
  isExpanded = true,
  onToggle
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  useEffect(() => {
    // Function to update state based on window size
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Call once to initialize
    handleResize();
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center">
          <div 
            className="flex items-center flex-1 cursor-pointer md:cursor-default"
            onClick={(e) => {
              // Only toggle on mobile and only when clicking on this area
              if (isMobile) {
                onToggle();
              }
            }}
          >
            <Shield className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-orange-500 dark:text-orange-400 flex-shrink-0" />
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                Security
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Account protection
              </p>
            </div>
            
            {/* Mobile Toggle Icon (integrated with header for better UX) */}
            {isMobile && (
              <span className="ml-auto md:hidden">
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className={`${!isExpanded ? 'hidden md:block' : ''} p-4 sm:p-6 space-y-4`}>
        <div className="space-y-3">
          {!user?.emails?.[0]?.verified && (
            <button
              onClick={handleSendVerificationEmail}
              className="w-full flex items-center justify-center px-4 py-2.5 sm:py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium transition-all duration-200 cursor-pointer text-sm"
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Verification Email
            </button>
          )}
          
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg p-3 sm:p-4 border border-orange-200 dark:border-orange-700">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Key className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 dark:text-orange-400 mt-0.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                  Password Reset
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                  Reset your password securely via email
                </p>
                <div className="space-y-2">
                  <button
                    onClick={handlePasswordReset}
                    className="w-full flex items-center justify-center px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium transition-all duration-200 cursor-pointer text-xs"
                  >
                    <Key className="h-3 w-3 mr-1" />
                    Send Reset Email
                  </button>
                  <Link
                    to="/forgot-password"
                    className="w-full flex items-center justify-center px-3 py-2 border border-orange-300 dark:border-orange-600 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/30 font-medium transition-all duration-200 text-xs"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Reset Portal
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
