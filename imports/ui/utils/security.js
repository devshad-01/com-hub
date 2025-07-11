// imports/ui/utils/security.js
import { Meteor } from 'meteor/meteor';

export const ClientSecurity = {
  
  // Check if current user session is valid
  isSessionValid() {
    const user = Meteor.user();
    if (!user) return false;
    
    // Check if email verification is required and if email is verified
    const requireEmailVerification = Meteor.settings.public?.requireEmailVerification;
    if (requireEmailVerification && !user.emails?.[0]?.verified) {
      return false;
    }
    
    // Check if account is locked
    if (user.accountLocked) {
      const lockUntil = user.lockUntil;
      if (lockUntil && new Date() < new Date(lockUntil)) {
        return false;
      }
    }
    
    return true;
  },

  // Get user's security status
  async getSecurityStatus() {
    return new Promise((resolve, reject) => {
      Meteor.call('auth.getSecurityStatus', (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  },

  // Change password with validation
  async changePassword(oldPassword, newPassword, confirmPassword) {
    if (newPassword !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    return new Promise((resolve, reject) => {
      Meteor.call('auth.changePassword', oldPassword, newPassword, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  },

  // Logout from all sessions
  async logoutAllSessions() {
    return new Promise((resolve, reject) => {
      Meteor.call('auth.logoutAllSessions', (error, result) => {
        if (error) {
          reject(error);
        } else {
          // Also logout current session
          Meteor.logout(() => {
            resolve(result);
          });
        }
      });
    });
  },

  // Resend verification email
  async resendVerificationEmail() {
    return new Promise((resolve, reject) => {
      Meteor.call('auth.resendVerificationEmail', (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  },

  // Password strength validation (client-side)
  validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const errors = [];
    
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    
    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    }
    
    if (!hasSpecialChar) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      strength: this.calculatePasswordStrength(password)
    };
  },

  // Calculate password strength score (0-100)
  calculatePasswordStrength(password) {
    let score = 0;
    
    // Length score
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 15;
    if (password.length >= 16) score += 10;
    
    // Character type scores
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/[0-9]/.test(password)) score += 10;
    if (/[^A-Za-z0-9]/.test(password)) score += 15;
    
    // Pattern penalties
    if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
    if (/123|abc|qwe/i.test(password)) score -= 10; // Common patterns
    
    return Math.max(0, Math.min(100, score));
  },

  // Get password strength color and text
  getPasswordStrengthIndicator(strength) {
    if (strength < 30) {
      return { color: 'text-red-500', text: 'Weak', bgColor: 'bg-red-500' };
    } else if (strength < 60) {
      return { color: 'text-yellow-500', text: 'Fair', bgColor: 'bg-yellow-500' };
    } else if (strength < 80) {
      return { color: 'text-blue-500', text: 'Good', bgColor: 'bg-blue-500' };
    } else {
      return { color: 'text-green-500', text: 'Strong', bgColor: 'bg-green-500' };
    }
  },

  // Format time remaining for account lock
  formatLockTimeRemaining(lockUntil) {
    if (!lockUntil) return null;
    
    const now = new Date();
    const lockTime = new Date(lockUntil);
    const diff = lockTime - now;
    
    if (diff <= 0) return null;
    
    const minutes = Math.ceil(diff / (1000 * 60));
    if (minutes < 60) {
      return `${minutes} minute${minutes === 1 ? '' : 's'}`;
    }
    
    const hours = Math.ceil(diff / (1000 * 60 * 60));
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }
};
