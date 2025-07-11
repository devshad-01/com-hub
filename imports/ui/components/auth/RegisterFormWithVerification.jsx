import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, UserPlus, Clock } from 'lucide-react';
import { EmailVerificationStep } from './EmailVerificationStep';
import { useToast } from '../../hooks/useToast';

export const RegisterFormWithVerification = ({ onSuccess }) => {
  const [currentStep, setCurrentStep] = useState('form'); // 'form' | 'verification' | 'complete'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [emailVerificationRequired, setEmailVerificationRequired] = useState(true);
  const { success } = useToast();

  useEffect(() => {
    Meteor.call('settings.get', 'emailVerificationRequired', (err, value) => {
      if (!err) setEmailVerificationRequired(!!value);
    });
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    // Check password strength
    const hasUpperCase = /[A-Z]/.test(formData.password);
    const hasLowerCase = /[a-z]/.test(formData.password);
    const hasNumbers = /\d/.test(formData.password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      setError('Password must contain uppercase, lowercase, number, and special character');
      setIsLoading(false);
      return;
    }

    if (!emailVerificationRequired) {
      // Directly create user without verification step
      try {
        const result = await new Promise((resolve, reject) => {
          Accounts.createUser({
            email: formData.email,
            password: formData.password,
            profile: { name: formData.name }
          }, (err) => {
            if (err) reject(err);
            else resolve({ success: true });
          });
        });
        if (result.success) {
          success('Account Created!', 'Welcome to CommunityHub! Your account has been created.');
          setCurrentStep('complete');
          if (onSuccess) onSuccess();
        }
      } catch (err) {
        setError(err.reason || 'Failed to create account');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      // Send verification code to email
      await new Promise((resolve, reject) => {
        Meteor.call('verification.sendCode', formData.email, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      success('Verification Code Sent', 'Please check your email for the verification code');
      setCurrentStep('verification');
    } catch (err) {
      setError(err.reason || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailVerified = async (code) => {
    setIsLoading(true);
    
    try {
      // Create user account with verified email
      const result = await new Promise((resolve, reject) => {
        Meteor.call('verification.createUserWithVerifiedEmail', {
          name: formData.name,
          email: formData.email,
          password: formData.password
        }, code, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      if (result.success) {
        console.log('Registration result:', result);
        
        if (result.requiresApproval) {
          // User needs approval - don't auto-login and don't redirect
          success('Account Created!', 'Your account has been created successfully. Please wait for administrator approval before you can log in.');
          setCurrentStep('complete');
          
          // Store pending approval message
          localStorage.setItem('authSuccess', JSON.stringify({
            type: 'register',
            message: 'Your account has been created and is pending administrator approval. You will receive an email notification once approved.',
            requiresApproval: true
          }));
          
          // Don't call onSuccess to prevent redirect
        } else {
          // Auto-login the user if no approval required
          await new Promise((resolve, reject) => {
            Meteor.loginWithPassword(formData.email, formData.password, (err) => {
              if (err) reject(err);
              else resolve();
            });
          });

          success('Account Created!', 'Welcome to CommunityHub! Your account has been created and verified.');
          setCurrentStep('complete');
          
          // Store success message for navigation
          localStorage.setItem('authSuccess', JSON.stringify({
            type: 'register',
            message: 'Welcome to CommunityHub! Your account has been created and verified successfully.'
          }));
          
          // Only call onSuccess for approved users to trigger redirect
          if (onSuccess) {
            onSuccess();
          }
        }
      }
    } catch (err) {
      setError(err.reason || 'Failed to create account');
      setCurrentStep('form'); // Go back to form
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToForm = () => {
    setCurrentStep('form');
    setError('');
  };

  // Show email verification step
  if (currentStep === 'verification') {
    return (
      <EmailVerificationStep
        email={formData.email}
        onVerified={handleEmailVerified}
        onBack={handleBackToForm}
      />
    );
  }

  // Show success/complete step
  if (currentStep === 'complete') {
    const authData = JSON.parse(localStorage.getItem('authSuccess') || '{}');
    const requiresApproval = authData.requiresApproval;
    
    console.log('🔍 Complete step - authData:', authData);
    console.log('🔍 Complete step - requiresApproval:', requiresApproval);
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-warm-50 via-background to-warm-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 border shadow-lg rounded-lg p-6 border-grey-300 text-center">
          <div>
            <div className={`mx-auto h-12 w-12 flex items-center justify-center rounded-full ${requiresApproval ? 'bg-yellow-500' : 'bg-green-500'}`}>
              {requiresApproval ? (
                <Clock className="h-6 w-6 text-white" />
              ) : (
                <UserPlus className="h-6 w-6 text-white" />
              )}
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-warm-900 dark:text-white">
              {requiresApproval ? 'Account Pending Approval' : 'Welcome to CommunityHub!'}
            </h2>
            <p className="mt-2 text-center text-sm text-warm-700 dark:text-gray-300">
              {requiresApproval 
                ? 'Your account has been created and is awaiting administrator approval. You will receive an email notification once approved.'
                : 'Your account has been created and verified successfully.'
              }
            </p>
            {requiresApproval && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  Please check your email for updates on your account status.
                </p>
              </div>
            )}
            
            {/* Navigation buttons */}
            <div className="mt-6 space-y-3">
              {requiresApproval ? (
                <div className="space-y-3">
                  <a
                    href="/login"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                  >
                    Go to Login Page
                  </a>
                  <a
                    href="/"
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                  >
                    Go to Home Page
                  </a>
                </div>
              ) : (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Redirecting to home page...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show registration form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-warm-50 via-background to-warm-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 border shadow-lg rounded-lg p-6 border-grey-300">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-orange-500 dark:bg-orange-500">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-warm-900 dark:text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-warm-700 dark:text-gray-300">
            Join the CommunityHub today
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleFormSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="sr-only">Full name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-orange-500 dark:text-gray-400" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-warm-200 dark:border-gray-600 placeholder-warm-400 dark:placeholder-gray-400 text-warm-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-500 dark:focus:ring-orange-500 focus:border-warm-500 dark:focus:border-orange-500 focus:z-10 sm:text-sm"
                  placeholder="Full name"
                />
              </div>
            </div>

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
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-warm-200 dark:border-gray-600 placeholder-warm-400 dark:placeholder-gray-400 text-warm-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-500 dark:focus:ring-orange-500 focus:border-warm-500 dark:focus:border-orange-500 focus:z-10 sm:text-sm"
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
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full pl-10 pr-10 py-3 border border-warm-200 dark:border-gray-600 placeholder-warm-400 dark:placeholder-gray-400 text-warm-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-500 dark:focus:ring-orange-500 focus:border-warm-500 dark:focus:border-orange-500 focus:z-10 sm:text-sm"
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

            <div>
              <label htmlFor="confirmPassword" className="sr-only">Confirm password</label>
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
                  className="appearance-none relative block w-full pl-10 pr-10 py-3 border border-warm-200 dark:border-gray-600 placeholder-warm-400 dark:placeholder-gray-400 text-warm-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-500 dark:focus:ring-orange-500 focus:border-warm-500 dark:focus:border-orange-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-orange-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-gray-300"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
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
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Sending verification code...' : 'Continue'}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="text-warm-600 hover:text-warm-700 dark:text-orange-400 dark:hover:text-orange-300 text-sm"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
