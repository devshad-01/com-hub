"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from "react-router-dom"
import { useTracker } from "meteor/react-meteor-data"
import { Meteor } from "meteor/meteor"
import { Roles } from "meteor/alanning:roles"
import {
  Bell,
  Calendar,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Home,
  ChevronDown,
  User,
  Shield,
  Users,
  CircleDot,
} from "lucide-react"
import { NotificationDropdown } from "../notifications"
import { NotificationsCollection } from "/imports/api/notifications"
import { UserAvatar } from "./UserAvatar"
import { useAuth } from "../../contexts/AuthContext"
import { ROLES } from "../../../api/users/roles"

export const NavigationBar = ({ userId: passedUserId }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const location = useLocation()
  const { getUserPrimaryRole, getRoleColor } = useAuth()

  // Refs for click outside detection
  const notificationRef = useRef(null)
  const userMenuRef = useRef(null)

  const { user, isLoading, unreadNotificationCount } = useTracker(() => {
    const currentUser = Meteor.user()

    // Subscribe to notifications if user is logged in
    let unreadCount = 0
    if (currentUser) {
      const handle = Meteor.subscribe("userNotifications", { onlyUnread: true })
      if (handle.ready()) {
        unreadCount = NotificationsCollection.find({
          userId: currentUser._id,
          read: false,
        }).count()
      }
    }

    return {
      user: currentUser,
      isLoading: Meteor.loggingIn(),
      unreadNotificationCount: unreadCount,
    }
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
      if (window.innerWidth >= 768 && userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  // Navigation items - only shown when logged in
  const navigationItems = [
    {
      id: "home",
      name: "Home",
      href: "/",
      icon: Home,
      description: "Dashboard and overview",
    },
    {
      id: "events",
      name: "Events",
      href: "/events",
      icon: Calendar,
      description: "Community events and meetings",
    },
    {
      id: "forum",
      name: "Forum",
      href: "/forum",
      icon: MessageSquare,
      description: "Community discussions",
    },
    {
      id: "members",
      name: "Members",
      href: "/members",
      icon: Users,
      description: "Community members",
    },
  ]

  // Admin-only navigation
  const adminNavigation = [
    {
      id: "admin",
      name: "Admin Panel",
      href: "/admin",
      icon: Shield,
      description: "Administrative controls",
    },
  ]

  const isActive = (href) => {
    if (href === "/") return location.pathname === "/"
    return location.pathname.startsWith(href)
  }

  const handleLogout = async () => {
    try {
      await new Promise((resolve, reject) => {
        Meteor.logout((err) => {
          if (err) reject(err)
          else resolve()
        })
      })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setShowUserMenu(false)
      setIsMobileMenuOpen(false)
      
    }
  }

  // Use the Roles package to check if user is admin
  const userId = passedUserId || (user && user._id);
  // Check if user can access admin dashboard using the unified permissions
  const canAccessAdmin = userId ? useAuth().can.accessAdminDashboard() : false;
  const isAuthenticated = !!(passedUserId || user) && !isLoading

  // Helper functions for user roles and colors
  // We can keep this helper function for local use
  const getUserRoles = (userId) => {
    const userData = userId || (user && user._id);
    return userData ? Roles.getRolesForUser(userData) : ['member'];
  }
  
  // Removed duplicate getUserPrimaryRole - we're using it from AuthContext now
  
  // Using getRoleColor from AuthContext now, so we can remove this local definition

  const getUserInitial = () => {
    if (user?.profile?.name) {
      return user.profile.name.charAt(0).toUpperCase()
    }
    if (user?.username) {
      return user.username.charAt(0).toUpperCase()
    }
    if (user?.emails?.[0]?.address) {
      return user.emails[0].address.charAt(0).toUpperCase()
    }
    return "U"
  }

  const getUserDisplayName = () => {
    return user?.profile?.name || user?.username || "User"
  }

  const getUserAvatar = () => {
    return user?.profile?.avatar || null
  }

  const NavLink = ({ item, className = "", onClick, isMobile = false }) => {
    const Icon = item.icon
    const active = isActive(item.href)

    return (
      <Link
        to={item.href}
        className={`
          group relative flex items-center space-x-3 px-4 py-3 rounded-xl font-medium 
          transition-all duration-300 ease-in-out transform hover:scale-[1.02]
          ${
            active
              ? "bg-slate-700/80 text-blue-400 shadow-lg shadow-slate-900/20"
              : "text-slate-300 hover:text-white hover:bg-slate-700/50"
          }
          ${isMobile ? "text-base" : "text-sm"}
          ${className}
        `}
        onClick={onClick}
        title={item.description}
      >
        {/* Active indicator */}
        {active && (
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-400 rounded-r-full" />
        )}

        <Icon
          className={`
          w-5 h-5 transition-all duration-300 
          ${active ? "text-blue-400 scale-110" : "group-hover:scale-110 group-hover:text-blue-300"}
        `}
        />
        <span className="font-medium tracking-wide">{item.name}</span>

        {/* Hover effect overlay */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Link>
    )
  }

  return (
    <nav className="bg-slate-800 border-b border-slate-700/50 shadow-2xl sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo - Enhanced with better typography */}
          <div className="flex items-centre">
            <Link
              to="/"
              className="flex items-center space-x-2 group py-2 px-0 rounded-xl transition-all duration-300 hover:bg-slate-700/30"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div className="flex items-center  ">
                <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 via-amber-500 to-orange-600 bg-clip-text text-transparent group-hover:from-orange-300 group-hover:via-amber-400 group-hover:to-orange-500 transition-all duration-300">
                  Community
                </span>
                <div className="flex items-center">
                  <CircleDot className="w-6 h-6 text-orange-400 group-hover:text-orange-300 transition-all duration-300 group-hover:rotate-180" />
                  <span className="text-2xl font-bold text-white group-hover:text-orange-300 transition-colors duration-300 ml-1">
                    Hub
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation - Enhanced spacing and effects */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-2">
              {navigationItems.map((item) => (
                <NavLink key={item.id} item={item} />
              ))}

              {canAccessAdmin &&
                adminNavigation.map((item) => (
                  <NavLink key={item.id} item={item} className="text-amber-300 hover:text-amber-200" />
                ))}
            </div>
          )}

          {/* Right side actions - Enhanced with better spacing */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Notifications - Enhanced button design */}
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-3 text-slate-300 hover:text-white hover:bg-slate-700/60 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadNotificationCount > 0 && (
                      <span className="absolute top-0 right-4 w-6 h-6 bg-orange-400 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse shadow-lg">
                        {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                      </span>
                    )}
                  </button>

                  <NotificationDropdown isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
                </div>

                {/* Desktop User Menu - Enhanced design */}
                <div className="hidden md:flex relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 p-2 pr-4 text-slate-300 hover:text-white hover:bg-slate-700/60 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
                  >
                    <UserAvatar
                      user={user}
                      size="sm"
                      showTooltip={false}
                      getRoleColor={getRoleColor}
                      getUserRole={getUserPrimaryRole}
                    />
                
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-300 ${showUserMenu ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Enhanced dropdown menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                      {/* User info section */}
                      <div className="px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-750">
                        <div className="flex items-center space-x-4">
                          <UserAvatar
                            user={user}
                            size="lg"
                            showTooltip={false}
                            getRoleColor={getRoleColor}
                            getUserRole={getUserPrimaryRole}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-semibold text-white truncate">{getUserDisplayName()}</p>
                            <p className="text-sm text-slate-400 truncate">@{user?.username || "user"}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.emails?.[0]?.address}</p>
                          </div>
                        </div>
                        {canAccessAdmin && (
                          <div className="mt-3">
                            <span className="inline-flex items-center px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full border border-amber-500/30">
                              <Shield className="w-3 h-3 mr-1" />
                              Administrator
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Menu items */}
                      <div className="py-2">
                        <Link
                          to="/profile"
                          className="flex items-center space-x-3 px-6 py-3 text-slate-300 hover:text-white hover:bg-slate-700/60 transition-all duration-200"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User className="w-4 h-4" />
                          <span className="text-sm font-medium">View Profile</span>
                        </Link>

                        <div className="border-t border-slate-700/50 mt-2 pt-2">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-3 px-6 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                          >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm font-medium">Sign Out</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile menu button - Enhanced design */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-3 text-slate-300 hover:text-white hover:bg-slate-700/60 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </>
            ) : (
              /* Enhanced auth buttons for non-authenticated users */
              <div className="flex items-center">
                <Link
                  to="/login"
                  className="px-2 py-2.5 text-slate-300 hover:text-white font-medium rounded-xl transition-all duration-300 hover:bg-slate-700/40"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-2 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Mobile Navigation Menu */}
        {isAuthenticated && isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-700/50 bg-slate-800/95 backdrop-blur-md ">
            <div className="px-4 py-6 space-y-2 h-screen " >
              {/* Mobile user info */}
              <div className="flex items-center space-x-4 px-4 py-4 bg-slate-700/30 rounded-xl mb-4">
                <UserAvatar
                  user={user}
                  size="md"
                  showTooltip={false}
                  getRoleColor={getRoleColor}
                  getUserRole={getUserPrimaryRole}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-white truncate">{getUserDisplayName()}</p>
                  <p className="text-sm text-slate-400 truncate">@{user?.username || "user"}</p>
                  {canAccessAdmin && (
                    <span className="inline-flex items-center mt-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full">
                      Admin
                    </span>
                  )}
                </div>
              </div>

              {/* Navigation items */}
              {navigationItems.map((item) => (
                <NavLink key={item.id} item={item} onClick={() => setIsMobileMenuOpen(false)} isMobile={true} />
              ))}

              {canAccessAdmin &&
                adminNavigation.map((item) => (
                  <NavLink
                    key={item.id}
                    item={item}
                    className="text-amber-300 hover:text-amber-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                    isMobile={true}
                  />
                ))}

              {/* Mobile user actions */}
              <div className="mt-6 pt-4 border-t border-orange-300 space-y-2">
                <Link
                  to="/profile"
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-slate-300 hover:text-white hover:bg-slate-700/60 transition-all duration-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="w-5 h-5" />
                  <span>View Profile</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
