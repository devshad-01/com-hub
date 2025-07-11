import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

export const ForgotPasswordForm = ({ isLoggedIn = false }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const { success, error: showError } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Basic validation
    if (!email.trim()) {
      setError('Email is required');
      setIsLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Invalid email format');
      setIsLoading(false);
      return;
    }

    // Show loading toast
    success(
      '🔄 Sending Reset Email...', 
      'Please wait while we send your password reset instructions.',
      { duration: 3000 }
    );

    try {
      // Use Meteor's built-in forgot password functionality
      await new Promise((resolve, reject) => {
        Accounts.forgotPassword({ email }, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      setIsSubmitted(true);
      success(
        '📧 Reset Email Sent!', 
        `We've sent password reset instructions to ${email}. Please check your inbox and spam folder.`,
        { duration: 6000 }
      );
    } catch (err) {
      console.error('Forgot password error:', err);
      if (err.reason === 'User not found') {
        setError('No account found with this email address');
        showError(
          '❌ Account Not Found', 
          'No account exists with this email address. Please check your email or create a new account.',
          { duration: 5000 }
        );
      } else {
        setError(err.reason || err.message || 'Failed to send password reset email');
        showError(
          '❌ Reset Failed', 
          'Unable to send password reset email. Please try again or contact support.',
          { duration: 5000 }
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-warm-50 via-background to-warm-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 border shadow-lg rounded-lg p-6 border-grey-300 text-center">
          <div>
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-500">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-warm-900 dark:text-white">
              Check Your Email
            </h2>
            <p className="mt-2 text-center text-sm text-warm-700 dark:text-gray-300">
              We've sent password reset instructions to
            </p>
            <p className="text-center text-sm font-medium text-orange-600 dark:text-orange-400">
              {email}
            </p>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-warm-600 dark:text-gray-400">
              Please check your email and click the password reset link to continue. 
              The link will expire in 24 hours for security reasons.
            </p>
            
            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-warm-600 hover:text-warm-700 dark:text-orange-400 dark:hover:text-orange-300 text-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-warm-50 via-background to-warm-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 border shadow-lg rounded-lg p-6 border-grey-300">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-orange-500 dark:bg-orange-500">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-warm-900 dark:text-white">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-warm-700 dark:text-gray-300">
            Enter your email address and we'll send you a link to reset your password
          </p>
          
          {isLoggedIn && (
            <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
              <p className="text-center text-sm text-blue-700 dark:text-blue-300">
                <Mail className="inline h-4 w-4 mr-1" />
                You're currently logged in. This will send a password reset link to change your current password.
              </p>
            </div>
          )}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 px-4 py-3 rounded-md text-sm flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="sr-only">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-orange-500 dark:text-gray-400" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-warm-200 dark:border-gray-600 placeholder-warm-400 dark:placeholder-gray-400 text-warm-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-500 focus:border-orange-500 dark:focus:border-orange-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Sending...' : 'Send reset email'}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-warm-600 hover:text-warm-700 dark:text-orange-400 dark:hover:text-orange-300 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
