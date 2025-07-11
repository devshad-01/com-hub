import React from 'react';
import { User, Edit2, X, Camera, Save, MapPin, Globe, FileText } from 'lucide-react';

export const ProfileInformationCard = ({
  user,
  isEditing,
  setIsEditing,
  isSaving,
  formData,
  setFormData,
  avatarPreview,
  setAvatarPreview,
  fileInputRef,
  handleInputChange,
  handleAvatarUpload,
  handleSave,
  handleCancel,
  getUserAvatar,
  getUserInitial
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white flex items-center">
              <User className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-orange-500 dark:text-orange-400" />
              Profile Information
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Update your personal details and bio
            </p>
          </div>
          
          <button
            onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
            className={`flex items-center justify-center px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer text-sm ${isEditing
              ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600'
              : 'bg-orange-500 text-white hover:bg-orange-600 shadow-md hover:shadow-lg'
            }`}
          >
            {isEditing ? (
              <>
                <X className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Cancel</span>
                <span className="sm:hidden">Cancel</span>
              </>
            ) : (
              <>
                <Edit2 className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Edit Profile</span>
                <span className="sm:hidden">Edit</span>
              </>
            )}
          </button>
        </div>
      </div>
        
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Avatar Upload */}
          {isEditing && (
            <div className="flex flex-col items-center text-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-700 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
              <div className="relative inline-block mb-4">
                {getUserAvatar() ? (
                  <img
                    src={getUserAvatar()}
                    alt="Profile"
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white dark:border-slate-600 shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 flex items-center justify-center text-white text-xl sm:text-2xl font-bold border-4 border-white dark:border-slate-600 shadow-lg">
                    {getUserInitial()}
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 bg-orange-500 text-white p-1.5 sm:p-2 rounded-full hover:bg-orange-600 transition-colors duration-200 shadow-lg cursor-pointer"
                >
                  <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <div className="text-center">
                <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                  Update Profile Picture
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  PNG, JPG up to 2MB
                </p>
              </div>
            </div>
          )}

          {/* Form Fields - Mobile responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Name */}
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Display Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent dark:bg-slate-700 dark:text-white transition-colors text-sm sm:text-base"
                  placeholder="Enter your display name"
                />
              ) : (
                <p className="text-slate-900 dark:text-white py-2.5 sm:py-3 px-3 sm:px-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 text-sm sm:text-base">
                  {user?.profile?.name || 'Not provided'}
                </p>
              )}
            </div>

            {/* Location */}
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <MapPin className="inline w-4 h-4 mr-1" />
                Location
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent dark:bg-slate-700 dark:text-white transition-colors text-sm sm:text-base"
                  placeholder="Your location"
                />
              ) : (
                <p className="text-slate-900 dark:text-white py-2.5 sm:py-3 px-3 sm:px-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 text-sm sm:text-base">
                  {user?.profile?.location || 'Not provided'}
                </p>
              )}
            </div>

            {/* Website */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <Globe className="inline w-4 h-4 mr-1" />
                Website
              </label>
              {isEditing ? (
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent dark:bg-slate-700 dark:text-white transition-colors text-sm sm:text-base"
                  placeholder="https://yourwebsite.com"
                />
              ) : (
                <div className="py-2.5 sm:py-3 px-3 sm:px-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                  {user?.profile?.website ? (
                    <a 
                      href={user.profile.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-orange-500 dark:text-orange-400 hover:underline text-sm sm:text-base break-all"
                    >
                      {user.profile.website}
                    </a>
                  ) : (
                    <span className="text-slate-900 dark:text-white text-sm sm:text-base">Not provided</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bio - Full width */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <FileText className="inline w-4 h-4 mr-1" />
              Bio
            </label>
            {isEditing ? (
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent dark:bg-slate-700 dark:text-white resize-vertical transition-colors text-sm sm:text-base"
                placeholder="Tell us about yourself..."
              />
            ) : (
              <div className="py-2.5 sm:py-3 px-3 sm:px-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 min-h-[100px]">
                <p className="text-slate-900 dark:text-white whitespace-pre-wrap text-sm sm:text-base">
                  {user?.profile?.bio || 'No bio provided'}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons - Mobile responsive */}
          {isEditing && (
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 sm:pt-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 cursor-pointer text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full sm:w-auto flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer text-sm sm:text-base"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };
