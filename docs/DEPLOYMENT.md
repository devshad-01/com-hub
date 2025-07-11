# CommunityHub - Deployment Guide

## Overview

CommunityHub is a modern community platform built with Meteor 3, React 18, and TailwindCSS. This guide covers deployment configuration, environment setup, and post-deployment procedures for production environments.

## Architecture Overview

### Technology Stack

- **Backend**: Meteor 3.1 (Node.js)
- **Frontend**: React 18.2 with React Router 6
- **Database**: MongoDB (Atlas recommended)
- **Styling**: TailwindCSS 4.1
- **Email Service**: Centralized EmailService with Brevo SMTP
- **File Storage**: Backblaze B2 integration
- **Authentication**: Meteor Accounts with role-based permissions

### Key Features

- User registration with email verification
- Role-based access control (Superadmin, Admin, Moderator, Event Creator, Member)
- Real-time messaging and forums
- Event management system
- Admin dashboard with user approval workflow
- Centralized email notification system
- File upload and storage

## Environment Variables

### Required Production Variables

```bash
# ===== DATABASE CONFIGURATION =====
MONGO_URL="mongodb+srv://username:password@cluster.mongodb.net/database-name?retryWrites=true&w=majority"

# ===== EMAIL CONFIGURATION =====
# Primary SMTP configuration (Brevo example)
MAIL_URL="smtp://username%40smtp-brevo.com:password@smtp-relay.brevo.com:587"
SMTP_USER="your-smtp-username@smtp-brevo.com"
SMTP_PASSWORD="your-smtp-password"
EMAIL_FROM="noreply@yourdomain.com"

# ===== SUPER ADMIN SETUP =====
SUPERADMIN_EMAIL="admin@yourdomain.com"
SUPERADMIN_PASSWORD="your-secure-password-2025!"

# ===== SECURITY CONFIGURATION =====
ROOT_URL="https://yourdomain.com"
BCRYPT_ROUNDS="12"
SESSION_TIMEOUT="604800000"  # 7 days in milliseconds

# ===== OPTIONAL: FILE STORAGE (Backblaze B2) =====
B2_APPLICATION_KEY_ID="your-b2-key-id"
B2_APPLICATION_KEY="your-b2-application-key"
B2_BUCKET_NAME="your-bucket-name"
B2_DOWNLOAD_URL="https://f000.backblazeb2.com"

# ===== PERFORMANCE OPTIMIZATION =====
TOOL_NODE_FLAGS="--max-old-space-size=6144"
```

### Email Provider Configuration

#### Brevo (Recommended)

```bash
MAIL_URL="smtp://username%40smtp-brevo.com:password@smtp-relay.brevo.com:587"
SMTP_USER="your-login@smtp-brevo.com"
SMTP_PASSWORD="your-smtp-password"
```

#### Gmail (Alternative)

