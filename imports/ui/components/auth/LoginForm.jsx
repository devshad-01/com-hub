import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Github, AlertTriangle, Shield } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { ClientSecurity } from '../../utils/security';

export const LoginForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(null);
  const { success } = useToast();

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
    setIsLocked(false);

    try {
      // Validate input
      if (!formData.email.trim()) {
        throw new Error('Email is required');
      }
      if (!formData.password) {
        throw new Error('Password is required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Invalid email format');
      }

      // Check if account is locked
      // Login existing user
      await new Promise((resolve, reject) => {
        Meteor.loginWithPassword(formData.email, formData.password, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      // If remember me is enabled, set it after successful login
      if (formData.rememberMe) {
        try {
          await Meteor.callAsync('session.enableRememberMe');
        } catch (rememberMeError) {
          console.warn('Failed to enable remember me:', rememberMeError);
          // Don't fail the login for this
        }
      }
      
      // Store success message for later display
      localStorage.setItem('authSuccess', JSON.stringify({
        type: 'login',
        message: 'Welcome back! You have successfully signed in.'
      }));
      
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Login error:', err);
      
      // Handle specific error types
      if (err.error === 423) {
        // Account locked
        setIsLocked(true);
        setError('Account temporarily locked due to failed login attempts');
      } else if (err.reason) {
        setError(err.reason);
      } else {
        setError(err.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    setIsLoading(true);
    setError('');

    const loginOptions = {
      requestPermissions: provider === 'facebook' ? ['email'] : ['user:email'],
      loginStyle: 'popup'
    };

    const loginMethod = {
      google: Meteor.loginWithGoogle,
      facebook: Meteor.loginWithFacebook,
      github: Meteor.loginWithGithub
    }[provider];

    if (loginMethod) {
      loginMethod(loginOptions, (err) => {
        setIsLoading(false);
        if (err) {
          setError(err.message || `${provider} login failed`);
        } else {
          // Store success message for later display
          localStorage.setItem('authSuccess', JSON.stringify({
            type: 'login',
            message: `Welcome back! You have successfully signed in with ${provider}.`
          }));
          
          if (onSuccess) {
            onSuccess();
          }
        }
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-warm-50 via-background to-warm-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 border shadow-lg rounded-lg p-6 border-grey-300">
        <div>
          <div className="mx-auto h-12 w-12 flex   items-center justify-center rounded-full bg-orange-500 dark:bg-orange-500">
            <User className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-warm-900 dark:text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-warm-700 dark:text-gray-300">
            Welcome back to CommunityHub
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {isLocked && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 dark:text-yellow-400 px-4 py-3 rounded-md text-sm flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Your account is temporarily locked due to multiple failed login attempts. Please try again later.
            </div>
          )}

          <div className="space-y-4">
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
                  value={formData.email}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-warm-200 dark:border-gray-600 placeholder-warm-400 dark:placeholder-gray-400 text-warm-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-500 focus:border-orange-500 dark:focus:border-orange-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-orange-500 dark:text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full pl-10 pr-10 py-3 border border-warm-200 dark:border-gray-600 placeholder-warm-400 dark:placeholder-gray-400 text-warm-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-500 focus:border-orange-500 dark:focus:border-orange-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-orange-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-gray-300"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center">
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => setFormData({
                  ...formData,
                  rememberMe: e.target.checked
                })}
                className="h-4 w-4 text-orange-500 focus:ring-orange-400 border-warm-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-warm-700 dark:text-gray-300">
                Remember me for 7 days
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Link
              to="/forgot-password"
              className="text-warm-600 hover:text-warm-700 dark:text-orange-400 dark:hover:text-orange-300 text-sm"
            >
              Forgot your password?
            </Link>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-warm-200 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-800 text-warm-600 dark:text-gray-400">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}
                className="w-full inline-flex justify-center py-2 px-4 border border-warm-200 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-warm-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-warm-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin('facebook')}
                disabled={isLoading}
                className="w-full inline-flex justify-center py-2 px-4 border border-warm-200 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-warm-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-warm-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin('github')}
                disabled={isLoading}
                className="w-full inline-flex justify-center py-2 px-4 border border-warm-200 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-warm-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-warm-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <Github className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/register"
              className="text-warm-600 hover:text-warm-700 dark:text-orange-400 dark:hover:text-orange-300 text-sm"
            >
              Don't have an account? Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
