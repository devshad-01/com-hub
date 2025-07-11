import React from 'react';
import { Link } from "react-router-dom"
import {
  Users,
  Calendar,
  MessageCircle,
  Heart,
  Globe,
  Zap,
  Star,
  ArrowRight,
  CheckCircle,
  UserPlus,
  BellRing // Added for the "Get Updates" icon
} from "lucide-react"

export const HomePage = ({ userId }) => { // userId is passed as a prop
  const features = [
    {
      icon: Users,
      title: "Community Fellowship",
      description:
        "Stay connected with fellow believers through member profiles, prayer requests, and fellowship opportunities.",
      image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&h=300&fit=crop&crop=center",
    },
    {
      icon: Calendar,
      title: "Church Events",
      description:
        "Join worship services, Bible studies, community outreach, and special events with easy RSVP management.",
      image: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=400&h=300&fit=crop&crop=center",
    },
    {
      icon: MessageCircle,
      title: "Faith Conversations",
      description:
        "Share in real-time prayer requests, encouragement, and spiritual discussions with your church family.",
      image: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=400&h=300&fit=crop&crop=center",
    },
    {
      icon: Globe,
      title: "Discussion Forums",
      description:
        "Engage in thoughtful biblical discussions, share testimonies, and grow together in faith and understanding.",
      image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop&crop=center",
    },
  ]

  const stats = [
    { number: "150+", label: "Community Members", icon: Users },
    { number: "25+", label: "Monthly Events", icon: Calendar },
    { number: "500+", label: "Forum Discussions", icon: MessageCircle },
    { number: "2+", label: "Years Together", icon: Heart },
  ]

  const testimonials = [
    {
      name: "Pastor Michael",
      role: "Lead Pastor",
      content: "This platform has truly strengthened our community bonds. Members are more connected than ever before.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      rating: 5,
    },
    {
      name: "Sarah Thompson",
      role: "Youth Leader",
      content: "The real-time chat and event planning features make organizing youth activities so much easier!",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b9af?w=100&h=100&fit=crop&crop=face",
      rating: 5,
    },
    {
      name: "Elder James",
      role: "Church Elder",
      content:
        "It's wonderful to see our community grow closer through technology while maintaining our spiritual focus.",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      rating: 5,
    },
  ]

  return (
    <div className="min-h-screen bg-background dark:bg-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-warm-50 via-background to-warm-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900  p-5">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10 dark:opacity-10"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Hero Content */}
            <div className="text-center lg:text-left animate-fade-in">
              <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-warm-200 bg-warm-100 dark:bg-slate-800 dark:border-slate-700 rounded-full text-warm-600 dark:text-orange-400 text-xs sm:text-sm font-medium mb-4 sm:mb-6">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                Welcome to Our Community
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-warm-900 dark:text-white mb-4 sm:mb-6 leading-tight">
                Growing in
                <span className="text-orange-400 block">Faith & Fellowship</span>
                Together
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-warm-600 dark:text-slate-300 mb-6 sm:mb-8 max-w-2xl mx-auto lg:mx-0">
                Connect with fellow believers, participate in community events, engage in meaningful discussions, and
                grow together in our shared journey of faith and fellowship.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                {/* Conditional Rendering based on userId */}
                {userId ? ( // If userId exists (user is logged in)
                  <Link
                    to="/forum" // Or wherever forum notification settings are
                    className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-warm hover:shadow-warm-lg group text-sm sm:text-base"
                  >
                    <BellRing className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Get Updates on Forums
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : ( // If userId does not exist (user is not logged in)
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-warm hover:shadow-warm-lg group text-sm sm:text-base"
                  >
                    Join Our Community
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}

                <Link
                  to="/events"
                  className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 border-2 border-warm-500 dark:border-orange-500 text-warm-500 dark:text-orange-400 hover:bg-warm-50 dark:hover:bg-slate-800 font-semibold rounded-lg transition-all duration-200 group text-sm sm:text-base"
                >
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="hidden sm:inline">View Upcoming Events</span>
                  <span className="sm:hidden">View Events</span>
                </Link>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative animate-slide-up mt-8 lg:mt-0">
              <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 transform rotate-1 hover:rotate-0 transition-transform duration-300">
                <img
                  src="https://images.unsplash.com/photo-1438032005730-c779502df39b?w=600&h=400&fit=crop&crop=center"
                  alt="Community worship and fellowship"
                  className="w-full h-48 sm:h-56 lg:h-64 xl:h-80 object-cover rounded-lg"
                />
                <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 bg-orange-500 dark:bg-orange-500 text-white p-2 sm:p-3 rounded-full shadow-lg">
                  <Heart className="w-4 h-4 sm:w-6 sm:h-6" />
                </div>
              </div>

              {/* Floating Cards */}
              <div className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl shadow-lg border border-warm-200 dark:border-slate-700 hidden sm:block">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-warm-900 dark:text-white">15 New Members</p>
                    <p className="text-xs text-warm-500 dark:text-slate-400">This month</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-warm-50 dark:bg-slate-800 border-y border-warm-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="text-center animate-fade-in">
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-warm-500 dark:bg-orange-500 text-white rounded-lg mb-3 sm:mb-4">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-warm-900 dark:text-white mb-1">{stat.number}</div>
                  <div className="text-warm-600 dark:text-slate-300 text-xs sm:text-sm">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Recent Activity Section */}
      <section className="py-12 sm:py-16 bg-background dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-warm-900 dark:text-white mb-3 sm:mb-4">
              What's Happening in Our Community
            </h2>
            <p className="text-warm-600 dark:text-slate-300 max-w-2xl mx-auto text-sm sm:text-base">
              Stay updated with the latest news, events, and prayer requests from our church family.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Recent Event */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-lg border border-warm-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3 sm:mr-4">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-warm-900 dark:text-white text-sm sm:text-base">Upcoming Event</h3>
                  <p className="text-xs sm:text-sm text-warm-500 dark:text-slate-400">This Sunday</p>
                </div>
              </div>
              <p className="text-warm-700 dark:text-slate-300 mb-4 text-sm sm:text-base">
                Join us for our monthly community potluck after Sunday service. Bring a dish to share!
              </p>
              <Link
                to="/events"
                className="text-warm-500 dark:text-orange-400 hover:text-warm-600 dark:hover:text-orange-300 font-medium text-xs sm:text-sm"
              >
                View all events →
              </Link>
            </div>

            {/* Prayer Request */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-lg border border-warm-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mr-3 sm:mr-4">
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-warm-900 dark:text-white text-sm sm:text-base">Prayer Requests</h3>
                  <p className="text-xs sm:text-sm text-warm-500 dark:text-slate-400">Community Care</p>
                </div>
              </div>
              <p className="text-warm-700 dark:text-slate-300 mb-4 text-sm sm:text-base">
                Please pray for the Johnson family during this difficult time. Your prayers and support mean everything.
              </p>
              <Link
                to="/forum"
                className="text-warm-500 dark:text-orange-400 hover:text-warm-600 dark:hover:text-orange-300 font-medium text-xs sm:text-sm"
              >
                Share prayer requests →
              </Link>
            </div>

            {/* Latest Discussion */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-lg border border-warm-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-3 sm:mr-4">
                  <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-warm-900 dark:text-white text-sm sm:text-base">Bible Study</h3>
                  <p className="text-xs sm:text-sm text-warm-500 dark:text-slate-400">Latest Discussion</p>
                </div>
              </div>
              <p className="text-warm-700 dark:text-slate-300 mb-4 text-sm sm:text-base">
                Join the discussion on this week's sermon about faith and perseverance. Share your insights!
              </p>
              <Link
                to="/forum"
                className="text-warm-500 dark:text-orange-400 hover:text-warm-600 dark:hover:text-orange-300 font-medium text-xs sm:text-sm"
              >
                Join discussion →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-background via-warm-25 to-orange-25 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          {/* Floating particles */}
          <div className="absolute top-20 left-10 w-2 h-2 bg-orange-400 rounded-full animate-bounce opacity-60" style={{animationDelay: '0s', animationDuration: '3s'}}></div>
          <div className="absolute top-40 right-20 w-3 h-3 bg-warm-500 rounded-full animate-bounce opacity-40" style={{animationDelay: '1s', animationDuration: '4s'}}></div>
          <div className="absolute bottom-32 left-1/4 w-2 h-2 bg-orange-300 rounded-full animate-bounce opacity-50" style={{animationDelay: '2s', animationDuration: '3.5s'}}></div>
          <div className="absolute top-60 right-1/3 w-4 h-4 bg-warm-400 rounded-full animate-bounce opacity-30" style={{animationDelay: '0.5s', animationDuration: '5s'}}></div>
          
          {/* Moving gradient orbs */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-orange-300 to-warm-400 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-20 animate-pulse" style={{animationDuration: '4s'}}></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-l from-warm-300 to-orange-400 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-25 animate-pulse" style={{animationDelay: '2s', animationDuration: '5s'}}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 rounded-full text-sm font-medium mb-6 animate-pulse">
              <Zap className="w-4 h-4 mr-2 animate-spin" style={{animationDuration: '3s'}} />
              Powerful Community Features
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-warm-900 dark:text-white mb-3 sm:mb-4">
              Everything We Need to Stay 
              <span className="text-transparent bg-gradient-to-r from-orange-500 via-warm-500 to-orange-600 bg-clip-text block sm:inline sm:ml-2 animate-pulse">
                Connected
              </span>
            </h2>
            <p className="text-base sm:text-lg text-warm-600 dark:text-slate-300 max-w-3xl mx-auto">
              From worship services to fellowship events, our platform provides all the tools our community needs to
              grow together in faith and friendship.
            </p>
          </div>

          {/* Animated Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              const delay = index * 0.2
              
              return (
                <div 
                  key={index} 
                  className="group relative"
                  style={{animationDelay: `${delay}s`}}
                >
                  {/* Animated Card Container */}
                  <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-700 overflow-hidden border border-warm-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600 transform hover:-translate-y-2 animate-fade-in">
                    
                    {/* Animated Image Section */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={feature.image || "/placeholder.svg"}
                        alt={feature.title}
                        className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-125 group-hover:rotate-2"
                        loading="lazy" // Added lazy loading
                      />
                      
                      {/* Animated Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      {/* Floating Icon with Rotation */}
                      <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-orange-600 dark:text-orange-400 p-3 rounded-full shadow-lg transform transition-all duration-700 group-hover:rotate-12 group-hover:scale-110">
                        <Icon className="w-5 h-5" />
                      </div>
                      
                      {/* Animated Number Badge */}
                      <div className="absolute bottom-4 left-4 bg-orange-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-lg transform transition-all duration-500 group-hover:rotate-180 group-hover:scale-125">
                        {index + 1}
                      </div>
                      
                      {/* Moving Highlight */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                    </div>
                    
                    {/* Content Section with Sliding Animation */}
                    <div className="p-6 relative">
                      {/* Animated Title */}
                      <h3 className="text-xl font-bold text-warm-900 dark:text-white mb-3 transform transition-all duration-300 group-hover:translate-x-2">
                        {feature.title}
                      </h3>
                      
                      {/* Description with Fade-in */}
                      <p className="text-warm-600 dark:text-slate-300 mb-4 text-sm leading-relaxed transform transition-all duration-500 opacity-80 group-hover:opacity-100 group-hover:translate-x-1">
                        {feature.description}
                      </p>
                      
                      {/* Animated CTA Button */}
                      <Link
                        to="/forum"
                        className="inline-flex items-center text-orange-400 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-semibold group/btn transition-all duration-300 transform hover:translate-x-2"
                      >
                        <span className="relative">
                          Explore
                          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-400 transition-all duration-300 group-hover/btn:w-full"></span>
                        </span>
                        <ArrowRight className="w-4 h-4 ml-2 transform transition-all duration-300 group-hover/btn:translate-x-1 group-hover/btn:scale-110" />
                      </Link>
                      
                      {/* Floating dots animation */}
                      <div className="absolute -top-2 -right-2 w-4 h-4 bg-orange-400 rounded-full opacity-0 group-hover:opacity-60 transform scale-0 group-hover:scale-100 transition-all duration-700 animate-ping"></div>
                      <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-warm-500 rounded-full opacity-0 group-hover:opacity-40 transform scale-0 group-hover:scale-100 transition-all duration-500" style={{transitionDelay: '200ms'}}></div>
                    </div>
                    
                    {/* Ripple effect on hover */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500/0 via-orange-500/10 to-orange-500/0 opacity-0 group-hover:opacity-100 transform scale-0 group-hover:scale-100 transition-all duration-700 pointer-events-none"></div>
                  </div>
                  
                  {/* Orbiting particles around card */}
                  <div className="absolute -top-1 -left-1 w-2 h-2 bg-orange-400 rounded-full opacity-0 group-hover:opacity-60 transform rotate-0 group-hover:rotate-180 transition-all duration-1000 origin-[100px_100px]"></div>
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-warm-500 rounded-full opacity-0 group-hover:opacity-40 transform rotate-0 group-hover:rotate-180 transition-all duration-1200 origin-[-100px_-100px]"></div>
                </div>
              )
            })}
          </div>
          
          {/* Animated Call to Action */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center px-8 py-6 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-warm-200 dark:border-slate-700 hover:shadow-2xl transition-all duration-500 group transform hover:scale-105">
              
              {/* Animated Avatar Stack */}
              <div className="flex -space-x-3 mr-6">
                {[
                  { bg: 'from-orange-500 to-warm-600', letter: 'J', delay: '0ms' },
                  { bg: 'from-blue-500 to-purple-600', letter: 'M', delay: '100ms' },
                  { bg: 'from-green-500 to-teal-600', letter: 'S', delay: '200ms' },
                  { bg: 'from-purple-500 to-pink-600', letter: '+50', delay: '300ms' }
                ].map((avatar, i) => (
                  <div 
                    key={i}
                    className={`w-12 h-12 bg-gradient-to-br ${avatar.bg} rounded-full border-3 border-white dark:border-slate-800 flex items-center justify-center text-white font-bold text-sm transform transition-all duration-700 hover:scale-125 hover:rotate-12 hover:z-10 relative group-hover:animate-bounce`}
                    style={{animationDelay: avatar.delay, animationDuration: '1s'}}
                  >
                    {avatar.letter}
                  </div>
                ))}
              </div>
              
              {/* Text with typing effect */}
              <div className="text-left">
                <p className="text-warm-900 dark:text-white font-bold text-lg transform transition-all duration-300 group-hover:translate-x-2">
                  Join 150+ active members
                </p>
                <p className="text-warm-600 dark:text-slate-300 transform transition-all duration-500 group-hover:translate-x-1">
                  Already using these features
                </p>
              </div>
              
              {/* Pulse ring */}
              <div className="absolute inset-0 rounded-3xl border-2 border-orange-400 opacity-0 group-hover:opacity-60 transform scale-100 group-hover:scale-110 transition-all duration-700 animate-pulse"></div>
            </div>
            
            {/* Floating connect lines */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="w-96 h-96 border border-orange-300/20 rounded-full animate-spin opacity-30" style={{animationDuration: '20s'}}></div>
              <div className="absolute inset-8 border border-warm-400/20 rounded-full animate-spin opacity-40" style={{animationDuration: '15s', animationDirection: 'reverse'}}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-warm-50 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-warm-900 dark:text-white mb-3 sm:mb-4">
              Voices from Our Community
            </h2>
            <p className="text-base sm:text-lg text-warm-600 dark:text-slate-300 max-w-2xl mx-auto">
              Hear from fellow members about how our community platform has strengthened their faith journey and
              connections with others.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-warm-200 dark:border-slate-700 animate-fade-in"
              >
                <div className="flex items-center mb-3 sm:mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-warm-700 dark:text-slate-300 mb-4 sm:mb-6 italic text-sm sm:text-base">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center">
                  <img
                    src={testimonial.avatar || "/placeholder.svg"}
                    alt={testimonial.name}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover mr-3 sm:mr-4"
                  />
                  <div>
                    <div className="font-semibold text-warm-900 dark:text-white text-sm sm:text-base">
                      {testimonial.name}
                    </div>
                    <div className="text-xs sm:text-sm text-warm-500 dark:text-slate-400">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-slate-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
            Ready to Join Our Community?
          </h2>
          <p className="text-lg sm:text-xl text-orange-100 dark:text-orange-100 mb-6 sm:mb-8">
            Become part of our growing faith community and connect with fellow believers.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            {userId ? ( // If userId exists (user is logged in)
              <Link
                to="/forum" // Or wherever forum notification settings are
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-white text-warm-600 dark:text-orange-600 hover:bg-warm-50 dark:hover:bg-orange-50 font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl group text-sm sm:text-base"
              >
                <BellRing className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Get Updates on Forums
              </Link>
            ) : ( // If userId does not exist (user is not logged in)
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-white text-warm-600 dark:text-orange-600 hover:bg-warm-50 dark:hover:bg-orange-50 font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl group text-sm sm:text-base"
              >
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Join Our Community
              </Link>
            )}

            <Link
              to="/events"
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 border-2 border-white text-white hover:bg-white hover:text-warm-600 dark:hover:text-orange-600 font-semibold rounded-lg transition-all duration-200 group text-sm sm:text-base"
            >
              View Events
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}