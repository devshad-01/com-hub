# Role-Based Permissions System

This document outlines the role-based permissions system implemented in the Community Hub application using the `alanning:roles` package.

## Important Implementation Notes

The `alanning:roles` package (v4.0.0) now uses async methods. All server-side methods must use the async versions:

```js
// ❌ Old synchronous methods (don't work in v4.0.0)
Roles.userIsInRole(userId, "admin");
Roles.getRolesForUser(userId);
Roles.createRole("admin");

// ✅ New async methods (use these on the server)
await Roles.userIsInRoleAsync(userId, "admin");
await Roles.getRolesForUserAsync(userId);
await Roles.createRoleAsync("admin");
```

For client-side role checks, we use the published role assignments:

```js
// Client-side role check
const assignments = Meteor.roleAssignment
  .find({
    "user._id": userId,
    "role._id": "admin",
  })
  .fetch();
const isAdmin = assignments.length > 0;
```

## Roles Overview

The following roles have been defined in the system:

- **Admin**: Full access to all features, including admin dashboard
- **Moderator**: Can moderate forum content, pin/lock posts, and create events
- **Event Creator**: Can create and manage events but doesn't have moderation powers
- **Member**: Basic user role with standard access

## Permission System

Each role has specific permissions associated with it. Users get access to specific features based on their role(s).

For example:
- A user with only the **Member** role can participate in forums but cannot pin posts
- A user with the **Event Creator** role can create events but cannot moderate forum content
- A user with the **Moderator** role can both moderate forum content AND create events
- A user with the **Admin** role can do everything, including accessing the admin dashboard

The system is designed so that each feature checks which roles are allowed to use it, rather than checking for a specific user level.

## Permissions by Role

### Admin

- Delete users
- Assign roles to users
- Create forum categories
- Delete forum categories
- Full forum moderation (pin/lock/delete posts)
- Create events
- Access admin dashboard

### Moderator

- Moderate forum content (pin/lock/delete posts)
- Create events
- Post in locked threads

### Event Creator

- Create and manage events

### Member

- Participate in forums
- RSVP to events
- Update own profile
- Use chat features

## Implementation Details

### Role Storage

- Roles are stored using the `alanning:roles` package
- Users can have multiple roles

### Authentication Context

- The `AuthContext.jsx` provides role-related functions through a React context
- Use `useAuth()` hook to access authentication and role functionality

### Key Functions

```jsx
// Check if current user has a role
const { hasRole } = useAuth();
if (hasRole("admin")) {
  // Admin functionality
}

// Get all roles for a user
const { getUserRoles } = useAuth();
const roles = getUserRoles(userId);

// Check specific permissions
const { can } = useAuth();
if (can.createEvent()) {
  // Show event creation UI
}
```

## Protected Routes

Routes can be protected based on roles:

```jsx
<ProtectedRoute requireAdmin={true}>
  <AdminComponent />
</ProtectedRoute>

<ProtectedRoute requireRoles={['admin', 'moderator']}>
  <ModerationComponent />
</ProtectedRoute>
```

## Migrating from Old System

A migration function has been implemented to convert users from the old `profile.role` approach to the new role-based system. This runs automatically on server startup.

## Adding New Permissions

To add new permissions:

1. Update the permission checks in `AuthContext.jsx`
2. Implement the permission check where needed
3. Update this documentation

## Best Practices

- Always use the `useAuth()` hook for role and permission checks
- Perform role checks on both client and server sides
- Add server-side role verification in all Meteor methods that require specific permissions
