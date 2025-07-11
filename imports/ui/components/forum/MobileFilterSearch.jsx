import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronDown } from 'lucide-react';

export const MobileFilterSearch = ({
  categories = [],
  selectedCategory,
  onCategoryChange,
  searchTerm,
  onSearchChange,
  categoriesLoading = false
}) => {
  const [showSearchView, setShowSearchView] = useState(false);

  const selectedCategoryInfo = categories.find(cat => cat._id === selectedCategory);

  const handleSearchToggle = () => {
    setShowSearchView(true);
  };

  const handleBackToFilter = () => {
    setShowSearchView(false);
  };

  return (
    <div className="md:hidden bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-warm-200 dark:border-slate-700 p-3 mb-4 mx-3">
      {/* Filter View */}
      {!showSearchView && (
        <div className="filter-view">
          <div className="flex items-center gap-2">
            {/* Custom Dropdown */}
            <div className="flex-1 relative">
              <select
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="w-full px-3 py-2.5 pr-8 rounded-full border border-warm-200 dark:border-slate-600 bg-warm-50 dark:bg-slate-700 text-warm-700 dark:text-white text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-warm-500 dark:focus:ring-orange-500"
                disabled={categoriesLoading}
              >
                {categoriesLoading ? (
                  <option>Loading...</option>
                ) : (
                  categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.icon} {category.name}
                    </option>
                  ))
                )}
              </select>
              
              {/* Custom dropdown icon */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-warm-500 dark:text-slate-400" />
              </div>
            </div>

            {/* Search Toggle Button */}
            <button
              onClick={handleSearchToggle}
              className="p-2.5 text-warm-600 dark:text-slate-400 hover:text-warm-700 dark:hover:text-slate-300 hover:bg-warm-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              title="Search topics"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Search View */}
      {showSearchView && (
        <div className="search-view">
          <div className="relative">
            {/* Back Button */}
            <button
              onClick={handleBackToFilter}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 p-1 text-warm-600 dark:text-slate-400 hover:text-warm-700 dark:hover:text-slate-300 transition-colors"
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
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-warm-200 dark:border-slate-600 bg-warm-50 dark:bg-slate-700 text-warm-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-warm-500 dark:focus:ring-orange-500 placeholder-warm-400 dark:placeholder-slate-500"
              autoFocus
            />
          </div>
        </div>
      )}
    </div>
  );
};
