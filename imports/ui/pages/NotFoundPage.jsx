import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background dark:bg-slate-900 flex items-center justify-center">
      
      {/* Main Content */}
      <div className="text-center px-4 sm:px-6 lg:px-8">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          
          {/* 404 Number */}
          <div className="mb-8">
            <h1 className="text-8xl sm:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-warm-500 to-orange-600 dark:from-orange-400 dark:via-orange-500 dark:to-warm-500 leading-none">
              404
            </h1>
          </div>

          {/* Message */}
          <div className="mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-warm-900 dark:text-white mb-4">
              Page Not Found
            </h2>
            <p className="text-lg text-warm-600 dark:text-slate-300 max-w-md mx-auto">
              The page you're looking for doesn't exist.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/"
              className="inline-flex items-center px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-warm hover:shadow-warm-lg group cursor-pointer"
            >
              <Home className="w-5 h-5 mr-2" />
              Go Home
            </Link>
            
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center px-8 py-4 border-2 border-warm-500 dark:border-orange-500 text-warm-500 dark:text-orange-400 hover:bg-warm-50 dark:hover:bg-slate-800 font-semibold rounded-lg transition-all duration-200 group cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
