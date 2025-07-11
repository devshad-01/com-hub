import React, { useState, useRef } from 'react';
import { Meteor } from 'meteor/meteor';
import { useAuth } from '../hooks/useAuth';
import { UserMethods } from '/imports/api/users';
import { getUserRole } from '/imports/api/users/roles';
import { useToastContext } from '../components/common/ToastProvider';
import { 
  ProfileHeader, 
  ProfileInformationCard, 
  UsernameSection, 
  SecuritySection, 
  ConnectedAccounts 
} from '../components/profile';
import { useImageUpload } from '../hooks/useImageUpload';

export const ProfilePage = () => {
  const { user } = useAuth();
  const { success, error: showError } = useToastContext();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showEmailActions, setShowEmailActions] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null); // Store selected file for later upload
  const fileInputRef = useRef(null);
  const { uploadImages, isUploading } = useImageUpload({
    folder: `avatars/${user?._id || Meteor.userId()}`,
    context: 'avatar'
  });
  
  // Mobile toggle states - for mobile view, initially collapse username and security sections
  const [showUsernameSection, setShowUsernameSection] = useState(false);
  const [showSecuritySection, setShowSecuritySection] = useState(false);
  
  // Set initial visibility based on screen size
  React.useEffect(() => {
    const handleResize = () => {
      // On mobile (< 768px), collapse username and security sections
      if (window.innerWidth < 768) {
        setShowUsernameSection(false);
        setShowSecuritySection(false);
      } else {
        // On desktop, show all sections
        setShowUsernameSection(true);
        setShowSecuritySection(true);
      }
    };
    
    // Call once on mount
    handleResize();
    
    // Add resize event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const [formData, setFormData] = useState({
    name: user?.profile?.name || '',
    bio: user?.profile?.bio || '',
    location: user?.profile?.location || '',
    website: user?.profile?.website || '',
    avatar: null
  });
  
  const [usernameData, setUsernameData] = useState({
    username: user?.username || ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUsernameChange = (e) => {
    setUsernameData({ username: e.target.value });
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Invalid File', 'Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showError('File Too Large', 'Image size must be less than 2MB');
      return;
    }

    // Only set preview and file, do not upload yet
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let avatarObj = formData.avatar;
      // If a new avatar file is selected, upload it now
      if (avatarFile) {
        const results = await uploadImages([avatarFile]);
        if (results && results[0]) {
          avatarObj = results[0];
        } else {
          showError('Upload failed', 'Could not upload avatar image');
          setIsSaving(false);
          return;
        }
      }
      await new Promise((resolve, reject) => {
        Meteor.call(UserMethods.updateProfile, { ...formData, avatar: avatarObj }, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
      setIsEditing(false);
      setAvatarPreview(null);
      setAvatarFile(null);
      success('Profile Updated!', 'Your profile has been updated successfully');
    } catch (error) {
      showError('Error', error.reason || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUsernameUpdate = async () => {
    if (!usernameData.username.trim()) {
      showError('Invalid Username', 'Username cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      await new Promise((resolve, reject) => {
        Meteor.call(UserMethods.updateUsername, usernameData.username.trim(), (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
      
      setIsEditingUsername(false);
      success('Username Updated!', 'Your username has been updated successfully');
    } catch (error) {
      showError('Error', error.reason || 'Failed to update username');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendVerificationEmail = () => {
    Meteor.call(UserMethods.sendVerificationEmail, (error) => {
      if (error) {
        showError('Error', error.reason || 'Failed to send verification email');
      } else {
        success('Email Sent!', 'Verification email sent successfully');
      }
    });
  };

  const handlePasswordReset = () => {
    if (!user?.emails?.[0]?.address) {
      showError('No Email Address', 'Please add an email address to reset your password');
      return;
    }

    Meteor.call('forgotPassword', { email: user.emails[0].address }, (error) => {
      if (error) {
        showError('Error', error.reason || 'Failed to send password reset email');
      } else {
        success('🔑 Password Reset Email Sent!', 
          'Check your email for password reset instructions. Note: You will be logged out after successfully resetting your password for security reasons.', 
          { duration: 8000 }
        );
        setShowEmailActions(false);
      }
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsEditingUsername(false);
    setFormData({
      name: user?.profile?.name || '',
      bio: user?.profile?.bio || '',
      location: user?.profile?.location || '',
      website: user?.profile?.website || '',
      avatar: null
    });
    setUsernameData({ username: user?.username || '' });
    setAvatarPreview(null);
    setAvatarFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Update form data when user data changes
  React.useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        name: user.profile?.name || '',
        bio: user.profile?.bio || '',
        location: user.profile?.location || '',
        website: user.profile?.website || '',
        avatar: null
      });
      setUsernameData({ username: user.username || '' });
    }
  }, [user, isEditing]);

  const getUserAvatar = () => {
    if (avatarPreview) return avatarPreview;
    if (user?.profile?.avatar) return user.profile.avatar;
    return null;
  };

  // Helper functions for user roles and colors
  const getUserRoleForUser = (userId) => {
    return getUserRole(userId);
  };

  const getRoleColor = (role) => {
    const colors = {
      'admin': 'red',
      'member': 'purple'
    };
    return colors[role] || 'purple';
  };

  const getUserInitial = () => {
    if (user?.profile?.name) {
      return user.profile.name.charAt(0).toUpperCase();
    }
    if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    }
    if (user?.emails?.[0]?.address) {
      return user.emails[0].address.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto py-2 sm:py-6 px-2 sm:px-6 lg:px-8">
        {/* Header */}
        <ProfileHeader 
          user={user}
          getUserRole={getUserRoleForUser}
          getRoleColor={getRoleColor}
        />
        
        <div className="space-y-4 sm:space-y-6">
          {/* Username and Security Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Username Section */}
            <UsernameSection
              user={user}
              isEditingUsername={isEditingUsername}
              setIsEditingUsername={setIsEditingUsername}
              isSaving={isSaving}
              usernameData={usernameData}
              setUsernameData={setUsernameData}
              handleUsernameChange={handleUsernameChange}
              handleUsernameUpdate={handleUsernameUpdate}
              handleCancel={handleCancel}
              isExpanded={showUsernameSection}
              onToggle={() => setShowUsernameSection(!showUsernameSection)}
            />
            
            {/* Account Security */}
            <SecuritySection
              user={user}
              setShowEmailActions={setShowEmailActions}
              handleSendVerificationEmail={handleSendVerificationEmail}
              handlePasswordReset={handlePasswordReset}
              isExpanded={showSecuritySection}
              onToggle={() => setShowSecuritySection(!showSecuritySection)}
            />
          </div>
          
          {/* Profile Information and Connected Accounts - Full width */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {/* Main Profile Section */}
            <div className="space-y-4 sm:space-y-6 w-full">
              {/* Profile Information Card - Full Width */}
              <ProfileInformationCard
                user={user}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                isSaving={isSaving}
                formData={formData}
                setFormData={setFormData}
                avatarPreview={avatarPreview}
                setAvatarPreview={setAvatarPreview}
                fileInputRef={fileInputRef}
                handleInputChange={handleInputChange}
                handleAvatarUpload={handleAvatarUpload}
                handleSave={handleSave}
                handleCancel={handleCancel}
                getUserAvatar={getUserAvatar}
                getUserInitial={getUserInitial}
              />
            </div>

            {/* Connected Accounts */}
            <div>
              <ConnectedAccounts user={user} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};