```bash
MAIL_URL="smtp://username%40gmail.com:app-password@smtp.gmail.com:587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

#### SendGrid (Alternative)

```bash
MAIL_URL="smtp://apikey:your-api-key@smtp.sendgrid.net:587"
SMTP_USER="apikey"
SMTP_PASSWORD="your-sendgrid-api-key"
```

## Pre-Deployment Setup

### 1. Database Setup (MongoDB Atlas)

1. **Create MongoDB Atlas account** at https://cloud.mongodb.com
2. **Create new cluster** (M0 free tier for development)
3. **Configure network access** - Add your deployment platform's IPs
4. **Create database user** with read/write permissions
5. **Get connection string** and update `MONGO_URL`

### 2. Email Service Setup

#### Option A: Brevo (Recommended)

1. Sign up at https://www.brevo.com
2. Go to SMTP & API settings
3. Create SMTP credentials
4. Add verified sender addresses
5. Update email environment variables

#### Option B: Gmail

1. Enable 2-factor authentication
2. Generate app-specific password
3. Use app password in SMTP configuration

### 3. File Storage Setup (Optional)

1. **Create Backblaze B2 account** at https://www.backblaze.com
2. **Create bucket** for file storage
3. **Generate application keys**
4. **Update B2 environment variables**

## Deployment Platforms

### Meteor Galaxy (Recommended)

#### Setup Steps

1. **Install Meteor Galaxy CLI**:

   ```bash
   npm install -g galaxy-deploy
   ```

2. **Login to Galaxy**:

   ```bash
   galaxy auth
   ```

3. **Deploy**:
   ```bash
   DEPLOY_HOSTNAME=galaxy.meteor.com meteor deploy yourdomain.meteorapp.com --settings settings-production.json
   ```

#### Galaxy Configuration

- **App Directory**: `./`
- **Settings File**: `settings-production.json`
- **Node Version**: Latest LTS
- **Memory**: 1GB minimum (2GB recommended)

### Meteor Cloud

1. **Connect repository** to Meteor Cloud
2. **Set environment variables** in dashboard
3. **Configure deployment settings**:
   - Build command: `meteor npm install --production`
   - Deploy command: `meteor build --directory`
   - Settings file: `settings-production.json`

### Docker Deployment

#### Dockerfile

```dockerfile
FROM node:18-alpine

# Install Meteor
RUN npm install -g meteor@latest

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY .meteor ./.meteor

# Install dependencies
RUN meteor npm install --production

# Copy application code
COPY . .

# Build the application
RUN meteor build --directory /build --server-only

# Switch to built app
WORKDIR /build/bundle/programs/server
RUN npm install --production

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Start application
CMD ["node", "main.js"]
```

#### Docker Compose

```yaml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGO_URL=${MONGO_URL}
      - ROOT_URL=${ROOT_URL}
      - MAIL_URL=${MAIL_URL}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASSWORD=${SMTP_PASSWORD}
      - EMAIL_FROM=${EMAIL_FROM}
      - SUPERADMIN_EMAIL=${SUPERADMIN_EMAIL}
      - SUPERADMIN_PASSWORD=${SUPERADMIN_PASSWORD}
    restart: unless-stopped
```

## Settings Files

### settings-production.json

```json
{
  "public": {
    "requireEmailVerification": true,
    "app": {
      "name": "CommunityHub",
      "version": "1.0.0"
    },
    "security": {
      "maxLoginAttempts": 5,
      "lockoutDuration": 900000,
      "sessionTimeout": 604800000,
      "passwordResetTimeout": 86400000
    }
  },
  "private": {
    "security": {
      "bcryptRounds": 12,
      "rateLimiting": {
        "enabled": true,
        "authMethods": {
          "perConnection": 5,
          "perMinute": 60
        }
      }
    },
    "email": {
      "from": "EMAIL_FROM"
    },
    "superadmin": {
      "email": "SUPERADMIN_EMAIL",
      "password": "SUPERADMIN_PASSWORD"
    },
    "mongodb": {
      "url": "MONGO_URL"
    }
  },
  "packages": {
    "email": {
      "service": "brevo",
      "host": "smtp-relay.brevo.com",
      "port": 587,
      "secure": false,
      "user": "SMTP_USER",
      "password": "SMTP_PASSWORD"
    }
  }
}
```

## Post-Deployment Configuration

### 1. Initial Superadmin Setup

After successful deployment:

1. **Access your application** at the deployed URL
2. **Login with superadmin credentials**:
   - Email: Value from `SUPERADMIN_EMAIL`
   - Password: Value from `SUPERADMIN_PASSWORD`
3. **Immediately change password** in profile settings
4. **Verify email configuration** by testing user registration

### 2. System Verification

#### Email System Test

1. Register a test user account
2. Verify email verification works
3. Test admin notification emails
4. Check email logs in server console

#### Permission System Test

1. Create test users with different roles
2. Verify role-based access controls
3. Test admin approval workflow
4. Validate permission restrictions

#### Core Features Test

1. User registration and verification
2. Forum posting and messaging
3. Event creation and management
4. File upload functionality (if configured)
5. Real-time updates and notifications

### 3. Production Hardening

#### Security Measures

```bash
# Enable security headers
export FORCE_SSL=true
export DISABLE_WEBSOCKETS_CROSS_ORIGIN_CHECK=false

