import React from 'react';

export const PostImages = ({ images }) => {
  if (!images || images.length === 0) return null;

  // Helper to get the image URL from either a string or an object
  const getImageUrl = (img) => (typeof img === 'string' ? img : img.url);

  return (
    <div className="mb-4">
      {images.length === 1 ? (
        // Single image - responsive with mobile-friendly max height, full dimensions on desktop
        <div className="relative">
          <img
            src={getImageUrl(images[0])}
            alt="Post image"
            className="w-full rounded-lg border border-warm-200 dark:border-slate-600 object-cover sm:object-contain max-h-[300px] sm:max-h-[500px]"
          />
        </div>
      ) : images.length === 2 ? (
        // Two images - responsive grid, stack on mobile, better sizing on desktop
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {images.map((image, index) => (
            <div key={index} className="relative">
              <img
                src={getImageUrl(image)}
                alt={`Post image ${index + 1}`}
                className="w-full rounded-lg border border-warm-200 dark:border-slate-600 object-cover h-[200px] sm:h-[250px]"
              />
            </div>
          ))}
        </div>
      ) : images.length === 3 ? (
        // Three images - responsive layout, stack on mobile
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" style={{ minHeight: '200px' }}>
          <div className="sm:row-span-2">
            <img
              src={getImageUrl(images[0])}
              alt="Post image 1"
              className="w-full h-48 sm:h-full object-cover rounded-lg border border-warm-200 dark:border-slate-600"
            />
          </div>
          <div className="space-y-2 grid grid-cols-2 sm:grid-cols-1 gap-2 sm:flex sm:flex-col">
            <img
              src={getImageUrl(images[1])}
              alt="Post image 2"
              className="w-full h-24 sm:h-auto sm:flex-1 object-cover rounded-lg border border-warm-200 dark:border-slate-600"
            />
            <img
              src={getImageUrl(images[2])}
              alt="Post image 3"
              className="w-full h-24 sm:h-auto sm:flex-1 object-cover rounded-lg border border-warm-200 dark:border-slate-600"
            />
          </div>
        </div>
      ) : (
        // Four or more images - responsive grid
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" style={{ minHeight: '150px' }}>
          {images.slice(0, 3).map((image, index) => (
            <div key={index} className="relative">
              <img
                src={getImageUrl(image)}
                alt={`Post image ${index + 1}`}
                className="w-full h-24 sm:h-32 object-cover rounded-lg border border-warm-200 dark:border-slate-600"
              />
              {index === 2 && images.length > 3 && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-lg">
                  <span className="text-white text-xs sm:text-sm font-semibold">
                    +{images.length - 3} more
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
