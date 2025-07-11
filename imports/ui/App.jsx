// imports/ui/App.jsx
import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';

import { RouteRenderer } from './components/common/RouteRenderer';
import { ToastProvider } from './components/common/ToastProvider';
import { AuthProvider } from './contexts/AuthContext';
import { AuthSuccessHandler } from './components/common/AuthSuccessHandler';
import { HomePage } from './pages/HomePage';
import { EventsPage } from './pages/EventsPage';
import { ForumPage } from './pages/ForumPage';
import { PostDetailPage } from './pages/PostDetailPage'; 
import PaymentSuccess from './pages/PaymentSuccess'; 


import { ChatPage } from './pages/ChatPage';
import { ProfilePage } from './pages/ProfilePage';
import { MembersPage } from './pages/MembersPage';
import { AdminPage } from './pages/admin/AdminPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { PasswordResetPage } from './pages/PasswordResetPage';
import { ResetPasswordRedirect } from './components/auth/ResetPasswordRedirect';
import { NotFoundPage } from './pages/NotFoundPage';

// Direct Message Page Component
import { DirectMessagePage } from './pages/DirectMessagePage';

export const App = () => {
  const userId = useTracker(() => Meteor.userId());

  // still loading data from backend
  if (userId === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <ToastProvider>
        <AuthSuccessHandler userId={userId} />
        <Routes>
        {/* Public routes - accessible when not logged in */}
        <Route
          path="/login"
          element={
            userId ? <Navigate to="/" replace /> : (
              <RouteRenderer userId={userId}>
                <LoginPage />
              </RouteRenderer>
            )
          }
        />
        <Route
          path="/register"
          element={
            userId ? <Navigate to="/" replace /> : (
              <RouteRenderer userId={userId}>
                <RegisterPage />
              </RouteRenderer>
            )
          }
        />
        <Route 
          path="/forgot-password" 
          element={
            <RouteRenderer userId={userId}>
              <ForgotPasswordPage />
            </RouteRenderer>
          } 
        />
        <Route 
          path="/reset-password" 
          element={
            <RouteRenderer userId={userId}>
              <PasswordResetPage />
            </RouteRenderer>
          } 
        />
        {/* Handle Meteor's default reset password URLs */}
        <Route 
          path="/reset-password/:token" 
          element={<ResetPasswordRedirect />} 
        />
        
        {/* Protected routes - require authentication */}
        <Route
          path="/events"
          element={
            userId ? (
              <RouteRenderer userId={userId}>
                <EventsPage />
              </RouteRenderer>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/forum"
          element={
            userId ? (
              <RouteRenderer userId={userId}>
                <ForumPage />
              </RouteRenderer>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
     <Route
  path="/forum/post/:postId"
  element={
    userId ? (
      <RouteRenderer userId={userId}>
        <PostDetailPage /> {/* Include PostDetailPage here */}
      </RouteRenderer>
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>
        
        <Route 
          path="/chat" 
          element={
            userId ? (
              <RouteRenderer userId={userId}>
                <ChatPage />
              </RouteRenderer>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/profile"
          element={
            userId ? (
              <RouteRenderer userId={userId}>
                <ProfilePage />
              </RouteRenderer>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/members"
          element={
            userId ? (
              <RouteRenderer userId={userId}>
                <MembersPage />
              </RouteRenderer>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Direct Message Routes */}
        {/* Base route for direct messages: shows conversation list */}
        <Route
          path="/messages"
          element={
            userId ? (
              <RouteRenderer userId={userId}>
                <DirectMessagePage />
              </RouteRenderer>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        {/* Route for a specific direct message conversation */}
        <Route
          path="/messages/:targetUserId"
          element={
            userId ? (
              <RouteRenderer userId={userId}>
                <DirectMessagePage />
              </RouteRenderer>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        {/* Admin-only routes */}
        <Route
          path="/admin"
          element={
            userId ? (
              <RouteRenderer userId={userId} requireAdmin={true}>
                <AdminPage />
              </RouteRenderer>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Home route - accessible to all but shows different content */}
        <Route
          path="/"
          element={
            userId ? (
              <RouteRenderer userId={userId}>
                <HomePage userId={userId} />
              </RouteRenderer>
            ) : (
              <RouteRenderer userId={userId}>
                <HomePage userId={userId} />
              </RouteRenderer>
            )
          }
        />

        {/* Catch-all route */}
        <Route
          path="*"
          element={
            userId ? (
              <RouteRenderer userId={userId}>
                <NotFoundPage />
              </RouteRenderer>
            ) : (
              <RouteRenderer userId={userId}>
                <NotFoundPage />
              </RouteRenderer>
            )
          }
        />

         <Route path="/payment-success" element={<PaymentSuccess />} /> {/* ADD THIS LINE */}
         
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
};