# Rate limiting
export RATE_LIMIT_ENABLED=true
export MAX_REQUESTS_PER_MINUTE=60
```

#### Monitoring Setup

1. **Application monitoring**: Set up error tracking (Sentry, LogRocket)
2. **Performance monitoring**: Monitor response times and database queries
3. **Email monitoring**: Track email delivery rates
4. **Database monitoring**: Monitor MongoDB performance

#### Backup Strategy

1. **Database backups**: Configure automatic MongoDB Atlas backups
2. **File storage backups**: Implement B2 backup strategy
3. **Code backups**: Ensure version control and deployment rollback capability

## Troubleshooting

### Common Deployment Issues

#### Email Not Sending

```bash
# Check email configuration
echo $MAIL_URL
echo $SMTP_USER
echo $EMAIL_FROM

# Verify SMTP credentials
# Check server logs for email errors
```

#### Database Connection Issues

```bash
# Verify MongoDB connection string
echo $MONGO_URL

# Check network access in MongoDB Atlas
# Verify database user permissions
```

#### Permission Errors

- Ensure superadmin user is created correctly
- Verify role hierarchy in database
- Check permission assignments

#### Performance Issues

- Increase memory allocation in deployment platform
- Optimize database queries
- Enable MongoDB indexes
- Configure CDN for static assets

### Server Logs

Monitor these log messages for system health:

```bash
# Email service status
📧 Environment check: SMTP_USER: SET, SMTP_PASSWORD: SET
📧 Configured FROM address: your-email@domain.com

# Database connection
✅ Database connection established

# User management
✅ Roles initialized successfully
🔧 Fixed superuser roles for existing users
```

## Scaling Considerations

### Horizontal Scaling

- Use load balancer for multiple app instances
- Implement session store (Redis)
- Configure database read replicas

### Performance Optimization

- Enable MongoDB indexes
- Implement caching strategies
- Optimize bundle size
- Use CDN for static assets

### Monitoring and Alerts

- Set up health checks
- Configure error notifications
- Monitor database performance
- Track email delivery metrics

## Development vs Production

### Development Environment

```bash
# Use local MongoDB
export MONGO_URL="mongodb://localhost:27017/communityapp"

# Use development email settings
export EMAIL_FROM="dev@localhost"

# Run with development settings
npm run dev
```

### Production Environment

```bash
# Use production MongoDB Atlas
export MONGO_URL="mongodb+srv://..."

# Use verified email domain
export EMAIL_FROM="noreply@yourdomain.com"

# Deploy with production settings
meteor deploy --settings settings-production.json
```

## Security Checklist

- [ ] Strong, unique superadmin password
- [ ] HTTPS enforced (ROOT_URL uses https://)
- [ ] Environment variables properly secured
- [ ] Database access restricted to application
- [ ] Email sender address verified
- [ ] Rate limiting enabled
- [ ] Session timeout configured
- [ ] Password requirements enforced
- [ ] File upload restrictions in place
- [ ] CORS properly configured
- [ ] Error messages don't leak sensitive data
- [ ] Backup and recovery procedures tested

## Support and Maintenance

### Regular Maintenance Tasks

1. **Update dependencies** monthly
2. **Monitor email delivery rates**
3. **Review user analytics and feedback**
4. **Database performance optimization**
5. **Security updates and patches**

### Documentation References

- [Centralized Email Service](./CENTRALIZED_EMAIL_SERVICE.md)
- [Permissions Guide](./PERMISSIONS_GUIDE.md)
- [Role Management](./ROLES.md)
- [Superadmin Setup](./SUPERADMIN_SETUP.md)

For additional support or questions, refer to the project documentation or contact the development team.
