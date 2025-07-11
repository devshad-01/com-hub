import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { ClientSecurity } from '../../utils/security';

export const PasswordResetForm = ({ isLoggedIn = false }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isTokenValid, setIsTokenValid] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState({ strength: 0, isValid: false, errors: [] });
  const { success, error: showError } = useToast();

  // Validate token on component mount
  useEffect(() => {
    if (!token) {
      setError('Invalid or missing password reset token');
      setIsTokenValid(false);
      showError(
        '🔗 Invalid Reset Link', 
        'This password reset link is invalid or missing. Please request a new password reset email.',
        { duration: 7000 }
      );
      return;
    }
    
    // For now, we'll assume the token is valid if it exists
    // In a real implementation, you might want to validate the token with the server
    setIsTokenValid(true);
  }, [token, showError]);

  // Update password strength when password changes
  useEffect(() => {
    if (formData.password) {
      const validation = ClientSecurity.validatePasswordStrength(formData.password);
      setPasswordStrength(validation);
    } else {
      setPasswordStrength({ strength: 0, isValid: false, errors: [] });
    }
  }, [formData.password]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (!formData.password) {
      setError('Password is required');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (!passwordStrength.isValid) {
      setError('Password does not meet security requirements');
      setIsLoading(false);
      return;
    }

    // Show loading toast
    success(
      '🔄 Updating Password...', 
      'Please wait while we securely update your password.',
      { duration: 3000 }
    );

    try {
      // Use Meteor's built-in reset password functionality
      await new Promise((resolve, reject) => {
        Accounts.resetPassword(token, formData.password, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      success(
        '🎉 Password Reset Successful!', 
        isLoggedIn 
          ? 'Your password has been updated successfully. You will be logged out for security reasons.'
          : 'Your password has been updated successfully. You can now log in with your new password.',
        { duration: 8000 }
      );
      
      // Log out the user for security if they were logged in
      if (isLoggedIn) {
        Meteor.logout(() => {
          // After logout, redirect to login page
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 2000);
        });
      } else {
        // If not logged in, redirect to login page
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      }
      
    } catch (err) {
      console.error('Password reset error:', err);
      if (err.reason === 'Token expired') {
        setError('Password reset link has expired. Please request a new one.');
        showError(
          '⏰ Link Expired', 
          'This password reset link has expired. Please request a new password reset email.',
          { duration: 6000 }
        );
      } else if (err.reason === 'Token not found') {
        setError('Invalid password reset link. Please request a new one.');
        showError(
          '🔗 Invalid Link', 
          'This password reset link is invalid or has already been used. Please request a new one.',
          { duration: 6000 }
        );
      } else {
        setError(err.reason || err.message || 'Failed to reset password');
        showError(
          '❌ Reset Failed', 
          'Unable to reset your password. Please try again or request a new reset link.',
          { duration: 5000 }
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const strengthIndicator = ClientSecurity.getPasswordStrengthIndicator(passwordStrength.strength);

  // Show error if token is invalid
  if (isTokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-warm-50 via-background to-warm-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 border shadow-lg rounded-lg p-6 border-grey-300 text-center">
          <div>
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-500">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-warm-900 dark:text-white">
              Invalid Reset Link
            </h2>
            <p className="mt-2 text-center text-sm text-warm-700 dark:text-gray-300">
              This password reset link is invalid or has expired.
            </p>
          </div>
          
          <div className="space-y-4">
            <Link
              to="/forgot-password"
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-orange-500 transition-colors"
            >
              Request new reset link
            </Link>
            
            <div className="text-center">
              <Link
                to="/login"
                className="text-warm-600 hover:text-warm-700 dark:text-orange-400 dark:hover:text-orange-300 text-sm"
              >
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while validating token
  if (isTokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-warm-50 via-background to-warm-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 border shadow-lg rounded-lg p-6 border-grey-300">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-orange-500 dark:bg-orange-500">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-warm-900 dark:text-white">
            Set new password
          </h2>
          <p className="mt-2 text-center text-sm text-warm-700 dark:text-gray-300">
            Choose a strong password for your account
          </p>
          
          {isLoggedIn && (
            <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
              <p className="text-center text-sm text-blue-700 dark:text-blue-300">
                <Shield className="inline h-4 w-4 mr-1" />
                You're currently logged in. This will update your account password.
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

          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="sr-only">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-orange-500 dark:text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full pl-10 pr-10 py-3 border border-warm-200 dark:border-gray-600 placeholder-warm-400 dark:placeholder-gray-400 text-warm-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-500 focus:border-orange-500 dark:focus:border-orange-500 focus:z-10 sm:text-sm"
                  placeholder="New password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-orange-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-gray-300"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {/* Password strength indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-warm-700 dark:text-gray-300">Password Strength</span>
                    <span className={strengthIndicator.color}>{strengthIndicator.text}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${strengthIndicator.bgColor}`}
                      style={{ width: `${passwordStrength.strength}%` }}
                    ></div>
                  </div>
                  {passwordStrength.errors.length > 0 && (
                    <ul className="mt-2 text-sm text-red-600 dark:text-red-400 space-y-1">
                      {passwordStrength.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="sr-only">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-orange-500 dark:text-gray-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full pl-10 pr-10 py-3 border border-warm-200 dark:border-gray-600 placeholder-warm-400 dark:placeholder-gray-400 text-warm-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-500 focus:border-orange-500 dark:focus:border-orange-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-orange-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-gray-300"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">Passwords do not match</p>
              )}
            </div>
          </div>

          <div className="text-xs text-warm-600 dark:text-gray-400 bg-warm-50 dark:bg-gray-800 p-3 rounded-md">
            <p className="font-medium mb-1">Password requirements:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>At least 8 characters long</li>
              <li>Contains uppercase and lowercase letters</li>
              <li>Contains at least one number</li>
              <li>Contains at least one special character</li>
            </ul>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !passwordStrength.isValid || formData.password !== formData.confirmPassword}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating password...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Reset password
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="text-warm-600 hover:text-warm-700 dark:text-orange-400 dark:hover:text-orange-300 text-sm"
            >
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
