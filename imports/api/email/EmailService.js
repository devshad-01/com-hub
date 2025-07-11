// imports/api/email/EmailService.js
import { Meteor } from 'meteor/meteor';
import { Email } from 'meteor/email';
import { getEmailFromAddress, getAppName } from '/imports/utils/email.js';

/**
 * Centralized Email Service
 * Handles all email types with consistent formatting and error handling
 */
export class EmailService {
  
  /**
   * Send any email with consistent error handling and logging
   */
  static async sendEmail(options) {
    console.log('📧 EmailService.sendEmail called with:', { 
      type: options.type, 
      to: options.to,
      hasHtml: !!options.html,
      hasText: !!options.text 
    });
    
    if (!Meteor.isServer) {
      throw new Meteor.Error('server-only', 'Email can only be sent from server');
    }

    try {
      const emailOptions = {
        to: options.to,
        from: options.from || getEmailFromAddress(),
        subject: options.subject,
        text: options.text,
        html: options.html,
        replyTo: options.replyTo
      };

      console.log(`📧 Sending ${options.type || 'email'} to:`, options.to);
      console.log(`📧 From address:`, emailOptions.from);
      console.log(`📧 Subject:`, emailOptions.subject);
      
      const result = await Email.sendAsync(emailOptions);
      
      console.log(`📧 ✅ ${options.type || 'Email'} sent successfully`);
      if (result.messageId) {
        console.log(`📧 Message ID: ${result.messageId}`);
      }
      
      return result;
    } catch (error) {
      console.error(`📧 ❌ Failed to send ${options.type || 'email'}:`, error);
      throw new Meteor.Error('email-send-failed', `Failed to send ${options.type || 'email'}: ${error.message}`);
    }
  }

  /**
   * Send verification code email
   */
  static async sendVerificationCode(email, verificationCode) {
    const appName = getAppName();
    
    return await this.sendEmail({
      type: 'verification code',
      to: email,
      subject: `Your ${appName} Verification Code`,
      html: this.getVerificationCodeTemplate(verificationCode, appName),
      text: `Your ${appName} verification code is: ${verificationCode}. This code will expire in 10 minutes.`
    });
  }

  /**
   * Send welcome email after account approval
   */
  static async sendWelcomeEmail(userEmail, userName) {
    const appName = getAppName();
    
    return await this.sendEmail({
      type: 'welcome email',
      to: userEmail,
      subject: `Welcome to ${appName}!`,
      html: this.getWelcomeTemplate(userName, appName),
      text: `Welcome to ${appName}, ${userName}! Your account has been approved and you can now access all features.`
    });
  }

  /**
   * Send password reset email
   */
  static async sendPasswordReset(userEmail, resetToken, userName) {
    const appName = getAppName();
    const resetUrl = `${Meteor.absoluteUrl()}reset-password?token=${resetToken}`;
    
    return await this.sendEmail({
      type: 'password reset',
      to: userEmail,
      subject: `Reset your ${appName} password`,
      html: this.getPasswordResetTemplate(userName, resetUrl, appName),
      text: `Hello ${userName}, click this link to reset your password: ${resetUrl}`
    });
  }

  /**
   * Send account approval notification
   */
  static async sendApprovalNotification(userEmail, userName, isApproved) {
    const appName = getAppName();
    const status = isApproved ? 'approved' : 'rejected';
    
    return await this.sendEmail({
      type: 'account approval',
      to: userEmail,
      subject: `Your ${appName} account has been ${status}`,
      html: this.getApprovalTemplate(userName, isApproved, appName),
      text: `Hello ${userName}, your ${appName} account has been ${status}.`
    });
  }

  /**
   * Send admin notification emails
   */
  static async sendAdminNotification(adminEmail, subject, message, actionUrl = null) {
    const appName = getAppName();
    
    return await this.sendEmail({
      type: 'admin notification',
      to: adminEmail,
      subject: `${appName} Admin: ${subject}`,
      html: this.getAdminNotificationTemplate(subject, message, actionUrl, appName),
      text: `${appName} Admin Notification: ${subject}\n\n${message}${actionUrl ? `\n\nAction required: ${actionUrl}` : ''}`
    });
  }

  /**
   * Send event notification emails
   */
  static async sendEventNotification(userEmail, userName, eventTitle, eventDate, notificationType) {
    const appName = getAppName();
    const subjects = {
      'event-created': `New Event: ${eventTitle}`,
      'event-updated': `Event Updated: ${eventTitle}`,
      'event-cancelled': `Event Cancelled: ${eventTitle}`,
      'event-reminder': `Reminder: ${eventTitle} is tomorrow`
    };
    
    return await this.sendEmail({
      type: 'event notification',
      to: userEmail,
      subject: subjects[notificationType] || `Event Notification: ${eventTitle}`,
      html: this.getEventNotificationTemplate(userName, eventTitle, eventDate, notificationType, appName),
      text: `Hello ${userName}, this is a notification about: ${eventTitle} on ${eventDate}`
    });
  }

  // ============= EMAIL TEMPLATES =============

