"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { User, LogOut } from "lucide-react";
import { useToggle } from '../contexts/toggle';
import ToggleButton from './toggle-button';

interface NavItem {
  name: string;
  href: string;
}

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isToggled } = useToggle();
  const [isScrolled, setIsScrolled] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Track scroll position
useEffect(() => {
  console.log('useEffect called');
  const handleScroll = () => {
    setIsScrolled(window.scrollY > 10);
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

  const getInitials = (email?: string | null, name?: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.split("@")[0].slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const getProfileImageUrl = (imageUrl?: string | null) => {
    if (!imageUrl) return "/default-avatar.png";

    if (imageUrl.includes("googleusercontent.com")) {
      return `https://images.weserv.nl/?url=${encodeURIComponent(
        imageUrl
      )}&w=40&h=40`;
    }

    return imageUrl;
  };

  const getDisplayName = (email?: string | null, name?: string | null) => {
    if (name) return name;
    return email?.split("@")[0] || "User";
  };

  // Authenticated navigation items
  const authNavigation: NavItem[] = [
    { name: "Home", href: "/home" },
    { name: "Create", href: "/create" },
    { name: "My Designs", href: "/designs" },
    { name: "My Channels", href: "/channels" },
   
  ];

  const filteredNavItems = authNavigation.filter(
    (item) => item.href !== pathname
  );

  const landingPageNavigation: NavItem[] = [
    { name: "Pricing", href: "#pricing" },
    { name: "Features", href: "#features" },
  ];

  // Combine navigation items based on session
  const navigation = session ? [...filteredNavItems] : landingPageNavigation;

  const homeRoute = session ? "/home" : "/";

  // Loading state
  const isLoading = status === "loading";

  return (
<header className={`flex items-center justify-between whitespace-nowrap px-10 py-4 sticky top-0 z-50 transition-all duration-300 ${
  isScrolled 
    ? isToggled 
      ? 'bg-gray-900/10 border-b border-gray-700 text-white backdrop-blur-md shadow-lg' 
      : 'bg-white/10 border-b border-slate-200 text-slate-900 backdrop-blur-md shadow-lg'
    : isToggled
      ? 'bg-transparent border-transparent text-white'
      : 'bg-transparent border-transparent text-slate-900'
}`}>
      {/* Logo Section */}
      <Link
        href={homeRoute}
        className={`flex items-center gap-4 hover:opacity-80 transition-opacity ${
          isToggled ? 'text-white' : 'text-slate-900'
        }`}
      >
        <svg
          className={`h-8 w-8 ${
            isToggled ? 'text-blue-400' : 'text-[var(--primary-color)]'
          }`}
          fill="none"
          viewBox="0 0 48 48"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z"
            fill="currentColor"
          />
        </svg>
        <h2 className={`text-xl font-bold leading-tight tracking-[-0.015em] transition-colors duration-300 ${
          isToggled ? 'text-white' : 'text-slate-900'
        }`}>
          ThumbGen
        </h2>
      </Link>

      {/* Navigation and Actions */}
      <div className="flex items-center gap-8">
        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {/* Dynamic Navigation Items (for authenticated users) */}
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`text-sm font-medium leading-normal transition-colors ${
                pathname === item.href
                  ? isToggled 
                    ? "text-blue-400 font-semibold" 
                    : "text-slate-900 font-semibold"
                  : isToggled
                    ? "text-gray-300 hover:text-white"
                    : "text-black hover:text-gray-500"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Auth Buttons and Toggle */}
        <div className="flex items-center gap-4">
          {/* Toggle Button - Always visible */}
          <ToggleButton />
          
          {isLoading ? (
            // Loading state
            <div className="flex items-center justify-center h-10 px-5">
              <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${
                isToggled ? 'border-gray-600' : 'border-slate-300'
              }`} />
            </div>
          ) : session ? (
            // Authenticated state with Profile Dropdown
            <div className="relative" ref={dropdownRef}>
              {/* Profile Picture Button */}
              <button
                type="button"
                className={`flex items-center justify-center w-10 h-10 rounded-full overflow-hidden transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isToggled
                    ? 'bg-gray-700 hover:ring-gray-500 hover:ring-offset-gray-900 focus:ring-gray-500 focus:ring-offset-gray-900'
                    : 'bg-slate-300 hover:ring-slate-400 hover:ring-offset-white focus:ring-slate-400 focus:ring-offset-white'
                }`}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <img
                  src={getProfileImageUrl(session.user?.image)}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error("Image failed to load:", session.user?.image);
                    const target = e.target as HTMLImageElement;
                    // target.src = '/default-avatar.png';
                  }}
                  onLoad={() => {
                    console.log(
                      "Image loaded successfully:",
                      session.user?.image
                    );
                  }}
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className={`absolute right-0 mt-2 w-80 rounded-lg shadow-lg border py-2 z-50 transition-colors duration-300 ${
                  isToggled
                    ? 'bg-gray-800 border-gray-600'
                    : 'bg-white border-slate-200'
                }`}>
                  {/* User Info Section */}
                  <div className={`px-4 py-3 border-b ${
                    isToggled ? 'border-gray-600' : 'border-slate-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full overflow-hidden ${
                        isToggled ? 'bg-gray-600' : 'bg-slate-600'
                      }`}>
                        <img
                          src={session.user?.image || "/default-avatar.png"}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to initials if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            target.nextElementSibling!.classList.remove(
                              "hidden"
                            );
                          }}
                        />
                        <span className="hidden text-white font-semibold text-xs">
                          {getInitials(session.user?.email, session.user?.name)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate transition-colors duration-300 ${
                          isToggled ? 'text-white' : 'text-slate-900'
                        }`}>
                          {getDisplayName(
                            session.user?.email,
                            session.user?.name
                          )}
                        </p>
                        <p className={`text-xs truncate transition-colors duration-300 ${
                          isToggled ? 'text-gray-400' : 'text-slate-500'
                        }`}>
                          {session.user?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      type="button"
                      className={`flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors ${
                        isToggled
                          ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                      onClick={() => {
                        setIsDropdownOpen(false);
                        // Add your profile/account settings logic here
                        console.log("Navigate to profile");
                      }}
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </button>

                    <button
                      type="button"
                      className={`flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 transition-colors ${
                        isToggled
                          ? 'hover:bg-red-900/30'
                          : 'hover:bg-red-50'
                      }`}
                      onClick={() => {
                        setIsDropdownOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Unauthenticated state
            <button
              type="button"
              className={`flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-5 text-sm font-bold leading-normal tracking-[0.015em] transition-all shadow-sm hover:shadow-md ${
                isToggled
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-[var(--primary-color)] hover:bg-blue-600 text-slate-50'
              }`}
              onClick={() => signIn("google", { callbackUrl: "/home" })}
            >
              <span className="truncate">Start Creating</span>
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className={`md:hidden p-2 rounded-lg transition-colors ${
            isToggled
              ? 'text-gray-300 hover:text-white hover:bg-gray-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          aria-label="Open menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}