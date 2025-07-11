import React from "react";

import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, Heart, CircleDot } from "lucide-react"

export const Footer = ({ onNav }) => {
  const currentYear = new Date().getFullYear()

  // Simplified and essential links only
  const footerLinks = {
    product: [
      { name: "Features", href: "features" },
      { name: "Events", href: "events" },
      { name: "Community", href: "community" },
    ],
    company: [
      { name: "About", href: "about" },
      { name: "Contact", href: "contact" },
      { name: "Blog", href: "blog" },
    ],
    legal: [
      { name: "Privacy", href: "privacy" },
      { name: "Terms", href: "terms" },
    ],
  }

  const socialLinks = [
    { name: "Facebook", icon: Facebook, href: "https://facebook.com" },
    { name: "Twitter", icon: Twitter, href: "https://twitter.com" },
    { name: "Instagram", icon: Instagram, href: "https://instagram.com" },
    { name: "LinkedIn", icon: Linkedin, href: "https://linkedin.com" },
  ]

  // Helper to render navigation links
  const renderNavLinks = (links) =>
    links.map((link) => (
      <li key={link.name}>
        <span
          role="button"
          tabIndex={0}
          className="text-slate-400 hover:text-orange-400 transition-all duration-300 text-sm cursor-pointer select-none hover:translate-x-1 inline-block"
          onClick={() => onNav && onNav(link.href)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              onNav && onNav(link.href)
            }
          }}
        >
          {link.name}
        </span>
      </li>
    ))

  return (
    <footer className="bg-slate-800 text-white border-t border-slate-700/50">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Brand Section - Takes more space */}
          <div className="lg:col-span-6">
            {/* Logo */}
            <div className="flex items-center space-x-2 mb-6 group">
              <span className="flex items-center">
                <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-600 bg-clip-text text-transparent group-hover:from-orange-300 group-hover:to-amber-500 transition-all duration-300">
                  Community
                </span>
                <span className="flex items-center text-2xl font-bold text-white group-hover:text-orange-400 transition-colors duration-300">
                  <CircleDot className="w-6 h-6 ml-1 mr-1 text-orange-400 group-hover:text-orange-300 transition-all duration-300 group-hover:rotate-180" />
                  Hub
                </span>
              </span>
            </div>

            {/* Description */}
            <p className="text-slate-300 mb-8 max-w-md text-lg leading-relaxed">
              Building stronger communities through meaningful connections, engaging events, and collaborative spaces.
            </p>

            {/* Contact Info - Simplified */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center space-x-3 text-slate-300 hover:text-orange-400 transition-colors duration-300 group">
                <Mail className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-sm">mutinda.shadrack20@gmail.com</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-300 hover:text-orange-400 transition-colors duration-300 group">
                <Phone className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-sm">+1 (555) 123-4567</span>
              </div>
            </div>

            {/* Newsletter Signup - Integrated */}
            <div className="max-w-md">
              <h3 className="font-semibold text-white mb-3 text-lg">Stay Connected</h3>
              <p className="text-slate-400 text-sm mb-4">Get updates on new features and community events.</p>
              <div className="flex space-x-3">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-300"
                />
                <button className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl">
                  Join
                </button>
              </div>
            </div>
          </div>

          {/* Links Section - Condensed */}
      <div className="lg:col-span-6">
  {/* Changed 'grid grid-cols-1 sm:grid-cols-3 gap-8' to 'flex flex-col sm:flex-row justify-between gap-8' */}
  <div className="flex flex-row sm:flex-row justify-between gap-8">
    {/* Product Links */}
    <div>
      <h3 className="font-semibold text-white mb-6 text-lg">Product</h3>
      <ul className="space-y-0">{renderNavLinks(footerLinks.product)}</ul>
    </div>

    {/* Company Links */}
    <div>
      <h3 className="font-semibold text-white mb-6 text-lg">Company</h3>
      <ul className="space-y-0">{renderNavLinks(footerLinks.company)}</ul>
    </div>

    {/* Legal Links */}
    <div>
      <h3 className="font-semibold text-white mb-6 text-lg">Legal</h3>
      <ul className="space-y-0">{renderNavLinks(footerLinks.legal)}</ul>
    </div>
  </div>
</div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-slate-700/50 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
            {/* Copyright */}
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-slate-400">
              <div className="flex items-center space-x-2">
                <span>© {currentYear}</span>
                <span className="font-bold bg-gradient-to-r from-orange-400 to-amber-600 bg-clip-text text-transparent">
                  Community
                </span>
                <CircleDot className="w-4 h-4 text-orange-400" />
                <span className="font-bold text-white">Hub</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>Made with</span>
                <Heart className="w-4 h-4 text-red-500 animate-pulse" />
                <span>for communities worldwide</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-6">
              <span className="text-sm text-slate-400 hidden sm:block">Follow us</span>
              <div className="flex items-center space-x-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon
                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-orange-400 transition-all duration-300 transform hover:scale-110 active:scale-95 p-2 hover:bg-slate-700/50 rounded-lg"
                      aria-label={`Follow us on ${social.name}`}
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
