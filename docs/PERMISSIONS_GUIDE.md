# Role-Based Permissions Visual Guide

This document provides a visual guide to understand which roles have access to which features in the Community Hub application.

## Permission Matrix

| Feature/Action              | Admin | Moderator | Event Creator | Member |
|----------------------------|:-----:|:---------:|:-------------:|:------:|
| **User Management**        |       |           |               |        |
| Access Admin Dashboard     |   ✓   |     ✗     |       ✗       |    ✗   |
| Delete Users               |   ✓   |     ✗     |       ✗       |    ✗   |
| Assign Roles to Users      |   ✓   |     ✗     |       ✗       |    ✗   |
| **Forum Management**       |       |           |               |        |
| Create Categories          |   ✓   |     ✗     |       ✗       |    ✗   |
| Delete Categories          |   ✓   |     ✗     |       ✗       |    ✗   |
| Pin Posts                  |   ✓   |     ✓     |       ✗       |    ✗   |
| Lock Threads               |   ✓   |     ✓     |       ✗       |    ✗   |
| Delete Posts               |   ✓   |     ✓     |       ✗       |    ✗   |
| Post in Locked Threads     |   ✓   |     ✓     |       ✗       |    ✗   |
| **Event Management**       |       |           |               |        |
| Create Events              |   ✓   |     ✓     |       ✓       |    ✗   |
| Manage Events              |   ✓   |     ✓     |       ✓       |    ✗   |
| **Basic Features**         |       |           |               |        |
| Participate in Forums      |   ✓   |     ✓     |       ✓       |    ✓   |
| RSVP to Events             |   ✓   |     ✓     |       ✓       |    ✓   |
| Update Own Profile         |   ✓   |     ✓     |       ✓       |    ✓   |
| Use Chat Features          |   ✓   |     ✓     |       ✓       |    ✓   |

## How Permissions are Checked

When a user attempts to perform an action, the system checks if their role is allowed to perform that action. For example:

```javascript
// Check if user can create an event
if (can.createEvent()) {
  // Show event creation UI
}

// Check if user can access admin dashboard
if (can.accessAdminDashboard()) {
  // Show admin dashboard link
}
```

The `can` object provides permission check functions through the `useAuth()` hook.

## Role Assignment Process

1. New users are assigned the **Member** role by default
2. Admins can assign additional roles through the Admin Dashboard
3. Users can have multiple roles simultaneously (e.g., both Moderator and Event Creator)
4. Higher roles don't automatically include lower role permissions - each permission is explicitly checked
