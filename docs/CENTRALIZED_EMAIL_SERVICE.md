# Centralized Email Service

## Overview

This document outlines the implementation of a centralized email service for the CommunityHub application. The service provides a unified approach to sending all types of email notifications with consistent formatting, error handling, and security.

## Architecture

### Core Components

1. **EmailService.js** - Main service class handling all email operations
2. **server/methods.js** - Meteor methods for client-server email communication
3. **Environment Configuration** - Secure credential management via environment variables

### Service Structure

```
imports/api/email/
├── EmailService.js           # Centralized email service class
├── index.js                  # Module exports
└── server/
    └── methods.js            # Server-side email methods
```

## Features

### Supported Email Types

- **Verification Codes** - Email address verification during registration
- **Welcome Messages** - Post-approval welcome emails
- **Account Approval** - Approval/rejection notifications
- **Password Reset** - Secure password reset emails
- **Admin Notifications** - System notifications to administrators
- **Event Notifications** - Event-related communications

### Key Benefits

- **Consistent Formatting** - All emails use uniform, professional templates
- **Centralized Error Handling** - Comprehensive logging and error management
- **Security** - Environment variable-based credential management
- **Maintainability** - Single point of control for all email operations
- **Responsive Design** - Mobile-friendly email templates

## Implementation

### EmailService Class

The `EmailService` class provides static methods for different email types:

```javascript
// Send verification code
await EmailService.sendVerificationCode(email, code);

// Send welcome email
await EmailService.sendWelcomeEmail(userEmail, userName);

// Send approval notification
await EmailService.sendApprovalNotification(userEmail, userName, isApproved);

// Send admin notification
await EmailService.sendAdminNotification(
  adminEmail,
  subject,
  message,
  actionUrl
);
```

### Server Methods

Client applications can trigger email sending via Meteor methods:

```javascript
// Send verification code (public method)
await Meteor.callAsync("email.sendVerificationCode", email, code);

// Send admin notification (admin only)
await Meteor.callAsync(
  "email.sendAdminNotification",
  adminEmail,
  subject,
  message
);
```

### Permission System

All email methods (except verification codes) require appropriate permissions:

- Admin notifications require `MANAGE_USERS` permission
- Event notifications require `CREATE_EVENTS` permission
- User approval emails require `MANAGE_USERS` permission

## Configuration

### Environment Variables

The service uses the following environment variables for configuration:

```bash
# SMTP Configuration
SMTP_USER="your-smtp-username"
SMTP_PASSWORD="your-smtp-password"
MAIL_URL="smtp://username:password@smtp-provider.com:587"

# Email From Address
EMAIL_FROM="your-from-address@domain.com"
```

### Settings Integration

The service integrates with the application's settings system and falls back to `settings.json` values when environment variables are not available.

## Migration from Old System

### What Was Replaced

1. **Individual email methods** scattered across different modules
2. **Inconsistent email templates** with varied styling
3. **Manual error handling** in each email-sending location
4. **Hardcoded email addresses** throughout the codebase

### Files Updated

- `imports/api/users/server/verification-methods.js` - Now uses `EmailService.sendVerificationCode()`
- `imports/api/users/server/approval-methods.js` - Now uses `EmailService.sendApprovalNotification()`
- `imports/api/users/server/accounts.js` - Enhanced superuser role management
- Email configuration centralized in `imports/startup/server/email.js`

### Removed Components

- Old email test methods and UI components
- Hardcoded email templates in individual methods
- Duplicate email configuration code

## Usage Examples

### Basic Email Sending (Server-side)

```javascript
import { EmailService } from "/imports/api/email/EmailService.js";

// In a Meteor method or server function
try {
  await EmailService.sendWelcomeEmail("user@example.com", "John Doe");
  console.log("Welcome email sent successfully");
} catch (error) {
  console.error("Failed to send welcome email:", error);
}
```

### Client-side Email Triggering

```javascript
// In React component or client code
try {
  const result = await Meteor.callAsync(
    "email.sendAdminNotification",
    "admin@example.com",
    "New User Registration",
    "A new user has registered and needs approval"
  );
  console.log("Admin notified:", result.message);
} catch (error) {
  console.error("Failed to notify admin:", error.reason);
}
```

