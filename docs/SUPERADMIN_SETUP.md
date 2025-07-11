# Super Admin Setup Guide

## Overview

The application automatically creates a super admin user on the first run when the database is empty. This ensures you always have administrative access to your CommunityHub instance.

## Configuration Methods

### Method 1: Environment Variables (Recommended for Production)

Set the following environment variables before starting the application:

```bash
export SUPERADMIN_EMAIL="admin@yourdomain.com"
export SUPERADMIN_PASSWORD="YourSecurePasswordHere123!"
export SUPERADMIN_USERNAME="admin"
export SUPERADMIN_NAME="System Administrator"

# Then start the application
meteor --settings settings.json
```

### Method 2: Settings.json (Development)

Edit the `settings.json` file and update the `private.defaultSuperAdmin` section:

```json
{
  "private": {
    "defaultSuperAdmin": {
      "email": "admin@yourdomain.com",
      "password": "YourSecurePasswordHere123!",
      "username": "admin",
      "name": "System Administrator"
    }
  }
}
```

### Method 3: Using .env File (Development)

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your credentials:

   ```bash
   SUPERADMIN_EMAIL=admin@yourdomain.com
   SUPERADMIN_PASSWORD=YourSecurePasswordHere123!
   SUPERADMIN_USERNAME=admin
   SUPERADMIN_NAME=System Administrator
   ```

3. Load the environment and start:
   ```bash
   source .env && meteor --settings settings.json
   ```

## Security Notes

1. **Change Default Credentials**: Always change the default super admin credentials immediately after first login.

2. **Environment Variables Priority**: The system checks for credentials in this order:

   - Environment variables (highest priority)
   - settings.json private section
   - Built-in defaults (fallback)

3. **Production Deployment**: For production, always use environment variables and never commit sensitive credentials to version control.

4. **First Run Only**: The super admin is only created when the database is completely empty (user count = 0).

## Default Credentials (if no configuration is provided)

- **Email**: superadmin@communityhub.com
- **Password**: SuperAdmin123!@#
- **Username**: superadmin
- **Name**: Super Administrator

⚠️ **IMPORTANT**: These default credentials should only be used for initial development setup. Always configure your own credentials for any deployment.

## Quick Setup

Run the setup script to get started quickly:

```bash
./setup-env.sh
```

This will create a `.env` file from the template that you can customize with your credentials.
