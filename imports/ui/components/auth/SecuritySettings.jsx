// imports/ui/components/auth/SecuritySettings.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ClientSecurity } from '../../utils/security';
import { Shield, Eye, EyeOff, AlertTriangle, CheckCircle, RefreshCw, LogOut } from 'lucide-react';

const SecuritySettings = () => {
  const { user, securityStatus, refreshSecurityStatus, changePassword, logoutAllSessions, resendVerificationEmail } = useAuth();
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordStrength, setPasswordStrength] = useState({ strength: 0, isValid: false, errors: [] });

  useEffect(() => {
    if (passwordForm.newPassword) {
      const validation = ClientSecurity.validatePasswordStrength(passwordForm.newPassword);
      setPasswordStrength(validation);
    } else {
      setPasswordStrength({ strength: 0, isValid: false, errors: [] });
    }
  }, [passwordForm.newPassword]);

  const handlePasswordChange = (field, value) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
    setMessage({ type: '', text: '' });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await changePassword(passwordForm.oldPassword, passwordForm.newPassword, passwordForm.confirmPassword);
      setMessage({ type: 'success', text: 'Password changed successfully! You have been logged out of other sessions.' });
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      await refreshSecurityStatus();
    } catch (error) {
      setMessage({ type: 'error', text: error.reason || error.message || 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAllSessions = async () => {
    if (!window.confirm('This will log you out of all devices. Continue?')) return;
    
    setLoading(true);
    try {
      await logoutAllSessions();
      setMessage({ type: 'success', text: 'Logged out of all sessions successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.reason || error.message || 'Failed to logout all sessions' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      await resendVerificationEmail();
      setMessage({ type: 'success', text: 'Verification email sent successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.reason || error.message || 'Failed to send verification email' });
    } finally {
      setLoading(false);
    }
  };

  const strengthIndicator = ClientSecurity.getPasswordStrengthIndicator(passwordStrength.strength);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Shield className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Security Settings</h2>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-700 border border-green-200' 
            : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          <div className="flex items-center">
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <AlertTriangle className="w-5 h-5 mr-2" />
            )}
            {message.text}
          </div>
        </div>
      )}

      {/* Account Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Account Status</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span>Email Verification</span>
            <span className={`px-2 py-1 rounded text-sm ${
              securityStatus?.emailVerified 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {securityStatus?.emailVerified ? 'Verified' : 'Not Verified'}
            </span>
          </div>
          
          {!securityStatus?.emailVerified && (
            <button
              onClick={handleResendVerification}
              disabled={loading}
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              Resend verification email
            </button>
          )}

          <div className="flex justify-between items-center">
            <span>Active Sessions</span>
            <span className="text-gray-600">{securityStatus?.activeSessions || 0}</span>
          </div>

          {securityStatus?.failedLoginAttempts > 0 && (
            <div className="flex justify-between items-center">
              <span>Failed Login Attempts</span>
              <span className="text-red-600">{securityStatus.failedLoginAttempts}</span>
            </div>
          )}

          {securityStatus?.accountLocked && (
            <div className="p-3 bg-red-100 border border-red-200 rounded">
              <div className="flex items-center text-red-700">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Account is temporarily locked
              </div>
              {securityStatus.lockUntil && (
                <p className="text-sm text-red-600 mt-1">
                  Unlocks in: {ClientSecurity.formatLockTimeRemaining(securityStatus.lockUntil)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Change Password</h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                value={passwordForm.oldPassword}
                onChange={(e) => handlePasswordChange('oldPassword', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            {passwordForm.newPassword && (
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Password Strength</span>
                  <span className={strengthIndicator.color}>{strengthIndicator.text}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${strengthIndicator.bgColor}`}
                    style={{ width: `${passwordStrength.strength}%` }}
                  ></div>
                </div>
                {passwordStrength.errors.length > 0 && (
                  <ul className="mt-2 text-sm text-red-600 space-y-1">
                    {passwordStrength.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              {showPasswords ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
              {showPasswords ? 'Hide' : 'Show'} passwords
            </button>

            <button
              type="submit"
              disabled={loading || !passwordStrength.isValid || passwordForm.newPassword !== passwordForm.confirmPassword}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
            >
              {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Change Password
            </button>
          </div>
        </form>
      </div>

      {/* Session Management */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Session Management</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-700">Logout from all devices</p>
            <p className="text-sm text-gray-500">This will end all your active sessions on all devices</p>
          </div>
          <button
            onClick={handleLogoutAllSessions}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4 mr-2" />
            )}
            Logout All Sessions
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
