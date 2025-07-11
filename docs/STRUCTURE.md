# Community App - Project Structure

A comprehensive Meteor-based platform for faith communities with user engagement, events, forums, and real-time communication. This document provides an overview of the application architecture and component organization.

## Project Structure

This project follows an industry-standard folder structure for Meteor applications, emphasizing modularity, separation of concerns, and easy contribution by multiple developers without conflicts:

### Key Directories

```
/imports                 # Application code
  /api                   # Data layer: collections, methods, and publications
    /users               # User management with authentication and roles
    /events              # Event management with RSVP functionality
    /forums              # Structured forum system with categories, subforums, threads, posts
    /messages            # Real-time chat messages system
    /notifications       # User notifications system
    /threads             # Private messaging threads
  /startup               # Startup code for client and server
    /client              # Client initialization code
    /server              # Server initialization and fixture data
  /ui                    # UI layer
    /components          # Reusable UI components
      /admin             # Admin-specific components
      /user              # User profile components
      /events            # Event-related components (CreateEventForm, etc.)
      /forum             # Forum components
      /chat              # Chat components
      /common            # Shared components (Header, Footer, Sidebar)
    /layouts             # Layout components (MainLayout)
    /pages               # Page components for routing
      /admin             # Admin dashboard pages (Dashne board, Users, Events, Forums)
    /helpers             # UI helper functions
  /modules               # Feature modules and business logic
  /styles                # Styling (Tailwind CSS)
  /utils                 # Utility functions
/client                  # Client entry point
/server                  # Server entry point
/public                  # Public assets (images, fonts)
/private                 # Private assets (email templates)
/tests                   # Test files
```

## Completed Features

1. **User Management System**

   - Authentication (Email/Password)
   - Role-based access control with alanning:roles
   - User profiles with customizable fields
   - Online presence tracking with konecty:user-presence

2. **Admin Control Panel**

   - Comprehensive admin dashboard
   - User management (create, edit, delete users)
   - Event management and moderation
   - Forum structure management and moderation
   - Content moderation
   - User management

3. **Real-Time Interaction Layer**

   - Global chat
   - Private messaging
   - Real-time notifications

4. **Event Ecosystem**

   - Event creation and management
   - RSVP system
   - Calendar view

5. **Community Forum**
   - Hierarchical forum structure (Categories → Subforums → Threads → Posts)
   - Post voting/rating system
   - Content moderation

## Technology Stack

- **Framework:** Meteor.js
- **UI:** React with Tailwind CSS
- **Database:** MongoDB
- **Authentication:** Meteor Accounts
- **Calendar:** FullCalendar.js
- **Presence:** konecty:user-presence

## Development Setup

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/community-app.git
cd community-app
```

2. **Install dependencies**

```bash
meteor npm install
```

3. **Run the application**

```bash
meteor run
```

## Contribution Guidelines

- Feature branches → PRs → Test in staging
- UI-first development using Tailwind prototypes
- Collection names in PascalCase (e.g., `Events`)
- Method names in `feature.action` format (e.g., `events.create`)
