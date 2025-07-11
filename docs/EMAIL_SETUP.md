# Email Configuration Guide - Brevo SMTP

This guide will help you configure CommunityHub to send emails using Brevo (formerly Sendinblue) SMTP service.

## Prerequisites

1. **Brevo Account**: Sign up at [https://www.brevo.com](https://www.brevo.com)
2. **SMTP Credentials**: Retrieve your SMTP credentials from Brevo dashboard

## Step 1: Get Brevo SMTP Credentials

1. Log in to your Brevo account
2. Go to **SMTP & API** → **SMTP** in the dashboard
3. Note down your SMTP credentials:
   - **SMTP Server**: `smtp-relay.brevo.com`
   - **Port**: `587` (TLS) or `465` (SSL)
   - **Username**: Your Brevo login email
   - **Password**: Your Brevo SMTP password (not your account password)

## Step 2: Configure Development Environment

1. **Update `settings.json`**:

   ```json
   {
     "private": {
       "email": {
         "smtp": {
           "username": "your-brevo-email@example.com",
           "password": "your-brevo-smtp-password",
           "server": "smtp-relay.brevo.com",
           "port": 587
         }
       }
     }
   }
   ```

2. **Alternative: Use Environment Variables**

   Create a `.env` file (copy from `.env.example`):

   ```bash
   MAIL_URL=smtp://your-brevo-email:your-brevo-password@smtp-relay.brevo.com:587
   ```

## Step 3: Configure Production Environment

Update `settings-production.json`:

```json
{
  "private": {
    "email": {
      "smtp": {
        "username": "BREVO_SMTP_USERNAME",
        "password": "BREVO_SMTP_PASSWORD",
        "server": "smtp-relay.brevo.com",
        "port": 587
      }
    }
  }
}
```

Use environment variables in production for security.

## Step 4: Test Email Configuration

1. **Start your Meteor server**: `meteor run`
2. **Login as an admin user**
3. **Go to Admin Settings** (`/admin`)
4. **Scroll to "Email Configuration Test" section**
5. **Enter a test email address and click "Send Test Email"**

If successful, you'll receive a test email and see a success message.

## Troubleshooting

### Common Issues:

1. **Authentication Failed**

   - Double-check your Brevo SMTP username and password
   - Make sure you're using the SMTP password, not your account password

2. **Connection Timeout**

   - Verify the SMTP server and port are correct
   - Check if your hosting provider blocks outbound SMTP connections

3. **"From" Address Issues**

   - Make sure the "from" email domain is verified in your Brevo account
   - Use a verified sender address

4. **Rate Limiting**
   - Brevo has sending limits based on your plan
   - Check your Brevo dashboard for usage and limits

### Email Features in CommunityHub:

- ✅ **Email Verification**: New users receive verification codes
- ✅ **Admin Notifications**: Admins get notified of pending user approvals
- ✅ **Password Reset**: Users can reset passwords via email
- ✅ **Account Security**: Login attempt notifications

## Environment Variables Reference

For production deployment, use these environment variables:

```bash
# Brevo SMTP Configuration
BREVO_SMTP_USERNAME=your-brevo-email@example.com
BREVO_SMTP_PASSWORD=your-brevo-smtp-password

# Or use MAIL_URL (alternative)
MAIL_URL=smtp://username:password@smtp-relay.brevo.com:587
```

## Security Best Practices

1. **Never commit SMTP credentials** to version control
2. **Use environment variables** in production
3. **Regularly rotate SMTP passwords**
4. **Monitor email sending quotas** in Brevo dashboard
5. **Set up proper SPF/DKIM records** for your domain (if using custom domain)

## Support

- **Brevo Documentation**: [https://developers.brevo.com/](https://developers.brevo.com/)
- **Meteor Email Documentation**: [https://docs.meteor.com/api/email.html](https://docs.meteor.com/api/email.html)

---

**Note**: Replace placeholder values with your actual Brevo SMTP credentials. Keep credentials secure and never share them publicly.
