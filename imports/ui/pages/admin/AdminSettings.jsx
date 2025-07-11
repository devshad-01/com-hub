import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Settings, SETTING_KEYS } from '../../../api/settings';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';

export const AdminSettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [localSettings, setLocalSettings] = useState({});
  const { success, error } = useToast();
  const { can } = useAuth();

  // Subscribe to settings
  const { settings, isReady } = useTracker(() => {
    const handle = Meteor.subscribe('settings');
    const settingsData = Settings.find({}).fetch();
    const settingsObj = {};
    
    settingsData.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });

    return {
      settings: settingsObj,
      isReady: handle.ready()
    };
  }, []);

  // Initialize local settings when data is ready
  useEffect(() => {
    if (isReady && Object.keys(settings).length > 0) {
      setLocalSettings(settings);
    }
  }, [isReady, settings]);

  const handleSettingChange = (key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSetting = async (key, value) => {
    if (!can.updateSettings()) {
      error('Permission Denied', 'You do not have permission to update settings');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((resolve, reject) => {
        Meteor.call('settings.update', key, value, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      
      success('Setting Updated', 'The setting has been saved successfully');
    } catch (err) {
      error('Update Failed', err.reason || 'Failed to update setting');
      // Revert local change
      setLocalSettings(prev => ({
        ...prev,
        [key]: settings[key]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUserVerification = async (enabled) => {
    handleSettingChange(SETTING_KEYS.USER_VERIFICATION_REQUIRED, enabled);
    await saveSetting(SETTING_KEYS.USER_VERIFICATION_REQUIRED, enabled);
  };

  if (!isReady) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Settings</h2>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            <div className="h-4 bg-slate-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Settings</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Configure platform settings and preferences
        </p>
      </div>
      
      <div className="p-6 space-y-8">
        
        {/* User Management Settings */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
            User Management
          </h3>
          
          {/* User Verification Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium text-slate-900 dark:text-white">User Verification Required</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                When enabled, new users will need to be manually approved by an administrator before they can access the platform.
                Users will receive an email notification once their account is approved.
              </p>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {localSettings[SETTING_KEYS.USER_VERIFICATION_REQUIRED] 
                  ? '⚠️ New users will be pending approval' 
                  : '✅ New users are automatically approved'
                }
              </div>
            </div>
            <div className="ml-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={localSettings[SETTING_KEYS.USER_VERIFICATION_REQUIRED] || false}
                  onChange={(e) => handleToggleUserVerification(e.target.checked)}
                  disabled={isLoading || !can.updateSettings()}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-orange-600"></div>
              </label>
            </div>
          </div>
          
        </div>

        {/* General Settings */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
            General Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Site Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Site Name
              </label>
              <input
                type="text"
                value={localSettings[SETTING_KEYS.SITE_NAME] || ''}
                onChange={(e) => handleSettingChange(SETTING_KEYS.SITE_NAME, e.target.value)}
                onBlur={(e) => {
                  if (e.target.value !== settings[SETTING_KEYS.SITE_NAME]) {
                    saveSetting(SETTING_KEYS.SITE_NAME, e.target.value);
                  }
                }}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                placeholder="CommunityHub"
                disabled={!can.updateSettings()}
              />
            </div>

            {/* Site Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Site Description
              </label>
              <input
                type="text"
                value={localSettings[SETTING_KEYS.SITE_DESCRIPTION] || ''}
                onChange={(e) => handleSettingChange(SETTING_KEYS.SITE_DESCRIPTION, e.target.value)}
                onBlur={(e) => {
                  if (e.target.value !== settings[SETTING_KEYS.SITE_DESCRIPTION]) {
                    saveSetting(SETTING_KEYS.SITE_DESCRIPTION, e.target.value);
                  }
                }}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                placeholder="A community platform for everyone"
                disabled={!can.updateSettings()}
              />
            </div>

          </div>
        </div>

        {/* Registration Settings */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
            Registration Settings
          </h3>
          
          <div className="space-y-4">
            
            {/* Allow Registration */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <div>
                <h4 className="font-medium text-slate-900 dark:text-white">Allow Registration</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Enable or disable new user registration
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={localSettings[SETTING_KEYS.ALLOW_REGISTRATION] !== false}
                  onChange={(e) => {
                    const value = e.target.checked;
                    handleSettingChange(SETTING_KEYS.ALLOW_REGISTRATION, value);
                    saveSetting(SETTING_KEYS.ALLOW_REGISTRATION, value);
                  }}
                  disabled={isLoading || !can.updateSettings()}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-orange-600"></div>
              </label>
            </div>

            {/* Email Verification Required */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <div>
                <h4 className="font-medium text-slate-900 dark:text-white">Email Verification Required</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Require email verification during registration
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={localSettings[SETTING_KEYS.EMAIL_VERIFICATION_REQUIRED] !== false}
                  onChange={(e) => {
                    const value = e.target.checked;
                    handleSettingChange(SETTING_KEYS.EMAIL_VERIFICATION_REQUIRED, value);
                    saveSetting(SETTING_KEYS.EMAIL_VERIFICATION_REQUIRED, value);
                  }}
                  disabled={isLoading || !can.updateSettings()}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-orange-600"></div>
              </label>
            </div>

          </div>
        </div>

        {/* Permission Note */}
        {!can.updateSettings() && (
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ You do not have permission to modify settings. Only admins and superadmins can change these settings.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
