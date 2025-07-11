import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Mail, ArrowLeft, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

export const EmailVerificationStep = ({ email, onVerified, onBack }) => {
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { success, error: showError } = useToast();

  // Handle resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleCodeChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;
    
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setVerificationCode(newCode);
      setError('');
      
      // Focus the last input
      const lastInput = document.getElementById('code-5');
      if (lastInput) lastInput.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = verificationCode.join('');
    
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await new Promise((resolve, reject) => {
        Meteor.call('verification.verifyCode', email, code, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      if (result.success) {
        success('Email Verified!', 'Your email has been verified successfully');
        onVerified(code); // Pass the code as a verification token
      }
    } catch (err) {
      setError(err.reason || 'Invalid verification code');
      // Clear the code inputs on error
      setVerificationCode(['', '', '', '', '', '']);
      const firstInput = document.getElementById('code-0');
      if (firstInput) firstInput.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setError('');

    try {
      await new Promise((resolve, reject) => {
        Meteor.call('verification.resendCode', email, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      success('Code Resent', 'A new verification code has been sent to your email');
      setResendCooldown(60); // 60 second cooldown
      setVerificationCode(['', '', '', '', '', '']);
      
      // Focus first input
      const firstInput = document.getElementById('code-0');
      if (firstInput) firstInput.focus();
      
    } catch (err) {
      showError('Resend Failed', err.reason || 'Failed to resend verification code');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-warm-50 via-background to-warm-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 border shadow-lg rounded-lg p-6 border-grey-300">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-orange-500 dark:bg-orange-500">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-warm-900 dark:text-white">
            Verify Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-warm-700 dark:text-gray-300">
            We've sent a 6-digit code to
          </p>
          <p className="text-center text-sm font-medium text-orange-600 dark:text-orange-400">
            {email}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 px-4 py-3 rounded-md text-sm flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-warm-700 dark:text-gray-300 mb-4 text-center">
              Enter verification code
            </label>
            
            <div className="flex justify-center space-x-3">
              {verificationCode.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-12 text-center text-xl font-bold border border-warm-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-800 text-warm-900 dark:text-white"
                  autoComplete="off"
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <button
              type="submit"
              disabled={isLoading || verificationCode.join('').length !== 6}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Verify Email
                </>
              )}
            </button>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={onBack}
                className="flex items-center text-sm text-warm-600 hover:text-warm-700 dark:text-orange-400 dark:hover:text-orange-300"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to registration
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={isResending || resendCooldown > 0}
                className="text-sm text-warm-600 hover:text-warm-700 dark:text-orange-400 dark:hover:text-orange-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin inline" />
                    Sending...
                  </>
                ) : resendCooldown > 0 ? (
                  `Resend in ${resendCooldown}s`
                ) : (
                  'Resend code'
                )}
              </button>
            </div>
          </div>
        </form>

        <div className="text-center">
          <p className="text-xs text-warm-600 dark:text-gray-400">
            The code will expire in 10 minutes for security reasons.
          </p>
        </div>
      </div>
    </div>
  );
};