### Custom Email Templates

The service provides a base template system that can be extended:

```javascript
// Adding new email types
static async sendCustomNotification(userEmail, customData) {
  return await this.sendEmail({
    type: 'custom notification',
    to: userEmail,
    subject: 'Custom Subject',
    html: this.getCustomTemplate(customData),
    text: 'Plain text version'
  });
}
```

## Email Templates

### Design Features

- **Responsive Design** - Works on desktop and mobile devices
- **Brand Consistency** - Uses application colors and styling
- **Accessibility** - Proper contrast and readable fonts
- **Professional Layout** - Clean, modern appearance

### Template Structure

All email templates follow a consistent structure:

1. **Header** - Application name and branding
2. **Content Area** - Main message with clear call-to-action
3. **Footer** - Copyright and contact information

### Customization

Templates can be customized by modifying the template methods in `EmailService.js`:

- `getVerificationCodeTemplate()`
- `getWelcomeTemplate()`
- `getPasswordResetTemplate()`
- `getApprovalTemplate()`
- `getAdminNotificationTemplate()`
- `getEventNotificationTemplate()`

## Error Handling

### Logging

The service provides comprehensive logging:

```
📧 Sending verification code to: user@example.com
📧 From address: noreply@yourapp.com
📧 Subject: Your App Verification Code
📧 ✅ Email sent successfully!
📧 Message ID: <unique-message-id>
```

### Error Recovery

- Failed email attempts are logged with detailed error information
- Network issues are handled gracefully with appropriate error messages
- Invalid email addresses are validated before sending

### Monitoring

Administrators can monitor email operations through server logs:

```
📧 EmailService.sendEmail called with: { type: 'verification code', to: 'user@example.com' }
📧 ✅ Verification code sent successfully
```

## Security Considerations

### Credential Management

- SMTP credentials stored in environment variables only
- No hardcoded passwords or API keys in source code
- Fallback to settings.json for development environments

### Permission Controls

- Method-level permission checking for sensitive operations
- User authentication required for all admin email functions
- Role-based access control for different email types

### Email Validation

- Email address format validation before sending
- Recipient verification for admin notifications
- Rate limiting considerations for verification codes

## Development Guidelines

### Adding New Email Types

1. Create a new static method in `EmailService` class
2. Add corresponding template method
3. Create server method in `server/methods.js` if client access needed
4. Add appropriate permission checks
5. Update this documentation

### Testing

The service includes comprehensive logging for testing purposes. Monitor server logs when developing:

```bash
npm run dev
# Check server logs for email operations
```

### Best Practices

- Always use the centralized service for email operations
- Include proper error handling in calling code
- Test email functionality in development environment
- Verify email templates render correctly across email clients
- Keep templates simple and accessible

## Troubleshooting

### Common Issues

1. **Email not sending**

   - Check SMTP credentials in environment variables
   - Verify network connectivity to SMTP server
   - Review server logs for detailed error messages

2. **Permission errors**

   - Ensure user has appropriate roles for email type
   - Check that user is authenticated before calling methods

3. **Template issues**
   - Verify template methods return valid HTML
   - Check for proper variable substitution
   - Test across different email clients

### Debug Information

Enable verbose logging by checking server console during email operations. The service provides detailed information about:

- Email configuration source (environment vs settings)
- SMTP connection status
- Message delivery confirmation
- Error details and stack traces

## Future Enhancements

### Planned Features

- Email queue system for high-volume operations
- Template management interface for administrators
- Email analytics and delivery tracking
- Automated email scheduling
- Multiple language support for templates

### Scalability Considerations

- Consider implementing email queuing for production environments
- Monitor email delivery rates and provider limits
- Implement retry logic for failed deliveries
- Add email template caching for performance

## Conclusion

The centralized email service provides a robust, maintainable, and secure foundation for all email communications in the CommunityHub application. By consolidating email operations into a single service, we've improved code maintainability, user experience, and system reliability.

For questions or suggestions regarding the email service, please refer to the development team or create an issue in the project repository.