  /**
   * Base template wrapper for consistent styling
   */
  static getBaseTemplate(content, appName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${appName}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 0;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">${appName}</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            ${content}
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px;">
            <p style="margin: 0;">This email was sent by ${appName}</p>
            <p style="margin: 5px 0 0 0;">If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Verification code email template
   */
  static getVerificationCodeTemplate(verificationCode, appName) {
    const content = `
      <h2 style="color: #334155; margin-bottom: 20px;">Verify Your Email Address</h2>
      
      <p style="color: #64748b; margin-bottom: 30px; font-size: 16px;">
        Please use the verification code below to complete your account registration:
      </p>
      
      <div style="background: #f8fafc; border: 2px solid #f97316; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
        <span style="font-size: 32px; font-weight: bold; color: #f97316; letter-spacing: 4px;">${verificationCode}</span>
      </div>
      
      <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
        This code will expire in 10 minutes for security reasons.
      </p>
    `;
    
    return this.getBaseTemplate(content, appName);
  }

  /**
   * Welcome email template
   */
  static getWelcomeTemplate(userName, appName) {
    const content = `
      <h2 style="color: #334155; margin-bottom: 20px;">Welcome to ${appName}!</h2>
      
      <p style="color: #64748b; margin-bottom: 20px; font-size: 16px;">
        Hi ${userName},
      </p>
      
      <p style="color: #64748b; margin-bottom: 30px; font-size: 16px;">
        Great news! Your account has been approved and you now have full access to ${appName}.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${Meteor.absoluteUrl()}" 
           style="background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Access ${appName}
        </a>
      </div>
      
      <p style="color: #64748b; font-size: 14px;">
        You can now participate in events, join discussions, and connect with other community members.
      </p>
    `;
    
    return this.getBaseTemplate(content, appName);
  }

  /**
   * Password reset email template
   */
  static getPasswordResetTemplate(userName, resetUrl, appName) {
    const content = `
      <h2 style="color: #334155; margin-bottom: 20px;">Reset Your Password</h2>
      
      <p style="color: #64748b; margin-bottom: 20px; font-size: 16px;">
        Hi ${userName},
      </p>
      
      <p style="color: #64748b; margin-bottom: 30px; font-size: 16px;">
        We received a request to reset your password for your ${appName} account.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Reset Password
        </a>
      </div>
      
      <p style="color: #64748b; font-size: 14px;">
        This link will expire in 24 hours. If you didn't request this password reset, please ignore this email.
      </p>
    `;
    
    return this.getBaseTemplate(content, appName);
  }

  /**
   * Account approval template
   */
  static getApprovalTemplate(userName, isApproved, appName) {
    const status = isApproved ? 'Approved' : 'Rejected';
    const color = isApproved ? '#10b981' : '#ef4444';
    
    const content = `
      <h2 style="color: ${color}; margin-bottom: 20px;">Account ${status}</h2>
      
      <p style="color: #64748b; margin-bottom: 20px; font-size: 16px;">
        Hi ${userName},
      </p>
      
      <p style="color: #64748b; margin-bottom: 30px; font-size: 16px;">
        Your ${appName} account has been ${isApproved ? 'approved' : 'rejected'}.
      </p>
      
      ${isApproved ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${Meteor.absoluteUrl()}" 
             style="background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Access ${appName}
          </a>
        </div>
      ` : `
        <p style="color: #64748b; font-size: 14px;">
          If you believe this was an error, please contact our support team.
        </p>
      `}
    `;
    
    return this.getBaseTemplate(content, appName);
  }

  /**
   * Admin notification template
   */
  static getAdminNotificationTemplate(subject, message, actionUrl, appName) {
    const content = `
      <h2 style="color: #334155; margin-bottom: 20px;">${subject}</h2>
      
      <p style="color: #64748b; margin-bottom: 30px; font-size: 16px;">
        ${message}
      </p>
      
      ${actionUrl ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${actionUrl}" 
             style="background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Take Action
          </a>
        </div>
      ` : ''}
    `;
    
    return this.getBaseTemplate(content, appName);
  }

  /**
   * Event notification template
   */
  static getEventNotificationTemplate(userName, eventTitle, eventDate, notificationType, appName) {
    const content = `
      <h2 style="color: #334155; margin-bottom: 20px;">${eventTitle}</h2>
      
      <p style="color: #64748b; margin-bottom: 20px; font-size: 16px;">
        Hi ${userName},
      </p>
      
      <p style="color: #64748b; margin-bottom: 30px; font-size: 16px;">
        ${this.getEventNotificationMessage(notificationType, eventTitle, eventDate)}
      </p>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #334155; margin: 0 0 10px 0;">${eventTitle}</h3>
        <p style="color: #64748b; margin: 0; font-size: 14px;">📅 ${eventDate}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${Meteor.absoluteUrl()}events" 
           style="background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          View Events
        </a>
      </div>
    `;
    
    return this.getBaseTemplate(content, appName);
  }

  /**
   * Get event notification message based on type
   */
  static getEventNotificationMessage(type, eventTitle, eventDate) {
    switch(type) {
      case 'event-created':
        return `A new event has been created that you might be interested in.`;
      case 'event-updated':
        return `An event you're interested in has been updated.`;
      case 'event-cancelled':
        return `Unfortunately, this event has been cancelled.`;
      case 'event-reminder':
        return `This is a reminder that you have an upcoming event tomorrow.`;
      default:
        return `This is a notification about an upcoming event.`;
    }
  }
}
