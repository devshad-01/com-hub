import React, { memo } from 'react';
import { Search } from 'lucide-react';

export const SearchAndSort = memo(({ 
  searchTerm, 
  onSearchChange, 
  sortBy, 
  onSortChange 
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-warm border border-warm-200 dark:border-slate-700 p-6 mb-6 animate-fadeIn transition-smooth">
      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search posts, tags, or content..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-warm-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-warm-500 dark:focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all duration-300 ease-in-out transform focus:scale-[1.02]"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-warm-400 dark:text-slate-400" />
            </div>
          </div>
        </div>
        <div className="md:w-48">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full py-3 px-4 border border-warm-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-warm-500 dark:focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all duration-300 ease-in-out transform focus:scale-[1.02]"
          >
            <option value="recent">Recent Activity</option>
            <option value="popular">Most Popular</option>
            <option value="replies">Most Replies</option>
            <option value="views">Most Views</option>
          </select>
        </div>
      </div>
    </div>
  );
});
