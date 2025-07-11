import React, { useState, useEffect } from 'react';
import { User, Edit2, X, Check, ChevronDown, ChevronUp } from 'lucide-react';

export const UsernameSection = ({
  user,
  isEditingUsername,
  setIsEditingUsername,
  isSaving,
  usernameData,
  setUsernameData,
  handleUsernameChange,
  handleUsernameUpdate,
  handleCancel,
  isExpanded = true,
  onToggle
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  useEffect(() => {
    // Function to update state based on window sizea
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
              // Only toggle on mobile and only when clicking on this area (not on buttons)
              if (isMobile) {
                onToggle();
              }
            }}
          >
            <User className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-orange-500 dark:text-orange-400 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Username Settings
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Manage your unique username identifier
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
          
          <div className="flex items-center">
            {/* Removed separate toggle button as it's now part of the header */}
            
            {/* Edit Button */}
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering toggle when clicking edit
                isEditingUsername ? handleCancel() : setIsEditingUsername(true);
              }}
              className={`flex items-center justify-center px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer text-sm ${isEditingUsername
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600'
                  : 'bg-orange-500 text-white hover:bg-orange-600 shadow-md hover:shadow-lg'
              }`}
            >
              {isEditingUsername ? (
                <>
                  <X className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Cancel</span>
                  <span className="sm:hidden">Cancel</span>
                </>
              ) : (
                <>
                  <Edit2 className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Change</span>
                  <span className="sm:hidden">Edit</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Make content conditionally visible on mobile */}
      <div className={`${!isExpanded ? 'hidden md:block' : ''}`}>
        <div className="p-4 sm:p-6">
          {isEditingUsername ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                New Username
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={usernameData.username}
                  onChange={handleUsernameChange}
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent dark:bg-slate-700 dark:text-white transition-colors text-sm sm:text-base"
                  placeholder="Enter new username"
                />
                <button
                  onClick={handleUsernameUpdate}
                  disabled={isSaving}
                  className="flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 cursor-pointer text-sm sm:text-base"
                >
                  {isSaving ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2">
                Username must be 3-20 characters and contain only letters, numbers, hyphens, and underscores.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Current Username
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2.5 sm:py-3 px-3 sm:px-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 space-y-2 sm:space-y-0">
                <span className="text-base sm:text-lg font-mono text-slate-900 dark:text-white break-all">
                  @{user?.username || 'No username set'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded self-start sm:self-center">
                  UNIQUE ID
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
