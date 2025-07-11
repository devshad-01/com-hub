import React, { useState } from 'react';
import { MessageSquare, Search, ChevronLeft, ChevronDown } from 'lucide-react';

export const ForumHeader = ({ 
  user, 
  onToggleChat, 
  showGeneralChat,
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  // Mobile filter props
  categories = [],
  selectedCategory,
  onCategoryChange,
  categoriesLoading = false
}) => {
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const handleMobileSearchToggle = () => {
    setShowMobileSearch(true);
  };

  const handleBackToFilter = () => {
    setShowMobileSearch(false);
  };

  return (
    <section>
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-2">
        {/* Desktop & Mobile Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-warm-500 to-orange-500 dark:from-orange-500 dark:to-red-500 shadow-lg mr-4 flex-shrink-0">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-orange-400 dark:text-orange-400">Community Forum</h1>
                <p className="text-slate-400 dark:text-slate-400 hidden sm:block">Discuss, share, and connect with your community</p>
              </div>
            </div>
            {/* Desktop Search & Sort Controls */}
            <div className="hidden lg:flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search topics..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-slate-400"
                />
              </div>
              
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="recent">Recent</option>
                <option value="popular">Popular</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </div>
          
          {/* General Chat Button - desktop only, right aligned below filter/search */}
          <div className="hidden lg:flex justify-end mt-2">
            <button
              type="button"
              onClick={onToggleChat}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all
                bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600
                ml-0 mr-1 shadow-none border border-slate-200 dark:border-slate-600`}
              title="Open General Chat"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">General Chat</span>
            </button>
          </div>

          {/* Mobile subtitle */}
          <p className="text-slate-400 dark:text-slate-400 sm:hidden">Discuss, share, and connect with your community</p>
        </header>

        {/* Mobile Filter/Search - Only show on mobile/tablet */}
        <div className="mb-2 lg:hidden">
          {!showMobileSearch ? (
            /* Filter View */
            <div className="flex items-center gap-2 bg-slate-700 rounded-lg p-3">
              {/* Category Dropdown */}
              <div className="flex-1 relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => onCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 pr-8 rounded-lg border border-slate-600 bg-slate-800 text-white text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={categoriesLoading}
                >
                  {categoriesLoading ? (
                    <option>Loading...</option>
                  ) : (
                    categories.map(category => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))
                  )}
                </select>
                
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Search Toggle */}
              <button
                onClick={handleMobileSearchToggle}
                className="p-2 text-orange-400 hover:text-orange-300 hover:bg-slate-600 rounded-lg transition-colors"
                title="Search topics"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          ) : (
            /* Search View */
            <div className="bg-slate-700 rounded-lg p-3">
              <div className="relative">
                {/* Back Button */}
                <button
                  onClick={handleBackToFilter}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 p-1 text-orange-400 hover:text-orange-300 transition-colors"
                  title="Back to filter"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Search Input */}
                <input
                  type="text"
                  placeholder="Search topics..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-600 bg-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-slate-400"
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
