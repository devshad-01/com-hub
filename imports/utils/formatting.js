// Utility function for date formatting
export const formatDate = (date) => {
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  };
  return new Date(date).toLocaleDateString(undefined, options);
};

// Utility function for string truncation
export const truncateString = (str, maxLength = 100) => {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
};
